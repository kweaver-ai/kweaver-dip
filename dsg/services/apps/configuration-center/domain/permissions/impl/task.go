package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/access_control"
)

//region 新建标准 权限

func (p *Permissions) GetNewStandardPermissions(ctx context.Context, roleId string) ([]*model.Resource, error) {
	resources := make([]*model.Resource, 0)

	//新建标准 接口所有权限
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.NewStandard.ToInt32(), Value: AllPermission()}) //新建标准 所有接口权限
	//新建标准 范围所有权限
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.NewStandardScope.ToInt32(), Value: AllPermission()})

	return resources, nil
}
func (p *Permissions) GetTaskNewStandardPermissions(ctx context.Context, roleId string) ([]*model.Resource, error) {
	resources := make([]*model.Resource, 0)

	//新建标准 接口所有权限
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.NewStandard.ToInt32(), Value: AllPermission()}) //新建标准 所有接口权限
	//新建标准 范围所有权限
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskNewStandardScope.ToInt32(), Value: AllPermission()})

	return resources, nil
}

//endregion
//region 项目任务 权限

func (p *Permissions) GetProjectTaskGetPermissions(ctx context.Context, roleId string) ([]*model.Resource, error) {
	resources := make([]*model.Resource, 0)

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Project.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Task.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Flowchart.ToInt32(), Value: 1})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.ProjectScope.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskScope.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.PipelineKanbanScope.ToInt32(), Value: 1})

	return resources, nil
}

//endregion
//region 项目任务 权限

func (p *Permissions) GetProjectTaskPermissions(ctx context.Context, roleId string) ([]*model.Resource, error) {
	resources := make([]*model.Resource, 0)

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Project.ToInt32(), Value: AllPermission()})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Task.ToInt32(), Value: AllPermission()})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Flowchart.ToInt32(), Value: 1})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.ProjectScope.ToInt32(), Value: AllPermission()})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskScope.ToInt32(), Value: AllPermission()})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.PipelineKanbanScope.ToInt32(), Value: 1})

	return resources, nil
}

//endregion

//region 业务建模任务 权限

func (p *Permissions) GetModelingTaskPermissions(ctx context.Context, roleId string) ([]*model.Resource, error) {
	resources := make([]*model.Resource, 0)

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Project.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Task.ToInt32(), Value: 5})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Role.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessStructure.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.InfoSystem.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.NewStandard.ToInt32(), Value: 1})

	//resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessDomain.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessModel.ToInt32(), Value: AllPermission()})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessForm.ToInt32(), Value: AllPermission()})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessFlowchart.ToInt32(), Value: AllPermission()})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.ProjectScope.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskScope.ToInt32(), Value: 5})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.PipelineKanbanScope.ToInt32(), Value: 1})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskBusinessModel.ToInt32(), Value: AllPermission()})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskBusinessForm.ToInt32(), Value: AllPermission()})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskBusinessFlowchart.ToInt32(), Value: AllPermission()})

	return resources, nil
}

//endregion

//region 业务建模任务 get权限

func (p *Permissions) GetModelingTaskGetPermissions(ctx context.Context, roleId string) ([]*model.Resource, error) {
	resources := make([]*model.Resource, 0)

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Project.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Task.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Role.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessStructure.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.InfoSystem.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.NewStandard.ToInt32(), Value: 1})

	//resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessDomain.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessModel.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessForm.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessFlowchart.ToInt32(), Value: 1})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.ProjectScope.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskScope.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.PipelineKanbanScope.ToInt32(), Value: 1})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskBusinessModel.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskBusinessForm.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskBusinessFlowchart.ToInt32(), Value: 1})

	return resources, nil
}

//endregion

//region 业务表标准化任务 权限

func (p *Permissions) GetStandardizationTaskPermissions(ctx context.Context, roleId string) ([]*model.Resource, error) {
	resources := make([]*model.Resource, 0)

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Project.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Task.ToInt32(), Value: 5})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Role.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.NewStandard.ToInt32(), Value: 1})

	//resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessDomain.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessModel.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessForm.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessFlowchart.ToInt32(), Value: 1})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.ProjectScope.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskScope.ToInt32(), Value: 5})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.PipelineKanbanScope.ToInt32(), Value: 1})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskBusinessModel.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskBusinessForm.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskBusinessFlowchart.ToInt32(), Value: 1})

	return resources, nil
}

//endregion

//region 业务指标梳理任务 权限

func (p *Permissions) GetIndicatorTaskPermissions(ctx context.Context, roleId string) ([]*model.Resource, error) {
	resources := make([]*model.Resource, 0)
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Project.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Task.ToInt32(), Value: 5})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.NewStandard.ToInt32(), Value: 1})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Role.ToInt32(), Value: 1})
	//resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessDomain.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessModel.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessForm.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessFlowchart.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessIndicator.ToInt32(), Value: 15})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.ProjectScope.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskScope.ToInt32(), Value: 5})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.PipelineKanbanScope.ToInt32(), Value: 1})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskBusinessModel.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskBusinessForm.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskBusinessFlowchart.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskBusinessIndicator.ToInt32(), Value: 15})

	return resources, nil
}

//endregion
//region 业务指标梳理任务 get权限

func (p *Permissions) GetIndicatorTaskGetPermissions(ctx context.Context, roleId string) ([]*model.Resource, error) {
	resources := make([]*model.Resource, 0)
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Project.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Task.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.NewStandard.ToInt32(), Value: 1})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Role.ToInt32(), Value: 1})
	//resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessDomain.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessModel.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessForm.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessFlowchart.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessIndicator.ToInt32(), Value: 1})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.ProjectScope.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskScope.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.PipelineKanbanScope.ToInt32(), Value: 1})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskBusinessModel.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskBusinessForm.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskBusinessFlowchart.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskBusinessIndicator.ToInt32(), Value: 1})

	return resources, nil
}

//endregion

//region task新建标准任务 权限

func (p *Permissions) GetNewStandardTaskPermissions(ctx context.Context, roleId string) ([]*model.Resource, error) {
	resources := make([]*model.Resource, 0)

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Project.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Task.ToInt32(), Value: 5})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Role.ToInt32(), Value: 1})

	//resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessDomain.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessModel.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.NewStandard.ToInt32(), Value: 15})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.ProjectScope.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskScope.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.PipelineKanbanScope.ToInt32(), Value: 1})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskNewStandardScope.ToInt32(), Value: 15})

	return resources, nil
}

//endregion
//region 独立 新建标准任务 权限

func (p *Permissions) GetIndepNewStandardTaskPermissions(ctx context.Context, roleId string) ([]*model.Resource, error) {
	resources := make([]*model.Resource, 0)

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Project.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Task.ToInt32(), Value: 5})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Role.ToInt32(), Value: 1})

	//resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessDomain.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessModel.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.NewStandard.ToInt32(), Value: 15})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.ProjectScope.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskScope.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.PipelineKanbanScope.ToInt32(), Value: 1})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.NewStandardScope.ToInt32(), Value: 15})

	return resources, nil
}

//endregion

//region 执行新建标准任务 权限

func (p *Permissions) GetExecNewStandardTaskPermissions(ctx context.Context, roleId string) ([]*model.Resource, error) {
	resources := make([]*model.Resource, 0)

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Project.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Task.ToInt32(), Value: 5})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Role.ToInt32(), Value: 1})

	//resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessDomain.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessModel.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.NewStandard.ToInt32(), Value: 1})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.ProjectScope.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskScope.ToInt32(), Value: 5})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.PipelineKanbanScope.ToInt32(), Value: 1})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskNewStandardScope.ToInt32(), Value: 1})

	return resources, nil
}

//endregion
//region 查看新建标准任务 权限

func (p *Permissions) GetNewStandardTaskGetPermissions(ctx context.Context, roleId string) ([]*model.Resource, error) {
	resources := make([]*model.Resource, 0)

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Project.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Task.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Role.ToInt32(), Value: 1})

	//resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessDomain.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessModel.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.NewStandard.ToInt32(), Value: 1})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.ProjectScope.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskScope.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.PipelineKanbanScope.ToInt32(), Value: 1})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskNewStandardScope.ToInt32(), Value: 1})

	return resources, nil
}

//endregion

//region 数据采集任务 权限

func (p *Permissions) GetDataCollectingTaskPermissions(ctx context.Context, roleId string) ([]*model.Resource, error) {
	resources := make([]*model.Resource, 0)

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Project.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Task.ToInt32(), Value: 5})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Role.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.NewStandard.ToInt32(), Value: 1})

	//resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessDomain.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessModel.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessForm.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessFlowchart.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.DataAcquisition.ToInt32(), Value: 15})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.ProjectScope.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskScope.ToInt32(), Value: 5})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.PipelineKanbanScope.ToInt32(), Value: 1})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskBusinessModel.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskBusinessForm.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskBusinessFlowchart.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskDataAcquisitionScope.ToInt32(), Value: 15})

	return resources, nil
}

//endregion
//region 数据加工任务 权限

func (p *Permissions) GetDataProcessingTaskPermissions(ctx context.Context, roleId string) ([]*model.Resource, error) {
	resources := make([]*model.Resource, 0)

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Project.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Task.ToInt32(), Value: 5})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Role.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.NewStandard.ToInt32(), Value: 1})

	//resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessDomain.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessModel.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessForm.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessFlowchart.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.DataProcessing.ToInt32(), Value: 15})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.ProjectScope.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskScope.ToInt32(), Value: 5})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.PipelineKanbanScope.ToInt32(), Value: 1})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskBusinessModel.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskBusinessForm.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskBusinessFlowchart.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskDataProcessingScope.ToInt32(), Value: 15})

	return resources, nil
}

//endregion

//region 新建主干业务任务 权限

func (p *Permissions) GetNewMainBusinessTaskPermissions(ctx context.Context, roleId string) ([]*model.Resource, error) {
	resources := make([]*model.Resource, 0)

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Project.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Task.ToInt32(), Value: 5})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Role.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.NewStandard.ToInt32(), Value: 1})

	//resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessDomain.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessModel.ToInt32(), Value: 15})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.ProjectScope.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskScope.ToInt32(), Value: 5})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.PipelineKanbanScope.ToInt32(), Value: 1})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskBusinessModel.ToInt32(), Value: 15})

	return resources, nil
}

//endregion

//region 新建主干业务任务 get权限

func (p *Permissions) GetNewMainBusinessTaskGetPermissions(ctx context.Context, roleId string) ([]*model.Resource, error) {
	resources := make([]*model.Resource, 0)

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Project.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Task.ToInt32(), Value: 1})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.Role.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.NewStandard.ToInt32(), Value: 1})

	//resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessDomain.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.BusinessModel.ToInt32(), Value: 1})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.ProjectScope.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskScope.ToInt32(), Value: 1})
	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.PipelineKanbanScope.ToInt32(), Value: 1})

	resources = append(resources, &model.Resource{RoleID: roleId, Type: access_control.TaskBusinessModel.ToInt32(), Value: 1})

	return resources, nil
}

//endregion
