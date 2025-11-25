package kubernetes

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/ricoberger/grafana-kubernetes-plugin/pkg/models"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/k3s"
	"github.com/testcontainers/testcontainers-go/wait"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/rest"
)

func setupTest(t *testing.T) (Client, func(), error) {
	ctx := context.Background()

	k3sContainer, err := k3s.Run(
		ctx,
		"rancher/k3s:v1.32.1-k3s1",
		k3s.WithManifest("testdata/deployment.yaml"),
		k3s.WithManifest("testdata/pod.yaml"),
		testcontainers.WithAdditionalWaitStrategy(wait.ForExec([]string{"kubectl", "wait", "deployment", "echoserver", "--namespace=default", "--for=condition=Available"})),
		testcontainers.WithAdditionalWaitStrategy(wait.ForExec([]string{"kubectl", "wait", "pod", "echoserver", "--namespace=default", "--for=condition=Ready"})),
	)
	teardown := func() {
		testcontainers.CleanupContainer(t, k3sContainer)
	}
	if err != nil {
		return nil, teardown, err
	}

	kubeconfig, err := k3sContainer.GetKubeConfig(ctx)
	if err != nil {
		return nil, teardown, err
	}

	client, err := NewClient(
		ctx,
		&models.PluginSettings{
			ClusterProvider: "kubeconfig",
			Secrets: &models.SecretPluginSettings{
				ClusterKubeconfig: string(kubeconfig),
			},
		},
		log.DefaultLogger,
	)
	if err != nil {
		return nil, teardown, err
	}

	return client, teardown, nil
}

func TestCheckHeatlh(t *testing.T) {
	client, teardown, err := setupTest(t)
	defer teardown()
	require.NoError(t, err)

	t.Run("should not return an error", func(t *testing.T) {
		err := client.CheckHealth(context.Background())
		require.NoError(t, err)
	})
}

func TestGetResourceIds(t *testing.T) {
	client, teardown, err := setupTest(t)
	defer teardown()
	require.NoError(t, err)

	t.Run("should return resource ids data frame", func(t *testing.T) {
		actualFrame, err := client.GetResourceIds(context.Background())
		require.NoError(t, err)
		require.Equal(t, 55, actualFrame.Fields[0].Len())
		require.Equal(t, 55, actualFrame.Fields[1].Len())
	})
}

func TestGetNamespaces(t *testing.T) {
	client, teardown, err := setupTest(t)
	defer teardown()
	require.NoError(t, err)

	t.Run("should return namespaces data frame", func(t *testing.T) {
		expectedFrame := data.NewFrame(
			"Namespaces",
			data.NewField("values", nil, []string{"default", "kube-node-lease", "kube-public", "kube-system"}),
		)
		expectedFrame.SetMeta(&data.FrameMeta{
			PreferredVisualization: data.VisTypeTable,
			Type:                   data.FrameTypeTable,
		})

		actualFrame, err := client.GetNamespaces(context.Background())
		require.NoError(t, err)
		require.Equal(t, expectedFrame, actualFrame)
	})
}

func TestGetResources(t *testing.T) {
	client, teardown, err := setupTest(t)
	defer teardown()
	require.NoError(t, err)

	t.Run("should return resources nodes data frame", func(t *testing.T) {
		actualFrame, err := client.GetResources(context.Background(), "", nil, "node", "*", "", "", true)
		require.NoError(t, err)
		require.Equal(t, "Name", actualFrame.Fields[0].Name)
		require.Equal(t, "Status", actualFrame.Fields[1].Name)
		require.Equal(t, "Roles", actualFrame.Fields[2].Name)
		require.Equal(t, "Age", actualFrame.Fields[3].Name)
		require.Equal(t, "Version", actualFrame.Fields[4].Name)
		require.Equal(t, "Internal-IP", actualFrame.Fields[5].Name)
		require.Equal(t, "External-IP", actualFrame.Fields[6].Name)
		require.Equal(t, "OS-Image", actualFrame.Fields[7].Name)
		require.Equal(t, "Kernel-Version", actualFrame.Fields[8].Name)
		require.Equal(t, "Container-Runtime", actualFrame.Fields[9].Name)
		require.Equal(t, 1, actualFrame.Fields[0].Len())
	})

	t.Run("should return resources pods data frame", func(t *testing.T) {
		actualFrame, err := client.GetResources(context.Background(), "", nil, "pod", "default", "", "", false)
		require.NoError(t, err)
		require.Equal(t, "Namespace", actualFrame.Fields[0].Name)
		require.Equal(t, "Name", actualFrame.Fields[1].Name)
		require.Equal(t, "Ready", actualFrame.Fields[2].Name)
		require.Equal(t, "Status", actualFrame.Fields[3].Name)
		require.Equal(t, "Restarts", actualFrame.Fields[4].Name)
		require.Equal(t, "Age", actualFrame.Fields[5].Name)
		require.Equal(t, 2, actualFrame.Fields[0].Len())
	})
}

func TestGetContainers(t *testing.T) {
	client, teardown, err := setupTest(t)
	defer teardown()
	require.NoError(t, err)

	t.Run("should return containers data frame", func(t *testing.T) {
		expectedFrame := data.NewFrame(
			"Containers",
			data.NewField("values", nil, []string{"echoserver"}),
		)
		expectedFrame.SetMeta(&data.FrameMeta{
			PreferredVisualization: data.VisTypeTable,
			Type:                   data.FrameTypeTable,
		})

		actualFrame, err := client.GetContainers(context.Background(), "", nil, "deployment.apps", "default", "echoserver")
		require.NoError(t, err)
		require.Equal(t, expectedFrame, actualFrame)
	})
}

func TestGetLogs(t *testing.T) {
	client, teardown, err := setupTest(t)
	defer teardown()
	require.NoError(t, err)

	t.Run("should return logs", func(t *testing.T) {
		actualLogs, err := client.GetLogs(context.Background(), "", nil, "pod", "default", "echoserver", "echoserver", "", 0, false, backend.TimeRange{From: time.Now().Add(-1 * time.Hour), To: time.Now().Add(1 * time.Hour)})
		require.NoError(t, err)
		require.Equal(t, "timestamp", actualLogs.Fields[0].Name)
		require.Equal(t, "body", actualLogs.Fields[1].Name)
		require.Equal(t, "labels", actualLogs.Fields[2].Name)
		require.Equal(t, 2, actualLogs.Fields[0].Len())

		var logLineLabels map[string]any
		err = json.NewDecoder(bytes.NewReader(actualLogs.Fields[2].At(0).(json.RawMessage))).Decode(&logLineLabels)
		require.NoError(t, err)
		require.Contains(t, logLineLabels, "time")
		require.Contains(t, logLineLabels, "level")
		require.Contains(t, logLineLabels, "source")
		require.Contains(t, logLineLabels, "msg")
		require.Contains(t, logLineLabels, "version")
	})

	t.Run("should return filtered logs", func(t *testing.T) {
		actualLogs, err := client.GetLogs(context.Background(), "", nil, "pod", "default", "echoserver", "echoserver", "build", 0, false, backend.TimeRange{From: time.Now().Add(-1 * time.Hour), To: time.Now().Add(1 * time.Hour)})
		require.NoError(t, err)
		require.Equal(t, "timestamp", actualLogs.Fields[0].Name)
		require.Equal(t, "body", actualLogs.Fields[1].Name)
		require.Equal(t, "labels", actualLogs.Fields[2].Name)
		require.Equal(t, 1, actualLogs.Fields[0].Len())

		var logLineLabels map[string]any
		err = json.NewDecoder(bytes.NewReader(actualLogs.Fields[2].At(0).(json.RawMessage))).Decode(&logLineLabels)
		require.NoError(t, err)
		require.Contains(t, logLineLabels, "time")
		require.Contains(t, logLineLabels, "level")
		require.Contains(t, logLineLabels, "source")
		require.Contains(t, logLineLabels, "msg")
		require.NotContains(t, logLineLabels, "version")
		require.Contains(t, logLineLabels, "build")
	})
}

func TestGetResource(t *testing.T) {
	client, teardown, err := setupTest(t)
	defer teardown()
	require.NoError(t, err)

	t.Run("should return resource", func(t *testing.T) {
		actualResource, err := client.GetResource(context.Background(), "deployment.apps")
		require.NoError(t, err)
		require.Equal(t, &Resource{ID: "deployment.apps", Kind: "Deployment", APIVersion: "apps/v1", Name: "deployments", Path: "/apis/apps/v1", Namespaced: true}, actualResource)
	})
}

func TestProxy(t *testing.T) {
	kubeClient, teardown, err := setupTest(t)
	defer teardown()
	require.NoError(t, err)

	t.Run("should return pods via proxy", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "https://localhost:3000/api/datasources/proxy/uid/UID/proxy/api/v1/namespaces/default/pods?limit=500", nil)
		w := httptest.NewRecorder()

		kubeClient.Proxy("", nil, "api/v1/namespaces/default/pods?limit=500", w, req)
		res := w.Result()
		defer res.Body.Close()

		var podList corev1.PodList
		err := json.NewDecoder(res.Body).Decode(&podList)
		require.NoError(t, err)
		require.Equal(t, 2, len(podList.Items))
	})

	t.Run("should impersonate user and groups", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "https://localhost:3000/api/datasources/proxy/uid/UID/proxy/api/v1/namespaces/default/pods?limit=500", nil)
		w := httptest.NewRecorder()

		kubeClient.Proxy("test@user", []string{"test@group"}, "api/v1/namespaces/default/pods?limit=500", w, req)
		res := w.Result()
		defer res.Body.Close()

		require.Equal(t, http.StatusForbidden, res.StatusCode)

		var status metav1.Status
		err := json.NewDecoder(res.Body).Decode(&status)
		require.NoError(t, err)
		require.Equal(t, "Failure", status.Status)
		require.Equal(t, metav1.StatusReasonForbidden, status.Reason)
	})

	t.Run("should not use existing impersonate headers when user and groups are not set", func(t *testing.T) {
		testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			require.Equal(t, []string(nil), r.Header.Values("Impersonate-User"))
			require.Equal(t, []string(nil), r.Header.Values("Impersonate-Uid"))
			require.Equal(t, []string(nil), r.Header.Values("Impersonate-Group"))
		}))
		defer testServer.Close()

		client := &client{
			logger: log.DefaultLogger,
			restConfig: &rest.Config{
				Host: testServer.URL,
			},
		}

		req := httptest.NewRequest(http.MethodGet, testServer.URL, nil)
		req.Header.Add("Impersonate-User", "existinguser")
		req.Header.Add("Impersonate-Uid", "existinguid")
		req.Header.Add("Impersonate-Group", "existinggroup1")
		req.Header.Add("Impersonate-Group", "existinggroup2")
		w := httptest.NewRecorder()

		client.Proxy("", nil, "/", w, req)
		res := w.Result()
		defer res.Body.Close()
	})

	t.Run("should not use existing impersonate headers when user and groups are set", func(t *testing.T) {
		testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			require.Equal(t, []string{"testuser"}, r.Header.Values("Impersonate-User"))
			require.Equal(t, []string(nil), r.Header.Values("Impersonate-Uid"))
			require.Equal(t, []string{"testgroup1", "testgroup2"}, r.Header.Values("Impersonate-Group"))
		}))
		defer testServer.Close()

		client := &client{
			logger: log.DefaultLogger,
			restConfig: &rest.Config{
				Host: testServer.URL,
			},
		}

		req := httptest.NewRequest(http.MethodGet, testServer.URL, nil)
		req.Header.Add("Impersonate-User", "existinguser")
		req.Header.Add("Impersonate-Uid", "existinguid")
		req.Header.Add("Impersonate-Group", "existinggroup1")
		req.Header.Add("Impersonate-Group", "existinggroup2")
		w := httptest.NewRecorder()

		client.Proxy("testuser", []string{"testgroup1", "testgroup2"}, "/", w, req)
		res := w.Result()
		defer res.Body.Close()
	})
}
