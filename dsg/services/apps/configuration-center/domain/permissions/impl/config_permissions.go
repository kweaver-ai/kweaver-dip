package impl

import (
	"context"

	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/resource"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/permissions"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/access_control"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type Permissions struct {
	resourceRepo resource.Repo
}

func NewPermissions(resourceRepo resource.Repo) permissions.UseCase {
	return &Permissions{
		resourceRepo: resourceRepo,
	}
}

func (p *Permissions) AddPermissions(ctx context.Context) error {
	err := p.resourceRepo.InsertResource(ctx, []*model.Resource{{
		RoleID:  "",
		Type:    0,
		SubType: 0,
		Value:   0,
	}})
	if err != nil {
		log.WithContext(ctx).Error("AddAccessControl DataBaseError", zap.Error(err))
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	return nil
}

func (p *Permissions) InitTCPermissions(ctx context.Context) (err error) {
	err = p.resourceRepo.Truncate(ctx)
	if err != nil {
		return err
	}
	err = p.AddTCSystemMgmPermissions(ctx) //系统工程师
	if err != nil {
		return err
	}
	err = p.AddTCDataOperationEngineerPermissions(ctx) //数据运营工程师
	if err != nil {
		return err
	}
	err = p.AddTCDataDevelopmentEngineerPermissions(ctx) //数据开发工程师
	if err != nil {
		return err
	}
	err = p.AddTCDataOwnerPermissions(ctx) //数据owner
	if err != nil {
		return err
	}
	err = p.AddTCDataButlerPermissions(ctx) //数据管家
	if err != nil {
		return err
	}
	err = p.AddTCNormalPermissions(ctx) //普通用户
	if err != nil {
		return err
	}
	err = p.AddApplicationDeveloperPermissions(ctx) //应用开发者
	if err != nil {
		return err
	}
	err = p.AddSecurityMgm(ctx) //安全管理员
	if err != nil {
		return err
	}
	return nil
}

// AddTCSystemMgmPermissions 系统管理员
func (p *Permissions) AddTCSystemMgmPermissions(ctx context.Context) (err error) {
	roleId := access_control.TCSystemMgm
	attributes, err := p.GetConfigurationCenterAllPermissions(ctx, roleId)
	if err != nil {
		return err
	}
	attributesTotal := make([]*model.Resource, 0)
	attributesTotal = append(attributesTotal, attributes...)

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuditProcess.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuditProcessScope.ToInt32(), Value: 15})

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuditStrategy.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuditStrategyScope.ToInt32(), Value: 15})

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.CatalogCategory.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.CatalogCategoryScope.ToInt32(), Value: 15})

	/*
		attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuditPending.ToInt32(), Value: 15})
		attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuditPendingScope.ToInt32(), Value: 15})
	*/

	// 应用授权
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.Apps.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})

	// 审计日志
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.Audit.ToInt32(), Value: AllPermission()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuditScope.ToInt32(), Value: AllPermission()})

	//数据字典
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DATA_DICT.ToInt32(), Value: AllPermission()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DATA_DICT_Scope.ToInt32(), Value: AllPermission()})

	// 厂商管理
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.Firms.ToInt32(), Value: AllPermission()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FirmsScope.ToInt32(), Value: AllPermission()})

	// 通讯录管理
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AddressBook.ToInt32(), Value: AllPermission()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AddressBookScope.ToInt32(), Value: AllPermission()})

	// 前置机
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndProcessorAuditScope.ToInt32(), Value: AllPermission()}) // 不确定 Scope 的 Value 代表什么，先给所有权限

	//去重 attributesTotal to attributesInsert
	attributesInsert := DumpResource(attributesTotal)

	//入库
	if err = p.resourceRepo.InsertResource(ctx, attributesInsert); err != nil {
		log.WithContext(ctx).Error("AddAccessControl DataBaseError", zap.Error(err))
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	return
}

// AddTCDataOperationEngineerPermissions 数据运营工程师
func (p *Permissions) AddTCDataOperationEngineerPermissions(ctx context.Context) (err error) {
	roleId := access_control.TCDataOperationEngineer

	//获取业务建模所有权限
	attributes, err := p.GetBusinessModelingAllPermissions(ctx, roleId, AllPermission())
	if err != nil {
		return err
	}
	attributesTotal := make([]*model.Resource, 0)
	attributesTotal = append(attributesTotal, attributes...)

	//获取任务下业务建模所有权限
	attributes, err = p.GetTaskBusinessModelingAllPermissions(ctx, roleId)
	if err != nil {
		return err
	}
	attributesTotal = append(attributesTotal, attributes...)

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ExceptSystemMgm.ToInt32(), Value: 15})

	//主题域 业务流程
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.BusinessDomain.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.BusinessDomainScope.ToInt32(), Value: 15})

	//主体域
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SubjectDomain.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SubjectDomainScope.ToInt32(), Value: 15})

	//获取 业务标准-数据标准 查看权限
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataStandard.ToInt32(), Value: 3})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataStandardScope.ToInt32(), Value: 1})

	// 绑定审核流程
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuditStrategy.ToInt32(), Value: 15})

	//获取 项目任务 权限
	attributes, err = p.GetProjectTaskGetPermissions(ctx, roleId)
	if err != nil {
		return err
	}
	attributesTotal = append(attributesTotal, attributes...)
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.Task.ToInt32(), Value: AllPermission()})
	//attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.TaskScope.ToInt32(), Value: AllPermission()})

	//获取 数据运营管理 权限
	attributes, err = p.GetDataOperationManagementAllPermissions(ctx, roleId)
	if err != nil {
		return err
	}
	attributesTotal = append(attributesTotal, attributes...)

	//获取 数据资产中心 权限
	attributes, err = p.GetDataAssetPartResource(ctx, roleId)
	if err != nil {
		return err
	}
	attributesTotal = append(attributesTotal, attributes...)

	//获取 业务建模任务 权限
	attributes, err = p.GetModelingTaskPermissions(ctx, roleId)
	if err != nil {
		return err
	}
	attributesTotal = append(attributesTotal, attributes...)

	//获取 业务表标准化任务 权限
	attributes, err = p.GetStandardizationTaskPermissions(ctx, roleId)
	if err != nil {
		return err
	}
	attributesTotal = append(attributesTotal, attributes...)

	//获取 业务指标梳理任务 权限
	attributes, err = p.GetIndicatorTaskPermissions(ctx, roleId)
	if err != nil {
		return err
	}
	attributesTotal = append(attributesTotal, attributes...)

	//获取 新建主干业务任务 权限
	attributes, err = p.GetNewMainBusinessTaskPermissions(ctx, roleId)
	if err != nil {
		return err
	}
	attributesTotal = append(attributesTotal, attributes...)

	//获取 新建标准任务 权限
	attributes, err = p.GetNewStandardTaskPermissions(ctx, roleId)
	if err != nil {
		return err
	}
	attributesTotal = append(attributesTotal, attributes...)

	//获取 业务标准-数据标准 所有权限
	attributes, err = p.GetDataStandardPermissions(ctx, roleId, AllPermission())
	if err != nil {
		return err
	}
	attributesTotal = append(attributesTotal, attributes...)

	//执行新建标准任务
	attributes, err = p.GetExecNewStandardTaskPermissions(ctx, roleId)
	if err != nil {
		return err
	}
	attributesTotal = append(attributesTotal, attributes...)

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.Task.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.TaskScope.ToInt32(), Value: 5})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.NewStandard.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.NewStandardScope.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.IndependentDataAcquisitionTask.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.IndependentDataProcessingTask.ToInt32(), Value: 15})

	//执行新建标准任务
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.TaskNewStandardScope.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.TaskStdCreateScope.ToInt32(), Value: 15})

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataSource.ToInt32(), Value: 1})

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuditPending.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuditPendingScope.ToInt32(), Value: 15})

	//申请清单
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogApplyList.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogApplyListScope.ToInt32(), Value: 15})

	//需求申请
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogDataFeature.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogDataFeatureScope.ToInt32(), Value: 15})

	//接口服务管理(前台)
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ServiceManagementFront.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ServiceManagementFrontScope.ToInt32(), Value: 15})

	//应用中心-场景分析
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SceneAnalysis.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SceneAnalysisScope.ToInt32(), Value: 15})

	//视图管理
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FormView.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FormViewScope.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataStandard.ToInt32(), Value: 1})

	//数据运营-业务诊断
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.BusinessDiagnosis.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.BusinessDiagnosisScope.ToInt32(), Value: 15})

	// 编码
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.Code.ToInt32(), Value: AllPermission()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.CodeScope.ToInt32(), Value: AllPermission()})

	//资源配置
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.GetDataUsingType.ToInt32(), Value: AllPermission()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.GetDataUsingTypeScope.ToInt32(), Value: AllPermission()})

	//业务更新时间黑名单
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.TimestampBlacklist.ToInt32(), Value: AllPermission()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.TimestampBlacklistScope.ToInt32(), Value: AllPermission()})

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.IndicatorManagement.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.IndicatorManagementScope.ToInt32(), Value: 15})

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataModel.ToInt32(), Value: 15})

	//业务指标
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.BusinessIndicator.ToInt32(), Value: 15})

	//下载任务
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DownloadTask.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DownloadTaskScope.ToInt32(), Value: 15})

	//探查任务
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ExploreTask.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ExploreTaskScope.ToInt32(), Value: 15})

	//数据资产全景
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataAssetOverviewScope.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataAssetOverview.ToInt32(), Value: 1})

	//业务名称补全
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.Completion.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.CompletionScope.ToInt32(), Value: 15})

	// 类目
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.CatalogCategory.ToInt32(), Value: 1})

	// 省直达应用上报
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ProvinceAppsReport.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ProvinceAppsReportScope.ToInt32(), Value: 15})

	// 应用审核
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AppsAuditScope.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AppsAuditScope.ToInt32(), Value: 15})

	// 权限服务 - 子视图（行列规则）
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuthServiceSubView.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})
	// 权限服务 - 逻辑视图授权申请
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuthServiceLogicViewAuthorizingRequest.ToInt32(), Value: AllPermission()})
	// 权限服务 - 指标授权申请
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuthServiceIndicatorAuthorizingRequest.ToInt32(), Value: AllPermission()})
	// 授权服务 - 接口授权申请
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuthServiceAPIAuthorizingRequest.ToInt32(), Value: AllPermission()})
	// 授权服务 - 策略详情
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuthServicePolicy.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})

	// 应用授权
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.Apps.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})

	//共享申请
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SharedDeclaration.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SharedDeclarationScope.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.CategoryLabel.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.CategoryLabelScope.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.CategoryAppsAuth.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.CategoryAppsAuthScope.ToInt32(), Value: 15})

	// 前置机
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndProcessorsOverview.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndProcessor.ToInt32(), Value: (access_control.GET_ACCESS | access_control.POST_ACCESS | access_control.DELETE_ACCESS).ToInt32()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndProcessorRequest.ToInt32(), Value: access_control.PUT_ACCESS.ToInt32()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndProcessorReceipt.ToInt32(), Value: access_control.PUT_ACCESS.ToInt32()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndProcessorNode.ToInt32(), Value: access_control.PUT_ACCESS.ToInt32()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndProcessorReclaim.ToInt32(), Value: access_control.PUT_ACCESS.ToInt32()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndProcessorsOverviewScope.ToInt32(), Value: AllPermission()})  // 不确定 Scope 的 Value 代表什么，先给所有权限
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndProcessorRequestScope.ToInt32(), Value: AllPermission()})    // 不确定 Scope 的 Value 代表什么，先给所有权限
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndProcessorAuditScope.ToInt32(), Value: AllPermission()})      // 不确定 Scope 的 Value 代表什么，先给所有权限
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndProcessorReceiptScope.ToInt32(), Value: AllPermission()})    // 不确定 Scope 的 Value 代表什么，先给所有权限
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndProcessorAllocationScope.ToInt32(), Value: AllPermission()}) // 不确定 Scope 的 Value 代表什么，先给所有权限

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.HomePage.ToInt32(), Value: 1})

	// 工单
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.WorkOrder.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.WorkOrderScope.ToInt32(), Value: 15})

	// 供需对接
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequireList.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequirAnalysis.ToInt32(), Value: (access_control.GET_ACCESS | access_control.POST_ACCESS | access_control.DELETE_ACCESS).ToInt32()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequirImplement.ToInt32(), Value: access_control.PUT_ACCESS.ToInt32()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequirAudit.ToInt32(), Value: access_control.PUT_ACCESS.ToInt32()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequireListScope.ToInt32(), Value: AllPermission()})     // 不确定 Scope 的 Value 代表什么，先给所有权限
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequirAnalysisScope.ToInt32(), Value: AllPermission()})  // 不确定 Scope 的 Value 代表什么，先给所有权限
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequirImplementScope.ToInt32(), Value: AllPermission()}) // 不确定 Scope 的 Value 代表什么，先给所有权限
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequirAuditScope.ToInt32(), Value: AllPermission()})     // 不确定 Scope 的 Value 代表什么，先给所有权限

	// 业务认知分析平台 - 数据查询
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.CognitionAnalysisDataQueryScope.ToInt32(), Value: 15})

	// 共享申请-分析完善
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ShareApplyAnalysis.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ShareApplyAnalysisScope.ToInt32(), Value: 15})
	// 共享申请-数据资源实施
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ShareApplyImplement.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ShareApplyImplementScope.ToInt32(), Value: 15})

	// 数据处理 - 租户申请管理
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.TenantApplyManagement.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.TenantApplyManagementScope.ToInt32(), Value: 15})

	// 厂商管理
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.Firms.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})

	//去重 attributesTotal to attributesInsert
	attributesInsert := DumpResource(attributesTotal)

	//入库
	if err = p.resourceRepo.InsertResource(ctx, attributesInsert); err != nil {
		log.WithContext(ctx).Error("AddAccessControl DataBaseError", zap.Error(err))
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}

	return nil
}

// AddTCDataDevelopmentEngineerPermissions 数据开发工程师
func (p *Permissions) AddTCDataDevelopmentEngineerPermissions(ctx context.Context) (err error) {
	roleId := access_control.TCDataDevelopmentEngineer

	attributesTotal := make([]*model.Resource, 0)

	//获取业务建模加工采集等所有权限
	attributes, err := p.GetDataAcquisitionAndDataProcessingPermissions(ctx, roleId, AllPermission())
	if err != nil {
		return err
	}
	attributesTotal = append(attributesTotal, attributes...)

	//数据采集任务
	attributes, err = p.GetDataCollectingTaskPermissions(ctx, roleId)
	if err != nil {
		return err
	}
	attributesTotal = append(attributesTotal, attributes...)

	//数据加工任务
	attributes, err = p.GetDataProcessingTaskPermissions(ctx, roleId)
	if err != nil {
		return err
	}
	attributesTotal = append(attributesTotal, attributes...)

	//获取 部分数据资产中心 权限
	attributes, err = p.GetDataAssetPartResource(ctx, roleId)
	if err != nil {
		return err
	}
	attributesTotal = append(attributesTotal, attributes...)

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ExceptSystemMgm.ToInt32(), Value: 15})

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.Project.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ProjectScope.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.Task.ToInt32(), Value: 5})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.TaskScope.ToInt32(), Value: 5})

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataSource.ToInt32(), Value: 1})

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.BusinessStructure.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.InfoSystem.ToInt32(), Value: 1})

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuditPending.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuditPendingScope.ToInt32(), Value: 15})

	//数据运营管理-数据需求申请
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataFeature.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataFeatureScope.ToInt32(), Value: 15})

	//接口服务管理(前台)
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ServiceManagementFront.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ServiceManagementFrontScope.ToInt32(), Value: 15})

	//申请清单
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogApplyList.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogApplyListScope.ToInt32(), Value: 15})

	//需求申请
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogDataFeature.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogDataFeatureScope.ToInt32(), Value: 15})

	//应用中心-场景分析
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SceneAnalysis.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SceneAnalysisScope.ToInt32(), Value: 15})

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.IndicatorManagement.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.IndicatorManagementScope.ToInt32(), Value: 15})

	//业务指标
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.BusinessIndicator.ToInt32(), Value: 15})

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataModel.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataModelScope.ToInt32(), Value: 15})

	//主体域
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SubjectDomain.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SubjectDomainScope.ToInt32(), Value: 1})

	//资源配置
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.GetDataUsingType.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.GetDataUsingTypeScope.ToInt32(), Value: 1})

	//业务更新时间黑名单
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.TimestampBlacklist.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.TimestampBlacklistScope.ToInt32(), Value: 15})

	//逻辑视图 权限
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FormView.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FormViewScope.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataStandard.ToInt32(), Value: 1})

	// 编码
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.Code.ToInt32(), Value: AllPermission()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.CodeScope.ToInt32(), Value: AllPermission()})

	//下载任务
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DownloadTask.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DownloadTaskScope.ToInt32(), Value: 15})

	//数据资产全景
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataAssetOverviewScope.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataAssetOverview.ToInt32(), Value: 1})

	//业务名称补全
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.Completion.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.CompletionScope.ToInt32(), Value: 15})

	// 类目
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.CatalogCategory.ToInt32(), Value: 1})

	// 权限服务 - 子视图（行列规则）
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuthServiceSubView.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})
	// 权限服务 - 逻辑视图授权申请
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuthServiceLogicViewAuthorizingRequest.ToInt32(), Value: AllPermission()})
	// 权限服务 - 指标授权申请
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuthServiceIndicatorAuthorizingRequest.ToInt32(), Value: AllPermission()})
	// 授权服务 - 接口授权申请
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuthServiceAPIAuthorizingRequest.ToInt32(), Value: AllPermission()})
	// 授权服务 - 策略详情
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuthServicePolicy.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})

	//探查任务
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ExploreTask.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ExploreTaskScope.ToInt32(), Value: 15})

	// 应用授权
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.Apps.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})

	//共享申请
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SharedDeclaration.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SharedDeclarationScope.ToInt32(), Value: 15})

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.HomePage.ToInt32(), Value: 1})

	// 供需对接
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequireList.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequirAudit.ToInt32(), Value: access_control.PUT_ACCESS.ToInt32()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequireListScope.ToInt32(), Value: AllPermission()}) // 不确定 Scope 的 Value 代表什么，先给所有权限
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequirAuditScope.ToInt32(), Value: AllPermission()}) // 不确定 Scope 的 Value 代表什么，先给所有权限

	// 前置机
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndProcessorAuditScope.ToInt32(), Value: AllPermission()}) // 不确定 Scope 的 Value 代表什么，先给所有权限

	// 业务认知分析平台 - 数据查询
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.CognitionAnalysisDataQueryScope.ToInt32(), Value: 15})

	//去重 attributesTotal to attributesInsert
	//attributesInsert := make([]*model.Resource, 0)
	attributesInsert := DumpResource(attributesTotal)

	//入库
	if err = p.resourceRepo.InsertResource(ctx, attributesInsert); err != nil {
		log.WithContext(ctx).Error("AddAccessControl DataBaseError", zap.Error(err))
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	return nil
}

// AddTCDataOwnerPermissions  数据owner
func (p *Permissions) AddTCDataOwnerPermissions(ctx context.Context) (err error) {
	roleId := access_control.TCDataOwner
	//获取业务建模所有权限
	attributes, err := p.GetBusinessModelingAllPermissions(ctx, roleId, access_control.GET_ACCESS.ToInt32())
	if err != nil {
		return err
	}
	attributesTotal := make([]*model.Resource, 0)
	attributesTotal = append(attributesTotal, attributes...)

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ExceptSystemMgm.ToInt32(), Value: 15})

	//数据资产全景
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataAssetOverviewScope.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataAssetOverview.ToInt32(), Value: 1})

	//业务标准-数据标准 权限
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataStandard.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataStandardScope.ToInt32(), Value: 1})

	// 应用授权
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.Apps.ToInt32(), Value: 1})

	//主题域 业务流程
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.BusinessDomain.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.BusinessDomainScope.ToInt32(), Value: 1})

	//主体域
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SubjectDomain.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SubjectDomainScope.ToInt32(), Value: 1})

	//获取 业务标准-数据标准 查看权限
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataStandard.ToInt32(), Value: 3})

	//逻辑视图 查看权限
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FormView.ToInt32(), Value: 1})

	//接口服务管理(前台)
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ServiceManagementFront.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})

	//接口服务管理(后台)
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ServiceManagement.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})

	//获取 项目任务 权限
	attributes, err = p.GetProjectTaskGetPermissions(ctx, roleId)
	if err != nil {
		return err
	}
	attributesTotal = append(attributesTotal, attributes...)

	//获取 新建标准任务 权限
	attributes, err = p.GetNewStandardTaskGetPermissions(ctx, roleId)
	if err != nil {
		return err
	}
	attributesTotal = append(attributesTotal, attributes...)

	//数据运营管理-数据需求申请 权限
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataFeature.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataFeatureScope.ToInt32(), Value: 15})

	//申请清单
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogApplyList.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogApplyListScope.ToInt32(), Value: 15})

	//需求申请
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogDataFeature.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogDataFeatureScope.ToInt32(), Value: 15})

	//数据运营-业务诊断
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.BusinessDiagnosis.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.BusinessDiagnosisScope.ToInt32(), Value: 1})

	//权限服务
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuthService.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuthServiceScope.ToInt32(), Value: 15})
	// 权限服务 - 子视图（行列规则）
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuthServiceSubView.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})
	// 权限服务 - 逻辑视图授权申请
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuthServiceLogicViewAuthorizingRequest.ToInt32(), Value: AllPermission()})
	// 权限服务 - 指标授权申请
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuthServiceIndicatorAuthorizingRequest.ToInt32(), Value: AllPermission()})
	// 授权服务 - 接口授权申请
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuthServiceAPIAuthorizingRequest.ToInt32(), Value: AllPermission()})
	// 授权服务 - 策略详情
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuthServicePolicy.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})

	//获取 部分数据资产中心 权限
	attributes, err = p.GetDataAssetPartResource(ctx, roleId)
	if err != nil {
		return err
	}
	attributesTotal = append(attributesTotal, attributes...)

	//获取 新建主干业务任务 权限
	attributes, err = p.GetNewMainBusinessTaskGetPermissions(ctx, roleId)
	if err != nil {
		return err
	}
	attributesTotal = append(attributesTotal, attributes...)
	//获取 业务建模任务 get权限
	attributes, err = p.GetModelingTaskGetPermissions(ctx, roleId)
	if err != nil {
		return err
	}
	attributesTotal = append(attributesTotal, attributes...)
	//获取 业务指标梳理任务 get权限
	attributes, err = p.GetIndicatorTaskGetPermissions(ctx, roleId)
	if err != nil {
		return err
	}
	attributesTotal = append(attributesTotal, attributes...)

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuditPending.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuditPendingScope.ToInt32(), Value: 15})

	//应用中心-场景分析
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SceneAnalysis.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SceneAnalysisScope.ToInt32(), Value: 15})

	//资源配置
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.GetDataUsingType.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.GetDataUsingTypeScope.ToInt32(), Value: 15})

	//业务更新时间黑名单
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.TimestampBlacklist.ToInt32(), Value: 0})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.TimestampBlacklistScope.ToInt32(), Value: 0})

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.IndicatorManagement.ToInt32(), Value: 15})

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataModel.ToInt32(), Value: 15})

	//业务指标
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.BusinessIndicator.ToInt32(), Value: 15})

	// 编码
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.Code.ToInt32(), Value: AllPermission()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.CodeScope.ToInt32(), Value: AllPermission()})

	//下载任务
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DownloadTask.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DownloadTaskScope.ToInt32(), Value: 15})

	// 类目
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.CatalogCategory.ToInt32(), Value: 1})

	//共享申请
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SharedDeclaration.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SharedDeclarationScope.ToInt32(), Value: 15})

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.HomePage.ToInt32(), Value: 1})

	// 供需对接
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequireList.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequirConfirm.ToInt32(), Value: (access_control.GET_ACCESS | access_control.POST_ACCESS | access_control.DELETE_ACCESS).ToInt32()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequirImplement.ToInt32(), Value: access_control.PUT_ACCESS.ToInt32()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequirAudit.ToInt32(), Value: access_control.PUT_ACCESS.ToInt32()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequireListScope.ToInt32(), Value: AllPermission()})     // 不确定 Scope 的 Value 代表什么，先给所有权限
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequirConfirmScope.ToInt32(), Value: AllPermission()})   // 不确定 Scope 的 Value 代表什么，先给所有权限
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequirImplementScope.ToInt32(), Value: AllPermission()}) // 不确定 Scope 的 Value 代表什么，先给所有权限
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequirAuditScope.ToInt32(), Value: AllPermission()})     // 不确定 Scope 的 Value 代表什么，先给所有权限

	// 前置机
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndProcessorAuditScope.ToInt32(), Value: AllPermission()}) // 不确定 Scope 的 Value 代表什么，先给所有权限

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ShareApplication.ToInt32(), Value: AllPermission()}) //共享申请

	// 业务认知分析平台 - 数据查询
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.CognitionAnalysisDataQueryScope.ToInt32(), Value: 15})

	//去重 attributesTotal to attributesInsert
	//attributesInsert := make([]*model.Resource, 0)
	attributesInsert := DumpResource(attributesTotal)

	//入库
	if err = p.resourceRepo.InsertResource(ctx, attributesInsert); err != nil {
		log.WithContext(ctx).Error("AddAccessControl DataBaseError", zap.Error(err))
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	return nil
}

// AddTCDataButlerPermissions   数据管家
func (p *Permissions) AddTCDataButlerPermissions(ctx context.Context) (err error) {
	roleId := access_control.TCDataButler
	//获取业务建模所有权限
	attributes, err := p.GetBusinessModelingAllPermissions(ctx, roleId, access_control.GET_ACCESS.ToInt32())
	if err != nil {
		return err
	}
	attributesTotal := make([]*model.Resource, 0)
	attributesTotal = append(attributesTotal, attributes...)

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ExceptSystemMgm.ToInt32(), Value: 15})

	//获取业务建模加工采集等所有权限
	attributes, err = p.GetDataAcquisitionAndDataProcessingPermissions(ctx, roleId, access_control.GET_ACCESS.ToInt32())
	if err != nil {
		return err
	}
	attributesTotal = append(attributesTotal, attributes...)

	//数据资产全景
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataAssetOverviewScope.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataAssetOverview.ToInt32(), Value: 1})

	//业务标准-数据标准 权限
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataStandard.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataStandardScope.ToInt32(), Value: 1})

	//主题域 业务流程
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.BusinessDomain.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.BusinessDomainScope.ToInt32(), Value: 1})

	//主体域
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SubjectDomain.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SubjectDomainScope.ToInt32(), Value: 1})

	//获取 业务标准-数据标准 查看权限
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataStandard.ToInt32(), Value: 3})

	//接口服务管理(前台)
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ServiceManagementFront.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ServiceManagementFrontScope.ToInt32(), Value: 15})

	//数据运营-业务诊断
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.BusinessDiagnosis.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.BusinessDiagnosisScope.ToInt32(), Value: 1})

	//逻辑视图 查看权限
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FormView.ToInt32(), Value: 1})

	//获取 项目任务 权限
	attributes, err = p.GetProjectTaskPermissions(ctx, roleId)
	if err != nil {
		return err
	}
	attributesTotal = append(attributesTotal, attributes...)

	//获取 新建标准任务 权限
	//attributes, err = p.GetNewStandardTaskPermissions(ctx, roleId)
	//if err != nil {
	//	return err
	//}
	//attributesTotal = append(attributesTotal, attributes...)

	//数据运营管理-数据需求申请 权限
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataFeature.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataFeatureScope.ToInt32(), Value: 15})

	//申请清单
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogApplyList.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogApplyListScope.ToInt32(), Value: 15})

	//需求申请
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogDataFeature.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogDataFeatureScope.ToInt32(), Value: 15})

	//获取 部分数据资产中心 权限
	attributes, err = p.GetDataAssetPartResource(ctx, roleId)
	if err != nil {
		return err
	}
	attributesTotal = append(attributesTotal, attributes...)

	//获取 新建主干业务任务 权限
	attributes, err = p.GetNewMainBusinessTaskGetPermissions(ctx, roleId)
	if err != nil {
		return err
	}
	attributesTotal = append(attributesTotal, attributes...)
	//获取 业务建模任务 get权限
	attributes, err = p.GetModelingTaskGetPermissions(ctx, roleId)
	if err != nil {
		return err
	}
	attributesTotal = append(attributesTotal, attributes...)
	//获取 业务指标梳理任务 get权限
	attributes, err = p.GetIndicatorTaskGetPermissions(ctx, roleId)
	if err != nil {
		return err
	}
	attributesTotal = append(attributesTotal, attributes...)

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuditPending.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuditPendingScope.ToInt32(), Value: 15})

	//应用中心-场景分析
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SceneAnalysis.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SceneAnalysisScope.ToInt32(), Value: 15})

	//资源配置
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.GetDataUsingType.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.GetDataUsingTypeScope.ToInt32(), Value: 15})

	//业务更新时间黑名单
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.TimestampBlacklist.ToInt32(), Value: 0})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.TimestampBlacklistScope.ToInt32(), Value: 0})

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.IndicatorManagement.ToInt32(), Value: 15})

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataModel.ToInt32(), Value: 15})

	//业务指标
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.BusinessIndicator.ToInt32(), Value: 15})

	// 编码
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.Code.ToInt32(), Value: AllPermission()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.CodeScope.ToInt32(), Value: AllPermission()})

	//下载任务
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DownloadTask.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DownloadTaskScope.ToInt32(), Value: 15})

	// 类目
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.CatalogCategory.ToInt32(), Value: 1})

	// 权限服务 - 子视图（行列规则）
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuthServiceSubView.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})
	// 权限服务 - 逻辑视图授权申请
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuthServiceLogicViewAuthorizingRequest.ToInt32(), Value: AllPermission()})
	// 权限服务 - 指标授权申请
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuthServiceIndicatorAuthorizingRequest.ToInt32(), Value: AllPermission()})
	// 授权服务 - 接口授权申请
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuthServiceAPIAuthorizingRequest.ToInt32(), Value: AllPermission()})
	// 授权服务 - 策略详情
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuthServicePolicy.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})

	// 应用授权
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.Apps.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})

	//共享申请
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SharedDeclaration.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SharedDeclarationScope.ToInt32(), Value: 15})

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.HomePage.ToInt32(), Value: 1})

	// 供需对接
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequireList.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequirAudit.ToInt32(), Value: access_control.PUT_ACCESS.ToInt32()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequireListScope.ToInt32(), Value: AllPermission()}) // 不确定 Scope 的 Value 代表什么，先给所有权限
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequirAuditScope.ToInt32(), Value: AllPermission()}) // 不确定 Scope 的 Value 代表什么，先给所有权限

	// 前置机
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndProcessorAuditScope.ToInt32(), Value: AllPermission()}) // 不确定 Scope 的 Value 代表什么，先给所有权限

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ShareApplication.ToInt32(), Value: AllPermission()}) //共享申请

	// 业务认知分析平台 - 数据查询
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.CognitionAnalysisDataQueryScope.ToInt32(), Value: 15})

	//去重 attributesTotal to attributesInsert
	//attributesInsert := make([]*model.Resource, 0)
	attributesInsert := DumpResource(attributesTotal)

	//入库
	if err = p.resourceRepo.InsertResource(ctx, attributesInsert); err != nil {
		log.WithContext(ctx).Error("AddAccessControl DataBaseError", zap.Error(err))
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	return nil
}

// AddTCNormalPermissions  普通用户权限
func (p *Permissions) AddTCNormalPermissions(ctx context.Context) (err error) {
	roleId := access_control.TCNormal
	//获取 数据资产中心 权限
	attributes, err := p.GetDataAssetResource(ctx, access_control.TCNormal)
	if err != nil {
		return err
	}

	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.ExceptSystemMgm.ToInt32(), Value: 15})

	//数据运营管理-数据需求申请 权限
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.DataFeature.ToInt32(), Value: 15})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.DataFeatureScope.ToInt32(), Value: 15})

	//申请清单
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogApplyList.ToInt32(), Value: 15})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogApplyListScope.ToInt32(), Value: 15})

	//需求申请
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogDataFeature.ToInt32(), Value: 15})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogDataFeatureScope.ToInt32(), Value: 15})

	//审核待办 权限
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.AuditPending.ToInt32(), Value: 15})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.AuditPendingScope.ToInt32(), Value: 15})

	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.BusinessStructure.ToInt32(), Value: 1})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.InfoSystem.ToInt32(), Value: 1})
	//接口服务管理(前台)
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.ServiceManagementFront.ToInt32(), Value: 15})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.ServiceManagementFrontScope.ToInt32(), Value: 15})

	//应用中心-场景分析
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.SceneAnalysis.ToInt32(), Value: 15})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.SceneAnalysisScope.ToInt32(), Value: 15})

	//主体域
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.SubjectDomain.ToInt32(), Value: 1})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.SubjectDomainScope.ToInt32(), Value: 1})

	//资源配置
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.GetDataUsingType.ToInt32(), Value: 1})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.GetDataUsingTypeScope.ToInt32(), Value: 1})

	//业务更新时间黑名单
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.TimestampBlacklist.ToInt32(), Value: 0})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.TimestampBlacklistScope.ToInt32(), Value: 0})

	//逻辑视图 查看权限
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.FormView.ToInt32(), Value: 1})

	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.IndicatorManagement.ToInt32(), Value: 15})

	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.DataModel.ToInt32(), Value: 15})

	//业务指标
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.BusinessIndicator.ToInt32(), Value: 15})

	// 编码
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.Code.ToInt32(), Value: AllPermission()})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.CodeScope.ToInt32(), Value: AllPermission()})

	//下载任务
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.DownloadTask.ToInt32(), Value: 15})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.DownloadTaskScope.ToInt32(), Value: 15})

	//数据资产全景
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.DataAssetOverviewScope.ToInt32(), Value: 1})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.DataAssetOverview.ToInt32(), Value: 1})

	// 类目
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.CatalogCategory.ToInt32(), Value: 1})

	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.DataStandard.ToInt32(), Value: 1})

	// 权限服务 - 子视图（行列规则）
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.AuthServiceSubView.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})
	// 权限服务 - 逻辑视图授权申请
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.AuthServiceLogicViewAuthorizingRequest.ToInt32(), Value: AllPermission()})
	// 权限服务 - 指标授权申请
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.AuthServiceIndicatorAuthorizingRequest.ToInt32(), Value: AllPermission()})
	// 授权服务 - 接口授权申请
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.AuthServiceAPIAuthorizingRequest.ToInt32(), Value: AllPermission()})
	// 授权服务 - 策略详情
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.AuthServicePolicy.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})

	// 应用授权
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.Apps.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})

	//共享申请
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.SharedDeclaration.ToInt32(), Value: 15})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.SharedDeclarationScope.ToInt32(), Value: 15})

	// 前置机
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.FrontEndProcessor.ToInt32(), Value: (access_control.GET_ACCESS | access_control.POST_ACCESS | access_control.DELETE_ACCESS).ToInt32()})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.FrontEndProcessorRequest.ToInt32(), Value: access_control.PUT_ACCESS.ToInt32()})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.FrontEndProcessorReceipt.ToInt32(), Value: access_control.PUT_ACCESS.ToInt32()})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.FrontEndProcessorRequestScope.ToInt32(), Value: AllPermission()})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.FrontEndProcessorReceiptScope.ToInt32(), Value: AllPermission()})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.FrontEndProcessorAuditScope.ToInt32(), Value: AllPermission()}) // 不确定 Scope 的 Value 代表什么，先给所有权限

	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.HomePage.ToInt32(), Value: 1})

	// 供需对接
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequireList.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequirAudit.ToInt32(), Value: access_control.PUT_ACCESS.ToInt32()})
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequireListScope.ToInt32(), Value: AllPermission()}) // 不确定 Scope 的 Value 代表什么，先给所有权限
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.FrontEndRequirAuditScope.ToInt32(), Value: AllPermission()}) // 不确定 Scope 的 Value 代表什么，先给所有权限

	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.ShareApplication.ToInt32(), Value: AllPermission()}) //共享申请

	// 业务认知分析平台 - 数据查询
	attributes = append(attributes, &model.Resource{RoleID: roleId, Type: access_control.CognitionAnalysisDataQueryScope.ToInt32(), Value: 15})

	//入库
	if err = p.resourceRepo.InsertResource(ctx, attributes); err != nil {
		log.WithContext(ctx).Error("AddAccessControl DataBaseError", zap.Error(err))
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	return nil
}

// AddApplicationDeveloperPermissions   应用开发者
func (p *Permissions) AddApplicationDeveloperPermissions(ctx context.Context) (err error) {
	roleId := access_control.ApplicationDeveloper

	attributesTotal := make([]*model.Resource, 0)

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ExceptSystemMgm.ToInt32(), Value: 15})

	//集成应用
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ApplicationManagement.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ApplicationManagementScope.ToInt32(), Value: 15})

	// 应用授权
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.Apps.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AppsScope.ToInt32(), Value: 15})

	// 省直达应用上报
	// attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ProvinceAppsReport.ToInt32(), Value: 15})
	// attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ProvinceAppsReportScope.ToInt32(), Value: 15})

	//服务超市
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogDataCatalogScope.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogDataFeatureScope.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogApplyListScope.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ServiceManagementFrontScope.ToInt32(), Value: 1})

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogDataCatalog.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogDataFeature.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataResourceCatalogApplyList.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ServiceManagementFront.ToInt32(), Value: 1})

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.IndicatorManagement.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.InfoSystem.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.Role.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ServiceManagement.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.BusinessStructure.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SceneAnalysis.ToInt32(), Value: 15})

	//资源配置
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.GetDataUsingType.ToInt32(), Value: AllPermission()})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.GetDataUsingTypeScope.ToInt32(), Value: AllPermission()})

	// 类目
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.CatalogCategory.ToInt32(), Value: 1})

	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.DataStandard.ToInt32(), Value: 1})

	// 授权服务 - 策略详情
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuthServicePolicy.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})

	//集成应用的数据权限

	// 权限服务 - 子视图（行列规则）
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuthServiceSubView.ToInt32(), Value: access_control.GET_ACCESS.ToInt32()})
	// 权限服务 - 逻辑视图授权申请
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuthServiceLogicViewAuthorizingRequest.ToInt32(), Value: AllPermission()})

	//审核待办 权限
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuditPending.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.AuditPendingScope.ToInt32(), Value: 15})

	// 前置机
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndProcessorAuditScope.ToInt32(), Value: AllPermission()}) // 不确定 Scope 的 Value 代表什么，先给所有权限

	// 业务认知分析平台 - 数据查询
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.CognitionAnalysisDataQueryScope.ToInt32(), Value: 15})

	attributesInsert := DumpResource(attributesTotal)

	//入库
	if err = p.resourceRepo.InsertResource(ctx, attributesInsert); err != nil {
		log.WithContext(ctx).Error("AddAccessControl DataBaseError", zap.Error(err))
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	return nil
}

// AddSecurityMgm   安全管理员
func (p *Permissions) AddSecurityMgm(ctx context.Context) (err error) {
	roleId := access_control.SecurityMgm

	attributesTotal := make([]*model.Resource, 0)

	//逻辑视图和非系统管理员查看数据
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.ExceptSystemMgm.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FormView.ToInt32(), Value: 1})

	// 安全管理员权限
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SecurityManagementScope.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SecurityManagement.ToInt32(), Value: 15})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SecurityManagementScope.ToInt32(), Value: -60})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SecurityManagement.ToInt32(), Value: 41})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SecurityManagementScope.ToInt32(), Value: -96})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.SecurityManagement.ToInt32(), Value: 80})

	// 前置机
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.FrontEndProcessorAuditScope.ToInt32(), Value: AllPermission()}) // 不确定 Scope 的 Value 代表什么，先给所有权限

	//资源配置
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.GetDataUsingType.ToInt32(), Value: 1})
	attributesTotal = append(attributesTotal, &model.Resource{RoleID: roleId, Type: access_control.GetDataUsingTypeScope.ToInt32(), Value: 1})

	attributesInsert := DumpResource(attributesTotal)

	//入库
	if err = p.resourceRepo.InsertResource(ctx, attributesInsert); err != nil {
		log.WithContext(ctx).Error("AddAccessControl DataBaseError", zap.Error(err))
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	return nil
}

// -----------------  Get Permission Value

func AllPermission() int32 {
	var permission access_control.AccessType
	for t := range access_control.AllAccessType {
		permission |= t
	}
	return permission.ToInt32()
}

func DumpResource(resource []*model.Resource) []*model.Resource {
	resourceMap := make(map[int32]int32, 0)
	result := make([]*model.Resource, 0)

	//去重
	for _, r := range resource {
		_, ok := resourceMap[r.Type]
		if !ok {
			resourceMap[r.Type] = r.Value
			result = append(result, r)
		} else {
			resourceMap[r.Type] = resourceMap[r.Type] | r.Value //按位与运算
		}
	}

	//填值
	for _, re := range result {
		re.Value = resourceMap[re.Type]
	}
	return result
}
