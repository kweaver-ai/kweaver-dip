package work_order_template

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type repository struct {
	db *gorm.DB
}

func New(data *db.Data) Repository {
	return &repository{db: data.DB}
}

func (r *repository) Db() *gorm.DB {
	return r.db
}

// Create 创建工单模板
func (r *repository) Create(ctx context.Context, template *model.WorkOrderTemplate) error {
	return r.db.WithContext(ctx).Create(template).Error
}

// Get 根据ID获取工单模板
func (r *repository) Get(ctx context.Context, id int64) (*model.WorkOrderTemplate, error) {
	var template model.WorkOrderTemplate
	err := r.db.WithContext(ctx).Where("id = ? AND is_deleted = 0", id).First(&template).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &template, nil
}

// Update 更新工单模板
func (r *repository) Update(ctx context.Context, template *model.WorkOrderTemplate) error {
	return r.db.WithContext(ctx).Save(template).Error
}

// Delete 删除工单模板（逻辑删除）
func (r *repository) Delete(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Model(&model.WorkOrderTemplate{}).
		Where("id = ?", id).
		Update("is_deleted", 1).Error
}

// List 获取工单模板列表
func (r *repository) List(ctx context.Context, opts ListOptions) ([]model.WorkOrderTemplate, int64, error) {
	var templates []model.WorkOrderTemplate
	var total int64

	query := r.db.WithContext(ctx).Model(&model.WorkOrderTemplate{}).Where("is_deleted = 0")

	// 应用过滤条件
	if len(opts.TicketTypes) > 0 {
		query = query.Where("ticket_type IN ?", opts.TicketTypes)
	}
	if opts.Status != nil {
		query = query.Where("status = ?", *opts.Status)
	}
	if opts.IsBuiltin != nil {
		query = query.Where("is_builtin = ?", *opts.IsBuiltin)
	}
	if len(opts.Keyword) > 0 {
		query = query.Where("template_name LIKE ?", "%"+opts.Keyword+"%")
	}

	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if total == 0 {
		return []model.WorkOrderTemplate{}, 0, nil
	}

	// 排序：内置模板优先，然后按更新时间倒序
	query = query.Order("is_builtin DESC, updated_at DESC")

	// 应用分页
	if opts.Limit > 0 {
		query = query.Limit(opts.Limit)
		if opts.Offset > 0 {
			// 计算数据库偏移量：(页码 - 1) * 每页数量
			dbOffset := (opts.Offset - 1) * opts.Limit
			query = query.Offset(dbOffset)
		}
	}

	if err := query.Find(&templates).Error; err != nil {
		return nil, 0, err
	}

	return templates, total, nil
}

// GetActiveByTicketType 根据工单类型获取启用的模板
func (r *repository) GetActiveByTicketType(ctx context.Context, ticketType string) (*model.WorkOrderTemplate, error) {
	var template model.WorkOrderTemplate
	err := r.db.WithContext(ctx).
		Where("ticket_type = ? AND status = 1 AND is_deleted = 0", ticketType).
		First(&template).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &template, nil
}

// DisableByTicketType 停用指定工单类型的所有模板
func (r *repository) DisableByTicketType(ctx context.Context, ticketType string) error {
	return r.db.WithContext(ctx).Model(&model.WorkOrderTemplate{}).
		Where("ticket_type = ? AND is_deleted = 0", ticketType).
		Update("status", 0).Error
}

// UpdateStatus 更新模板状态
func (r *repository) UpdateStatus(ctx context.Context, id int64, status int32) error {
	return r.db.WithContext(ctx).Model(&model.WorkOrderTemplate{}).
		Where("id = ? AND is_deleted = 0", id).
		Update("status", status).Error
}

// DisableOthersByTicketType 停用指定工单类型下除指定ID外的所有模板
func (r *repository) DisableOthersByTicketType(ctx context.Context, ticketType string, excludeID int64) error {
	return r.db.WithContext(ctx).Model(&model.WorkOrderTemplate{}).
		Where("ticket_type = ? AND id != ? AND is_deleted = 0", ticketType, excludeID).
		Update("status", 0).Error
}

// CheckNameExists 检查模板名称是否存在
func (r *repository) CheckNameExists(ctx context.Context, templateName string, excludeID int64) (bool, error) {
	var count int64
	query := r.db.WithContext(ctx).Model(&model.WorkOrderTemplate{}).
		Where("template_name = ? AND is_deleted = 0", templateName)

	if excludeID > 0 {
		query = query.Where("id != ?", excludeID)
	}

	err := query.Count(&count).Error
	return count > 0, err
}

// ErrNotFound 记录未找到错误
var ErrNotFound = errors.New("work order template not found")
