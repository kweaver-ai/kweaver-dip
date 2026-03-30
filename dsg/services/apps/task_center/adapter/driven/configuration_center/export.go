package configuration_center

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_project"
	"github.com/kweaver-ai/idrm-go-common/access_control"
)

var Service Call

func GetRoleInfo(ctx context.Context, roleId string) (*RoleInfo, error) {
	return Service.GetRoleInfo(ctx, roleId)
}
func GetRolesInfo(ctx context.Context, roleIds []string) ([]*RoleInfo, error) {
	return Service.GetRolesInfo(ctx, roleIds)
}
func GetRolesInfoMap(ctx context.Context, roleIds []string) (map[string]*RoleInfo, error) {
	return Service.GetRolesInfoMap(ctx, roleIds)
}
func GetRemotePipelineInfo(ctx context.Context, flowID, flowVersion string) (*tc_project.PipeLineInfo, error) {
	return Service.GetRemotePipelineInfo(ctx, flowID, flowVersion)
}
func HasAccessPermission(ctx context.Context, accessType access_control.AccessType, resource access_control.Resource) (bool, error) {
	return Service.HasAccessPermission(ctx, "", accessType, resource)
}
func AddUsersToRole(ctx context.Context, rid, uid string) error {
	return Service.AddUsersToRole(ctx, rid, uid)
}
func DeleteUsersToRole(ctx context.Context, rid, uid string) error {
	return Service.DeleteUsersToRole(ctx, rid, uid)
}
func GetProjectMgmRoleUsers(ctx context.Context, info UserRolePageInfo) ([]*User, error) {
	return Service.GetRoleUsers(ctx, "", info)
}
func UserIsInProjectMgm(ctx context.Context, uid string) (bool, error) {
	return Service.UserIsInRole(ctx, "", uid)
}
