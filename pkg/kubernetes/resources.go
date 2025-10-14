package kubernetes

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"

	"github.com/grafana/grafana-plugin-sdk-go/data"
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/version"
)

func (c *client) getResources(ctx context.Context) (map[string]Resource, error) {
	// Create a new resources map and initialize the map with all default
	// resources of the Kubernetes cluster.
	resources := make(map[string]Resource)

	resources["cronjobs"] = Resource{IsCRD: false, Path: "/apis/batch/v1", Resource: "cronjobs", Scope: "Namespaced"}
	resources["daemonsets"] = Resource{IsCRD: false, Path: "/apis/apps/v1", Resource: "daemonsets", Scope: "Namespaced"}
	resources["deployments"] = Resource{IsCRD: false, Path: "/apis/apps/v1", Resource: "deployments", Scope: "Namespaced"}
	resources["jobs"] = Resource{IsCRD: false, Path: "/apis/batch/v1", Resource: "jobs", Scope: "Namespaced"}
	resources["pods"] = Resource{IsCRD: false, Path: "/api/v1", Resource: "pods", Scope: "Namespaced"}
	resources["replicasets"] = Resource{IsCRD: false, Path: "/apis/apps/v1", Resource: "replicasets", Scope: "Namespaced"}
	resources["statefulsets"] = Resource{IsCRD: false, Path: "/apis/apps/v1", Resource: "statefulsets", Scope: "Namespaced"}
	resources["endpoints"] = Resource{IsCRD: false, Path: "/api/v1", Resource: "endpoints", Scope: "Namespaced"}
	resources["horizontalpodautoscalers"] = Resource{IsCRD: false, Path: "/apis/autoscaling/v2", Resource: "horizontalpodautoscalers", Scope: "Namespaced"}
	resources["ingresses"] = Resource{IsCRD: false, Path: "/apis/networking.k8s.io/v1", Resource: "ingresses", Scope: "Namespaced"}
	resources["networkpolicies"] = Resource{IsCRD: false, Path: "/apis/networking.k8s.io/v1", Resource: "networkpolicies", Scope: "Namespaced"}
	resources["services"] = Resource{IsCRD: false, Path: "/api/v1", Resource: "services", Scope: "Namespaced"}
	resources["configmaps"] = Resource{IsCRD: false, Path: "/api/v1", Resource: "configmaps", Scope: "Namespaced"}
	resources["persistentvolumeclaims"] = Resource{IsCRD: false, Path: "/api/v1", Resource: "persistentvolumeclaims", Scope: "Namespaced"}
	resources["persistentvolumes"] = Resource{IsCRD: false, Path: "/api/v1", Resource: "persistentvolumes", Scope: "Cluster"}
	resources["poddisruptionbudgets"] = Resource{IsCRD: false, Path: "/apis/policy/v1", Resource: "poddisruptionbudgets", Scope: "Namespaced"}
	resources["secrets"] = Resource{IsCRD: false, Path: "/api/v1", Resource: "secrets", Scope: "Namespaced"}
	resources["serviceaccounts"] = Resource{IsCRD: false, Path: "/api/v1", Resource: "serviceaccounts", Scope: "Namespaced"}
	resources["storageclasses"] = Resource{IsCRD: false, Path: "/apis/storage.k8s.io/v1", Resource: "storageclasses", Scope: "Cluster"}
	resources["clusterrolebindings"] = Resource{IsCRD: false, Path: "/apis/rbac.authorization.k8s.io/v1", Resource: "clusterrolebindings", Scope: "Cluster"}
	resources["clusterroles"] = Resource{IsCRD: false, Path: "/apis/rbac.authorization.k8s.io/v1", Resource: "clusterroles", Scope: "Cluster"}
	resources["rolebindings"] = Resource{IsCRD: false, Path: "/apis/rbac.authorization.k8s.io/v1", Resource: "rolebindings", Scope: "Namespaced"}
	resources["roles"] = Resource{IsCRD: false, Path: "/apis/rbac.authorization.k8s.io/v1", Resource: "roles", Scope: "Namespaced"}
	resources["events"] = Resource{IsCRD: false, Path: "/api/v1", Resource: "events", Scope: "Namespaced"}
	resources["namespaces"] = Resource{IsCRD: false, Path: "/api/v1", Resource: "namespaces", Scope: "Cluster"}
	resources["nodes"] = Resource{IsCRD: false, Path: "/api/v1", Resource: "nodes", Scope: "Cluster"}

	// Get all CustomResourceDefinitions deployed in the Kubernetes cluster and
	// add them to the resources map. The key in the map for the resources is
	// the plural name of the CustomResourceDefinition and the API group, which
	// should be unique accross all CRDs.
	res, err := c.clientset.CoreV1().RESTClient().Get().AbsPath("apis/apiextensions.k8s.io/v1/customresourcedefinitions").DoRaw(ctx)
	if err != nil {
		return nil, err
	}

	var crdList apiextensionsv1.CustomResourceDefinitionList

	err = json.Unmarshal(res, &crdList)
	if err != nil {
		return nil, err
	}

	for _, crd := range crdList.Items {
		if len(crd.Spec.Versions) > 0 {
			sort.Slice(crd.Spec.Versions, func(i, j int) bool {
				return version.CompareKubeAwareVersionStrings(crd.Spec.Versions[i].Name, crd.Spec.Versions[j].Name) > 0
			})

			var columns []Column
			if crd.Spec.Versions[0].AdditionalPrinterColumns != nil {
				for _, column := range crd.Spec.Versions[0].AdditionalPrinterColumns {
					if column.Priority == 0 {
						columns = append(columns, Column{
							Description: column.Description,
							JSONPath:    column.JSONPath,
							Name:        column.Name,
							Type:        column.Type,
						})
					}
				}
			}

			resources[fmt.Sprintf("%s.%s", crd.Spec.Names.Plural, crd.Spec.Group)] = Resource{
				IsCRD:    true,
				Path:     fmt.Sprintf("/apis/%s/%s", crd.Spec.Group, crd.Spec.Versions[0].Name),
				Resource: crd.Spec.Names.Plural,
				Scope:    string(crd.Spec.Scope),
				Columns:  columns,
			}
		}
	}

	return resources, nil
}

// createResourcesDataFrame creates a data frame from the given resources JSON
// data. The resources JSON data is expected to be in the format of a Kubernetes
// Table object. If the wide parameter is true, all columns are included in the
// data frame, otherwise only the columns with priority 0 are included.
func createResourcesDataFrame(resources [][]byte, isNamespaced, wide bool) (*data.Frame, error) {
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
	if isNamespaced {
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
