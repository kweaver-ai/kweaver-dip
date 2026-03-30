package permission

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/permission"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
)

type domain struct {
	repo permission.Repo
}

func New(repo permission.Repo) Domain { return &domain{repo: repo} }

// Get 获取指定权限
func (d *domain) Get(ctx context.Context, id string) (*configuration_center_v1.Permission, error) {
	p, err := d.repo.GetById(ctx, id)
	if err != nil {
		return nil, err
	}
	return convertModelToV1_Permission(p), nil
}

// List 获取权限列表
func (d *domain) List(ctx context.Context) (*configuration_center_v1.PermissionList, error) {
	permissions, count, err := d.repo.GetList(ctx)
	if err != nil {
		return nil, err
	}
	return &configuration_center_v1.PermissionList{
		Entries:    convertModelToV1_Permissions(permissions),
		TotalCount: int(count),
	}, nil
}

func (d *domain) QueryUserListByPermissionIds(ctx context.Context, req *PermissionIdsReq) (resp *PermissionUserResp, err error) {
	userLists, err := d.repo.QueryUserListByPermissionIds(ctx, req.PermissionType, req.PermissionIds, req.Keyword, req.ThirdUserId)
	if err != nil {
		return nil, err
	}
	entries := make([]*PermissionUser, len(userLists))
	for i, x := range userLists {
		entries[i] = &PermissionUser{
			ID:          x.ID,
			Name:        x.Name,
			ThirdUserId: x.ThirdUserId,
		}
	}
	return &PermissionUserResp{
		Entries: entries,
	}, nil
}

func (d *domain) GetUserPermissionScopeList(ctx context.Context, uid string) ([]*model.UserPermissionScope, error) {
	userPermissionScope, err := d.repo.GetUserPermissionScopeList(ctx, uid)
	if err != nil {
		return nil, err
	}
	return userPermissionScope, nil
}

func (d *domain) UserCheckPermission(ctx context.Context, permissionId, uid string) (bool, error) {
	if permissionId == "" || uid == "" {
		return false, nil
	}
	exist, err := d.repo.GetUserCheckPermissionCount(ctx, permissionId, uid)
	if err != nil {
		return false, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if exist > 0 {
		return true, nil
	}
	return false, nil
}
