package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/access_control"
)

//region 获取 业务建模 所有权限

func (p *Permissions) GetBusinessModelingAllPermissions(ctx context.Context, roleId string, value int32) ([]*model.Resource, error) {
	attributes := make([]*model.Resource, 0)
	//Resource
	for _, r := range GetBusinessModelingResource() {
		attributes = append(attributes, &model.Resource{
			RoleID: roleId,
			Type:   r.ToInt32(),
			Value:  value,
		})
	}

	//新建标准 所有接口权限
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.NewStandard.ToInt32(), Value: value})

	//Scope
	for _, s := range GetBusinessModelingScope() {
		attributes = append(attributes, &model.Resource{
			RoleID: roleId,
			Type:   s.ToInt32(),
			Value:  value,
		})
	}

	//新建标准 所有范围权限
	//attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.NewStandardScope.ToInt32(), Value: value})

	return attributes, nil
}
func GetBusinessModelingResource() []access_control.Resource {
	return []access_control.Resource{
		//access_control.BusinessDomain,
		access_control.BusinessModel,
		access_control.BusinessForm,
		access_control.BusinessFlowchart,
		access_control.BusinessIndicator,
	}
}
func GetBusinessModelingScope() []access_control.Scope {
	return []access_control.Scope{
		//access_control.BusinessDomainScope,
		access_control.BusinessModelScope,
		access_control.BusinessFormScope,
		access_control.BusinessFlowchartScope,
		access_control.BusinessIndicatorScope,
	}
}

//endregion

//region 获取 任务下 业务建模 所有权限

func (p *Permissions) GetTaskBusinessModelingAllPermissions(ctx context.Context, roleId string) ([]*model.Resource, error) {
	attributes := make([]*model.Resource, 0)
	//Resource
	for _, r := range GetTaskBusinessModelingResource() {
		attributes = append(attributes, &model.Resource{
			RoleID: roleId,
			Type:   r.ToInt32(),
			Value:  AllPermission(),
		})
	}
	//attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.BusinessDomain.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})

	//项目任务 查看接口
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.Project.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.Task.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})

	//看板所需查询接口
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.Role.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.BusinessStructure.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.InfoSystem.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.NewStandard.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()}) //新建标准查看权限

	//新建标准 接口 所有权限
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.NewStandard.ToInt32(), Value: AllPermission()})

	//Scope
	for _, s := range GetTaskBusinessModelingScope() {
		attributes = append(attributes, &model.Resource{
			RoleID: roleId,
			Type:   s.ToInt32(),
			Value:  AllPermission(),
		})
	}
	// 看板所需范围
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.ProjectScope.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.TaskScope.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})

	//任务新建标准 接口 所有权限
	//attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.TaskNewStandardScope.ToInt32(), Value: AllPermission()})

	return attributes, nil

}
func GetTaskBusinessModelingResource() []access_control.Resource {
	return []access_control.Resource{
		access_control.BusinessModel,
		access_control.BusinessForm,
		access_control.BusinessFlowchart,
		access_control.BusinessIndicator,
	}
}
func GetTaskBusinessModelingScope() []access_control.Scope {
	return []access_control.Scope{
		access_control.TaskBusinessModel,
		access_control.TaskBusinessForm,
		access_control.TaskBusinessFlowchart,
		access_control.TaskBusinessIndicator,
	}
}

//endregion

//region 获取 业务标准-数据标准 权限

func (p *Permissions) GetDataStandardPermissions(ctx context.Context, roleId string, value int32) ([]*model.Resource, error) {
	attributes := make([]*model.Resource, 0)
	//Resource
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.DataStandard.ToInt32(), Value: value})

	//Scope
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.DataStandardScope.ToInt32(), Value: value})

	return attributes, nil
}

//endregion

//region 获取 采集加工 权限

func (p *Permissions) GetDataAcquisitionAndDataProcessingPermissions(ctx context.Context, roleId string, value int32) ([]*model.Resource, error) {
	attributes := make([]*model.Resource, 0)
	//Resource
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.DataAcquisition.ToInt32(), Value: value})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.DataProcessing.ToInt32(), Value: value})

	//Scope
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.DataAcquisitionScope.ToInt32(), Value: value})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.TaskDataAcquisitionScope.ToInt32(), Value: value})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.DataProcessingScope.ToInt32(), Value: value})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.TaskDataProcessingScope.ToInt32(), Value: value})

	return attributes, nil
}

//endregion
