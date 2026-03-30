package user_management

import (
	"context"

	"github.com/kweaver-ai/idrm-go-common/rest/user_management"
)

type userManagement struct {
}

// NewUserManagement 创建UserMgnt服务处理对象
func NewUserManagement() user_management.DrivenUserMgnt {
	return &userManagement{}
}

// GetAccessorIDsByUserID 获取指定用户的访问令牌
func (u *userManagement) GetAccessorIDsByUserID(ctx context.Context, userID string) (accessorIDs []string, err error) {
	return
}

// GetUserNameByUserID 通过用户id获取用户名
func (u *userManagement) GetUserNameByUserID(ctx context.Context, userID string) (name string, isNormalUser bool, depInfos []*user_management.DepInfo, err error) {
	return "", false, nil, err
}

// GetUserRolesByUserID 通过用户id获取角色
func (u *userManagement) GetUserRolesByUserID(ctx context.Context, userID string) (roleTypes []user_management.RoleType, err error) {
	return nil, nil
}

// 获取部门所有用户ID
func (u *userManagement) GetDepAllUsers(ctx context.Context, depID string) (userIDs []string, err error) {
	return nil, nil
}

func (u *userManagement) GetDepAllUserInfos(ctx context.Context, depID string) (userInfos []user_management.UserInfo, err error) {
	return nil, nil
}
func (u *userManagement) GetDirectDepAllUserInfos(ctx context.Context, depID string) (userIds []string, err error) {
	return nil, nil
}

func (u *userManagement) GetGroupMembers(ctx context.Context, groupID string) (userIDs, depIDs []string, err error) {
	return nil, nil, err
}

func (u *userManagement) GetNameByAccessorIDs(ctx context.Context, accessorIDs map[string]user_management.AccessorType) (accessorNames map[string]string, err error) {
	return nil, nil
}

// GetAppInfo 获取应用账户信息
func (u *userManagement) GetAppInfo(ctx context.Context, appID string) (info user_management.AppInfo, err error) {
	return
}

// GetDepIDsByUserID 获取用户所属部门ID
func (u *userManagement) GetDepIDsByUserID(ctx context.Context, userID string) (pathIDs []string, err error) {
	return nil, nil
}

func (u *userManagement) GetUserInfoByID(ctx context.Context, userID string) (userInfo user_management.UserInfo, err error) {
	return
}

// BatchGetUserInfoByID 批量获取用户的基础信息
func (u *userManagement) BatchGetUserInfoByID(ctx context.Context, userIDs []string) (userInfoMap map[string]user_management.UserInfo, err error) {
	return
}

func (u *userManagement) convertUserInfo(info map[string]interface{}) (userInfo user_management.UserInfo, err error) {
	return
}

// GetAccessorIDsByDepartID 获取部门访问令牌
func (u *userManagement) GetAccessorIDsByDepartID(ctx context.Context, depID string) (accessorIDs []string, err error) {
	return
}

// GetUserParentDepartments 获取用户所在的组织结构, 返回结果外围数组的每个元素都是[]Department类型
// 一个[]Department代表组织结构部门链路，用于描述从根组织到用户直属部门的单个链路
// 一个[][]Department类型代表多个组织结构部门链路，用于描述从根组织到用户直属部门的多个链路(用户直属于多个部门)
func (u *userManagement) GetUserParentDepartments(ctx context.Context, userID string) (parentDeps [][]user_management.Department, err error) {
	return
}

func (u *userManagement) GetDepartments(ctx context.Context, level int) (departmentInfos []*user_management.DepartmentInfo, err error) {
	return
}

func (u *userManagement) GetDepartmentParentInfo(ctx context.Context, ids, fields string) (departmentParentInfos []*user_management.DepartmentParentInfo, err error) {
	return
}

func (u *userManagement) GetDepartmentInfo(ctx context.Context, departmentIds []string, fields string) (res []*user_management.DepartmentInfo, err error) {
	return
}
