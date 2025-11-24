package kubeconfig

import (
	"fmt"
	"net/http"
	"net/url"
	"os"
	"time"

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
	// Validate that all required command-line flags are set. If a flag is
	// missing return an error.
	if r.Url == "" {
		return fmt.Errorf("url is required")
	}
	if r.Datasource == "" {
		return fmt.Errorf("datasource is required")
	}
	if r.Kubeconfig == "" {
		return fmt.Errorf("kubeconfig is required")
	}

	// Create the url, which can be used to download the Kubeconfig from the
	// Grafana instance. It is important to set the "type=exec" and
	// "redirect=http://localhost:11716" query parameters, so that Grafana
	// redirects the Kubeconfig to our local HTTP server.
	kubeconfigUrl := fmt.Sprintf("%sapi/datasources/uid/%s/resources/kubernetes/kubeconfig?type=exec&redirect=%s", r.Url, r.Datasource, url.QueryEscape("http://localhost:11716"))
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
