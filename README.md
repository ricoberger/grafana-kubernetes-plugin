# Grafana Kubernetes Plugin

The Grafana Kubernetes Plugin allows you to explore your Kubernetes resources
and logs directly within Grafana. The plugin also provides several actions to
interact with your resources, including editing, deleting, and scaling them.
Last but not least, the plugin also supports other cloud native tools such as
Helm and Flux.

<div align="center">
  <table>
    <tr>
      <td><img src="https://raw.githubusercontent.com/ricoberger/grafana-kubernetes-plugin/refs/heads/main/src/img/screenshots/kubernetes-resources.png" /></td>
      <td><img src="https://raw.githubusercontent.com/ricoberger/grafana-kubernetes-plugin/refs/heads/main/src/img/screenshots/kubernetes-resources-details.png" /></td>
      <td><img src="https://raw.githubusercontent.com/ricoberger/grafana-kubernetes-plugin/refs/heads/main/src/img/screenshots/kubernetes-resources-actions.png" /></td>
    </tr>
    <tr>
      <td><img src="https://raw.githubusercontent.com/ricoberger/grafana-kubernetes-plugin/refs/heads/main/src/img/screenshots/kubernetes-logs.png" /></td>
      <td><img src="https://raw.githubusercontent.com/ricoberger/grafana-kubernetes-plugin/refs/heads/main/src/img/screenshots/helm.png" /></td>
      <td><img src="https://raw.githubusercontent.com/ricoberger/grafana-kubernetes-plugin/refs/heads/main/src/img/screenshots/flux.png" /></td>
    </tr>
  </table>
</div>

## Features

- View Kubernetes resources like Pods, DaemonSets, Deployments, StatefulSets,
  etc.
- Includes support for Custom Resource Definitions.
- Filter and search for resources, by Namespace, label selectors and field
  selectors.
- Get a fast overview of the status of resources, including detailed information
  and events.
- Modify resources, by adjusting the YAML manifest files or using the built-in
  actions for scaling, restarting, creating or deleting resources.
- View logs of Pods, DaemonSets, Deployments, StatefulSets and Jobs.
- Automatic JSON parsing of log lines and filtering of logs by time range and
  regular expressions.
- Role-based access control (RBAC), based on Grafana users and teams, to
  authorize all Kubernetes requests.
- Generate Kubeconfig files, so users can access the Kubernetes API using tools
  like `kubectl` for exec and port-forward actions.
- Integrations for metrics and traces:
  - Metrics: View metrics for Kubenretes resources like Pods, Nodes,
    Deployments, etc. using a Prometheus datasource.
  - Traces: Link traces from Pod logs to a tracing datasource like Jaeger.
- Integrations for other cloud-native tools like Helm and Flux:
  - Helm: View Helm releases including the history, rollback and uninstall Helm
    releases.
  - Flux: View Flux resources, reconcile, suspend and resume Flux resources.

## Installation

To install the plugin you have to add `ricoberger-kubernetes-app` to the
[`allow_loading_unsigned_plugins`](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#allow_loading_unsigned_plugins)
configuration option or to the `GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS`
environment variable.

## Configuration

To add a new Kubernetes cluster to Grafana, create a new Kubernetes data source.

![Datasource Configuration](https://raw.githubusercontent.com/ricoberger/grafana-kubernetes-plugin/refs/heads/main/src/img/screenshots/datasource-configuration.png)

You can choose between multiple providers to add a Kubernetes cluster:

- **In-Cluster:** Use a ServiceAccount mounted to your Grafana Pods, to
  authenticate against the Kubernetes cluster.
- **Path:** Provide the path to a Kubeconfig file and the context, which should
  be used from this file.
- **Kubeconfig:** Upload a Kubeconfig file and store it within Grafana. The
  Kubeconfig file can only contain one context.

### Grafana

To use the **Impersonate** and **Generate Kubeconfig** features of the plugin,
you have to enable basic authentication first, e.g. by setting the
`GF_AUTH_BASIC_ENABLED` environment variable to `true` or by enabling basic auth
in the
[Grafana configuration](https://grafana.com/docs/grafana/latest/setup-grafana/configure-security/configure-authentication/grafana/).
Afterwards you have to provide a Grafana username and password for the plugin,
so that the plugin can interact with the Grafana API. The provided user should
have the `Admin` role.

### Impersonate

The plugin can impersonate a Grafana user and the groups of the user when making
requests against the Kubernetes API. This means that you can use role-based
access control (RBAC) within the plugin.

If you have a user with the login `admin` you can create the following
ClusterRole and ClusterRoleBinding to allow this user to only list and get Pods
within the Kubernetes cluster:

```bash
kubectl create clusterrole grafana-admin-user --verb list,get --resource pods
kubectl create clusterrolebinding grafana-admin-user --clusterrole grafana-admin-user --user admin
```

If you have a team called `admin` you can create the following ClusterRole and
ClusterRoleBinding to allow all members of this team to only list and get Pods
within the Kubernetes cluster:

```bash
kubectl create clusterrole grafana-admin-team --verb list,get --resource pods
kubectl create clusterrolebinding grafana-admin-team --clusterrole grafana-admin-team --group admin
```

### Generate Kubeconfig

The Grafana Kubernetes Plugin can also be used to generate a Kubeconfig for your
users, so that they can use `kubectl` for exec and port-forward actions, which
are not directly supported by the plugin.

If enabled the plugin will create a personal Grafana service account and service
account token for all users. This token is then used in the Kubeconfig, so that
the user gets access to Grafana, which will then forward the request to the
Kubernetes API. This feature also uses the **Impersonate** feature if enabled.

To use this feature you have to provide a name for the Kubeconfig file which is
generated, a time-to-live for the genated service account token in seconds and a
port, which will be used to start the server responsible for authenticating the
user and proxing the request to the Kubernetes API.

![Kubeconfig](https://raw.githubusercontent.com/ricoberger/grafana-kubernetes-plugin/refs/heads/main/src/img/screenshots/kubeconfig.png)

### Integrations

Integrations allow you to integrate the Kubernetes datasource with other
datasources to view metrics or traces related to your Kubernetes resources.

To view the metrics of your Kubernetes resources you have to provide the UID of
a Prometheus datasource and the job label for the kubelet, kube-state-metrics
and node-exporter metrics.

To link traces from the Kubernetes logs to a tracing datasource (e.g. Jaeger)
you have to enable the tracing integration an a link to the tracing datasource.
Within the link you can use the `${__value.raw}` variable which will be replaced
with the actual trace id. To link to a Jaeger datasource the following link can
be used:
`/explore?schemaVersion=1&panes={"ao9":{"datasource":"jaeger","queries":[{"query":"${__value.raw}","refId":"A"}]}}`.

![Metrics](https://raw.githubusercontent.com/ricoberger/grafana-kubernetes-plugin/refs/heads/main/src/img/screenshots/kubernetes-resources-metrics.png)

## Contributing

If you want to contribute to the project, please read through the
[contribution guideline](https://github.com/ricoberger/grafana-kubernetes-plugin/blob/main/CONTRIBUTING.md).
Please also follow our
[code of conduct](https://github.com/ricoberger/grafana-kubernetes-plugin/blob/main/CODE_OF_CONDUCT.md)
in all your interactions with the project.
