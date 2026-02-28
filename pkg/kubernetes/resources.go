package kubernetes

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"slices"
	"strings"

	"github.com/grafana/grafana-plugin-sdk-go/backend/tracing"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"go.opentelemetry.io/otel/codes"
	"k8s.io/apimachinery/pkg/api/resource"
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
func createResourcesDataFrame(resource Resource, resources [][]byte, resourcesJSONPath []NamespacedName, hasJSONPath, wide bool, regex *regexp.Regexp) (*data.Frame, error) {
	table := metav1.Table{}
	frame := data.NewFrame(resource.Kind)

	// Go through all resources responses and fill the global "table" with the
	// column definition and rows from the responses.
	for _, r := range resources {
		var tmpTable metav1.Table

		if err := json.Unmarshal(r, &tmpTable); err != nil {
			return nil, err
		}

		// If the resource is a namespaced resource, we need to add the
		// namespace as first column in the table, because the Kubernetes API
		// does not include the namespace in the column definitions.
		if resource.Namespaced {
			namespaceColumnDefinition := metav1.TableColumnDefinition{
				Name:     "Namespace",
				Type:     "string",
				Priority: 0,
			}
			table.ColumnDefinitions = append([]metav1.TableColumnDefinition{namespaceColumnDefinition}, tmpTable.ColumnDefinitions...)
		} else {
			table.ColumnDefinitions = tmpTable.ColumnDefinitions
		}

		for _, row := range tmpTable.Rows {
			var metadata metav1.PartialObjectMetadata
			if err := json.Unmarshal(row.Object.Raw, &metadata); err != nil {
				return nil, err
			}

			// If a JSONPath filter was provided, we need to check if the
			// current resource is in the list of JSONPath resources.
			if hasJSONPath && !isInNamespacedNames(resourcesJSONPath, metadata.Namespace, metadata.Name) {
				continue
			}

			// If a regex filter was provided, we need to check if the name of
			// the current resource matches the regex.
			if regex != nil && !regex.MatchString(metadata.Name) {
				continue
			}

			// If the resource is namespaced, we need to add the namespace
			// as first cell in the row, because the Kubernetes API does not
			// include the namespace in the row cells.
			if resource.Namespaced {
				row.Cells = append([]any{metadata.Namespace}, row.Cells...)
				table.Rows = append(table.Rows, row)
			} else {
				table.Rows = append(table.Rows, row)
			}
		}
	}

	// Since we support or conditions in the label selector, it might be
	// possible that we fetched the same resource multiple times. To avoid
	// duplicate entries in the data frame, we need to filter the rows to be
	// unique based on the namespace (if resource is namespaced) and name of the
	// resource.
	table.Rows = unique(table.Rows, resource.Namespaced)

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

func isInNamespacedNames(namespacedNames []NamespacedName, namespace, name string) bool {
	for _, nn := range namespacedNames {
		if nn.Namespace == namespace && nn.Name == name {
			return true
		}
	}
	return false
}

func unique(rows []metav1.TableRow, namespaced bool) []metav1.TableRow {
	var uniqueRows []metav1.TableRow
	keys := make(map[string]struct{})

	for _, row := range rows {
		var key string
		if namespaced {
			key = row.Cells[0].(string) + "_" + row.Cells[1].(string)
		} else {
			key = row.Cells[0].(string)
		}

		if _, exists := keys[key]; !exists {
			keys[key] = struct{}{}
			uniqueRows = append(uniqueRows, row)
		}
	}

	return uniqueRows
}
