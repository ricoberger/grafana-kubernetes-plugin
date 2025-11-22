package token

import (
	"encoding/json"
	"fmt"
	"log/slog"
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

	cache, err := NewCache(r.Name)
	if err != nil {
		slog.Warn("Failed to initialize cache", slog.Any("error", err))
	}

	if cache != nil {
		cachedCredentials, err := cache.Get()
		if err != nil {
			slog.Warn("Failed to get cached credentials", slog.Any("error", err))
		} else if cachedCredentials != nil {
			output, err := json.Marshal(cachedCredentials)
			if err != nil {
				slog.Warn("Failed to marshal cached credentials", slog.Any("error", err))
			} else {
				fmt.Fprintln(os.Stdout, string(output))
				return nil
			}
		}
	}

	credentialsUrl := fmt.Sprintf("%sapi/datasources/uid/%s/resources/kubernetes/kubeconfig/credentials?redirect=%s", r.Url, r.Datasource, url.QueryEscape("http://localhost:11716"))
	credentials := ""
	doneChannel := make(chan struct{})

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			doneChannel <- struct{}{}
		}()

		credentialsParam := r.URL.Query().Get("credentials")

		if credentialsParam == "" {
			slog.Error("Failed to get credentials, \"credentials\" parameter is missing")
			http.Error(w, "Failed to get credentials, \"credentials\" parameter is missing", http.StatusBadRequest)
			return
		}

		credentials = credentialsParam
		fmt.Fprintf(w, "Credentials were returned")
	})

	// #nosec G114
	go http.ListenAndServe(":11716", nil)

	utils.OpenUrl(credentialsUrl)
	<-doneChannel

	if cache != nil {
		if err := cache.Set(credentials); err != nil {
			slog.Warn("Failed to cache credentials", slog.Any("error", err))
		}
	}

	fmt.Fprintln(os.Stdout, credentials)
	return nil
}
