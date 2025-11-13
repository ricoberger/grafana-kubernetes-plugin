package kubernetes

import (
	"io"

	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// Resource represents a Kubernetes resource and it's metadata. It is used to
// be able to fetch all resource dynamically from the Kubernetes API, based on
// the "Path" and "Resource" fields.
type Resource struct {
	Kind       string `json:"kind"`
	Resource   string `json:"resource"`
	Path       string `json:"path"`
	Namespaced bool   `json:"namespaced"`
}

// Stream represents a logs stream for a single pod. It contains the "Pod" name
// and the actual "Stream".
type Stream struct {
	Pod    string
	Stream io.ReadCloser
}

// App represents a Kubernetes resource from the "apps/v1" API (daemonset,
// deployment, job or statefulset), with all the fields which these resources
// have in common.
//
// This is mostly used to dynaically fetch all pods and contains for one of the
// mentioned resources.
type App struct {
	Spec AppSpec `json:"spec"`
}

type AppSpec struct {
	Selector *metav1.LabelSelector `json:"selector"`
	Template v1.PodTemplateSpec    `json:"template"`
}
