package kubernetes

//go:generate go tool mockgen -source=server.go -destination=./server_mock.go -package=kubernetes Server

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/ricoberger/grafana-kubernetes-plugin/pkg/grafana"

	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/backend/tracing"
	"go.opentelemetry.io/otel/attribute"
)

type Server interface {
	Start() error
	Stop() error
}

type server struct {
	server *http.Server
	logger log.Logger
}

// Start starts the Kubernetes server on the defined address. This should be run
// in a new go routine.
//
// If the server can not be started an error is returned. If the server is
// stopped via the "Stop" method no error is returned.
func (s *server) Start() error {
	s.logger.Info("Start server", "address", s.server.Addr)

	if err := s.server.ListenAndServe(); err != nil {
		if errors.Is(err, http.ErrServerClosed) {
			s.logger.Debug("Server closed")
			return nil
		}

		s.logger.Error("Server died unexpected", "error", err.Error())
		return err
	}

	return nil
}

// Stop implements a gracefull shutdown of the server. This should be called in
// the "Dispose" method of the datasource, so that the server can be restarted
// when the datasource configuration is changed.
func (s *server) Stop() error {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	s.logger.Debug("Start shutdown of the server")

	err := s.server.Shutdown(ctx)
	if err != nil {
		s.logger.Error("Graceful shutdown of the server failed", "error", err.Error())
		return err
	}

	return nil
}

// NewServer creates a new HTTP server on the given port. The server will proxy
// requests to the Kubernetes API server using the provided Kubernetes client.
// The implementation for proxing requests should be the same as in the
// "handleKubernetesProxy" handler of the datasource. The server can be accessed
// via the "kubectl" proxy route of the datasource as defined in the
// "src/datasource/plugin.json" file.
//
// This is required because Grafana doesn't allow upgrading the connection in
// "CallResourceHandler" implementation, which is used by the
// "handleKubernetesProxy" handler. To support all kubectl features, especially
// "kubectl exec" and "kubectl port-forward", we must be able to upgrade the
// connection for websockets.
//
// The server will be used in the generated kubeconfig via the following url:
// "<GRAFANA_URL>api/datasources/proxy/uid/<DATASOURCE_UID>/proxy". Since the
// server is only used in the kubeconfig, it should only be started when this
// feature is activated by in the datasource configuration.
func NewServer(port int64, kubeClient Client, grafanaClient grafana.Client, logger log.Logger) (Server, error) {
	mux := http.NewServeMux()
	mux.HandleFunc("/{pathname...}", func(w http.ResponseWriter, r *http.Request) {
		ctx, span := tracing.DefaultTracer().Start(r.Context(), "serverRequest")
		defer span.End()

		user, err := grafanaClient.GetImpersonateUser(ctx, r.Header)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		groups, err := grafanaClient.GetImpersonateGroups(ctx, r.Header)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		pathname := r.PathValue("pathname")
		requestUrl := fmt.Sprintf("%s?%s", pathname, r.URL.RawQuery)

		logger.Info("Kubernetes server request", "user", user, "groups", groups, "method", r.Method, "requestUrl", requestUrl)
		span.SetAttributes(attribute.Key("user").String(user))
		span.SetAttributes(attribute.Key("groups").StringSlice(groups))
		span.SetAttributes(attribute.Key("method").String(r.Method))
		span.SetAttributes(attribute.Key("requestUrl").String(requestUrl))

		kubeClient.Proxy(user, groups, requestUrl, w, r)
	})

	return &server{
		server: &http.Server{
			Addr:              fmt.Sprintf(":%d", port),
			Handler:           mux,
			ReadHeaderTimeout: 3 * time.Second,
		},
		logger: logger,
	}, nil
}
