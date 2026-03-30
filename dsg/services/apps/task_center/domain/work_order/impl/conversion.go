package impl

import (
	"context"
	"fmt"

	"github.com/go-kratos/kratos/v2/log"
	"github.com/samber/lo"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/database/af_configuration"
	work_order "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order/scope"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/user_util"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	task_center_v1 "github.com/kweaver-ai/idrm-go-common/api/task_center/v1"
	callback_task_center_v1 "github.com/kweaver-ai/idrm-go-common/callback/task_center/v1"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
)

// domain.WorkOrderListCreatedByMeOptions -> work_order.ListOptions
func convert_domain_WorkOrderListCreatedByMeOptions_To_work_order_ListOptions(ctx context.Context, in *domain.WorkOrderListCreatedByMeOptions, out *work_order.ListOptions) (err error) {
	// 排序
	if err = convert_domain_WorkOrderSortOptions_To_work_order_SortOptions(&in.WorkOrderSortOptions, &out.SortOptions); err != nil {
		return
	}
	// 分页
	if err = convert_domain_WorkOrderPaginateOptions_To_work_order_PaginateOptions(&in.WorkOrderPaginateOptions, &out.PaginateOptions); err != nil {
		return
	}
	// 过滤 - 关键字
	if in.Keyword != "" && len(in.Fields) > 0 {
		out.Scopes = append(out.Scopes, scope.Keyword(in.Keyword, in.Fields))
	}
	// 过滤 - 类型
	if in.Type != "" {
		out.Scopes = append(out.Scopes, scope.Type(enum.ToInteger[domain.WorkOrderType](in.Type).Int32()))
	}
	// 过滤 - 状态
	if in.Status != "" {
		out.Scopes = append(out.Scopes, scope.Statuses(lo.Map(domain.WorkOrderStatusesForWorkOrderStatusV2(in.Status), func(s domain.WorkOrderStatus, _ int) enum.IntegerType { return *s.Integer })))
	}
	// 过滤 - 优先级
	if in.Priority != "" {
		out.Scopes = append(out.Scopes, scope.Priority(enum.ToInteger[constant.CommonPriority](in.Priority).Int32()))
	}
	// 过滤 - 时间范围
	if in.StartedAt != 0 && in.FinishedAt != 0 {
		out.Scopes = append(out.Scopes, scope.CreatedAtBetween(in.StartedAt, in.FinishedAt))
	}
	// 过滤 - 创建人
	u, err := user_util.ObtainUserInfo(ctx)
	if err != nil {
		return
	}
	out.Scopes = append(out.Scopes, scope.CreatedByUID(u.ID))
	return
}

// domain.WorkOrderListMyResponsibilitiesOptions -> work_order.ListOptions
func convert_domain_WorkOrderListMyResponsibilitiesOptions_To_work_order_ListOptions(ctx context.Context, in *domain.WorkOrderListMyResponsibilitiesOptions, out *work_order.ListOptions) (err error) {
	// 排序
	if err = convert_domain_WorkOrderSortOptions_To_work_order_SortOptions(&in.WorkOrderSortOptions, &out.SortOptions); err != nil {
		return
	}
	// 分页
	if err = convert_domain_WorkOrderPaginateOptions_To_work_order_PaginateOptions(&in.WorkOrderPaginateOptions, &out.PaginateOptions); err != nil {
		return
	}
	// 过滤 - 关键字
	if in.Keyword != "" && len(in.Fields) > 0 {
		out.Scopes = append(out.Scopes, scope.Keyword(in.Keyword, in.Fields))
	}
	// 过滤 - 类型
	if in.Type != "" {
		out.Scopes = append(out.Scopes, scope.Type(enum.ToInteger[domain.WorkOrderType](in.Type).Int32()))
	}
	// 过滤 - 状态 - 默认为进行中、已完成
	var status = []domain.WorkOrderStatus{
		domain.WorkOrderStatusOngoing,
		domain.WorkOrderStatusFinished,
	}
	if in.Status != "" {
		status = domain.WorkOrderStatusesForWorkOrderStatusV2(in.Status)
	}
	out.Scopes = append(out.Scopes, scope.Statuses(lo.Map(status, func(s domain.WorkOrderStatus, _ int) enum.IntegerType { return *s.Integer })))

	// 过滤 - 审核状态 - 通过
	out.Scopes = append(out.Scopes, scope.AuditStatus(domain.AuditStatusPass))
	// 过滤 - 优先级
	if in.Priority != "" {
		out.Scopes = append(out.Scopes, scope.Priority(enum.ToInteger[constant.CommonPriority](in.Priority).Int32()))
	}
	// 过滤 - 时间范围
	if in.StartedAt != 0 && in.FinishedAt != 0 {
		out.Scopes = append(out.Scopes, scope.CreatedAtBetween(in.StartedAt, in.FinishedAt))
	}

	// 过滤 - 责任人 - 当前用户
	u, err := user_util.ObtainUserInfo(ctx)
	if err != nil {
		return
	}
	out.Scopes = append(out.Scopes, scope.ResponsibleUID(u.ID))
	return
}

// domain.WorkOrderSortOptions -> work_order.SortOptions
func convert_domain_WorkOrderSortOptions_To_work_order_SortOptions(in *domain.WorkOrderSortOptions, out *work_order.SortOptions) (err error) {
	if in.Sort == "" {
		return
	}

	var descending bool
	switch in.Direction {
	case "asc":
		descending = false
	case "desc":
		descending = true
	default:
		err = fmt.Errorf("invalid direction: %q", in.Direction)
	}
	if err != nil {
		log.Error("convert domain.WorkOrderSortOptions to work_order.SortOptions fail", zap.Error(err))
		return
	}
	out.Fields = []work_order.FieldSortOptions{
		{
			Name:       in.Sort,
			Descending: descending,
		},
	}
	return
}

// domain.WorkOrderPaginateOptions -> work_order.PaginateOptions
func convert_domain_WorkOrderPaginateOptions_To_work_order_PaginateOptions(in *domain.WorkOrderPaginateOptions, out *work_order.PaginateOptions) (err error) {
	out.Limit = in.Limit
	out.Offset = in.Limit * (in.Offset - 1)
	return
}

// model -> grpc

// model.WorkOrder -> grpc/task_center/v1.WorkOrderApprovedEvent
func convert_Model_WorkOrder_Into_GRPCTaskCenterV1_WorkOrderApprovedEvent(ctx context.Context, c af_configuration.UserInterface, in *model.WorkOrder, out *callback_task_center_v1.WorkOrderApprovedEvent) {
	out.Id = in.WorkOrderID
	out.Name = in.Name
	out.Type = enum.ToString[domain.WorkOrderType](in.Type)
	out.ResponsibleUID = in.ResponsibleUID
	out.Description = in.Description
	out.TenantID = settings.ConfigInstance.TenantID

	// 责任人 ID，AnyFabric 的用户 ID 转换为第三方用户 ID
	u, err := c.Get(ctx, in.ResponsibleUID)
	if err != nil {
		log.Warn("get work order responsible fail", zap.Error(err), zap.String("responsibleUID", in.ResponsibleUID))
	} else {
		out.ResponsibleUID = u.FThirdUserID
	}

	// model.WorkOrder 不包含 callback_task_center_v1.WorkOrderApprovedEvent.Detail
	// 所需要的信息，所以不设置 Detail
}

// model.WorkOrder -> grpc/task_center/v1.WorkOrderApprovedEvent
func convert_Model_WorkOrder_To_GRPCTaskCenterV1_WorkOrderApprovedEvent(ctx context.Context, c af_configuration.UserInterface, in *model.WorkOrder) (out *callback_task_center_v1.WorkOrderApprovedEvent) {
	if in == nil {
		return
	}
	out = new(callback_task_center_v1.WorkOrderApprovedEvent)
	convert_Model_WorkOrder_Into_GRPCTaskCenterV1_WorkOrderApprovedEvent(ctx, c, in, out)
	return
}

// model.DataAggregationResourceCollectionMethod -> string
func convert_model_DataAggregationResourceCollectionMethod_To_string(in *model.DataAggregationResourceCollectionMethod, out *string) error {
	convert_model_DataAggregationResourceCollectionMethod_To_taskCenterV1_DataAggregationResourceCollectionMethod(in, (*task_center_v1.DataAggregationResourceCollectionMethod)(out))
	return nil
}

// model.DataAggregationResourceCollectionMethod -> task_center/v1.DataAggregationResourceCollectionMethod
func convert_model_DataAggregationResourceCollectionMethod_To_taskCenterV1_DataAggregationResourceCollectionMethod(in *model.DataAggregationResourceCollectionMethod, out *task_center_v1.DataAggregationResourceCollectionMethod) (err error) {
	switch *in {
	// 全量
	case model.DataAggregationResourceCollectionFull:
		*out = task_center_v1.DataAggregationResourceCollectionFull
	// 增量
	case model.DataAggregationResourceCollectionIncrement:
		*out = task_center_v1.DataAggregationResourceCollectionIncrement
	default:
		err = fmt.Errorf("invalid data aggregation resource collection method: %v", *in)
	}
	return
}

// model.DataAggregationResourceSyncFrequency -> string
func convert_model_DataAggregationResourceSyncFrequency_To_string(in *model.DataAggregationResourceSyncFrequency, out *string) error {
	return convert_Model_DataAggregationResourceSyncFrequency_Into_TaskCenterV1_DataAggregationResourceSyncFrequency(in, (*task_center_v1.DataAggregationResourceSyncFrequency)(out))
}

// model.DataAggregationResourceSyncFrequency -> task_center/v1.DataAggregationDetail
func convert_Model_DataAggregationResourceSyncFrequency_Into_TaskCenterV1_DataAggregationResourceSyncFrequency(in *model.DataAggregationResourceSyncFrequency, out *task_center_v1.DataAggregationResourceSyncFrequency) (err error) {
	switch *in {
	// 每分钟
	case model.DataAggregationResourceSyncFrequencyPerMinute:
		*out = task_center_v1.DataAggregationResourceSyncFrequencyPerMinute
	// 每小时
	case model.DataAggregationResourceSyncFrequencyPerHour:
		*out = task_center_v1.DataAggregationResourceSyncFrequencyPerHour
	// 每天
	case model.DataAggregationResourceSyncFrequencyPerDay:
		*out = task_center_v1.DataAggregationResourceSyncFrequencyPerDay
	// 每周
	case model.DataAggregationResourceSyncFrequencyPerWeek:
		*out = task_center_v1.DataAggregationResourceSyncFrequencyPerWeek
	// 每月
	case model.DataAggregationResourceSyncFrequencyPerMonth:
		*out = task_center_v1.DataAggregationResourceSyncFrequencyPerMonth
	// 每年
	case model.DataAggregationResourceSyncFrequencyPerYear:
		*out = task_center_v1.DataAggregationResourceSyncFrequencyPerYear
	default:
		err = fmt.Errorf("invalid data aggregation sync frequency: %v", *in)
	}
	return
}
