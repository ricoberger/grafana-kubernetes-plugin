package token

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"

	"github.com/ricoberger/grafana-kubernetes-plugin/cmd/kubectl-grafana/utils"
)

type Cmd struct {
	Name       string `default:"grafana" help:"Name of the Kubernetes cluster, which used for the cache file."`
	Url        string `default:"" help:"Url of the Grafana instance, e.g. \"https://grafana.ricoberger.de/\"."`
	Datasource string `default:"kubernetes" help:"Uid of the Kubernetes datasource."`
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
	if r.Name == "" {
		return fmt.Errorf("name is required")
	}

	// Initialize the cache and check if the cache contains valid credentials.
	// If valid credentials are found, print them to stdout and return.
	cache, err := NewCache(r.Name)
	if err != nil {
		return err
	}

	cachedCredentials, err := cache.Get()
	if err != nil {
		return err
	} else if cachedCredentials != nil {
		output, err := json.Marshal(cachedCredentials)
		if err != nil {
			return err
		} else {
			fmt.Fprintln(os.Stdout, string(output))
			return nil
		}
	}

	// Create the url, which can be used to create new credentails form the
	// Grafana instance. It is important to set the
	// "redirect=http://localhost:11716" query parameter, so that Grafana
	// redirects the credentials to our local HTTP server.
	credentialsUrl := fmt.Sprintf("%sapi/datasources/uid/%s/resources/kubernetes/kubeconfig/credentials?redirect=%s", r.Url, r.Datasource, url.QueryEscape("http://localhost:11716"))
	credentials := ""
	doneChannel := make(chan error)

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// When the function is done, send the error (if any) to the
		// "doneChannel", so that the main function can exit.
		var err error

		defer func() {
			doneChannel <- err
		}()

		// Extrace the "credentials" query parameter from the redirect request
		// and return an error if it is missing.
		credentialsParam := r.URL.Query().Get("credentials")

		if credentialsParam == "" {
			err = fmt.Errorf("credentials parameter is missing in redirect")
			return
		}

		credentials = credentialsParam
		fmt.Fprintf(w, "Credentials were created")
	})

	// Start the HTTP server, which listens for the redirect from Grafana on
	// port 11716.
	// #nosec G114
	go http.ListenAndServe(":11716", nil)

	// Open the url in the users default browser and wait until Grafana
	// redirects the user to our local HTTP server.
	utils.OpenUrl(credentialsUrl)
	err = <-doneChannel
	if err != nil {
		return err
	}

	// Store the new credentials in the cache and print them to stdout.
	if err := cache.Set(credentials); err != nil {
		return err
	}

	fmt.Fprintln(os.Stdout, credentials)
	return nil
}
