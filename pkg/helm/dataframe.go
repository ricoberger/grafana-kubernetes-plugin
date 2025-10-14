package helm

import (
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/data"
	"helm.sh/helm/v3/pkg/release"
)

func createReleasesDataFrame(releases []*release.Release) *data.Frame {
	fields := []*data.Field{
		data.NewField("Namespace", nil, []string{}),
		data.NewField("Name", nil, []string{}),
		data.NewField("Revision", nil, []int64{}),
		data.NewField("Updated", nil, []time.Time{}),
		data.NewField("Status", nil, []string{}),
		data.NewField("Chart", nil, []string{}),
		data.NewField("AppVersion", nil, []string{}),
		data.NewField("Description", nil, []string{}),
	}

	for _, release := range releases {
		var lastDeployed time.Time
		var status string
		var chart string
		var appVersion string
		var description string

		if release.Info != nil {
			lastDeployed = release.Info.LastDeployed.Time
			status = release.Info.Status.String()
			description = release.Info.Description
		}

		if release.Chart != nil && release.Chart.Metadata != nil {
			chart = release.Chart.Metadata.Name + "-" + release.Chart.Metadata.Version
			appVersion = release.Chart.Metadata.AppVersion
		}

		fields[0].Append(release.Namespace)
		fields[1].Append(release.Name)
		fields[2].Append(int64(release.Version))
		fields[3].Append(lastDeployed)
		fields[4].Append(status)
		fields[5].Append(chart)
		fields[6].Append(appVersion)
		fields[7].Append(description)
	}

	frame := data.NewFrame("Releases", fields...)

	frame.SetMeta(&data.FrameMeta{
		PreferredVisualization: data.VisTypeTable,
		Type:                   data.FrameTypeTable,
	})

	return frame
}
