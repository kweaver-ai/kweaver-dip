package impl

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/data_exploration"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_aggregation_resource"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/database/af_configuration"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/database/af_main"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/quality_audit_model"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_flow_info"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_project"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order/scope"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order_extend"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	callback_task_center_v1 "github.com/kweaver-ai/idrm-go-common/callback/task_center/v1"
	"github.com/kweaver-ai/idrm-go-common/rest/data_view"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// WorkOrderCallback 负责聚合查询工单相关信息，调用回调接口
type WorkOrderCallback struct {
	// 是否启用第三方回调
	CallbackEnabled bool
	// 第三方的回调客户端
	Client callback_task_center_v1.WorkOrderCallbackServiceClient
	// 数据库表 af_main.form_view
	FormView af_main.FormViewInterface
	// 数据库表 af_configuration.datasource
	// 数据库表 af_tasks.data_aggregation_resources
	DataAggregationResources data_aggregation_resource.Interface
	// 数据库表 af_tasks.work_order
	workOrder work_order.Repo
	// 数据库表 af_tasks.t_fusion_field
	workOrderExtendRepo work_order_extend.WorkOrderExtendRepo
	// WorkOrder其他模块依赖
	workOrderDomain domain.WorkOrderDomainInterface
	// 数据库表 af_tasks.t_quality_audit_form_view_relation
	qualityAuditRelation quality_audit_model.QualityAuditModelRepo
	dataView             data_view.Driven
	dataExplore          data_exploration.DataExploration
	// 数据表 af_configuration.datasource
	Datasource af_configuration.DatasourceInterface
	// 数据表 af_configuration.user
	User af_configuration.UserInterface

	// Repo 项目
	project tc_project.Repo
	// Repo 运营流程
	flowInfo tc_flow_info.Repo
	ccDriven configuration_center.Driven
}

// OnApproved 工单被批准时的回调
func (c *WorkOrderCallback) OnApproved(ctx context.Context, order *model.WorkOrder) error {
	log.Info("DEBUG.WorkOrderCallback.OnApproved", zap.Any("order", order), zap.Bool("c.CallbackEnabled", c.CallbackEnabled))
	// 如果工单来源类型是项目，检查所在流程节点是否开启
	if order.SourceType == domain.WorkOrderSourceTypeProject.Integer.Int32() {
		// 获取工单所属项目
		p, err := c.project.Get(ctx, order.SourceID)
		if err != nil {
			return err
		}
		log.Debug("work order's project", zap.Any("project", p))
		// 获取工单所属项目流程节点
		n, err := c.flowInfo.GetById(ctx, p.FlowID, p.FlowVersion, order.NodeID)
		if err != nil {
			return err
		}
		log.Debug("work order's project flow node", zap.Any("node", n))
		// 检查节点是否可执行
		got, err := c.project.NodeExecutable(ctx, nil, p.ID, n)
		if err != nil {
			return err
		}
		if got != constant.TaskExecuteStatusExecutable.Integer.Int8() {
			return fmt.Errorf("project node %q is not executable", order.NodeID)
		}
	}

	// 根据工单类型判断是否需要同步到第三方
	if domain.SynchronizedWorkOrderTypes_Int32.Has(order.Type) {
		if !c.CallbackEnabled && order.Type != domain.WorkOrderTypeDataQualityAudit.Integer.Int32() {
			return errorcode.Desc(errorcode.WorkOrderSyncDisabled)
		}

		// 同步到第三方
		if err := c.Sync(ctx, order); err != nil {
			return err
		}

		// 记录工单已经同步到第三方
		log.Info("mark work order as synced", zap.String("id", order.WorkOrderID))
		if err := c.workOrder.MarkAsSynced(ctx, order.WorkOrderID); err != nil {
			return err
		}
		order.Synced = true
	}

	// 变更工单状态为执行中
	log.Info("update work order status to ongoing", zap.String("id", order.WorkOrderID))
	if err := c.workOrder.UpdateStatus(ctx, order.WorkOrderID, domain.WorkOrderStatusOngoing.Integer.Int32()); err != nil {
		return err
	}
	order.Status = domain.WorkOrderStatusOngoing.Integer.Int32()

	return nil
}

// sync 同步工单到三方
func (c *WorkOrderCallback) Sync(ctx context.Context, workOrder *model.WorkOrder) error {
	deadline, ok := ctx.Deadline()
	if ok {
		log.Info("====Context 截止时间:==", zap.Any("deadline", deadline))
		log.Info("====Context 剩余时间:==", zap.Any("deadline", time.Until(deadline)))
	} else {
		log.Info("===Context 没有设置截止时间==")
	}

	if workOrder.Type == domain.WorkOrderTypeDataQualityAudit.Integer.Int32() {
		thirdParty, err := c.ccDriven.GetThirdPartySwitch(ctx)
		if err != nil {
			return err
		}
		if !thirdParty {
			return c.DataQualityAudit(ctx, workOrder)
		}
	}

	// 生成回调事件
	event, err := c.aggregateCallbackWorkOrderApprovedEvent(ctx, workOrder)
	if err != nil {
		return err
	}
	newCtx := context.Background()
	// 调用回调接口
	log.Info("====invoke callback OnApproved", zap.Any("event", event))

	r, err := c.Client.OnApproved(newCtx, event)
	if err != nil {
		log.Error("invoke callback OnApproved err", zap.Error(err))
		return err
	}
	log.Info("invoke callback OnApproved, code", zap.Any("Sync", r.Errcode))
	log.Info("invoke callback OnApproved, msg:", zap.Any("Sync", r.Errmsg))
	if r.Errcode != "0" {
		return fmt.Errorf("invoke callback OnApproved error,Errcode: %s,  Errmsg: %s", r.Errcode, r.Errmsg)
	}
	return nil
}

// OnApprovedForID 工单被批准时的回调
func (c *WorkOrderCallback) OnApprovedForSonyflakeID(ctx context.Context, id uint64) error {
	order, err := c.workOrder.GetBySonyflakeID(ctx, id)
	if err != nil {
		return err
	}
	return c.OnApproved(ctx, order)
}

// OnApprovedForWorkOrderID OnApprovedForWorkOrderID 工单被批准时的回调
func (c *WorkOrderCallback) OnApprovedForWorkOrderID(ctx context.Context, id string) error {
	order, err := c.workOrder.GetById(ctx, id)
	if err != nil {
		return err
	}
	return c.OnApproved(ctx, order)
}

// aggregateCallbackWorkOrderApprovedEvent 聚合查询工单相关数据，生成回调事件：工单通过审批
func (c *WorkOrderCallback) aggregateCallbackWorkOrderApprovedEvent(ctx context.Context, workOrder *model.WorkOrder) (event *callback_task_center_v1.WorkOrderApprovedEvent, err error) {
	event = convert_Model_WorkOrder_To_GRPCTaskCenterV1_WorkOrderApprovedEvent(ctx, c.User, workOrder)
	switch event.Type {
	// 数据归集
	case domain.WorkOrderTypeDataAggregation.String:
		event.Detail, err = c.aggregateCallbackWorkOrderApprovedEventDetailForDataAggregation(ctx, workOrder)
	// 数据理解
	case domain.WorkOrderTypeDataComprehension.String:
		err = errors.New("unimplemented")
	// 数据融合
	case domain.WorkOrderTypeDataFusion.String:
		event.Detail, err = c.aggregateCallbackWorkOrderApprovedEventDetailForDataFusion(ctx, workOrder)
	// 数据质量
	case domain.WorkOrderTypeDataQuality.String:
		err = errors.New("unimplemented")
	// 数据质量稽核
	case domain.WorkOrderTypeDataQualityAudit.String:
		event.Detail, err = c.aggregateCallbackWorkOrderApprovedEventDetailForDataQualityAudit(ctx, workOrder)
	// 数据标准化
	case domain.WorkOrderTypeStandardization.String:
		log.Warn("unimplemented")
	default:
		err = fmt.Errorf("unsupported work order type: %v", event.Type)
	}
	if err != nil {
		event = nil
	}
	return
}

// aggregateCallbackWorkOrderApprovedEventDetailForDataAggregation 返回回调事件的数据归集工单详情
func (c *WorkOrderCallback) aggregateCallbackWorkOrderApprovedEventDetailForDataAggregation(ctx context.Context, workOrder *model.WorkOrder) (detail *callback_task_center_v1.WorkOrderApprovedEvent_DataAggregation, err error) {
	// 工单关联的归集资源列表
	var resources []model.DataAggregationResource
	// 根据工单来源类型获取归集资源列表
	switch workOrder.SourceType {
	// 无、归集计划：根据归集清单 ID 查询归集资源
	case domain.WorkOrderSourceTypeStandalone.Integer.Int32(), domain.WorkOrderSourceTypePlan.Integer.Int32(), domain.WorkOrderSourceTypeSupplyAndDemand.Integer.Int32():
		resources, err = c.DataAggregationResources.ListByDataAggregationInventoryID(ctx, workOrder.DataAggregationInventoryID)
	// 业务表：根据工单 ID 查询归集资源
	case domain.WorkOrderSourceTypeBusinessForm.Integer.Int32():
		resources, err = c.DataAggregationResources.ListByWorkOrderID(ctx, workOrder.WorkOrderID)
	// 项目：来源是项目的归集工单，可能关联清单、也可能关联业务表
	case domain.WorkOrderSourceTypeProject.Integer.Int32():
		if workOrder.DataAggregationInventoryID != "" {
			// 归集工单关联归集清单
			resources, err = c.DataAggregationResources.ListByDataAggregationInventoryID(ctx, workOrder.DataAggregationInventoryID)
		} else {
			// 归集工单关联业务表
			resources, err = c.DataAggregationResources.ListByWorkOrderID(ctx, workOrder.WorkOrderID)
		}
	default:
		err = fmt.Errorf("unsupported source type for data aggregation work order: %v", workOrder.SourceType)
	}
	if err != nil {
		return nil, err
	}

	detail = &callback_task_center_v1.WorkOrderApprovedEvent_DataAggregation{
		DataAggregation: new(callback_task_center_v1.DataAggregationDetail),
	}

	err = c.aggregate_Slice_model_DataAggregationResources_To_Slice_callbackTaskCenterV1_DataAggregationResource(ctx, &resources, &detail.DataAggregation.Resources)
	return
}

func (c *WorkOrderCallback) aggregate_model_DataAggregationResources_To_Pointer_callbackTaskCenterV1_DataAggregationResource(ctx context.Context, in *model.DataAggregationResource, out **callback_task_center_v1.DataAggregationResource) error {
	var outV = new(callback_task_center_v1.DataAggregationResource)
	// 源表
	{
		v, err := c.FormView.Get(ctx, in.DataViewID)
		if err != nil {
			return err
		}
		s, err := c.Datasource.Get(ctx, v.DatasourceID)
		if err != nil {
			return err
		}
		outV.Source = &callback_task_center_v1.DataAggregationTableReference{
			DatasourceID: s.HuaAoId,
			TableName:    v.OriginalName,
		}
	}
	// 目标表
	{
		s, err := c.Datasource.Get(ctx, in.TargetDatasourceID)
		if err != nil {
			return err
		}
		outV.Target = &callback_task_center_v1.DataAggregationTableReference{
			DatasourceID: s.HuaAoId,
		}
	}
	// 采集方式
	if err := convert_model_DataAggregationResourceCollectionMethod_To_string(&in.CollectionMethod, &outV.CollectionMethod); err != nil {
		return err
	}
	// 同步频率
	if err := convert_model_DataAggregationResourceSyncFrequency_To_string(&in.SyncFrequency, &outV.SyncFrequency); err != nil {
		return err
	}

	*out = outV
	return nil
}

func (c *WorkOrderCallback) aggregate_Slice_model_DataAggregationResources_To_Slice_callbackTaskCenterV1_DataAggregationResource(ctx context.Context, in *[]model.DataAggregationResource, out *[]*callback_task_center_v1.DataAggregationResource) error {
	*out = make([]*callback_task_center_v1.DataAggregationResource, len(*in))
	for i := range *in {
		if err := c.aggregate_model_DataAggregationResources_To_Pointer_callbackTaskCenterV1_DataAggregationResource(ctx, &(*in)[i], &(*out)[i]); err != nil {
			return err
		}
	}
	return nil
}

// aggregateCallbackWorkOrderApprovedEventDetailForDataFusion 返回回调事件的数据融合工单详情
func (c *WorkOrderCallback) aggregateCallbackWorkOrderApprovedEventDetailForDataFusion(ctx context.Context, workOrder *model.WorkOrder) (detail *callback_task_center_v1.WorkOrderApprovedEvent_DataFusion, err error) {

	nameModel, err := c.workOrderExtendRepo.GetByWorkOrderIdAndExtendKey(ctx, workOrder.WorkOrderID, string(constant.FusionTableName))
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	fields := make([]*callback_task_center_v1.FusionField, 0)
	if nameModel.ExtendValue != "" {
		// 获取融合工单关联的融合表字段
		FusionFieldList, err := c.workOrderDomain.FusionFieldList(ctx, workOrder.WorkOrderID)
		if err != nil {
			return nil, err
		}
		for _, f := range FusionFieldList {
			fields = append(fields, &callback_task_center_v1.FusionField{
				CName:             f.CName,
				EName:             f.EName,
				StandardId:        f.StandardID,
				CodeTableId:       f.CodeTableID,
				CodeRuleId:        f.CodeRuleID,
				DataRange:         f.DataRange,
				DataType:          intToInt32Ptr(f.DataType),
				DataLength:        intPtrToInt32Ptr(f.DataLength),
				DataAccuracy:      intPtrToInt32Ptr(f.DataAccuracy),
				PrimaryKey:        f.PrimaryKey,
				IsRequired:        f.IsRequired,
				IsIncrement:       f.IsIncrement,
				IsStandard:        f.IsStandard,
				FieldRelationship: f.FieldRelationship,
				CatalogId:         f.CatalogID,
				InfoItemId:        f.InfoItemID,
				Index:             intToInt32Ptr(f.Index),
			})
		}
	}

	detail = &callback_task_center_v1.WorkOrderApprovedEvent_DataFusion{
		DataFusion: &callback_task_center_v1.DataFusionDetail{
			TableName:       nameModel.ExtendValue,
			FusionType:      nameModel.FusionType,
			ExecSql:         nameModel.ExecSQL,
			RunCronStrategy: nameModel.RunCronStrategy,
			Fields:          fields,
		},
	}
	if nameModel.RunStartAt != nil {
		detail.DataFusion.RunStartAt = nameModel.RunStartAt.Format(constant.CommonTimeFormat)
	}
	if nameModel.RunEndAt != nil {
		detail.DataFusion.RunEndAt = nameModel.RunEndAt.Format(constant.CommonTimeFormat)
	}
	if nameModel.DataSourceID != "" {
		if s, err := c.Datasource.Get(ctx, nameModel.DataSourceID); err != nil {
			log.Warn("aggregateCallbackWorkOrderApprovedEventDetailForDataFusion get datasource fail", zap.Error(err), zap.String("id", nameModel.DataSourceID))
		} else {
			detail.DataFusion.DatasourceName = s.DatabaseName
			detail.DataFusion.DatasourceId = s.HuaAoId
			detail.DataFusion.DatasourceType = s.TypeName
		}
	}
	return
}

func intToInt32Ptr(value int) *int32 {
	temp := int32(value)
	return &temp
}
func intPtrToInt32Ptr(value *int) *int32 {
	if value == nil {
		return nil
	}
	// 检查值是否在 int32 范围内
	if *value < -2147483648 || *value > 2147483647 {
		return nil // 或者你可以选择返回一个错误
	}
	int32Value := int32(*value)
	return &int32Value
}

// aggregateCallbackWorkOrderApprovedEventDetailForDataQualityAudit 返回回调事件质量稽核工单详情
func (c *WorkOrderCallback) aggregateCallbackWorkOrderApprovedEventDetailForDataQualityAudit(ctx context.Context, workOrder *model.WorkOrder) (detail *callback_task_center_v1.WorkOrderApprovedEvent_DataQualityAudit, err error) {
	// 工单关联的归集资源列表
	var formViewIds []string
	formViewIds, err = c.qualityAuditRelation.GetViewIds(ctx, workOrder.WorkOrderID)
	if err != nil {
		return nil, err
	}
	// 获取逻辑视图探查规则
	resources, err := c.getResource(ctx, formViewIds, workOrder.WorkOrderID)
	if err != nil {
		return nil, err
	}
	if len(resources) == 0 {
		log.WithContext(ctx).Infof("未配置字段级的探查规则")
		return nil, nil
	}
	detail = &callback_task_center_v1.WorkOrderApprovedEvent_DataQualityAudit{
		DataQualityAudit: &callback_task_center_v1.DataQualityAuditDetail{
			Resources: resources,
		},
	}
	return
}

func (c *WorkOrderCallback) getResource(ctx context.Context, formViewIds []string, workOrderId string) ([]*callback_task_center_v1.DataQualityRuleResource, error) {
	resources := make([]*callback_task_center_v1.DataQualityRuleResource, 0)
	for _, formViewId := range formViewIds {
		req := &data_view.GetRuleListReq{
			FormViewId: formViewId,
			RuleLevel:  "field",
			Enable:     true,
		}
		rules, err := c.dataView.GetExploreRule(ctx, req)
		if err != nil {
			return nil, err
		}
		// 获取字段信息
		fieldsRes, err := c.dataView.GetViewField(ctx, formViewId)
		if err != nil {
			return nil, err
		}
		fieldInfoMap := make(map[string]string)
		for _, field := range fieldsRes.FieldsRes {
			fieldInfoMap[field.ID] = field.OriginalName
		}

		// 获取逻辑视图
		view, err := c.FormView.Get(ctx, formViewId)
		if err != nil {
			return nil, err
		}
		datasource, err := c.Datasource.Get(ctx, view.DatasourceID)
		if err != nil {
			return nil, err
		}
		exploreConfig := getExploreConfig(view, datasource, workOrderId)
		fieldMap := make(map[string]int)
		for _, rule := range rules {
			// 忽略数据统计探查
			if rule.Dimension == "data_statistics" {
				continue
			}
			// 华傲不支持码值检查，忽略
			if rule.RuleName == "码值检查" || rule.DimensionType == "dict" {
				continue
			}
			if _, exist := fieldMap[rule.FieldId]; !exist {
				fieldMap[rule.FieldId] = 1
			}
			resource := &callback_task_center_v1.DataQualityRuleResource{
				FormViewName:    view.OriginalName,
				FieldName:       fieldInfoMap[rule.FieldId],
				RuleId:          rule.RuleId,
				RuleName:        rule.RuleName,
				Dimension:       rule.Dimension,
				DimensionType:   rule.DimensionType,
				RuleDescription: rule.RuleDescription,
				DataSourceId:    datasource.HuaAoId,
			}
			if rule.RuleConfig != nil {
				res := &domain.RuleConfig{}
				err = json.Unmarshal([]byte(*rule.RuleConfig), res)
				if err != nil {
					log.WithContext(ctx).Errorf("解析探查规则配置失败，err is %v", err)
					return nil, errorcode.Detail(errorcode.WorkOrderInvalidParameterJson, "规则配置错误")
				}
				resource.RuleConfig = *rule.RuleConfig
				if res.RuleExpression != nil {
					var ruleExpressionSql string
					// 自定义规则，配置为过滤条件时，转sql
					if res.RuleExpression.Where != nil {
						ruleExpressionSql, err = getWhereSQL(res.RuleExpression.Where, res.RuleExpression.WhereRelation)
						res.RuleExpression.Sql = ruleExpressionSql
						bs, _ := json.Marshal(res)
						resource.RuleConfig = string(bs)
					}
				}
			}
			resources = append(resources, resource)
		}
		exploreConfig.FieldExplore = getFieldConfig(fieldInfoMap, rules, fieldMap)
		_, err = c.dataExplore.CreateThirdPartyTaskConfig(ctx, exploreConfig)
		if err != nil {
			log.WithContext(ctx).Infof("保存质量检测配置失败")
		}
		log.Info("CreateThirdPartyTaskConfig", zap.Any("config", exploreConfig))
	}
	return resources, nil
}

func getExploreConfig(view *af_main.FormView, datasource *af_configuration.Datasource, workOrderId string) *data_exploration.ThirdPartyTaskConfigReq {
	taskConfig := &data_exploration.ThirdPartyTaskConfigReq{
		TaskName:     fmt.Sprintf("%s(%s)", view.TechnicalName, view.ID),
		TableId:      view.ID,
		Table:        view.TechnicalName,
		Schema:       "default",
		VeCatalog:    fmt.Sprintf("vdm_%s", datasource.CatalogName),
		FieldExplore: nil,
		ExploreType:  1,
		TotalSample:  0,
		TaskEnabled:  1,
		WorkOrderId:  workOrderId,
	}
	return taskConfig
}

func getFieldConfig(fieldInfoMap map[string]string, rules []*data_view.GetRuleResp, fieldMap map[string]int) []*data_exploration.ExploreField {
	fieldConfigs := make([]*data_exploration.ExploreField, 0)
	for id, _ := range fieldMap {
		fieldRules := make([]*data_exploration.Projects, 0)
		for _, rule := range rules {
			if rule.FieldId == id {
				filedRule := &data_exploration.Projects{
					RuleId:          rule.RuleId,
					RuleName:        rule.RuleName,
					RuleDescription: rule.RuleDescription,
					RuleConfig:      rule.RuleConfig,
					Dimension:       rule.Dimension,
					DimensionType:   rule.DimensionType,
				}
				fieldRules = append(fieldRules, filedRule)
			}
		}
		if len(fieldRules) > 0 {
			fieldConfig := &data_exploration.ExploreField{FieldId: id, FieldName: fieldInfoMap[id], Projects: fieldRules}
			fieldConfigs = append(fieldConfigs, fieldConfig)
		}
	}
	return fieldConfigs
}

func getWhereSQL(where []*domain.Where, whereRelation string) (whereSQL string, err error) {
	var whereArgs []string
	for _, v := range where {
		var wherePreGroupFormat string
		for _, vv := range v.Member {
			var opAndValueSQL string
			opAndValueSQL, err = whereOPAndValueFormat(vv.NameEn, vv.Operator, vv.Value, constant.DataType2string(vv.DataType))
			if err != nil {
				return
			}
			if wherePreGroupFormat != "" {
				wherePreGroupFormat = wherePreGroupFormat + " " + v.Relation + " " + opAndValueSQL
			} else {
				wherePreGroupFormat = opAndValueSQL
			}
		}
		wherePreGroupFormat = "(" + wherePreGroupFormat + ")"
		whereArgs = append(whereArgs, wherePreGroupFormat)

	}
	if whereRelation != "" {
		whereRelation = fmt.Sprintf(` %s `, whereRelation)
	} else {
		whereRelation = " AND "
	}
	whereSQL = strings.Join(whereArgs, whereRelation)
	return
}

func whereOPAndValueFormat(name, op, value, dataType string) (whereBackendSql string, err error) {
	special := strings.NewReplacer(`\`, `\\\\`, `'`, `\'`, `%`, `\%`, `_`, `\_`)
	switch op {
	case "<", "<=", ">", ">=":
		if _, err = strconv.ParseFloat(value, 64); err != nil {
			return whereBackendSql, errorcode.Desc(errorcode.WorkOrderInvalidParameter)
		}
		whereBackendSql = fmt.Sprintf(`"%s" %s %s`, name, op, value)
	case "=", "<>":
		if dataType == constant.DataTypeInt.String || dataType == constant.DataTypeFloat.String || dataType == constant.DataTypeDecimal.String {
			if _, err = strconv.ParseFloat(value, 64); err != nil {
				return whereBackendSql, errorcode.Desc(errorcode.WorkOrderInvalidParameter)
			}
			whereBackendSql = fmt.Sprintf(`"%s" %s %s`, name, op, value)
		} else if dataType == constant.DataTypeChar.String {
			whereBackendSql = fmt.Sprintf(`"%s" %s '%s'`, name, op, value)
		} else {
			return "", errorcode.Desc(errorcode.WhereOpNotAllowed)
		}

	case "=dict":
		if dataType == constant.DataTypeInt.String || dataType == constant.DataTypeFloat.String || dataType == constant.DataTypeDecimal.String {
			if _, err = strconv.ParseFloat(value, 64); err != nil {
				return whereBackendSql, errorcode.Desc(errorcode.WorkOrderInvalidParameter)
			}
			whereBackendSql = fmt.Sprintf(`"%s" %s %s`, name, "=", value)
		} else if dataType == constant.DataTypeChar.String {
			whereBackendSql = fmt.Sprintf(`"%s" %s '%s'`, name, "=", value)
		} else {
			return "", errorcode.Desc(errorcode.WhereOpNotAllowed)
		}
	case "<>dict":
		if dataType == constant.DataTypeInt.String || dataType == constant.DataTypeFloat.String || dataType == constant.DataTypeDecimal.String {
			if _, err = strconv.ParseFloat(value, 64); err != nil {
				return whereBackendSql, errorcode.Desc(errorcode.WorkOrderInvalidParameter)
			}
			whereBackendSql = fmt.Sprintf(`"%s" %s %s`, name, "<>", value)
		} else if dataType == constant.DataTypeChar.String {
			whereBackendSql = fmt.Sprintf(`"%s" %s '%s'`, name, "<>", value)
		} else {
			return "", errorcode.Desc(errorcode.WhereOpNotAllowed)
		}

	case "null":
		whereBackendSql = fmt.Sprintf(`"%s" IS NULL`, name)
	case "not null":
		whereBackendSql = fmt.Sprintf(`"%s" IS NOT NULL`, name)
	case "include":
		if dataType == constant.DataTypeChar.String {
			value = special.Replace(value)
			whereBackendSql = fmt.Sprintf(`"%s" LIKE '%s'`, name, "%"+value+"%")
		} else {
			return "", errorcode.Desc(errorcode.WhereOpNotAllowed)
		}
	case "not include":
		if dataType == constant.DataTypeChar.String {
			value = special.Replace(value)
			whereBackendSql = fmt.Sprintf(`"%s" NOT LIKE '%s'`, name, "%"+value+"%")
		} else {
			return "", errorcode.Desc(errorcode.WhereOpNotAllowed)
		}
	case "prefix":
		if dataType == constant.DataTypeChar.String {
			value = special.Replace(value)
			whereBackendSql = fmt.Sprintf(`"%s" LIKE '%s'`, name, value+"%")
		} else {
			return "", errorcode.Desc(errorcode.WhereOpNotAllowed)
		}
	case "not prefix":
		if dataType == constant.DataTypeChar.String {
			value = special.Replace(value)
			whereBackendSql = fmt.Sprintf(`"%s" NOT LIKE '%s'`, name, value+"%")
		} else {
			return "", errorcode.Desc(errorcode.WhereOpNotAllowed)
		}
	case "in list":
		valueList := strings.Split(value, ",")
		for i := range valueList {
			if dataType == constant.DataTypeChar.String {
				valueList[i] = "'" + valueList[i] + "'"
			}
		}
		value = strings.Join(valueList, ",")
		whereBackendSql = fmt.Sprintf(`"%s" IN %s`, name, "("+value+")")
	case "belong":
		valueList := strings.Split(value, ",")
		for i := range valueList {
			if dataType == constant.DataTypeChar.String {
				valueList[i] = "'" + valueList[i] + "'"
			}
		}
		value = strings.Join(valueList, ",")
		whereBackendSql = fmt.Sprintf(`"%s" IN %s`, name, "("+value+")")
	case "true":
		whereBackendSql = fmt.Sprintf(`"%s" = true`, name)
	case "false":
		whereBackendSql = fmt.Sprintf(`"%s" = false`, name)
	case "before":
		valueList := strings.Split(value, " ")
		whereBackendSql = fmt.Sprintf(`"%s" >= DATE_add('%s', -%s, CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai') AND "%s" <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai'`, name, valueList[1], valueList[0], name)
	case "current":
		if value == "%Y" || value == "%Y-%m" || value == "%Y-%m-%d" || value == "%Y-%m-%d %H" || value == "%Y-%m-%d %H:%i" || value == "%x-%v" {
			whereBackendSql = fmt.Sprintf(`DATE_FORMAT("%s", '%s') = DATE_FORMAT(CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai', '%s')`, name, value, value)
		} else {
			return "", errorcode.Desc(errorcode.WhereOpNotAllowed)
		}
	case "between":
		valueList := strings.Split(value, ",")
		whereBackendSql = fmt.Sprintf(`"%s" BETWEEN DATE_TRUNC('minute', CAST('%s' AS TIMESTAMP)) AND DATE_TRUNC('minute', CAST('%s' AS TIMESTAMP))`, name, valueList[0], valueList[1])
	default:
		return "", errorcode.Desc(errorcode.WhereOpNotAllowed)
	}
	return
}

// CallbackOnNodeStart 项目开启的回调函数
func (w *workOrderUseCase) CallbackOnNodeStart(ctx context.Context, tx *gorm.DB, projectID, nodeID string) error {
	workOrders, _, err := w.repo.ListV2(ctx, work_order.ListOptions{Scopes: []func(*gorm.DB) *gorm.DB{
		// 工单的来源类型是项目
		scope.SourceType(domain.WorkOrderSourceTypeProject.Integer.Int32()),
		// 指定的项目 ID
		scope.SourceID(projectID),
		// 指定的节点 ID
		scope.NodeID(nodeID),
	}})
	if err != nil {
		return err
	}
	log.Debug("work orders for project node", zap.String("projectID", projectID), zap.String("nodeID", nodeID), zap.Any("workOrders", workOrders))

	for _, o := range workOrders {
		if err := w.Start(ctx, tx, &o); err != nil {
			// 工单开启失败不阻塞开启项目
			log.Warn("start work order fail", zap.Error(err), zap.Any("workOrder", o))
		}
	}
	return nil
}

func (c *WorkOrderCallback) DataQualityAudit(ctx context.Context, workOrder *model.WorkOrder) error {
	formViewIds, err := c.qualityAuditRelation.GetUnSyncViewIds(ctx, workOrder.WorkOrderID)
	if err != nil {
		return err
	}
	syncFormViews := make([]string, 0)
	if len(formViewIds) > 0 {
		var remark domain.Remark
		if err := json.Unmarshal([]byte(workOrder.Remark), &remark); err != nil {
			return err
		}
		req := &data_view.CreateWorkOrderTaskReq{
			WorkOrderID:  workOrder.WorkOrderID,
			FormViewIDs:  formViewIds,
			CreatedByUID: workOrder.CreatedByUID,
			TotalSample:  remark.TotalSample,
		}
		resp, err := c.dataView.CreateWorkOrderTask(ctx, req)
		if err != nil {
			return err
		}
		for _, result := range resp.Result {
			if result.TaskId != "" {
				syncFormViews = append(syncFormViews, result.FormViewId)
			}
		}
		err = c.qualityAuditRelation.UpdateStatusInBatches(ctx, workOrder.WorkOrderID, syncFormViews)
		if err != nil {
			return err
		}
	}
	if len(formViewIds) > len(syncFormViews) {
		return errorcode.Desc(errorcode.WorkOrderSyncError)
	}
	return nil
}
