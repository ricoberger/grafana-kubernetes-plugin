package models

type QueryType string

const (
	QueryTypeSettings              = "settings"
	QueryTypeKubernetesResourceIds = "kubernetes-resourceids"
	QueryTypeKubernetesNamespaces  = "kubernetes-namespaces"
	QueryTypeKubernetesResources   = "kubernetes-resources"
	QueryTypeKubernetesContainers  = "kubernetes-containers"
	QueryTypeKubernetesLogs        = "kubernetes-logs"
	QueryTypeHelmReleases          = "helm-releases"
	QueryTypeHelmReleaseHistory    = "helm-release-history"
)

type QueryModelSettings struct {
	Setting string `json:"setting"`
}

type QueryModelKubernetesResources struct {
	ResourceId     string `json:"resourceId"`
	Namespace      string `json:"namespace"`
	ParameterName  string `json:"parameterName"`
	ParameterValue string `json:"parameterValue"`
	Wide           bool   `json:"wide"`
}

type QueryModelKubernetesContainers struct {
	ResourceId string `json:"resourceId"`
	Namespace  string `json:"namespace"`
	Name       string `json:"name"`
}

type QueryModelKubernetesLogs struct {
	ResourceId string `json:"resourceId"`
	Namespace  string `json:"namespace"`
	Name       string `json:"name"`
	Container  string `json:"container"`
	Filter     string `json:"filter"`
	Tail       int64  `json:"tail"`
	Previous   bool   `json:"previous"`
}

type QueryModelHelmReleases struct {
	Namespace string `json:"namespace"`
}

type QueryModelHelmReleaseHistory struct {
	Namespace string `json:"namespace"`
	Name      string `json:"name"`
}
