package notification

// 这个文件提供的聚合方法，都是尽量聚合，遇到错误记录 WARN 日志，继续聚合其他
import (
	"context"

	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	asset_portal_v1 "github.com/kweaver-ai/idrm-go-common/api/asset_portal/v1"
	asset_portal_v1_frontend "github.com/kweaver-ai/idrm-go-common/api/asset_portal/v1/frontend"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	"github.com/kweaver-ai/idrm-go-common/util/ptr"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// 聚合用户消息
func (c *Domain) aggregate_NotificationInto(ctx context.Context, in *model.Notification, out *asset_portal_v1_frontend.Notification) {
	out.ID = in.Metadata.ID.String()
	out.Time = meta_v1.NewTime(in.CreatedAt)
	out.RecipientID = in.Spec.RecipientID.String()
	out.Message = in.Spec.Message
	out.Read = ptr.Deref(in.Status.Read, false)
	out.Reason = asset_portal_v1.Reason(in.Spec.Reason)
	out.WorkOrder = c.aggregate_WorkOrder(ctx, in.Spec.WorkOrderID)
}

// 聚合用户消息
func (c *Domain) aggregate_Notification(ctx context.Context, in *model.Notification) (out *asset_portal_v1_frontend.Notification) {
	if in == nil {
		return
	}
	out = new(asset_portal_v1_frontend.Notification)
	c.aggregate_NotificationInto(ctx, in, out)
	return
}

// 聚合用户消息列表
func (c *Domain) aggregate_Notifications(ctx context.Context, in []model.Notification) (out []asset_portal_v1_frontend.Notification) {
	if in == nil {
		return
	}
	out = make([]asset_portal_v1_frontend.Notification, len(in))
	for i := range in {
		c.aggregate_NotificationInto(ctx, &in[i], &out[i])
	}
	return
}

// 聚合用户消息中的工单
func (c *Domain) aggregate_WorkOrderInto(ctx context.Context, id uuid.UUID, out *asset_portal_v1_frontend.WorkOrder) {
	got, err := c.workOrder.GetByWorkOrderID(ctx, id)
	if err != nil {
		log.Warn("get work order fail", zap.Error(err), zap.Any("id", id))
		return
	}

	out.ID = got.WorkOrderID.String()
	out.Name = got.Name
	out.Code = got.Code
	out.Deadline = meta_v1.NewTime(got.FinishedAt)
}

// 聚合用户消息中的工单
func (c *Domain) aggregate_WorkOrder(ctx context.Context, id uuid.UUID) (out *asset_portal_v1_frontend.WorkOrder) {
	if id == uuid.Nil {
		return
	}
	out = new(asset_portal_v1_frontend.WorkOrder)
	c.aggregate_WorkOrderInto(ctx, id, out)
	return
}
