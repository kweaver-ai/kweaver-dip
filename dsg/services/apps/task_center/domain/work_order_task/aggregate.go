package work_order_task

import (
	"context"

	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/database/af_configuration"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/database/af_tasks"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	task_center_v1 "github.com/kweaver-ai/idrm-go-common/api/task_center/v1"
	"github.com/kweaver-ai/idrm-go-common/api/task_center/v1/frontend"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type aggregator struct {
	workOrder af_tasks.WorkOrderInterface
	object    af_configuration.ObjectInterface
}

func (a *aggregator) aggregate_Slice_model_WorkOrderTask_To_Slice_frontend_WorkOrderTask(ctx context.Context, in *[]model.WorkOrderTask, out *[]frontend.WorkOrderTaskListItem) {
	for _, task := range *in {
		var item frontend.WorkOrderTaskListItem
		a.aggregate_model_WorkOrderTask_To_frontend_WorkOrderTaskListItem(ctx, &task, &item)
		*out = append(*out, item)
	}
}

func (a *aggregator) aggregate_model_WorkOrderTask_To_frontend_WorkOrderTaskListItem(ctx context.Context, in *model.WorkOrderTask, out *frontend.WorkOrderTaskListItem) {
	out.ID = in.ID
	out.CreatedAt = meta_v1.NewTime(in.CreatedAt)
	out.Name = in.Name
	out.Status = task_center_v1.WorkOrderTaskStatus(in.Status)
	out.Reason = in.Reason
	out.Link = in.Link

	a.aggregate_WorkOrderID_To_meta_v1_ReferenceWithName(ctx, &in.WorkOrderID, &out.WorkOrder)
	a.aggregate_model_WorkOrderTaskTypedDetail_To_frontend_WorkOrderTaskTypedDetail(ctx, &in.WorkOrderTaskTypedDetail, &out.WorkOrderTaskTypedDetail)
}

func (a *aggregator) aggregate_WorkOrderID_To_meta_v1_ReferenceWithName(ctx context.Context, in *string, out *meta_v1.ReferenceWithName) {
	out.ID = *in
	got, err := a.workOrder.Get(ctx, *in)
	if err != nil {
		log.Warn("get work order fail", zap.String("id", *in))
		return
	}
	out.Name = got.Name
}

func (a *aggregator) aggregate_model_WorkOrderTaskTypedDetail_To_frontend_WorkOrderTaskTypedDetail(ctx context.Context, in *model.WorkOrderTaskTypedDetail, out *frontend.WorkOrderTaskTypedDetail) {
	// 数据归集
	a.aggregate_Slice_model_WorkOrderDataAggregationDetail_To_Slice_frontend_WorkOrderTaskDetailAggregation(ctx, &in.DataAggregation, &out.DataAggregation)
	// 数据理解
	convertModelIntoV1_WorkOrderTaskDetailComprehensionDetail(in.DataComprehension, out.DataComprehension)
	// 数据融合
	if in.DataFusion != nil {
		out.DataFusion = new(task_center_v1.WorkOrderTaskDetailFusionDetail)
		convertModelIntoV1_WorkOrderTaskDetailFusionDetail(in.DataFusion, out.DataFusion)
	}
	// 数据质量
	if in.DataQuality != nil {
		out.DataQuality = new(task_center_v1.WorkOrderTaskDetailQualityDetail)
		convertModelIntoV1_WorkOrderTaskDetailQualityDetail(in.DataQuality, out.DataQuality)
	}
	// 数据质量稽核
	if in.DataQualityAudit != nil {
		out.DataQualityAudit = make([]*task_center_v1.WorkOrderTaskDetailQualityAuditDetail, len(in.DataQualityAudit))
		convertModelIntoV1_WorkOrderTaskDetailQualityAuditDetail(in.DataQualityAudit, out.DataQualityAudit)
	}
}

func (a *aggregator) aggregate_Slice_model_WorkOrderDataAggregationDetail_To_Slice_frontend_WorkOrderTaskDetailAggregation(ctx context.Context, in *[]model.WorkOrderDataAggregationDetail, out *[]frontend.WorkOrderTaskDetailAggregation) {
	for _, itemIn := range *in {
		var itemOut frontend.WorkOrderTaskDetailAggregation
		a.aggregate_model_WorkOrderDataAggregationDetail_To_frontend_WorkOrderTaskDetailAggregation(ctx, &itemIn, &itemOut)
		*out = append(*out, itemOut)
	}
}

func (a *aggregator) aggregate_model_WorkOrderDataAggregationDetail_To_frontend_WorkOrderTaskDetailAggregation(ctx context.Context, in *model.WorkOrderDataAggregationDetail, out *frontend.WorkOrderTaskDetailAggregation) {
	out.TableName = in.Target.TableName
	out.Count = in.Count

	a.aggregate_DepartmentID_To_frontend_DepartmentReference(ctx, &in.DepartmentID, &out.Department)
}

func (a *aggregator) aggregate_DepartmentID_To_frontend_DepartmentReference(ctx context.Context, in *string, out *frontend.DepartmentReference) {
	out.ID = *in

	got, err := a.object.Get(ctx, *in)
	if err != nil {
		log.Warn("get department fail", zap.Error(err), zap.String("id", *in))
		return
	}
	out.Path = got.Path
}
