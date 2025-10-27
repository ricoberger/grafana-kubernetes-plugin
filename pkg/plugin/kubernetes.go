package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/ricoberger/grafana-kubernetes-plugin/pkg/models"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/tracing"
	"github.com/grafana/grafana-plugin-sdk-go/experimental/concurrent"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	clientauthenticationv1 "k8s.io/client-go/pkg/apis/clientauthentication/v1"
	clientcmdapiv1 "k8s.io/client-go/tools/clientcmd/api/v1"
)

// handleKubernetesResourceIdsQueries handles the requests to get all resource
// ids. It uses the concurrent package to handle multiple queries in parallel.
func (d *Datasource) handleKubernetesResourceIdsQueries(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	ctx, span := tracing.DefaultTracer().Start(ctx, "handleKubernetesResourceIdsQueries")
	defer span.End()

	return concurrent.QueryData(ctx, req, d.handleKubernetesResourceIds, 10)
}

func (d *Datasource) handleKubernetesResourceIds(ctx context.Context, query concurrent.Query) backend.DataResponse {
	ctx, span := tracing.DefaultTracer().Start(ctx, "handleKubernetesResourceIds")
	defer span.End()

	frame, err := d.kubeClient.GetResourceIds(ctx)
	if err != nil {
		d.logger.Error("Failed to get resource ids", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	var response backend.DataResponse
	response.Frames = append(response.Frames, frame)

	return response
}

// handleKubernetesNamespacesQueries handles the requests to get all namespaces.
// It uses the concurrent package to handle multiple queries in parallel.
func (d *Datasource) handleKubernetesNamespacesQueries(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	ctx, span := tracing.DefaultTracer().Start(ctx, "handleKubernetesNamespacesQueries")
	defer span.End()

	return concurrent.QueryData(ctx, req, d.handleKubernetesNamespaces, 10)
}

func (d *Datasource) handleKubernetesNamespaces(ctx context.Context, query concurrent.Query) backend.DataResponse {
	ctx, span := tracing.DefaultTracer().Start(ctx, "handleKubernetesNamespaces")
	defer span.End()

	frame, err := d.kubeClient.GetNamespaces(ctx)
	if err != nil {
		d.logger.Error("Failed to get namespaces", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	var response backend.DataResponse
	response.Frames = append(response.Frames, frame)

	return response
}

// handleKubernetesResourcesQueries handles the requests to get all resources. It uses the
// concurrent package to handle multiple queries in parallel.
func (d *Datasource) handleKubernetesResourcesQueries(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	ctx, span := tracing.DefaultTracer().Start(ctx, "handleKubernetesResourcesQueries")
	defer span.End()

	return concurrent.QueryData(ctx, req, d.handleKubernetesResources, 10)
}

func (d *Datasource) handleKubernetesResources(ctx context.Context, query concurrent.Query) backend.DataResponse {
	ctx, span := tracing.DefaultTracer().Start(ctx, "handleKubernetesResources")
	defer span.End()

	user, err := d.grafanaClient.GetImpersonateUser(ctx, query.Headers)
	if err != nil {
		d.logger.Error("Failed to get user", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	groups, err := d.grafanaClient.GetImpersonateGroups(ctx, query.Headers)
	if err != nil {
		d.logger.Error("Failed to get groups", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	var qm models.QueryModelKubernetesResources
	err = json.Unmarshal(query.DataQuery.JSON, &qm)
	if err != nil {
		d.logger.Error("Failed to unmarshal query model", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	d.logger.Info("handleKubernetesResources query", "user", user, "groups", groups, "resource", qm.Resource, "namespace", qm.Namespace, "parameterName", qm.ParameterName, "parameterValue", qm.ParameterValue, "wide", qm.Wide)
	span.SetAttributes(attribute.Key("user").String(user))
	span.SetAttributes(attribute.Key("groups").StringSlice(groups))
	span.SetAttributes(attribute.Key("resource").String(qm.Resource))
	span.SetAttributes(attribute.Key("namespace").String(qm.Namespace))
	span.SetAttributes(attribute.Key("parameterName").String(qm.ParameterName))
	span.SetAttributes(attribute.Key("parameterValue").String(qm.ParameterValue))
	span.SetAttributes(attribute.Key("wide").Bool(qm.Wide))

	frame, err := d.kubeClient.GetResources(ctx, user, groups, qm.Resource, qm.Namespace, qm.ParameterName, qm.ParameterValue, qm.Wide)
	if err != nil {
		d.logger.Error("Failed to get resources", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	var response backend.DataResponse
	response.Frames = append(response.Frames, frame)

	return response
}

// handleKubernetesContainersQueries handles the requests to get all containers for a
// resource. It uses the concurrent package to handle multiple queries in
// parallel.
func (d *Datasource) handleKubernetesContainersQueries(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	ctx, span := tracing.DefaultTracer().Start(ctx, "handleKubernetesContainersQueries")
	defer span.End()

	return concurrent.QueryData(ctx, req, d.handleKubernetesContainers, 10)
}

func (d *Datasource) handleKubernetesContainers(ctx context.Context, query concurrent.Query) backend.DataResponse {
	ctx, span := tracing.DefaultTracer().Start(ctx, "handleKubernetesContainers")
	defer span.End()

	user, err := d.grafanaClient.GetImpersonateUser(ctx, query.Headers)
	if err != nil {
		d.logger.Error("Failed to get user", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	groups, err := d.grafanaClient.GetImpersonateGroups(ctx, query.Headers)
	if err != nil {
		d.logger.Error("Failed to get groups", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	var qm models.QueryModelKubernetesContainers
	err = json.Unmarshal(query.DataQuery.JSON, &qm)
	if err != nil {
		d.logger.Error("Failed to unmarshal query model", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	d.logger.Info("handleKubernetesContainers query", "user", user, "groups", groups, "resource", qm.Resource, "namespace", qm.Namespace, "name", qm.Name)
	span.SetAttributes(attribute.Key("user").String(user))
	span.SetAttributes(attribute.Key("groups").StringSlice(groups))
	span.SetAttributes(attribute.Key("resource").String(qm.Resource))
	span.SetAttributes(attribute.Key("namespace").String(qm.Namespace))
	span.SetAttributes(attribute.Key("name").String(qm.Name))

	frame, err := d.kubeClient.GetContainers(ctx, user, groups, qm.Resource, qm.Namespace, qm.Name)
	if err != nil {
		d.logger.Error("Failed to get containers", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	var response backend.DataResponse
	response.Frames = append(response.Frames, frame)

	return response
}

// handleKubernetesLogsQueries handles the requests to get the logs for a resource. It
// uses the concurrent package to handle multiple queries in parallel.
func (d *Datasource) handleKubernetesLogsQueries(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	ctx, span := tracing.DefaultTracer().Start(ctx, "handleKubernetesLogsQueries")
	defer span.End()

	return concurrent.QueryData(ctx, req, d.handleKubernetesLogs, 10)
}

func (d *Datasource) handleKubernetesLogs(ctx context.Context, query concurrent.Query) backend.DataResponse {
	ctx, span := tracing.DefaultTracer().Start(ctx, "handleKubernetesLogs")
	defer span.End()

	user, err := d.grafanaClient.GetImpersonateUser(ctx, query.Headers)
	if err != nil {
		d.logger.Error("Failed to get user", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	groups, err := d.grafanaClient.GetImpersonateGroups(ctx, query.Headers)
	if err != nil {
		d.logger.Error("Failed to get groups", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	var qm models.QueryModelKubernetesLogs
	err = json.Unmarshal(query.DataQuery.JSON, &qm)
	if err != nil {
		d.logger.Error("Failed to unmarshal query model", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	d.logger.Info("handleKubernetesLogs query", "user", user, "groups", groups, "resource", qm.Resource, "namespace", qm.Namespace, "name", qm.Name, "container", qm.Container, "filter", qm.Filter)
	span.SetAttributes(attribute.Key("user").String(user))
	span.SetAttributes(attribute.Key("groups").StringSlice(groups))
	span.SetAttributes(attribute.Key("resource").String(qm.Resource))
	span.SetAttributes(attribute.Key("namespace").String(qm.Namespace))
	span.SetAttributes(attribute.Key("name").String(qm.Name))
	span.SetAttributes(attribute.Key("container").String(qm.Container))
	span.SetAttributes(attribute.Key("filter").String(qm.Filter))

	frame, err := d.kubeClient.GetLogs(ctx, user, groups, qm.Resource, qm.Namespace, qm.Name, qm.Container, qm.Filter, query.DataQuery.TimeRange)
	if err != nil {
		d.logger.Error("Failed to get logs", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	var response backend.DataResponse
	response.Frames = append(response.Frames, frame)

	return response
}

// handleKubernetesKubeconfig handles the generation if a kubeconfig, which can
// be used by a user to interact with the Kubernetes cluster via kubectl by
// utilizing the handleKubernetesProxy handler.
func (d *Datasource) handleKubernetesKubeconfig(w http.ResponseWriter, r *http.Request) {
	ctx, span := tracing.DefaultTracer().Start(r.Context(), "handleKubernetesKubeconfig")
	defer span.End()

	if !d.generateKubeconfig {
		http.Error(w, "kubeconfig generation is disabled", http.StatusForbidden)
		return
	}

	// Get the user which makes the request. The "GetImpersonateUser" function
	// only returns a user when the impersonate user feature is enabled. So that
	// we have to set a user name when an empty string is returned.
	//
	// This allows us to have the generate kubeconfig feature enabled, without
	// the impersonate user feature.
	user, err := d.grafanaClient.GetImpersonateUser(ctx, r.Header)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if user == "" {
		user = "admin"
	}

	d.logger.Info("handleKubernetesKubeconfig request", "user", user)
	span.SetAttributes(attribute.Key("user").String(user))

	// Create a new token for the user. The token is then used in the kubeconfig
	// to authenticate in the proxy handler against Grafana. When the
	// impersonate feature is enabled the token is also used to get user and
	// groups in the proxy handler / server.
	token, err := d.grafanaClient.CreateUserToken(ctx, user, d.generateKubeconfigTTL)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Create ExecCredential which is used in the kubeconfig "exec" section to
	// return the generated token.
	execCredential := clientauthenticationv1.ExecCredential{
		TypeMeta: metav1.TypeMeta{
			APIVersion: clientauthenticationv1.SchemeGroupVersion.String(),
			Kind:       "ExecCredential",
		},
		Status: &clientauthenticationv1.ExecCredentialStatus{
			ExpirationTimestamp: &metav1.Time{Time: time.Now().Add(time.Duration(d.generateKubeconfigTTL) * time.Second)},
			Token:               token,
		},
	}

	execCredentialData, err := json.Marshal(execCredential)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Create a kubeconfig and return it.
	//
	// The server in the kubeconfig is the Kubernetes server which is started by
	// the data source.
	//
	// We do not directly set the token and use an "exec" plugin instead. The
	// "exec" plugin is a simple bash script, which runs a cURL command against
	// the health endpoint of the datasource and then returns the generated
	// ExecCredential with the token. This is required, because the datasource
	// is not automatically started when Grafana starts and this way we ensure
	// that the data source including the proxy server is started.
	kubeconfig := clientcmdapiv1.Config{
		APIVersion: "v1",
		Kind:       "Config",
		Clusters: []clientcmdapiv1.NamedCluster{{
			Name: d.generateKubeconfigName,
			Cluster: clientcmdapiv1.Cluster{
				// Server: fmt.Sprintf("%sapi/datasources/uid/%s/resources/kubernetes/proxy", d.grafanaClient.GetURL().String(), backend.PluginConfigFromContext(ctx).DataSourceInstanceSettings.UID),
				Server: fmt.Sprintf("%sapi/datasources/proxy/uid/%s/proxy", d.grafanaClient.GetURL().String(), backend.PluginConfigFromContext(ctx).DataSourceInstanceSettings.UID),
			},
		}},
		Contexts: []clientcmdapiv1.NamedContext{{
			Name: d.generateKubeconfigName,
			Context: clientcmdapiv1.Context{
				Cluster:   d.generateKubeconfigName,
				AuthInfo:  fmt.Sprintf("%s-%s", d.generateKubeconfigName, user),
				Namespace: "default",
			},
		}},
		CurrentContext: d.generateKubeconfigName,
		AuthInfos: []clientcmdapiv1.NamedAuthInfo{{
			Name: fmt.Sprintf("%s-%s", d.generateKubeconfigName, user),
			AuthInfo: clientcmdapiv1.AuthInfo{
				// Token: token,
				Exec: &clientcmdapiv1.ExecConfig{
					APIVersion: clientauthenticationv1.SchemeGroupVersion.String(),
					Command:    "bash",
					Args: []string{"-c", fmt.Sprintf(`http_code=$(curl -X GET -H 'Authorization: Bearer %s' -Lw '%%{http_code}\n' -s -o /dev/null -I '%sapi/datasources/uid/%s/health')

if [ $http_code -ne "200" ]; then
  exit 1
fi

echo '%s'`, token, d.grafanaClient.GetURL().String(), backend.PluginConfigFromContext(ctx).DataSourceInstanceSettings.UID, string(execCredentialData))},
					InteractiveMode: clientcmdapiv1.NeverExecInteractiveMode,
				},
			},
		}},
	}

	data, err := json.Marshal(kubeconfig)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

// handleKubernetesResource can be used to get the details of a resource. The
// endpoint expects the resource id in the path and returns the resource
// details (e.g. path, resource, scope, etc.). This is required so we can call
// the proxy endpoint within the Grafana UI with the correct Kubernetes request
// paths.
func (d *Datasource) handleKubernetesResource(w http.ResponseWriter, r *http.Request) {
	ctx, span := tracing.DefaultTracer().Start(r.Context(), "handleKubernetesResource")
	defer span.End()

	id := r.PathValue("id")
	d.logger.Info("handleKubernetesResource request", "id", id)
	span.SetAttributes(attribute.Key("id").String(id))

	resource, err := d.kubeClient.GetResource(ctx, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	data, err := json.Marshal(resource)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

// handleKubernetesProxy proxies a request to the Kubernetes API. The path which
// should be requested at the Kubernetes API must be set in the "pathname" path
// value.
func (d *Datasource) handleKubernetesProxy(w http.ResponseWriter, r *http.Request) {
	ctx, span := tracing.DefaultTracer().Start(r.Context(), "handleKubernetesProxy")
	defer span.End()

	user, err := d.grafanaClient.GetImpersonateUser(ctx, r.Header)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	groups, err := d.grafanaClient.GetImpersonateGroups(ctx, r.Header)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	pathname := r.PathValue("pathname")
	requestURL := fmt.Sprintf("%s?%s", pathname, r.URL.RawQuery)

	d.logger.Info("handleKubernetesProxy request", "user", user, "groups", groups, "method", r.Method, "requestURL", requestURL)
	span.SetAttributes(attribute.Key("user").String(user))
	span.SetAttributes(attribute.Key("groups").StringSlice(groups))
	span.SetAttributes(attribute.Key("method").String(r.Method))
	span.SetAttributes(attribute.Key("requestURL").String(requestURL))

	d.kubeClient.Proxy(user, groups, requestURL, w, r)
}
