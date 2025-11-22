package utils

import (
	"context"
	"os"
	"os/exec"
	"runtime"
	"strings"
)

// OpenUrl opens the provided url in the users default browser.
func OpenUrl(url string) error {
	var cmd string
	var args []string

	switch runtime.GOOS {
	case "windows":
		cmd = "cmd"
		args = []string{"/c", "start", url}
	case "darwin":
		cmd = "open"
		args = []string{url}
	default:
		if isWSL() {
			cmd = "cmd.exe"
			args = []string{"/c", "start", url}
		} else {
			cmd = "xdg-open"
			args = []string{url}
		}
	}
	if len(args) > 1 {
		args = append(args[:1], append([]string{""}, args[1:]...)...)
	}
	return exec.CommandContext(context.Background(), cmd, args...).Start()
}

func isWSL() bool {
	releaseData, err := exec.CommandContext(context.Background(), "uname", "-r").Output()
	if err != nil {
		return false
	}
	return strings.Contains(strings.ToLower(string(releaseData)), "microsoft")
}

// ExpandEnv replaces all environment variables in the provided string. The
// environment variables can be in the form `${var}` or `$var`. If the string
// should contain a `$` it can be escaped via `$$`.
func ExpandEnv(s string) string {
	os.Setenv("CRANE_DOLLAR", "$")
	return os.ExpandEnv(strings.ReplaceAll(s, "$$", "${CRANE_DOLLAR}"))
}
