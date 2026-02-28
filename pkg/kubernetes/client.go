package kubernetes

//go:generate go tool mockgen -source=client.go -destination=./client_mock.go -package=kubernetes Client

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"regexp"
	"slices"
	"strings"
	"sync"
	"time"

	"github.com/ricoberger/grafana-kubernetes-plugin/pkg/models"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/backend/tracing"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/propagation"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/transport"
	"k8s.io/client-go/util/jsonpath"
)

type Client interface {
	RestConfig() rest.Config
	CheckHealth(ctx context.Context) error
	GetResourceIds(ctx context.Context) (*data.Frame, error)
	GetNamespaces(ctx context.Context) (*data.Frame, error)
	GetResources(ctx context.Context, user string, groups []string, resourceId, namespace, parameterName, parameterValue string, wide bool) (*data.Frame, error)
	GetContainers(ctx context.Context, user string, groups []string, resourceId, namespace, name string) (*data.Frame, error)
	GetLogs(ctx context.Context, user string, groups []string, resourceId, namespace, name, container, filter string, tail int64, previous bool, timeRange backend.TimeRange) (*data.Frame, error)
	StreamLogs(ctx context.Context, user string, groups []string, resourceId, namespace, name, container, filter string, sender *backend.StreamSender) error
	GetResource(ctx context.Context, resourceId string) (*Resource, error)
	Proxy(user string, groups []string, requestUrl string, w http.ResponseWriter, r *http.Request)
}

type client struct {
	logger          log.Logger
	restConfig      *rest.Config
	clientset       kubernetes.Interface
	discoveryClient discovery.DiscoveryInterface
	cache           Cache
}

// refreshCache refreshed the cache if it is not valid anymore by calling
// the "getResources" function and setting all returned resources in the cache.
func (c *client) refreshCache(ctx context.Context) {
	ctx, span := tracing.DefaultTracer().Start(ctx, "refreshCache")
	defer span.End()

	if !c.cache.IsValid() {
		if resources, err := c.getResources(ctx); err != nil {
			c.logger.Error("Failed to refresh cache", "error", err.Error())
			span.RecordError(err)
			span.SetStatus(codes.Error, err.Error())
		} else {
			c.logger.Debug("Cache refreshed", "resources", len(resources))
			c.cache.SetAll(resources)
		}
	} else {
		c.logger.Debug("Cache is still valid")
	}
}

// RestConfig returns a copy of the rest config, which can be used by other
// clients to interact with the Kubernetes API. We should return a copy so that
// when other clients modify the rest config (e.g. setting
// "restConfig.Impersonate.UserName") it wont effect the rest config of the
// Kubernetes client.
func (c *client) RestConfig() rest.Config {
	return *c.restConfig
}

// CheckHealth checks the health of the Kubernetes cluster by calling the "/api"
// endpoint. If the call is successful we return nil, otherwise we return an
// error.
func (c *client) CheckHealth(ctx context.Context) error {
	ctx, span := tracing.DefaultTracer().Start(ctx, "CheckHealth")
	defer span.End()

	_, err := c.clientset.CoreV1().RESTClient().Get().AbsPath("/api").DoRaw(ctx)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return err
	}

	return nil
}

// GetResourceIds returns a list of all resource ids in the Kubernetes cluster
// as data frame.
func (c *client) GetResourceIds(ctx context.Context) (*data.Frame, error) {
	ctx, span := tracing.DefaultTracer().Start(ctx, "GetResourceIds")
	defer span.End()

	c.refreshCache(ctx)

	// Get the values for the data frame from the resource cache.
	ids, kinds, apiVersions, names, paths, namespaced := c.cache.GetDataFrameValues()

	frame := data.NewFrame(
		"Resources",
		data.NewField("ids", nil, ids),
		data.NewField("kinds", nil, kinds),
		data.NewField("apiVersions", nil, apiVersions),
		data.NewField("names", nil, names),
		data.NewField("paths", nil, paths),
		data.NewField("namespaced", nil, namespaced),
	)

	frame.SetMeta(&data.FrameMeta{
		PreferredVisualization: data.VisTypeTable,
		Type:                   data.FrameTypeTable,
	})

	return frame, nil
}

// GetNamespaces return a list of all namespace names in the Kubernetes cluster
// as data frame.
func (c *client) GetNamespaces(ctx context.Context) (*data.Frame, error) {
	ctx, span := tracing.DefaultTracer().Start(ctx, "GetNamespaces")
	defer span.End()

	namespaces, err := c.clientset.CoreV1().Namespaces().List(ctx, metav1.ListOptions{})
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	var names []string
	for _, ns := range namespaces.Items {
		names = append(names, ns.Name)
	}

	frame := data.NewFrame(
		"Namespaces",
		data.NewField("values", nil, names),
	)

	frame.SetMeta(&data.FrameMeta{
		PreferredVisualization: data.VisTypeTable,
		Type:                   data.FrameTypeTable,
	})

	return frame, nil
}

// GetResources returns a list of resources from the Kuebrentes cluster as data
// frame. The data frame provides the same output as "kubectl get".
//
// The namespace parameter can also be a string with multiple namespaces in the
// form "namespace1,namespace2,..." (use "${variable:raw}" in a dashboard) or
// "*" for all namespaces. The namespace field is the splitted and the requests
// are run in parallel.
func (c *client) GetResources(ctx context.Context, user string, groups []string, resourceId, namespace, parameterName, parameterValue string, wide bool) (*data.Frame, error) {
	ctx, span := tracing.DefaultTracer().Start(ctx, "GetResources")
	defer span.End()
	span.SetAttributes(attribute.Key("user").String(user))
	span.SetAttributes(attribute.Key("groups").StringSlice(groups))
	span.SetAttributes(attribute.Key("resourceId").String(resourceId))
	span.SetAttributes(attribute.Key("namespace").String(namespace))
	span.SetAttributes(attribute.Key("parameterName").String(parameterName))
	span.SetAttributes(attribute.Key("parameterValue").String(parameterValue))
	span.SetAttributes(attribute.Key("wide").Bool(wide))

	c.refreshCache(ctx)

	resource, ok := c.cache.Get(resourceId)
	if !ok {
		err := fmt.Errorf("resource %s not found", resourceId)
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	if namespace == "*" || !resource.Namespaced {
		namespace = ""
	}
	namespaces := strings.Split(namespace, ",")

	// Check if the parameter name is "jsonPath" or "regex". If this is the
	// case, we remove the parameter name and value to get all resources without
	// filtering, because we will apply the JSONPath or regular expression later
	// when creating the data frame.
	var jsonPath string
	var regex *regexp.Regexp
	switch parameterName {
	case "jsonPath":
		jsonPath = parameterValue
		parameterName = ""
		parameterValue = ""
	case "regex":
		var err error
		regex, err = regexp.Compile(parameterValue)
		if err != nil {
			c.logger.Error("Failed to compile regex", "error", err.Error())
			span.RecordError(err)
			span.SetStatus(codes.Error, err.Error())
			return nil, err
		}
		parameterName = ""
		parameterValue = ""
	}
	parameterValues := strings.Split(parameterValue, "||")

	var errors []error
	errorsMutex := &sync.Mutex{}

	var resources [][]byte
	var resourcesJSONPath []NamespacedName
	resourcesMutex := &sync.Mutex{}

	var resourcesWG sync.WaitGroup
	resourcesWG.Add(len(namespaces) * len(parameterValues))

	for _, namespace := range namespaces {
		for _, parameterValue := range parameterValues {
			go func(namespace, parameterValue string) {
				defer resourcesWG.Done()
				c.logger.Debug("Getting resources", "name", resource.Name, "path", resource.Path, "namespace", namespace, "parameterName", parameterName, "parameterValue", parameterValue, "user", user)

				result, err := c.clientset.CoreV1().RESTClient().Get().AbsPath(resource.Path).Namespace(namespace).Resource(resource.Name).Param(parameterName, parameterValue).SetHeader("Accept", "application/json;as=Table;v=v1;g=meta.k8s.io,application/json;as=Table;v=v1beta1;g=meta.k8s.io,application/json").SetHeader("Impersonate-User", user).SetHeader("Impersonate-Group", groups...).DoRaw(ctx)
				if err != nil {
					c.logger.Error("Failed to get resources", "error", err.Error())
					span.RecordError(err)
					span.SetStatus(codes.Error, err.Error())

					errorsMutex.Lock()
					errors = append(errors, err)
					errorsMutex.Unlock()
					return
				}

				// If the user provided a JSONPath to filter the resources, we
				// also have to get all resources by the provided JSONPath, to
				// filter the resources later when creating the data frame.
				if jsonPath != "" {
					resultJSONPath, err := c.getResourcesByJSONPath(ctx, user, groups, resource, namespace, jsonPath)
					if err != nil {
						c.logger.Error("Failed to get JSONPath resources", "error", err.Error())
						span.RecordError(err)
						span.SetStatus(codes.Error, err.Error())

						errorsMutex.Lock()
						errors = append(errors, err)
						errorsMutex.Unlock()
						return
					}

					resourcesMutex.Lock()
					resources = append(resources, result)
					resourcesJSONPath = append(resourcesJSONPath, resultJSONPath...)
					resourcesMutex.Unlock()
				} else {
					resourcesMutex.Lock()
					resources = append(resources, result)
					resourcesMutex.Unlock()
				}
			}(namespace, parameterValue)
		}
	}

	resourcesWG.Wait()

	if len(resources) == 0 && len(errors) > 0 {
		return nil, errors[0]
	}

	return createResourcesDataFrame(resource, resources, resourcesJSONPath, jsonPath != "", wide, regex)
}

// getResourcesByJSONPath returns a list of resources as namespaced names
// filtered by the provided JSONPath.
//
// NOTE: This is required for the GetResources method, because we can not
// directly filter on the resources, which are retrieved in this method, because
// the do not contain the complete manifest.
func (c *client) getResourcesByJSONPath(ctx context.Context, user string, groups []string, resource Resource, namespace, jsonPath string) ([]NamespacedName, error) {
	result, err := c.clientset.CoreV1().RESTClient().Get().AbsPath(resource.Path).Namespace(namespace).Resource(resource.Name).SetHeader("Impersonate-User", user).SetHeader("Impersonate-Group", groups...).DoRaw(ctx)
	if err != nil {
		return nil, err
	}

	var resultMap map[string]any
	if err := json.Unmarshal(result, &resultMap); err != nil {
		return nil, err
	}

	jp := jsonpath.New("").AllowMissingKeys(true)

	if err := jp.Parse(jsonPath); err != nil {
		return nil, fmt.Errorf("error parsing JSONPath: %w", err)
	}

	results, err := jp.FindResults(resultMap)
	if err != nil {
		return nil, fmt.Errorf("error finding results for jsonpath: %w", err)
	}

	var found []NamespacedName
	for _, result := range results {
		for _, r := range result {
			if item, ok := r.Interface().(map[string]any); ok {
				if metadata, ok := item["metadata"].(map[string]any); ok {
					var namespace string
					var name string

					if ns, ok := metadata["namespace"].(string); ok {
						namespace = ns
					}
					if n, ok := metadata["name"].(string); ok {
						name = n
					}

					found = append(found, NamespacedName{
						Namespace: namespace,
						Name:      name,
					})
				}
			}
		}
	}

	return found, nil
}

// GetContainer returns a list of all containers for the requested resource
// ("daemonsets", "deployments", "jobs", "pods" or "statefulsets") as data
// frame.
func (c *client) GetContainers(ctx context.Context, user string, groups []string, resourceId, namespace, name string) (*data.Frame, error) {
	ctx, span := tracing.DefaultTracer().Start(ctx, "GetContainers")
	defer span.End()
	span.SetAttributes(attribute.Key("user").String(user))
	span.SetAttributes(attribute.Key("groups").StringSlice(groups))
	span.SetAttributes(attribute.Key("resourceId").String(resourceId))
	span.SetAttributes(attribute.Key("namespace").String(namespace))
	span.SetAttributes(attribute.Key("name").String(name))

	_, containers, err := c.getPodsAndContainers(ctx, user, groups, resourceId, namespace, name)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	frame := data.NewFrame(
		"Containers",
		data.NewField("values", nil, containers),
	)

	frame.SetMeta(&data.FrameMeta{
		PreferredVisualization: data.VisTypeTable,
		Type:                   data.FrameTypeTable,
	})

	return frame, nil
}

// getPodsAndContainers returns the names of all pods and containers for the
// requested resource ("daemonsets", "deployments", "jobs", "pods" or
// "statefulsets").
//
// If the resource is a pod, the function returns the name of the pod and all
// containers in the pod. If the resource is a daemonset, deployment, job or
// statefulset, the function returns the names of all pods belonging to the
// resource and all containers in the first pod (if there are any pods).
func (c *client) getPodsAndContainers(ctx context.Context, user string, groups []string, resourceId, namespace, name string) ([]string, []string, error) {
	ctx, span := tracing.DefaultTracer().Start(ctx, "getPodsAndContainers")
	defer span.End()
	span.SetAttributes(attribute.Key("user").String(user))
	span.SetAttributes(attribute.Key("groups").StringSlice(groups))
	span.SetAttributes(attribute.Key("resourceId").String(resourceId))
	span.SetAttributes(attribute.Key("namespace").String(namespace))
	span.SetAttributes(attribute.Key("name").String(name))

	c.refreshCache(ctx)

	switch resourceId {
	case "pod":
		resource, ok := c.cache.Get(resourceId)
		if !ok {
			err := fmt.Errorf("resource %s not found", resourceId)
			span.RecordError(err)
			span.SetStatus(codes.Error, err.Error())
			return nil, nil, err
		}

		result, err := c.clientset.CoreV1().RESTClient().Get().AbsPath(resource.Path).Namespace(namespace).Resource(resource.Name).Name(name).SetHeader("Impersonate-User", user).SetHeader("Impersonate-Group", groups...).DoRaw(ctx)
		if err != nil {
			span.RecordError(err)
			span.SetStatus(codes.Error, err.Error())
			return nil, nil, err
		}

		var pod corev1.Pod
		if err := json.Unmarshal(result, &pod); err != nil {
			span.RecordError(err)
			span.SetStatus(codes.Error, err.Error())
			return nil, nil, err
		}

		var containers []string
		for _, container := range pod.Spec.Containers {
			containers = append(containers, container.Name)
		}
		for _, container := range pod.Spec.InitContainers {
			containers = append(containers, container.Name)
		}

		return []string{name}, containers, nil

	default:
		resource, ok := c.cache.Get(resourceId)
		if !ok {
			err := fmt.Errorf("resource %s not found", resourceId)
			span.RecordError(err)
			span.SetStatus(codes.Error, err.Error())
			return nil, nil, err
		}

		result, err := c.clientset.CoreV1().RESTClient().Get().AbsPath(resource.Path).Namespace(namespace).Resource(resource.Name).Name(name).SetHeader("Impersonate-User", user).SetHeader("Impersonate-Group", groups...).DoRaw(ctx)
		if err != nil {
			span.RecordError(err)
			span.SetStatus(codes.Error, err.Error())
			return nil, nil, err
		}

		var app App
		if err := json.Unmarshal(result, &app); err != nil {
			span.RecordError(err)
			span.SetStatus(codes.Error, err.Error())
			return nil, nil, err
		}

		pods, err := c.clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{
			LabelSelector: metav1.FormatLabelSelector(app.Spec.Selector),
		})
		if err != nil {
			span.RecordError(err)
			span.SetStatus(codes.Error, err.Error())
			return nil, nil, err
		}

		var names []string
		var containers []string

		for _, pod := range pods.Items {
			names = append(names, pod.Name)

			for _, container := range pods.Items[0].Spec.Containers {
				if !slices.Contains(containers, container.Name) {
					containers = append(containers, container.Name)
				}
			}
			for _, container := range pods.Items[0].Spec.InitContainers {
				if !slices.Contains(containers, container.Name) {
					containers = append(containers, container.Name)
				}
			}
		}

		return names, containers, nil
	}
}

// GetLogs returns the logs for the requested resource as data frame. If the
// resource is a pod the logs for the pod are returned. If the resource is a
// daemonset, deployment, job or statefulset, the logs for all pods belonging to
// the resource are returned.
//
// The logs are fetched in parallel for all pods and combined into a single
// data frame. Each log line is prefixed with a timestamp in RFC3339Nano format
// and is split into two fields: "timestamp" and "body". The "body" field
// contains the log line itself.
//
// If the log line is a JSON object, the log line is parsed and stored in the
// "labels" field as JSON object.
//
// The filter parameter is a regular expression that is used to filter the log
// lines. Only log lines that match the regular expression are included in the
// data frame.
//
// The timeRange parameter is used to filter the log lines based on their
// timestamp. Only log lines that are within the time range are included in the
// data frame.
func (c *client) GetLogs(ctx context.Context, user string, groups []string, resourceId, namespace, name, container, filter string, tail int64, previous bool, timeRange backend.TimeRange) (*data.Frame, error) {
	ctx, span := tracing.DefaultTracer().Start(ctx, "GetLogs")
	defer span.End()
	span.SetAttributes(attribute.Key("user").String(user))
	span.SetAttributes(attribute.Key("groups").StringSlice(groups))
	span.SetAttributes(attribute.Key("resourceId").String(resourceId))
	span.SetAttributes(attribute.Key("namespace").String(namespace))
	span.SetAttributes(attribute.Key("name").String(name))
	span.SetAttributes(attribute.Key("container").String(container))
	span.SetAttributes(attribute.Key("filter").String(filter))
	span.SetAttributes(attribute.Key("tail").Int64(tail))
	span.SetAttributes(attribute.Key("previous").Bool(previous))

	// Get the pods for the requested resource.
	pods, _, err := c.getPodsAndContainers(ctx, user, groups, resourceId, namespace, name)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	// Get the logs for all pods in parallel.
	var streams []Stream
	streamsMutex := &sync.Mutex{}

	var streamsWG sync.WaitGroup
	streamsWG.Add(len(pods))

	for _, pod := range pods {
		go func(pod string) {
			defer streamsWG.Done()

			options := &corev1.PodLogOptions{
				Container:  container,
				Previous:   previous,
				Timestamps: true,
				SinceTime:  &metav1.Time{Time: timeRange.From},
			}
			if tail > 0 {
				options.TailLines = &tail
			}

			stream, err := c.clientset.CoreV1().Pods(namespace).GetLogs(pod, options).Stream(ctx)
			if err != nil {
				span.RecordError(err)
				span.SetStatus(codes.Error, err.Error())
				c.logger.Error("Failed to get stream", "error", err.Error())
				return
			}

			streamsMutex.Lock()
			streams = append(streams, Stream{Pod: pod, Stream: stream})
			streamsMutex.Unlock()
		}(pod)
	}

	streamsWG.Wait()

	// Ensure that all streams are closed when we are done.
	defer func() {
		for _, stream := range streams {
			stream.Stream.Close()
		}
	}()

	// Loop over all streams and parse the log lines, to create the values for
	// the data frame.
	var timestamps []time.Time
	var bodys []string
	var labels []json.RawMessage

	var r *regexp.Regexp
	if filter != "" {
		r, err = regexp.Compile(filter)
		if err != nil {
			span.RecordError(err)
			span.SetStatus(codes.Error, err.Error())
			return nil, err
		}
	}

	for _, stream := range streams {
		scanner := bufio.NewScanner(stream.Stream)
		for scanner.Scan() {
			parts := strings.SplitN(scanner.Text(), " ", 2)
			if len(parts) != 2 {
				continue
			}

			timestamp, err := time.Parse(time.RFC3339Nano, parts[0])
			if err != nil {
				span.RecordError(err)
				span.SetStatus(codes.Error, err.Error())
				c.logger.Error("Failed to parse timestamp", "error", err.Error())
				continue
			}

			if r != nil && !r.MatchString(parts[1]) {
				continue
			}

			var label json.RawMessage
			if err := json.Unmarshal([]byte(strings.Replace(parts[1], "{", `{"pod": "`+stream.Pod+`", `, 1)), &label); err != nil {
				label = json.RawMessage(fmt.Sprintf(`{"pod": "%s"}`, stream.Pod))
			}

			if timestamp.After(timeRange.From) && timestamp.Before(timeRange.To) {
				timestamps = append(timestamps, timestamp)
				bodys = append(bodys, parts[1])
				labels = append(labels, label)
			}
		}

		if err := scanner.Err(); err != nil {
			span.RecordError(err)
			span.SetStatus(codes.Error, err.Error())
			return nil, err
		}
	}

	frame := data.NewFrame(
		"Logs",
		data.NewField("timestamp", nil, timestamps),
		data.NewField("body", nil, bodys),
		data.NewField("labels", nil, labels),
	)

	frame.SetMeta(&data.FrameMeta{
		PreferredVisualization: data.VisTypeLogs,
		Type:                   data.FrameTypeLogLines,
	})

	return frame, nil
}

// StreamLogs streams the logs for the requested resource as data frame. If the
// resource is a pod the logs for the pod are streamed. If the resource is a
// daemonset, deployment, job or statefulset, the logs for all pods belonging to
// the resource are streamed.
//
// The logs are fetched in parallel for all pods and sent to the stream sender.
// Each log line is prefixed with a timestamp in RFC3339Nano format and is split
// into two fields: "timestamp" and "body". The "body" field contains the log
// line itself.
//
// If the log line is a JSON object, the log line is parsed and stored in the
// "labels" field as JSON object.
//
// The filter parameter is a regular expression that is used to filter the log
// lines. Only log lines that match the regular expression are sent to the
// stream sender.
func (c *client) StreamLogs(ctx context.Context, user string, groups []string, resourceId, namespace, name, container, filter string, sender *backend.StreamSender) error {
	ctx, span := tracing.DefaultTracer().Start(ctx, "StreamLogs")
	defer span.End()
	span.SetAttributes(attribute.Key("user").String(user))
	span.SetAttributes(attribute.Key("groups").StringSlice(groups))
	span.SetAttributes(attribute.Key("resourceId").String(resourceId))
	span.SetAttributes(attribute.Key("namespace").String(namespace))
	span.SetAttributes(attribute.Key("name").String(name))
	span.SetAttributes(attribute.Key("container").String(container))
	span.SetAttributes(attribute.Key("filter").String(filter))

	// Get the pods for the requested resource.
	pods, _, err := c.getPodsAndContainers(ctx, user, groups, resourceId, namespace, name)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return err
	}

	var r *regexp.Regexp
	if filter != "" {
		r, err = regexp.Compile(filter)
		if err != nil {
			span.RecordError(err)
			span.SetStatus(codes.Error, err.Error())
			return err
		}
	}

	var streamsWG sync.WaitGroup
	streamsWG.Add(len(pods))

	for _, pod := range pods {
		go func(pod string) {
			defer streamsWG.Done()

			options := &corev1.PodLogOptions{
				Container:  container,
				Timestamps: true,
				Follow:     true,
			}

			stream, err := c.clientset.CoreV1().Pods(namespace).GetLogs(pod, options).Stream(ctx)
			if err != nil {
				span.RecordError(err)
				span.SetStatus(codes.Error, err.Error())
				c.logger.Error("Failed to get stream", "error", err.Error())
				return
			}
			defer stream.Close()

			scanner := bufio.NewScanner(stream)
			for scanner.Scan() {
				select {
				case <-ctx.Done():
					return
				default:
					parts := strings.SplitN(scanner.Text(), " ", 2)
					if len(parts) != 2 {
						continue
					}

					timestamp, err := time.Parse(time.RFC3339Nano, parts[0])
					if err != nil {
						span.RecordError(err)
						span.SetStatus(codes.Error, err.Error())
						c.logger.Error("Failed to parse timestamp", "error", err.Error())
						continue
					}

					if r != nil && !r.MatchString(parts[1]) {
						continue
					}

					var label json.RawMessage
					if err := json.Unmarshal([]byte(strings.Replace(parts[1], "{", `{"pod": "`+pod+`", `, 1)), &label); err != nil {
						label = json.RawMessage(fmt.Sprintf(`{"pod": "%s"}`, pod))
					}

					frame := data.NewFrame(
						"Logs",
						data.NewField("timestamp", nil, []time.Time{timestamp}),
						data.NewField("body", nil, []string{parts[1]}),
						data.NewField("labels", nil, []json.RawMessage{label}),
					)

					frame.SetMeta(&data.FrameMeta{
						PreferredVisualization: data.VisTypeLogs,
						Type:                   data.FrameTypeLogLines,
					})

					if err := sender.SendFrame(frame, data.IncludeAll); err != nil {
						c.logger.Error("Failed to send frame", "error", err.Error())
						return
					}
				}
			}

			if err := scanner.Err(); err != nil {
				span.RecordError(err)
				span.SetStatus(codes.Error, err.Error())
			}
		}(pod)
	}

	streamsWG.Wait()
	return nil
}

// GetResource returns the resource for the given resource ID from the cache. If
// the resource is not found in the cache, an error is returned.
func (c *client) GetResource(ctx context.Context, resourceId string) (*Resource, error) {
	ctx, span := tracing.DefaultTracer().Start(ctx, "GetResource")
	defer span.End()
	span.SetAttributes(attribute.Key("resourceId").String(resourceId))

	c.refreshCache(ctx)

	resource, ok := c.cache.Get(resourceId)
	if !ok {
		err := fmt.Errorf("resource %s not found", resourceId)
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	return &resource, nil
}

// Proxy proxies a request to the Kubernetes API server. The request is
// modified to add the "Impersonate-User" header with the given user. The
// "Authorization" header is removed from the request.
//
// Create a user for testing:
//
//	kubectl create clusterrole grafana-admin-user --verb list,get --resource pods
//	kubectl create clusterrolebinding grafana-admin-user --clusterrole grafana-admin-user --user admin
//	kubectl create clusterrole grafana-admin-team --verb list,get --resource pods
//	kubectl create clusterrolebinding grafana-admin-team --clusterrole grafana-admin-team --group admin
//
//	kubectl delete clusterrolebinding grafana-admin-user
//	kubectl delete clusterrole grafana-admin-user
//	kubectl delete clusterrolebinding grafana-admin-team
//	kubectl delete clusterrole grafana-admin-team
//
// Caddy (required for kubectl, because token is only send when https is used):
//
//	caddy run --config /tmp/Caddyfile
//
//	grafana.localhost {
//	  reverse_proxy localhost:3000
//	}
func (c *client) Proxy(user string, groups []string, requestUrl string, w http.ResponseWriter, r *http.Request) {
	ctx, span := tracing.DefaultTracer().Start(r.Context(), "Proxy")
	defer span.End()

	span.SetAttributes(attribute.Key("user").String(user))
	span.SetAttributes(attribute.Key("groups").StringSlice(groups))
	span.SetAttributes(attribute.Key("method").String(r.Method))
	span.SetAttributes(attribute.Key("requestUrl").String(requestUrl))

	r.Header.Del("Authorization")

	// Parse the URL of the request and create a new URL for the request against
	// the Kubernetes API server.
	url, err := url.Parse(fmt.Sprintf("%s/%s", c.restConfig.Host, requestUrl))
	if err != nil {
		c.logger.Error("Failed to parse url", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, "Failed to parse url", http.StatusBadGateway)
		return
	}

	// Create round tripper for the request based on the Kubernetes rest config.
	tlsConfig, err := rest.TLSConfigFor(c.restConfig)
	if err != nil {
		c.logger.Error("Failed to create tls config", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, "Failed to create tls config", http.StatusBadGateway)
		return
	}

	tlsTransport := otelhttp.NewTransport(&http.Transport{
		Proxy:           http.ProxyFromEnvironment,
		TLSClientConfig: tlsConfig,
	})

	restTransportConfig, err := c.restConfig.TransportConfig()
	if err != nil {
		c.logger.Error("Failed to create transporter config", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, "Failed to create transporter config", http.StatusBadGateway)
		return
	}

	clientRoundTripper, err := transport.HTTPWrappersForConfig(restTransportConfig, tlsTransport)
	if err != nil {
		c.logger.Error("Failed to create round tripper", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, "Failed to create round tripper", http.StatusBadGateway)
		return
	}

	// Create the reverse proxy and modify the request. Then use the proxy to
	// serve the request.
	proxy := httputil.NewSingleHostReverseProxy(url)
	proxy.Transport = clientRoundTripper
	proxy.FlushInterval = -1
	proxy.ModifyResponse = func(resp *http.Response) error {
		c.logger.Info("Proxy", "user", user, "groups", groups, "method", r.Method, "requestUrl", requestUrl, "responseCode", resp.StatusCode)
		span.SetAttributes(attribute.Key("responseCode").Int(resp.StatusCode))
		return nil
	}

	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		otel.GetTextMapPropagator().Inject(ctx, propagation.HeaderCarrier(req.Header))

		req.URL = url

		if req.Header == nil {
			req.Header = make(http.Header)
		}

		// Always delete the impersonate user, uid and group headers, to ensure
		// that privileges can not be escalated. Then set the impersonate user
		// and group header if the feature is enabled and a user and list of
		// groups was provided.
		//
		// NOTE: This also means that we do not support the "--as", "--as-uid"
		// and "--as-group" flags of kubectl.
		req.Header.Del("Impersonate-User")
		req.Header.Del("Impersonate-Uid")
		req.Header.Del("Impersonate-Group")

		if user != "" {
			req.Header.Add("Impersonate-User", user)
		}

		for _, group := range groups {
			req.Header.Add("Impersonate-Group", group)
		}
	}

	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		c.logger.Error("Client request failed", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, "Client request failed", http.StatusBadGateway)
	}

	proxy.ServeHTTP(w, r)
}

// NewClient creates a new Kubernetes client, which is used by the datasource to
// interact with the Kubernetes cluster. To create a new Kubernetes client we
// create a new "restConfig" using the "newRestConfig" function first. The rest
// config is then used to create a new "clientset". The last step in the client
// creation is to create a new "cache".
func NewClient(ctx context.Context, config *models.PluginSettings, logger log.Logger) (Client, error) {
	restConfig, err := newRestConfig(config)
	if err != nil {
		return nil, err
	}

	restConfig.WrapTransport = func(rt http.RoundTripper) http.RoundTripper {
		return otelhttp.NewTransport(rt)
	}

	clientset, err := kubernetes.NewForConfig(restConfig)
	if err != nil {
		return nil, err
	}

	discoveryClient, err := discovery.NewDiscoveryClientForConfig(restConfig)
	if err != nil {
		return nil, err
	}

	client := &client{
		logger:          logger,
		restConfig:      restConfig,
		clientset:       clientset,
		discoveryClient: discoveryClient,
	}

	// Use the "client" to get a map of all resources in the cluster. The map
	// contains all default Kubernetes resources and CustomResourceDefinitions
	// deployed in the cluster and is used to initialize a new cache.
	resources, err := client.getResources(ctx)
	if err != nil {
		return nil, err
	}
	client.cache = NewCache(resources)

	return client, nil
}

// newRestConfig creates a new rest config based on the user configuration of
// the datasource:
//   - "incluster" uses the in cluster configuration. To use this option Grafana
//     must be deployed in a Kubernetes cluster and must use a ServiceAccount
//     with all the permissions needed to interact with the cluster.
//   - "path" reads a Kubeconfig file from the provided path and uses the
//     provided `context` to create a new rest config. The "context" is required
//     for the case that the Kubeconfig file contains multiple contexts.
//   - "kubeconfig" uses the provided "kubeconfig" to create a new rest config.
func newRestConfig(config *models.PluginSettings) (*rest.Config, error) {
	switch config.ClusterProvider {
	case "incluster":
		return rest.InClusterConfig()
	case "path":
		return clientcmd.NewNonInteractiveDeferredLoadingClientConfig(
			&clientcmd.ClientConfigLoadingRules{ExplicitPath: config.ClusterPath},
			&clientcmd.ConfigOverrides{
				CurrentContext: config.ClusterContext,
			},
		).ClientConfig()
	case "kubeconfig":
		c, err := clientcmd.NewClientConfigFromBytes([]byte(config.Secrets.ClusterKubeconfig))
		if err != nil {
			return nil, err
		}
		return c.ClientConfig()
	default:
		return nil, fmt.Errorf("invalid provider: %s", config.ClusterProvider)
	}
}
