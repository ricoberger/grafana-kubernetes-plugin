package kubernetes

import (
	"sync"
	"time"
)

// Cache is a thread-safe cache for Kubernetes resources. It provides methods
// to check if the cache is still valid, get all keys, get a specific resource
// by its ID, and set all resources at once.
type Cache interface {
	IsValid() bool
	GetDataFrameValues() ([]string, []string, []string, []string, []string, []string)
	Get(id string) (Resource, bool)
	SetAll(resources map[string]Resource)
}

type cache struct {
	resources map[string]Resource
	time      time.Time
	lock      sync.RWMutex
}

func (c *cache) IsValid() bool {
	if c.time.Before(time.Now().Add(-1 * time.Hour)) {
		return false
	}

	if len(c.resources) == 0 {
		return false
	}

	return true
}

func (c *cache) GetDataFrameValues() ([]string, []string, []string, []string, []string, []string) {
	c.lock.RLock()
	defer c.lock.RUnlock()

	var ids []string
	var kinds []string
	var names []string
	var apiVersions []string
	var paths []string
	var namespaced []string

	for _, v := range c.resources {
		ids = append(ids, v.ID)
		kinds = append(kinds, v.Kind)
		names = append(names, v.Name)
		apiVersions = append(apiVersions, v.APIVersion)
		paths = append(paths, v.Path)
		if v.Namespaced {
			namespaced = append(namespaced, "true")
		} else {
			namespaced = append(namespaced, "false")
		}
	}
	return ids, kinds, apiVersions, names, paths, namespaced
}

func (c *cache) Get(id string) (Resource, bool) {
	c.lock.RLock()
	defer c.lock.RUnlock()

	resource, exists := c.resources[id]
	return resource, exists
}

func (c *cache) SetAll(resources map[string]Resource) {
	c.lock.Lock()
	defer c.lock.Unlock()

	c.resources = resources
	c.time = time.Now()
}

func NewCache(resources map[string]Resource) Cache {
	return &cache{
		resources: resources,
		time:      time.Now(),
		lock:      sync.RWMutex{},
	}
}
