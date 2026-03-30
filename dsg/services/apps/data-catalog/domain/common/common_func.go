package common

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/user_management"
	common_util "github.com/kweaver-ai/idrm-go-common/util"
)

type DepartmentDomain struct {
	configurationCenterDriven configuration_center.Driven
	userMgm                   user_management.DrivenUserMgnt
}

func NewDepartmentDomain(
	configurationCenterDriven configuration_center.Driven,
	userMgm user_management.DrivenUserMgnt,
) *DepartmentDomain {
	return &DepartmentDomain{
		configurationCenterDriven: configurationCenterDriven,
		userMgm:                   userMgm,
	}
}

func (d *DepartmentDomain) GetDepart(ctx context.Context) ([]string, error) {
	userInfo, err := common_util.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}
	userDepartment, err := d.configurationCenterDriven.GetDepartmentsByUserID(ctx, userInfo.ID)
	if err != nil {
		return nil, err
	}
	subDepartmentIDs := make([]string, 0)
	for _, department := range userDepartment {
		subDepartmentIDs = append(subDepartmentIDs, department.ID)
		departmentList, err := d.configurationCenterDriven.GetChildDepartments(ctx, department.ID)
		if err != nil {
			return nil, err
		}
		for _, entry := range departmentList.Entries {
			util.SliceAdd(&subDepartmentIDs, entry.ID)
		}
	}
	return subDepartmentIDs, nil
}
func (d *DepartmentDomain) GetMainDepart(ctx context.Context) ([]string, error) {
	userInfo, err := common_util.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}
	return d.configurationCenterDriven.GetMainDepartIdsByUserID(ctx, userInfo.ID)
}
func (d *DepartmentDomain) UserInMainDepart(ctx context.Context, departmentID string) (bool, error) {
	userInfo, err := common_util.GetUserInfo(ctx)
	if err != nil {
		return false, err
	}
	userDepartment, err := d.configurationCenterDriven.GetMainDepartIdsByUserID(ctx, userInfo.ID)
	if err != nil {
		return false, err
	}
	for _, department := range userDepartment {
		if departmentID == department {
			return true, nil
		}
	}
	return false, nil
}

func (d *DepartmentDomain) GetDepartUsers(ctx context.Context, departmentIDs []string) ([]string, error) {
	userIDs := make([]string, 0)
	for _, departmentID := range departmentIDs {
		if departmentID != "" {
			directDepAllUsers, err := d.userMgm.GetDirectDepAllUserInfos(ctx, departmentID)
			if err != nil {
				return nil, err
			}
			userIDs = append(userIDs, directDepAllUsers...)
		}
	}
	return userIDs, nil
}
