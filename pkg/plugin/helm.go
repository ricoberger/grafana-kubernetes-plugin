package plugin

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/ricoberger/grafana-kubernetes-plugin/pkg/helm"
	"github.com/ricoberger/grafana-kubernetes-plugin/pkg/models"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/tracing"
	"github.com/grafana/grafana-plugin-sdk-go/experimental/concurrent"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
)

func (d *Datasource) handleHelmReleasesQueries(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	ctx, span := tracing.DefaultTracer().Start(ctx, "handleHelmReleasesQueries")
	defer span.End()

	return concurrent.QueryData(ctx, req, d.handleHelmReleases, 10)
}

func (d *Datasource) handleHelmReleases(ctx context.Context, query concurrent.Query) backend.DataResponse {
	ctx, span := tracing.DefaultTracer().Start(ctx, "handleHelmReleases")
	defer span.End()

	user, err := d.grafanaClient.GetImpersonateUser(ctx, query.Headers)
	if err != nil {
		d.logger.Error("Failed to get user.", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	groups, err := d.grafanaClient.GetImpersonateGroups(ctx, query.Headers)
	if err != nil {
		d.logger.Error("Failed to get groups.", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	var qm models.QueryModelHelmReleases
	err = json.Unmarshal(query.DataQuery.JSON, &qm)
	if err != nil {
		d.logger.Error("Failed to unmarshal query model.", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	d.logger.Info("handleHelmReleaseHistory query", "user", user, "groups", groups, "namespace", qm.Namespace)
	span.SetAttributes(attribute.Key("user").String(user))
	span.SetAttributes(attribute.Key("groups").StringSlice(groups))
	span.SetAttributes(attribute.Key("namespace").String(qm.Namespace))

	restConfig := d.kubeClient.RestConfig()
	helmClient, err := helm.NewClient(user, groups, qm.Namespace, &restConfig, d.logger)
	if err != nil {
		d.logger.Error("Failed to create Helm client.", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	frame, err := helmClient.ListReleases()
	if err != nil {
		d.logger.Error("Failed to get Helm releases.", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	var response backend.DataResponse
	response.Frames = append(response.Frames, frame)

	return response
}

func (d *Datasource) handleHelmReleaseHistoryQueries(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	ctx, span := tracing.DefaultTracer().Start(ctx, "handleHelmReleaseHistoryQueries")
	defer span.End()

	return concurrent.QueryData(ctx, req, d.handleHelmReleaseHistory, 10)
}

func (d *Datasource) handleHelmReleaseHistory(ctx context.Context, query concurrent.Query) backend.DataResponse {
	ctx, span := tracing.DefaultTracer().Start(ctx, "handleHelmReleaseHistory")
	defer span.End()

	user, err := d.grafanaClient.GetImpersonateUser(ctx, query.Headers)
	if err != nil {
		d.logger.Error("Failed to get user.", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	groups, err := d.grafanaClient.GetImpersonateGroups(ctx, query.Headers)
	if err != nil {
		d.logger.Error("Failed to get groups.", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	var qm models.QueryModelHelmReleaseHistory
	err = json.Unmarshal(query.DataQuery.JSON, &qm)
	if err != nil {
		d.logger.Error("Failed to unmarshal query model.", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	d.logger.Info("handleHelmReleaseHistory query", "user", user, "groups", groups, "namespace", qm.Namespace, "name", qm.Name)
	span.SetAttributes(attribute.Key("user").String(user))
	span.SetAttributes(attribute.Key("groups").StringSlice(groups))
	span.SetAttributes(attribute.Key("namespace").String(qm.Namespace))
	span.SetAttributes(attribute.Key("name").String(qm.Name))

	restConfig := d.kubeClient.RestConfig()
	helmClient, err := helm.NewClient(user, groups, qm.Namespace, &restConfig, d.logger)
	if err != nil {
		d.logger.Error("Failed to create Helm client.", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	frame, err := helmClient.ListReleaseHistory(qm.Name)
	if err != nil {
		d.logger.Error("Failed to get Helm release history.", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	var response backend.DataResponse
	response.Frames = append(response.Frames, frame)

	return response
}

func (d *Datasource) handleHelmGetRelease(w http.ResponseWriter, r *http.Request) {
	ctx, span := tracing.DefaultTracer().Start(r.Context(), "helmHandleGetRelease")
	defer span.End()

	namespace := r.PathValue("namespace")
	name := r.PathValue("name")

	version, err := strconv.ParseInt(r.PathValue("version"), 10, 64)
	if err != nil {
		d.logger.Error("Failed to parse release version.", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user, err := d.grafanaClient.GetImpersonateUser(ctx, r.Header)
	if err != nil {
		d.logger.Error("Failed to get user.", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	groups, err := d.grafanaClient.GetImpersonateGroups(ctx, r.Header)
	if err != nil {
		d.logger.Error("Failed to get groups.", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	d.logger.Info("handleHelmGetRelease request", "user", user, "groups", groups, "namespace", namespace, "name", name, "version", version)
	span.SetAttributes(attribute.Key("user").String(user))
	span.SetAttributes(attribute.Key("groups").StringSlice(groups))
	span.SetAttributes(attribute.Key("namespace").String(namespace))
	span.SetAttributes(attribute.Key("name").String(name))
	span.SetAttributes(attribute.Key("version").Int64(version))

	restConfig := d.kubeClient.RestConfig()
	helmClient, err := helm.NewClient(user, groups, namespace, &restConfig, d.logger)
	if err != nil {
		d.logger.Error("Failed to create Helm client.", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	release, err := helmClient.GetRelease(name, version)
	if err != nil {
		d.logger.Error("Failed to get Helm release.", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data, err := json.Marshal(release)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

func (d *Datasource) handleHelmRollback(w http.ResponseWriter, r *http.Request) {
	ctx, span := tracing.DefaultTracer().Start(r.Context(), "helmHandleRollback")
	defer span.End()

	namespace := r.PathValue("namespace")
	name := r.PathValue("name")

	version, err := strconv.ParseInt(r.PathValue("version"), 10, 64)
	if err != nil {
		d.logger.Error("Failed to parse release version.", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user, err := d.grafanaClient.GetImpersonateUser(ctx, r.Header)
	if err != nil {
		d.logger.Error("Failed to get user.", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	groups, err := d.grafanaClient.GetImpersonateGroups(ctx, r.Header)
	if err != nil {
		d.logger.Error("Failed to get groups.", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	d.logger.Info("handleHelmRollback request", "user", user, "groups", groups, "namespace", namespace, "name", name, "version", version)
	span.SetAttributes(attribute.Key("user").String(user))
	span.SetAttributes(attribute.Key("groups").StringSlice(groups))
	span.SetAttributes(attribute.Key("namespace").String(namespace))
	span.SetAttributes(attribute.Key("name").String(name))
	span.SetAttributes(attribute.Key("version").Int64(version))

	var options helm.RollbackOptions
	err = json.NewDecoder(r.Body).Decode(&options)
	if err != nil {
		d.logger.Error("Failed to unmarshal options.", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	restConfig := d.kubeClient.RestConfig()
	helmClient, err := helm.NewClient(user, groups, namespace, &restConfig, d.logger)
	if err != nil {
		d.logger.Error("Failed to create Helm client.", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = helmClient.RollbackRelease(name, version, options)
	if err != nil {
		d.logger.Error("Failed to rollback Helm release.", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (d *Datasource) handleHelmUninstall(w http.ResponseWriter, r *http.Request) {
	ctx, span := tracing.DefaultTracer().Start(r.Context(), "handleHelmUninstall")
	defer span.End()

	namespace := r.PathValue("namespace")
	name := r.PathValue("name")

	version, err := strconv.ParseInt(r.PathValue("version"), 10, 64)
	if err != nil {
		d.logger.Error("Failed to parse release version.", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user, err := d.grafanaClient.GetImpersonateUser(ctx, r.Header)
	if err != nil {
		d.logger.Error("Failed to get user.", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	groups, err := d.grafanaClient.GetImpersonateGroups(ctx, r.Header)
	if err != nil {
		d.logger.Error("Failed to get groups.", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	d.logger.Info("handleHelmUninstall request", "user", user, "groups", groups, "namespace", namespace, "name", name, "version", version)
	span.SetAttributes(attribute.Key("user").String(user))
	span.SetAttributes(attribute.Key("groups").StringSlice(groups))
	span.SetAttributes(attribute.Key("namespace").String(namespace))
	span.SetAttributes(attribute.Key("name").String(name))
	span.SetAttributes(attribute.Key("version").Int64(version))

	var options helm.UninstallOptions
	err = json.NewDecoder(r.Body).Decode(&options)
	if err != nil {
		d.logger.Error("Failed to unmarshal options.", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	restConfig := d.kubeClient.RestConfig()
	helmClient, err := helm.NewClient(user, groups, namespace, &restConfig, d.logger)
	if err != nil {
		d.logger.Error("Failed to create Helm client.", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	info, err := helmClient.UninstallRelease(name, options)
	if err != nil {
		d.logger.Error("Failed to uninstall Helm release.", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data, err := json.Marshal(struct {
		Info string `json:"info"`
	}{
		Info: info,
	},
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}
