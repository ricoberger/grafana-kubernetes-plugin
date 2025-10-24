package plugin

import (
	"context"
	"net/http"
	"time"

	"github.com/ricoberger/grafana-kubernetes-plugin/pkg/grafana"
	"github.com/ricoberger/grafana-kubernetes-plugin/pkg/kubernetes"
	"github.com/ricoberger/grafana-kubernetes-plugin/pkg/models"

	"github.com/google/uuid"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter"
	"github.com/grafana/grafana-plugin-sdk-go/backend/tracing"
	"go.opentelemetry.io/otel/codes"
)

// Make sure Datasource implements required interfaces. This is important to do
// since otherwise we will only get a not implemented error response from plugin
// in runtime. In this example datasource instance implements
// backend.QueryDataHandler, backend.CheckHealthHandler interfaces. Plugin
// should not implement all these interfaces - only those which are required for
// a particular task.
var (
	_ backend.CheckHealthHandler    = (*Datasource)(nil)
	_ backend.QueryDataHandler      = (*Datasource)(nil)
	_ backend.CallResourceHandler   = (*Datasource)(nil)
	_ instancemgmt.InstanceDisposer = (*Datasource)(nil)
)

// NewDatasource creates a new datasource instance.
func NewDatasource(ctx context.Context, pCtx backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	// Create a random instance id for better visibility when the Kubernetes
	// server is stopped / started when a new data source instance is created.
	// The instance id is then added as field to our logger in addition to the
	// data source details (name, id and uid).
	instanceId, err := uuid.NewV7()
	if err != nil {
		return "", err
	}

	logger := backend.Logger.With("datasource", pCtx.Name).With("datasourceId", pCtx.ID).With("datasourceUid", pCtx.UID).With("instanceId", instanceId.String())
	logger.Debug("Creating new datasource instance")

	// Load the data source configuration and create the Grafana and Kubernetes
	// clients.
	config, err := models.LoadPluginSettings(pCtx)
	if err != nil {
		logger.Error("Failed to load plugin settings", "error", err.Error())
		return nil, err
	}

	grafanaClient, err := grafana.NewClient(ctx, config.ImpersonateUser, config.ImpersonateGroups, config.GrafanaUsername, config.Secrets.GrafanaPassword)
	if err != nil {
		logger.Error("Failed to create Grafana client", "error", err.Error())
		return nil, err
	}

	kubeClient, err := kubernetes.NewClient(ctx, config, logger)
	if err != nil {
		logger.Error("Failed to create Kubernets client", "error", err.Error())
		return nil, err
	}

	// If the generate Kubeconfig feature is enabled, we create a new Kubernetes
	// server on the configured port. Afterwards we start the Kubernetes server
	// in a new Go routine. If the server could not be started, which might
	// happen when the server is still running from an old data source instance,
	// because "Dispose" for the old instance is called after "NewDatasource"
	// for the new instance, we try to start the server until no error is
	// thrown.
	var kubeServer kubernetes.Server

	if config.GenerateKubeconfig {
		kubeServer, err = kubernetes.NewServer(config.GenerateKubeconfigPort, kubeClient, grafanaClient, logger)
		if err != nil {
			logger.Error("Failed to create Kubernets server", "error", err.Error())
			return nil, err
		}

		go func() {
			for {
				if err := kubeServer.Start(); err != nil {
					logger.Debug("Failed to start Kubernets server", "error", err.Error())
					time.Sleep(1 * time.Second)
					continue
				}

				break
			}
		}()
	}

	ds := &Datasource{
		generateKubeconfig:     config.GenerateKubeconfig,
		generateKubeconfigName: config.GenerateKubeconfigName,
		generateKubeconfigTTL:  config.GenerateKubeconfigTTL,
		grafanaClient:          grafanaClient,
		kubeClient:             kubeClient,
		kubeServer:             kubeServer,
		logger:                 logger,
	}

	queryTypeMux := datasource.NewQueryTypeMux()
	queryTypeMux.HandleFunc(models.QueryTypeKubernetesResourceIds, ds.handleKubernetesResourceIdsQueries)
	queryTypeMux.HandleFunc(models.QueryTypeKubernetesNamespaces, ds.handleKubernetesNamespacesQueries)
	queryTypeMux.HandleFunc(models.QueryTypeKubernetesResources, ds.handleKubernetesResourcesQueries)
	queryTypeMux.HandleFunc(models.QueryTypeKubernetesContainers, ds.handleKubernetesContainersQueries)
	queryTypeMux.HandleFunc(models.QueryTypeKubernetesLogs, ds.handleKubernetesLogsQueries)
	queryTypeMux.HandleFunc(models.QueryTypeHelmReleases, ds.handleHelmReleasesQueries)
	queryTypeMux.HandleFunc(models.QueryTypeHelmReleaseHistory, ds.handleHelmReleaseHistoryQueries)
	queryTypeMux.HandleFunc(models.QueryTypeFluxResources, ds.handleKubernetesResourcesQueries)
	ds.queryHandler = queryTypeMux

	mux := http.NewServeMux()
	mux.HandleFunc("/kubernetes/kubeconfig", ds.handleKubernetesKubeconfig)
	mux.HandleFunc("/kubernetes/resource/{id}", ds.handleKubernetesResource)
	mux.HandleFunc("/kubernetes/proxy/{pathname...}", ds.handleKubernetesProxy)
	mux.HandleFunc("/helm/{namespace}/{name}/{version}", ds.handleHelmGetRelease)
	mux.HandleFunc("/helm/{namespace}/{name}/{version}/rollback", ds.handleHelmRollback)
	mux.HandleFunc("/helm/{namespace}/{name}/{version}/uninstall", ds.handleHelmUninstall)
	ds.resourceHandler = httpadapter.New(mux)

	return ds, nil
}

// Datasource is an example datasource which can respond to data queries,
// reports its health and has streaming skills.
type Datasource struct {
	generateKubeconfig     bool
	generateKubeconfigName string
	generateKubeconfigTTL  int64
	queryHandler           backend.QueryDataHandler
	resourceHandler        backend.CallResourceHandler
	grafanaClient          grafana.Client
	kubeClient             kubernetes.Client
	kubeServer             kubernetes.Server
	logger                 log.Logger
}

// CheckHealth handles health checks sent from Grafana to the plugin. The main
// use case for these health checks is the test button on the datasource
// configuration page which allows users to verify that a datasource is working
// as expected.
func (d *Datasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	ctx, span := tracing.DefaultTracer().Start(ctx, "CheckHealth")
	defer span.End()

	err := d.kubeClient.CheckHealth(ctx)
	if err != nil {
		d.logger.Error("Data source is not working, failed to get namespaces", "error", err)
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: "Data source is not working: " + err.Error(),
		}, nil
	}

	d.logger.Debug("Data source is working")

	return &backend.CheckHealthResult{
		Status:  backend.HealthStatusOk,
		Message: "Data source is working.",
	}, nil
}

// QueryData handles multiple queries and returns multiple responses. The
// queries are matched by their QueryType field against a handler function. See
// the NewDatasource function where the query type multiplexer is created and
// handlers are registered.
func (d *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	ctx, span := tracing.DefaultTracer().Start(ctx, "QueryData")
	defer span.End()

	return d.queryHandler.QueryData(ctx, req)
}

// CallResource handles resource calls. The handlers are matched by their path
// agains a handler function. See the NewDatasource function where the handler
// multiplexer is created and handlers are registered.
func (d *Datasource) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	ctx, span := tracing.DefaultTracer().Start(ctx, "CallResource")
	defer span.End()

	return d.resourceHandler.CallResource(ctx, req, sender)
}

// Dispose here tells plugin SDK that plugin wants to clean up resources when a
// new instance created. As soon as datasource settings change detected by SDK
// old datasource instance will be disposed and a new one will be created using
// NewSampleDatasource factory function.
func (d *Datasource) Dispose() {
	d.logger.Debug("Dispose datasource instance")

	// If the generate Kubeconfig feature is enabled and a new Kubernetes server
	// was created, we stop the server when the data source instance is
	// disposed.
	if d.kubeServer != nil {
		if err := d.kubeServer.Stop(); err != nil {
			d.logger.Error("Failed to stop Kubernetes server", "error", err.Error())
		}
	}
}
