package main

import (
	"log/slog"
	"os"

	"github.com/ricoberger/grafana-kubernetes-plugin/cmd/kubectl-grafana/credentials"
	"github.com/ricoberger/grafana-kubernetes-plugin/cmd/kubectl-grafana/kubeconfig"
	"github.com/ricoberger/grafana-kubernetes-plugin/cmd/kubectl-grafana/version"

	"github.com/alecthomas/kong"
	_ "github.com/joho/godotenv/autoload"
)

var cli struct {
	Kubeconfig  kubeconfig.Cmd  `cmd:"kubeconfig" help:"Download a Kubeconfig from a Grafana instance with the \"Grafana Kubernetes Plugin\" installed."`
	Credentials credentials.Cmd `cmd:"credentials" help:"Generate \"ExecCredential\" for a Kubeconfig downloaded via the \"kubeconfig\" command."`
	Version     version.Cmd     `cmd:"version" help:"Show version information."`
}

func main() {
	ctx := kong.Parse(&cli, kong.Name("kubectl grafana"))
	err := ctx.Run()
	if err != nil {
		slog.Error("Failed to run command", slog.Any("error", err))
		os.Exit(1)
	}
}
