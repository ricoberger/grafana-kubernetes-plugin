package helm

//go:generate go tool mockgen -source=client.go -destination=./client_mock.go -package=helm Client

import (
	"context"
	"fmt"
	"os"
	"sort"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/backend/tracing"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"helm.sh/helm/v4/pkg/action"
	"helm.sh/helm/v4/pkg/kube"
	"helm.sh/helm/v4/pkg/registry"
	releaser "helm.sh/helm/v4/pkg/release"
	release "helm.sh/helm/v4/pkg/release/v1"
	"k8s.io/client-go/rest"
)

type RollbackOptions struct {
	CleanupOnFail bool   `json:"cleanupOnFail"`
	DryRun        bool   `json:"dryRun"`
	Force         bool   `json:"force"`
	MaxHistory    int    `json:"maxHistory"`
	DisableHooks  bool   `json:"disableHooks"`
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
	ListReleases(ctx context.Context) (*data.Frame, error)
	GetRelease(ctx context.Context, name string, version int64) (*release.Release, error)
	ListReleaseHistory(ctx context.Context, name string) (*data.Frame, error)
	RollbackRelease(ctx context.Context, name string, version int64, options RollbackOptions) error
	UninstallRelease(ctx context.Context, name string, options UninstallOptions) (string, error)
}

type client struct {
	ActionConfig *action.Configuration
}

func (c *client) ListReleases(ctx context.Context) (*data.Frame, error) {
	_, span := tracing.DefaultTracer().Start(ctx, "ListReleases")
	defer span.End()

	listClient := action.NewList(c.ActionConfig)
	listClient.StateMask = action.ListDeployed

	releases, err := listClient.Run()
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	v1Releases, err := releasersToV1Releases(releases)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	return createReleasesDataFrame(v1Releases), nil
}

func (c *client) GetRelease(ctx context.Context, name string, version int64) (*release.Release, error) {
	_, span := tracing.DefaultTracer().Start(ctx, "GetRelease")
	defer span.End()
	span.SetAttributes(attribute.Key("name").String(name))
	span.SetAttributes(attribute.Key("version").Int64(version))

	getReleaseClient := action.NewGet(c.ActionConfig)
	getReleaseClient.Version = int(version)

	rel, err := getReleaseClient.Run(name)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	v1Release, err := releaserToV1Release(rel)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	return v1Release, nil
}

func (c *client) ListReleaseHistory(ctx context.Context, name string) (*data.Frame, error) {
	_, span := tracing.DefaultTracer().Start(ctx, "ListReleaseHistory")
	defer span.End()
	span.SetAttributes(attribute.Key("name").String(name))

	client := action.NewHistory(c.ActionConfig)
	client.Max = 10

	releases, err := client.Run(name)
	if err != nil {
		return nil, err
	}

	v1Releases, err := releasersToV1Releases(releases)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	sort.Slice(v1Releases, func(i, j int) bool {
		return v1Releases[i].Version < v1Releases[j].Version
	})

	return createReleasesDataFrame(v1Releases), nil
}

func (c *client) RollbackRelease(ctx context.Context, name string, version int64, options RollbackOptions) error {
	_, span := tracing.DefaultTracer().Start(ctx, "RollbackRelease")
	defer span.End()
	span.SetAttributes(attribute.Key("name").String(name))
	span.SetAttributes(attribute.Key("version").Int64(version))

	rollbackClient := action.NewRollback(c.ActionConfig)
	rollbackClient.Version = int(version)

	timeoutDuration, err := time.ParseDuration(options.Timeout)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return err
	}

	rollbackClient.CleanupOnFail = options.CleanupOnFail
	if options.DryRun {
		rollbackClient.DryRunStrategy = action.DryRunClient
	}
	rollbackClient.ForceReplace = options.Force
	rollbackClient.MaxHistory = options.MaxHistory
	rollbackClient.DisableHooks = options.DisableHooks
	rollbackClient.Timeout = timeoutDuration
	if options.Wait {
		rollbackClient.WaitStrategy = kube.StatusWatcherStrategy
	}
	rollbackClient.WaitForJobs = options.WaitForJobs

	err = rollbackClient.Run(name)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return err
	}

	return nil
}

func (c *client) UninstallRelease(ctx context.Context, name string, options UninstallOptions) (string, error) {
	_, span := tracing.DefaultTracer().Start(ctx, "UninstallRelease")
	defer span.End()
	span.SetAttributes(attribute.Key("name").String(name))

	uninstallClient := action.NewUninstall(c.ActionConfig)

	timeoutDuration, err := time.ParseDuration(options.Timeout)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return "", err
	}

	uninstallClient.DeletionPropagation = options.Cascade
	uninstallClient.DryRun = options.DryRun
	uninstallClient.KeepHistory = options.KeepHistory
	uninstallClient.DisableHooks = options.DisableHooks
	uninstallClient.Timeout = timeoutDuration
	if options.Wait {
		uninstallClient.WaitStrategy = kube.StatusWatcherStrategy
	}

	resp, err := uninstallClient.Run(name)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return "", err
	}

	return resp.Info, nil
}

func NewClient(ctx context.Context, user string, groups []string, namespace string, restConfig *rest.Config, logger log.Logger) (Client, error) {
	_, span := tracing.DefaultTracer().Start(ctx, "NewClient")
	defer span.End()
	span.SetAttributes(attribute.Key("user").String(user))
	span.SetAttributes(attribute.Key("groups").StringSlice(groups))
	span.SetAttributes(attribute.Key("namespace").String(namespace))

	clientGetter := NewRESTClientGetter(user, groups, namespace, restConfig)

	actionConfig := action.NewConfiguration()
	err := actionConfig.Init(
		clientGetter,
		namespace,
		os.Getenv("HELM_DRIVER"),
	)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	registryClient, err := registry.NewClient()
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	actionConfig.RegistryClient = registryClient

	return &client{
		ActionConfig: actionConfig,
	}, nil
}

func releaserToV1Release(rel releaser.Releaser) (*release.Release, error) {
	switch r := rel.(type) {
	case *release.Release:
		return r, nil
	case release.Release:
		return &r, nil
	case nil:
		return nil, nil
	default:
		return nil, fmt.Errorf("unsupported release type: %T", rel)
	}
}

func releasersToV1Releases(rels []releaser.Releaser) ([]*release.Release, error) {
	out := make([]*release.Release, 0, len(rels))
	for _, r := range rels {
		v1, err := releaserToV1Release(r)
		if err != nil {
			return nil, err
		}
		out = append(out, v1)
	}
	return out, nil
}
