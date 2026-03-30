package impl

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/fusion_model"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/quality_audit_model"
	quality_audit_model_impl "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/quality_audit_model/impl"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order_extend"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	utilities "github.com/kweaver-ai/idrm-go-frame/core/utils"
	"go.uber.org/zap"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_aggregation_resource"
	fusion_model_impl "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/fusion_model/impl"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order"
	work_order_extend_impl "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order_extend/impl"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/util/ptr"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// 批处理限制
const batchSize = 1 << 10

type WorkOrderRepo struct {
	data *db.Data
	// 数据库表 data_aggregation_resources
	DataAggregationResources data_aggregation_resource.Interface
	// 工单扩展表
	workOrderExtendRepo work_order_extend.WorkOrderExtendRepo
	// 融合字段表
	fusionModelRepo fusion_model.FusionModelRepo
	// 质量稽核模型
	qualityAuditModelRepo quality_audit_model.QualityAuditModelRepo
}

func NewWorkOderRepo(data *db.Data) work_order.Repo {
	return &WorkOrderRepo{
		data: data,
		// 数据库表 data_aggregation_resources
		DataAggregationResources: data_aggregation_resource.New(data),
		// 工单扩展表
		workOrderExtendRepo: work_order_extend_impl.NewWorkOrderExtendRepo(data),
		// 融合字段表
		fusionModelRepo: fusion_model_impl.NewFusionModelRepo(data),
		// 质量稽核模型
		qualityAuditModelRepo: quality_audit_model_impl.NewRepo(data),
	}
}

func (r *WorkOrderRepo) Create(ctx context.Context, workOrder *model.WorkOrder) error {
	return r.data.DB.Model(&model.WorkOrder{}).WithContext(ctx).Create(workOrder).Error
}

// CreateWorkOrderAndFormViewFields 创建标准化工单，及其相关的逻辑视图字段
func (r *WorkOrderRepo) CreateWorkOrderAndFormViewFields(ctx context.Context, order *model.WorkOrder, fields []model.WorkOrderFormViewField) error {
	return r.data.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(order).Error; err != nil {
			return err
		}
		if len(fields) != 0 {
			if err := tx.Create(fields).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

// 创建数据归集工单，及其相关的资源（逻辑视图）
func (r *WorkOrderRepo) CreateForDataAggregation(ctx context.Context, order *model.WorkOrder, resources []model.DataAggregationResource) error {
	return r.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 创建创建工单
		if err := tx.Create(order).Error; err != nil {
			return err
		}
		// 创建来源是业务表的归集工单的归集资源
		if err := tx.Create(resources).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *WorkOrderRepo) Delete(ctx context.Context, id string) error {
	return r.data.DB.Model(&model.WorkOrder{}).WithContext(ctx).Where("work_order_id=?", id).Delete(&model.WorkOrder{}).Error
}

func (r *WorkOrderRepo) Update(ctx context.Context, workOrder *model.WorkOrder) error {
	return r.data.DB.Model(&model.WorkOrder{}).WithContext(ctx).Where("id=?", workOrder.ID).Updates(workOrder).Error
}

// UpdateStatus 更新工单状态为指定值
func (r *WorkOrderRepo) UpdateStatus(ctx context.Context, id string, status int32) error {
	return UpdateStatus(r.data.DB.WithContext(ctx), id, status)
}

func (r *WorkOrderRepo) UpdateForDataAggregation(ctx context.Context, workOrder *model.WorkOrder, resources []model.DataAggregationResource) error {
	return r.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 更新表 work_order
		if err := tx.Model(&model.WorkOrder{}).
			WithContext(ctx).
			Where("id=?", workOrder.ID).
			Updates(workOrder).
			Error; err != nil {
			return err
		}
		return r.DataAggregationResources.ReconcileByWorkOrderID(ctx, workOrder.WorkOrderID, resources)
	})
}

// 根据 ID 和 AudiID 更新审核状态为指定值
func (r *WorkOrderRepo) UpdateAuditStatusByIDAndAuditID(ctx context.Context, id, auditID uint64, s int32) error {
	return r.data.DB.WithContext(ctx).
		Model(&model.WorkOrder{}).
		Where(&model.WorkOrder{ID: id, AuditID: &auditID}).
		Updates(&model.WorkOrder{AuditStatus: s}).Error
}

// 根据 ID 和 AuditID 更新审核状态、审核意见
func (r *WorkOrderRepo) UpdateAuditStatusAndAuditDescriptionByIDAndAuditID(ctx context.Context, id, auditID uint64, s int32, d string) error {
	return r.data.DB.WithContext(ctx).
		Model(&model.WorkOrder{}).
		Where(&model.WorkOrder{ID: id, AuditID: &auditID}).
		Updates(&model.WorkOrder{AuditStatus: s, AuditDescription: d}).Error
}

// UpdateAuditStatusByType 根据工单类型，更新审核状态 AuditStatus 为指定值
func (r *WorkOrderRepo) UpdateAuditStatusByType(ctx context.Context, t, s int32) error {
	tx := r.data.DB.WithContext(ctx)
	for {
		tx := tx.Model(&model.WorkOrder{}).
			Where(&model.WorkOrder{Type: t}).
			Updates(&model.WorkOrder{AuditStatus: s}).
			Limit(batchSize)
		if tx.Error != nil || tx.RowsAffected == 0 {
			return tx.Error
		}
	}
}

// 标记工单已经同步到第三方
func (r *WorkOrderRepo) MarkAsSynced(ctx context.Context, id string) error {
	return r.data.DB.WithContext(ctx).
		Where(&model.WorkOrder{WorkOrderID: id}).
		Updates(&model.WorkOrder{Synced: true}).Error
}

// 根据 sonyflake id 查询工单
func (f *WorkOrderRepo) GetBySonyflakeID(ctx context.Context, id uint64) (*model.WorkOrder, error) {
	return GetBySonyflakeID(f.data.DB.WithContext(ctx), id)
}

func (r *WorkOrderRepo) GetById(ctx context.Context, id string) (workOrder *model.WorkOrder, err error) {
	// 归集工单关联的业务表已经在 work_order.business_forms，不需要再查
	// data_aggregation_resources

	err = r.data.DB.Model(&model.WorkOrder{}).WithContext(ctx).Take(&workOrder, "work_order_id=?", id).Error
	if err != nil {
		if is := errors.Is(err, gorm.ErrRecordNotFound); is {
			return nil, errorcode.Desc(errorcode.WorkOrderIdNotExistError)
		}
		return nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	return
}

func (r *WorkOrderRepo) CheckNameRepeat(ctx context.Context, id, name string, workOderType int32) (bool, error) {
	var nameList []string
	tx := r.data.DB.WithContext(ctx).Model(&model.WorkOrder{}).Distinct("name").Where("name = ? and type = ?", name, workOderType)
	if id != "" {
		tx.Where("work_order_id <> ?", id)
	}
	err := tx.Find(&nameList).Error
	if err != nil {
		return false, err
	}
	count := len(nameList)
	if count != 0 {
		return true, nil
	}
	return false, nil
}

func (r *WorkOrderRepo) GetByUniqueIDs(ctx context.Context, ids []uint64) ([]*model.WorkOrder, error) {
	// 归集工单关联的业务表已经在 work_order.business_forms，不需要再查
	// data_aggregation_resources

	if len(ids) < 1 {
		log.WithContext(ctx).Warn("workOrder ids is empty")
		return nil, nil
	}
	res := make([]*model.WorkOrder, 0)
	err := r.data.DB.WithContext(ctx).Model(&model.WorkOrder{}).Where("id in ?", ids).Find(&res, ids).Error
	return res, err
}

func (r *WorkOrderRepo) GetList(ctx context.Context, req *domain.WorkOrderListReq) (int64, []*model.WorkOrder, error) {
	// 归集工单关联的业务表已经在 work_order.business_forms，不需要再查
	// data_aggregation_resources

	limit := req.Limit
	offset := limit * (req.Offset - 1)

	Db := r.data.DB.WithContext(ctx).Model(&model.WorkOrder{})
	if req.Keyword != "" {
		keyword := "%" + util.KeywordEscape(req.Keyword) + "%"
		Db = Db.Where("name like ? or code like ?", keyword, keyword)
	}
	if req.StartedAt != 0 && req.FinishedAt != 0 {
		Db = Db.Where(" created_at BETWEEN ? AND ?", time.Unix(req.StartedAt, 0), time.Unix(req.FinishedAt, 0))
	}
	if req.Type != "" {
		arr := strings.Split(req.Type, ",")
		types := make([]int32, 0)
		for _, a := range arr {
			t := enum.ToInteger[domain.WorkOrderType](a, 0).Int32()
			if t > 0 {
				types = append(types, t)
			}
		}
		if len(types) > 0 {
			Db = Db.Where("type in  ?", types)
		}
	}

	if req.Priority != "" {
		Db = Db.Where("priority = ?", enum.ToInteger[constant.CommonPriority](req.Priority, 0).Int32())
	}

	if req.Status != "" {
		status := int32(*(domain.WorkOrderStatusesForWorkOrderStatusV2(domain.WorkOrderStatusV2(req.Status))[0].Integer))
		Db = Db.Where("status = ?", status)
	}

	if req.SourceId != "" {
		Db = Db.Where("source_id = ?", req.SourceId)
	}
	var total int64
	err := Db.Count(&total).Error
	if err != nil {
		return 0, nil, err
	}
	var models []*model.WorkOrder
	if limit > 0 {
		Db = Db.Limit(limit).Offset(offset)
	}

	if req.Sort != "" && req.Direction != "" {
		Db = Db.Order(fmt.Sprintf("%s %s", req.Sort, req.Direction))
	}
	err = Db.Find(&models).Error
	if err != nil {
		return 0, nil, err
	}
	return total, models, nil
}

func (r *WorkOrderRepo) GetAcceptanceList(ctx context.Context, req *domain.WorkOrderAcceptanceListReq) (int64, []*model.WorkOrder, error) {
	// 归集工单关联的业务表已经在 work_order.business_forms，不需要再查
	// data_aggregation_resources

	limit := req.Limit
	offset := limit * (req.Offset - 1)

	Db := r.data.DB.WithContext(ctx).Model(&model.WorkOrder{}).Where("responsible_uid IS NULL OR responsible_uid = ''").
		// 根据工单类型过滤审核状态
		//  数据归集工：任意
		//  其他：已通过
		Where("audit_status = ? OR type = ?", domain.AuditStatusPass.Integer.Int32(), domain.WorkOrderTypeDataAggregation.Integer.Int32())
	if req.Keyword != "" {
		keyword := "%" + util.KeywordEscape(req.Keyword) + "%"
		Db = Db.Where("name like ? or code like ?", keyword, keyword)
	}
	if req.Type != "" {
		arr := strings.Split(req.Type, ",")
		types := make([]int32, 0)
		for _, a := range arr {
			t := enum.ToInteger[domain.WorkOrderType](a, 0).Int32()
			if t > 0 {
				types = append(types, t)
			}
		}
		if len(types) > 0 {
			Db = Db.Where("type in  ?", types)
		}
	}
	var total int64
	err := Db.Count(&total).Error
	if err != nil {
		return 0, nil, err
	}
	models := make([]*model.WorkOrder, 0)
	Db = Db.Limit(int(limit)).Offset(int(offset))
	err = Db.Order(fmt.Sprintf("%s %s", req.Sort, req.Direction)).Find(&models).Error
	if err != nil {
		return 0, nil, err
	}
	return total, models, nil
}

// 返回责任人是当前用户的工单列表
func (r *WorkOrderRepo) GetProcessingList(ctx context.Context, req *domain.WorkOrderProcessingListReq, userId_a string) (int64, int64, []*model.WorkOrder, error) {
	// 归集工单关联的业务表已经在 work_order.business_forms，不需要再查
	// data_aggregation_resources

	limit := req.Limit
	offset := limit * (req.Offset - 1)
	Db := r.data.DB.WithContext(ctx).Model(&model.WorkOrder{}).
		// 根据工单类型过滤审核状态
		// 	理解工单：已通过
		// 	归集工单：任意
		// Where("responsible_uid = ? and ((audit_status = ? and type = ?) or type = ? or type = ?)", userId, domain.AuditStatusPass.Integer.Int32(), domain.WorkOrderTypeDataComprehension.Integer.Int32(), domain.WorkOrderTypeDataAggregation.Integer.Int32(), domain.WorkOrderTypeDataQuality.Integer.Int32())
		Where("data_source_department_id in ? and ((audit_status = ? and type = ?) or type = ? or type = ?)", req.SubDepartmentIDs, domain.AuditStatusPass.Integer.Int32(), domain.WorkOrderTypeDataComprehension.Integer.Int32(), domain.WorkOrderTypeDataAggregation.Integer.Int32(), domain.WorkOrderTypeDataQuality.Integer.Int32())
	if req.Keyword != "" {
		keyword := "%" + util.KeywordEscape(req.Keyword) + "%"
		Db = Db.Where("name like ? or code like ?", keyword, keyword)
	}

	types := make([]int32, 0)
	if req.Type != "" {
		arr := strings.Split(req.Type, ",")
		for _, a := range arr {
			t := enum.ToInteger[domain.WorkOrderType](a, 0).Int32()
			if t > 0 {
				types = append(types, t)
			}
		}
		if len(types) > 0 {
			Db = Db.Where("type in  ?", types)
		}
	}
	if req.Priority != "" {
		Db = Db.Where("priority = ?", enum.ToInteger[constant.CommonPriority](req.Priority, 0).Int32())
	}
	var count, todoCount, completedCount int64

	if req.Status != "" {
		// arr := strings.Split(req.Status, ",")
		// ss := make([]int32, 0)
		// for _, s := range arr {
		// 	si := enum.ToInteger[domain.WorkOrderStatus](s, 0).Int32()
		// 	if si > 0 {
		// 		ss = append(ss, si)
		// 	}
		// }

		arrStatus := strings.Split(req.Status, ",")
		ss := make([]int32, 0)
		for _, status := range arrStatus {
			arr := domain.WorkOrderStatusesForWorkOrderStatusV2(domain.WorkOrderStatusV2(status))
			for _, s := range arr {
				si := int32(*s.Integer)
				if si > 0 {
					ss = append(ss, si)
				}
			}
		}
		if len(ss) > 0 {
			Db = Db.Where("status in  ?", ss)
			err := Db.Count(&count).Error
			if err != nil {
				return 0, 0, nil, err
			}
			if len(ss) == 1 && ss[0] == domain.WorkOrderStatusFinished.Integer.Int32() {
				err = r.data.DB.WithContext(ctx).Model(&model.WorkOrder{}).
					// 根据工单类型过滤审核状态
					// 	理解工单：已通过
					// 	归集工单：任意
					Where("data_source_department_id in ? and ((audit_status = ? and type = ?) or type = ? or type = ?)", req.SubDepartmentIDs, domain.AuditStatusPass.Integer.Int32(), domain.WorkOrderTypeDataComprehension.Integer.Int32(), domain.WorkOrderTypeDataAggregation.Integer.Int32(), domain.WorkOrderTypeDataQuality.Integer.Int32()).
					Where("status = ? or status = ? or status = ?", domain.WorkOrderStatusPendingSignature.Integer.Int32(), domain.WorkOrderStatusSignedFor.Integer.Int32(), domain.WorkOrderStatusOngoing.Integer.Int32()).
					Where("type in  ?", types).Count(&todoCount).Error
				if err != nil {
					return 0, 0, nil, err
				}
				completedCount = count
			} else {
				err = r.data.DB.WithContext(ctx).Model(&model.WorkOrder{}).
					// 根据工单类型过滤审核状态
					// 	理解工单：已通过
					// 	归集工单：任意
					Where("data_source_department_id in ? and ((audit_status = ? and type = ?) or type = ? or type = ?)", req.SubDepartmentIDs, domain.AuditStatusPass.Integer.Int32(), domain.WorkOrderTypeDataComprehension.Integer.Int32(), domain.WorkOrderTypeDataAggregation.Integer.Int32(), domain.WorkOrderTypeDataQuality.Integer.Int32()).
					Where("status = ?", domain.WorkOrderStatusFinished.Integer.Int32()).
					Where("type in  ?", types).Count(&completedCount).Error
				if err != nil {
					return 0, 0, nil, err
				}
				todoCount = count
			}
		}
	}
	models := make([]*model.WorkOrder, 0)
	Db = Db.Limit(int(limit)).Offset(int(offset))
	err := Db.Order(fmt.Sprintf("%s %s", req.Sort, req.Direction)).Find(&models).Error
	if err != nil {
		return 0, 0, nil, err
	}
	return todoCount, completedCount, models, nil
}

func (r *WorkOrderRepo) GetListbySourceIDs(ctx context.Context, ids []string) ([]*model.WorkOrder, error) {
	// 归集工单关联的业务表已经在 work_order.business_forms，不需要再查
	// data_aggregation_resources

	models := make([]*model.WorkOrder, 0)
	Db := r.data.DB.WithContext(ctx).Model(&model.WorkOrder{}).Where("source_id in  ?", ids)
	err := Db.Find(&models).Error
	if err != nil {
		return nil, err
	}
	return models, nil
}

// 返回关联指定归集清单的工单名称列表
func (r *WorkOrderRepo) GetNamesByDataAggregationInventoryID(ctx context.Context, id string) ([]string, error) {
	var names []string
	if err := r.data.DB.WithContext(ctx).
		Model(&model.WorkOrder{}).
		Where(&model.WorkOrder{DataAggregationInventoryID: id}).
		Select("name").
		Scan(&names).
		Error; err != nil {
		return nil, err
	}

	return names, nil
}

// 根据工单 ID 获取，标准工单关联的逻辑视图字段列表
func (r *WorkOrderRepo) GetWorkOrderFormViewFieldsByWorkOrderID(ctx context.Context, id string) (fields []model.WorkOrderFormViewField, err error) {
	tx := r.data.DB.WithContext(ctx).Where(&model.WorkOrderFormViewField{WorkOrderID: id}).Find(&fields)
	if tx.Error != nil {
		return nil, err
	}
	return
}

// 根据工单 ID 更新，标准化工单关联的逻辑视图字段列表
func (r *WorkOrderRepo) ReconcileWorkOrderFormViewFieldsByWorkOrderID(ctx context.Context, id string, fields []model.WorkOrderFormViewField) error {
	return r.data.DB.Transaction(func(tx *gorm.DB) error {
		// 获取已存在的
		var actual []model.WorkOrderFormViewField
		if err := r.data.DB.WithContext(ctx).Where(&model.WorkOrderFormViewField{WorkOrderID: id}).Find(&actual).Error; err != nil {
			return err
		}
		log.Debug("get already existed work order form view fields", zap.Any("fields", actual))

		// 创建不存在的
		var toCreate []model.WorkOrderFormViewField
		for _, f := range fields {
			var existed bool
			for _, ff := range actual {
				if ff.FormViewFieldID != f.FormViewFieldID {
					continue
				}
				existed = true
				break
			}
			if existed {
				continue
			}
			toCreate = append(toCreate, f)
		}
		log.Debug("create work order form view fields", zap.Any("fields", toCreate))
		if len(toCreate) != 0 {
			if err := r.data.DB.WithContext(ctx).Create(toCreate).Error; err != nil {
				return err
			}
		}

		// 更新发生改变的
		for _, f := range actual {
			for _, ff := range fields {
				if newWorkOrderFormViewFieldPrimaryKey(&ff) != newWorkOrderFormViewFieldPrimaryKey(&f) {
					continue
				}
				var changed bool
				changed = changed || !ptr.Equal(ff.StandardRequired, f.StandardRequired)
				changed = changed || ff.DataElementID != f.DataElementID
				// 跳过没有改变的
				if !changed {
					log.Info("DEBUG.GORM.ReconcileWorkOrderFormViewFieldsByWorkOrderID, Unhanged")
					continue
				}
				// 更新发生改变的
				log.Debug("update work order form view field", zap.Any("field", ff))
				if err := r.data.DB.WithContext(ctx).Where(&model.WorkOrderFormViewField{
					WorkOrderID:     id,
					FormViewID:      f.FormViewID,
					FormViewFieldID: f.FormViewFieldID,
				}).Updates(ff).Error; err != nil {
					return err
				}
			}
		}

		// 删除不需要再存在的
		var toDelete []any
		for _, f := range actual {
			var existed bool
			for _, ff := range fields {
				if newWorkOrderFormViewFieldPrimaryKey(&ff) != newWorkOrderFormViewFieldPrimaryKey(&f) {
					continue
				}
				existed = true
				break
				// toDelete = append(toDelete, model.WorkOrderFormViewField{
				// 	WorkOrderID:     id,
				// 	FormViewID:      f.FormViewID,
				// 	FormViewFieldID: f.FormViewFieldID,
				// })
			}
			if existed {
				continue
			}
			toDelete = append(toDelete, []any{
				id,
				f.FormViewID,
				f.FormViewFieldID,
			})
		}
		log.Debug("delete work order form view fields", zap.Any("fields", toDelete))
		if len(toDelete) != 0 {
			if err := r.data.DB.WithContext(ctx).Where(clause.IN{
				Column: []string{
					"work_order_id",
					"form_view_id",
					"form_view_field_id",
				},
				Values: toDelete,
			}).Delete(&model.WorkOrderFormViewField{}).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

type workOrderFormViewFieldPrimaryKey struct {
	// 工单 ID
	WorkOrderID string `json:"work_order_id,omitempty"`
	// 逻辑视图 ID
	FormViewID string `json:"form_view_id,omitempty"`
	// 逻辑视图字段 ID
	FormViewFieldID string `json:"form_view_field_id,omitempty"`
}

func newWorkOrderFormViewFieldPrimaryKey(f *model.WorkOrderFormViewField) workOrderFormViewFieldPrimaryKey {
	return workOrderFormViewFieldPrimaryKey{
		WorkOrderID:     f.WorkOrderID,
		FormViewID:      f.FormViewID,
		FormViewFieldID: f.FormViewFieldID,
	}
}

func (r *WorkOrderRepo) List(ctx context.Context, req *domain.GetListReq) ([]*model.WorkOrder, error) {

	Db := r.data.DB.WithContext(ctx).Model(&model.WorkOrder{})
	if req.Type != "" {
		Db = Db.Where("type = ?", enum.ToInteger[domain.WorkOrderType](req.Type).Int32())
	}

	if req.SourceType != "" {
		Db = Db.Where("source_type = ?", enum.ToInteger[domain.WorkOrderSourceType](req.SourceType).Int32())
	}

	if len(req.SourceIds) > 0 {
		Db = Db.Where("source_id in ?", req.SourceIds)
	}

	if len(req.WorkOrderIds) > 0 {
		Db = Db.Where("work_order_id in ?", req.WorkOrderIds)
	}

	models := make([]*model.WorkOrder, 0)
	err := Db.Find(&models).Error
	if err != nil {
		return nil, err
	}
	return models, nil
}

// ListV2 获取工单列表，比 List 稍微通用一点
func (r *WorkOrderRepo) ListV2(ctx context.Context, opts work_order.ListOptions) (orders []model.WorkOrder, total int, err error) {
	tx := r.data.DB.WithContext(ctx).Model(&model.WorkOrder{}).Scopes(opts.Scopes...)

	log.Debug("list work orders", zap.Any("sort", opts.SortOptions), zap.Any("paginate", opts.PaginateOptions))

	// 排序
	for _, f := range opts.SortOptions.Fields {
		tx = tx.Order(clause.OrderByColumn{Column: clause.Column{Name: f.Name}, Desc: f.Descending})
	}

	var c int64
	if err = tx.Count(&c).Error; err != nil {
		return
	}
	total = int(c)

	// 总数为 0，不需要再查询
	if c == 0 {
		return
	}

	if opts.Limit != 0 {
		tx = tx.Limit(opts.Limit)
	}
	if opts.Offset != 0 {
		tx = tx.Offset(opts.Offset)
	}
	if err = tx.Find(&orders).Error; err != nil {
		return
	}

	return
}

func (r *WorkOrderRepo) CreateFusionWorkOrderAndFusionTable(ctx context.Context, order *model.WorkOrder, extend *model.TWorkOrderExtend, fields []*model.TFusionField) error {
	return r.data.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(order).Error; err != nil {
			return err
		}
		if err := r.workOrderExtendRepo.Create(ctx, extend); err != nil {
			return err
		}

		if len(fields) != 0 {
			if err := r.fusionModelRepo.CreateInBatches(ctx, fields); err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *WorkOrderRepo) UpdateFusionWorkOrderFusionFieldsByWorkOrderID(ctx context.Context, extend *model.TWorkOrderExtend, fields []*model.TFusionField, userId string) error {
	return r.data.DB.Transaction(func(tx *gorm.DB) error {

		// 融合表名
		nameModel, err := r.workOrderExtendRepo.GetByWorkOrderIdAndExtendKey(ctx, extend.WorkOrderID, string(constant.FusionTableName))
		if err != nil {
			return err
		}
		if nameModel.ID > 0 {
			//if tableName != nameModel.ExtendValue {
			//修改融合表名称
			nameModel.ExtendValue = extend.ExtendValue
			nameModel.FusionType = extend.FusionType
			nameModel.ExecSQL = extend.ExecSQL
			nameModel.SceneAnalysisId = extend.SceneAnalysisId
			nameModel.DataSourceID = extend.DataSourceID
			nameModel.RunEndAt = extend.RunEndAt
			nameModel.RunStartAt = extend.RunStartAt
			nameModel.RunCronStrategy = extend.RunCronStrategy
			err = r.workOrderExtendRepo.Update(ctx, nameModel)
			if err != nil {
				return err
			}
			//}
		} else {
			//创建融合表名称
			err = r.workOrderExtendRepo.Create(ctx, &model.TWorkOrderExtend{
				WorkOrderID:     extend.WorkOrderID,
				ExtendKey:       string(constant.FusionTableName),
				ExtendValue:     extend.ExtendValue,
				FusionType:      extend.FusionType,
				ExecSQL:         extend.ExecSQL,
				SceneAnalysisId: extend.SceneAnalysisId,
				DataSourceID:    extend.DataSourceID,
				RunEndAt:        extend.RunEndAt,
				RunStartAt:      extend.RunStartAt,
				RunCronStrategy: extend.RunCronStrategy,
			})
			if err != nil {
				return err
			}
		}

		// 获取已存在的
		dbFields, err := r.fusionModelRepo.List(ctx, extend.WorkOrderID)
		if err != nil {
			return err
		}
		dbFieldMap := make(map[uint64]*model.TFusionField)
		for _, dbField := range dbFields {
			dbFieldMap[dbField.ID] = dbField
		}
		newFieldMap := make(map[uint64]*model.TFusionField)
		for _, field := range fields {
			newFieldMap[field.ID] = field
		}

		// 创建不存在的
		var toCreate []*model.TFusionField
		for _, f := range fields {
			if _, ok := dbFieldMap[f.ID]; !ok {
				toCreate = append(toCreate, f)
			}
		}
		log.Debug("create work order fusion fields", zap.Any("fields", toCreate))
		if len(toCreate) != 0 {
			if err := r.fusionModelRepo.CreateInBatches(ctx, toCreate); err != nil {
				return err
			}
		}

		// 更新已存在的
		for _, f := range fields {
			if _, ok := dbFieldMap[f.ID]; ok {
				log.Debug("update work order fusion field", zap.Any("field", f))
				if err := r.fusionModelRepo.Update(ctx, f); err != nil {
					return err
				}
			}
		}

		// 删除不需要再存在的
		deleteFieldIds := make([]uint64, 0)
		for _, dbField := range dbFields {
			if _, ok := newFieldMap[dbField.ID]; !ok {
				deleteFieldIds = append(deleteFieldIds, dbField.ID)
			}
		}
		err = r.fusionModelRepo.DeleteInBatches(ctx, deleteFieldIds, userId)
		if err != nil {
			return err
		}
		log.Debug("delete work order fusion fields", zap.Any("fields", deleteFieldIds))
		return nil
	})
}

// CreateQualityAuditWorkOrderAndFormViews 创建质量稽核工单，及相关的逻辑视图
func (r *WorkOrderRepo) CreateQualityAuditWorkOrderAndFormViews(ctx context.Context, order *model.WorkOrder, relations []*model.TQualityAuditFormViewRelation) error {
	return r.data.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(order).Error; err != nil {
			return err
		}
		return r.qualityAuditModelRepo.CreateInBatches(ctx, relations)
	})
}

func (r *WorkOrderRepo) CreateQualityAuditWorkOrderFormViews(ctx context.Context, relations []*model.TQualityAuditFormViewRelation) error {
	return r.data.DB.Transaction(func(tx *gorm.DB) error {
		return r.qualityAuditModelRepo.CreateInBatches(ctx, relations)
	})
}

// UpdateQualityAuditWorkOrderFormViewsByWorkOrderID 根据工单 ID 更新质量稽核工单关联的逻辑视图列表
func (r *WorkOrderRepo) UpdateQualityAuditWorkOrderFormViewsByWorkOrderID(ctx context.Context, workOrderId string, viewIds []string, userId string) error {
	return r.data.DB.Transaction(func(tx *gorm.DB) error {
		// 获取已存在的
		dbRelations, err := r.qualityAuditModelRepo.List(ctx, workOrderId)
		if err != nil {
			return err
		}
		log.Debug("get already existed work order form views", zap.Any("views", dbRelations))

		// 创建不存在的
		var toCreate []*model.TQualityAuditFormViewRelation
		timeNow := time.Now()
		for _, viewId := range viewIds {
			var existed bool
			for _, dbRelation := range dbRelations {
				if dbRelation.FormViewID == viewId {
					existed = true
					break
				}
			}
			if existed {
				continue
			}
			uniqueID, err := utilities.GetUniqueID()
			if err != nil {
				return errorcode.Detail(errorcode.InternalError, err)
			}
			toCreate = append(toCreate, &model.TQualityAuditFormViewRelation{
				ID:           uniqueID,
				WorkOrderID:  workOrderId,
				FormViewID:   viewId,
				CreatedByUID: userId,
				CreatedAt:    timeNow,
				UpdatedByUID: &userId,
				UpdatedAt:    &timeNow,
			})
		}
		log.Debug("create work order form views", zap.Any("views", toCreate))
		if len(toCreate) != 0 {
			if err := r.qualityAuditModelRepo.CreateInBatches(ctx, toCreate); err != nil {
				return err
			}
		}

		// 删除不需要再存在的
		var toDelete []uint64
		for _, dbRelation := range dbRelations {
			var existed bool
			for _, viewId := range viewIds {
				if dbRelation.FormViewID == viewId {
					existed = true
					break
				}
			}
			if existed {
				continue
			}
			toDelete = append(toDelete, dbRelation.ID)
		}
		log.Debug("delete work order form views", zap.Any("views", toDelete))
		if len(toDelete) != 0 {
			if err := r.qualityAuditModelRepo.DeleteByIds(ctx, toDelete, userId); err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *WorkOrderRepo) GetByWorkOrderIDs(ctx context.Context, workOrderIDs []string) ([]*model.WorkOrder, error) {
	res := make([]*model.WorkOrder, 0)
	err := r.data.DB.WithContext(ctx).Model(&model.WorkOrder{}).Where("work_order_id in ?", workOrderIDs).Find(&res).Error
	return res, err
}

func (r *WorkOrderRepo) GetFusionWorkOrderRelationCatalog(ctx context.Context, workOrderId string) (catalogIds []*uint64, fields []string, err error) {
	catalogIds = make([]*uint64, 0)
	err = r.data.DB.WithContext(ctx).Model(&model.TFusionField{}).Select("e_name").Where("work_order_id = ? and catalog_id is null", workOrderId).Find(&fields).Error
	if err != nil {
		return
	}
	err = r.data.DB.WithContext(ctx).Model(&model.TFusionField{}).Select("catalog_id").Where("work_order_id = ? and catalog_id is not null", workOrderId).Find(&catalogIds).Error
	return
}

func (r *WorkOrderRepo) GetAggregationForQualityAudit(ctx context.Context, req *domain.AggregationForQualityAuditListReq) (total int64, list []*model.WorkOrder, err error) {
	limit := req.Limit
	offset := limit * (req.Offset - 1)

	Db := r.data.DB.WithContext(ctx).Table("`work_order` as a").Select("distinct a.*").
		Joins("left join `work_order_tasks` b on a.`work_order_id` = b.`work_order_id`").
		Joins("left join `work_order` c on a.`work_order_id` = c.`source_id` and c.`type` = 6 and c.deleted_at = 0").
		Where("b.`work_order_id` is not null and c.source_id is null ").
		Where("a.`type` = 2 and a.`status` = 4 and a.department_id in ?", req.SubDepartmentIDs)

	if req.Keyword != "" {
		keyword := "%" + util.KeywordEscape(req.Keyword) + "%"
		Db = Db.Where("a.`name` like ? or a.`code` like ?", keyword, keyword)
	}

	err = Db.Group("a.work_order_id").Count(&total).Error
	if err != nil {
		return 0, nil, err
	}

	if total > 0 {
		var models []*model.WorkOrder
		if limit > 0 {
			Db = Db.Limit(limit).Offset(offset)
		}

		if req.Sort != "" && req.Direction != "" {
			Db = Db.Order(fmt.Sprintf("%s %s", req.Sort, req.Direction))
		}
		err = Db.Find(&models).Error
		if err != nil {
			return 0, nil, err
		}
		return total, models, nil

	}

	return 0, nil, nil
}
