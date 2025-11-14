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
	GetKeysAndKinds() ([]string, []string)
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

func (c *cache) GetKeysAndKinds() ([]string, []string) {
	c.lock.RLock()
	defer c.lock.RUnlock()

	var keys []string
	var kinds []string
	for k, v := range c.resources {
		keys = append(keys, k)
		kinds = append(kinds, v.Kind)
	}
	return keys, kinds
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
