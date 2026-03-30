package impl

import (
	"context"
	"fmt"
	"strconv"

	"github.com/samber/lo"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order_task/scope"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	task_center_v1 "github.com/kweaver-ai/idrm-go-common/api/task_center/v1"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/data_view"
	"github.com/kweaver-ai/idrm-go-common/rest/standardization"
	"github.com/kweaver-ai/idrm-go-common/util/ptr"
	"github.com/kweaver-ai/idrm-go-common/util/sets"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// aggregateUserName 聚合用户名称
func (w *workOrderUseCase) aggregateUserName(ctx context.Context, id string) string {
	if id == "" {
		return ""
	}
	u, err := w.userRepo.GetByUserId(ctx, id)
	if err != nil {
		log.Warn("aggregate user name fail", zap.Error(err), zap.String("id", id))
		return ""
	}
	return u.Name
}

func (w *workOrderUseCase) aggregateDepartmentPath(ctx context.Context, id string) (path string) {
	if id == "" {
		return
	}
	department, err := w.Department.Get(ctx, id)
	if err != nil {
		log.Warn("get department fail", zap.Error(err), zap.String("id", id))
		return
	}
	return department.Path
}

// 只聚合 BusinessForms 和 Resources，因为只有归集工单只用到这两个
func (w *workOrderUseCase) aggregateDataAggregationInventory(ctx context.Context, in *task_center_v1.AggregatedDataAggregationInventory, sourceIDs []string) (out *task_center_v1.AggregatedDataAggregationInventory) {
	if in == nil {
		return
	}
	out = new(task_center_v1.AggregatedDataAggregationInventory)
	// 业务表
	var businessFormIDs = sets.New(sourceIDs...)
	for _, f := range in.BusinessForms {
		businessFormIDs.Insert(f.ID)
	}
	out.BusinessForms = w.dataAggregationInventory.AggregateBusinessForms(ctx, sets.List(businessFormIDs))
	// 归集资源
	out.Resources = w.aggregateResources(ctx, in.Resources)
	// 归集资源数量
	out.ResourcesCount = len(out.Resources)
	return
}
func (w *workOrderUseCase) aggregateResourceInto(ctx context.Context, in, out *task_center_v1.AggregatedDataAggregationResource) {
	out.DataViewID = in.DataViewID
	out.CollectionMethod = in.CollectionMethod
	out.SyncFrequency = in.SyncFrequency
	out.TargetDatasourceID = in.TargetDatasourceID
	out.BusinessFormID = in.BusinessFormID

	// 获取逻辑视图
	v, err := w.FormView.Get(ctx, in.DataViewID)
	if err != nil {
		log.Warn("get data view fail", zap.Error(err), zap.String("id", in.DataViewID))
		return
	}
	out.BusinessName = v.BusinessName
	out.TechnicalName = v.TechnicalName

	// 获取部门
	out.DepartmentPath = w.aggregateDepartmentPath(ctx, v.DepartmentID)

	// 获取数据源
	if s, err := w.Datasource.Get(ctx, v.DatasourceID); err != nil {
		log.Warn("get datasource fail", zap.Error(err), zap.String("id", v.DatasourceID))
	} else {
		out.DatasourceName = s.Name
	}

	// 获取目标数据源
	if s, err := w.Datasource.Get(ctx, in.TargetDatasourceID); err != nil {
		log.Warn("get target datasource fail", zap.Error(err), zap.String("id", in.TargetDatasourceID))
	} else {
		out.TargetDatasourceName = s.Name
		out.DatabaseName = s.DatabaseName
	}

	// 价值评估状态，存在探查任务即认为已评估
	out.ValueAssessmentStatus = v.ExploreJobID != ""
}
func (w *workOrderUseCase) aggregateResources(ctx context.Context, in []task_center_v1.AggregatedDataAggregationResource) (out []task_center_v1.AggregatedDataAggregationResource) {
	if in == nil {
		return
	}
	out = make([]task_center_v1.AggregatedDataAggregationResource, len(in))
	for i := range in {
		w.aggregateResourceInto(ctx, &in[i], &out[i])
	}
	return
}

// aggregateWorkOrderDetailFormView 聚合标准化工单关联的逻辑视图列表，发生错误时
// 记录 WARN 日志，不返回错误。
func (w *workOrderUseCase) aggregateWorkOrderDetailFormView(ctx context.Context, in []model.WorkOrderFormViewField) (out []domain.WorkOrderDetailFormView) {
	for formViewID, fields := range lo.GroupBy(in, func(f model.WorkOrderFormViewField) string { return f.FormViewID }) {
		// 获取逻辑视图
		view, err := w.dataView.GetDataViewDetails(ctx, formViewID)
		if err != nil {
			log.Warn("get data view detail fail", zap.Error(err), zap.String("formViewID", formViewID))
			out = append(out, domain.WorkOrderDetailFormView{ID: formViewID})
			continue
		}

		// 获取逻辑视图所属部门
		//
		// TODO: 批量获取
		res, err := w.ccDriven.GetDepartmentPrecision(ctx, []string{view.DepartmentID})
		if err != nil {
			log.Warn("get department fail", zap.Error(err), zap.String("departmentID", view.DepartmentID))
			res = &configuration_center.GetDepartmentPrecisionRes{}
		}

		var departmentPath string
		for _, d := range res.Departments {
			if d.ID != view.DepartmentID {
				continue
			}
			departmentPath = d.Path
			break
		}

		out = append(out, domain.WorkOrderDetailFormView{
			ID:             formViewID,
			BusinessName:   view.BusinessName,
			TechnicalName:  view.TechnicalName,
			Description:    view.Description,
			DatasourceName: view.DatasourceName,
			DepartmentPath: departmentPath,
			Fields:         w.aggregateWorkOrderDetailFormViewFields(ctx, formViewID, fields),
		})
	}
	return
}

// aggregateWorkOrderDetailFormViewFields 聚合标准化工单关联的逻辑视图字段列表，
// 发生错误时记录 WARN 日志，不返回错误。
func (w *workOrderUseCase) aggregateWorkOrderDetailFormViewFields(ctx context.Context, formViewID string, in []model.WorkOrderFormViewField) (out []domain.WorkOrderDetailFormViewField) {
	// 获取逻辑视图字段
	//
	// TODO: 批量获取
	res, err := w.dataView.GetDataViewField(ctx, formViewID)
	if err != nil {
		log.Warn("get data view fields fail", zap.Error(err), zap.String("formViewID", formViewID))
		res = &data_view.GetFieldsRes{ID: formViewID}
	}
	// 逻辑视图字段, key: form view field id, value: form view field
	fields := lo.KeyBy(res.FieldsRes, func(f *data_view.FieldsRes) string { return f.ID })

	for _, f := range in {
		// 找到字段 ID 对应的字段
		ff, ok := fields[f.FormViewFieldID]
		if !ok {
			ff = &data_view.FieldsRes{ID: f.FormViewFieldID}
		}

		out = append(out, domain.WorkOrderDetailFormViewField{
			ID:               ff.ID,
			BusinessName:     ff.BusinessName,
			TechnicalName:    ff.TechnicalName,
			StandardRequired: ptr.Deref(f.StandardRequired, false),
			DataElement:      w.aggregateWorkOrderDetailDataElement(ctx, f.DataElementID),
		})
	}
	return
}

// aggregateWorkOrderDetailDataElement 聚合标准化工单关联的逻辑视图经过标准化后
// 字段所关联的数据元，发生错误时记录 WARN 日志，不返回错误。
func (w *workOrderUseCase) aggregateWorkOrderDetailDataElement(ctx context.Context, id int) (element *domain.WorkOrderDetailDataElement) {
	// 数据元 ID 为空，代表未标准化
	if id == 0 {
		return
	}

	// 获取数据元
	//
	// TODO: 批量获取
	resp, err := w.standardization.GetDataElementDetailByID(ctx, strconv.Itoa(id))
	if err != nil {
		log.Warn("get standardization data element fail", zap.Error(err), zap.Int("dataElementID", id))
		return &domain.WorkOrderDetailDataElement{ID: id}
	}
	var data *standardization.DataResp
	// 遍历列表找到 ID 符合的一项
	for i := range resp {
		if resp[i].ID != strconv.Itoa(id) {
			continue
		}
		data = resp[i]
		break
	}
	if data == nil {
		return &domain.WorkOrderDetailDataElement{ID: id}
	}

	element = &domain.WorkOrderDetailDataElement{
		ID:               id,
		NameZH:           data.NameCn,
		NameEN:           data.NameEn,
		StandardTypeName: data.StdTypeName,
		DataTypeName:     data.DataTypeName,
		DataLength:       data.DataLength,
		DataPrecision:    data.DataPrecision,
		DictNameZH:       data.DictNameCN,
	}

	return
}

// aggregateWorkOrderListCreatedByMeEntries 聚合“我创建的”列表
func (w *workOrderUseCase) aggregateWorkOrderListCreatedByMeEntries(ctx context.Context, in []model.WorkOrder) (out []domain.WorkOrderListCreatedByMeEntry) {
	log.Debug("aggregate []domain.WorkOrderListCreatedByMeEntry", zap.Any("in", in))
	if in == nil {
		return
	}
	out = make([]domain.WorkOrderListCreatedByMeEntry, len(in))
	for i := range in {
		w.aggregateWorkOrderListCreatedByMeEntryInto(ctx, &in[i], &out[i])
	}
	return
}

// aggregateWorkOrderListCreatedByMeEntryInto 聚合“我创建的”列表中一项
func (w *workOrderUseCase) aggregateWorkOrderListCreatedByMeEntryInto(ctx context.Context, in *model.WorkOrder, out *domain.WorkOrderListCreatedByMeEntry) {
	out.ID = in.WorkOrderID
	out.Name = in.Name
	out.Code = in.Code
	out.Status = domain.WorkOrderStatusV2ForWorkOrderStatusInt32(in.Status)
	if in.SourceType == domain.WorkOrderSourceTypeProject.Integer.Int32() {
		out.NodeInactive = !w.aggregateProjectNodeActive(ctx, in.SourceID, in.NodeID)
	}
	out.Type = enum.ToString[domain.WorkOrderType](in.Type)
	out.Priority = enum.ToString[constant.CommonPriority](in.Priority)
	out.ResponsibleUser = meta_v1.ReferenceWithName{ID: in.ResponsibleUID, Name: w.aggregateUserName(ctx, in.ResponsibleUID)}
	out.AuditStatus = enum.ToString[domain.AuditStatus](in.AuditStatus)
	out.AuditDescription = in.AuditDescription
	out.WorkOrderTaskCount = w.aggregateWorkOrderTaskCountByWorkOrderIDAndWorkOrderType(ctx, in.WorkOrderID, in.Type)
	out.Sources = w.aggregateWorkOrderSources(ctx, in.Type, in.SourceType, in.SourceIDs)
	out.FinishedAt = in.FinishedAt
	out.Synced = in.Synced
	out.Draft = in.Draft

	if in.AuditStatus == domain.AuditStatusAuditing.Integer.Int32() && in.AuditID != nil {
		out.AuditApplyID = fmt.Sprintf("%d-%d", in.ID, *in.AuditID)
	}
}

// aggregateWorkOrderListCreatedByMeEntries 聚合“我负责的”列表
func (w *workOrderUseCase) aggregateWorkOrderListMyResponsibilitiesEntries(ctx context.Context, in []model.WorkOrder) (out []domain.WorkOrderListMyResponsibilitiesEntry) {
	if in == nil {
		return
	}
	out = make([]domain.WorkOrderListMyResponsibilitiesEntry, len(in))
	for i := range in {
		w.aggregateWorkOrderListMyResponsibilitiesEntryInto(ctx, &in[i], &out[i])
	}
	return
}

// aggregateWorkOrderListMyResponsibilitiesEntryInto 聚合“我负责的”列表中的一项
func (w *workOrderUseCase) aggregateWorkOrderListMyResponsibilitiesEntryInto(ctx context.Context, in *model.WorkOrder, out *domain.WorkOrderListMyResponsibilitiesEntry) {
	out.ID = in.WorkOrderID
	out.Name = in.Name
	out.Code = in.Code
	out.Status = domain.WorkOrderStatusV2ForWorkOrderStatusInt32(in.Status)
	out.Type = enum.ToString[domain.WorkOrderType](in.Type)
	out.Priority = enum.ToString[constant.CommonPriority](in.Priority)
	out.ResponsibleUser = meta_v1.ReferenceWithName{ID: in.ResponsibleUID, Name: w.aggregateUserName(ctx, in.ResponsibleUID)}
	out.WorkOrderTaskCount = w.aggregateWorkOrderTaskCountByWorkOrderIDAndWorkOrderType(ctx, in.WorkOrderID, in.Type)
	out.Sources = w.aggregateWorkOrderSources(ctx, in.Type, in.SourceType, in.SourceIDs)
	out.FinishedAt = in.FinishedAt
	out.CreatorName = w.aggregateUserName(ctx, in.CreatedByUID)
}

// aggregateWorkOrderTaskCountByWorkOrderIDAndWorkOrderType 聚合属于指定工单的工单任务数量
func (w *workOrderUseCase) aggregateWorkOrderTaskCountByWorkOrderIDAndWorkOrderType(ctx context.Context, id string, workOrderType int32) (result domain.WorkOrderTaskCount) {
	var err error
	// 理解工单任务的数据库表是 tc_task
	if workOrderType == domain.WorkOrderTypeDataComprehension.Integer.Int32() ||
		workOrderType == domain.WorkOrderTypeResearchReport.Integer.Int32() ||
		workOrderType == domain.WorkOrderTypeDataCatalog.Integer.Int32() ||
		workOrderType == domain.WorkOrderTypeFrontEndProcessors.Integer.Int32() {
		if result.Total, err = w.taskRepo.CountByWorkOrderID(ctx, id); err != nil {
			log.Warn("aggregate work order task count by work order id fail", zap.Error(err), zap.String("workOrderID", id))
		}
		if result.Completed, err = w.taskRepo.CountByWorkOrderIDAndStatus(ctx, id, constant.CommonStatusCompleted); err != nil {
			log.Warn("aggregate work order task count completed by work order id fail", zap.Error(err), zap.String("workOrderID", id))
		}
		return
	}
	if workOrderType == domain.WorkOrderTypeDataQualityAudit.Integer.Int32() {
		thirdParty, err := w.ccDriven.GetThirdPartySwitch(ctx)
		if err != nil {
			return
		}
		if !thirdParty {
			// resp, err := w.dataView.GetExploreTaskList(ctx, id)
			// if err != nil {
			// 	log.Warn("aggregate work order task count by work order id fail", zap.Error(err), zap.String("workOrderID", id))
			// }
			// if resp != nil {
			// 	result.Total = int(resp.TotalCount)
			// 	for _, task := range resp.Entries {
			// 		if task.Status == domain.TaskStatusFinished || task.Status == domain.TaskStatusCanceled || task.Status == domain.TaskStatusFailed {
			// 			result.Completed++
			// 		}
			// 	}
			// }

			datas, err := w.dv.GetWorkOrderExploreProgress(ctx, []string{id})
			if err != nil {
				log.Error("aggregateWorkOrderTaskCountByWorkOrderIDAndWorkOrderType w.dv.GetWorkOrderExploreProgress failed", zap.String("id", id), zap.Error(err))
				return
			}
			if len(datas.Entries) > 0 {
				result.Total = int(datas.Entries[0].TotalTaskNum)
				result.Completed = int(datas.Entries[0].FinishedTaskNum)
			}
			return
		}
	}
	// 其他类型的工单的任务的数据库表是 work_order_tasks
	if result.Total, err = w.workOrderTaskRepo.Count(ctx, scope.WorkOrderID(id)); err != nil {
		log.Warn("aggregate work order task count by work order id fail", zap.Error(err), zap.String("workOrderID", id))
	}
	if result.Completed, err = w.workOrderTaskRepo.Count(ctx, scope.WorkOrderID(id), scope.Completed); err != nil {
		log.Warn("aggregate work order task count completed by work order id fail", zap.Error(err), zap.String("workOrderID", id))
	}
	return
}

func (w *workOrderUseCase) aggregateWorkOrderSources(ctx context.Context, typeInt32 int32, sourceTypeInt32 int32, sourceIDs []string) (out []domain.WorkOrderSource) {
	if sourceIDs == nil {
		return
	}
	out = make([]domain.WorkOrderSource, len(sourceIDs))
	for i, id := range sourceIDs {
		w.aggregateWorkOrderSourceInto(ctx, typeInt32, sourceTypeInt32, id, &out[i])
	}
	return
}

func (w *workOrderUseCase) aggregateWorkOrderSourceInto(ctx context.Context, typeInt32, sourceTypeInt32 int32, sourceID string, out *domain.WorkOrderSource) {
	out.Type = enum.ToString[domain.WorkOrderSourceType](sourceTypeInt32)
	out.ID = sourceID

	// 根据来源类型，获取来源名称
	switch sourceTypeInt32 {
	// 计划
	case domain.WorkOrderSourceTypePlan.Integer.Int32():
		out.Name = w.aggregateWorkOrderSourcePlanName(ctx, typeInt32, sourceID)
	// 业务表
	case domain.WorkOrderSourceTypeBusinessForm.Integer.Int32():
		out.Name = w.aggregateBusinessFormName(ctx, sourceID)
	// 无、独立
	case domain.WorkOrderSourceTypeStandalone.Integer.Int32():
	// 数据分析
	case domain.WorkOrderSourceTypeDataAnalysis.Integer.Int32():
		out.Name = w.aggregateDataAnalysisOutputItemName(ctx, sourceID)
	// 逻辑视图
	case domain.WorkOrderSourceTypeFormView.Integer.Int32():
		out.Name = w.aggregateFormViewBusinessName(ctx, sourceID)
	// 归集工单
	case domain.WorkOrderSourceTypeAggregationWorkOrder.Integer.Int32():
		out.Name = w.aggregateWorkOrderName(ctx, sourceID)
	// 供需申请
	case domain.WorkOrderSourceTypeSupplyAndDemand.Integer.Int32():
		out.Name = w.aggregateSupplyAndDemandName(ctx, sourceID)
	// 项目
	case domain.WorkOrderSourceTypeProject.Integer.Int32():
		out.Name = w.aggregateProjectName(ctx, sourceID)
	default:
		log.Warn("invalid work order source type", zap.Int32("int32", sourceTypeInt32))
	}
}

// aggregateWorkOrderSourcePlanNameInto 聚合工单的来源计划名称
func (w *workOrderUseCase) aggregateWorkOrderSourcePlanName(ctx context.Context, workOrderTypeInt32 int32, sourceID string) string {
	switch workOrderTypeInt32 {
	// 数据理解
	case domain.WorkOrderTypeDataComprehension.Integer.Int32():
		p, err := w.comprehensionPlanRepo.GetById(ctx, sourceID)
		if err != nil {
			log.Warn("aggregate comprehension plan name fail", zap.Error(err), zap.String("id", sourceID))
			return ""
		}
		return p.Name
	// 数据归集
	case domain.WorkOrderTypeDataAggregation.Integer.Int32():
		p, err := w.aggregationPlanRepo.GetById(ctx, sourceID)
		if err != nil {
			log.Warn("aggregate aggregation plan name fail", zap.Error(err), zap.String("id", sourceID))
			return ""
		}
		return p.Name
	// 标准化
	case domain.WorkOrderTypeStandardization.Integer.Int32(), domain.WorkOrderTypeDataFusion.Integer.Int32(), domain.WorkOrderTypeDataQualityAudit.Integer.Int32():
		p, err := w.processingPlanRepo.GetById(ctx, sourceID)
		if err != nil {
			log.Warn("aggregate processing plan name fail", zap.Error(err), zap.String("id", sourceID))
			return ""
		}
		return p.Name
	default:
		log.Warn("invalid work order type to aggregate source plan name", zap.Int32("in32", workOrderTypeInt32))
		return ""
	}
}

// aggregateBusinessFormNameInto 聚合业务表名称
func (w *workOrderUseCase) aggregateBusinessFormName(ctx context.Context, id string) string {
	f, err := w.BusinessFormStandard.Get(ctx, id)
	if err != nil {
		log.Warn("aggregate business form name fail", zap.Error(err), zap.String("id", id))
		return ""
	}
	return f.Name
}

// aggregateDataAnalysisOutputItemNameInto 聚合数据分析产物名称
func (w *workOrderUseCase) aggregateDataAnalysisOutputItemName(ctx context.Context, id string) string {
	a, err := w.demandManagement.GetNameByAnalOutputItemID(ctx, id)
	if err != nil {
		log.Warn("aggregate data analysis output item name fail", zap.Error(err), zap.String("id", id))
		return ""
	}
	return a.AnalOutputItemName
}

// aggregateFormViewBusinessNameInto 聚合逻辑视图名称
func (w *workOrderUseCase) aggregateFormViewBusinessName(ctx context.Context, id string) string {
	v, err := w.FormView.Get(ctx, id)
	if err != nil {
		log.Warn("aggregate form view business name fail", zap.Error(err), zap.String("id", id))
		return ""
	}
	return v.BusinessName
}

// aggregateWorkOrderNameInto 聚合工单名称
func (w *workOrderUseCase) aggregateWorkOrderName(ctx context.Context, id string) string {
	o, err := w.repo.GetById(ctx, id)
	if err != nil {
		log.Warn("aggregate aggregation work order name fail", zap.Error(err), zap.String("id", id))
		return ""
	}
	return o.Name
}

// aggregateSupplyAndDemandNameInto 聚合供需申请名称
func (w *workOrderUseCase) aggregateSupplyAndDemandName(_ context.Context, id string) string {
	log.Warn("unimplemented", zap.String("id", id))
	return ""
}

// aggregateProjectName 聚合项目名称
func (w *workOrderUseCase) aggregateProjectName(ctx context.Context, id string) (name string) {
	p, err := w.projectRepo.Get(ctx, id)
	if err != nil {
		log.Warn("get project fail", zap.Error(err), zap.String("id", id))
		return
	}
	name = p.Name
	return
}

// aggregateProjectNodeActive 聚合项目运营流程节点是否开启
func (w *workOrderUseCase) aggregateProjectNodeActive(ctx context.Context, projectID, nodeID string) (active bool) {
	// 获取工单所属项目
	p, err := w.projectRepo.Get(ctx, projectID)
	if err != nil {
		log.Warn("get work order's project fail", zap.Any("projectID", projectID))
		return
	}
	// 获取工单所属项目流程节点
	n, err := w.flowInfoRepo.GetById(ctx, p.FlowID, p.FlowVersion, nodeID)
	if err != nil {
		log.Warn("get work order's project node fail", zap.Any("nodeID", nodeID))
		return
	}
	// 检查节点是否可执行
	got, err := w.projectRepo.NodeExecutable(ctx, nil, p.ID, n)
	if err != nil {
		log.Warn("check work order's project node executable fail", zap.String("projectID", projectID), zap.Any("node", n))
		return
	}
	active = got == constant.TaskExecuteStatusExecutable.Integer.Int8()
	return
}

// aggregateProjectNodeName 聚合项目运营流程节点名称
func (w *workOrderUseCase) aggregateProjectNodeName(ctx context.Context, projectID, nodeID string) (name string) {
	// 获取工单所属项目
	p, err := w.projectRepo.Get(ctx, projectID)
	if err != nil {
		log.Warn("get work order's project fail", zap.Any("projectID", projectID))
		return
	}
	// 获取工单所属项目流程节点
	n, err := w.flowInfoRepo.GetById(ctx, p.FlowID, p.FlowVersion, nodeID)
	if err != nil {
		log.Warn("get work order's project node fail", zap.Any("nodeID", nodeID))
		return
	}
	name = n.NodeName
	return
}
