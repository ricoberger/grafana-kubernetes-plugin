package kubeconfig

import (
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/ricoberger/grafana-kubernetes-plugin/cmd/kubectl-grafana/utils"

	k8sruntime "k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/tools/clientcmd"
	clientcmdlatest "k8s.io/client-go/tools/clientcmd/api/latest"
	"sigs.k8s.io/yaml"
)

type Cmd struct {
	GrafanaUrl        string `default:"" help:"Url of the Grafana instance, e.g. \"https://play.grafana.org/\"."`
	GrafanaDatasource string `default:"kubernetes" help:"Uid of the Kubernetes datasource."`
	Kubeconfig        string `default:"$HOME/.kube/config" help:"Path to the Kubeconfig file."`
}

func (r *Cmd) Run() error {
	// Validate that all required command-line flags are set. If a flag is
	// missing return an error.
	if r.GrafanaUrl == "" {
		return fmt.Errorf("grafana url is required")
	}
	if !strings.HasSuffix(r.GrafanaUrl, "/") {
		r.GrafanaUrl = r.GrafanaUrl + "/"
	}
	if r.GrafanaDatasource == "" {
		return fmt.Errorf("grafana datasource is required")
	}
	if r.Kubeconfig == "" {
		return fmt.Errorf("kubeconfig is required")
	}

	// Create the url, which can be used to download the Kubeconfig from the
	// Grafana instance. It is important to set the
	// "redirect=http://localhost:11716" query parameters, so that Grafana
	// redirects the Kubeconfig to our local HTTP server.
	kubeconfigUrl := fmt.Sprintf("%sa/ricoberger-kubernetes-app/kubectl?type=kubeconfig&datasource=%s&redirect=%s", r.GrafanaUrl, r.GrafanaDatasource, url.QueryEscape("http://localhost:11716"))
	kubeconfigFile := utils.ExpandEnv(r.Kubeconfig)
	doneChannel := make(chan error)

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// When the function is done, send the error (if any) to the
		// "doneChannel", so that the main function can exit.
		var err error

		defer func() {
			doneChannel <- err
		}()

		// Extrace the "kubeconfig" query parameter from the redirect request
		// and return an error if it is missing.
		kubeconfigParam := r.URL.Query().Get("kubeconfig")
		if kubeconfigParam == "" {
			err = fmt.Errorf("kubeconfig parameter is missing in redirect")
			return
		}

		// Create a temporary file, which contains the Kubeconfig downloaded
		// from Grafana in YAML format.
		tmpKubeconfig, err := yaml.JSONToYAML([]byte(kubeconfigParam))
		if err != nil {
			return
		}

		f, err := os.CreateTemp("", "tmp-kubeconfig.yaml")
		if err != nil {
			return
		}
		defer os.Remove(f.Name())

		if _, err := f.Write(tmpKubeconfig); err != nil {
			return
		}
		defer f.Close()

		// Load the temporary Kubeconfig file and merge it with the existing
		// Kubeconfig file (if it exists). The merged Kubeconfig is then
		// written back to the original Kubeconfig file.
		loadingRules := clientcmd.ClientConfigLoadingRules{
			Precedence: []string{f.Name(), kubeconfigFile},
		}
		mergedConfig, err := loadingRules.Load()
		if err != nil {
			return
		}

		json, err := k8sruntime.Encode(clientcmdlatest.Codec, mergedConfig)
		if err != nil {
			return
		}
		output, err := yaml.JSONToYAML(json)
		if err != nil {
			return
		}

		if err := os.WriteFile(kubeconfigFile, output, 0600); err != nil {
			return
		}

		fmt.Fprintf(w, "Kubeconfig was saved to %s", kubeconfigFile)
	})

	// Start the HTTP server, which listens for the redirect from Grafana on
	// port 11716.
	// #nosec G114
	go http.ListenAndServe(":11716", nil)

	// Open the url in the users default browser and wait until Grafana
	// redirects the user to our local HTTP server.
	utils.OpenUrl(kubeconfigUrl)

	err := <-doneChannel
	if err != nil {
		return err
	}
	time.Sleep(1 * time.Second)

	return nil
}
