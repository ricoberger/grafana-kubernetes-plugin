package kubeconfig

import (
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"os"

	"github.com/ricoberger/grafana-kubernetes-plugin/cmd/kubectl-grafana/utils"

	k8sruntime "k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/tools/clientcmd"
	clientcmdlatest "k8s.io/client-go/tools/clientcmd/api/latest"
	"sigs.k8s.io/yaml"
)

type Cmd struct {
	Url        string `default:"" help:"Url of the Grafana instance, e.g. \"https://grafana.ricoberger.de/\"."`
	Datasource string `default:"kubernetes" help:"Uid of the Kubernetes datasource."`
	Kubeconfig string `default:"$HOME/.kube/config" help:"The file to which the Kubeconfig should be written."`
}

func (r *Cmd) Run() error {
	if r.Url == "" {
		err := fmt.Errorf("url flag is required")
		slog.Error("Missing flag to get Kubeconfig", slog.Any("error", err))
		return err
	}
	if r.Datasource == "" {
		err := fmt.Errorf("datasource flag is required")
		slog.Error("Missing flag to get Kubeconfig", slog.Any("error", err))
		return err
	}

	kubeconfigUrl := fmt.Sprintf("%sapi/datasources/uid/%s/resources/kubernetes/kubeconfig?type=exec&redirect=%s", r.Url, r.Datasource, url.QueryEscape("http://localhost:11716"))
	kubeconfigFile := utils.ExpandEnv(r.Kubeconfig)
	doneChannel := make(chan struct{})

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			doneChannel <- struct{}{}
		}()

		kubeconfigParam := r.URL.Query().Get("kubeconfig")

		if kubeconfigParam == "" {
			slog.Error("Download of Kubeconfig failed, \"kubeconfig\" parameter is missing")
			http.Error(w, "Download of Kubeconfig failed, \"kubeconfig\" parameter is missing", http.StatusBadRequest)
			return
		}

		tmpKubeconfig, err := yaml.JSONToYAML([]byte(kubeconfigParam))
		if err != nil {
			slog.Error("Failed to convert Kubeconfig", slog.Any("error", err))
			http.Error(w, "Failed to convert Kubeconfig", http.StatusBadRequest)
			return
		}

		f, err := os.CreateTemp("", "tmp-kubeconfig.yaml")
		if err != nil {
			slog.Error("Failed to create tmp Kubeconfig", slog.Any("error", err))
			http.Error(w, "Failed to create tmp Kubeconfig", http.StatusBadRequest)
			return
		}
		defer os.Remove(f.Name())

		if _, err := f.Write(tmpKubeconfig); err != nil {
			slog.Error("Failed to write tmp Kubeconfig", slog.Any("error", err))
			http.Error(w, "Failed to write tmp Kubeconfig", http.StatusBadRequest)
			return
		}
		defer f.Close()

		loadingRules := clientcmd.ClientConfigLoadingRules{
			Precedence: []string{f.Name(), kubeconfigFile},
		}
		mergedConfig, err := loadingRules.Load()
		if err != nil {
			slog.Error("Failed to merge Kubeconfig", slog.Any("error", err))
			http.Error(w, "Failed to merge Kubeconfig", http.StatusBadRequest)
			return
		}

		json, err := k8sruntime.Encode(clientcmdlatest.Codec, mergedConfig)
		if err != nil {
			slog.Error("Failed to encode Kubeconfig", slog.Any("error", err))
			http.Error(w, "Failed to encode Kubeconfig", http.StatusBadRequest)
			return
		}
		output, err := yaml.JSONToYAML(json)
		if err != nil {
			slog.Error("Failed to convert Kubeconfig", slog.Any("error", err))
			http.Error(w, "Failed to convert Kubeconfig", http.StatusBadRequest)
			return
		}

		if err := os.WriteFile(kubeconfigFile, output, 0600); err != nil {
			slog.Error("Failed to write Kubeconfig", slog.Any("error", err))
			http.Error(w, "Failed to write Kubeconfig", http.StatusBadRequest)
			return
		}

		fmt.Fprintf(w, "Kubeconfig was saved to %s", kubeconfigFile)
	})

	// #nosec G114
	go http.ListenAndServe(":11716", nil)

	utils.OpenUrl(kubeconfigUrl)
	<-doneChannel

	return nil
}
