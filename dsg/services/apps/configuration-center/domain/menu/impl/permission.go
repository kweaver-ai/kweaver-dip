package impl

import (
	"context"

	jsoniter "github.com/json-iterator/go"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/menu"
	"github.com/samber/lo"
)

// GetPermissionMenus 获取权限菜单
func (m *Menu) GetPermissionMenus(ctx context.Context, req *menu.PermissionMenusReq) (*response.PageResults[menu.PermissionMenusRes], error) {
	// 查询外层菜单
	if req.Limit == 0 {
		req.Limit = 50
	}
	if req.ID == "" {
		return m.getAllCategory(ctx, req)
	}
	return m.getMenusByCategory(ctx, req)
}

// getAllCategory  查询所有的分类
func (m *Menu) getAllCategory(ctx context.Context, req *menu.PermissionMenusReq) (*response.PageResults[menu.PermissionMenusRes], error) {
	ms, err := m.getPermissionMenus(ctx, req)
	if err != nil {
		return nil, err
	}
	ps := menu.ToPermissionMenus(ms, req.ResourceType)
	//分页返回
	pageResult := ps
	if req.Limit < len(ps) {
		pageResult = ps[req.Offset : req.Offset+req.Limit]
	}
	return &response.PageResults[menu.PermissionMenusRes]{
		Entries:    pageResult,
		TotalCount: int64(len(pageResult)),
	}, nil
}

// getMenusByCategory 查询某个种类
func (m *Menu) getMenusByCategory(ctx context.Context, req *menu.PermissionMenusReq) (*response.PageResults[menu.PermissionMenusRes], error) {
	validMenus, err := m.getPermissionMenus(ctx, req)
	if err != nil {
		return nil, err
	}
	ms := getMatchMenus(validMenus, req.ID)
	ps := menu.ToPermissionMenus(ms, req.ResourceType)

	pageResult := ps
	if req.Limit < len(ps) {
		pageResult = ps[req.Offset : req.Offset+req.Limit]
	}
	return &response.PageResults[menu.PermissionMenusRes]{
		Entries:    pageResult,
		TotalCount: int64(len(pageResult)),
	}, nil
}

// getPermissionMenus 查询权限菜单
func (m *Menu) getPermissionMenus(ctx context.Context, req *menu.PermissionMenusReq) ([]*menu.Mu, error) {
	menus, err := m.repo.GetMenusByPlatformWithKeyword(ctx, req.Platform, req.ID, req.Keyword)
	if err != nil {
		return nil, err
	}
	validMenus := make([]*menu.Mu, 0, len(menus))
	for _, mu := range menus {
		ms := &menu.Mu{}
		if err = jsoniter.Unmarshal([]byte(mu.Value), ms); err != nil {
			return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
		}
		if !ms.IsPermissionMenu() {
			continue
		}
		validMenus = append(validMenus, ms)
	}
	return validMenus, err
}

// getAllMenus 查询所有菜单
func (m *Menu) getAllMenus(ctx context.Context) ([]*menu.Mu, error) {
	menus, err := m.repo.GetMenus(ctx)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	validMenus := make([]*menu.Mu, 0, len(menus))
	for _, mu := range menus {
		ms := &menu.Mu{}
		if err = jsoniter.Unmarshal([]byte(mu.Value), ms); err != nil {
			return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
		}
		if !ms.IsPermissionMenu() {
			continue
		}
		ms.ResourceType = menu.PlatformToResourceType(mu.Platform)
		validMenus = append(validMenus, ms)
	}
	return validMenus, err
}

func getMatchMenus(ms []*menu.Mu, key string) []*menu.Mu {
	rs := make([]*menu.Mu, 0)
	for _, vm := range ms {
		validChildren := lo.Filter(vm.Children, func(item *menu.Mu, index int) bool {
			return item.IsPermissionMenu()
		})
		if len(validChildren) <= 0 {
			continue
		}
		//如果找到命中的，那就返回该菜单的子菜单
		if vm.Key == key {
			rs = validChildren
			break
		}
		rs = getMatchMenus(validChildren, key)
		if len(rs) > 0 {
			return rs
		}
	}
	return rs
}

func getMenuLabelDict(keyDict map[string]string, parentLabel string, ms []*menu.Mu) {
	for _, vm := range ms {
		keyDict[vm.Key] = parentLabel + "/" + vm.Label
		validChildren := lo.Filter(vm.Children, func(item *menu.Mu, index int) bool {
			return item.IsPermissionMenu()
		})
		if len(validChildren) <= 0 {
			continue
		}
		getMenuLabelDict(keyDict, keyDict[vm.Key], validChildren)
	}
}
