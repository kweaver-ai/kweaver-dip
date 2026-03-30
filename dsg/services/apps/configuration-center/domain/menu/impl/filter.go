package impl

import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/menu"
)

const (
	GlobalActionsKey = "*"
)

type MenuActionsFilter struct {
	actionMap     map[string][]string
	globalActions []string
}

func NewMenuFilter(m map[string][]string) *MenuActionsFilter {
	if m == nil {
		m = make(map[string][]string)
	}
	globalActions := make([]string, 0)
	if len(m[GlobalActionsKey]) > 0 {
		//globalActions = m[GlobalActionsKey]
		globalActions = []string{"read"}
	}
	return &MenuActionsFilter{
		actionMap:     m,
		globalActions: globalActions,
	}
}

func (m MenuActionsFilter) hasGlobal() bool {
	return len(m.globalActions) > 0
}

func (m MenuActionsFilter) Actions(key string) []string {
	if m.hasGlobal() {
		return m.globalActions
	}
	return m.actionMap[key]
}

func (m MenuActionsFilter) FilterMenu(mu *menu.Mu) bool {
	//非权限控制的菜单，其实每个人都该有
	if !mu.IsPermissionMenu() {
		return true
	}
	//过滤外层的
	actions := m.Actions(mu.Key)
	if len(actions) == 0 {
		return false
	}
	mu.Actions = actions
	//过滤子孙的
	var children []*menu.Mu
	for _, child := range mu.Children {
		has := m.FilterMenu(child)
		if has {
			children = append(children, child)
		}
	}
	mu.Children = children
	return true
}
