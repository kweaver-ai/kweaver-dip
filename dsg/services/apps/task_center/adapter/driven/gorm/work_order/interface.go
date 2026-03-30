package work_order

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type Repo interface {
	Create(ctx context.Context, workOrder *model.WorkOrder) error
	// 创建工单，及标准化工单相关的逻辑视图字段
	CreateWorkOrderAndFormViewFields(ctx context.Context, order *model.WorkOrder, fields []model.WorkOrderFormViewField) error
	// 创建数据归集工单，及其相关的资源（逻辑视图）
	CreateForDataAggregation(ctx context.Context, order *model.WorkOrder, resources []model.DataAggregationResource) error
	Delete(ctx context.Context, id string) error
	Update(ctx context.Context, workOrder *model.WorkOrder) error
	// UpdateStatus 更新工单状态为指定值
	UpdateStatus(ctx context.Context, id string, status int32) error
	// 更新数据归集工单，及其相关的资源（逻辑视图）
	UpdateForDataAggregation(ctx context.Context, workOrder *model.WorkOrder, resources []model.DataAggregationResource) error
	// 根据 ID 和 AudiID 更新审核状态为指定值
	UpdateAuditStatusByIDAndAuditID(ctx context.Context, id, auditID uint64, s int32) error
	// 根据 ID 和 AuditID 更新审核状态、审核意见
	UpdateAuditStatusAndAuditDescriptionByIDAndAuditID(ctx context.Context, id, auditID uint64, s int32, d string) error
	// 根据工单类型，更新审核状态 AuditStatus 为指定值
	UpdateAuditStatusByType(ctx context.Context, t, s int32) error
	// 标记工单已经同步到第三方
	MarkAsSynced(ctx context.Context, id string) error
	// 根据 sonyflake id 查询工单
	GetBySonyflakeID(ctx context.Context, id uint64) (*model.WorkOrder, error)
	GetById(ctx context.Context, id string) (*model.WorkOrder, error)
	CheckNameRepeat(ctx context.Context, id, name string, workOderType int32) (bool, error)
	GetByUniqueIDs(ctx context.Context, ids []uint64) ([]*model.WorkOrder, error)
	GetList(ctx context.Context, req *work_order.WorkOrderListReq) (int64, []*model.WorkOrder, error)
	GetAcceptanceList(ctx context.Context, req *work_order.WorkOrderAcceptanceListReq) (int64, []*model.WorkOrder, error)
	GetProcessingList(ctx context.Context, req *work_order.WorkOrderProcessingListReq, userId string) (int64, int64, []*model.WorkOrder, error)
	GetListbySourceIDs(ctx context.Context, ids []string) ([]*model.WorkOrder, error)
	// 返回关联指定归集清单的工单名称列表
	GetNamesByDataAggregationInventoryID(ctx context.Context, id string) ([]string, error)
	// 根据工单 ID 获取，标准工单关联的逻辑视图字段列表
	GetWorkOrderFormViewFieldsByWorkOrderID(ctx context.Context, id string) (fields []model.WorkOrderFormViewField, err error)
	// 根据工单 ID 更新，标准化工单关联的逻辑视图字段列表
	ReconcileWorkOrderFormViewFieldsByWorkOrderID(ctx context.Context, id string, fields []model.WorkOrderFormViewField) error
	List(ctx context.Context, req *work_order.GetListReq) ([]*model.WorkOrder, error)
	// 获取工单列表，比 List 稍微通用一点
	ListV2(ctx context.Context, opts ListOptions) (orders []model.WorkOrder, total int, err error)
	// 创建融合工单，及相关的融合表
	CreateFusionWorkOrderAndFusionTable(ctx context.Context, order *model.WorkOrder, extend *model.TWorkOrderExtend, fields []*model.TFusionField) error
	// 根据工单 ID 更新融合工单关联的融合表名称及字段列表
	UpdateFusionWorkOrderFusionFieldsByWorkOrderID(ctx context.Context, extend *model.TWorkOrderExtend, fields []*model.TFusionField, userId string) error
	// 创建质量稽核工单，及相关的逻辑视图
	CreateQualityAuditWorkOrderAndFormViews(ctx context.Context, order *model.WorkOrder, relations []*model.TQualityAuditFormViewRelation) error
	// 根据工单 ID 更新质量稽核工单关联的逻辑视图列表
	UpdateQualityAuditWorkOrderFormViewsByWorkOrderID(ctx context.Context, workOrderId string, viewIds []string, userId string) error
	CreateQualityAuditWorkOrderFormViews(ctx context.Context, relations []*model.TQualityAuditFormViewRelation) error
	GetByWorkOrderIDs(ctx context.Context, workOrderIDs []string) ([]*model.WorkOrder, error)
	GetFusionWorkOrderRelationCatalog(ctx context.Context, workOrderId string) (catalogIds []*uint64, fields []string, err error)
	GetAggregationForQualityAudit(ctx context.Context, req *work_order.AggregationForQualityAuditListReq) (int64, []*model.WorkOrder, error)
}
