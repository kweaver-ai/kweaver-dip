package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/user_management"
)

type fakeDrivenUserManagement struct {
	// GetUserInfos: args
	calledUserIDs        []string
	calledUserInfoFields []user_management.UserInfoField
	// GetUserInfos: return values
	userInfos []user_management.UserInfoV2
	err       error
}

// CreateApps implements user_management.DrivenUserMgnt.
func (f *fakeDrivenUserManagement) CreateApps(ctx context.Context, name string, password string) (*user_management.CC, error) {
	panic("unimplemented")
}

// DeleteApps implements user_management.DrivenUserMgnt.
func (f *fakeDrivenUserManagement) DeleteApps(ctx context.Context, id string) error {
	panic("unimplemented")
}

// GetApps implements user_management.DrivenUserMgnt.
func (f *fakeDrivenUserManagement) GetApps(ctx context.Context) (*user_management.BB, error) {
	panic("unimplemented")
}

// UpdateApps implements user_management.DrivenUserMgnt.
func (f *fakeDrivenUserManagement) UpdateApps(ctx context.Context, id string, name string, password string) error {
	panic("unimplemented")
}

func newFakeDrivenUserManagement(userInfos []user_management.UserInfoV2, err error) *fakeDrivenUserManagement {
	return &fakeDrivenUserManagement{
		userInfos: userInfos,
		err:       err,
	}
}

// BatchGetUserInfoByID implements user_management.DrivenUserMgnt.
func (f *fakeDrivenUserManagement) BatchGetUserInfoByID(ctx context.Context, userIDs []string) (userInfoMap map[string]user_management.UserInfo, err error) {
	panic("unimplemented")
}

// BatchGetUserParentDepartments implements user_management.DrivenUserMgnt.
func (f *fakeDrivenUserManagement) BatchGetUserParentDepartments(ctx context.Context, userIDs []string) (parentDeps map[string][][]user_management.Department, err error) {
	panic("unimplemented")
}

// GetAccessorIDsByDepartID implements user_management.DrivenUserMgnt.
func (f *fakeDrivenUserManagement) GetAccessorIDsByDepartID(ctx context.Context, depID string) (accessorIDs []string, err error) {
	panic("unimplemented")
}

// GetAccessorIDsByUserID implements user_management.DrivenUserMgnt.
func (f *fakeDrivenUserManagement) GetAccessorIDsByUserID(ctx context.Context, userID string) (accessorIDs []string, err error) {
	panic("unimplemented")
}

// GetAppInfo implements user_management.DrivenUserMgnt.
func (f *fakeDrivenUserManagement) GetAppInfo(ctx context.Context, appID string) (info user_management.AppInfo, err error) {
	panic("unimplemented")
}

// GetDepAllUserInfos implements user_management.DrivenUserMgnt.
func (f *fakeDrivenUserManagement) GetDepAllUserInfos(ctx context.Context, depID string) (userInfos []user_management.UserInfo, err error) {
	panic("unimplemented")
}

// GetDepAllUsers implements user_management.DrivenUserMgnt.
func (f *fakeDrivenUserManagement) GetDepAllUsers(ctx context.Context, depID string) (userIDs []string, err error) {
	panic("unimplemented")
}

// GetDepIDsByUserID implements user_management.DrivenUserMgnt.
func (f *fakeDrivenUserManagement) GetDepIDsByUserID(ctx context.Context, userID string) (pathIDs []string, err error) {
	panic("unimplemented")
}

// GetDepartmentInfo implements user_management.DrivenUserMgnt.
func (f *fakeDrivenUserManagement) GetDepartmentInfo(ctx context.Context, departmentIds []string, fields string) (info []*user_management.DepartmentInfo, err error) {
	panic("unimplemented")
}

// GetDepartmentParentInfo implements user_management.DrivenUserMgnt.
func (f *fakeDrivenUserManagement) GetDepartmentParentInfo(ctx context.Context, ids string, fields string) (info []*user_management.DepartmentParentInfo, err error) {
	panic("unimplemented")
}

// GetDepartments implements user_management.DrivenUserMgnt.
func (f *fakeDrivenUserManagement) GetDepartments(ctx context.Context, level int) (info []*user_management.DepartmentInfo, err error) {
	panic("unimplemented")
}

// GetDirectDepAllUserInfos implements user_management.DrivenUserMgnt.
func (f *fakeDrivenUserManagement) GetDirectDepAllUserInfos(ctx context.Context, depID string) (userIds []string, err error) {
	panic("unimplemented")
}

// GetGroupMembers implements user_management.DrivenUserMgnt.
func (f *fakeDrivenUserManagement) GetGroupMembers(ctx context.Context, groupID string) (userIDs []string, depIDs []string, err error) {
	panic("unimplemented")
}

// GetNameByAccessorIDs implements user_management.DrivenUserMgnt.
func (f *fakeDrivenUserManagement) GetNameByAccessorIDs(ctx context.Context, accessorIDs map[string]user_management.AccessorType) (accessorNames map[string]string, err error) {
	panic("unimplemented")
}

// GetUserInfoByID implements user_management.DrivenUserMgnt.
func (f *fakeDrivenUserManagement) GetUserInfoByID(ctx context.Context, userID string) (userInfo user_management.UserInfo, err error) {
	panic("unimplemented")
}

// GetUserInfos implements user_management.DrivenUserMgnt.
func (f *fakeDrivenUserManagement) GetUserInfos(ctx context.Context, userIDs []string, fields []user_management.UserInfoField) ([]user_management.UserInfoV2, error) {
	f.calledUserIDs, f.calledUserInfoFields = userIDs, fields
	return f.userInfos, f.err
}

// GetUserNameByUserID implements user_management.DrivenUserMgnt.
func (f *fakeDrivenUserManagement) GetUserNameByUserID(ctx context.Context, userID string) (name string, isNormalUser bool, err error) {
	panic("unimplemented")
}

// GetUserParentDepartments implements user_management.DrivenUserMgnt.
func (f *fakeDrivenUserManagement) GetUserParentDepartments(ctx context.Context, userID string) (parentDeps [][]user_management.Department, err error) {
	panic("unimplemented")
}

// GetUserRolesByUserID implements user_management.DrivenUserMgnt.
func (f *fakeDrivenUserManagement) GetUserRolesByUserID(ctx context.Context, userID string) (roleTypes []user_management.RoleType, err error) {
	panic("unimplemented")
}

var _ user_management.DrivenUserMgnt = &fakeDrivenUserManagement{}
