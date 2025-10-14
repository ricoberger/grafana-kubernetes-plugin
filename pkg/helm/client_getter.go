package helm

import (
	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/discovery/cached/memory"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/restmapper"
	"k8s.io/client-go/tools/clientcmd"
)

// RESTClientGetter defines the values of a Helm REST client.
type RESTClientGetter struct {
	user       string
	groups     []string
	namespace  string
	restConfig *rest.Config

	opts []RESTClientOption
}

// RESTClientOption is a function that can be used to set the RESTClientOptions
// of a HelmClient.
type RESTClientOption func(*rest.Config)

// NewRESTClientGetter returns a RESTClientGetter using the provided "user",
// "groups", "namespace" and "restConfig".
//
// Source: https://github.com/helm/helm/issues/6910#issuecomment-601277026
func NewRESTClientGetter(user string, groups []string, namespace string, restConfig *rest.Config, opts ...RESTClientOption) *RESTClientGetter {
	return &RESTClientGetter{
		user:       user,
		groups:     groups,
		namespace:  namespace,
		restConfig: restConfig,
		opts:       opts,
	}
}

// ToRESTConfig returns a REST config build from a given kubeconfig
func (c *RESTClientGetter) ToRESTConfig() (*rest.Config, error) {
	c.restConfig.Impersonate.UserName = c.user
	c.restConfig.Impersonate.Groups = c.groups

	return c.restConfig, nil
}

// ToDiscoveryClient returns a CachedDiscoveryInterface that can be used as a
// discovery client.
func (c *RESTClientGetter) ToDiscoveryClient() (discovery.CachedDiscoveryInterface, error) {
	config, err := c.ToRESTConfig()
	if err != nil {
		return nil, err
	}

	// The more API groups exist, the more discovery requests need to be made.
	// Given 25 API groups with about one version each, discovery needs to make
	// 50 requests.
	// This setting is only used for discovery.
	config.Burst = 100

	for _, fn := range c.opts {
		fn(config)
	}

	discoveryClient, _ := discovery.NewDiscoveryClientForConfig(config)
	return memory.NewMemCacheClient(discoveryClient), nil
}

func (c *RESTClientGetter) ToRESTMapper() (meta.RESTMapper, error) {
	discoveryClient, err := c.ToDiscoveryClient()
	if err != nil {
		return nil, err
	}

	mapper := restmapper.NewDeferredDiscoveryRESTMapper(discoveryClient)
	expander := restmapper.NewShortcutExpander(mapper, discoveryClient, nil)
	return expander, nil
}

func (c *RESTClientGetter) ToRawKubeConfigLoader() clientcmd.ClientConfig {
	loadingRules := clientcmd.NewDefaultClientConfigLoadingRules()
	// use the standard defaults for this client command
	// DEPRECATED: remove and replace with something more accurate
	loadingRules.DefaultClientConfig = &clientcmd.DefaultClientConfig

	overrides := &clientcmd.ConfigOverrides{ClusterDefaults: clientcmd.ClusterDefaults}
	overrides.Context.Namespace = c.namespace

	return clientcmd.NewNonInteractiveDeferredLoadingClientConfig(loadingRules, overrides)
}
