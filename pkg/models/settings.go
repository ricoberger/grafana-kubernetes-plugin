package models

import (
	"encoding/json"
	"fmt"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

// The PlguinID is the id of the plugin and must be the same as in the
// plugin.json file.
const PluginID = "ricoberger-kubernetes-datasource"

// PluginSettings holds the settings for the Kubernetes datasource plugin, which
// can be configured in the Grafana UI.
type PluginSettings struct {
	ClusterProvider                        string                `json:"clusterProvider"`
	ClusterPath                            string                `json:"clusterPath"`
	ClusterContext                         string                `json:"clusterContext"`
	GrafanaUsername                        string                `json:"grafanaUsername"`
	ImpersonateUser                        bool                  `json:"impersonateUser"`
	ImpersonateGroups                      bool                  `json:"impersonateGroups"`
	GenerateKubeconfig                     bool                  `json:"generateKubeconfig"`
	GenerateKubeconfigName                 string                `json:"generateKubeconfigName"`
	GenerateKubeconfigTTL                  int64                 `json:"generateKubeconfigTTL"`
	GenerateKubeconfigPort                 int64                 `json:"generateKubeconfigPort"`
	GenerateKubeconfigRedirectUrls         []string              `json:"generateKubeconfigRedirectUrls"`
	IntegrationsMetricsDatasourceUid       string                `json:"integrationsMetricsDatasourceUid"`
	IntegrationsMetricsKubeletJob          string                `json:"integrationsMetricsKubeletJob"`
	IntegrationsMetricsKubeStateMetricsJob string                `json:"integrationsMetricsKubeStateMetricsJob"`
	IntegrationsMetricsNodeExporterJob     string                `json:"integrationsMetricsNodeExporterJob"`
	IntegrationsTracesQuery                string                `json:"integrationsTracesQuery"`
	Secrets                                *SecretPluginSettings `json:"-"`
}

type SecretPluginSettings struct {
	ClusterKubeconfig string `json:"clusterKubeconfig"`
	GrafanaPassword   string `json:"grafanaPassword"`
}

// LoadPluginSettings loads the plugin settings from the instance settings of
// data source, which are provided within the plugin context when creating a new
// data source.
func LoadPluginSettings(source backend.DataSourceInstanceSettings) (*PluginSettings, error) {
	settings := PluginSettings{}
	err := json.Unmarshal(source.JSONData, &settings)
	if err != nil {
		return nil, fmt.Errorf("could not unmarshal PluginSettings json: %w", err)
	}

	settings.Secrets = loadSecretPluginSettings(source.DecryptedSecureJSONData)

	return &settings, nil
}

func loadSecretPluginSettings(source map[string]string) *SecretPluginSettings {
	return &SecretPluginSettings{
		ClusterKubeconfig: source["clusterKubeconfig"],
		GrafanaPassword:   source["grafanaPassword"],
	}
}
