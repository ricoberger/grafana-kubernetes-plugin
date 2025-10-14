package helm

//go:generate go tool mockgen -source=client.go -destination=./client_mock.go -package=helm Client

import (
	"fmt"
	"os"
	"sort"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/registry"
	"helm.sh/helm/v3/pkg/release"
	"k8s.io/client-go/rest"
)

type RollbackOptions struct {
	CleanupOnFail bool   `json:"cleanupOnFail"`
	DryRun        bool   `json:"dryRun"`
	Force         bool   `json:"force"`
	MaxHistory    int    `json:"maxHistory"`
	DisableHooks  bool   `json:"disableHooks"`
	Recreate      bool   `json:"recreate"`
	Timeout       string `json:"timeout"`
	Wait          bool   `json:"wait"`
	WaitForJobs   bool   `json:"waitForJobs"`
}

type UninstallOptions struct {
	Cascade      string `json:"cascade"`
	DryRun       bool   `json:"dryRun"`
	KeepHistory  bool   `json:"keepHistory"`
	DisableHooks bool   `json:"disableHooks"`
	Timeout      string `json:"timeout"`
	Wait         bool   `json:"wait"`
}

type Client interface {
	ListReleases() (*data.Frame, error)
	GetRelease(name string, version int64) (*release.Release, error)
	ListReleaseHistory(name string) (*data.Frame, error)
	RollbackRelease(name string, version int64, options RollbackOptions) error
	UninstallRelease(name string, options UninstallOptions) (string, error)
}

type client struct {
	ActionConfig *action.Configuration
}

func (c *client) ListReleases() (*data.Frame, error) {
	listClient := action.NewList(c.ActionConfig)
	listClient.StateMask = action.ListDeployed

	releases, err := listClient.Run()
	if err != nil {
		return nil, err
	}

	return createReleasesDataFrame(releases), nil
}

func (c *client) GetRelease(name string, version int64) (*release.Release, error) {
	getReleaseClient := action.NewGet(c.ActionConfig)
	getReleaseClient.Version = int(version)

	return getReleaseClient.Run(name)
}

func (c *client) ListReleaseHistory(name string) (*data.Frame, error) {
	client := action.NewHistory(c.ActionConfig)
	client.Max = 10

	releases, err := client.Run(name)
	if err != nil {
		return nil, err
	}

	sort.Slice(releases, func(i, j int) bool {
		return releases[i].Version < releases[j].Version
	})

	return createReleasesDataFrame(releases), nil
}

func (c *client) RollbackRelease(name string, version int64, options RollbackOptions) error {
	rollbackClient := action.NewRollback(c.ActionConfig)
	rollbackClient.Version = int(version)

	timeoutDuration, err := time.ParseDuration(options.Timeout)
	if err != nil {
		return err
	}

	rollbackClient.CleanupOnFail = options.CleanupOnFail
	rollbackClient.DryRun = options.DryRun
	rollbackClient.Force = options.Force
	rollbackClient.MaxHistory = options.MaxHistory
	rollbackClient.DisableHooks = options.DisableHooks
	rollbackClient.Recreate = options.Recreate
	rollbackClient.Timeout = timeoutDuration
	rollbackClient.Wait = options.Wait
	rollbackClient.WaitForJobs = options.WaitForJobs

	return rollbackClient.Run(name)
}

func (c *client) UninstallRelease(name string, options UninstallOptions) (string, error) {
	uninstallClient := action.NewUninstall(c.ActionConfig)

	timeoutDuration, err := time.ParseDuration(options.Timeout)
	if err != nil {
		return "", err
	}

	uninstallClient.DeletionPropagation = options.Cascade
	uninstallClient.DryRun = options.DryRun
	uninstallClient.KeepHistory = options.KeepHistory
	uninstallClient.DisableHooks = options.DisableHooks
	uninstallClient.Timeout = timeoutDuration
	uninstallClient.Wait = options.Wait

	resp, err := uninstallClient.Run(name)
	if err != nil {
		return "", err
	}

	return resp.Info, nil
}

func NewClient(user string, groups []string, namespace string, restConfig *rest.Config, logger log.Logger) (Client, error) {
	clientGetter := NewRESTClientGetter(user, groups, namespace, restConfig)

	actionConfig := new(action.Configuration)
	err := actionConfig.Init(
		clientGetter,
		namespace,
		os.Getenv("HELM_DRIVER"),
		func(format string, v ...any) {
			logger.Info(fmt.Sprintf(format, v...))
		},
	)
	if err != nil {
		return nil, err
	}

	registryClient, err := registry.NewClient()
	if err != nil {
		return nil, err
	}

	actionConfig.RegistryClient = registryClient

	return &client{
		ActionConfig: actionConfig,
	}, nil
}
