package work_order_manage

import (
	"context"
	"encoding/json"
	"errors"
	"strconv"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/user"
	work_order_manage_repo "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order_manage"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type domain struct {
	repo work_order_manage_repo.Repository
	user user.IUserRepo
}

func New(repo work_order_manage_repo.Repository, userRepo user.IUserRepo) Domain {
	return &domain{repo: repo, user: userRepo}
}

// Create 创建工单模板
func (d *domain) Create(ctx context.Context, req *CreateRequest) (*CreateResponse, error) {
	// 验证模板类型
	if !IsValidTemplateType(req.TemplateType) {
		return nil, errorcode.Desc(errorcode.PublicInvalidParameter)
	}

	// 检查模板名称是否已存在
	exists, err := d.repo.CheckNameExists(ctx, req.TemplateName, 0)
	if err != nil {
		return nil, errorcode.NewPublicDatabaseError(err)
	}
	if exists {
		return nil, errorcode.Desc(errorcode.TemplateNameExisted)
	}

	// 验证 content 是否为有效的 JSON
	if !json.Valid(req.Content) {
		return nil, errorcode.Desc(errorcode.PublicInvalidParameter)
	}

	// 创建新模板
	now := time.Now()
	template := &model.WorkOrderManageTemplate{
		TemplateName:   req.TemplateName,
		TemplateType:   req.TemplateType,
		Description:    req.Description,
		Content:        req.Content,
		Version:        1, // 初始版本为1
		IsActive:       1, // 默认启用
		ReferenceCount: 0,
		CreatedAt:      now,
		CreatedBy:      req.CreatedBy,
		UpdatedAt:      now,
		UpdatedBy:      req.CreatedBy,
		IsDeleted:      0,
	}

	if err := d.repo.Create(ctx, template); err != nil {
		return nil, errorcode.NewPublicDatabaseError(err)
	}

	// 创建第一个历史版本记录
	versionRecord := &model.WorkOrderManageTemplateVersion{
		TemplateID:   template.ID,
		Version:      1,
		TemplateName: template.TemplateName,
		TemplateType: template.TemplateType,
		Description:  template.Description,
		Content:      template.Content,
		CreatedAt:    now,
		CreatedBy:    template.CreatedBy,
	}

	if err := d.repo.CreateVersion(ctx, versionRecord); err != nil {
		return nil, errorcode.NewPublicDatabaseError(err)
	}

	return &CreateResponse{
		ID: strconv.FormatUint(template.ID, 10),
	}, nil
}

// Update 更新工单模板
func (d *domain) Update(ctx context.Context, id uint64, req *UpdateRequest) (*UpdateResponse, error) {
	// 获取现有模板
	template, err := d.repo.Get(ctx, id)
	if err != nil {
		if errors.Is(err, work_order_manage_repo.ErrNotFound) {
			return nil, errorcode.Desc(errorcode.PublicResourceNotFound)
		}
		return nil, errorcode.NewPublicDatabaseError(err)
	}

	// 检查是否需要创建新版本（修改了 content）
	needCreateVersion := len(req.Content) > 0 && json.Valid(req.Content) && string(template.Content) != string(req.Content)

	// 先更新所有字段（包括 TemplateName 和 Description），确保版本记录中的信息是最新的
	if req.TemplateName != nil {
		template.TemplateName = *req.TemplateName
	}
	if req.Description != nil {
		template.Description = *req.Description
	}
	if req.IsActive != nil {
		template.IsActive = *req.IsActive
	}

	// 如果修改了 content，需要创建新版本
	if needCreateVersion {
		// 版本号递增
		template.Version++
		template.Content = req.Content

		// 创建新版本的历史版本记录（保存更新后的完整信息，包括新的 content、TemplateName、Description）
		versionRecord := &model.WorkOrderManageTemplateVersion{
			TemplateID:   id,
			Version:      template.Version,
			TemplateName: template.TemplateName, // 使用更新后的名称
			TemplateType: template.TemplateType, // 模板类型保持不变
			Description:  template.Description,  // 使用更新后的描述
			Content:      template.Content,      // 新的内容
			CreatedAt:    time.Now(),
			CreatedBy:    req.UpdatedBy,
		}

		if err := d.repo.CreateVersion(ctx, versionRecord); err != nil {
			return nil, errorcode.NewPublicDatabaseError(err)
		}
	}

	// 更新主表
	template.UpdatedAt = time.Now()
	template.UpdatedBy = req.UpdatedBy

	if err := d.repo.Update(ctx, template); err != nil {
		return nil, errorcode.NewPublicDatabaseError(err)
	}

	return &UpdateResponse{
		ID: strconv.FormatUint(template.ID, 10),
	}, nil
}

// Delete 删除工单模板
func (d *domain) Delete(ctx context.Context, id uint64) (*DeleteResponse, error) {
	// 检查模板是否存在
	template, err := d.repo.Get(ctx, id)
	if err != nil {
		if errors.Is(err, work_order_manage_repo.ErrNotFound) {
			return nil, errorcode.Desc(errorcode.PublicResourceNotFound)
		}
		return nil, errorcode.NewPublicDatabaseError(err)
	}

	// 检查是否被引用
	referenceCount, err := d.repo.CheckReferenceCount(ctx, id)
	if err != nil {
		return nil, errorcode.NewPublicDatabaseError(err)
	}
	if referenceCount > 0 {
		// 使用 New 方法创建自定义错误
		return nil, errorcode.New("data-catalog.Public.ResourceInUse", "资源正在使用中", "该工单模板已被引用，无法删除", "请先解除模板的引用关系后再删除", nil, "")
	}

	// 逻辑删除
	if err := d.repo.Delete(ctx, id); err != nil {
		return nil, errorcode.NewPublicDatabaseError(err)
	}

	return &DeleteResponse{
		ID: strconv.FormatUint(template.ID, 10),
	}, nil
}

// Get 获取工单模板详情
func (d *domain) Get(ctx context.Context, id uint64) (*TemplateResponse, error) {
	template, err := d.repo.Get(ctx, id)
	if err != nil {
		if errors.Is(err, work_order_manage_repo.ErrNotFound) {
			return nil, errorcode.Desc(errorcode.PublicResourceNotFound)
		}
		return nil, errorcode.NewPublicDatabaseError(err)
	}

	// 获取创建者和更新者名称
	createdByName, updatedByName := d.getUserNames(ctx, template.CreatedBy, template.UpdatedBy)

	return &TemplateResponse{
		ID:             strconv.FormatUint(template.ID, 10),
		TemplateName:   template.TemplateName,
		TemplateType:   template.TemplateType,
		Description:    template.Description,
		Version:        template.Version,
		IsActive:       template.IsActive,
		ReferenceCount: template.ReferenceCount,
		CreatedAt:      template.CreatedAt.Unix(),
		CreatedBy:      template.CreatedBy,
		CreatedByName:  createdByName,
		UpdatedAt:      template.UpdatedAt.Unix(),
		UpdatedBy:      template.UpdatedBy,
		UpdatedByName:  updatedByName,
		Content:        template.Content,
	}, nil
}

// List 获取工单模板列表
func (d *domain) List(ctx context.Context, req *ListRequest) (*ListResponse, error) {
	// 设置默认分页参数
	if req.Limit <= 0 {
		req.Limit = 10
	}
	if req.Offset <= 0 {
		req.Offset = 1
	}

	opts := work_order_manage_repo.ListOptions{
		Limit:        req.Limit,
		Offset:       req.Offset,
		TemplateName: req.TemplateName,
		TemplateType: req.TemplateType,
		IsActive:     req.IsActive,
		Keyword:      req.Keyword,
	}

	templates, total, err := d.repo.List(ctx, opts)
	if err != nil {
		return nil, errorcode.NewPublicDatabaseError(err)
	}

	// 转换为响应格式
	items := make([]TemplateResponse, len(templates))
	for i, template := range templates {
		// 获取创建者和更新者名称
		createdByName, updatedByName := d.getUserNames(ctx, template.CreatedBy, template.UpdatedBy)
		items[i] = TemplateResponse{
			ID:             strconv.FormatUint(template.ID, 10),
			TemplateName:   template.TemplateName,
			TemplateType:   template.TemplateType,
			Description:    template.Description,
			Version:        template.Version,
			IsActive:       template.IsActive,
			ReferenceCount: template.ReferenceCount,
			CreatedAt:      template.CreatedAt.Unix(),
			CreatedBy:      template.CreatedBy,
			CreatedByName:  createdByName,
			UpdatedAt:      template.UpdatedAt.Unix(),
			UpdatedBy:      template.UpdatedBy,
			UpdatedByName:  updatedByName,
			Content:        template.Content,
		}
	}

	return &ListResponse{
		Entries:    items,
		TotalCount: total,
	}, nil
}

// ListVersions 获取工单模板历史版本列表
func (d *domain) ListVersions(ctx context.Context, templateID uint64, req *ListVersionsRequest) (*ListVersionsResponse, error) {
	// 设置默认分页参数
	if req.Limit <= 0 {
		req.Limit = 10
	}
	if req.Offset <= 0 {
		req.Offset = 1
	}

	opts := work_order_manage_repo.ListVersionsOptions{
		Limit:  req.Limit,
		Offset: req.Offset,
	}

	versions, total, err := d.repo.ListVersions(ctx, templateID, opts)
	if err != nil {
		return nil, errorcode.NewPublicDatabaseError(err)
	}

	// 转换为响应格式
	items := make([]VersionResponse, len(versions))
	for i, version := range versions {
		// 获取创建者名称
		createdByName, _ := d.getUserNames(ctx, version.CreatedBy, "")
		items[i] = VersionResponse{
			ID:            strconv.FormatUint(version.ID, 10),
			TemplateID:    strconv.FormatUint(version.TemplateID, 10),
			Version:       version.Version,
			TemplateName:  version.TemplateName,
			TemplateType:  version.TemplateType,
			Description:   version.Description,
			CreatedAt:     version.CreatedAt.Unix(),
			CreatedBy:     version.CreatedBy,
			CreatedByName: createdByName,
			Content:       version.Content,
		}
	}

	return &ListVersionsResponse{
		Entries:    items,
		TotalCount: total,
	}, nil
}

// GetVersion 获取工单模板历史版本详情
func (d *domain) GetVersion(ctx context.Context, templateID uint64, version int) (*VersionResponse, error) {
	versionRecord, err := d.repo.GetVersion(ctx, templateID, version)
	if err != nil {
		if errors.Is(err, work_order_manage_repo.ErrVersionNotFound) {
			return nil, errorcode.Desc(errorcode.PublicResourceNotFound)
		}
		return nil, errorcode.NewPublicDatabaseError(err)
	}

	// 获取创建者名称
	createdByName, _ := d.getUserNames(ctx, versionRecord.CreatedBy, "")

	return &VersionResponse{
		ID:            strconv.FormatUint(versionRecord.ID, 10),
		TemplateID:    strconv.FormatUint(versionRecord.TemplateID, 10),
		Version:       versionRecord.Version,
		TemplateName:  versionRecord.TemplateName,
		TemplateType:  versionRecord.TemplateType,
		Description:   versionRecord.Description,
		CreatedAt:     versionRecord.CreatedAt.Unix(),
		CreatedBy:     versionRecord.CreatedBy,
		CreatedByName: createdByName,
		Content:       versionRecord.Content,
	}, nil
}

// getUserNames 获取创建者和更新者名称的辅助函数
func (d *domain) getUserNames(ctx context.Context, createdBy, updatedBy string) (createdByName, updatedByName string) {
	// 获取创建者名称
	if createdBy != "" {
		user, err := d.user.GetByUserIdSimple(ctx, createdBy)
		if err == nil {
			createdByName = user.Name
		}
	}

	// 获取更新者名称
	if updatedBy != "" {
		user, err := d.user.GetByUserIdSimple(ctx, updatedBy)
		if err == nil {
			updatedByName = user.Name
		}
	}

	return createdByName, updatedByName
}

// CheckNameExists 校验模板名称是否存在
func (d *domain) CheckNameExists(ctx context.Context, req *CheckNameExistsRequest) (*CheckNameExistsResponse, error) {
	var excludeID uint64
	if req.ExcludeID != "" {
		var err error
		excludeID, err = strconv.ParseUint(req.ExcludeID, 10, 64)
		if err != nil {
			return nil, errorcode.Detail(errorcode.PublicInvalidParameter, "exclude_id格式错误")
		}
	}

	exists, err := d.repo.CheckNameExists(ctx, req.TemplateName, excludeID)
	if err != nil {
		return nil, errorcode.NewPublicDatabaseError(err)
	}

	return &CheckNameExistsResponse{
		Exists: exists,
	}, nil
}
