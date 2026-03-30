package role_group

import (
	"context"

	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	configuration_center_v1_frontend "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1/frontend"
)

type Domain interface {
	// 创建角色组
	Create(ctx context.Context, g *configuration_center_v1.RoleGroup) (*configuration_center_v1.RoleGroup, error)
	// 删除指定角色组
	Delete(ctx context.Context, id string) (*configuration_center_v1.RoleGroup, error)
	// 更新指定角色组
	Update(ctx context.Context, g *configuration_center_v1.RoleGroup) (*configuration_center_v1.RoleGroup, error)
	// 获取指定角色组
	Get(ctx context.Context, id string) (*configuration_center_v1.RoleGroup, error)
	// 获取角色组列表
	List(ctx context.Context, opts *configuration_center_v1.RoleGroupListOptions) (*configuration_center_v1.RoleGroupList, error)
	// 更新角色组、角色绑定，批处理
	RoleGroupRoleBindingBatchProcessing(ctx context.Context, p *configuration_center_v1.RoleGroupRoleBindingBatchProcessing) error
	// 获取指定角色组，及其关联的数据，例如：角色、更新人、所属部门
	FrontGet(ctx context.Context, id string) (*configuration_center_v1_frontend.RoleGroup, error)
	// 获取角色组列表，及其关联的数据，例如：角色、更新人、所属部门
	FrontList(ctx context.Context, opts *configuration_center_v1.RoleGroupListOptions) (*configuration_center_v1_frontend.RoleGroupList, error)
	// 检查角色组名称是否可以使用
	FrontNameCheck(ctx context.Context, opts *configuration_center_v1.RoleGroupNameCheck) (bool, error)
}
