//go:build mage
// +build mage

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"os/user"
	"path/filepath"
	"time"

	// mage:import
	build "github.com/grafana/grafana-plugin-sdk-go/build"
	"github.com/magefile/mage/mg"
	"github.com/magefile/mage/sh"
)

// Default configures the default target.
var Default = build.BuildAll

// Config holds the setup variables required for a build
type Config struct {
	OS   string // GOOS
	Arch string // GOOS
}

// BeforeBuildCallback hooks into the build process
type BeforeBuildCallback func(cfg Config) (Config, error)

func newBuildConfig(os string, arch string) Config {
	return Config{
		OS:   os,
		Arch: arch,
	}
}

func getVersion() string {
	packageJson := make(map[string]any)

	packageJsonFile, err := os.Open("package.json")
	if err != nil {
		return ""
	}

	jsonParser := json.NewDecoder(packageJsonFile)
	if err = jsonParser.Decode(&packageJson); err != nil {
		return ""
	}

	return packageJson["version"].(string)
}

func getGitInfo(args ...string) string {
	out, err := exec.CommandContext(context.Background(), "git", args...).Output()
	if err != nil {
		return ""
	}

	return string(out)
}

func buildBackend(cfg Config) error {
	env := map[string]string{
		"GOARCH":      cfg.Arch,
		"GOOS":        cfg.OS,
		"CGO_ENABLED": "0",
	}

	version := getVersion()
	revision := getGitInfo("rev-parse", "HEAD")
	branch := getGitInfo("rev-parse", "--abbrev-ref", "HEAD")
	buildDate := time.Now().Format(time.RFC3339)

	buildUser := ""
	user, _ := user.Current()
	if user != nil {
		buildUser = user.Username
	}

	args := []string{
		"build",
		"-o",
		filepath.Join("dist", "kubectl-grafana", fmt.Sprintf("kubectl-grafana-%s-%s", cfg.OS, cfg.Arch)),
		"-ldflags",
		fmt.Sprintf(`-w -s -extldflags "-static" -X github.com/ricoberger/grafana-kubernetes-plugin/cmd/kubectl-grafana/version.Version=%s -X github.com/ricoberger/grafana-kubernetes-plugin/cmd/kubectl-grafana/version.Revision=%s -X github.com/ricoberger/grafana-kubernetes-plugin/cmd/kubectl-grafana/version.Branch=%s -X github.com/ricoberger/grafana-kubernetes-plugin/cmd/kubectl-grafana/version.BuildUser=%s -X github.com/ricoberger/grafana-kubernetes-plugin/cmd/kubectl-grafana/version.BuildDate=%s`, version, revision, branch, buildUser, buildDate),
		"./cmd/kubectl-grafana",
	}

	return sh.RunWithV(env, "go", args...)
}

// BuildKubectl is a namespace.
type BuildKubectl mg.Namespace

// Linux builds the kubectl plugin for Linux.
func (BuildKubectl) Linux() error {
	return buildBackend(newBuildConfig("linux", "amd64"))
}

// LinuxARM builds the kubectl plugin for Linux on ARM.
func (BuildKubectl) LinuxARM() error {
	return buildBackend(newBuildConfig("linux", "arm"))
}

// LinuxARM64 builds the kubectl plugin for Linux on ARM64.
func (BuildKubectl) LinuxARM64() error {
	return buildBackend(newBuildConfig("linux", "arm64"))
}

// Windows builds the kubectl plugin for Windows.
func (BuildKubectl) Windows() error {
	return buildBackend(newBuildConfig("windows", "amd64"))
}

// Darwin builds the kubectl plugin for OSX on AMD64.
func (BuildKubectl) Darwin() error {
	return buildBackend(newBuildConfig("darwin", "amd64"))
}

// DarwinARM64 builds the kubectl plugin for OSX on ARM (M1/M2).
func (BuildKubectl) DarwinARM64() error {
	return buildBackend(newBuildConfig("darwin", "arm64"))
}

func BuildAllKubectl() {
	b := BuildKubectl{}
	mg.Deps(b.Linux, b.Windows, b.Darwin, b.DarwinARM64, b.LinuxARM64, b.LinuxARM)
}
