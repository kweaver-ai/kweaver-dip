package work_order_manage

import (
	"context"
	"errors"
	"fmt"

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
func (r *repository) Create(ctx context.Context, template *model.WorkOrderManageTemplate) error {
	return r.db.WithContext(ctx).Create(template).Error
}

// Get 根据ID获取工单模板
func (r *repository) Get(ctx context.Context, id uint64) (*model.WorkOrderManageTemplate, error) {
	var template model.WorkOrderManageTemplate
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
func (r *repository) Update(ctx context.Context, template *model.WorkOrderManageTemplate) error {
	return r.db.WithContext(ctx).Save(template).Error
}

// Delete 删除工单模板（逻辑删除）
func (r *repository) Delete(ctx context.Context, id uint64) error {
	return r.db.WithContext(ctx).Model(&model.WorkOrderManageTemplate{}).
		Where("id = ?", id).
		Update("is_deleted", 1).Error
}

// List 获取工单模板列表
func (r *repository) List(ctx context.Context, opts ListOptions) ([]model.WorkOrderManageTemplate, int64, error) {
	var templates []model.WorkOrderManageTemplate
	var total int64

	query := r.db.WithContext(ctx).Model(&model.WorkOrderManageTemplate{}).Where("is_deleted = 0")

	// 应用过滤条件
	if len(opts.TemplateName) > 0 {
		query = query.Where("template_name LIKE ?", "%"+opts.TemplateName+"%")
	}
	if len(opts.TemplateType) > 0 {
		query = query.Where("template_type = ?", opts.TemplateType)
	}
	if opts.IsActive != nil {
		query = query.Where("is_active = ?", *opts.IsActive)
	}
	if len(opts.Keyword) > 0 {
		query = query.Where("(template_name LIKE ? OR description LIKE ?)", "%"+opts.Keyword+"%", "%"+opts.Keyword+"%")
	}

	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if total == 0 {
		return []model.WorkOrderManageTemplate{}, 0, nil
	}

	// 排序：按更新时间倒序
	query = query.Order("updated_at DESC")

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

// CheckNameExists 检查模板名称是否存在
func (r *repository) CheckNameExists(ctx context.Context, templateName string, excludeID uint64) (bool, error) {
	var count int64
	query := r.db.WithContext(ctx).Model(&model.WorkOrderManageTemplate{}).
		Where("template_name = ? AND is_deleted = 0", templateName)

	if excludeID > 0 {
		query = query.Where("id != ?", excludeID)
	}

	err := query.Count(&count).Error
	return count > 0, err
}

// CheckReferenceCount 检查模板是否被引用
func (r *repository) CheckReferenceCount(ctx context.Context, id uint64) (int64, error) {
	var template model.WorkOrderManageTemplate
	err := r.db.WithContext(ctx).Select("reference_count").
		Where("id = ? AND is_deleted = 0", id).
		First(&template).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, ErrNotFound
		}
		return 0, err
	}
	return template.ReferenceCount, nil
}

// CreateVersion 创建历史版本
func (r *repository) CreateVersion(ctx context.Context, version *model.WorkOrderManageTemplateVersion) error {
	return r.db.WithContext(ctx).Create(version).Error
}

// ListVersions 获取历史版本列表
func (r *repository) ListVersions(ctx context.Context, templateID uint64, opts ListVersionsOptions) ([]model.WorkOrderManageTemplateVersion, int64, error) {
	var versions []model.WorkOrderManageTemplateVersion
	var total int64

	query := r.db.WithContext(ctx).Model(&model.WorkOrderManageTemplateVersion{}).
		Where("template_id = ?", templateID)

	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if total == 0 {
		return []model.WorkOrderManageTemplateVersion{}, 0, nil
	}

	// 排序：按版本号倒序（最新版本在前）
	query = query.Order("version DESC")

	// 应用分页
	if opts.Limit > 0 {
		query = query.Limit(opts.Limit)
		if opts.Offset > 0 {
			dbOffset := (opts.Offset - 1) * opts.Limit
			query = query.Offset(dbOffset)
		}
	}

	if err := query.Find(&versions).Error; err != nil {
		return nil, 0, err
	}

	return versions, total, nil
}

// GetVersion 获取指定版本详情
func (r *repository) GetVersion(ctx context.Context, templateID uint64, version int) (*model.WorkOrderManageTemplateVersion, error) {
	var versionRecord model.WorkOrderManageTemplateVersion
	err := r.db.WithContext(ctx).
		Where("template_id = ? AND version = ?", templateID, version).
		First(&versionRecord).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrVersionNotFound
		}
		return nil, err
	}
	return &versionRecord, nil
}

// GetMaxVersion 获取模板的最大版本号
func (r *repository) GetMaxVersion(ctx context.Context, templateID uint64) (int, error) {
	var maxVersion int
	err := r.db.WithContext(ctx).Model(&model.WorkOrderManageTemplateVersion{}).
		Where("template_id = ?", templateID).
		Select("COALESCE(MAX(version), 0)").
		Scan(&maxVersion).Error
	if err != nil {
		return 0, err
	}
	return maxVersion, nil
}

// ErrNotFound 记录未找到错误
var ErrNotFound = errors.New("work order manage template not found")

// ErrVersionNotFound 版本未找到错误
var ErrVersionNotFound = errors.New("work order manage template version not found")

// ErrResourceInUse 资源正在使用中错误
var ErrResourceInUse = fmt.Errorf("work order manage template is in use")
