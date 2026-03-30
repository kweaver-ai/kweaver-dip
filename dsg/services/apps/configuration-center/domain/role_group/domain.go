package role_group

import (
	"context"
	"net/url"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/role"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/role_group"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/role_group_role_binding"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/user2"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	configuration_center_v1_frontend "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1/frontend"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
)

type domain struct {
	repo                  role_group.Repo
	roleGroupRoleBingRepo role_group_role_binding.Repo
	role                  role.Repo
	userRepo              user2.IUserRepo
}

func New(repo role_group.Repo,
	roleGroupRoleBingRepo role_group_role_binding.Repo,
	role role.Repo,
	userRepo user2.IUserRepo,
) Domain {
	return &domain{
		repo:                  repo,
		roleGroupRoleBingRepo: roleGroupRoleBingRepo,
		role:                  role,
		userRepo:              userRepo,
	}
}

// 创建角色组
func (d *domain) Create(ctx context.Context, g *configuration_center_v1.RoleGroup) (*configuration_center_v1.RoleGroup, error) {
	err := d.repo.Create(ctx, convertV1ToModel_RoleGroup(g))
	if err != nil {
		return nil, err
	}
	return g, nil
}

// 删除指定角色组
func (d *domain) Delete(ctx context.Context, id string) (*configuration_center_v1.RoleGroup, error) {
	g, err := d.repo.GetById(ctx, id)
	if err != nil {
		return nil, err
	}
	err = d.repo.Delete(ctx, id)
	if err != nil {
		return nil, err
	}
	return convertModelToV1_RoleGroup(g), nil
}

// 更新指定角色组
func (d *domain) Update(ctx context.Context, g *configuration_center_v1.RoleGroup) (*configuration_center_v1.RoleGroup, error) {
	_, err := d.repo.GetById(ctx, g.ID)
	if err != nil {
		return nil, err
	}
	err = d.repo.Update(ctx, convertV1ToModel_RoleGroup(g))
	if err != nil {
		return nil, err
	}
	return g, nil
}

// 获取指定角色组
func (d *domain) Get(ctx context.Context, id string) (*configuration_center_v1.RoleGroup, error) {
	g, err := d.repo.GetById(ctx, id)
	if err != nil {
		return nil, err
	}
	return convertModelToV1_RoleGroup(g), nil
}

// 获取角色组列表
func (d *domain) List(ctx context.Context, opts *configuration_center_v1.RoleGroupListOptions) (*configuration_center_v1.RoleGroupList, error) {
	got := &url.Values{}
	err := configuration_center_v1.Convert_V1_RoleGroupListOptions_To_url_Values(opts, got)
	if err != nil {
		return nil, err
	}
	roleGroups, count, err := d.repo.QueryList(ctx, *got)
	if err != nil {
		return nil, err
	}
	return &configuration_center_v1.RoleGroupList{
		Entries:    convertModelToV1_RoleGroups(roleGroups),
		TotalCount: int(count),
	}, nil
}

// 更新角色组、角色绑定，批处理
func (d *domain) RoleGroupRoleBindingBatchProcessing(ctx context.Context, p *configuration_center_v1.RoleGroupRoleBindingBatchProcessing) (err error) {
	adds := make([]*model.RoleGroupRoleBinding, 0)
	deletes := make([]string, 0)

	for _, b := range p.Bindings {
		binding, err := d.roleGroupRoleBingRepo.Get(ctx, b.RoleGroupID, b.RoleID)
		if err != nil {
			return err
		}
		switch b.State {
		case meta_v1.ProcessingStatePresent:
			if binding == nil {
				adds = append(adds, &model.RoleGroupRoleBinding{
					RoleGroupID: b.RoleGroupID,
					RoleID:      b.RoleID,
				})
			}
		case meta_v1.ProcessingStateAbsent:
			if binding != nil {
				deletes = append(deletes, binding.ID)
			}
		}
	}
	return d.roleGroupRoleBingRepo.Update(ctx, adds, deletes)
}

func (d *domain) getRoleGroupInfo(ctx context.Context, roleGroup *model.RoleGroup) (*configuration_center_v1_frontend.RoleGroup, error) {
	var err error
	// 获取角色组关联的角色
	bindings, err := d.roleGroupRoleBingRepo.GetByRoleGroupId(ctx, roleGroup.ID)
	if err != nil {
		return nil, err
	}
	roleIds := make([]string, len(bindings))
	for _, b := range bindings {
		roleIds = append(roleIds, b.RoleID)
	}
	// 获取角色信息
	roleInfos := make([]*model.SystemRole, 0)
	if len(roleIds) > 0 {
		roleInfos, err = d.role.GetByIds(ctx, roleIds)
		if err != nil {
			return nil, err
		}
	}
	roleGroupInfo := &configuration_center_v1_frontend.RoleGroup{
		RoleGroupSpec: *convertModelToV1_RoleGroupSpec(roleGroup),
		Roles:         convertModelToV1_Roles(roleInfos),
	}
	if err := convert_model_Metadata_To_meta_v1_Metadata(&roleGroup.Metadata, &roleGroupInfo.Metadata); err != nil {
		return nil, err
	}
	return roleGroupInfo, nil
}

// 获取指定角色组，及其关联的数据，例如：角色、更新人、所属部门
func (d *domain) FrontGet(ctx context.Context, id string) (*configuration_center_v1_frontend.RoleGroup, error) {
	// 获取角色组信息
	roleGroup, err := d.repo.GetById(ctx, id)
	if err != nil {
		return nil, err
	}
	return d.getRoleGroupInfo(ctx, roleGroup)
}

// 获取角色组列表，及其关联的数据，例如：角色、更新人、所属部门
func (d *domain) FrontList(ctx context.Context, opts *configuration_center_v1.RoleGroupListOptions) (*configuration_center_v1_frontend.RoleGroupList, error) {
	got := &url.Values{}
	err := configuration_center_v1.Convert_V1_RoleGroupListOptions_To_url_Values(opts, got)
	if err != nil {
		return nil, err
	}
	roleGroups, count, err := d.repo.QueryList(ctx, *got)
	if err != nil {
		return nil, err
	}
	entries := make([]configuration_center_v1_frontend.RoleGroup, 0)
	for _, roleGroup := range roleGroups {
		roleGroupInfo, err := d.getRoleGroupInfo(ctx, &roleGroup)
		if err != nil {
			return nil, err
		}
		entries = append(entries, *roleGroupInfo)
	}
	return &configuration_center_v1_frontend.RoleGroupList{
		Entries:    entries,
		TotalCount: int(count),
	}, nil
}

// 检查角色组名称是否可以使用
func (d *domain) FrontNameCheck(ctx context.Context, opts *configuration_center_v1.RoleGroupNameCheck) (bool, error) {
	return d.repo.CheckName(ctx, opts.Id, opts.Name)
}
