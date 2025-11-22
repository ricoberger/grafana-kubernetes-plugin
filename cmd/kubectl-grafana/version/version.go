package version

import (
	"bytes"
	"fmt"
	"os"
	"runtime"
	"strings"
	"text/template"
)

// Build information. Populated at build-time.
var (
	Version   string
	Revision  string
	Branch    string
	BuildUser string
	BuildDate string
	GoVersion = runtime.Version()
)

var versionInfoTmpl = `
{{.program}}, version {{.version}} (branch: {{.branch}}, revision: {{.revision}})
  build user:       {{.buildUser}}
  build date:       {{.buildDate}}
  go version:       {{.goVersion}}
`

type Cmd struct {
}

func (r *Cmd) Run() error {
	data := map[string]string{
		"program":   "kubectl grafana",
		"version":   Version,
		"revision":  Revision,
		"branch":    Branch,
		"buildUser": BuildUser,
		"buildDate": BuildDate,
		"goVersion": GoVersion,
	}

	var buf bytes.Buffer

	tmpl := template.Must(template.New("version").Parse(versionInfoTmpl))
	tmpl.ExecuteTemplate(&buf, "version", data)

	fmt.Fprintln(os.Stdout, strings.TrimSpace(buf.String()))
	return nil
}
