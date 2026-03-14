package plugin

import (
	"context"
	"encoding/json"

	"github.com/ricoberger/grafana-kubernetes-plugin/pkg/models"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/tracing"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/grafana/grafana-plugin-sdk-go/experimental/concurrent"
	"go.opentelemetry.io/otel/codes"
)

func (d *Datasource) handleSettingsQueries(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	ctx, span := tracing.DefaultTracer().Start(ctx, "handleSettingsQueries")
	defer span.End()

	return concurrent.QueryData(ctx, req, d.handleSettings, 10)
}

func (d *Datasource) handleSettings(ctx context.Context, query concurrent.Query) backend.DataResponse {
	_, span := tracing.DefaultTracer().Start(ctx, "handleSettings")
	defer span.End()

	config, err := models.LoadPluginSettings(*query.PluginContext.DataSourceInstanceSettings)
	if err != nil {
		d.logger.Error("Failed to load plugin settings", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	var qm models.QueryModelSettings
	err = json.Unmarshal(query.DataQuery.JSON, &qm)
	if err != nil {
		d.logger.Error("Failed to unmarshal query model", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return backend.ErrorResponseWithErrorSource(err)
	}

	var setting string
	switch qm.Setting {
	case "integrationsMetricsDatasourceUid":
		setting = config.IntegrationsMetricsDatasourceUid
	case "integrationsMetricsClusterLabel":
		setting = config.IntegrationsMetricsClusterLabel
	case "integrationsMetricsLogs":
		setting = config.IntegrationsMetricsLogs
	default:
	}

	frame := data.NewFrame(
		"Settings",
		data.NewField("values", nil, []string{setting}),
	)

	frame.SetMeta(&data.FrameMeta{
		PreferredVisualization: data.VisTypeTable,
		Type:                   data.FrameTypeTable,
	})

	var response backend.DataResponse
	response.Frames = append(response.Frames, frame)

	return response
}
