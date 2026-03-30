package impl

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/kweaver-ai/idrm-go-common/rest/base"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/data_exploration"
	msqclient "github.com/kweaver-ai/proton-mq-sdk-go"
	"gorm.io/gorm"

	"github.com/google/uuid"
	"go.uber.org/zap"

	cc "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/data_catalog"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/configuration"
	gorm_data_aggregation_inventory "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_aggregation_inventory"
	model_aggregation_plan "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_aggregation_plan"
	gorm_data_aggregation_resource "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_aggregation_resource"
	model_comprehension_plan "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_comprehension_plan"
	model_processing_plan "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_processing_plan"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_quality_improvement"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/database"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/database/af_business"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/database/af_configuration"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/database/af_main"
	fusion_model_repo "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/fusion_model"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/quality_audit_model"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_flow_info"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_project"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_task"
	work_order "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order_extend"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order_task"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/workflow"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/common"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_aggregation_inventory"
	data_aggregation_plan "github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_aggregation_plan/impl"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_research_report"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/user"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	task_center_v1 "github.com/kweaver-ai/idrm-go-common/api/task_center/v1"
	"github.com/kweaver-ai/idrm-go-common/callback"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	data_catalog_driven "github.com/kweaver-ai/idrm-go-common/rest/data_catalog"
	"github.com/kweaver-ai/idrm-go-common/rest/data_view"
	"github.com/kweaver-ai/idrm-go-common/rest/demand_management"
	"github.com/kweaver-ai/idrm-go-common/rest/standardization"
	"github.com/kweaver-ai/idrm-go-common/rest/user_management"
	"github.com/kweaver-ai/idrm-go-common/util/ptr"
	"github.com/kweaver-ai/idrm-go-common/util/sets"
	wf_go "github.com/kweaver-ai/idrm-go-common/workflow"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
	utilities "github.com/kweaver-ai/idrm-go-frame/core/utils"
	data_view_driven "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/data_view"
)

type workOrderUseCase struct {
	repo                  work_order.Repo
	userRepo              user.IUser
	wf                    wf_go.WorkflowInterface
	wfRest                workflow.WorkflowInterface
	ccDriven              configuration_center.Driven
	comprehensionPlanRepo model_comprehension_plan.DataComprehensionPlanRepo
	aggregationPlanRepo   model_aggregation_plan.DataAggregatioPlanRepo
	processingPlanRepo    model_processing_plan.DataProcessingPlanRepo
	dataCatalog           data_catalog.Call
	cc                    cc.Call
	taskRepo              tc_task.Repo
	projectRepo           tc_project.Repo
	flowInfoRepo          tc_flow_info.Repo
	improvementRepo       data_quality_improvement.Repo
	producer              kafkax.Producer
	userDriven            user_management.DrivenUserMgnt
	// 数据库 data_aggregation_inventory
	dataAggregationInventoryRepo gorm_data_aggregation_inventory.Repository
	// 数据库 data_aggregation_resources
	dataAggregationResources gorm_data_aggregation_resource.Interface

	// 数据归集清单
	dataAggregationInventory data_aggregation_inventory.Domain
	// 数据调研报告
	dataResearchReport data_research_report.DataResearchReport

	// 数据表 af_business.business_form_standard
	BusinessFormStandard af_business.BusinessFormStandardInterface
	// 数据表 af_business.user
	BusinessUser af_business.UserInterface
	// 数据表 af_business.business_model
	BusinessModel af_business.BusinessModelInterface
	// 数据表 af_business.domain
	BusinessDomain af_business.DomainInterface
	// 数据表 af_configuration.datasource
	Datasource af_configuration.DatasourceInterface
	// 数据表 af_configuration.objects
	Department af_configuration.ObjectInterface
	// 数据表 af_configuration.info_system
	InfoSystem af_configuration.InfoSystemInterface
	// 数据表 af_main.form_view
	FormView af_main.FormViewInterface
	// 微服务 data-view
	dataView data_view.Driven
	// 微服务 data-exploration-service
	dataExplore data_exploration.DataExploration
	// 微服务 standardization
	standardization       standardization.Driven
	fusionModelRepo       fusion_model_repo.FusionModelRepo
	workOrderExtendRepo   work_order_extend.WorkOrderExtendRepo
	dataCatalogRepo       data_catalog_driven.Driven
	demandManagement      demand_management.Driven
	workOrderTaskRepo     work_order_task.Repository
	qualityAuditModelRepo quality_audit_model.QualityAuditModelRepo
	// 工单回调
	callback *WorkOrderCallback

	mqClient msqclient.ProtonMQClient
	ccRepo   configuration.Repo

	dv data_view_driven.DataView
}

func NewWorkOrderUseCase(
	repo work_order.Repo,
	userRepo user.IUser,
	wf wf_go.WorkflowInterface,
	wfRest workflow.WorkflowInterface,
	ccDriven configuration_center.Driven,
	comprehensionPlanRepo model_comprehension_plan.DataComprehensionPlanRepo,
	aggregationPlanRepo model_aggregation_plan.DataAggregatioPlanRepo,
	dataAggregationInventoryRepo gorm_data_aggregation_inventory.Repository,
	dataAggregationResources gorm_data_aggregation_resource.Interface,
	processingPlanRepo model_processing_plan.DataProcessingPlanRepo,
	dataCatalog data_catalog.Call,
	cc cc.Call,
	taskRepo tc_task.Repo,
	projectRepo tc_project.Repo,
	flowInfoRepo tc_flow_info.Repo,
	improvementRepo data_quality_improvement.Repo,
	producer kafkax.Producer,
	userDriven user_management.DrivenUserMgnt,

	// 数据归集清单
	dataAggregationInventory data_aggregation_inventory.Domain,
	// 数据调研报告
	dataResearchReport data_research_report.DataResearchReport,
	// 数据库
	database database.DatabaseInterface,
	fusionModelRepo fusion_model_repo.FusionModelRepo,
	workOrderExtendRepo work_order_extend.WorkOrderExtendRepo,

	// 微服务 data-view
	dataView data_view.Driven,
	// 微服务 data-exploration-service
	dataExplore data_exploration.DataExploration,
	// 微服务 standardization
	standardization standardization.Driven,
	dataCatalogRepo data_catalog_driven.Driven,
	demandManagement demand_management.Driven,
	workOrderTaskRepo work_order_task.Repository,
	qualityAuditModelRepo quality_audit_model.QualityAuditModelRepo,
	callback callback.Interface,
	mqClient msqclient.ProtonMQClient,
	ccRepo configuration.Repo,
	dv data_view_driven.DataView,
) domain.WorkOrderUseCase {
	w := &workOrderUseCase{
		repo:                  repo,
		userRepo:              userRepo,
		wf:                    wf,
		wfRest:                wfRest,
		ccDriven:              ccDriven,
		comprehensionPlanRepo: comprehensionPlanRepo,
		aggregationPlanRepo:   aggregationPlanRepo,
		processingPlanRepo:    processingPlanRepo,
		dataCatalog:           dataCatalog,
		cc:                    cc,
		taskRepo:              taskRepo,
		projectRepo:           projectRepo,
		flowInfoRepo:          flowInfoRepo,
		improvementRepo:       improvementRepo,
		producer:              producer,
		userDriven:            userDriven,
		// 数据库 data_aggregation_inventory
		dataAggregationInventoryRepo: dataAggregationInventoryRepo,
		// 数据库 data_aggregation_resources
		dataAggregationResources: dataAggregationResources,
		// 数据归集清单
		dataAggregationInventory: dataAggregationInventory,
		// 数据调研报告
		dataResearchReport: dataResearchReport,
		// 数据表 af_business.business_form_standard
		BusinessFormStandard: database.AFBusiness().BusinessFormStandard(),
		// 数据表 af_business.user
		BusinessUser: database.AFBusiness().User(),
		// 数据表 af_business.business_model
		BusinessModel: database.AFBusiness().BusinessModel(),
		// 数据表 af_business.domain
		BusinessDomain: database.AFBusiness().Domain(),
		// 数据表 af_configuration.datasource
		Datasource: database.AFConfiguration().Datasources(),
		// 数据表 af_configuration.objects
		Department: database.AFConfiguration().Objects(),
		// 数据表 af_configuration.info_system
		InfoSystem: database.AFConfiguration().InfoSystems(),
		// 数据表 af_main.form_view
		FormView: database.AFMain().FormViews(),
		// 微服务 data-view
		dataView: dataView,
		// 微服务 data-exploration-service
		dataExplore: dataExplore,
		// 微服务 standardization
		standardization:       standardization,
		fusionModelRepo:       fusionModelRepo,
		workOrderExtendRepo:   workOrderExtendRepo,
		dataCatalogRepo:       dataCatalogRepo,
		demandManagement:      demandManagement,
		workOrderTaskRepo:     workOrderTaskRepo,
		qualityAuditModelRepo: qualityAuditModelRepo,
		// 工单回调

		mqClient: mqClient,
		ccRepo:   ccRepo,
		dv:       dv,
	}
	woc := &WorkOrderCallback{
		CallbackEnabled:          settings.ConfigInstance.Callback.Enabled,
		Client:                   callback.TaskCenterV1().WorkOrder(),
		FormView:                 database.AFMain().FormViews(),
		DataAggregationResources: dataAggregationResources,
		workOrder:                repo,
		workOrderExtendRepo:      workOrderExtendRepo,
		workOrderDomain:          w,
		qualityAuditRelation:     qualityAuditModelRepo,
		dataView:                 dataView,
		dataExplore:              dataExplore,
		Datasource:               database.AFConfiguration().Datasources(),
		User:                     database.AFConfiguration().Users(),
		project:                  w.projectRepo,
		flowInfo:                 w.flowInfoRepo,
		ccDriven:                 ccDriven,
	}
	w.callback = woc
	wf.RegistConusmeHandlers(workflow.AF_TASKS_DATA_COMPREHENSION_WORK_ORDER, w.WorkOrderAuditProcessMsgProc,
		w.WorkOrderAuditResultMsgProc, nil)
	// 任务中心调研工单任务消费者
	wf.RegistConusmeHandlers(workflow.AF_TASKS_RESEARCH_REPORT_WORK_ORDER, w.WorkOrderAuditProcessMsgProc,
		w.WorkOrderAuditResultMsgProc, nil)
	// 任务中心资源编目工单任务消费者
	wf.RegistConusmeHandlers(workflow.AF_TASKS_DATA_CATALOG_WORK_ORDER, w.WorkOrderAuditProcessMsgProc,
		w.WorkOrderAuditResultMsgProc, nil)
	// 任务中心前置机申请工单任务消费者
	wf.RegistConusmeHandlers(workflow.AF_TASKS_FRONT_END_PROCESSORS_WORK_ORDER, w.WorkOrderAuditProcessMsgProc,
		w.WorkOrderAuditResultMsgProc, nil)
	wf.RegistConusmeHandlers(workflow.AF_TASKS_DATA_QUALITY_WORK_ORDER, w.WorkOrderAuditProcessMsgProc,
		w.WorkOrderAuditResultMsgProc, nil)
	// 数据归集工单审核消费者
	{
		c := &dataAggregationWorkOrderAuditConsumer{
			r:        repo,
			callback: woc,
		}
		wf.RegistConusmeHandlers(workflow.AF_TASKS_DATA_AGGREGATION_WORK_ORDER, w.WorkOrderAuditProcessMsgProc, w.WorkOrderAuditResultMsgProc, c.onProcDefDel)
		// wf.RegistConusmeHandlers(workflow.AF_TASKS_DATA_AGGREGATION_WORK_ORDER, c.onProcess, c.onResult, c.onProcDefDel)
	}
	// 注册处理审核消息的 Handler：标准化工单
	wf.RegistConusmeHandlers(
		workflow.AF_TASKS_DATA_STANDARDIZATION_WORK_ORDER,
		w.WorkOrderAuditProcessMsgProc,
		w.WorkOrderAuditResultMsgProc,
		nil,
	)
	// 注册处理审核消息的 Handler：数据融合工单
	wf.RegistConusmeHandlers(
		workflow.AF_TASKS_DATA_FUSION_WORK_ORDER,
		w.WorkOrderAuditProcessMsgProc,
		w.WorkOrderAuditResultMsgProc,
		nil,
	)
	// 注册处理审核消息的 Handler：数据质量稽核工单
	wf.RegistConusmeHandlers(
		workflow.AF_TASKS_DATA_QUALITY_AUDIT_WORK_ORDER,
		w.WorkOrderAuditProcessMsgProc,
		w.WorkOrderAuditResultMsgProc,
		nil,
	)

	// 注册项目开启的回调函数
	w.projectRepo.RegisterCallbackOnNodeStart("start-work-order", w.CallbackOnNodeStart)

	return w
}

func (w *workOrderUseCase) Create(ctx context.Context, req *domain.WorkOrderCreateReq, userId, userName, departmentId string) (*domain.IDResp, error) {
	// 通过码元 Code 补全码元 ID
	for i, v := range req.FormViews {
		for j, f := range v.Fields {
			e := f.DataElement
			// 忽略未配置码元
			if e == nil {
				continue
			}
			// 忽略码元 ID 不为空
			if e.ID != 0 {
				continue
			}
			// 忽略码元 Code 为空
			if e.Code == 0 {
				continue
			}
			// 根据码元 Code 获取码元 ID
			resp, err := w.standardization.GetDataElementDetailByCode(ctx)
			if err != nil {
				return nil, err
			}
			for _, r := range resp {
				if r.Code != strconv.Itoa(e.Code) {
					continue
				}
				id, err := strconv.Atoi(r.ID)
				if err != nil {
					return nil, err
				}
				req.FormViews[i].Fields[j].DataElement.ID = id
				break
			}
		}
	}
	// 根据逻辑视图 ID 补全 逻辑视图字段
	for i, v := range req.FormViews {
		if len(v.Fields) != 0 {
			continue
		}
		// 获取逻辑视图字段列表
		res, err := w.dataView.GetDataViewField(ctx, v.ID)
		if err != nil {
			return nil, err
		}

		for _, f := range res.FieldsRes {
			req.FormViews[i].Fields = append(req.FormViews[i].Fields, domain.WorkOrderDetailFormViewField{ID: f.ID, StandardRequired: true})
		}
	}

	repeat, err := w.repo.CheckNameRepeat(ctx, "", req.Name, enum.ToInteger[domain.WorkOrderType](req.Type).Int32())
	if err != nil {
		return nil, err
	}
	if repeat {
		return nil, errorcode.Desc(errorcode.PublicDatabaseError)
	}
	uniqueID, err := utilities.GetUniqueID()
	if err != nil {
		return nil, errorcode.Detail(errorcode.InternalError, err)
	}
	workOrderId := uuid.NewString()
	currentTime := time.Now()
	code := fmt.Sprintf("gd%d", currentTime.UnixMilli())
	workOrder := &model.WorkOrder{
		ID:                     uniqueID,
		WorkOrderID:            workOrderId,
		Name:                   req.Name,
		Code:                   code,
		DepartmentId:           departmentId,
		DataSourceDepartmentId: req.DataSourceDepartmentId,
		Type:                   enum.ToInteger[domain.WorkOrderType](req.Type).Int32(),
		Status:                 domain.WorkOrderStatusPendingSignature.Integer.Int32(),
		Draft:                  ptr.To(req.Draft),
		ResponsibleUID:         req.ResponsibleUID,
		Priority:               enum.ToInteger[constant.CommonPriority](req.Priority).Int32(),
		CatalogIds:             strings.Join(req.CatalogIds, ","),
		Description:            req.Description,
		Remark:                 req.Remark,
		SourceType:             enum.ToInteger[domain.WorkOrderSourceType](req.SourceType).Int32(),
		SourceID:               req.SourceId,
		SourceIDs:              req.SourceIds,
		CreatedByUID:           userId,
		CreatedAt:              currentTime,
		UpdatedByUID:           userId,
		UpdatedAt:              currentTime,
		DeletedAt:              0,
		NodeID:                 req.NodeID,
		StageID:                req.StageID,
	}
	if req.FinishedAt > 0 {
		finishedAt := time.Unix(req.FinishedAt, 0)
		workOrder.FinishedAt = &finishedAt
	}
	if req.ResponsibleUID != "" {
		workOrder.Status = domain.WorkOrderStatusSignedFor.Integer.Int32()
		workOrder.AcceptanceAt = &currentTime
	}
	if req.SourceId == "" && len(req.SourceIds) != 0 {
		req.SourceId = req.SourceIds[0]
	}
	if req.SourceId != "" && len(req.SourceIds) == 0 {
		req.SourceIds = []string{req.SourceId}
	}
	if req.SourceId != "" || len(req.SourceIds) != 0 {
		if req.ReportID != "" && req.ReportVersion > 0 && req.ReportTime > 0 {
			workOrder.ReportID = req.ReportID
			workOrder.ReportVersion = req.ReportVersion
			reportAt := time.UnixMilli(req.ReportTime)
			workOrder.ReportAt = &reportAt
		}
	}

	// 标准化工单
	if req.Type == domain.WorkOrderTypeStandardization.String {
		fields := newWorkOrderFormViewForms(req.FormViews, workOrder.WorkOrderID)
		if err := w.repo.CreateWorkOrderAndFormViewFields(ctx, workOrder, fields); err != nil {
			return nil, err
		}
	}

	// 融合工单
	if req.Type == domain.WorkOrderTypeDataFusion.String {
		workOrder.Status = domain.WorkOrderStatusSignedFor.Integer.Int32()
		workOrderExtendID, err := utilities.GetUniqueID()
		if err != nil {
			return nil, errorcode.Detail(errorcode.InternalError, err)
		}

		fusionNameModel := &model.TWorkOrderExtend{
			ID:              workOrderExtendID,
			WorkOrderID:     workOrderId,
			ExtendKey:       string(constant.FusionTableName),
			ExtendValue:     req.FusionTable.TableName,
			FusionType:      enum.ToInteger[domain.DataFusionType](req.FusionTable.FusionType, 0).Int32(),
			ExecSQL:         req.FusionTable.ExecSQL,
			SceneSQL:        req.FusionTable.SceneSQL,
			SceneAnalysisId: req.FusionTable.SceneAnalysisId,
			RunCronStrategy: getRunCronStrategyDisplay(req.FusionTable.RunCronStrategy),
			DataSourceID:    req.FusionTable.DataSourceID,
		}
		if req.FusionTable.RunStartAt > 0 {
			runStartAt := time.Unix(req.FusionTable.RunStartAt, 0)
			fusionNameModel.RunStartAt = &runStartAt
		}
		if req.FusionTable.RunEndAt > 0 {
			runEndAt := time.Unix(req.FusionTable.RunEndAt, 0)
			fusionNameModel.RunEndAt = &runEndAt
		}
		// 合并sql及调用虚拟引擎转换SQL
		if req.FusionTable.FusionType == domain.DataFusionTypeSceneAnalysis.String {
			s, err := w.Datasource.Get(ctx, req.FusionTable.DataSourceID)
			if err != nil {
				log.Warn("合并SQL get datasource fail", zap.Error(err), zap.String("id", req.FusionTable.DataSourceID))
			}
			var selectField []string
			for _, field := range req.FusionTable.Fields {
				selectField = append(selectField, fmt.Sprintf(`"%s"`, field.EName))
			}
			fieldSQL := strings.Join(selectField, ",")
			if s.TypeName == "oracle" || s.TypeName == "dameng" {
				fieldSQL = strings.ToUpper(fieldSQL)
			}
			selectSQL := fmt.Sprintf(`SELECT %s FROM (%s) %s`, fieldSQL, req.FusionTable.SceneSQL, req.FusionTable.TableName)
			// 如果是hive增加分区
			insertSQl := ""
			if s.TypeName == "hive-jdbc" {
				insertSQl = fmt.Sprintf(`SET hive.exec.dynamic.partition=true;SET hive.exec.dynamic.partition.mode=nonstrict; INSERT INTO %s.%s PARTITION("dat_dt") (%s) %s`, s.Schema, req.FusionTable.TableName, fieldSQL, selectSQL)
			} else {
				insertSQl = fmt.Sprintf(`INSERT INTO %s.%s (%s) %s`, s.Schema, req.FusionTable.TableName, fieldSQL, selectSQL)
			}
			execSql := insertSQl
			if s.TypeName != "postgresql" && s.TypeName != "oracle" && s.TypeName != "dameng" {
				execSql = strings.ReplaceAll(insertSQl, "\"", "`")
			}

			log.WithContext(ctx).Info("融合工单生成SQL InsertSQL: ", zap.Any("sql", execSql))
			fusionNameModel.ExecSQL = execSql
			// TODO 调用虚拟引擎转换sql

		}

		fields, err := newFusionWorkOrderTableFields(req.FusionTable.Fields, workOrder.WorkOrderID, userId)
		if err := w.repo.CreateFusionWorkOrderAndFusionTable(ctx, workOrder, fusionNameModel, fields); err != nil {
			return nil, err
		}
	}

	// 数据质量稽核工单
	if req.Type == domain.WorkOrderTypeDataQualityAudit.String {
		workOrder.Status = domain.WorkOrderStatusSignedFor.Integer.Int32()
		var remark domain.Remark
		if err := json.Unmarshal([]byte(req.Remark), &remark); err != nil {
			return nil, err
		}

		relations := make([]*model.TQualityAuditFormViewRelation, 0)
		timeNow := time.Now()
		if !req.Draft && len(req.Remark) > 0 && len(remark.DatasourceInfos) > 0 {
			for _, info := range remark.DatasourceInfos {
				formViewIds := make([]string, 0)
				param := &data_view.GetByAuditStatusReq{
					DatasourceId: info.DatasourceId,
					IsAudited:    info.IsAudited,
				}
				if len(info.FormViewIds) == 0 {
					viewResp, err := w.dataView.GetByAuditStatus(ctx, param)
					if err != nil {
						return nil, err
					}
					for _, view := range viewResp.Entries {
						formViewIds = append(formViewIds, view.ID)
					}
				} else {
					formViewIds = info.FormViewIds
				}
				resources, err := newQualityAuditWorkOrderFormViewForms(formViewIds, workOrder.WorkOrderID, info.DatasourceId, userId, timeNow)
				if err != nil {
					return nil, err
				}
				for _, res := range resources {
					relations = append(relations, res)
				}
			}
		}
		//创建工单及关联逻辑视图记录
		if err := w.repo.CreateQualityAuditWorkOrderAndFormViews(ctx, workOrder, relations); err != nil {
			return nil, err
		}
	}

	// 归集工单
	if req.Type == domain.WorkOrderTypeDataAggregation.String {
		// 如果来源为业务表单，填入来源IDS
		if req.SourceType == domain.WorkOrderSourceTypeBusinessForm.String {
			for _, businessForms := range req.DataAggregationInventory.BusinessForms {
				req.SourceIds = append(req.SourceIds, businessForms.ID)
			}
			workOrder.SourceIDs = req.SourceIds
		}
		if req.DataAggregationInventoryID != "" && req.DataAggregationInventory == nil {
			req.DataAggregationInventory = &task_center_v1.AggregatedDataAggregationInventory{ID: req.DataAggregationInventoryID}
		}
		if err := w.createForDataAggregation(ctx, workOrder, req.DataAggregationInventory); err != nil {
			return nil, err
		}
	}

	if req.Type != domain.WorkOrderTypeStandardization.String && req.Type != domain.WorkOrderTypeDataFusion.String && req.Type != domain.WorkOrderTypeDataQualityAudit.String && req.Type != domain.WorkOrderTypeDataAggregation.String {
		err = w.repo.Create(ctx, workOrder)
		if err != nil {
			return nil, err
		}
	}

	if len(req.Improvements) > 0 {
		improvementModels := make([]*model.DataQualityImprovement, 0)
		for _, improvement := range req.Improvements {
			improvementModel := &model.DataQualityImprovement{
				WorkOrderID:    workOrder.WorkOrderID,
				FieldID:        improvement.FieldId,
				RuleID:         improvement.RuleId,
				RuleName:       improvement.RuleName,
				Dimension:      improvement.Dimension,
				InspectedCount: improvement.InspectedCount,
				IssueCount:     improvement.IssueCount,
				Score:          improvement.Score,
			}
			improvementModels = append(improvementModels, improvementModel)
		}
		err = w.improvementRepo.BatchCreate(ctx, improvementModels)
		if err != nil {
			return nil, err
		}
	}

	// 发起工单创建审核，草稿不需要发起审核
	if !req.Draft && workTypesOfCreationAudit.Has(workOrder.Type) {
		log.WithContext(ctx).Infof("%s", time.Now())
		workOrder, err = w.Audit(ctx, workOrder, userId, userName)
		if err != nil {
			return nil, err
		}
		if err = w.repo.Update(ctx, workOrder); err != nil {
			return nil, err
		}
	}
	// 发送消息：工单创建
	if err := w.SendWorkOrderMsg(ctx, meta_v1.Added, workOrder); err != nil {
		log.WithContext(ctx).Error(err.Error() + "........")
	}

	// 尝试开启工单（已签收 -> 进行中），即使失败也不抛错
	if workOrder.AuditStatus == domain.AuditStatusPass.Integer.Int32() && workOrder.Synced {
		if err := w.Start(ctx, nil, workOrder); err != nil {
			log.Debug("start work order fail", zap.Error(err), zap.Any("workOrder", workOrder))
		}
	}

	// 质量整改待处理短信推送，推送失败不抛错
	if !req.Draft && workOrder.Type == domain.WorkOrderTypeDataQuality.Integer.Int32() {
		if workOrder.Status == domain.WorkOrderStatusPendingSignature.Integer.Int32() ||
			workOrder.Status == domain.WorkOrderStatusSignedFor.Integer.Int32() {
			dataViewDetail, err := w.dataView.GetDataViewDetails(ctx, req.SourceId)
			if err == nil {
				if dataViewDetail != nil {
					if err := common.SMSPush(ctx, w.mqClient,
						common.SMSMsgTypeQualityRectify, w.ccRepo,
						nil, workOrder.DataSourceDepartmentId, w.ccDriven, dataViewDetail.TechnicalName); err != nil {
						log.WithContext(ctx).Errorf("uc.SMSPush data quality work order %d process failed: %v", workOrder.ID, err)
					}
				}

			} else {
				log.WithContext(ctx).Errorf("GetDataViewDetails failed: %v", err)
			}
		}
	}

	return &domain.IDResp{Id: workOrder.WorkOrderID}, nil
}

func getRunCronStrategyDisplay(v string) string {
	if v != "" {
		return enum.Get[domain.DataFusionCron](v).Display
	}
	return ""
}

// createForDataAggregation 创建归集工单
func (w *workOrderUseCase) createForDataAggregation(ctx context.Context, order *model.WorkOrder, inventory *task_center_v1.AggregatedDataAggregationInventory) error {
	log.Debug("create work order for data aggregation", zap.Any("workOrder", order), zap.Any("inventory", inventory))
	// 根据工单来源类型区分创建流程
	switch order.SourceType {
	// 项目。来源是项目的归集工单，可能关联归集清单，也可能关联业务表
	case domain.WorkOrderSourceTypeProject.Integer.Int32():
		// 如果归集清单 ID 非空，认为工单关联归集清单，否则认为关联业务表
		if inventory.ID != "" {
			// TODO: 参数检查前移到开始处理请求之前
			if inventory.ID == "" {
				return errors.New("data_aggregation_inventory.id is missing")
			}
			order.DataAggregationInventoryID = inventory.ID
			log.Info("create work order", zap.Any("workOrder", order))
			if err := w.repo.Create(ctx, order); err != nil {
				return err
			}
		} else {
			// 生成归集资源列表
			resources := newDataAggregationResources(order.WorkOrderID, inventory.Resources)
			forms, err := json.Marshal(inventory)
			if err != nil {
				log.Error("marshal data aggregation inventory fail", zap.Error(err), zap.Any("inventory", inventory))
				return err
			}
			order.BusinessForms = forms
			log.Info("create work order for data aggregation", zap.Any("workOrder", order), zap.Any("resources", resources))
			if err := w.repo.CreateForDataAggregation(ctx, order, resources); err != nil {
				return err
			}
		}

	// 业务表
	case domain.WorkOrderSourceTypeBusinessForm.Integer.Int32():
		// TODO: 参数检查前移到开始处理请求之前
		if inventory == nil {
			return errors.New("data_aggregation_inventory is missing")
		}
		// 生成归集资源列表
		resources := newDataAggregationResources(order.WorkOrderID, inventory.Resources)
		forms, err := json.Marshal(inventory)
		if err != nil {
			log.Error("marshal data aggregation inventory fail", zap.Error(err), zap.Any("inventory", inventory))
			return err
		}
		order.BusinessForms = forms
		log.Info("create work order for data aggregation", zap.Any("workOrder", order), zap.Any("resources", resources))
		if err := w.repo.CreateForDataAggregation(ctx, order, resources); err != nil {
			return err
		}

	// 无（独立）、归集计划、供需申请，项目
	case domain.WorkOrderSourceTypeStandalone.Integer.Int32(), domain.WorkOrderSourceTypePlan.Integer.Int32(), domain.WorkOrderSourceTypeSupplyAndDemand.Integer.Int32():
		// TODO: 参数检查前移到开始处理请求之前
		if inventory.ID == "" {
			return errors.New("data_aggregation_inventory.id is missing")
		}
		order.DataAggregationInventoryID = inventory.ID
		log.Info("create work order", zap.Any("workOrder", order))
		if err := w.repo.Create(ctx, order); err != nil {
			return err
		}
	default:
		return fmt.Errorf("invalid source type %q for work order type %q", enum.ToString[domain.WorkOrderType](order.SourceType), domain.WorkOrderTypeDataAggregation.String)
	}
	return nil
}

func (w *workOrderUseCase) Audit(ctx context.Context, workOrder *model.WorkOrder, userId, userName string) (newWorkOrder *model.WorkOrder, err error) {
	var needAudit bool
	// Workflow 审核类型，不同工单类型，对应不同的神类型
	auditType := auditTypeForWorkOrderType(workOrder.Type)
	auditBindInfo, err := w.ccDriven.GetProcessBindByAuditType(ctx, &configuration_center.GetProcessBindByAuditTypeReq{AuditType: auditType})
	if err != nil {
		return nil, err
	}
	if len(auditBindInfo.ID) > 0 && auditBindInfo.ProcDefKey != "" {
		needAudit = true
	}
	if needAudit && !(workOrder.Type == domain.WorkOrderTypeDataFusion.Integer.Int32() && workOrder.SourceType == domain.WorkOrderSourceTypeDataAnalysis.Integer.Int32()) {
		var auditRecID uint64
		auditRecID, err = utilities.GetUniqueID()
		if err != nil {
			return nil, errorcode.Detail(errorcode.InternalError, err)
		}
		msg := &wf_common.AuditApplyMsg{
			Process: wf_common.AuditApplyProcessInfo{
				ApplyID:    GenAuditApplyID(workOrder.ID, auditRecID),
				AuditType:  auditType,
				UserID:     userId,
				UserName:   userName,
				ProcDefKey: auditBindInfo.ProcDefKey,
			},
			Data: map[string]any{
				"id":          workOrder.WorkOrderID,
				"title":       workOrder.Name,
				"type":        enum.ToString[domain.WorkOrderType](workOrder.Type),
				"submit_time": time.Now().UnixMilli(),
			},
			Workflow: wf_common.AuditApplyWorkflowInfo{
				TopCsf: 5,
				AbstractInfo: wf_common.AuditApplyAbstractInfo{
					Icon: data_aggregation_plan.AUDIT_ICON_BASE64,
					Text: "工单名称：" + workOrder.Name,
				},
			},
		}
		if err := w.wf.AuditApply(msg); err != nil {
			log.WithContext(ctx).Errorf("send start audit instance message error %v", err)
			return nil, errorcode.Detail(errorcode.InternalError, err)
		}
		workOrder.AuditStatus = domain.AuditStatusAuditing.Integer.Int32() // 审核中
		workOrder.AuditID = &auditRecID                                    // 审核记录id
	} else {
		workOrder.AuditStatus = domain.AuditStatusPass.Integer.Int32() // 审核通过
		// 调用回调接口
		if err := w.callback.OnApproved(ctx, workOrder); err != nil {
			log.Warn("WorkOrder Callback OnApproved fail", zap.Error(err), zap.Any("workOrder", workOrder))
		}
	}
	return workOrder, err
}

// auditTypeForWorkOrderType 返回工单类型对应的审核类型，默认为
// workflow.AF_TASKS_DATA_COMPREHENSION_WORK_ORDER
func auditTypeForWorkOrderType(in int32) (out string) {
	switch in {
	// 数据理解
	case domain.WorkOrderTypeDataComprehension.Integer.Int32():
		out = workflow.AF_TASKS_DATA_COMPREHENSION_WORK_ORDER
	// 数据归集
	case domain.WorkOrderTypeDataAggregation.Integer.Int32():
		out = workflow.AF_TASKS_DATA_AGGREGATION_WORK_ORDER
	// 标准化
	case domain.WorkOrderTypeStandardization.Integer.Int32():
		out = workflow.AF_TASKS_DATA_STANDARDIZATION_WORK_ORDER
	// 数据融合
	case domain.WorkOrderTypeDataFusion.Integer.Int32():
		out = workflow.AF_TASKS_DATA_FUSION_WORK_ORDER
	// 数据质量
	case domain.WorkOrderTypeDataQuality.Integer.Int32():
		out = workflow.AF_TASKS_DATA_QUALITY_WORK_ORDER
	// 数据质量稽核
	case domain.WorkOrderTypeDataQualityAudit.Integer.Int32():
		out = workflow.AF_TASKS_DATA_QUALITY_AUDIT_WORK_ORDER
	// 调研工单
	case domain.WorkOrderTypeResearchReport.Integer.Int32():
		out = workflow.AF_TASKS_RESEARCH_REPORT_WORK_ORDER
	// 资源编目工单
	case domain.WorkOrderTypeDataCatalog.Integer.Int32():
		out = workflow.AF_TASKS_DATA_CATALOG_WORK_ORDER
	// 前置机申请工单
	case domain.WorkOrderTypeFrontEndProcessors.Integer.Int32():
		out = workflow.AF_TASKS_FRONT_END_PROCESSORS_WORK_ORDER
	default:
		out = workflow.AF_TASKS_DATA_COMPREHENSION_WORK_ORDER
	}
	return
}
func (w *workOrderUseCase) Update(ctx context.Context, id string, req *domain.WorkOrderUpdateReq, userId string) (*domain.IDResp, error) {
	// 通过码元 Code 补全码元 ID
	for i, v := range req.FormViews {
		for j, f := range v.Fields {
			e := f.DataElement
			// 忽略未配置码元
			if e == nil {
				continue
			}
			// 忽略码元 ID 不为空
			if e.ID != 0 {
				continue
			}
			// 忽略码元 Code 为空
			if e.Code == 0 {
				continue
			}
			// 根据码元 Code 获取码元 ID
			resp, err := w.standardization.GetDataElementDetailByCode(ctx)
			if err != nil {
				return nil, err
			}
			for _, r := range resp {
				if r.Code != strconv.Itoa(e.Code) {
					continue
				}
				id, err := strconv.Atoi(r.ID)
				if err != nil {
					return nil, err
				}
				req.FormViews[i].Fields[j].DataElement.ID = id
				break
			}
		}
	}
	// 根据逻辑视图 ID 补全 逻辑视图字段
	for i, v := range req.FormViews {
		if len(v.Fields) != 0 {
			continue
		}
		// 获取逻辑视图字段列表
		res, err := w.dataView.GetDataViewField(ctx, v.ID)
		if err != nil {
			return nil, err
		}

		for _, f := range res.FieldsRes {
			req.FormViews[i].Fields = append(req.FormViews[i].Fields, domain.WorkOrderDetailFormViewField{ID: f.ID, StandardRequired: true})
		}
	}
	workOrder, err := w.repo.GetById(ctx, id)
	if err != nil {
		return nil, err
	}
	err = checkUpdate(workOrder, req)
	if err != nil {
		return nil, err
	}
	if workOrder.AuditStatus == domain.AuditStatusAuditing.Integer.Int32() || workOrder.Status == domain.WorkOrderStatusFinished.Integer.Int32() {
		if ptr.Deref(req.ResponsibleUID, workOrder.ResponsibleUID) != workOrder.ResponsibleUID {
			return nil, errorcode.Detail(errorcode.WorkOrderEditError, "审核中的或已完成的工单不能转派")
		}
	}

	// 转派清空责任人,更新状态为待签收
	if req.ResponsibleUID != nil && *req.ResponsibleUID != workOrder.ResponsibleUID {
		if *req.ResponsibleUID == "" {
			workOrder.Status = domain.WorkOrderStatusPendingSignature.Integer.Int32()
			workOrder.AcceptanceAt = nil
		} else {
			currentTime := time.Now()
			workOrder.AcceptanceAt = &currentTime
			if workOrder.Status == domain.WorkOrderStatusPendingSignature.Integer.Int32() {
				workOrder.Status = domain.WorkOrderStatusSignedFor.Integer.Int32()
			}
		}
		workOrder.ResponsibleUID = *req.ResponsibleUID
	}

	// 更新各类型工单公共部分
	if req.Name != "" {
		workOrder.Name = req.Name
	}
	workOrder.Priority = enum.ToInteger[constant.CommonPriority](req.Priority).Int32()
	if req.FinishedAt > 0 {
		finishedAt := time.Unix(req.FinishedAt, 0)
		workOrder.FinishedAt = &finishedAt
	}
	workOrder.CatalogIds = strings.Join(req.CatalogIds, ",")
	workOrder.Description = req.Description
	workOrder.Remark = req.Remark

	// 归集工单的归集资源列表
	var resources []model.DataAggregationResource
	// 更新各类型工单独有部分
	switch workOrder.Type {
	// TODO: 数据理解工单
	case domain.WorkOrderTypeDataComprehension.Integer.Int32():
	// 数据归集工单
	case domain.WorkOrderTypeDataAggregation.Integer.Int32():
		// 来源类型
		workOrder.SourceType = int32(enum.ToInteger[domain.WorkOrderSourceType](req.SourceType))
		// 来源 ID
		workOrder.SourceID = req.SourceId
		workOrder.SourceIDs = req.SourceIds
		if len(workOrder.SourceIDs) > 0 {
			workOrder.SourceID = workOrder.SourceIDs[0]
		}
		// 生成归集资源列表
		if inventory := req.DataAggregationInventory; inventory != nil {
			resources = newDataAggregationResources(workOrder.WorkOrderID, inventory.Resources)
			forms, err := json.Marshal(inventory)
			if err != nil {
				log.Error("marshal data aggregation inventory fail", zap.Error(err), zap.Any("inventory", inventory))
				return nil, err
			}
			workOrder.BusinessForms = forms
		}
	// 数据标准化工单、数据融合工单、数据质量稽核工单
	case domain.WorkOrderTypeStandardization.Integer.Int32(),
		domain.WorkOrderTypeDataFusion.Integer.Int32(),
		domain.WorkOrderTypeDataQualityAudit.Integer.Int32():
		// 更新来源类型
		workOrder.SourceType = enum.ToInteger[domain.WorkOrderSourceType](req.SourceType).Int32()
		// 来源 ID，即处理计划 ID
		workOrder.SourceID = req.SourceId
		// 更新是否为草稿状态
		workOrder.Draft = ptr.To(req.Draft)
	case domain.WorkOrderTypeDataQuality.Integer.Int32():
		improvementModels := make([]*model.DataQualityImprovement, 0)
		if len(req.Improvements) > 0 {
			for _, improvement := range req.Improvements {
				improvementModel := &model.DataQualityImprovement{
					WorkOrderID:    workOrder.WorkOrderID,
					FieldID:        improvement.FieldId,
					RuleID:         improvement.RuleId,
					RuleName:       improvement.RuleName,
					Dimension:      improvement.Dimension,
					InspectedCount: improvement.InspectedCount,
					IssueCount:     improvement.IssueCount,
					Score:          improvement.Score,
				}
				improvementModels = append(improvementModels, improvementModel)
			}
			err = w.improvementRepo.Update(ctx, workOrder.WorkOrderID, improvementModels)
			if err != nil {
				return nil, err
			}
		}
	default:
		log.Warn("unsupported work order type", zap.Any("workOrder", workOrder))
	}

	// 数据质量稽核工单，检查是否存在逻辑视图未配置稽核规则
	if workOrder.Type == domain.WorkOrderTypeDataQualityAudit.Integer.Int32() {
		var remark domain.Remark
		if len(req.Remark) > 0 {
			if err := json.Unmarshal([]byte(req.Remark), &remark); err != nil {
				return nil, err
			}
		}

		relations := make([]*model.TQualityAuditFormViewRelation, 0)
		timeNow := time.Now()
		if !req.Draft && len(req.Remark) > 0 && len(remark.DatasourceInfos) > 0 {
			for _, info := range remark.DatasourceInfos {
				formViewIds := make([]string, 0)
				param := &data_view.GetByAuditStatusReq{
					DatasourceId: info.DatasourceId,
					IsAudited:    info.IsAudited,
				}
				if len(info.FormViewIds) == 0 {
					viewResp, err := w.dataView.GetByAuditStatus(ctx, param)
					if err != nil {
						return nil, err
					}
					for _, view := range viewResp.Entries {
						formViewIds = append(formViewIds, view.ID)
					}
				} else {
					formViewIds = info.FormViewIds
				}
				qualityResources, err := newQualityAuditWorkOrderFormViewForms(formViewIds, workOrder.WorkOrderID, info.DatasourceId, userId, timeNow)
				if err != nil {
					return nil, err
				}
				for _, res := range qualityResources {
					relations = append(relations, res)
				}
			}
			//创建工单及关联逻辑视图记录
			if err := w.repo.CreateQualityAuditWorkOrderFormViews(ctx, relations); err != nil {
				return nil, err
			}
		}
	}

	// 更新数据库记录
	if err = w.repo.Update(ctx, workOrder); err != nil {
		return nil, err
	}
	// 标准化工单，还需要更新关联的逻辑视图字段
	if workOrder.Type == domain.WorkOrderTypeStandardization.Integer.Int32() {
		if err := w.repo.ReconcileWorkOrderFormViewFieldsByWorkOrderID(ctx, workOrder.WorkOrderID, newWorkOrderFormViewForms(req.FormViews, id)); err != nil {
			return nil, err
		}
	}

	// 融合工单，还需要更新关联的融合表名称和字段
	if workOrder.Type == domain.WorkOrderTypeDataFusion.Integer.Int32() && req.FusionTable.TableName != "" {
		fields, err := UpdateFusionWorkOrderTableFields(req.FusionTable.Fields, id, userId)
		if err != nil {
			return nil, err
		}

		fusionNameModel := &model.TWorkOrderExtend{
			WorkOrderID:     workOrder.WorkOrderID,
			ExtendKey:       string(constant.FusionTableName),
			ExtendValue:     req.FusionTable.TableName,
			FusionType:      enum.ToInteger[domain.DataFusionType](req.FusionTable.FusionType, 0).Int32(),
			ExecSQL:         req.FusionTable.ExecSQL,
			SceneSQL:        req.FusionTable.SceneSQL,
			SceneAnalysisId: req.FusionTable.SceneAnalysisId,
			RunCronStrategy: getRunCronStrategyDisplay(req.FusionTable.RunCronStrategy),
			DataSourceID:    req.FusionTable.DataSourceID,
		}
		if req.FusionTable.RunStartAt > 0 {
			runStartAt := time.Unix(req.FusionTable.RunStartAt, 0)
			fusionNameModel.RunStartAt = &runStartAt
		}
		if req.FusionTable.RunEndAt > 0 {
			runEndAt := time.Unix(req.FusionTable.RunEndAt, 0)
			fusionNameModel.RunEndAt = &runEndAt
		}
		// 合并sql及调用虚拟引擎转换SQL
		if req.FusionTable.FusionType == domain.DataFusionTypeSceneAnalysis.String {
			s, err := w.Datasource.Get(ctx, req.FusionTable.DataSourceID)
			if err != nil {
				log.Warn("合并SQL get datasource fail", zap.Error(err), zap.String("id", req.FusionTable.DataSourceID))
			}
			var selectField []string
			for _, field := range req.FusionTable.Fields {
				selectField = append(selectField, fmt.Sprintf(`"%s"`, field.EName))
			}
			fieldSQL := strings.Join(selectField, ",")
			if s.TypeName == "oracle" || s.TypeName == "dameng" {
				fieldSQL = strings.ToUpper(fieldSQL)
			}
			selectSQL := fmt.Sprintf(`SELECT %s FROM (%s) %s`, fieldSQL, req.FusionTable.SceneSQL, req.FusionTable.TableName)
			// 如果是hive增加分区
			insertSQl := ""
			if s.TypeName == "hive-jdbc" {
				insertSQl = fmt.Sprintf(`SET hive.exec.dynamic.partition=true;SET hive.exec.dynamic.partition.mode=nonstrict; INSERT INTO %s.%s PARTITION("dat_dt") (%s) %s`, s.Schema, req.FusionTable.TableName, fieldSQL, selectSQL)
			} else {
				insertSQl = fmt.Sprintf(`INSERT INTO %s.%s (%s) %s`, s.Schema, req.FusionTable.TableName, fieldSQL, selectSQL)
			}
			execSql := insertSQl
			if s.TypeName != "postgresql" && s.TypeName != "oracle" && s.TypeName != "dameng" {
				execSql = strings.ReplaceAll(insertSQl, "\"", "`")
			}
			log.WithContext(ctx).Info("融合工单生成SQL InsertSQL: ", zap.Any("sql", execSql))
			fusionNameModel.ExecSQL = execSql

			// TODO 调用虚拟引擎转换sql

		}

		if err := w.repo.UpdateFusionWorkOrderFusionFieldsByWorkOrderID(ctx, fusionNameModel, fields, userId); err != nil {
			return nil, err
		}
	}

	info, err := user_util.ObtainUserInfo(ctx)
	if err != nil {
		return nil, err
	}

	// 如果是草稿，不需要发送审核消息
	if ptr.Deref(workOrder.Draft, false) {
		return &domain.IDResp{Id: workOrder.WorkOrderID}, nil
	}

	// 发起工单创建审核
	if workTypesOfCreationAudit.Has(workOrder.Type) && (workOrder.AuditStatus == 0 || workOrder.AuditStatus == domain.AuditStatusUndone.Integer.Int32() || workOrder.AuditStatus == domain.AuditStatusReject.Integer.Int32() || workOrder.AuditStatus == domain.AuditStatusNone.Integer.Int32()) {
		if workOrder, err = w.Audit(ctx, workOrder, userId, info.Name); err != nil {
			return nil, err
		}
	}

	if workOrder.Type == domain.WorkOrderTypeDataAggregation.Integer.Int32() {
		err = w.repo.UpdateForDataAggregation(ctx, workOrder, resources)
	} else {
		err = w.repo.Update(ctx, workOrder)
	}
	// 发送消息：工单更新
	if err := w.SendWorkOrderMsg(ctx, meta_v1.Modified, workOrder); err != nil {
		log.WithContext(ctx).Error(err.Error() + "........")
	}
	return &domain.IDResp{Id: workOrder.WorkOrderID}, err
}

// 限制修改处于这些审核状态的工单
var auditStatusesUpdateConstraint = sets.New(
	domain.AuditStatusAuditing.Integer.Int32(),
	domain.AuditStatusPass.Integer.Int32(),
)

// 检查工单是否可以被修改
func checkUpdate(workOrder *model.WorkOrder, req *domain.WorkOrderUpdateReq) error {
	// 如果是草稿，允许更新
	if ptr.Deref(workOrder.Draft, false) {
		return nil
	}
	// TODO: 未确定是否限制修改归集工单，先允许
	if workOrder.Type == domain.WorkOrderTypeDataAggregation.Integer.Int32() {
		return nil
	}
	// 允许修改未受限的工单
	if !auditStatusesUpdateConstraint.Has(workOrder.AuditStatus) {
		return nil
	}
	// 禁止这些修改
	conditions := []bool{
		// 修改名称
		req.Name != "" && req.Name != workOrder.Name,
		// 修改优先级
		req.Priority != "" && enum.ToInteger[constant.CommonPriority](req.Priority).Int32() != workOrder.Priority,
		// 修改截止日期
		req.FinishedAt != 0 && workOrder.FinishedAt != nil && req.FinishedAt != workOrder.FinishedAt.Unix(),
		// 新增截止日期
		req.FinishedAt != 0 && workOrder.FinishedAt == nil && req.FinishedAt > 0,
		// 修改数据资源目录
		len(req.CatalogIds) != 0 && strings.Join(req.CatalogIds, ",") != workOrder.CatalogIds,
		// 修改描述
		req.Description != "" && req.Description != workOrder.Description,
		// 修改备注
		req.Remark != "" && req.Remark != workOrder.Remark,
	}
	for _, c := range conditions {
		if c {
			return errorcode.Desc(errorcode.WorkOrderEditError)
		}
	}
	return nil
}

func (w *workOrderUseCase) UpdateStatus(ctx context.Context, id string, req *domain.WorkOrderUpdateStatusReq, userId, userName string) (*domain.IDResp, error) {
	workOrder, err := w.repo.GetById(ctx, id)
	if err != nil {
		return nil, err
	}
	// 更新归集工单状态
	if workOrder.Type == domain.WorkOrderTypeDataAggregation.Integer.Int32() {
		return w.updateStatusForDataAggregation(ctx, req, workOrder, userId, userName)
	}
	if enum.ToInteger[domain.WorkOrderSourceType](req.Status).Int32() != workOrder.Status {
		// 签收，开始处理，完成工单
		switch workOrder.Status {
		// 待签收
		case domain.WorkOrderStatusPendingSignature.Integer.Int32():
			if req.Status == domain.WorkOrderStatusSignedFor.String {
				workOrder.Status = domain.WorkOrderStatusSignedFor.Integer.Int32()
				workOrder.ResponsibleUID = userId
				currentTime := time.Now()
				workOrder.AcceptanceAt = &currentTime
			} else {
				return nil, errorcode.Detail(errorcode.WorkOrderEditError, "只能更新状态为已签收")
			}
		// 已签收
		case domain.WorkOrderStatusSignedFor.Integer.Int32():
			if req.Status == domain.WorkOrderStatusOngoing.String {
				workOrder.Status = domain.WorkOrderStatusOngoing.Integer.Int32()
				currentTime := time.Now()
				workOrder.ProcessAt = &currentTime
			} else {
				return nil, errorcode.Detail(errorcode.WorkOrderEditError, "只能更新状态为进行中")
			}
		// 进行中
		case domain.WorkOrderStatusOngoing.Integer.Int32():
			if req.Status == domain.WorkOrderStatusFinished.String {
				workOrder.Status = domain.WorkOrderStatusFinished.Integer.Int32()
				workOrder.ProcessingInstructions = req.ProcessingInstructions
				if workOrder.AuditStatus == domain.AuditStatusAuditing.Integer.Int32() {
					return nil, errorcode.Detail(errorcode.WorkOrderEditError, "工单在审核中")
				}
				if workOrder.Type == domain.WorkOrderTypeDataQuality.Integer.Int32() {
					alarmRuleInfo, err := w.GetAlarmRule(ctx)
					if err != nil {
						return nil, err
					}
					if alarmRuleInfo != nil {
						deadline := workOrder.CreatedAt.AddDate(0, 0, int(alarmRuleInfo.DeadlineTime))
						workOrder.FinishedAt = &deadline
					}
				}
			} else {
				return nil, errorcode.Detail(errorcode.WorkOrderEditError, "只能更新状态为已完成")
			}
		// 已完成
		case domain.WorkOrderStatusFinished.Integer.Int32():
			return nil, errorcode.Detail(errorcode.WorkOrderEditError, "已完成的工单不能更新状态")
		}
		err = w.repo.Update(ctx, workOrder)
		if err != nil {
			return nil, err
		}
		// 发送消息：工单更新
		if err := w.SendWorkOrderMsg(ctx, meta_v1.Modified, workOrder); err != nil {
			log.WithContext(ctx).Error(err.Error() + "........")
		}
		// 如果工单的来源类型是项目，更新工单项目后续节点的执行状态
		if workOrder.SourceType == domain.WorkOrderSourceTypeProject.Integer.Int32() {
			// 获取工单所属项目
			p, err := w.projectRepo.Get(ctx, workOrder.SourceID)
			if err != nil {
				return nil, err
			}
			log.Debug("work order's project", zap.Any("project", p))

			// 更新工单项目后续节点的执行状态
			log.Info("update work order' project follow nodes to executable status", zap.Any("workOrder", workOrder))
			if _, err := w.projectRepo.UpdateFollowExecutableV2(ctx, workOrder.SourceID, p.FlowID, p.FlowVersion, workOrder.NodeID); err != nil {
				return nil, err
			}
		}
	}
	return &domain.IDResp{Id: workOrder.WorkOrderID}, err
}

// 更新归集工单状态
func (w *workOrderUseCase) updateStatusForDataAggregation(ctx context.Context, req *domain.WorkOrderUpdateStatusReq, workOrder *model.WorkOrder, userId, userName string) (*domain.IDResp, error) {
	// 从数据库获取到的归集工单相关的业务表
	var forms task_center_v1.AggregatedDataAggregationInventory
	if err := json.Unmarshal(workOrder.BusinessForms, &forms); err != nil {
		log.Warn("load data aggregation work order's business forms fail", zap.Error(err), zap.ByteString("workOrder.BusinessForms", workOrder.BusinessForms))
	}
	// 归集工单相关的资源（逻辑视图）列表
	var resources = newDataAggregationResources(workOrder.WorkOrderID, forms.Resources)
	// 签收 -> 处理 -> 完成工单
	switch workOrder.Status {
	// 待签收
	case domain.WorkOrderStatusPendingSignature.Integer.Int32():
		if req.Status != domain.WorkOrderStatusSignedFor.String {
			return nil, errorcode.Detail(errorcode.WorkOrderEditError, "只能更新状态为已签收")
		}
		workOrder.Status = domain.WorkOrderStatusSignedFor.Integer.Int32()
		workOrder.ResponsibleUID = userId
		currentTime := time.Now()
		workOrder.AcceptanceAt = &currentTime

	// 已签收
	case domain.WorkOrderStatusSignedFor.Integer.Int32():
		if req.Status != domain.WorkOrderStatusOngoing.String {
			return nil, errorcode.Detail(errorcode.WorkOrderEditError, "只能更新状态为进行中")
		}
		workOrder.Status = domain.WorkOrderStatusOngoing.Integer.Int32()
		switch req.Status {
		// 已签收 -> 进行中
		case domain.WorkOrderStatusOngoing.String:
		default:
			return nil, errorcode.Detail(errorcode.WorkOrderEditError, "只能更新状态为进行中")
		}

	// 进行中
	case domain.WorkOrderStatusOngoing.Integer.Int32():
		switch req.Status {
		// 进行中 -> 进行中
		case domain.WorkOrderStatusOngoing.String:
			log.Warn("work order is already ongoing", zap.String("id", workOrder.WorkOrderID))

		// 进行中 -> 已完成
		case domain.WorkOrderStatusFinished.String:
			// 需要先通过审核
			if workOrder.AuditStatus != domain.AuditStatusPass.Integer.Int32() {
				return nil, errorcode.Desc(errorcode.WorkOrderAuditNotPass)
			}
			// 标记归集清单关联的归集清单为已完成
			if workOrder.DataAggregationInventoryID != "" {
				inventory, err := w.dataAggregationInventory.Get(ctx, workOrder.DataAggregationInventoryID)
				if err != nil {
					return nil, err
				}
				// 判断清单是通过工单创建
				if inventory.CreationMethod == task_center_v1.DataAggregationInventoryCreationWorkOrder {
					// 判断清单的状态是草稿
					if inventory.Status == task_center_v1.DataAggregationInventoryDraft {
						if err := w.dataAggregationInventoryRepo.UpdateStatus(ctx, inventory.ID, task_center_v1.DataAggregationInventoryCompleted); err != nil {
							return nil, err
						}
					}
				}
			}
			workOrder.ProcessingInstructions = req.ProcessingInstructions
			workOrder.Status = domain.WorkOrderStatusFinished.Integer.Int32()

		default:
			return nil, errorcode.Detail(errorcode.WorkOrderEditError, "只能更新状态为进行中、已完成")
		}

	// 已完成
	case domain.WorkOrderStatusFinished.Integer.Int32():
		return nil, errorcode.Detail(errorcode.WorkOrderEditError, "已完成的工单不能更新状态")
	}

	// 更新数据库
	if err := w.repo.UpdateForDataAggregation(ctx, workOrder, resources); err != nil {
		return nil, err
	}

	// 如果工单的来源类型是项目，更新工单项目后续节点的执行状态
	if workOrder.SourceType == domain.WorkOrderSourceTypeProject.Integer.Int32() {
		// 获取工单所属项目
		p, err := w.projectRepo.Get(ctx, workOrder.SourceID)
		if err != nil {
			return nil, err
		}
		log.Debug("work order's project", zap.Any("project", p))

		// 更新工单项目后续节点的执行状态
		log.Info("update work order' project follow nodes to executable status", zap.Any("workOrder", workOrder))
		if _, err := w.projectRepo.UpdateFollowExecutable(ctx, nil, workOrder.SourceID, p.FlowID, p.FlowVersion, workOrder.NodeID); err != nil {
			return nil, err
		}
	}

	return &domain.IDResp{Id: workOrder.WorkOrderID}, nil
}

func (w *workOrderUseCase) CheckNameRepeat(ctx context.Context, req *domain.WorkOrderNameRepeatReq) (bool, error) {
	if req.Id != "" {
		_, err := w.repo.GetById(ctx, req.Id)
		if err != nil {
			return false, err
		}
	}
	repeat, err := w.repo.CheckNameRepeat(ctx, req.Id, req.Name, enum.ToInteger[domain.WorkOrderType](req.Type).Int32())
	return repeat, err
}
func (w *workOrderUseCase) List(ctx context.Context, query *domain.WorkOrderListReq) (*domain.WorkOrderListResp, error) {
	totalCount, workOrders, err := w.repo.GetList(ctx, query)
	if err != nil {
		return nil, err
	}
	// 获取告警规则
	alarmRuleInfo, err := w.GetAlarmRule(ctx)
	if err != nil {
		return nil, err
	}
	// 获取数源部门信息
	dataSourceDepartmentIds := make([]string, 0)
	dataSourceDepartmentNameMap := make(map[string]string)
	for _, workOrder := range workOrders {
		if workOrder.DataSourceDepartmentId != "" {
			dataSourceDepartmentIds = append(dataSourceDepartmentIds, workOrder.DataSourceDepartmentId)
		}
	}
	if len(dataSourceDepartmentIds) > 0 {
		departmentInfos, err := w.ccDriven.GetDepartmentsByIds(ctx, dataSourceDepartmentIds)
		if err != nil {
			return nil, err
		}
		for _, departmentInfo := range departmentInfos {
			dataSourceDepartmentNameMap[departmentInfo.ID] = departmentInfo.Path
		}
	}
	resp := &domain.WorkOrderListResp{}
	resp.TotalCount = totalCount
	resp.Entries = make([]*domain.WorkOrderItem, 0)
	for _, workOrder := range workOrders {
		workOrderItem := &domain.WorkOrderItem{
			WorkOrderId:      workOrder.WorkOrderID,
			Name:             workOrder.Name,
			Code:             workOrder.Code,
			AuditStatus:      enum.ToString[domain.AuditStatus](workOrder.AuditStatus),
			AuditDescription: workOrder.AuditDescription,
			// Status:               enum.ToString[domain.WorkOrderStatus](workOrder.Status),
			Status:               string(domain.WorkOrderStatusV2ForWorkOrderStatusInt32(workOrder.Status)),
			Draft:                ptr.Deref(workOrder.Draft, false),
			Type:                 enum.ToString[domain.WorkOrderType](workOrder.Type),
			Priority:             enum.ToString[constant.CommonPriority](workOrder.Priority),
			Remind:               workOrder.Remind,
			Score:                workOrder.Score,
			SourceId:             workOrder.SourceID,
			SourceIds:            workOrder.SourceIDs,
			SourceType:           enum.ToString[domain.WorkOrderSourceType](workOrder.SourceType),
			CreatedBy:            w.userRepo.GetNameByUserId(ctx, workOrder.CreatedByUID),
			CreatedAt:            workOrder.CreatedAt.UnixMilli(),
			DataSourceDepartment: dataSourceDepartmentNameMap[workOrder.DataSourceDepartmentId],
		}
		if workOrder.FinishedAt != nil {
			workOrderItem.FinishedAt = workOrder.FinishedAt.Unix()
		} else if workOrder.Type == domain.WorkOrderTypeDataQuality.Integer.Int32() {
			workOrderItem.FinishedAt, workOrderItem.DaysRemaining = w.CheckAlarm(ctx, workOrder, alarmRuleInfo)
		}
		if workOrder.ResponsibleUID != "" {
			workOrderItem.ResponsibleUID = workOrder.ResponsibleUID
			workOrderItem.ResponsibleUName = w.userRepo.GetNameByUserId(ctx, workOrder.ResponsibleUID)
			departments, err := w.ccDriven.GetDepartmentsByUserID(ctx, workOrder.ResponsibleUID)
			if err != nil {
				log.WithContext(ctx).Errorf("ccDriven GetDepartmentsByUserID failed: %v", err)
				return nil, err
			}
			if len(departments) > 0 {
				departmentInfos := make([]string, 0)
				for _, department := range departments {
					departmentInfos = append(departmentInfos, department.Path)
				}
				workOrderItem.ResponsibleDepartment = departmentInfos
			}
		}
		// 根据工单来源类型，获取来源名称
		if workOrder.SourceType > 0 {
			workOrderItem.SourceType = enum.ToString[domain.WorkOrderSourceType](workOrder.SourceType)
			// 如果来源是计划，获取计划名称
			if workOrder.SourceType == domain.WorkOrderSourceTypePlan.Integer.Int32() {
				// 根据工单类型，获取对应类型计划的名称
				switch workOrder.Type {
				// 理解工单
				case domain.WorkOrderTypeDataComprehension.Integer.Int32():
					modelPlan, err := w.comprehensionPlanRepo.GetById(ctx, workOrder.SourceID)
					if err != nil {
						return nil, err
					}
					workOrderItem.SourceName = modelPlan.Name
				// 归集工单
				case domain.WorkOrderTypeDataAggregation.Integer.Int32():
					modelPlan, err := w.aggregationPlanRepo.GetById(ctx, workOrder.SourceID)
					if err != nil {
						return nil, err
					}
					workOrderItem.SourceName = modelPlan.Name
				// 标准化工单、数据融合工单、数据质量稽核工单
				case domain.WorkOrderTypeStandardization.Integer.Int32(),
					domain.WorkOrderTypeDataFusion.Integer.Int32(),
					domain.WorkOrderTypeDataQualityAudit.Integer.Int32():
					modelPlan, err := w.processingPlanRepo.GetById(ctx, workOrder.SourceID)
					if err != nil {
						return nil, err
					}
					workOrderItem.SourceName = modelPlan.Name
				}
				workOrderItem.SourceId = workOrder.SourceID
			} else if workOrder.SourceType == domain.WorkOrderSourceTypeDataAnalysis.Integer.Int32() {
				// 如果来源是数据分析，获取分析场景产物名称
				anal, err := w.demandManagement.GetNameByAnalOutputItemID(ctx, workOrder.SourceID)
				if err != nil {
					return nil, err
				}
				workOrderItem.SourceName = anal.AnalOutputItemName
			} else if workOrder.SourceType == domain.WorkOrderSourceTypeAggregationWorkOrder.Integer.Int32() {
				// 如果来源是归集工单，获取归集工单名称
				sourceWorkOrder, err := w.repo.GetById(ctx, workOrder.SourceID)
				if err != nil {
					return nil, err
				}
				workOrderItem.SourceName = sourceWorkOrder.Name
			}
			if workOrder.SourceType == domain.WorkOrderSourceTypeBusinessForm.Integer.Int32() {
				// 如果来源时业务表，获取业务表名称
				for _, id := range workOrderItem.SourceIds {
					got, err := w.BusinessFormStandard.Get(ctx, id)
					if err != nil {
						log.WithContext(ctx).Warn("get business form fail", zap.Error(err), zap.String("id", id))
						got = &af_business.BusinessFormStandard{}
					}
					workOrderItem.SourceNames = append(workOrderItem.SourceNames, got.Name)
				}
			}
			if len(workOrderItem.SourceNames) > 0 {
				workOrderItem.SourceName = workOrderItem.SourceNames[0]
			}
		}
		// 获取任务列表
		taskInfos := make([]*domain.TaskInfo, 0)
		switch workOrder.Type {
		// 数据融合工单、数据质量稽核工单
		case domain.WorkOrderTypeDataFusion.Integer.Int32(),
			domain.WorkOrderTypeDataQualityAudit.Integer.Int32():
			tasks, err := w.workOrderTaskRepo.ListByWorkOrderIDs(ctx, []string{workOrder.WorkOrderID})
			if err != nil {
				return nil, err
			}
			for _, task := range tasks {
				taskInfo := &domain.TaskInfo{
					TaskId:   task.ID,
					TaskName: task.Name,
				}
				taskInfos = append(taskInfos, taskInfo)
				if task.Status == model.WorkOrderTaskCompleted {
					workOrderItem.CompletedTaskCount++
				}
			}
		default:
			tasks, err := w.taskRepo.GetTaskByWorkOrderId(ctx, workOrder.WorkOrderID)
			if err != nil {
				return nil, err
			}
			for _, task := range tasks {
				taskInfo := &domain.TaskInfo{
					TaskId:   task.ID,
					TaskName: task.Name,
				}
				taskInfos = append(taskInfos, taskInfo)
				if task.Status == constant.CommonStatusCompleted.Integer.Int8() {
					workOrderItem.CompletedTaskCount++
				}
			}
		}
		workOrderItem.TaskInfo = taskInfos
		resp.Entries = append(resp.Entries, workOrderItem)
	}
	return resp, nil
}

// GetById 根据 ID 获取工单
func (w *workOrderUseCase) GetById(ctx context.Context, id string) (*domain.WorkOrderDetailResp, error) {
	workOrder, err := w.repo.GetById(ctx, id)
	if err != nil {
		return nil, err
	}
	resp := &domain.WorkOrderDetailResp{
		WorkOrderId:            workOrder.WorkOrderID,
		Name:                   workOrder.Name,
		Code:                   workOrder.Code,
		Type:                   enum.ToString[domain.WorkOrderType](workOrder.Type),
		Priority:               enum.ToString[constant.CommonPriority](workOrder.Priority),
		Description:            workOrder.Description,
		Remark:                 workOrder.Remark,
		Status:                 string(domain.WorkOrderStatusV2ForWorkOrderStatusInt32(workOrder.Status)),
		Draft:                  ptr.Deref(workOrder.Draft, false),
		ProcessingInstructions: workOrder.ProcessingInstructions,
		CreatedBy:              w.userRepo.GetNameByUserId(ctx, workOrder.CreatedByUID),
		CreatedAt:              workOrder.CreatedAt.UnixMilli(),
		UpdatedBy:              w.userRepo.GetNameByUserId(ctx, workOrder.UpdatedByUID),
		UpdatedAt:              workOrder.UpdatedAt.UnixMilli(),
		AuditStatus:            enum.ToString[domain.AuditStatus](workOrder.AuditStatus),
		RejectReason:           workOrder.RejectReason,
		Synced:                 workOrder.Synced,
		NodeID:                 workOrder.NodeID,
		StageID:                workOrder.StageID,
	}
	// Status:                 enum.ToString[domain.WorkOrderStatus](workOrder.Status),
	if workOrder.FinishedAt != nil {
		resp.FinishedAt = workOrder.FinishedAt.Unix()
	}
	if workOrder.Type == domain.WorkOrderTypeDataQuality.Integer.Int32() {
		if workOrder.FinishedAt == nil {
			alarmRuleInfo, err := w.GetAlarmRule(ctx)
			if err != nil {
				return nil, err
			}
			resp.FinishedAt, _ = w.CheckAlarm(ctx, workOrder, alarmRuleInfo)
		}
		fieldsInfo, err := w.dataView.GetDataViewField(ctx, workOrder.SourceID)
		if err != nil {
			return nil, err
		}
		dataQualityImprovement := &domain.DataQualityImprovement{
			DataSourceID:         fieldsInfo.DatasourceId,
			FormViewID:           fieldsInfo.ID,
			FormViewBusinessName: fieldsInfo.BusinessName,
			ReportID:             workOrder.ReportID,
			ReportVersion:        workOrder.ReportVersion,
			Improvements:         nil,
			Feedback:             nil,
		}
		dataSourceInfos, err := w.ccDriven.GetDataSourcePrecision(ctx, []string{fieldsInfo.DatasourceId})
		if err != nil {
			return nil, err
		}
		if len(dataSourceInfos) > 0 {
			dataQualityImprovement.DataSourceName = dataSourceInfos[0].Name
		}
		fieldMap := make(map[string]*data_view.FieldsRes)
		for _, field := range fieldsInfo.FieldsRes {
			fieldMap[field.ID] = field
		}
		improvements, err := w.improvementRepo.GetByWorkOrderId(ctx, workOrder.WorkOrderID)
		if err != nil {
			return nil, err
		}
		improvementInfos := make([]*domain.ImprovementInfo, 0)
		for _, improvement := range improvements {
			if _, exists := fieldMap[improvement.FieldID]; exists {
				improvementInfo := &domain.ImprovementInfo{
					FieldId:            improvement.FieldID,
					FieldTechnicalName: fieldMap[improvement.FieldID].TechnicalName,
					FieldBusinessName:  fieldMap[improvement.FieldID].BusinessName,
					FieldType:          fieldMap[improvement.FieldID].DataType,
					RuleId:             improvement.RuleID,
					RuleName:           improvement.RuleName,
					Dimension:          improvement.Dimension,
					InspectedCount:     improvement.InspectedCount,
					IssueCount:         improvement.IssueCount,
					Score:              improvement.Score,
				}
				improvementInfos = append(improvementInfos, improvementInfo)
			}
		}
		dataQualityImprovement.Improvements = improvementInfos
		if workOrder.FeedbackAt != nil {
			feedback := &domain.Feedback{
				Score:           workOrder.Score,
				FeedbackContent: workOrder.FeedbackContent,
				FeedbackAt:      workOrder.FeedbackAt.UnixMilli(),
				FeedbackBy:      w.userRepo.GetNameByUserId(ctx, workOrder.FeedbackBy),
			}
			dataQualityImprovement.Feedback = feedback
		}
		resp.DataQualityImprovement = dataQualityImprovement
	}
	if workOrder.ResponsibleUID != "" {
		resp.ResponsibleUID = workOrder.ResponsibleUID
		resp.ResponsibleUName = w.userRepo.GetNameByUserId(ctx, workOrder.ResponsibleUID)
	}
	resp.SourceType = enum.ToString[domain.WorkOrderSourceType](workOrder.SourceType)
	if workOrder.SourceType > 0 {
		// 如果来源是计划，获取来源计划的名称
		if workOrder.SourceType == domain.WorkOrderSourceTypePlan.Integer.Int32() {
			// 根据工单类型获取来源计划名称
			switch workOrder.Type {
			// 理解工单
			case domain.WorkOrderTypeDataComprehension.Integer.Int32():
				modelPlan, err := w.comprehensionPlanRepo.GetById(ctx, workOrder.SourceID)
				if err != nil {
					return nil, err
				}
				resp.SourceName = modelPlan.Name
			// 归集工单
			case domain.WorkOrderTypeDataAggregation.Integer.Int32():
				modelPlan, err := w.aggregationPlanRepo.GetById(ctx, workOrder.SourceID)
				if err != nil {
					return nil, err
				}
				resp.SourceName = modelPlan.Name
			// 标准化工单、数据融合工单、数据质量稽核工单
			case domain.WorkOrderTypeStandardization.Integer.Int32(),
				domain.WorkOrderTypeDataFusion.Integer.Int32(),
				domain.WorkOrderTypeDataQualityAudit.Integer.Int32():
				modelPlan, err := w.processingPlanRepo.GetById(ctx, workOrder.SourceID)
				if err != nil {
					return nil, err
				}
				resp.SourceName = modelPlan.Name
			}
		} else if workOrder.SourceType == domain.WorkOrderSourceTypeDataAnalysis.Integer.Int32() {
			// 如果来源是数据分析，获取分析场景产物名称
			anal, err := w.demandManagement.GetNameByAnalOutputItemID(ctx, workOrder.SourceID)
			if err != nil {
				return nil, err
			}
			resp.SourceName = anal.AnalOutputItemName
		} else if workOrder.SourceType == domain.WorkOrderSourceTypeAggregationWorkOrder.Integer.Int32() {
			// 如果来源是归集工单，获取归集工单名称
			sourceWorkOrder, err := w.repo.GetById(ctx, workOrder.SourceID)
			if err != nil {
				return nil, err
			}
			resp.SourceName = sourceWorkOrder.Name
		} else if workOrder.SourceType == domain.WorkOrderSourceTypeProject.Integer.Int32() {
			// 如果来源是项目，获取项目名称
			p, err := w.projectRepo.Get(ctx, workOrder.SourceID)
			if err != nil {
				return nil, err
			}
			resp.SourceName = p.Name
		}
	}
	resp.SourceId = workOrder.SourceID
	resp.SourceIds = workOrder.SourceIDs

	if workOrder.CatalogIds != "" {
		// 获取目录名
		catalogIds := strings.Split(workOrder.CatalogIds, ",")
		infos, err := w.dataCatalog.GetCatalogInfos(ctx, catalogIds...)
		if err != nil {
			return nil, err
		}
		catalogInfos := make([]*domain.CatalogInfo, 0)
		for _, info := range infos {
			catalogInfo := &domain.CatalogInfo{
				CatalogId:   strconv.FormatUint(info.ID, 10),
				CatalogName: info.Title,
			}
			catalogInfos = append(catalogInfos, catalogInfo)
		}
		resp.CatalogInfos = catalogInfos
	}
	// 获取工单关联的数据调研报告
	// if r, err := w.dataResearchReport.GetByWorkOrderId(ctx, id); err != nil {
	// 	log.Warn("get data research report associated with work order fail", zap.String("id", id))
	// } else {
	// 	resp.DataResearchReport = r
	// }
	if workOrder.DataAggregationInventoryID != "" {
		// 获取数据归集工单
		inventory, err := w.dataAggregationInventory.Get(ctx, workOrder.DataAggregationInventoryID)
		if err != nil {
			return nil, err
		}
		resp.DataAggregationInventory = inventory
	} else if workOrder.SourceType == domain.WorkOrderSourceTypeBusinessForm.Integer.Int32() ||
		// 如同是归集工单、来源为project、并且business_forms不为空时候， 认为其来源于项目下的业务表(fix 项目下创建的归集工单来源为业务表，详情不显示问题)
		(workOrder.SourceType == domain.WorkOrderSourceTypeProject.Integer.Int32() &&
			workOrder.Type == domain.WorkOrderTypeDataAggregation.Integer.Int32() &&
			len(workOrder.BusinessForms) > 0) {
		if workOrder.SourceType == domain.WorkOrderSourceTypeProject.Integer.Int32() &&
			workOrder.Type == domain.WorkOrderTypeDataAggregation.Integer.Int32() &&
			len(workOrder.BusinessForms) > 0 {
			workOrder.SourceIDs = []string{} // 此处先置为空，表信息存在BusinessForms中
		}
		// 获取业务表相关数据
		var inventory task_center_v1.AggregatedDataAggregationInventory
		if err := json.Unmarshal(workOrder.BusinessForms, &inventory); err != nil {
			log.Warn("unmarshal work order data aggregation inventory fail", zap.Error(err), zap.ByteString("inventory", workOrder.BusinessForms))
		}
		resp.DataAggregationInventory = w.aggregateDataAggregationInventory(ctx, &inventory, workOrder.SourceIDs)

	}

	if workOrder.Type == domain.WorkOrderTypeStandardization.Integer.Int32() {
		// 获取标准化工单关联的逻辑视图字段列表
		fields, err := w.repo.GetWorkOrderFormViewFieldsByWorkOrderID(ctx, workOrder.WorkOrderID)
		if err != nil {
			return nil, err
		}
		resp.FormViews = w.aggregateWorkOrderDetailFormView(ctx, fields)
	}

	if workOrder.Type == domain.WorkOrderTypeDataFusion.Integer.Int32() {
		// 获取融合工单关联的融合表名称
		nameModel, err := w.workOrderExtendRepo.GetByWorkOrderIdAndExtendKey(ctx, workOrder.WorkOrderID, string(constant.FusionTableName))
		if err != nil {
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		resp.FusionTable = &domain.FusionTable{TableName: nameModel.ExtendValue, SceneAnalysisId: nameModel.SceneAnalysisId, ExecSQL: nameModel.ExecSQL, SceneSQL: nameModel.SceneSQL, FusionType: enum.ToString[domain.DataFusionType](nameModel.FusionType), Fields: []*domain.FusionField{}}
		if nameModel.RunStartAt != nil {
			resp.FusionTable.RunStartAt = nameModel.RunStartAt.Unix()
		}
		if nameModel.RunEndAt != nil {
			resp.FusionTable.RunEndAt = nameModel.RunEndAt.Unix()
		}
		if nameModel.RunCronStrategy != "" {
			if domain.DataFusionCronDays.Display == nameModel.RunCronStrategy {
				resp.FusionTable.RunCronStrategy = domain.DataFusionCronDays.String
			} else {
				resp.FusionTable.RunCronStrategy = domain.DataFusionCronHours.String
			}
		}
		if nameModel.DataSourceID != "" {
			resp.FusionTable.DataSourceID = nameModel.DataSourceID
			dataSourceInfos, err := w.ccDriven.GetDataSourcePrecision(ctx, []string{nameModel.DataSourceID})
			if err != nil {
				return nil, err
			}
			if len(dataSourceInfos) > 0 {
				resp.FusionTable.DatabaseName = dataSourceInfos[0].Schema
				resp.FusionTable.DataSourceName = dataSourceInfos[0].Name
				resp.FusionTable.DatasourceTypeName = dataSourceInfos[0].TypeName
				resp.FusionTable.Schema = dataSourceInfos[0].Schema
			}
		}
		if nameModel.ExtendValue != "" {
			// 获取融合工单关联的融合表字段
			FusionFieldList, err := w.FusionFieldList(ctx, workOrder.WorkOrderID)
			if err != nil {
				return nil, err
			}
			resp.FusionTable.Fields = FusionFieldList
		}
	}

	//if workOrder.Type == domain.WorkOrderTypeDataQualityAudit.Integer.Int32() {
	//	//获取质量稽核工单关联的逻辑视图列表
	//	viewIds, err := w.qualityAuditModelRepo.GetViewIds(ctx, workOrder.WorkOrderID)
	//	if err != nil {
	//		return nil, err
	//	}
	//
	//	if len(viewIds) > 0 {
	//		viewRes, err := w.dataView.GetViewInfo(ctx, &data_view.GetViewInfoReq{IDs: viewIds})
	//		if err != nil {
	//			return nil, err
	//		}
	//		resp.QualityAuditFromViews = viewRes.Entries
	//	}
	//}

	// 获取所属项目的运营流程节点名称
	if workOrder.SourceType == domain.WorkOrderSourceTypeProject.Integer.Int32() && workOrder.SourceID != "" && workOrder.NodeID != "" {
		resp.NodeName = w.aggregateProjectNodeName(ctx, workOrder.SourceID, workOrder.NodeID)
	}

	return resp, nil
}
func (w *workOrderUseCase) Delete(ctx context.Context, id string) error {
	workOrder, err := w.repo.GetById(ctx, id)
	if err != nil {
		return err
	}
	err = w.repo.Delete(ctx, id)
	if err != nil {
		return err
	}
	// 发送消息：工单删除
	if err := w.SendWorkOrderMsg(ctx, meta_v1.Deleted, workOrder); err != nil {
		log.WithContext(ctx).Error(err.Error() + "........")
	}

	//删除数据融合加工工单需要删除融合模型
	if workOrder.Type == domain.WorkOrderTypeDataFusion.Integer.Int32() {
		userInfo, err := user_util.ObtainUserInfo(ctx)
		if err != nil {
			return err
		}
		//删除融合表字段
		err = w.fusionModelRepo.DeleteByWorkOrderId(ctx, id, userInfo.ID)
		if err != nil {
			return err
		}
		//删除融合表名称
		err = w.workOrderExtendRepo.DeleteByWorkOrderId(ctx, id)
		if err != nil {
			return err
		}
	}

	//删除数据质量稽核工单需要删除质量稽核模型
	if workOrder.Type == domain.WorkOrderTypeDataQualityAudit.Integer.Int32() {
		userInfo, err := user_util.ObtainUserInfo(ctx)
		if err != nil {
			return err
		}
		err = w.qualityAuditModelRepo.DeleteByWorkOrderId(ctx, id, userInfo.ID)
		if err != nil {
			return err
		}
	}

	// 如果工单的来源类型是项目，更新工单项目后续节点的执行状态开启后续节点
	if workOrder.SourceType == domain.WorkOrderSourceTypeProject.Integer.Int32() {
		// 获取工单所属项目
		p, err := w.projectRepo.Get(ctx, workOrder.SourceID)
		if err != nil {
			return err
		}
		log.Debug("work order's project", zap.Any("project", p))

		// 更新工单项目后续节点的执行状态
		log.Info("update work order' project follow nodes executable status", zap.Any("workOrder", workOrder))
		if _, err := w.projectRepo.UpdateFollowExecutable(ctx, nil, workOrder.SourceID, p.FlowID, p.FlowVersion, workOrder.NodeID); err != nil {
			return err
		}
	}

	return nil
}

// ListCreatedByMe 查看工单列表，创建人是我
func (w *workOrderUseCase) ListCreatedByMe(ctx context.Context, opts domain.WorkOrderListCreatedByMeOptions) (entries []domain.WorkOrderListCreatedByMeEntry, total int, err error) {
	log.Debug("list created by me", zap.Any("opts", opts))

	var listOpts work_order.ListOptions
	if err = convert_domain_WorkOrderListCreatedByMeOptions_To_work_order_ListOptions(ctx, &opts, &listOpts); err != nil {
		log.Error("convert domain.WorkOrderListCreatedByMeOptions to work_order.ListOptions fail", zap.Error(err), zap.Any("in", opts))
		return
	}

	orders, total, err := w.repo.ListV2(ctx, listOpts)
	if err != nil {
		return
	}

	entries = w.aggregateWorkOrderListCreatedByMeEntries(ctx, orders)
	return
}

// ListMyResponsibilities 查看工单列表，责任人是我。如果配置了工单审核，则排
// 除未通过审核的工单。
func (w *workOrderUseCase) ListMyResponsibilities(ctx context.Context, opts domain.WorkOrderListMyResponsibilitiesOptions) (entries []domain.WorkOrderListMyResponsibilitiesEntry, total int, err error) {
	log.Debug("list my responsibilities", zap.Any("opts", opts))

	var listOpts work_order.ListOptions
	if err = convert_domain_WorkOrderListMyResponsibilitiesOptions_To_work_order_ListOptions(ctx, &opts, &listOpts); err != nil {
		return
	}

	orders, total, err := w.repo.ListV2(ctx, listOpts)
	if err != nil {
		return
	}
	entries = w.aggregateWorkOrderListMyResponsibilitiesEntries(ctx, orders)
	return
}

func (w *workOrderUseCase) AcceptanceList(ctx context.Context, query *domain.WorkOrderAcceptanceListReq) (*domain.WorkOrderAcceptanceListResp, error) {
	totalCount, workOrders, err := w.repo.GetAcceptanceList(ctx, query)
	if err != nil {
		return nil, err
	}
	resp := &domain.WorkOrderAcceptanceListResp{}
	resp.TotalCount = totalCount
	resp.Entries = make([]*domain.WorkOrderAcceptanceItem, 0)
	for _, workOrder := range workOrders {
		workOrderItem := &domain.WorkOrderAcceptanceItem{
			WorkOrderId: workOrder.WorkOrderID,
			Name:        workOrder.Name,
			Code:        workOrder.Code,
			Type:        enum.ToString[domain.WorkOrderType](workOrder.Type),
			Priority:    enum.ToString[constant.CommonPriority](workOrder.Priority),
			SourceId:    workOrder.SourceID,
			SourceIds:   workOrder.SourceIDs,
			CreatedBy:   w.userRepo.GetNameByUserId(ctx, workOrder.CreatedByUID),
			CreatedAt:   workOrder.CreatedAt.UnixMilli(),
		}
		if workOrder.FinishedAt != nil {
			workOrderItem.FinishedAt = workOrder.FinishedAt.Unix()
		}
		if workOrder.SourceType > 0 {
			workOrderItem.SourceType = enum.ToString[domain.WorkOrderSourceType](workOrder.SourceType)
			if workOrder.SourceType == domain.WorkOrderSourceTypePlan.Integer.Int32() {
				workOrderItem.SourceId = workOrder.SourceID
				planName, err := w.getPlanNameByWorkOrderTypeAndPlanID(ctx, workOrder.Type, workOrder.SourceID)
				if err != nil {
					return nil, err
				}
				workOrderItem.SourceName = planName
			}
			if workOrder.SourceType == domain.WorkOrderSourceTypeBusinessForm.Integer.Int32() {
				// 如果来源时业务表，获取业务表名称
				for _, id := range workOrderItem.SourceIds {
					got, err := w.BusinessFormStandard.Get(ctx, id)
					if err != nil {
						log.WithContext(ctx).Warn("get business form fail", zap.Error(err), zap.String("id", id))
						got = &af_business.BusinessFormStandard{}
					}
					workOrderItem.SourceNames = append(workOrderItem.SourceNames, got.Name)
				}
			}
		}
		if len(workOrderItem.SourceNames) > 0 {
			workOrderItem.SourceName = workOrderItem.SourceNames[0]
		}
		resp.Entries = append(resp.Entries, workOrderItem)
	}
	return resp, nil
}
func (w *workOrderUseCase) ProcessingList(ctx context.Context, query *domain.WorkOrderProcessingListReq, userId string) (*domain.WorkOrderProcessingListResp, error) {
	var err error
	query.SubDepartmentIDs, err = user_util.GetDepart(ctx, w.ccDriven)
	if err != nil {
		return nil, err
	}

	todoCount, completedCount, workOrders, err := w.repo.GetProcessingList(ctx, query, userId)
	if err != nil {
		return nil, err
	}
	resp := &domain.WorkOrderProcessingListResp{}
	resp.TodoCount = todoCount
	resp.CompletedCount = completedCount
	resp.Entries = make([]*domain.WorkOrderProcessingItem, 0)
	for _, workOrder := range workOrders {
		workOrderItem := &domain.WorkOrderProcessingItem{
			WorkOrderId: workOrder.WorkOrderID,
			Name:        workOrder.Name,
			Code:        workOrder.Code,
			Type:        enum.ToString[domain.WorkOrderType](workOrder.Type),
			Status:      string(domain.WorkOrderStatusV2ForWorkOrderStatusInt32(workOrder.Status)),
			// Status: enum.ToString[domain.WorkOrderStatus](workOrder.Status),
			// Status:           "signed_for",
			AuditStatus:      enum.ToString[domain.AuditStatus](workOrder.AuditStatus),
			AuditDescription: workOrder.AuditDescription,
			Remind:           workOrder.Remind,
			Priority:         enum.ToString[constant.CommonPriority](workOrder.Priority),
			SourceId:         workOrder.SourceID,
			SourceIds:        workOrder.SourceIDs,
			CreatedBy:        w.userRepo.GetNameByUserId(ctx, workOrder.CreatedByUID),
			UpdatedAt:        workOrder.UpdatedAt.UnixMilli(),
		}
		userInfo, err := w.userDriven.GetUserInfoByID(ctx, workOrder.CreatedByUID)
		if err != nil {
			return nil, err
		}
		workOrderItem.ContactPhone = userInfo.Telephone
		if workOrder.FinishedAt != nil {
			workOrderItem.FinishedAt = workOrder.FinishedAt.Unix()
		} else if workOrder.Type == domain.WorkOrderTypeDataQuality.Integer.Int32() {
			alarmRuleInfo, err := w.GetAlarmRule(ctx)
			if err != nil {
				return nil, err
			}
			workOrderItem.FinishedAt, workOrderItem.DaysRemaining = w.CheckAlarm(ctx, workOrder, alarmRuleInfo)
		}

		if workOrder.AcceptanceAt != nil {
			workOrderItem.AcceptanceAt = workOrder.AcceptanceAt.UnixMilli()
		}
		if workOrder.ProcessAt != nil {
			workOrderItem.ProcessAt = workOrder.ProcessAt.UnixMilli()
		}
		workOrderItem.SourceIds = workOrder.SourceIDs
		if len(workOrderItem.SourceIds) > 0 {
			workOrderItem.SourceId = workOrderItem.SourceIds[0]
		}
		if workOrder.SourceType > 0 {
			workOrderItem.SourceType = enum.ToString[domain.WorkOrderSourceType](workOrder.SourceType)
			if workOrder.SourceType == domain.WorkOrderSourceTypePlan.Integer.Int32() {
				workOrderItem.SourceId = workOrder.SourceID
				planName, err := w.getPlanNameByWorkOrderTypeAndPlanID(ctx, workOrder.Type, workOrderItem.SourceId)
				if errors.Is(err, errUnsupportedWorkOrderType) {
					log.Warn("unsupported work order type for plan", zap.Any("workOrder", workOrder))
				} else if err != nil {
					return nil, err
				}
				workOrderItem.SourceName = planName
			}
			if workOrder.SourceType == domain.WorkOrderSourceTypeBusinessForm.Integer.Int32() {
				// 如果来源时业务表，获取业务表名称
				for _, id := range workOrderItem.SourceIds {
					got, err := w.BusinessFormStandard.Get(ctx, id)
					if err != nil {
						log.WithContext(ctx).Warn("get business form fail", zap.Error(err), zap.String("id", id))
						got = &af_business.BusinessFormStandard{}
					}
					workOrderItem.SourceNames = append(workOrderItem.SourceNames, got.Name)
				}
			}
		}
		if len(workOrderItem.SourceNames) > 0 {
			workOrderItem.SourceName = workOrderItem.SourceNames[0]
		}
		// 获取任务列表、已完成任务数量
		tasks, err := w.taskRepo.GetTaskByWorkOrderId(ctx, workOrder.WorkOrderID)
		if err != nil {
			return nil, err
		}
		taskInfos := make([]*domain.TaskInfo, 0)
		// 这个工单的已完成任务数量
		completedTaskCount := 0
		for _, task := range tasks {
			if task.Status == constant.CommonStatusCompleted.Integer.Int8() {
				completedTaskCount++
			}
			taskInfo := &domain.TaskInfo{
				TaskId:   task.ID,
				TaskName: task.Name,
			}
			taskInfos = append(taskInfos, taskInfo)
		}
		workOrderItem.TaskInfo = taskInfos
		workOrderItem.CompletedTaskCount = int64(completedTaskCount)
		if workOrder.AuditStatus == domain.AuditStatusAuditing.Integer.Int32() && workOrder.AuditID != nil {
			workOrderItem.AuditApplyID = fmt.Sprintf("%d-%d", workOrder.ID, *workOrder.AuditID)
		}

		resp.Entries = append(resp.Entries, workOrderItem)
	}
	return resp, nil
}

var errUnsupportedWorkOrderType = errors.New("unsupported work order type")

// getPlanNameByWorkOrderTypeAndPlanID 根据工单类型和计划 ID 返回计划的名称
func (w *workOrderUseCase) getPlanNameByWorkOrderTypeAndPlanID(ctx context.Context, workOrderType int32, planID string) (string, error) {
	switch workOrderType {
	case domain.WorkOrderTypeDataComprehension.Integer.Int32():
		modelPlan, err := w.comprehensionPlanRepo.GetById(ctx, planID)
		if err != nil {
			return "", err
		}
		return modelPlan.Name, nil
	case domain.WorkOrderTypeDataAggregation.Integer.Int32():
		modelPlan, err := w.aggregationPlanRepo.GetById(ctx, planID)
		if err != nil {
			return "", err
		}
		return modelPlan.Name, nil
	default:
		return "", errUnsupportedWorkOrderType
	}
}

func GenAuditApplyID(ID uint64, auditRecID uint64) string {
	return fmt.Sprintf("%d-%d", ID, auditRecID)
}

func ParseAuditApplyID(auditApplyID string) (uint64, uint64, error) {
	strs := strings.Split(auditApplyID, "-")
	if len(strs) != 2 {
		return 0, 0, errors.New("audit apply id format invalid")
	}

	var auditID uint64
	ID, err := strconv.ParseUint(strs[0], 10, 64)
	if err == nil {
		auditID, err = strconv.ParseUint(strs[1], 10, 64)
	}
	return ID, auditID, err
}

// newWorkOrderFormViewForms 根据创建工单请求生成工单关联的逻辑视图字段列表
func newWorkOrderFormViewForms(views []domain.WorkOrderDetailFormView, workOrderID string) (fields []model.WorkOrderFormViewField) {
	for _, v := range views {
		for _, f := range v.Fields {
			fields = append(fields, model.WorkOrderFormViewField{
				WorkOrderID:      workOrderID,
				FormViewID:       v.ID,
				FormViewFieldID:  f.ID,
				StandardRequired: ptr.To(f.StandardRequired),
				DataElementID:    ptr.Deref(f.DataElement, domain.WorkOrderDetailDataElement{}).ID,
			})
		}
	}
	return
}

func newDataAggregationResources(workOrderID string, in []task_center_v1.AggregatedDataAggregationResource) (out []model.DataAggregationResource) {
	if in == nil {
		return
	}
	for _, r := range in {
		out = append(out, model.DataAggregationResource{
			DataViewID:         r.DataViewID,
			WorkOrderID:        workOrderID,
			CollectionMethod:   gorm_data_aggregation_inventory.ConvertDataAggregationResourceCollectionMethod_V1ToModel(r.CollectionMethod),
			SyncFrequency:      gorm_data_aggregation_inventory.ConvertDataAggregationResourceSyncFrequency_V1ToModel(r.SyncFrequency),
			BusinessFormID:     r.BusinessFormID,
			TargetDatasourceID: r.TargetDatasourceID,
		})
	}
	return out
}
func (w *workOrderUseCase) GetList(ctx context.Context, query *domain.GetListReq) (*domain.GetListResp, error) {
	workOrders, err := w.repo.List(ctx, query)
	if err != nil {
		return nil, err
	}
	resp := &domain.GetListResp{Entries: make([]*domain.WorkOrderInfo, 0)}
	for _, workOrder := range workOrders {
		workOrderItem := &domain.WorkOrderInfo{
			WorkOrderId:      workOrder.WorkOrderID,
			Name:             workOrder.Name,
			Code:             workOrder.Code,
			AuditStatus:      enum.ToString[domain.AuditStatus](workOrder.AuditStatus),
			AuditDescription: workOrder.AuditDescription,
			Status:           enum.ToString[domain.WorkOrderStatus](workOrder.Status),
			Draft:            ptr.Deref(workOrder.Draft, false),
			Type:             enum.ToString[domain.WorkOrderType](workOrder.Type),
			Priority:         enum.ToString[constant.CommonPriority](workOrder.Priority),
			CreatedAt:        workOrder.CreatedAt.UnixMilli(),
		}
		if workOrder.FinishedAt != nil {
			workOrderItem.FinishedAt = workOrder.FinishedAt.Unix()
		}
		if workOrder.ResponsibleUID != "" {
			workOrderItem.ResponsibleUID = workOrder.ResponsibleUID
			workOrderItem.ResponsibleUName = w.userRepo.GetNameByUserId(ctx, workOrder.ResponsibleUID)
		}
		// 根据工单来源类型，获取来源名称
		if workOrder.SourceType > 0 {
			workOrderItem.SourceType = enum.ToString[domain.WorkOrderSourceType](workOrder.SourceType)
			workOrderItem.SourceId = workOrder.SourceID
		}
		// 获取任务列表
		tasks, err := w.workOrderTaskRepo.ListByWorkOrderIDs(ctx, []string{workOrder.WorkOrderID})
		if err != nil {
			return nil, err
		}
		taskInfos := make([]*domain.WorkOrderTaskInfo, 0)
		for _, task := range tasks {
			switch workOrder.Type {
			// 数据归集
			case domain.WorkOrderTypeDataAggregation.Integer.Int32():
				d := ptr.Deref(&task.DataAggregation, []model.WorkOrderDataAggregationDetail{})
				dataAggregations := make([]task_center_v1.WorkOrderTaskDetailAggregationDetail, 0)
				for _, v := range d {
					// 把华傲的DataSourceID转换成AF的DataSourceID
					if s, err := w.Datasource.GetByHuaAoId(ctx, v.Source.DatasourceID); err != nil {
						return nil, err
					} else {
						v.Source.DatasourceID = s.ID
					}
					if s, err := w.Datasource.GetByHuaAoId(ctx, v.Target.DatasourceID); err != nil {
						return nil, err
					} else {
						v.Target.DatasourceID = s.ID
					}
					dataAggregations = append(dataAggregations, task_center_v1.WorkOrderTaskDetailAggregationDetail{
						Source: task_center_v1.WorkOrderTaskDetailAggregationTableReference(v.Source),
						Target: task_center_v1.WorkOrderTaskDetailAggregationTableReference(v.Target),
					})
				}

				taskInfo := &domain.WorkOrderTaskInfo{
					TaskId:          task.ID,
					TaskName:        task.Name,
					DataAggregation: dataAggregations,
				}
				taskInfos = append(taskInfos, taskInfo)
				if task.Status == model.WorkOrderTaskCompleted {
					workOrderItem.CompletedTaskCount++
				}
			default:
				d := ptr.Deref(task.DataFusion, model.WorkOrderDataFusionDetail{})
				// 把华傲的DataSourceID转换成AF的DataSourceID
				dataBaseId := ""
				if s, err := w.Datasource.GetByHuaAoId(ctx, d.DatasourceID); err != nil {
					return nil, err
				} else {
					dataBaseId = s.ID
				}

				taskInfo := &domain.WorkOrderTaskInfo{
					TaskId:       task.ID,
					TaskName:     task.Name,
					DataSourceId: dataBaseId, // 兼容已有的融合工单逻辑
					DataTable:    d.DataTable,
				}
				taskInfos = append(taskInfos, taskInfo)
				if task.Status == model.WorkOrderTaskCompleted {
					workOrderItem.CompletedTaskCount++
				}
			}
		}
		workOrderItem.TaskInfo = taskInfos

		//融合工单,获取融合表名称
		if workOrderItem.Type == domain.WorkOrderTypeDataFusion.String {
			nameModel, err := w.workOrderExtendRepo.GetByWorkOrderIdAndExtendKey(ctx, workOrder.WorkOrderID, string(constant.FusionTableName))
			if err != nil {
				return nil, err
			}
			if nameModel.ID > 0 {
				workOrderItem.FusionTableName = nameModel.ExtendValue
			}
		}

		resp.Entries = append(resp.Entries, workOrderItem)
	}
	return resp, nil
}

// newFusionWorkOrderTableFields 根据创建融合工单请求生成工单关联的融合字段列表
func newFusionWorkOrderTableFields(fields []*domain.CreateFusionField, workOrderId, userId string) (fieldModels []*model.TFusionField, err error) {
	fieldModels = make([]*model.TFusionField, len(fields))
	timeNow := time.Now()
	for i, field := range fields {
		uniqueID, err := utilities.GetUniqueID()
		if err != nil {
			return nil, errorcode.Detail(errorcode.InternalError, err)
		}
		fieldModels[i] = &model.TFusionField{
			ID:                uniqueID,
			CName:             field.CName,
			EName:             field.EName,
			WorkOrderID:       workOrderId,
			DataType:          domain.DataTypeUnknown.Integer.Int(),
			PrimaryKey:        field.PrimaryKey,
			IsRequired:        field.IsRequired,
			IsIncrement:       field.IsIncrement,
			IsStandard:        field.IsStandard,
			FieldRelationship: field.FieldRelationship,
			Index:             field.Index,
			CreatedByUID:      userId,
			CreatedAt:         timeNow,
			UpdatedByUID:      &userId,
			UpdatedAt:         &timeNow,
			CatalogID:         field.CatalogID,
			InfoItemID:        field.InfoItemID,
		}
		fieldModels[i].StandardID, err = StringToUint64Ptr(field.StandardID)
		if err != nil {
			return nil, errorcode.Detail(errorcode.InternalError, err)
		}
		//fieldModels[i].CatalogID, err = StringToUint64Ptr(field.CatalogID)
		//if err != nil {
		//	return nil, errorcode.Detail(errorcode.InternalError, err)
		//}
		//fieldModels[i].InfoItemID, err = StringToUint64Ptr(field.InfoItemID)
		//if err != nil {
		//	return nil, errorcode.Detail(errorcode.InternalError, err)
		//}
		fieldModels[i].CodeTableID, err = StringToUint64Ptr(field.CodeTableID)
		if err != nil {
			return nil, errorcode.Detail(errorcode.InternalError, err)
		}
		fieldModels[i].CodeRuleID, err = StringToUint64Ptr(field.CodeRuleID)
		if err != nil {
			return nil, errorcode.Detail(errorcode.InternalError, err)
		}
		if field.DataType != nil {
			fieldModels[i].DataType = *field.DataType
		}
		fieldModels[i].DataRange = field.DataRange
		fieldModels[i].DataLength = field.DataLength
		fieldModels[i].DataAccuracy = field.DataAccuracy
	}
	return
}

func StringToUint64Ptr(str *string) (*uint64, error) {
	if str == nil || *str == "" {
		return nil, nil // 如果输入指针为 nil，返回 nil
	}
	// 将字符串转换为 uint64
	u64, err := strconv.ParseUint(*str, 10, 64)
	if err != nil {
		return nil, err // 转换失败，返回 nil 和错误
	}
	return &u64, nil // 转换成功，返回指针和 nil
}

// UpdateFusionWorkOrderTableFields 根据修改融合工单请求生成工单关联的融合字段列表
func UpdateFusionWorkOrderTableFields(fields []*domain.UpdateFusionField, workOrderId, userId string) (fieldModels []*model.TFusionField, err error) {
	fieldModels = make([]*model.TFusionField, len(fields))
	timeNow := time.Now()
	for i, field := range fields {
		fieldModels[i] = &model.TFusionField{
			CName:             field.CName,
			EName:             field.EName,
			WorkOrderID:       workOrderId,
			DataType:          domain.DataTypeUnknown.Integer.Int(),
			PrimaryKey:        field.PrimaryKey,
			IsRequired:        field.IsRequired,
			IsIncrement:       field.IsIncrement,
			IsStandard:        field.IsStandard,
			FieldRelationship: field.FieldRelationship,
			Index:             field.Index,
			CreatedByUID:      userId,
			CreatedAt:         timeNow,
			UpdatedByUID:      &userId,
			UpdatedAt:         &timeNow,
			CatalogID:         field.CatalogID,
			InfoItemID:        field.InfoItemID,
		}
		fieldModels[i].StandardID, err = StringToUint64Ptr(field.StandardID)
		if err != nil {
			return nil, errorcode.Detail(errorcode.InternalError, err)
		}
		//fieldModels[i].CatalogID, err = StringToUint64Ptr(field.CatalogID)
		//if err != nil {
		//	return nil, errorcode.Detail(errorcode.InternalError, err)
		//}
		//fieldModels[i].InfoItemID, err = StringToUint64Ptr(field.InfoItemID)
		//if err != nil {
		//	return nil, errorcode.Detail(errorcode.InternalError, err)
		//}
		fieldModels[i].CodeTableID, err = StringToUint64Ptr(field.CodeTableID)
		if err != nil {
			return nil, errorcode.Detail(errorcode.InternalError, err)
		}
		fieldModels[i].CodeRuleID, err = StringToUint64Ptr(field.CodeRuleID)
		if err != nil {
			return nil, errorcode.Detail(errorcode.InternalError, err)
		}
		if field.DataType != nil {
			fieldModels[i].DataType = *field.DataType
		}
		fieldModels[i].DataRange = field.DataRange
		fieldModels[i].DataLength = field.DataLength
		fieldModels[i].DataAccuracy = field.DataAccuracy

		if field.ID != "" {
			fieldModels[i].ID, err = strconv.ParseUint(field.ID, 10, 64)
			if err != nil {
				return nil, errorcode.Detail(errorcode.InternalError, err)
			}
		} else {
			fieldModels[i].ID, err = utilities.GetUniqueID()
			if err != nil {
				return nil, errorcode.Detail(errorcode.InternalError, err)
			}
		}
	}
	return fieldModels, nil
}

func (w *workOrderUseCase) FusionFieldList(ctx context.Context, workOrderId string) ([]*domain.FusionField, error) {
	dbFields, err := w.fusionModelRepo.List(ctx, workOrderId)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	standardIds := make([]string, 0)
	dictIds := make([]string, 0)
	ruleIds := make([]string, 0)
	infoItemIds := make([]string, 0)
	catalogIds := make([]string, 0)
	for _, dbField := range dbFields {
		if dbField.StandardID != nil {
			standardId := Uint64PtrToStringPtr(dbField.StandardID)
			standardIds = append(standardIds, *standardId)
		}
		if dbField.CodeTableID != nil {
			dictId := Uint64PtrToStringPtr(dbField.CodeTableID)
			dictIds = append(dictIds, *dictId)
		}
		if dbField.CodeRuleID != nil {
			ruleId := Uint64PtrToStringPtr(dbField.CodeRuleID)
			ruleIds = append(ruleIds, *ruleId)
		}
		if dbField.InfoItemID != nil {
			infoItemIds = append(infoItemIds, *dbField.InfoItemID)
		}
		if dbField.CatalogID != nil {
			catalogIds = append(catalogIds, *dbField.CatalogID)
		}
	}
	// 获取数据元
	standardMap := make(map[string]*standardization.DataResp)
	if len(standardIds) > 0 {
		standardMap, err = w.standardization.GetStandardMapByID(ctx, standardIds...)
		if err != nil {
			log.WithContext(ctx).Error("standardization.GetDataElementDetailByID error ", zap.Error(err))
			return nil, errorcode.Detail(errorcode.InternalError, err)
		}
	}
	//获取码表
	dictMap := make(map[string]standardization.DictResp)
	if len(dictIds) > 0 {
		dictMap, err = w.standardization.GetStandardDict(ctx, dictIds)
		if err != nil {
			log.WithContext(ctx).Error("standardization.GetStandardDict error ", zap.Error(err))
			return nil, errorcode.Detail(errorcode.InternalError, err)
		}
	}
	//获取编码规则
	ruleMap := make(map[string]standardization.RuleResp)
	if len(ruleIds) > 0 {
		ruleMap, err = w.standardization.GetStandardRule(ctx, ruleIds)
		if err != nil {
			log.WithContext(ctx).Error("standardization.GetStandardRule error ", zap.Error(err))
			return nil, errorcode.Detail(errorcode.InternalError, err)
		}
	}
	//获取信息项
	//infoItemMap := make(map[uint64]*data_catalog_driven.ColumnNameInfo)
	//if len(infoItemIds) > 0 {
	//	infoItemMap, err = w.dataCatalogRepo.GetColumnMapByIds(ctx, &data_catalog_driven.GetColumnListByIdsReq{IDs: infoItemIds})
	//	if err != nil {
	//		log.WithContext(ctx).Error("standardization.GetStandardRule error ", zap.Error(err))
	//		return nil, errorcode.Detail(errorcode.InternalError, err)
	//	}
	//}

	// 获取目录名称
	//catalogMap := make(map[uint64]string)
	//if len(catalogIds) > 0 {
	//	// 获取目录名
	//	infos, err := w.dataCatalog.GetCatalogInfos(ctx, catalogIds...)
	//	if err != nil {
	//		return nil, err
	//	}
	//	for _, info := range infos {
	//		catalogMap[info.ID] = info.Title
	//	}
	//}

	//合并查询结果
	res := make([]*domain.FusionField, len(dbFields))
	for i, dbField := range dbFields {
		standardID := Uint64PtrToStringPtr(dbField.StandardID)
		codeTableID := Uint64PtrToStringPtr(dbField.CodeTableID)
		codeRuleID := Uint64PtrToStringPtr(dbField.CodeRuleID)
		res[i] = &domain.FusionField{
			ID:                strconv.FormatUint(dbField.ID, 10),
			CName:             dbField.CName,
			EName:             dbField.EName,
			PrimaryKey:        dbField.PrimaryKey,
			IsRequired:        dbField.IsRequired,
			IsIncrement:       dbField.IsIncrement,
			IsStandard:        dbField.IsStandard,
			FieldRelationship: dbField.FieldRelationship,
			CatalogID:         dbField.CatalogID,
			Index:             dbField.Index,
			CreatedByUID:      dbField.CreatedByUID,
			CreatedAt:         dbField.CreatedAt.UnixMilli(),
			UpdatedByUID:      *dbField.UpdatedByUID,
			UpdatedAt:         dbField.UpdatedAt.UnixMilli(),
			InfoItemID:        dbField.InfoItemID,
		}

		//if dbField.InfoItemID != nil {
		//	res[i].InfoItemID = Uint64PtrToStringPtr(dbField.InfoItemID)
		//	if infoItem, ok := infoItemMap[*dbField.InfoItemID]; ok {
		//		res[i].InfoItemBusinessName = infoItem.BusinessName
		//		res[i].InfoItemTechnicalName = infoItem.TechnicalName
		//	}
		//}

		if standardID != nil {
			if s, ok := standardMap[*standardID]; ok {
				res[i].StandardID = standardID
				res[i].StandardNameZH = s.NameCn
				res[i].StandardNameEN = s.NameEn
			}
		}
		if codeTableID != nil {
			if dict, ok := dictMap[*codeTableID]; ok {
				res[i].CodeTableID = codeTableID
				res[i].CodeTableNameZH = dict.NameZh
				res[i].CodeTableNameEN = dict.NameEN
			}
		}
		if codeRuleID != nil {
			if rule, ok := ruleMap[*codeRuleID]; ok {
				res[i].CodeRuleID = codeRuleID
				res[i].CodeRuleName = rule.Name
			}
		}
		//if dbField.CatalogID != nil {
		//	if catalogName, ok := catalogMap[*dbField.CatalogID]; ok {
		//		res[i].CatalogName = catalogName
		//	}
		//}

		res[i].DataRange = dbField.DataRange
		res[i].DataType = dbField.DataType
		res[i].DataTypeName = enum.ToString[domain.DataType](dbField.DataType)
		res[i].DataLength = dbField.DataLength
		res[i].DataAccuracy = dbField.DataAccuracy
	}
	return res, nil
}

// Uint64PtrToStringPtr 将 *uint64 转换为 *string
func Uint64PtrToStringPtr(u64Ptr *uint64) *string {
	if u64Ptr == nil {
		return nil // 如果输入指针为 nil，返回 nil
	}
	// 将 uint64 转换为字符串
	str := strconv.FormatUint(*u64Ptr, 10)
	// 返回字符串的指针
	return &str
}

func (w *workOrderUseCase) Remind(ctx context.Context, id string) (*domain.IDResp, error) {
	workOrder, err := w.repo.GetById(ctx, id)
	if err != nil {
		return nil, err
	}
	workOrder.Remind = 1
	err = w.repo.Update(ctx, workOrder)
	if err != nil {
		return nil, err
	}
	return &domain.IDResp{Id: workOrder.WorkOrderID}, nil
}

func (w *workOrderUseCase) Feedback(ctx context.Context, id string, req *domain.WorkOrderFeedbackReq, userId, userName string) (*domain.IDResp, error) {
	workOrder, err := w.repo.GetById(ctx, id)
	if err != nil {
		return nil, err
	}
	workOrder.Score = req.Score
	if req.FeedbackContent != nil {
		workOrder.FeedbackContent = *req.FeedbackContent
	}
	workOrder.FeedbackBy = userId
	now := time.Now()
	workOrder.FeedbackAt = &now
	err = w.repo.Update(ctx, workOrder)
	if err != nil {
		return nil, err
	}

	return &domain.IDResp{Id: workOrder.WorkOrderID}, nil
}

func (w *workOrderUseCase) Reject(ctx context.Context, id string, req *domain.WorkOrderRejectReq, userId, userName string) (*domain.IDResp, error) {
	// 驳回工单后进入审核流程，同意驳回则工单状态变为已完成，拒绝驳回则工单状态不变
	workOrder, err := w.repo.GetById(ctx, id)
	if err != nil {
		return nil, err
	}
	_, err = w.Audit(ctx, workOrder, userId, userName)
	if err != nil {
		return nil, err
	}
	if workOrder.AuditStatus == domain.AuditStatusPass.Integer.Int32() {
		workOrder.Status = domain.WorkOrderStatusFinished.Integer.Int32()
		if workOrder.Type == domain.WorkOrderTypeDataQuality.Integer.Int32() {
			alarmRuleInfo, err := w.GetAlarmRule(ctx)
			if err != nil {
				return nil, err
			}
			if alarmRuleInfo != nil {
				deadline := workOrder.CreatedAt.AddDate(0, 0, int(alarmRuleInfo.DeadlineTime))
				workOrder.FinishedAt = &deadline
			}
		}
	}
	workOrder.RejectReason = req.RejectReason
	err = w.repo.Update(ctx, workOrder)
	return &domain.IDResp{Id: workOrder.WorkOrderID}, err
}

// 同步工单到第三方，例如：华傲
func (w *workOrderUseCase) Sync(ctx context.Context, id string) error {

	// 从数据库获取工单记录
	log.Debug("get work order record from database", zap.String("id", id))
	workOrder, err := w.repo.GetById(ctx, id)
	if err != nil {
		return err
	}
	if !w.callback.CallbackEnabled {
		if workOrder.Type != domain.WorkOrderTypeDataQualityAudit.Integer.Int32() {
			return errorcode.Desc(errorcode.WorkOrderSyncDisabled)
		}
	}

	// 根据工单类型判断是否需要同步到第三方
	if !domain.SynchronizedWorkOrderTypes_Int32.Has(workOrder.Type) {
		return errorcode.Desc(errorcode.NonSynchronizedWorkOrderType, enum.ToString[domain.WorkOrderType](workOrder.Type))
	}

	// 同步工单到第三方
	log.Info("sync work order to third party", zap.Any("workOrder", workOrder))
	if err := w.callback.Sync(ctx, workOrder); err != nil {
		return err
	}
	// 标记工单已经被同步
	log.Info("mark work order as synced", zap.String("id", id))
	if err := w.repo.MarkAsSynced(ctx, id); err != nil {
		return err
	}

	// 工单同步到第三方后，状态变更为执行中
	log.Info("update synced work order status to ongoing", zap.String("id", workOrder.WorkOrderID))
	if err := w.repo.UpdateStatus(ctx, workOrder.WorkOrderID, domain.WorkOrderStatusOngoing.Integer.Int32()); err != nil {
		return err
	}

	return nil
}

func (w *workOrderUseCase) GetDataQualityImprovement(ctx context.Context) (*domain.DataQualityImprovementResp, error) {
	resp := &domain.DataQualityImprovementResp{}
	req := &domain.WorkOrderListReq{
		Type: domain.WorkOrderTypeDataQuality.String,
	}
	totalCount, workOrders, err := w.repo.GetList(ctx, req)
	resp.TotalCount = totalCount
	if err != nil {
		return nil, err
	}
	alarmRuleInfo, err := w.GetAlarmRule(ctx)
	if err != nil {
		return nil, err
	}
	for _, workOrder := range workOrders {
		switch workOrder.Status {
		case domain.WorkOrderStatusOngoing.Integer.Int32():
			resp.OngoingCount++
		case domain.WorkOrderStatusFinished.Integer.Int32():
			resp.FinishedCount++
			UpdatedTime := time.Date(workOrder.UpdatedAt.Year(), workOrder.UpdatedAt.Month(), workOrder.UpdatedAt.Day(), 0, 0, 0, 0, workOrder.UpdatedAt.Location())
			FinishedTime := time.Date(workOrder.FinishedAt.Year(), workOrder.FinishedAt.Month(), workOrder.FinishedAt.Day(), 0, 0, 0, 0, workOrder.FinishedAt.Location())
			if UpdatedTime.Before(FinishedTime) || UpdatedTime.Equal(FinishedTime) {
				resp.NotOverdueCount++
			}
		}
		_, daysRemaining := w.CheckAlarm(ctx, workOrder, alarmRuleInfo)
		if daysRemaining != nil {
			resp.AlertCount++
		}
	}
	return resp, nil
}

func (w *workOrderUseCase) ReExplore(ctx context.Context, workOrderId string, userId, userName string, req *domain.ReExploreReq) (*domain.IDResp, error) {
	workOrder, err := w.repo.GetById(ctx, workOrderId)
	if err != nil {
		log.Error("ReExplore w.repo.GetById failed", zap.String("id", workOrderId), zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if workOrder.Type != domain.WorkOrderTypeDataQualityAudit.Integer.Int32() {
		err = errors.New("no data_quality_audit work order found")
		log.Error("ReExplore failed", zap.String("id", workOrderId), zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicResourceNotFound, err)
	}
	if !(workOrder.Status == domain.WorkOrderStatusOngoing.Integer.Int32() || workOrder.Status == domain.WorkOrderStatusFinished.Integer.Int32()) {
		err = errors.New("reexplore not allowed by current data_quality_audit work order status")
		log.Error("ReExplore failed", zap.String("id", workOrderId), zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err)
	}
	if workOrder.ResponsibleUID != userId {
		err = errors.New("reexplore not allowed by current user, only the responsible user can reexplore")
		log.Error("ReExplore failed", zap.String("id", workOrderId), zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err)
	}
	datas, err := w.dv.GetWorkOrderExploreProgress(ctx, []string{workOrderId})
	if err != nil {
		log.Error("ReExplore w.dv.GetWorkOrderExploreProgress failed", zap.String("id", workOrderId), zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err)
	}
	if len(datas.Entries) > 0 {
		bOnlyFailed := req.ReExploreMode == domain.ReExploreModeFailed.String
		formViewIDs := make([]string, 0, len(datas.Entries[0].Entries))
		for i := range datas.Entries[0].Entries {
			if bOnlyFailed {
				if !(datas.Entries[0].Entries[i].Status == "canceled" || datas.Entries[0].Entries[i].Status == "failed") {
					continue
				}
			}
			formViewIDs = append(formViewIDs, datas.Entries[0].Entries[i].FormViewID)
		}

		if len(formViewIDs) > 0 {
			var remark domain.Remark
			if err := json.Unmarshal([]byte(workOrder.Remark), &remark); err != nil {
				log.Error("ReExplore json.Unmarshal failed", zap.String("id", workOrderId), zap.Error(err))
				return nil, err
			}
			req := &data_view.CreateWorkOrderTaskReq{
				WorkOrderID:  workOrder.WorkOrderID,
				FormViewIDs:  formViewIDs,
				CreatedByUID: workOrder.CreatedByUID,
				TotalSample:  remark.TotalSample,
			}
			_, err := w.dataView.CreateWorkOrderTask(ctx, req)
			if err != nil {
				log.Error("ReExplore w.dataView.CreateWorkOrderTask failed", zap.String("id", workOrderId), zap.Error(err))
				return nil, errorcode.Detail(errorcode.InternalError, err)
			}

			now := time.Now()
			workOrder.Status = domain.WorkOrderStatusOngoing.Integer.Int32()
			workOrder.UpdatedAt = now
			err = w.repo.Update(ctx, workOrder)
			if err != nil {
				log.Error("ReExplore w.repo.Update failed", zap.String("id", workOrderId), zap.Error(err))
				return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
			}
		}
	}
	return &domain.IDResp{Id: workOrder.WorkOrderID}, nil
}

func (w *workOrderUseCase) GetAlarmRule(ctx context.Context) (*domain.AlarmRuleInfo, error) {
	resp := &domain.AlarmRuleInfo{}
	rules, err := w.cc.GetAlarmRule(ctx, []string{domain.WorkOrderTypeDataQuality.String})
	if err != nil {
		log.WithContext(ctx).Error("GetAlarmRule error ", zap.Error(err))
	}
	if len(rules) > 0 {
		resp.DeadlineTime = rules[0].DeadlineTime
		resp.BeforehandTime = rules[0].BeforehandTime
	}
	return resp, nil
}

func (w *workOrderUseCase) CheckAlarm(ctx context.Context, workOrder *model.WorkOrder, rule *domain.AlarmRuleInfo) (int64, *int64) {
	var finishedAt int64
	var daysRemaining *int64
	if rule != nil {
		deadline := workOrder.CreatedAt.AddDate(0, 0, int(rule.DeadlineTime))
		finishedAt = deadline.Unix()
		// 已完成的工单不需要提醒
		if workOrder.Status != domain.WorkOrderStatusFinished.Integer.Int32() {
			now := time.Now()
			deadline = time.Date(deadline.Year(), deadline.Month(), deadline.Day(), 0, 0, 0, 0, deadline.Location())
			nowDate := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
			reminderDate := deadline.AddDate(0, 0, -int(rule.BeforehandTime))
			// 当前日期在提醒日期当天或之后，提醒或者逾期
			if nowDate.After(reminderDate) || nowDate.Equal(reminderDate) {
				days := int64(deadline.Sub(nowDate).Hours() / 24)
				daysRemaining = &days
			}
		}
	}
	return finishedAt, daysRemaining
}

// 发送工单消息：创建、更新、删除
func (w *workOrderUseCase) SendWorkOrderMsg(ctx context.Context, t meta_v1.WatchEventType, order *model.WorkOrder) error {
	var finishedAt *meta_v1.Time
	if order.FinishedAt != nil {
		finishedAt = ptr.To(meta_v1.NewTime(*order.FinishedAt))
	}

	// 生成消息内容
	value, err := json.Marshal(&meta_v1.WatchEvent[task_center_v1.WorkOrder]{
		Type: t,
		Resource: task_center_v1.WorkOrder{
			ID:             order.WorkOrderID,
			WorkOrderID:    order.WorkOrderID,
			Name:           order.Name,
			Type:           task_center_v1.WorkOrderType(enum.ToString[domain.WorkOrderType](order.Type)),
			Status:         task_center_v1.WorkOrderStatus(enum.ToString[domain.WorkOrderStatus](order.Status)),
			ResponsibleUID: order.ResponsibleUID,
			Priority:       task_center_v1.WorkOrderPriority(enum.ToString[constant.CommonPriority](order.Priority)),
			FinishedAt:     finishedAt,
			CatalogIDs:     strings.Split(order.CatalogIds, ","),
			Description:    order.Description,
			Remark:         order.Remark,
			SourceType:     task_center_v1.WorkOrderSourceType(enum.ToString[domain.WorkOrderSourceType](order.SourceType)),
			SourceID:       order.SourceID,
			SourceIDs:      order.SourceIDs,
			CreatedAt:      meta_v1.NewTimestampUnixMilli(order.CreatedAt),
		},
	})
	if err != nil {
		return err
	}

	// 发送消息
	if err := w.producer.Send(constant.TopicAFTaskCenterV1WorkOrders, value); err != nil {
		log.WithContext(ctx).Error("publish msg error", zap.Error(err), zap.Any("topic", constant.TopicAFTaskCenterV1WorkOrders), zap.ByteString("msg", value))
		return err
	}

	return nil
}

// newQualityAuditWorkOrderFormViewForms 根据创建质量稽核工单请求生成工单关联的逻辑视图列表
func newQualityAuditWorkOrderFormViewForms(viewIds []string, workOrderID, datasourceId, userId string, timeNow time.Time) ([]*model.TQualityAuditFormViewRelation, error) {
	relations := make([]*model.TQualityAuditFormViewRelation, 0)
	for _, viewId := range viewIds {
		relationUniqueID, err := utilities.GetUniqueID()
		if err != nil {
			return nil, errorcode.Detail(errorcode.InternalError, err)
		}
		relation := &model.TQualityAuditFormViewRelation{
			ID:           relationUniqueID,
			WorkOrderID:  workOrderID,
			FormViewID:   viewId,
			DatasourceID: datasourceId,
			CreatedByUID: userId,
			CreatedAt:    timeNow,
			UpdatedByUID: &userId,
			UpdatedAt:    &timeNow,
		}
		relations = append(relations, relation)
	}
	return relations, nil
}

func (w *workOrderUseCase) CheckQualityAuditRepeat(ctx context.Context, req *domain.CheckQualityAuditRepeatReq) (*domain.CheckQualityAuditRepeatResp, error) {
	unfinishedViews := make([]*domain.ViewWorkOrderRelation, 0)
	if len(req.ViewIds) > 0 {
		//根据传参获取已存在的关联关系
		relations, err := w.qualityAuditModelRepo.GetByViewIds(ctx, req.ViewIds)
		if err != nil {
			return nil, err
		}
		if len(relations) > 0 {
			viewMap := make(map[string][]string)
			workOrderIds := make([]string, 0)
			viewIds := make([]string, 0)
			for _, relation := range relations {
				viewMap[relation.FormViewID] = append(viewMap[relation.FormViewID], relation.WorkOrderID)
				workOrderIds = append(workOrderIds, relation.WorkOrderID)
				viewIds = append(viewIds, relation.FormViewID)
			}

			// 获取工单信息
			workOrders, err := w.repo.GetByWorkOrderIDs(ctx, util.SliceUnique(workOrderIds))
			if err != nil {
				return nil, err
			}

			// 已经通过审核的，但还没完成的工单
			unfinishedWorkOrderMap := make(map[string]string)
			for _, order := range workOrders {
				if order.AuditStatus == domain.AuditStatusPass.Integer.Int32() && order.Status != domain.WorkOrderStatusFinished.Integer.Int32() {
					unfinishedWorkOrderMap[order.WorkOrderID] = order.Name
				}
			}
			if len(unfinishedWorkOrderMap) > 0 {
				//获取逻辑视图信息
				viewBasicInfos, err := w.dataView.GetDataViewBasic(ctx, viewIds)
				if err != nil {
					return nil, err
				}
				viewNameMap := make(map[string]*data_view.ViewBasicInfo, len(viewBasicInfos))
				for _, info := range viewBasicInfos {
					viewNameMap[info.Id] = info
				}

				for viewId, ids := range viewMap {
					unfinishedWorkOrders := make([]*domain.WorkOrder, 0)
					for _, workOrderId := range ids {
						if name, ok := unfinishedWorkOrderMap[workOrderId]; ok {
							unfinishedWorkOrders = append(unfinishedWorkOrders, &domain.WorkOrder{WorkOrderId: workOrderId, WorkOrderName: name})
						}
					}
					if len(unfinishedWorkOrders) > 0 {
						viewInfo := &domain.ViewWorkOrderRelation{ViewId: viewId, WorkOrders: unfinishedWorkOrders}
						if info, ok := viewNameMap[viewId]; ok {
							viewInfo.ViewTechnicalName = info.TechnicalName
							viewInfo.ViewBusinessName = info.BusinessName
						}
						unfinishedViews = append(unfinishedViews, viewInfo)
					}
				}
			}
		}
	}
	return &domain.CheckQualityAuditRepeatResp{Relations: unfinishedViews}, nil
}

// 开启工单，工单状态从已签收变为执行中
func (w *workOrderUseCase) Start(ctx context.Context, tx *gorm.DB, workOrder *model.WorkOrder) error {
	// 检查状态是否为已签收
	if workOrder.Status != domain.WorkOrderStatusSignedFor.Integer.Int32() {
		return errors.New("work order status is not signed for")
	}
	// 检查审批状态是否为已批准
	if workOrder.AuditStatus != domain.AuditStatusPass.Integer.Int32() {
		return errors.New("work order audit status is not pass")
	}
	// 如果工单来源类型是项目，检查所在流程节点是否开启
	if workOrder.SourceType == domain.WorkOrderSourceTypeProject.Integer.Int32() {
		// 获取工单所属项目
		p, err := w.projectRepo.Get(ctx, workOrder.SourceID)
		if err != nil {
			return err
		}
		log.Debug("work order's project", zap.Any("project", p))
		// 获取工单所属项目流程节点
		n, err := w.flowInfoRepo.GetById(ctx, p.FlowID, p.FlowVersion, workOrder.NodeID)
		if err != nil {
			return err
		}
		log.Debug("work order's project flow node", zap.Any("node", n))
		// 检查节点是否可执行
		got, err := w.projectRepo.NodeExecutable(ctx, tx, p.ID, n)
		if err != nil {
			return err
		}
		if got != constant.TaskExecuteStatusExecutable.Integer.Int8() {
			return fmt.Errorf("project node %q is not executable", workOrder.NodeID)
		}
	}

	// 根据工单类型判断是否需要同步到第三方
	if domain.SynchronizedWorkOrderTypes_Int32.Has(workOrder.Type) {
		if !w.callback.CallbackEnabled {
			return errorcode.Desc(errorcode.WorkOrderSyncDisabled)
		}

		// 同步工单到第三方
		//
		// TODO: Refactor OnApproved -> Sync
		if err := w.callback.OnApproved(ctx, workOrder); err != nil {
			return err
		}

		// 工单同步到第三方
		log.Info("sync work ord to third party", zap.Any("workOrder", workOrder))
		if err := w.callback.Sync(ctx, workOrder); err != nil {
			return err
		}

		// 记录工单已经同步到第三方
		log.Info("mark work order as synced", zap.String("id", workOrder.WorkOrderID))
		if err := w.repo.MarkAsSynced(ctx, workOrder.WorkOrderID); err != nil {
			return err
		}
		workOrder.Synced = true
	}

	// 变更工单状态为执行中
	log.Info("update work order status to ongoing", zap.String("id", workOrder.WorkOrderID))
	if err := w.repo.UpdateStatus(ctx, workOrder.WorkOrderID, domain.WorkOrderStatusOngoing.Integer.Int32()); err != nil {
		return err
	}
	workOrder.Status = domain.WorkOrderStatusOngoing.Integer.Int32()

	return nil
}

func (w *workOrderUseCase) QueryDataFusionPreviewSQL(ctx context.Context, req *domain.DataFusionPreviewSQLReq) (*domain.DataFusionPreviewSQLResp, error) {
	s, err := w.Datasource.Get(ctx, req.DataSourceID)
	if err != nil {
		log.Warn("QueryDataFusionPreviewSQL get datasource fail", zap.Error(err), zap.String("id", req.DataSourceID))
	}
	var selectField []string
	for _, field := range req.Fields {
		selectField = append(selectField, fmt.Sprintf(`"%s"`, field.EName))
	}
	fieldSQL := strings.Join(selectField, ",")
	if s.TypeName == "oracle" || s.TypeName == "dameng" {
		fieldSQL = strings.ToUpper(fieldSQL)
	}
	selectSQL := fmt.Sprintf(`SELECT %s FROM (%s) %s`, fieldSQL, req.SceneSQL, req.TableName)
	// 如果是hive增加分区
	insertSQl := ""
	if s.TypeName == "hive-jdbc" {
		insertSQl = fmt.Sprintf(`SET hive.exec.dynamic.partition=true;SET hive.exec.dynamic.partition.mode=nonstrict; INSERT INTO %s.%s PARTITION("dat_dt") (%s) %s`, s.Schema, req.TableName, fieldSQL, selectSQL)
	} else {
		insertSQl = fmt.Sprintf(`INSERT INTO %s.%s (%s) %s`, s.Schema, req.TableName, fieldSQL, selectSQL)
	}
	execSql := insertSQl
	if s.TypeName != "postgresql" && s.TypeName != "oracle" && s.TypeName != "dameng" {
		execSql = strings.ReplaceAll(insertSQl, "\"", "`")
	}
	log.WithContext(ctx).Info("融合工单生成SQL InsertSQL: ", zap.Any("sql", execSql))

	// TODO 调用虚拟引擎转换sql
	return &domain.DataFusionPreviewSQLResp{HuaAoSQL: execSql}, nil
}
func (w *workOrderUseCase) AggregationForQualityAudit(ctx context.Context, query *domain.AggregationForQualityAuditListReq) (*domain.AggregationForQualityAuditListResp, error) {
	var err error
	query.SubDepartmentIDs, err = user_util.GetDepart(ctx, w.ccDriven)
	if err != nil {
		return nil, err
	}

	totalCount, workOrders, err := w.repo.GetAggregationForQualityAudit(ctx, query)
	if err != nil {
		return nil, err
	}

	resp := &domain.AggregationForQualityAuditListResp{}
	resp.TotalCount = totalCount
	resp.Entries = make([]*domain.AggregationForQualityAuditItem, 0)
	for _, workOrder := range workOrders {
		workOrderItem := &domain.AggregationForQualityAuditItem{
			WorkOrderId: workOrder.WorkOrderID,
			Name:        workOrder.Name,
			Code:        workOrder.Code,
		}
		if workOrder.ResponsibleUID != "" {
			workOrderItem.ResponsibleUID = workOrder.ResponsibleUID
			workOrderItem.ResponsibleUName = w.userRepo.GetNameByUserId(ctx, workOrder.ResponsibleUID)
			departments, err := w.ccDriven.GetDepartmentsByUserID(ctx, workOrder.ResponsibleUID)
			if err != nil {
				log.WithContext(ctx).Errorf("ccDriven GetDepartmentsByUserID failed: %v", err)
				return nil, err
			}
			if len(departments) > 0 {
				departmentInfos := make([]string, 0)
				for _, department := range departments {
					departmentInfos = append(departmentInfos, department.Path)
				}
				workOrderItem.ResponsibleDepartment = departmentInfos
			}
		}
		resp.Entries = append(resp.Entries, workOrderItem)
	}
	return resp, nil
}

func (w *workOrderUseCase) QualityAuditResource(ctx context.Context, workOrderId string, query *domain.QualityAuditResourceReq) (resp *domain.QualityAuditResourceResp, err error) {
	resp = &domain.QualityAuditResourceResp{}
	datasourceIds, err := w.qualityAuditModelRepo.GetDatasourceIds(ctx, workOrderId)
	if err != nil {
		return nil, err
	}
	datasourceInfos := make([]*base.IDNameResp, 0)
	if len(datasourceIds) > 0 {
		dataSourceInfos, err := w.ccDriven.GetDataSourcePrecision(ctx, datasourceIds)
		if err != nil {
			return nil, err
		}
		for _, datasourceInfo := range dataSourceInfos {
			datasourceInfos = append(datasourceInfos, &base.IDNameResp{
				ID:   datasourceInfo.ID,
				Name: datasourceInfo.Name,
			})
		}
	}

	resp.DatasourceInfos = datasourceInfos
	//获取质量稽核工单关联的逻辑视图列表
	if len(datasourceIds) > 0 {
		datasourceId := query.DatasourceId
		if datasourceId == "" {
			datasourceId = datasourceIds[0]
		}
		formViewIds := make([]string, 0)
		if query.Keyword != "" {
			param := &data_view.GetByAuditStatusReq{
				DatasourceId: query.DatasourceId,
				Keyword:      query.Keyword,
			}
			viewResp, err := w.dataView.GetByAuditStatus(ctx, param)
			if err != nil {
				return nil, err
			}
			for _, view := range viewResp.Entries {
				formViewIds = append(formViewIds, view.ID)
			}

			if len(formViewIds) == 0 {
				return resp, nil
			}
		}
		total, viewIds, err := w.qualityAuditModelRepo.GetByDatasourceId(ctx, workOrderId, datasourceId, formViewIds, query.Limit, query.Offset)
		if err != nil {
			return nil, err
		}
		if len(viewIds) > 0 {
			viewRes, err := w.dataView.GetViewInfo(ctx, &data_view.GetViewInfoReq{IDs: viewIds})
			if err != nil {
				return nil, err
			}
			resp.Entries = viewRes.Entries
			resp.TotalCount = total
		}
	}

	return resp, nil
}
