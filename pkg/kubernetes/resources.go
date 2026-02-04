package kubernetes

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"slices"
	"strings"

	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/backend/tracing"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"go.opentelemetry.io/otel/codes"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/util/jsonpath"
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

			// Create a unique id for the resource based on its kind and group.
			// If the resource has no group, we just use the kind as id. We do
			// not include the version in the id, because the version can change
			// and might break existing references in dashboards.
			//
			// The frontend implementation of generating the id, could be found
			// in the "utils.resource.ts" file ("getResourceId" function).
			id := resource.Kind
			groupVersion := strings.Split(list.GroupVersion, "/")
			if len(groupVersion) == 2 {
				id = fmt.Sprintf("%s.%s", resource.Kind, groupVersion[0])
			}
			id = strings.ToLower(id)

			if slices.Contains(resource.Verbs, "list") {
				resources[id] = Resource{
					ID:         id,
					Kind:       resource.Kind,
					APIVersion: list.GroupVersion,
					Name:       resource.Name,
					Path:       fmt.Sprintf("%s/%s", pathPrefix, list.GroupVersion),
					Namespaced: resource.Namespaced,
				}
			}
		}
	}

	return resources, nil
}

// createResourcesDataFrame creates a data frame from the given resources JSON
// data. The resources JSON data is expected to be in the format of a Kubernetes
// Table object. If the wide parameter is true, all columns are included in the
// data frame, otherwise only the columns with priority 0 are included.
func createResourcesDataFrame(logger log.Logger, resource Resource, resources [][]byte, namespaced, wide bool, jsonPath string) (*data.Frame, error) {
	table := metav1.Table{}
	frame := data.NewFrame(resource.Kind)

	// Go through all resources responses and fill the global "table" with the
	// column definition and rows from the responses.
	for _, r := range resources {
		var tmpTable metav1.Table

		if err := json.Unmarshal(r, &tmpTable); err != nil {
			return nil, err
		}

		table.ColumnDefinitions = tmpTable.ColumnDefinitions

		for _, row := range tmpTable.Rows {
			// If a JSONPath filter is provided, we need to evaluate it against
			// all the rows and only include the ones that match.
			// NOTE: The object in the row only contains partial metadata, so we
			// can only filter on the metadata for now.
			if jsonPath != "" {
				var objects []metav1.PartialObjectMetadata
				var object metav1.PartialObjectMetadata
				if err := json.Unmarshal(row.Object.Raw, &object); err != nil {
					return nil, err
				}
				objects = append(objects, object)

				_, found, err := executeJSONPath(logger, jsonPath, objects)
				if err != nil {
					return nil, err
				}

				if found {
					table.Rows = append(table.Rows, row)
				}
			} else {
				table.Rows = append(table.Rows, row)
			}
		}
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
			values = append(values, formatValue(resource.ID, column.Name, row.Cells[columnIndex]))
		}

		frame.Fields = append(frame.Fields,
			data.NewField(formatColumnName(resource.ID, column.Name), nil, values),
		)
	}

	frame.SetMeta(&data.FrameMeta{
		PreferredVisualization: data.VisTypeTable,
		Type:                   data.FrameTypeTable,
	})

	return frame, nil
}

func formatColumnName(resourceId, name string) string {
	if (resourceId == "podmetrics.metrics.k8s.io" || resourceId == "nodemetrics.metrics.k8s.io") && name == "cpu" {
		return "CPU"
	}

	if (resourceId == "podmetrics.metrics.k8s.io" || resourceId == "nodemetrics.metrics.k8s.io") && name == "memory" {
		return "Memory"
	}

	return name
}

func formatValue(resourceId, name string, value any) string {
	if (resourceId == "podmetrics.metrics.k8s.io" || resourceId == "nodemetrics.metrics.k8s.io") && name == "cpu" {
		quantity, err := resource.ParseQuantity(fmt.Sprintf("%v", value))
		if err != nil {
			return fmt.Sprintf("%v", value)
		}
		return fmt.Sprintf("%vm", quantity.MilliValue())
	}

	if (resourceId == "podmetrics.metrics.k8s.io" || resourceId == "nodemetrics.metrics.k8s.io") && name == "memory" {
		quantity, err := resource.ParseQuantity(fmt.Sprintf("%v", value))
		if err != nil {
			return fmt.Sprintf("%v", value)
		}
		return fmt.Sprintf("%vMi", quantity.Value()/(1024*1024))
	}

	return fmt.Sprintf("%v", value)
}

func executeJSONPath(logger log.Logger, tmpl string, input any) (string, bool, error) {
	jsonPath := jsonpath.New("")

	if err := jsonPath.Parse(fmt.Sprintf("{%s}", tmpl)); err != nil {
		return "", false, fmt.Errorf("error parsing jsonpath: %w", err)
	}

	resultBuf := &bytes.Buffer{}
	if err := jsonPath.Execute(resultBuf, input); err != nil {
		logger.Debug("error executing jsonpath", "error", err.Error())
		return "", false, nil
	}

	if strings.TrimSpace(resultBuf.String()) == "" {
		return "", false, nil
	}

	return resultBuf.String(), true, nil
}
