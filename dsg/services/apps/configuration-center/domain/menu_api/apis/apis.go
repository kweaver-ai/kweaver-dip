package apis

import (
	"fmt"
)

var mrs = newMenuResourceStore()

type MenuResourceStore struct {
	menuResources     []*MenuResource
	menuResourcesDict map[string]*MenuResource
	actionToOperation map[string]string
}

type MenuResource struct {
	ServiceName string `json:"service_name"`
	Path        string `json:"path"`
	Method      string `json:"method"`
	Desc        string `json:"description"`
}

func newMenuResourceStore() *MenuResourceStore {
	return &MenuResourceStore{
		menuResources:     make([]*MenuResource, 0),
		menuResourcesDict: make(map[string]*MenuResource),
		actionToOperation: map[string]string{
			"新增": "create",
			"修改": "update",
			"删除": "delete",
			"导出": "export",
			"查看": "display",
		},
	}
}

func Append(d *MenuResource) {
	mrs.menuResources = append(mrs.menuResources, d)
	mrs.menuResourcesDict[d.ID()] = d
}

func (p *MenuResource) ID() string {
	return fmt.Sprintf("%s%s", p.Path, p.Method)
}

func All() []*MenuResource {
	return mrs.menuResources
}
