package work_order_task

import (
	"context"
	"fmt"

	"github.com/samber/lo"
	"go.uber.org/zap"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type repository struct {
	db *gorm.DB
}

func New(data *db.Data) Repository { return &repository{db: data.DB} }

func (r *repository) Db() *gorm.DB {
	return r.db
}

func (r *repository) do(tx []*gorm.DB) *gorm.DB {
	if len(tx) > 0 && tx[0] != nil {
		return tx[0]
	}
	return r.db
}

// Create 创建工单任务
func (r *repository) Create(ctx context.Context, task *model.WorkOrderTask) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 创建工单任务与工单类型无关的公共部分
		if err := Create(tx, task); err != nil {
			return err
		}
		// 创建工单类型对应的任务详情
		if err := CreateWorkOrderTaskTypedDetail(tx, &task.WorkOrderTaskTypedDetail); err != nil {
			return err
		}
		return nil
	})
}

// Get 根据 ID 获取工单任务
func (r *repository) Get(ctx context.Context, id string) (task *model.WorkOrderTask, err error) {
	if err = r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) (err error) {
		// 获取工单任务与工单类型无关的公共部分
		if task, err = Get(tx, id); err != nil {
			return
		}
		// 获取工单任务所属工单
		order, err := GetWorkOrder(tx, task.WorkOrderID)
		if err != nil {
			return
		}
		// 获取工单类型对应的任务详情
		switch order.Type {
		// 数据理解
		case work_order.WorkOrderTypeDataComprehension.Integer.Int32():
			task.DataComprehension = new(model.WorkOrderDataComprehensionDetail)
			return tx.Take(task.DataComprehension, "id = ?", task.ID).Error
		// 数据归集
		case work_order.WorkOrderTypeDataAggregation.Integer.Int32():
			return tx.Find(&task.DataAggregation, "id = ?", task.ID).Error
		// 数据融合
		case work_order.WorkOrderTypeDataFusion.Integer.Int32():
			task.DataFusion = new(model.WorkOrderDataFusionDetail)
			return tx.Take(task.DataFusion, "id = ?", task.ID).Error
		// 数据质量
		case work_order.WorkOrderTypeDataQuality.Integer.Int32():
			task.DataQuality = new(model.WorkOrderDataQualityDetail)
			return tx.Take(task.DataQuality, "id = ?", task.ID).Error
		// 数据质量稽核
		case work_order.WorkOrderTypeDataQualityAudit.Integer.Int32():
			task.DataQualityAudit = make([]*model.WorkOrderDataQualityAuditDetail, 0)
			return tx.Where("work_order_id = ?", task.ID).Find(&task.DataQualityAudit).Error
		default:
			return fmt.Errorf("unsupported work order type: %v", order.Type)
		}
	}); err != nil {
		task = nil
	}
	return
}

// Update 更新工单任务
func (r *repository) Update(ctx context.Context, task *model.WorkOrderTask) (err error) {
	if err = r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) (err error) {
		// 获取已经存在的工单任务
		got, err := Get(tx, task.ID)
		if err != nil {
			return
		}

		// 补充工单任务的 CreatedAt
		task.CreatedAt = got.CreatedAt

		// 更新工单任务与工单类型无关的公共部分
		if err = Update(tx, task); err != nil {
			return
		}
		// 获取工单任务所属工单
		order, err := GetWorkOrder(tx, task.WorkOrderID)
		if err != nil {
			return
		}
		// 更新工单类型对应的任务详情
		switch order.Type {
		// 数据理解
		case work_order.WorkOrderTypeDataComprehension.Integer.Int32():
			return tx.Save(task.DataComprehension).Error
		// 数据归集
		case work_order.WorkOrderTypeDataAggregation.Integer.Int32():
			return tx.Save(task.DataAggregation).Error
		// 数据融合
		case work_order.WorkOrderTypeDataFusion.Integer.Int32():
			return tx.Save(task.DataFusion).Error
		// 数据质量
		case work_order.WorkOrderTypeDataQuality.Integer.Int32():
			return tx.Save(task.DataQuality).Error
		// 数据质量稽核
		case work_order.WorkOrderTypeDataQualityAudit.Integer.Int32():
			return tx.Save(task.DataQualityAudit).Error
		default:
			return fmt.Errorf("unsupported work order type: %v", order.Type)
		}
	}); err != nil {
		task = nil
	}
	return
}

// Count 获取数量
func (r *repository) Count(ctx context.Context, scopes ...func(*gorm.DB) *gorm.DB) (int, error) {
	var c int64
	if err := r.db.WithContext(ctx).Model(&model.WorkOrderTask{}).Scopes(scopes...).Count(&c).Error; err != nil {
		return 0, err
	}
	return int(c), nil
}

// List  获取列表
func (r *repository) List(ctx context.Context, opts ListOptions) (records []model.WorkOrderTask, total int64, err error) {
	log.Debug("list work order tasks", zap.Any("opts", opts))

	tx := r.db.WithContext(ctx).Model(&model.WorkOrderTask{})
	for _, s := range opts.Scopes {
		tx = s.Scope(tx)
	}

	if err = tx.Count(&total).Error; err != nil {
		return
	}

	if total == 0 {
		return
	}

	for _, c := range opts.OrderBy {
		tx = tx.Order(clause.OrderByColumn{
			Column: clause.Column{
				Table: model.TableNameWorkOrderTasks,
				Name:  c.Column,
			},
			Desc: c.Descending,
		})
	}

	if opts.Limit != 0 {
		tx = tx.Limit(opts.Limit)
		if opts.Offset != 0 {
			tx = tx.Offset(opts.Offset)
		}
	}

	tx = tx.Debug()
	if err = tx.Find(&records).Error; err != nil {
		return
	}

	for i := range records {
		tx := r.db.WithContext(ctx)
		// 获取工单任务所属工单
		order, err := GetWorkOrder(tx, records[i].WorkOrderID)
		if err != nil {
			log.Warn("get work order of work order task", zap.Any("task", records[i]))
			continue
		}

		// 获取工单类型对应的任务详情
		switch order.Type {
		// 数据理解
		case work_order.WorkOrderTypeDataComprehension.Integer.Int32():
			records[i].DataComprehension = new(model.WorkOrderDataComprehensionDetail)
			if err := tx.Take(records[i].DataComprehension, "id = ?", records[i].ID).Error; err != nil {
				log.Warn("get data comprehension work order task detail fail", zap.Error(err), zap.Any("task", records[i]))
			}
		// 数据归集
		case work_order.WorkOrderTypeDataAggregation.Integer.Int32():
			if err := tx.Find(&records[i].DataAggregation, "id = ?", records[i].ID).Error; err != nil {
				log.Warn("get data aggregation work order task detail fail", zap.Error(err), zap.Any("task", records[i]))
			}
		// 数据融合
		case work_order.WorkOrderTypeDataFusion.Integer.Int32():
			records[i].DataFusion = new(model.WorkOrderDataFusionDetail)
			if err := tx.Take(records[i].DataFusion, "id = ?", records[i].ID).Error; err != nil {
				log.Warn("get data fusion work order task detail fail", zap.Error(err), zap.Any("task", records[i]))
			}
		// 数据质量
		case work_order.WorkOrderTypeDataQuality.Integer.Int32():
			records[i].DataQuality = new(model.WorkOrderDataQualityDetail)
			if err := tx.Take(records[i].DataQuality, "id = ?", records[i].ID).Error; err != nil {
				log.Warn("get data quality work order task detail fail", zap.Error(err), zap.Any("task", records[i]))
			}
		// 数据质量稽核
		case work_order.WorkOrderTypeDataQualityAudit.Integer.Int32():
			records[i].DataQualityAudit = make([]*model.WorkOrderDataQualityAuditDetail, 0)
			if err := tx.Where("work_order_id = ?", records[i].ID).Find(&records[i].DataQualityAudit).Error; err != nil {
				log.Warn("get data quality audit work order task detail fail", zap.Error(err), zap.Any("task", records[i]))
			}
		default:
			log.Warn("unsupported work order type", zap.Any("task", records[i]))
		}
	}

	return
}

// 获取列表，根据所属工单过滤
func (r *repository) ListByWorkOrderID(ctx context.Context, id string, limit int, offset int) (tasks []model.WorkOrderTask, count int64, err error) {
	tx := r.db.WithContext(ctx).
		Model(&model.WorkOrderTask{}).
		Where(&model.WorkOrderTask{WorkOrderID: id}).
		Count(&count)
	if err = tx.Error; err != nil {
		return
	}

	if err = tx.Limit(limit).
		Offset(offset).
		Find(&tasks).
		Error; err != nil {
		return
	}

	for i := range tasks {
		tx := r.db.WithContext(ctx)
		// 获取工单任务所属工单
		order, err := GetWorkOrder(tx, tasks[i].WorkOrderID)
		if err != nil {
			log.Warn("get work order of work order task", zap.Any("task", tasks[i]))
			continue
		}

		// 获取工单类型对应的任务详情
		switch order.Type {
		// 数据理解
		case work_order.WorkOrderTypeDataComprehension.Integer.Int32():
			tasks[i].DataComprehension = new(model.WorkOrderDataComprehensionDetail)
			if err := tx.Take(tasks[i].DataComprehension, "id = ?", tasks[i].ID).Error; err != nil {
				log.Warn("get data comprehension work order task detail fail", zap.Error(err), zap.Any("task", tasks[i]))
			}
		// 数据归集
		case work_order.WorkOrderTypeDataAggregation.Integer.Int32():
			if err := tx.Find(&tasks[i].DataAggregation, "id = ?", tasks[i].ID).Error; err != nil {
				log.Warn("get data aggregation work order task detail fail", zap.Error(err), zap.Any("task", tasks[i]))
			}
		// 数据融合
		case work_order.WorkOrderTypeDataFusion.Integer.Int32():
			tasks[i].DataFusion = new(model.WorkOrderDataFusionDetail)
			if err := tx.Take(tasks[i].DataFusion, "id = ?", tasks[i].ID).Error; err != nil {
				log.Warn("get data fusion work order task detail fail", zap.Error(err), zap.Any("task", tasks[i]))
			}
		// 数据质量
		case work_order.WorkOrderTypeDataQuality.Integer.Int32():
			tasks[i].DataQuality = new(model.WorkOrderDataQualityDetail)
			if err := tx.Take(tasks[i].DataQuality, "id = ?", tasks[i].ID).Error; err != nil {
				log.Warn("get data quality work order task detail fail", zap.Error(err), zap.Any("task", tasks[i]))
			}
		// 数据质量稽核
		case work_order.WorkOrderTypeDataQualityAudit.Integer.Int32():
			tasks[i].DataQualityAudit = make([]*model.WorkOrderDataQualityAuditDetail, 0)
			if err := tx.Where("work_order_id = ?", tasks[i].ID).Find(&tasks[i].DataQualityAudit).Error; err != nil {
				log.Warn("get data quality audit work order task detail fail", zap.Error(err), zap.Any("task", tasks[i]))
			}
		default:
			log.Warn("unsupported work order type", zap.Any("task", tasks[i]))
		}
	}

	return
}

func (r *repository) ListByWorkOrderIDs(ctx context.Context, workOrderIds []string) (tasks []model.WorkOrderTask, err error) {
	err = r.db.WithContext(ctx).
		Model(&model.WorkOrderTask{}).
		Where("work_order_id in ?", workOrderIds).
		Find(&tasks).
		Error

	for i := range tasks {
		tx := r.db.WithContext(ctx)
		// 获取工单任务所属工单
		order, err := GetWorkOrder(tx, tasks[i].WorkOrderID)
		if err != nil {
			log.Warn("get work order of work order task", zap.Any("task", tasks[i]))
			continue
		}

		// 获取工单类型对应的任务详情
		switch order.Type {
		// 数据理解
		case work_order.WorkOrderTypeDataComprehension.Integer.Int32():
			tasks[i].DataComprehension = new(model.WorkOrderDataComprehensionDetail)
			if err := tx.Take(tasks[i].DataComprehension, "id = ?", tasks[i].ID).Error; err != nil {
				log.Warn("get data comprehension work order task detail fail", zap.Error(err), zap.Any("task", tasks[i]))
			}
		// 数据归集
		case work_order.WorkOrderTypeDataAggregation.Integer.Int32():
			tasks[i].DataAggregation = make([]model.WorkOrderDataAggregationDetail, 0)
			if err := tx.Find(&tasks[i].DataAggregation, "id = ?", tasks[i].ID).Error; err != nil {
				log.Warn("get data aggregation work order task detail fail", zap.Error(err), zap.Any("task", tasks[i]))
			}
		// 数据融合
		case work_order.WorkOrderTypeDataFusion.Integer.Int32():
			tasks[i].DataFusion = new(model.WorkOrderDataFusionDetail)
			if err := tx.Take(tasks[i].DataFusion, "id = ?", tasks[i].ID).Error; err != nil {
				log.Warn("get data fusion work order task detail fail", zap.Error(err), zap.Any("task", tasks[i]))
			}
		// 数据质量
		case work_order.WorkOrderTypeDataQuality.Integer.Int32():
			tasks[i].DataQuality = new(model.WorkOrderDataQualityDetail)
			if err := tx.Take(tasks[i].DataQuality, "id = ?", tasks[i].ID).Error; err != nil {
				log.Warn("get data quality work order task detail fail", zap.Error(err), zap.Any("task", tasks[i]))
			}
		// 数据质量稽核
		case work_order.WorkOrderTypeDataQualityAudit.Integer.Int32():
			tasks[i].DataQualityAudit = make([]*model.WorkOrderDataQualityAuditDetail, 0)
			if err := tx.Where("work_order_id = ?", tasks[i].ID).Find(&tasks[i].DataQualityAudit).Error; err != nil {
				log.Warn("get data quality audit work order task detail fail", zap.Error(err), zap.Any("task", tasks[i]))
			}
		default:
			log.Warn("unsupported work order type", zap.Any("task", tasks[i]))
		}
	}
	return
}

// 批量创建工单任务
func (r *repository) BatchCreate(ctx context.Context, tasks []model.WorkOrderTask) error {
	// 工单任务 ID 列表
	var ids []string = lo.Map(tasks, func(item model.WorkOrderTask, _ int) string { return item.ID })

	var result []model.WorkOrderTask
	if err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(tasks).Error; err != nil {
			return err
		}

		// 创建工单任务的详情
		for _, t := range tasks {
			if err := CreateWorkOrderTaskTypedDetail(tx, &t.WorkOrderTaskTypedDetail); err != nil {
				return err
			}
		}

		// Mariadb 10.4 不支持 INSERT INTO ... RETURN ... 所以在插入数据后，再根
		// 据 ID 查询
		if err := tx.Where(clause.IN{Column: "id", Values: lo.ToAnySlice(ids)}).Find(&result).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		return err
	}

	return nil
}

// 批量更新工单任务
func (r *repository) BatchUpdate(ctx context.Context, tasks []model.WorkOrderTask) error {
	// 工单 ID 列表
	var ids []string = lo.Map(tasks, func(item model.WorkOrderTask, _ int) string { return item.ID })

	var result []model.WorkOrderTask
	if err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, t := range tasks {
			if err := tx.Updates(t).Error; err != nil {
				return err
			}
		}

		// 更新工单任务的详情
		for _, t := range tasks {
			if err := UpdateWorkOrderTaskTypedDetail(tx, &t.WorkOrderTaskTypedDetail); err != nil {
				return err
			}
		}
		// Mariadb 10.4 不支持 UPDATE ... RETURN ... 所以在更新数据后，再根据 ID
		// 查询
		if err := tx.Where(clause.IN{Column: "id", Values: lo.ToAnySlice(ids)}).Find(&result).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		return err
	}

	return nil
}

func (r *repository) GetDataAggregationTasks(ctx context.Context, formName string) (tasks []*model.WorkOrderTask, err error) {
	var taskIds []string
	err = r.db.WithContext(ctx).
		Model(&model.WorkOrderDataAggregationDetail{}).
		Select("id").
		Where("target_table_name =  ?", formName).
		Find(&taskIds).
		Error
	err = r.db.WithContext(ctx).
		Model(&model.WorkOrderTask{}).
		Where("id in ?", taskIds).
		Find(&tasks).
		Error
	return
}

func (r *repository) GetDataQualityAuditTasks(ctx context.Context, formName string) (tasks []*model.WorkOrderTask, err error) {
	var taskIds []string
	err = r.db.WithContext(ctx).
		Model(&model.WorkOrderDataQualityAuditDetail{}).
		Select("work_order_id").
		Where("data_table =  ?", formName).
		Find(&taskIds).
		Error
	err = r.db.WithContext(ctx).
		Model(&model.WorkOrderTask{}).
		Where("id in ?", taskIds).
		Find(&tasks).
		Error
	return
}

func (r *repository) GetDataFusionTasks(ctx context.Context, formName string) (tasks []*model.WorkOrderTask, err error) {
	var taskIds []string
	err = r.db.WithContext(ctx).
		Model(&model.WorkOrderDataFusionDetail{}).
		Select("id").
		Where("data_table =  ?", formName).
		Find(&taskIds).
		Error
	err = r.db.WithContext(ctx).
		Model(&model.WorkOrderTask{}).
		Where("id in ?", taskIds).
		Find(&tasks).
		Error
	return
}

func (r *repository) GetDataAggregationDetails(ctx context.Context, formName string) (details []*model.WorkOrderDataAggregationDetail, err error) {
	err = r.db.WithContext(ctx).
		Model(&model.WorkOrderDataAggregationDetail{}).
		Where("target_table_name =  ?", formName).
		Find(&details).
		Error
	return
}

func (r *repository) GetByFormNames(ctx context.Context, formNames []string) (details []*model.WorkOrderDataAggregationDetail, err error) {
	err = r.db.WithContext(ctx).
		Model(&model.WorkOrderDataAggregationDetail{}).
		Where("target_table_name in  ?", formNames).
		Find(&details).
		Error
	return
}

func (r *repository) GetTaskByIds(ctx context.Context, ids []string) (tasks []*model.WorkOrderTask, err error) {
	err = r.db.WithContext(ctx).
		Model(&model.WorkOrderTask{}).
		Where("id in ?", ids).
		Find(&tasks).
		Error
	return
}
