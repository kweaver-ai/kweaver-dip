package work_order_template

import (
	"context"
	"errors"
	"sort"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/user"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order_template"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type domain struct {
	repo work_order_template.Repository
	user user.IUserRepo
}

func New(repo work_order_template.Repository, user user.IUserRepo) Domain {
	return &domain{repo: repo, user: user}
}

// Create 创建工单模板
func (d *domain) Create(ctx context.Context, req *CreateRequest) (*CreateResponse, error) {
	// 验证工单类型
	if !d.isValidTicketType(req.TicketType) {
		return nil, errorcode.Desc(errorcode.WorkOrderInvalidParameter)
	}

	// 检查模板名称是否已存在
	exists, err := d.repo.CheckNameExists(ctx, req.TemplateName, 0)
	if err != nil {
		return nil, errorcode.NewPublicDatabaseError(err)
	}
	if exists {
		return nil, errorcode.Desc(errorcode.TemplateNameExisted)
	}

	// 检查是否已存在同类型的启用模板，如果存在则停用
	activeTemplate, err := d.repo.GetActiveByTicketType(ctx, req.TicketType)
	if err != nil && !errors.Is(err, work_order_template.ErrNotFound) {
		return nil, errorcode.NewPublicDatabaseError(err)
	}
	if activeTemplate != nil {
		// 停用现有模板
		if err := d.repo.DisableByTicketType(ctx, req.TicketType); err != nil {
			return nil, errorcode.NewPublicDatabaseError(err)
		}
	}

	// 创建新模板
	now := time.Now()
	template := &model.WorkOrderTemplate{
		TicketType:   req.TicketType,
		TemplateName: req.TemplateName,
		Description:  req.Description,
		CreatedByUID: req.CreatedByUID,
		CreatedAt:    now,
		UpdatedTime:  now,
		UpdatedByUID: req.UpdatedByUID,
		IsBuiltin:    0, // 新创建的模板不是内置模板
		Status:       1, // 新创建的模板默认启用
		IsDeleted:    0,
	}

	if err := d.repo.Create(ctx, template); err != nil {
		return nil, errorcode.NewPublicDatabaseError(err)
	}

	return &CreateResponse{
		ID: template.ID,
	}, nil
}

// Update 更新工单模板
func (d *domain) Update(ctx context.Context, id int64, req *UpdateRequest) (*UpdateResponse, error) {
	// 获取现有模板
	template, err := d.repo.Get(ctx, id)
	if err != nil {
		if errors.Is(err, work_order_template.ErrNotFound) {
			return nil, errorcode.Desc(errorcode.DomainIdEmpty)
		}
		return nil, errorcode.NewPublicDatabaseError(err)
	}

	// 内置模板不允许修改
	/*if template.IsBuiltin == 1 {
		return nil, errorcode.Desc(errorcode.WorkOrderBuiltinTemplateCannotModify)
	}*/

	// 验证工单类型
	if !d.isValidTicketType(req.TicketType) {
		return nil, errorcode.Desc(errorcode.WorkOrderInvalidParameter)
	}

	// 检查模板名称是否已存在（排除当前模板）
	/*exists, err := d.repo.CheckNameExists(ctx, req.TemplateName, id)
	if err != nil {
		return nil, errorcode.NewPublicDatabaseError(err)
	}*/
	/*if exists {
		return nil, errorcode.Desc(errorcode.WorkOrderTemplateNameExists)
	}*/

	// 更新模板
	now := time.Now()
	template.TicketType = req.TicketType
	template.TemplateName = req.TemplateName
	template.Description = req.Description
	template.UpdatedTime = now
	template.UpdatedByUID = req.UpdatedByUID

	if err := d.repo.Update(ctx, template); err != nil {
		return nil, errorcode.NewPublicDatabaseError(err)
	}

	return &UpdateResponse{
		ID: template.ID,
	}, nil
}

// UpdateStatus 更新工单模板状态
func (d *domain) UpdateStatus(ctx context.Context, id int64, state int32, updatedByUID string) (*UpdateResponse, error) {
	// 获取现有模板
	template, err := d.repo.Get(ctx, id)
	if err != nil {
		if errors.Is(err, work_order_template.ErrNotFound) {
			return nil, errorcode.Desc(errorcode.PublicResourceNotFound)
		}
		return nil, errorcode.NewPublicDatabaseError(err)
	}

	// 内置模板不允许停用
	if state == 0 && template.IsBuiltin == 1 {
		return nil, errorcode.Desc(errorcode.DisableBuiltinTemplate)
	}

	// 更新模板状态
	now := time.Now()
	template.UpdatedTime = now
	template.UpdatedByUID = updatedByUID

	if state == 1 { // 启用
		// 启用时，停用同类型的其他模板
		if err := d.repo.DisableOthersByTicketType(ctx, template.TicketType, id); err != nil {
			return nil, errorcode.NewPublicDatabaseError(err)
		}
		template.Status = 1
	} else { // 停用
		// 停用当前模板
		template.Status = 0

		// 停用后，尝试启用同类型的内置模板
		if err := d.activateBuiltinTemplateAfterDisable(ctx, template.TicketType); err != nil {
			return nil, errorcode.NewPublicDatabaseError(err)
		}
	}

	if err := d.repo.Update(ctx, template); err != nil {
		return nil, errorcode.NewPublicDatabaseError(err)
	}

	return &UpdateResponse{ID: template.ID}, nil
}

// activateBuiltinTemplateAfterDisable 停用模板后激活同类型的内置模板
func (d *domain) activateBuiltinTemplateAfterDisable(ctx context.Context, ticketType string) error {
	// 查找同类型的内置模板
	opts := work_order_template.ListOptions{
		Limit:       0,
		Offset:      0,
		TicketTypes: []string{ticketType},
		Status:      nil,            // 不限制状态，查找所有模板
		IsBuiltin:   &[]int32{1}[0], // 只查找内置模板
	}

	templates, _, err := d.repo.List(ctx, opts)
	if err != nil {
		return err
	}

	// 如果没有内置模板，不需要做任何操作
	if len(templates) == 0 {
		return nil
	}

	// 启用第一个内置模板（按排序规则，应该是优先级最高的）
	builtinTemplate := &templates[0]
	if builtinTemplate.Status == 0 {
		builtinTemplate.Status = 1
		if err := d.repo.Update(ctx, builtinTemplate); err != nil {
			return err
		}
	}

	return nil
}

// Delete 删除工单模板
func (d *domain) Delete(ctx context.Context, id int64) error {
	// 获取现有模板
	template, err := d.repo.Get(ctx, id)
	if err != nil {
		if errors.Is(err, work_order_template.ErrNotFound) {
			return errorcode.Desc(errorcode.PublicResourceNotFound)
		}
		return errorcode.NewPublicDatabaseError(err)
	}

	// 内置模板不允许删除
	if template.IsBuiltin == 1 {
		return errorcode.Desc(errorcode.DeleteBuiltinTemplate)
	}

	// 逻辑删除
	if err := d.repo.Delete(ctx, id); err != nil {
		return errorcode.NewPublicDatabaseError(err)
	}

	// 删除后，检查同类型是否还有其他模板，如果有则启用其中一个
	if err := d.activateTemplateAfterDelete(ctx, template.TicketType); err != nil {
		return errorcode.NewPublicDatabaseError(err)
	}

	return nil
}

// activateTemplateAfterDelete 删除模板后激活同类型的其他模板
func (d *domain) activateTemplateAfterDelete(ctx context.Context, ticketType string) error {
	// 查找同类型的其他模板（按优先级排序：内置模板优先，然后按更新时间倒序）
	opts := work_order_template.ListOptions{
		Limit:       1, // 只取第一个
		Offset:      0,
		TicketTypes: []string{ticketType},
		Status:      nil, // 不限制状态，查找所有模板
		IsBuiltin:   nil, // 不限制是否内置
	}

	templates, _, err := d.repo.List(ctx, opts)
	if err != nil {
		return err
	}

	// 如果没有其他模板，不需要做任何操作
	if len(templates) == 0 {
		return nil
	}

	// 启用第一个模板（按排序规则，应该是优先级最高的）
	templateToActivate := &templates[0]
	if templateToActivate.Status == 0 {
		templateToActivate.Status = 1
		if err := d.repo.Update(ctx, templateToActivate); err != nil {
			return err
		}
	}

	return nil
}

// Get 获取工单模板详情
func (d *domain) Get(ctx context.Context, id int64) (*TemplateResponse, error) {
	template, err := d.repo.Get(ctx, id)
	if err != nil {
		if errors.Is(err, work_order_template.ErrNotFound) {
			return nil, errorcode.Desc(errorcode.DomainIdEmpty)
		}
		return nil, errorcode.NewPublicDatabaseError(err)
	}

	// 获取创建者和更新者名称
	createdName, updatedName := d.getUserNames(ctx, template.CreatedByUID, template.UpdatedByUID)
	return &TemplateResponse{
		ID:           template.ID,
		TemplateName: template.TemplateName,
		TicketType:   template.TicketType,
		Description:  template.Description,
		Status:       template.Status == 1,
		CreatedByUID: template.CreatedByUID,
		UpdatedByUID: template.UpdatedByUID,
		CreatedAt:    template.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt:    template.UpdatedTime.Format("2006-01-02 15:04:05"),
		IsBuiltin:    template.IsBuiltin == 1,
		CreatedName:  createdName,
		UpdatedName:  updatedName,
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

	opts := work_order_template.ListOptions{
		Limit:       req.Limit,
		Offset:      req.Offset,
		TicketTypes: req.TicketTypes,
		Keyword:     req.Keyword,
	}

	// 设置状态过滤
	if req.Status != nil {
		status := int32(0)
		if *req.Status {
			status = 1
		}
		opts.Status = &status
	}

	// 设置内置模板过滤
	if req.IsBuiltin != nil {
		builtin := int32(0)
		if *req.IsBuiltin {
			builtin = 1
		}
		opts.IsBuiltin = &builtin
	}

	templates, total, err := d.repo.List(ctx, opts)
	if err != nil {
		return nil, errorcode.NewPublicDatabaseError(err)
	}

	// 转换为响应格式
	items := make([]TemplateResponse, len(templates))
	for i, template := range templates {
		// 获取创建者和更新者名称
		createdName, updatedName := d.getUserNames(ctx, template.CreatedByUID, template.UpdatedByUID)
		items[i] = TemplateResponse{
			ID:           template.ID,
			TemplateName: template.TemplateName,
			IsBuiltin:    template.IsBuiltin == 1,
			Description:  template.Description,
			TicketType:   template.TicketType,
			UpdatedAt:    template.UpdatedTime.Format("2006-01-02 15:04:05"),
			Status:       template.Status == 1,
			CreatedAt:    template.CreatedAt.Format("2006-01-02 15:04:05"),
			CreatedName:  createdName,
			UpdatedName:  updatedName,
		}
	}

	return &ListResponse{
		Entries:    items,
		TotalCount: total,
	}, nil
}

// 获取创建者和更新者名称的辅助函数
func (d *domain) getUserNames(ctx context.Context, createdByUID, updatedByUID string) (createdName, updatedName string) {
	// 获取创建者名称
	if createdByUID != "" {
		user, err := d.user.GetByUserIdSimple(ctx, createdByUID)
		if err == nil {
			createdName = user.Name
		} else {
			createdName = ""
		}
	} else {
		createdName = ""
	}

	// 获取更新者名称
	if updatedByUID != "" {
		user, err := d.user.GetByUserIdSimple(ctx, updatedByUID)
		if err == nil {
			updatedName = user.Name
		} else {
			updatedName = ""
		}
	} else {
		updatedName = ""
	}

	return createdName, updatedName
}

// isValidTicketType 验证工单类型是否有效
func (d *domain) isValidTicketType(ticketType string) bool {
	validTypes := []string{
		model.TicketTypeDataAggregation,
		model.TicketTypeStandardization,
		model.TicketTypeQualityDetection,
		model.TicketTypeDataFusion,
	}

	for _, validType := range validTypes {
		if ticketType == validType {
			return true
		}
	}
	return false
}

// sortTemplates 对模板列表进行排序
func (d *domain) sortTemplates(templates []TemplateResponse) {
	sort.Slice(templates, func(i, j int) bool {
		// 内置模板优先
		if templates[i].IsBuiltin != templates[j].IsBuiltin {
			return templates[i].IsBuiltin
		}

		// 如果是内置模板，按工单类型和模板名称排序
		if templates[i].IsBuiltin {
			orderI := model.TicketTypeOrder[templates[i].TicketType]
			orderJ := model.TicketTypeOrder[templates[j].TicketType]
			if orderI != orderJ {
				return orderI < orderJ
			}
			return templates[i].TemplateName < templates[j].TemplateName
		}

		// 非内置模板按更新时间降序排序
		return templates[i].UpdatedAt > templates[j].UpdatedAt
	})
}
