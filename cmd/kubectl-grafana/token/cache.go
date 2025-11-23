package token

import (
	"encoding/json"
	"os"
	"path/filepath"
	"time"

	clientauthenticationv1 "k8s.io/client-go/pkg/apis/clientauthentication/v1"
)

type Cache struct {
	cacheFile string
}

func NewCache(name string) (*Cache, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}

	cacheDir := filepath.Join(homeDir, ".kube", "cache", "kubectl-grafana")
	if err := os.MkdirAll(cacheDir, 0700); err != nil {
		return nil, err
	}

	return &Cache{
		cacheFile: filepath.Join(cacheDir, name),
	}, nil
}

func (c *Cache) Get() (*clientauthenticationv1.ExecCredential, error) {
	data, err := os.ReadFile(c.cacheFile)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}

	var execCredential clientauthenticationv1.ExecCredential
	if err := json.Unmarshal(data, &execCredential); err != nil {
		return nil, err
	}

	if execCredential.Status != nil && execCredential.Status.ExpirationTimestamp != nil {
		if time.Now().After(execCredential.Status.ExpirationTimestamp.Time) {
			return nil, nil
		}
	}

	return &execCredential, nil
}

func (c *Cache) Set(credentials string) error {
	if err := os.WriteFile(c.cacheFile, []byte(credentials), 0600); err != nil {
		return err
	}

	return nil
}
