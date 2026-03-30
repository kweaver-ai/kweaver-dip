package impl

import (
	"context"

	jsoniter "github.com/json-iterator/go"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/configuration"
	repo "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/menu"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/permission"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/resource"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/menu"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/user"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/d_session"
	"github.com/kweaver-ai/idrm-go-common/rest/authorization"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type Menu struct {
	repo              repo.MenuRepo
	configurationRepo configuration.Repo
	resource          resource.Repo
	session           d_session.Session
	userDomain        user.UseCase
	permission        permission.Repo
	authDriven        authorization.Driven
}

func InitMenuCase(
	repo repo.MenuRepo,
) menu.UseCase {
	return &Menu{
		repo: repo,
	}
}

func NewUseCase(
	repo repo.MenuRepo,
	configurationRepo configuration.Repo,
	resource resource.Repo,
	session d_session.Session,
	userDomain user.UseCase,
	permission permission.Repo,
	authDriven authorization.Driven,
) menu.UseCase {
	return &Menu{
		repo:              repo,
		configurationRepo: configurationRepo,
		resource:          resource,
		session:           session,
		userDomain:        userDomain,
		permission:        permission,
		authDriven:        authDriven,
	}
}

type MenuFilter func(ctx context.Context, userID string) (map[string]bool, error)

type MenuActions func(ctx context.Context, userID string) (map[string][]string, error)

func (m *Menu) GetMenus(ctx context.Context, req *menu.GetMenusReq) (*menu.GetMenusRes, error) {
	menus, err := m.repo.GetMenusByPlatform(ctx, req.Platform)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	filter, err := m.getUserMenuActionMap(ctx, menus, req)
	if err != nil {
		return nil, err
	}
	res := make([]any, 0, len(menus))
	for _, mu := range menus {
		ms := menu.Mu{}
		if err = jsoniter.Unmarshal([]byte(mu.Value), &ms); err != nil {
			return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
		}
		has := filter.FilterMenu(&ms)
		if !has {
			continue
		}
		res = append(res, ms)
	}
	return &menu.GetMenusRes{
		Menus: res,
	}, nil
}

func (m *Menu) getUserMenuActionMap(ctx context.Context, menus []*model.Menu, req *menu.GetMenusReq) (*MenuActionsFilter, error) {
	userInfo, err := user_util.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}
	muKeys := make([]string, 0)
	for _, mu := range menus {
		ms := menu.Mu{}
		if err := jsoniter.Unmarshal([]byte(mu.Value), &ms); err != nil {
			return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
		}
		muKeys = append(muKeys, ms.Keys()...)
	}
	//获取所有菜单的操作
	resources := make([]authorization.ResourceObject, 0, len(menus))
	for _, key := range muKeys {
		resources = append(resources, authorization.ResourceObject{
			Type: req.ResourceType,
			ID:   key,
		})
	}
	//组装参数
	args := &authorization.GetResourceOperationsArgs{
		Method: "GET",
		Accessor: authorization.Accessor{
			ID:   userInfo.ID,
			Type: authorization.ACCESSOR_TYPE_USER,
		},
		Resources: resources,
	}
	resourceOperations, err := m.authDriven.GetResourceOperations(ctx, args)
	if err != nil {
		log.Errorf("GetAccessorPolicy error %v", err.Error())
		return nil, err
	}
	ops := make(map[string][]string)
	for _, obj := range resourceOperations {
		ops[obj.ID] = append(ops[obj.ID], obj.Operation...)
	}
	return NewMenuFilter(ops), nil
}

func (m *Menu) SetMenus(ctx context.Context, req menu.SetMenusReq) error {
	err := m.repo.Truncate(ctx)
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	for resourceID, mus := range req {
		//platform
		platform := menu.ResourceToPlatform(resourceID)
		//如果是语义治理，添加问数的按钮
		menus := make([]*model.Menu, 0)
		for _, router := range mus {
			marshal, _ := jsoniter.Marshal(router)
			menus = append(menus, &model.Menu{
				Platform: platform,
				Value:    string(marshal),
			})
		}
		if len(menus) != 0 {
			err = m.repo.CreateBatch(ctx, menus)
			if err != nil {
				return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
			}
		}
	}
	return nil
}

func (m *Menu) GetResourceMenuKeys(ctx context.Context) (map[string]string, error) {
	menus, err := m.getAllMenus(ctx)
	if err != nil {
		return nil, err
	}
	dict := make(map[string]string)
	for _, menu := range menus {
		getResourceMenuKeys(menu, dict)
	}
	return dict, nil
}

func getResourceMenuKeys(menu *menu.Mu, dict map[string]string) {
	dict[menu.Key] = menu.ResourceType
	for i := range menu.Children {
		menu.Children[i].ResourceType = menu.ResourceType
		getResourceMenuKeys(menu.Children[i], dict)
	}
}
