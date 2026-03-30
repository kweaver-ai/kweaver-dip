package impl

import (
	"context"
	"encoding/json"
	"strings"

	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"

	de "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/data_exploration"
	dv "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/data_view"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_quality_improvement"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_quality"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/data_view"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
	"go.uber.org/zap"
)

type dataQualityUseCase struct {
	repo            work_order.Repo
	improvementRepo data_quality_improvement.Repo
	de              de.DataExploration
	dv              dv.DataView
	dvDriven        data_view.Driven
	producer        kafkax.Producer
	ccDriven        configuration_center.Driven
}

func NewDataQualityUseCase(
	repo work_order.Repo,
	improvementRepo data_quality_improvement.Repo,
	de de.DataExploration,
	dv dv.DataView,
	dvDriven data_view.Driven,
	producer kafkax.Producer,
	ccDriven configuration_center.Driven,
) data_quality.DataQualityUseCase {
	d := &dataQualityUseCase{
		repo:            repo,
		improvementRepo: improvementRepo,
		de:              de,
		dv:              dv,
		dvDriven:        dvDriven,
		producer:        producer,
		ccDriven:        ccDriven,
	}
	return d
}

func (d *dataQualityUseCase) ReportList(ctx context.Context, query *data_quality.ReportListReq) (*data_quality.ReportListResp, error) {
	resp := &data_quality.ReportListResp{}
	// 数据质量按报告生成时间分页获取报告
	req := &de.ReportListReq{
		Offset:      query.Offset,
		Limit:       query.Limit,
		Keyword:     query.Keyword,
		CatalogName: query.CatalogName,
	}
	thirdParty, err := d.ccDriven.GetThirdPartySwitch(ctx)
	if err != nil {
		return nil, err
	}
	if thirdParty {
		req.ThirdParty = true
	}
	result, err := d.de.GetReportList(ctx, req)
	if err != nil {
		return nil, err
	}
	formViewIds := make([]string, 0)
	for _, report := range result.Entries {
		formViewIds = append(formViewIds, report.TableId)
	}
	resp.TotalCount = result.TotalCount
	ids := strings.Join(formViewIds, ",")
	// 根据报告table_ids获取逻辑视图相关信息
	formViews, err := d.dv.GetList(ctx, &dv.GetListReq{FormViewIdsString: ids})
	if err != nil {
		return nil, err
	}
	// 查看工单表有没有关联该视图，有则状态为已发起整改
	workOrders, err := d.repo.GetListbySourceIDs(ctx, formViewIds)
	if err != nil {
		return nil, err
	}
	workOrderMap := make(map[string]int)
	for _, workOrder := range workOrders {
		if _, exist := workOrderMap[workOrder.SourceID]; !exist && workOrder.Status != domain.WorkOrderStatusFinished.Integer.Int32() {
			workOrderMap[workOrder.SourceID] = 1
		}
	}
	reportInfos := make([]*data_quality.ReportInfo, 0)
	for _, report := range result.Entries {
		reportInfo := &data_quality.ReportInfo{
			FormViewID:    report.TableId,
			ReportID:      report.TaskId,
			ReportVersion: report.Version,
			ReportAt:      report.FinishedAt,
		}
		for _, formView := range formViews {
			if report.TableId == formView.ID {
				reportInfo.UniformCatalogCode = formView.UniformCatalogCode
				reportInfo.TechnicalName = formView.TechnicalName
				reportInfo.BusinessName = formView.BusinessName
				reportInfo.Type = formView.Type
				reportInfo.DatasourceId = formView.DatasourceId
				reportInfo.Datasource = formView.Datasource
				reportInfo.DatasourceType = formView.DatasourceType
				reportInfo.DatasourceCatalogName = formView.DatasourceCatalogName
				reportInfo.DepartmentID = formView.DepartmentID
				reportInfo.Department = formView.Department
				reportInfo.DepartmentPath = formView.DepartmentPath
				reportInfo.OwnerID = formView.OwnerID
				reportInfo.Owner = formView.Owner
				_, exist := workOrderMap[formView.ID]
				if exist {
					reportInfo.Status = data_quality.ImprovementStatusAdded.String
				} else {
					reportInfo.Status = data_quality.ImprovementStatusNotAdd.String
				}
				reportInfos = append(reportInfos, reportInfo)
			}
		}
	}
	resp.Entries = reportInfos
	return resp, nil
}

func (d *dataQualityUseCase) Improvement(ctx context.Context, query *data_quality.ImprovementReq) (*data_quality.ImprovementResp, error) {
	resp := &data_quality.ImprovementResp{}
	workOrder, err := d.repo.GetById(ctx, query.WorkOrderId)
	if err != nil {
		return nil, err
	}
	if workOrder.Type != domain.WorkOrderTypeDataQuality.Integer.Int32() && workOrder.SourceID == "" {
		return nil, errorcode.Desc(errorcode.WorkOrderIdNotExistError)
	}
	beforeInfos := make([]*domain.ImprovementInfo, 0)
	afterInfos := make([]*domain.ImprovementInfo, 0)
	if workOrder.ReportAt != nil {
		resp.BeforeReportAt = workOrder.ReportAt.UnixMilli()
	}
	rules, err := d.improvementRepo.GetByWorkOrderId(ctx, query.WorkOrderId)
	if err != nil {
		return nil, err
	}
	FieldsRes, err := d.dvDriven.GetDataViewField(ctx, workOrder.SourceID)
	if err != nil {
		return nil, err
	}
	fieldInfoMap := make(map[string]*data_quality.FieldInfo)
	for _, field := range FieldsRes.FieldsRes {
		fieldInfo := &data_quality.FieldInfo{
			ID:            field.ID,
			TechnicalName: field.TechnicalName,
			BusinessName:  field.BusinessName,
			DataType:      field.DataType,
		}
		fieldInfoMap[field.ID] = fieldInfo
	}
	// 获取最新的报告
	var thirdParty bool
	cfg := &settings.ConfigInstance.Callback
	if cfg.Enabled {
		thirdParty = true
	}
	report, err := d.dvDriven.GetExploreReport(ctx, workOrder.SourceID, thirdParty)
	if err != nil {
		return nil, err
	}

	newRuleMap := make(map[string]*data_view.RuleResult)
	if report.ExploreTime > resp.BeforeReportAt {
		resp.AfterReportAt = report.ExploreTime
		for _, fieldRule := range report.ExploreFieldDetails {
			for _, rule := range fieldRule.Details {
				newRuleMap[rule.RuleId] = rule
			}
		}
	}

	for _, rule := range rules {
		improvementInfo := &domain.ImprovementInfo{
			FieldId:        rule.FieldID,
			RuleId:         rule.RuleID,
			RuleName:       rule.RuleName,
			Dimension:      rule.Dimension,
			InspectedCount: rule.InspectedCount,
			IssueCount:     rule.IssueCount,
			Score:          rule.Score,
		}
		if _, exist := fieldInfoMap[rule.FieldID]; exist {
			improvementInfo.FieldTechnicalName = fieldInfoMap[rule.FieldID].TechnicalName
			improvementInfo.FieldBusinessName = fieldInfoMap[rule.FieldID].BusinessName
			improvementInfo.FieldType = fieldInfoMap[rule.FieldID].DataType
		}
		beforeInfos = append(beforeInfos, improvementInfo)
		if ruleInfo, exist := newRuleMap[rule.RuleID]; exist {
			newImprovementInfo := &domain.ImprovementInfo{
				FieldId:        rule.FieldID,
				RuleId:         ruleInfo.RuleId,
				RuleName:       ruleInfo.RuleName,
				Dimension:      ruleInfo.Dimension,
				InspectedCount: ruleInfo.InspectedCount,
				IssueCount:     ruleInfo.IssueCount,
			}
			switch rule.Dimension {
			case data_quality.DimensionCompleteness.String:
				newImprovementInfo.Score = *ruleInfo.CompletenessScore
			case data_quality.DimensionStandardization.String:
				newImprovementInfo.Score = *ruleInfo.StandardizationScore
			case data_quality.DimensionUniqueness.String:
				newImprovementInfo.Score = *ruleInfo.UniquenessScore
			case data_quality.DimensionAccuracy.String:
				newImprovementInfo.Score = *ruleInfo.AccuracyScore
			}
			afterInfos = append(afterInfos, newImprovementInfo)
		}
	}
	resp.Before = beforeInfos
	resp.After = afterInfos
	return resp, nil
}

func (d *dataQualityUseCase) QueryStatus(ctx context.Context, query *data_quality.DataQualityStatusReq) (*data_quality.DataQualityStatusResp, error) {
	resp := &data_quality.DataQualityStatusResp{}
	// 查看工单表有没有关联该视图，有则状态为已发起整改
	formViewIds := strings.Split(query.FormViewIDS, ",")
	workOrders, err := d.repo.GetListbySourceIDs(ctx, formViewIds)
	if err != nil {
		return nil, err
	}
	workOrderMap := make(map[string]*model.WorkOrder)
	for _, workOrder := range workOrders {
		if _, exist := workOrderMap[workOrder.SourceID]; !exist && workOrder.Status != domain.WorkOrderStatusFinished.Integer.Int32() {
			workOrderMap[workOrder.SourceID] = workOrder
		}
	}
	statusInfos := make([]*data_quality.DataQualityStatusInfo, 0)
	for _, formViewId := range formViewIds {
		statusInfo := &data_quality.DataQualityStatusInfo{
			FormViewID: formViewId,
		}
		workOrder, exist := workOrderMap[formViewId]
		if exist {
			statusInfo.WorkOrderID = workOrder.WorkOrderID
			statusInfo.WorkOrderName = workOrder.Name
			statusInfo.Status = data_quality.ImprovementStatusAdded.String
		} else {
			statusInfo.Status = data_quality.ImprovementStatusNotAdd.String
		}
		statusInfos = append(statusInfos, statusInfo)
	}
	resp.Entries = statusInfos
	resp.TotalCount = int64(len(statusInfos))
	return resp, nil
}

func (d *dataQualityUseCase) ReceiveQualityReport(ctx context.Context, req *data_quality.ReceiveQualityReportReq) error {
	// 1. 根据数据源ID和表名查询获取表信息
	viewReq := &dv.GetViewByTechnicalNameAndHuaAoIdReq{
		TechnicalName: req.FormName,
		HuaAoID:       req.DataSource,
	}

	viewResp, err := d.dv.GetViewByTechnicalNameAndHuaAoId(ctx, viewReq)
	if err != nil {
		log.WithContext(ctx).Error("Failed to get view by technical name and hua ao id",
			zap.Error(err),
			zap.String("technical_name", req.FormName),
			zap.String("hua_ao_id", req.DataSource))
		return errorcode.Detail(errorcode.WorkOrderDatabaseError, "Failed to get table information: "+err.Error())
	}

	if viewResp == nil {
		log.WithContext(ctx).Error("View not found",
			zap.String("technical_name", req.FormName),
			zap.String("hua_ao_id", req.DataSource))
		return errorcode.Detail(errorcode.WorkOrderIdNotExistError, "Table not found")
	}

	// 2. 构造增强后的质量报告数据
	enhancedReq := &data_quality.ReceiveQualityReportReq{
		DataSource:  req.DataSource,
		FinishedAt:  req.FinishedAt,
		FormName:    req.FormName,
		TableID:     viewResp.FormViewID, // 使用查询到的FormViewID作为TableID
		InstanceID:  req.InstanceID,
		WorkOrderID: req.WorkOrderID,
		TenantID:    req.TenantID,
		Rules:       make([]data_quality.RuleInfo, 0, len(req.Rules)),
	}

	// 创建字段名到字段ID的映射
	fieldNameToIDMap := make(map[string]string)
	for _, field := range viewResp.Fields {
		fieldNameToIDMap[field.TechnicalName] = field.ID
	}

	// 为每个规则补充字段ID
	for _, rule := range req.Rules {
		enhancedRule := data_quality.RuleInfo{
			FieldName:      rule.FieldName,
			InspectedCount: rule.InspectedCount,
			IssueCount:     rule.IssueCount,
			RuleID:         rule.RuleID,
			RuleName:       rule.RuleName,
			FieldID:        rule.FieldID, // 保留原有的FieldID
		}

		// 如果原始请求中没有FieldID，尝试根据字段名查找
		if enhancedRule.FieldID == "" {
			if fieldID, exists := fieldNameToIDMap[rule.FieldName]; exists {
				enhancedRule.FieldID = fieldID
			} else {
				log.WithContext(ctx).Warn("Field ID not found for field",
					zap.String("field_name", rule.FieldName),
					zap.String("table_id", viewResp.FormViewID))
			}
		}

		enhancedReq.Rules = append(enhancedReq.Rules, enhancedRule)
	}

	// 3. 发送到Kafka消息队列
	messageValue, err := json.Marshal(enhancedReq)
	if err != nil {
		log.WithContext(ctx).Error("Failed to marshal quality report message",
			zap.Error(err),
			zap.String("work_order_id", req.WorkOrderID))
		return errorcode.Detail(errorcode.WorkOrderInvalidParameter, "Failed to serialize quality report: "+err.Error())
	}

	// 使用常量定义的质量报告Kafka Topic
	err = d.producer.Send(constant.TopicAFTaskCenterV1QualityReports, messageValue)
	if err != nil {
		log.WithContext(ctx).Error("Failed to send quality report to Kafka",
			zap.Error(err),
			zap.String("topic", constant.TopicAFTaskCenterV1QualityReports),
			zap.String("work_order_id", req.WorkOrderID),
			zap.String("table_id", enhancedReq.TableID))
		return errorcode.Detail(errorcode.WorkOrderDatabaseError, "Failed to send message to queue: "+err.Error())
	}

	log.WithContext(ctx).Info("Successfully sent quality report to Kafka",
		zap.String("topic", constant.TopicAFTaskCenterV1QualityReports),
		zap.String("work_order_id", req.WorkOrderID),
		zap.String("table_id", enhancedReq.TableID),
		zap.String("form_name", req.FormName),
		zap.Int("rules_count", len(enhancedReq.Rules)))

	return nil
}
