package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/access_control"
)

//region 配置 配置中心所有权限

func (p *Permissions) GetConfigurationCenterAllPermissions(ctx context.Context, roleId string) ([]*model.Resource, error) {
	resources := make([]*model.Resource, 0)
	//Resource
	for _, r := range GetAllConfigurationCenterResource() {
		resources = append(resources, &model.Resource{
			RoleID: roleId,
			Type:   r.ToInt32(),
			Value:  AllPermission(),
		})
	}
	//Scope
	for _, s := range GetAllConfigurationCenterScope() {
		resources = append(resources, &model.Resource{
			RoleID: roleId,
			Type:   s.ToInt32(),
			Value:  AllPermission(),
		})
	}

	return resources, nil
}
func GetAllConfigurationCenterResource() []access_control.Resource {
	return []access_control.Resource{
		access_control.Flowchart,
		access_control.Role,
		access_control.BusinessStructure,
		access_control.InfoSystem,
		access_control.DataSource,
		access_control.CodeGenerationRule,
		access_control.Code,
		access_control.DataUsingType,
		access_control.GetDataUsingType,
		// access_control.Apps,
	}
}
func GetAllConfigurationCenterScope() []access_control.Scope {
	return []access_control.Scope{
		access_control.PipelineScope,
		access_control.RoleScope,
		access_control.BusinessStructureScope,
		access_control.InfoSystemScope,
		access_control.DataSourceScope,
		access_control.CodeGenerationRuleScope,
		access_control.CodeScope,
		access_control.DataUsingTypeScope,
		access_control.GetDataUsingTypeScope,
		// access_control.AppsScope,
	}
}

//endregion
