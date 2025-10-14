package main

import (
	"os"

	"github.com/ricoberger/grafana-kubernetes-plugin/pkg/models"
	"github.com/ricoberger/grafana-kubernetes-plugin/pkg/plugin"

	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/backend/tracing"
	"go.opentelemetry.io/otel/attribute"
)

func main() {
	// Start listening to requests sent from Grafana. This call is blocking so
	// it won't finish until Grafana shuts down the process or the plugin choose
	// to exit by itself using os.Exit. Manage automatically manages life cycle
	// of datasource instances. It accepts datasource instance factory as first
	// argument. This factory will be automatically called on incoming request
	// from Grafana to create different instances per datasource ID. When
	// datasource configuration changed Dispose method will be called and new
	// datasource instance created using NewSampleDatasource factory.
	if err := datasource.Manage(models.PluginID, plugin.NewDatasource, datasource.ManageOpts{
		TracingOpts: tracing.Opts{
			CustomAttributes: []attribute.KeyValue{
				attribute.String("plugin_id", models.PluginID),
			},
		},
	}); err != nil {
		log.DefaultLogger.Error(err.Error())
		os.Exit(1)
	}
}
