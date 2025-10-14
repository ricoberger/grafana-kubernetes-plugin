package plugin

import (
	"context"
	"fmt"
	"testing"

	"github.com/ricoberger/grafana-kubernetes-plugin/pkg/grafana"
	"github.com/ricoberger/grafana-kubernetes-plugin/pkg/kubernetes"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
)

func TestCheckHealth(t *testing.T) {
	t.Run("should return ok if Kubernetes API is reachable", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		grafanaClient := grafana.NewMockClient(ctrl)
		kubernetesClient := kubernetes.NewMockClient(ctrl)
		kubernetesServer := kubernetes.NewMockServer(ctrl)

		kubernetesClient.EXPECT().CheckHealth(gomock.Any()).Return(nil)

		ds := Datasource{
			generateKubeconfig:     false,
			generateKubeconfigName: "grafana",
			generateKubeconfigTTL:  3600,
			grafanaClient:          grafanaClient,
			kubeClient:             kubernetesClient,
			kubeServer:             kubernetesServer,
			logger:                 log.DefaultLogger,
		}

		resp, err := ds.CheckHealth(context.Background(), &backend.CheckHealthRequest{})
		require.NoError(t, err)
		require.Equal(t, backend.HealthStatusOk, resp.Status)
		require.Equal(t, "Data source is working.", resp.Message)
	})

	t.Run("should return error if Kubernetes API is not reachable", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		grafanaClient := grafana.NewMockClient(ctrl)
		kubernetesClient := kubernetes.NewMockClient(ctrl)
		kubernetesServer := kubernetes.NewMockServer(ctrl)

		kubernetesClient.EXPECT().CheckHealth(gomock.Any()).Return(fmt.Errorf("an unknown error occurred"))

		ds := Datasource{
			generateKubeconfig:     false,
			generateKubeconfigName: "grafana",
			generateKubeconfigTTL:  3600,
			grafanaClient:          grafanaClient,
			kubeClient:             kubernetesClient,
			kubeServer:             kubernetesServer,
			logger:                 log.DefaultLogger,
		}

		resp, err := ds.CheckHealth(context.Background(), &backend.CheckHealthRequest{})
		require.NoError(t, err)
		require.Equal(t, backend.HealthStatusError, resp.Status)
		require.Equal(t, "Data source is not working: an unknown error occurred", resp.Message)
	})
}
