package kubernetes

import (
	"context"
	"encoding/json"
	"fmt"
	"slices"
	"strings"

	"github.com/grafana/grafana-plugin-sdk-go/backend/tracing"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"go.opentelemetry.io/otel/codes"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (c *client) getResources(ctx context.Context) (map[string]Resource, error) {
	_, span := tracing.DefaultTracer().Start(ctx, "getResources")
	defer span.End()

	resources := make(map[string]Resource)

	lists, err := c.discoveryClient.ServerPreferredResources()
	if err != nil {
		c.logger.Error("Failed to supported resources", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
	}

	for _, list := range lists {
		if len(list.APIResources) == 0 {
			continue
		}

		for _, resource := range list.APIResources {
			pathPrefix := "/apis"
			if list.GroupVersion == "v1" {
				pathPrefix = "/api"
			}

			id := resource.Name
			groupVersion := strings.Split(list.GroupVersion, "/")
			if len(groupVersion) == 2 {
				id = fmt.Sprintf("%s.%s", resource.Name, groupVersion[0])
			}

			if slices.Contains(resource.Verbs, "list") {
				resources[id] = Resource{Kind: resource.Kind, Resource: resource.Name, Path: fmt.Sprintf("%s/%s", pathPrefix, list.GroupVersion), Namespaced: resource.Namespaced}
			}
		}
	}

	return resources, nil
}

// createResourcesDataFrame creates a data frame from the given resources JSON
// data. The resources JSON data is expected to be in the format of a Kubernetes
// Table object. If the wide parameter is true, all columns are included in the
// data frame, otherwise only the columns with priority 0 are included.
func createResourcesDataFrame(resources [][]byte, namespaced, wide bool) (*data.Frame, error) {
	table := metav1.Table{}
	frame := data.NewFrame("Resources")

	// Go through all resources responses and fill the global "table" with the
	// column definition and rows from the responses.
	for _, r := range resources {
		var tmpTable metav1.Table

		if err := json.Unmarshal(r, &tmpTable); err != nil {
			return nil, err
		}

		table.ColumnDefinitions = tmpTable.ColumnDefinitions
		table.Rows = append(table.Rows, tmpTable.Rows...)
	}

	// If the resource is a namespaced resource, we include the namespace as
	// first field in the data frame.
	if namespaced {
		var values []string
		for _, row := range table.Rows {
			var metadata metav1.PartialObjectMetadata
			if err := json.Unmarshal(row.Object.Raw, &metadata); err != nil {
				return nil, err
			}
			values = append(values, metadata.Namespace)
		}

		frame.Fields = append(frame.Fields,
			data.NewField("Namespace", nil, values),
		)
	}

	// Loop through all columns and rows to create the data frame. Depending on
	// the "wide" parameter we add all columns or only the ones with priority 0.
	for columnIndex, column := range table.ColumnDefinitions {
		if !wide && column.Priority != 0 {
			continue
		}

		var values []string
		for _, row := range table.Rows {
			values = append(values, fmt.Sprintf("%v", row.Cells[columnIndex]))
		}

		frame.Fields = append(frame.Fields,
			data.NewField(column.Name, nil, values),
		)
	}

	frame.SetMeta(&data.FrameMeta{
		PreferredVisualization: data.VisTypeTable,
		Type:                   data.FrameTypeTable,
	})

	return frame, nil
}
