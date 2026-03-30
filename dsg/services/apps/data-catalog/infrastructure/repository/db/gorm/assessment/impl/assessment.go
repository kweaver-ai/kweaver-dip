package impl

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/assessment"
	iface "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/assessment"
	"gorm.io/gorm"
)

type AssessmentRepoImpl struct {
	db *gorm.DB
}

func NewAssessmentRepo(db *gorm.DB) iface.AssessmentRepo {
	return &AssessmentRepoImpl{db: db}
}

type tTarget struct {
	ID                uint64     `gorm:"column:id;primaryKey;autoIncrement"`
	TargetName        string     `gorm:"column:target_name"`
	TargetType        uint8      `gorm:"column:target_type"`
	DepartmentID      string     `gorm:"column:department_id"`
	Description       string     `gorm:"column:description"`
	StartDate         time.Time  `gorm:"column:start_date;type:date"`
	EndDate           *time.Time `gorm:"column:end_date;type:date;default:null"`
	Status            uint8      `gorm:"column:status"`
	ResponsibleUID    string     `gorm:"column:responsible_uid"`
	EmployeeID        string     `gorm:"column:employee_id"`
	EvaluationContent *string    `gorm:"column:evaluation_content"` // 添加评价内容字段
	CreatedAt         time.Time  `gorm:"column:created_at;autoCreateTime;type:datetime"`
	CreatedBy         string     `gorm:"column:created_by"`
	UpdatedAt         *time.Time `gorm:"column:updated_at;autoUpdateTime;type:datetime"`
	UpdatedBy         *string    `gorm:"column:updated_by"`
}

func (tTarget) TableName() string { return "t_target" }

type tTargetPlan struct {
	ID                            uint64  `gorm:"column:id;primaryKey;autoIncrement"`
	TargetID                      uint64  `gorm:"column:target_id"`
	AssessmentType                uint8   `gorm:"column:assessment_type;default:1"` // 考核类型：1=部门考核，2=运营考核
	PlanType                      uint8   `gorm:"column:plan_type"`
	PlanName                      string  `gorm:"column:plan_name"`
	PlanDesc                      string  `gorm:"column:plan_desc"`
	ResponsibleUID                string  `gorm:"column:responsible_uid"`
	PlanQuantity                  int     `gorm:"column:plan_quantity;default:0"`
	ActualQuantity                *int    `gorm:"column:actual_quantity"`
	Status                        uint8   `gorm:"column:status"`
	RelatedDataCollectionPlanID   *string `gorm:"column:related_data_collection_plan_id"`
	BusinessModelQuantity         *int    `gorm:"column:business_model_quantity"`
	BusinessProcessQuantity       *int    `gorm:"column:business_process_quantity"`
	BusinessTableQuantity         *int    `gorm:"column:business_table_quantity"`
	BusinessModelActualQuantity   *int    `gorm:"column:business_model_actual_quantity"`
	BusinessProcessActualQuantity *int    `gorm:"column:business_process_actual_quantity"`
	BusinessTableActualQuantity   *int    `gorm:"column:business_table_actual_quantity"`
	// 运营考核相关字段
	DataCollectionQuantity           *int       `gorm:"column:data_collection_quantity"`
	DataProcessExploreQuantity       *int       `gorm:"column:data_process_explore_quantity"`
	DataProcessFusionQuantity        *int       `gorm:"column:data_process_fusion_quantity"`
	DataUnderstandingQuantity        *int       `gorm:"column:data_understanding_quantity"`
	DataCollectionActualQuantity     *int       `gorm:"column:data_collection_actual_quantity"`
	DataProcessExploreActualQuantity *int       `gorm:"column:data_process_explore_actual_quantity"`
	DataProcessFusionActualQuantity  *int       `gorm:"column:data_process_fusion_actual_quantity"`
	DataUnderstandingActualQuantity  *int       `gorm:"column:data_understanding_actual_quantity"`
	RelatedDataProcessPlanID         *string    `gorm:"column:related_data_process_plan_id"`
	RelatedDataUnderstandingPlanID   *string    `gorm:"column:related_data_understanding_plan_id"`
	CreatedAt                        time.Time  `gorm:"column:created_at;autoCreateTime;type:datetime"`
	CreatedBy                        string     `gorm:"column:created_by"`
	UpdatedAt                        *time.Time `gorm:"column:updated_at;autoUpdateTime;type:datetime"`
	UpdatedBy                        *string    `gorm:"column:updated_by"`
}

func (tTargetPlan) TableName() string { return "t_target_plan" }

// 将数据库字段转换为BusinessItem数组（用于API响应）
func convertDBFieldsToBusinessItems(modelQty, processQty, tableQty *int) []assessment.BusinessItem {
	var items []assessment.BusinessItem

	if modelQty != nil && *modelQty > 0 {
		items = append(items, assessment.BusinessItem{
			Type:     "model",
			Quantity: *modelQty,
		})
	}

	if processQty != nil && *processQty > 0 {
		items = append(items, assessment.BusinessItem{
			Type:     "process",
			Quantity: *processQty,
		})
	}

	if tableQty != nil && *tableQty > 0 {
		items = append(items, assessment.BusinessItem{
			Type:     "table",
			Quantity: *tableQty,
		})
	}

	return items
}

// 将BusinessItem数组转换为数据库字段（用于API请求）
func convertBusinessItemsToDBFields(items []assessment.BusinessItem) (*int, *int, *int) {
	var modelQty, processQty, tableQty *int

	for _, item := range items {
		switch item.Type {
		case "model":
			modelQty = &item.Quantity
		case "process":
			processQty = &item.Quantity
		case "table":
			tableQty = &item.Quantity
		}
	}

	return modelQty, processQty, tableQty
}

// 获取业务事项类型的中文名称（用于前端显示）
func getBusinessItemTypeName(itemType string) string {
	switch itemType {
	case "model":
		return "构建业务模型"
	case "process":
		return "梳理业务流程"
	case "table":
		return "设计业务表"
	default:
		return "未知类型"
	}
}

func toTargetEntity(po *tTarget) *assessment.Target {
	if po == nil {
		return nil
	}

	var updatedAt *string
	if po.UpdatedAt != nil {
		updatedAtStr := po.UpdatedAt.Format("2006-01-02 15:04:05")
		updatedAt = &updatedAtStr
	}

	return &assessment.Target{
		ID:             po.ID,
		TargetName:     po.TargetName,
		TargetType:     po.TargetType,
		DepartmentID:   po.DepartmentID,
		DepartmentName: "", // 由领域层填充
		Description:    po.Description,
		StartDate:      po.StartDate.Format("2006-01-02"),
		EndDate: func() string {
			if po.EndDate == nil {
				return ""
			}
			return po.EndDate.Format("2006-01-02")
		}(),
		Status:            po.Status,
		ResponsibleUID:    po.ResponsibleUID,
		EmployeeID:        po.EmployeeID,
		EvaluationContent: po.EvaluationContent, // 添加评价内容字段映射
		CreatedAt:         po.CreatedAt.Format("2006-01-02 15:04:05"),
		CreatedBy:         po.CreatedBy,
		CreatedByName:     "", // 由领域层填充
		UpdatedAt:         updatedAt,
		UpdatedBy:         po.UpdatedBy,
		UpdatedByName:     nil, // 由领域层填充
	}
}

func toPlanEntity(po *tTargetPlan) *assessment.Plan {
	if po == nil {
		return nil
	}

	var updatedAt *string
	if po.UpdatedAt != nil {
		updatedAtStr := po.UpdatedAt.Format("2006-01-02 15:04:05")
		updatedAt = &updatedAtStr
	}

	return &assessment.Plan{
		ID:                            po.ID,
		TargetID:                      po.TargetID,
		PlanType:                      po.PlanType,
		AssessmentType:                po.AssessmentType,
		PlanName:                      po.PlanName,
		PlanDesc:                      po.PlanDesc,
		ResponsibleUID:                &po.ResponsibleUID,
		PlanQuantity:                  po.PlanQuantity,
		ActualQuantity:                po.ActualQuantity,
		Status:                        po.Status,
		RelatedDataCollectionPlanID:   po.RelatedDataCollectionPlanID,
		BusinessItems:                 convertDBFieldsToBusinessItems(po.BusinessModelQuantity, po.BusinessProcessQuantity, po.BusinessTableQuantity),
		BusinessModelActualQuantity:   po.BusinessModelActualQuantity,
		BusinessProcessActualQuantity: po.BusinessProcessActualQuantity,
		BusinessTableActualQuantity:   po.BusinessTableActualQuantity,
		// 运营考核相关字段映射
		DataCollectionQuantity:           po.DataCollectionQuantity,
		DataCollectionActualQuantity:     po.DataCollectionActualQuantity,
		DataProcessExploreQuantity:       po.DataProcessExploreQuantity,
		DataProcessFusionQuantity:        po.DataProcessFusionQuantity,
		DataUnderstandingQuantity:        po.DataUnderstandingQuantity,
		DataProcessExploreActualQuantity: po.DataProcessExploreActualQuantity,
		DataProcessFusionActualQuantity:  po.DataProcessFusionActualQuantity,
		DataUnderstandingActualQuantity:  po.DataUnderstandingActualQuantity,
		RelatedDataProcessPlanID:         po.RelatedDataProcessPlanID,
		RelatedDataUnderstandingPlanID:   po.RelatedDataUnderstandingPlanID,
		CreatedAt:                        po.CreatedAt.Format("2006-01-02 15:04:05"),
		CreatedBy:                        po.CreatedBy,
		CreatedByName:                    "", // 由领域层填充
		UpdatedAt:                        updatedAt,
		UpdatedBy:                        po.UpdatedBy,
		UpdatedByName:                    nil, // 由领域层填充
	}
}

// target
func (r *AssessmentRepoImpl) CreateTarget(ctx context.Context, req assessment.TargetCreateReq, userID string) (uint64, error) {
	// 解析日期字符串
	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		return 0, fmt.Errorf("invalid start_date format: %v", err)
	}

	// 处理结束日期，如果为空则设置为nil
	var endDate *time.Time
	if req.EndDate != "" {
		parsedDate, err := time.Parse("2006-01-02", req.EndDate)
		if err != nil {
			return 0, fmt.Errorf("invalid end_date format: %v", err)
		}
		endDate = &parsedDate
	}

	// 根据结束日期自动判断状态
	status := r.calculateTargetStatus(endDate)

	// 处理协助成员ID，如果为空则使用责任人ID
	employeeID := req.EmployeeID
	/*if employeeID == "" {
		employeeID = req.ResponsibleUID
	}*/

	// 校验：名称不能重复（区分部门考核和运营考核）
	{
		var cnt int64
		var err error
		var errorMsg string

		if req.TargetType == 1 {
			// 部门考核：同一部门下名称不能重复
			err = r.db.WithContext(ctx).Model(&tTarget{}).
				Where("department_id = ? AND target_name = ? AND target_type = ?", req.DepartmentID, req.TargetName, req.TargetType).
				Count(&cnt).Error
			errorMsg = "同一部门下目标名称已存在"
		} else if req.TargetType == 2 {
			// 运营考核：全局范围内名称不能重复（不限制部门）
			err = r.db.WithContext(ctx).Model(&tTarget{}).
				Where("target_name = ? AND target_type = ?", req.TargetName, req.TargetType).
				Count(&cnt).Error
			errorMsg = "已存在相同名称的运营目标，请重新输入"
		} else {
			// 其他类型：默认按部门考核逻辑处理
			err = r.db.WithContext(ctx).Model(&tTarget{}).
				Where("department_id = ? AND target_name = ? AND target_type = ?", req.DepartmentID, req.TargetName, req.TargetType).
				Count(&cnt).Error
			errorMsg = "同一部门下目标名称已存在"
		}

		if err != nil {
			return 0, wrapDBErr(err)
		}
		if cnt > 0 {
			return 0, errorcode.Detail(errorcode.PublicInvalidExistsValue, errorMsg)
		}
	}

	// 手动设置时间，去除毫秒
	now := time.Now().Truncate(time.Second) // 去除毫秒部分

	po := &tTarget{
		TargetName:     req.TargetName,
		TargetType:     req.TargetType,
		DepartmentID:   req.DepartmentID,
		Description:    req.Description,
		StartDate:      startDate,
		EndDate:        endDate,
		Status:         status,
		ResponsibleUID: req.ResponsibleUID,
		EmployeeID:     employeeID,
		CreatedBy:      userID,
		CreatedAt:      now,  // 手动设置创建时间
		UpdatedAt:      &now, // 手动设置更新时间
	}
	if err := r.db.WithContext(ctx).Create(po).Error; err != nil {
		return 0, wrapDBErr(err)
	}
	return po.ID, nil
}

func (r *AssessmentRepoImpl) UpdateTarget(ctx context.Context, id uint64, req assessment.TargetUpdateReq, userID string) error {
	updates := map[string]any{}
	var newEndDate string

	if req.TargetName != nil {
		updates["target_name"] = *req.TargetName
	}
	if req.TargetType != nil {
		updates["target_type"] = *req.TargetType
	}
	if req.DepartmentID != nil {
		updates["department_id"] = *req.DepartmentID
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.StartDate != nil {
		startDate, err := time.Parse("2006-01-02", *req.StartDate)
		if err != nil {
			return fmt.Errorf("invalid start_date format: %v", err)
		}
		updates["start_date"] = startDate
	}
	if req.EndDate != nil {
		endDate, err := time.Parse("2006-01-02", *req.EndDate)
		if err != nil {
			return fmt.Errorf("invalid end_date format: %v", err)
		}
		updates["end_date"] = endDate
		newEndDate = *req.EndDate
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.ResponsibleUID != nil {
		updates["responsible_uid"] = *req.ResponsibleUID
	}
	if req.EmployeeID != nil {
		updates["employee_id"] = *req.EmployeeID
	}

	// 如果修改了部门或名称，校验名称唯一（区分部门考核和运营考核）
	if (req.DepartmentID != nil && *req.DepartmentID != "") || (req.TargetName != nil && *req.TargetName != "") {
		var cur tTarget
		if err := r.db.WithContext(ctx).Where("id = ?", id).First(&cur).Error; err != nil {
			return wrapDBErr(err)
		}
		newDept := cur.DepartmentID
		newName := cur.TargetName
		newTargetType := cur.TargetType
		if req.DepartmentID != nil && *req.DepartmentID != "" {
			newDept = *req.DepartmentID
		}
		if req.TargetName != nil && *req.TargetName != "" {
			newName = *req.TargetName
		}
		if req.TargetType != nil {
			newTargetType = *req.TargetType
		}

		var cnt int64
		var err error
		var errorMsg string

		if newTargetType == 1 {
			// 部门考核：同一部门下名称不能重复
			err = r.db.WithContext(ctx).Model(&tTarget{}).
				Where("department_id = ? AND target_name = ? AND target_type = ? AND id <> ?", newDept, newName, newTargetType, id).
				Count(&cnt).Error
			errorMsg = "同一部门下目标名称已存在"
		} else if newTargetType == 2 {
			// 运营考核：全局范围内名称不能重复（不限制部门）
			err = r.db.WithContext(ctx).Model(&tTarget{}).
				Where("target_name = ? AND target_type = ? AND id <> ?", newName, newTargetType, id).
				Count(&cnt).Error
			errorMsg = "已存在相同名称的运营目标，请重新输入"
		} else {
			// 其他类型：默认按部门考核逻辑处理
			err = r.db.WithContext(ctx).Model(&tTarget{}).
				Where("department_id = ? AND target_name = ? AND target_type = ? AND id <> ?", newDept, newName, newTargetType, id).
				Count(&cnt).Error
			errorMsg = "同一部门下目标名称已存在"
		}

		if err != nil {
			return wrapDBErr(err)
		}
		if cnt > 0 {
			return errorcode.Detail(errorcode.PublicInvalidParameterValue, errorMsg)
		}
	}

	// 设置更新人和更新时间（去除毫秒）
	updates["updated_by"] = userID
	updates["updated_at"] = time.Now().Truncate(time.Second)

	// 如果修改了结束日期，需要重新计算状态
	if newEndDate != "" {
		// 解析新的结束日期
		newEndDateParsed, err := time.Parse("2006-01-02", newEndDate)
		if err != nil {
			return fmt.Errorf("invalid end_date format: %v", err)
		}
		// 计算新状态
		newStatus := r.calculateTargetStatus(&newEndDateParsed)
		updates["status"] = newStatus
	}

	return r.db.WithContext(ctx).Model(&tTarget{}).Where("id = ?", id).Updates(updates).Error
}

func (r *AssessmentRepoImpl) DeleteTarget(ctx context.Context, id uint64, userID string) error {
	fmt.Printf("=== Repository: DeleteTarget 开始执行，目标ID: %d ===\n", id)

	// 1. 首先检查目标是否存在
	var target tTarget
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&target).Error; err != nil {
		if err.Error() == "record not found" {
			fmt.Printf("Repository: 目标不存在，ID: %d\n", id)
			return fmt.Errorf("目标不存在，ID: %d", id)
		}
		fmt.Printf("Repository: 查询目标失败: %v\n", err)
		return err
	}
	fmt.Printf("Repository: 找到目标，名称: %s\n", target.TargetName)

	// 2. 检查关联的计划数量
	var planCount int64
	if err := r.db.WithContext(ctx).Model(&tTargetPlan{}).Where("target_id = ?", id).Count(&planCount).Error; err != nil {
		fmt.Printf("Repository: 查询关联计划数量失败: %v\n", err)
		return err
	}
	fmt.Printf("Repository: 关联计划数量: %d\n", planCount)

	// 3. 开始事务删除
	tx := r.db.WithContext(ctx).Begin()
	if tx.Error != nil {
		fmt.Printf("Repository: 开始事务失败: %v\n", tx.Error)
		return tx.Error
	}

	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("Repository: 事务回滚（panic）: %v\n", r)
			tx.Rollback()
		}
	}()

	// 4. 删除关联的计划（由于外键约束，这一步实际上是可选的，但为了日志记录）
	if planCount > 0 {
		if err := tx.Where("target_id = ?", id).Delete(&tTargetPlan{}).Error; err != nil {
			fmt.Printf("Repository: 删除关联计划失败: %v\n", err)
			tx.Rollback()
			return err
		}
		fmt.Printf("Repository: 成功删除 %d 个关联计划\n", planCount)
	}

	// 5. 删除目标
	if err := tx.Where("id = ?", id).Delete(&tTarget{}).Error; err != nil {
		fmt.Printf("Repository: 删除目标失败: %v\n", err)
		tx.Rollback()
		return err
	}

	// 6. 提交事务
	if err := tx.Commit().Error; err != nil {
		fmt.Printf("Repository: 提交事务失败: %v\n", err)
		return err
	}

	fmt.Printf("Repository: 成功删除目标 ID=%d 及其 %d 个关联计划\n", id, planCount)
	fmt.Printf("=== Repository: DeleteTarget 执行完成 ===\n")
	return nil
}

func (r *AssessmentRepoImpl) GetTarget(ctx context.Context, id uint64) (*assessment.Target, error) {
	var po tTarget
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&po).Error; err != nil {
		return nil, err
	}
	return toTargetEntity(&po), nil
}

func (r *AssessmentRepoImpl) ListTargets(ctx context.Context, q assessment.TargetQuery) (*assessment.PageResp[assessment.Target], error) {
	// 使用全新会话，避免任何上一次查询链路中的条件泄漏到本次请求
	db := r.db.WithContext(ctx).Session(&gorm.Session{NewDB: true}).Model(&tTarget{})

	// 构建查询条件
	if q.TargetName != nil && *q.TargetName != "" {
		// 对搜索关键字进行转义，防止 % 和 _ 被当作通配符
		escapedKeyword := util.KeywordEscape(*q.TargetName)
		db = db.Where("target_name LIKE ?", "%"+escapedKeyword+"%")
	}
	if q.TargetType != nil {
		db = db.Where("target_type = ?", *q.TargetType)
	}
	if q.DepartmentID != "" {
		// 支持逗号分隔的部门ID列表，进行 IN 查询
		if strings.Contains(q.DepartmentID, ",") {
			parts := strings.Split(q.DepartmentID, ",")
			ids := make([]string, 0, len(parts))
			for _, p := range parts {
				if id := strings.TrimSpace(p); id != "" {
					ids = append(ids, id)
				}
			}
			if len(ids) > 0 {
				db = db.Where("department_id IN (?)", ids)
			}
		} else {
			db = db.Where("department_id = ?", q.DepartmentID)
		}
	}
	if q.Status != nil {
		db = db.Where("status = ?", *q.Status)
	}
	if q.StartDate != nil && *q.StartDate != "" {
		db = db.Where("start_date >= ?", *q.StartDate)
	}
	if q.EndDate != nil && *q.EndDate != "" {
		db = db.Where("end_date <= ?", *q.EndDate)
	}
	// 处理用户身份查询条件
	if q.IsOperator {
		// 如果是按操作人查询，强制查询 responsible_uid = 用户ID OR employee_id = 用户ID
		if q.ResponsibleUID != nil && *q.ResponsibleUID != "" {
			userID := *q.ResponsibleUID
			db = db.Where("responsible_uid = ? OR employee_id = ?", userID, userID)
		}
	} else {
		// 按原逻辑处理
		if q.ResponsibleUID != nil && *q.ResponsibleUID != "" {
			db = db.Where("responsible_uid = ?", *q.ResponsibleUID)
		}
		if q.EmployeeID != nil && *q.EmployeeID != "" {
			db = db.Where("employee_id LIKE ?", "%"+*q.EmployeeID+"%")
		}
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, err
	}

	// 构建排序逻辑
	var orderClause string

	// 检查用户是否主动指定了排序字段
	if q.Sort == "" {
		// 用户没有主动指定排序，使用原来的默认排序：已到期未评价(2) > 未到期(1) > 已结束(3)
		// 同一状态内按开始时间升序排序
		orderClause = "CASE WHEN status = 2 THEN 1 WHEN status = 1 THEN 2 WHEN status = 3 THEN 3 ELSE 4 END, start_date ASC"
	} else {
		// 用户主动指定了排序字段，按用户指定的字段排序
		switch q.Sort {
		case "target_name":
			orderClause = fmt.Sprintf("target_name %s", q.Direction)
		case "start_date":
			orderClause = fmt.Sprintf("start_date %s", q.Direction)
		case "end_date":
			orderClause = fmt.Sprintf("end_date %s", q.Direction)
		case "created_at":
			orderClause = fmt.Sprintf("created_at %s", q.Direction)
		case "updated_at":
			orderClause = fmt.Sprintf("updated_at %s", q.Direction)
		case "plan":
			// 新增：按计划优先级排序：未到期(1) > 已到期未评价(2) > 已结束(3)
			// 同一状态内按目标计划开始日期升序排序
			orderClause = "CASE WHEN status = 1 THEN 1 WHEN status = 2 THEN 2 WHEN status = 3 THEN 3 ELSE 4 END, start_date ASC"
		default:
			// 兜底：使用原来的默认排序逻辑
			orderClause = "CASE WHEN status = 2 THEN 1 WHEN status = 1 THEN 2 WHEN status = 3 THEN 3 ELSE 4 END, start_date ASC"
		}
	}

	var list []tTarget
	// 将offset从1开始转换为从0开始（数据库查询需要从0开始）
	actualOffset := (q.Offset - 1) * q.Limit
	fmt.Printf("Repository: 分页参数 - offset=%d, limit=%d, actualOffset=%d\n", q.Offset, q.Limit, actualOffset)
	if err := db.Order(orderClause).Offset(actualOffset).Limit(q.Limit).Find(&list).Error; err != nil {
		return nil, err
	}

	resp := make([]assessment.Target, 0, len(list))
	for i := range list {
		resp = append(resp, *toTargetEntity(&list[i]))
	}
	return &assessment.PageResp[assessment.Target]{Total: total, List: resp}, nil
}

func (r *AssessmentRepoImpl) UpdateTargetsStatusByDate(ctx context.Context, today string) error {
	// 将已到期但状态仍为"未到期"的目标更新为"待评价"
	return r.db.WithContext(ctx).Model(&tTarget{}).
		Where("end_date <= ? AND status = 1", today).
		Update("status", 2).Error
}

// 手动设置目标状态为已结束（评价完成）
func (r *AssessmentRepoImpl) CompleteTarget(ctx context.Context, id uint64, userID string) error {
	return r.db.WithContext(ctx).Model(&tTarget{}).
		Where("id = ?", id).
		Updates(map[string]any{
			"status":     3, // 已结束
			"updated_by": userID,
		}).Error
}

// 计算目标状态：根据结束日期判断
func (r *AssessmentRepoImpl) calculateTargetStatus(endDate *time.Time) uint8 {
	// 如果结束日期为nil（未设置），则始终为未到期状态
	if endDate == nil {
		return 1 // 未到期
	}
	today := time.Now()
	if endDate.Before(today) {
		return 2 // 已到期 -> 待评价
	}
	return 1 // 未到期
}

// plan
func (r *AssessmentRepoImpl) CreatePlan(ctx context.Context, req assessment.PlanCreateReq, userID string) (uint64, error) {
	// 设置默认值
	var status uint8 = 0 // 默认未填状态
	if req.Status != nil {
		status = *req.Status
	}

	// 已删除冗余字段：priority

	var planQuantity int = 0 // 默认计划数量为0
	if req.PlanQuantity != nil {
		planQuantity = *req.PlanQuantity
	}

	// 校验：当前类型下计划名称不能重复
	{
		var cnt int64
		err := r.db.WithContext(ctx).Model(&tTargetPlan{}).
			Where("target_id = ? AND plan_name = ? AND assessment_type = ? AND plan_type = ?",
				req.TargetID, req.PlanName, req.AssessmentType, req.PlanType).
			Count(&cnt).Error
		if err != nil {
			return 0, err // 直接返回原始错误，不使用 wrapDBErr
		}
		if cnt > 0 {
			return 0, errorcode.Detail(errorcode.PublicInvalidExistsValue, "当前类型下已存在相同名称的计划")
		}
	}

	// 转换业务梳理事项为数据库字段
	modelQty, processQty, tableQty := convertBusinessItemsToDBFields(req.BusinessItems)

	// 手动设置时间，去除毫秒
	now := time.Now().Truncate(time.Second) // 去除毫秒部分

	po := &tTargetPlan{
		TargetID:       req.TargetID,
		AssessmentType: req.AssessmentType,
		PlanType:       req.PlanType,
		PlanName:       req.PlanName,
		PlanDesc:       req.PlanDesc,
		ResponsibleUID: req.ResponsibleUID,
		Status:         status,
		CreatedBy:      userID,
		CreatedAt:      now,  // 手动设置创建时间
		UpdatedAt:      &now, // 手动设置更新时间
	}

	// 根据考核类型和计划类型设置不同的字段
	switch req.AssessmentType {
	case 1: // 部门考核
		switch req.PlanType {
		case 1: // 数据获取
			po.PlanQuantity = planQuantity
			po.ActualQuantity = req.ActualQuantity
			po.RelatedDataCollectionPlanID = req.RelatedDataCollectionPlanID // 字符串，用逗号隔开
		case 2: // 数据质量整改
			po.PlanQuantity = planQuantity
			po.ActualQuantity = req.ActualQuantity
		case 3: // 数据资源编目
			po.PlanQuantity = planQuantity
			po.ActualQuantity = req.ActualQuantity
		case 4: // 业务梳理
			po.PlanQuantity = planQuantity
			po.ActualQuantity = req.ActualQuantity
			po.BusinessModelQuantity = modelQty
			po.BusinessProcessQuantity = processQty
			po.BusinessTableQuantity = tableQty
		default:
			return 0, fmt.Errorf("不支持的部门考核计划类型: %d", req.PlanType)
		}
	case 2: // 运营考核
		switch req.PlanType {
		case 1: // 数据获取
			po.DataCollectionQuantity = req.DataCollectionQuantity
			po.RelatedDataCollectionPlanID = req.RelatedDataCollectionPlanID
		case 5: // 数据处理
			po.DataProcessExploreQuantity = req.DataProcessExploreQuantity
			po.DataProcessFusionQuantity = req.DataProcessFusionQuantity
			po.RelatedDataProcessPlanID = req.RelatedDataProcessPlanID
		case 6: // 数据理解
			po.DataUnderstandingQuantity = req.DataUnderstandingQuantity
			po.RelatedDataUnderstandingPlanID = req.RelatedDataUnderstandingPlanID
		default:
			return 0, fmt.Errorf("不支持的运营考核计划类型: %d", req.PlanType)
		}
	default:
		return 0, fmt.Errorf("不支持的考核类型: %d", req.AssessmentType)
	}

	if err := r.db.WithContext(ctx).Create(po).Error; err != nil {
		return 0, wrapDBErr(err)
	}
	return po.ID, nil
}

func (r *AssessmentRepoImpl) UpdatePlan(ctx context.Context, id uint64, req assessment.PlanUpdateReq, userID string) error {
	// 如果修改了计划名称，校验当前类型下名称唯一
	if req.PlanName != nil && *req.PlanName != "" {
		var cur tTargetPlan
		if err := r.db.WithContext(ctx).Where("id = ?", id).First(&cur).Error; err != nil {
			return err // 直接返回原始错误，不使用 wrapDBErr
		}

		newAssessmentType := cur.AssessmentType
		newPlanType := cur.PlanType
		if req.AssessmentType != nil {
			newAssessmentType = *req.AssessmentType
		}
		if req.PlanType != nil {
			newPlanType = *req.PlanType
		}

		var cnt int64
		err := r.db.WithContext(ctx).Model(&tTargetPlan{}).
			Where("target_id = ? AND plan_name = ? AND assessment_type = ? AND plan_type = ? AND id <> ?",
				cur.TargetID, *req.PlanName, newAssessmentType, newPlanType, id).
			Count(&cnt).Error
		if err != nil {
			return err // 直接返回原始错误，不使用 wrapDBErr
		}
		if cnt > 0 {
			return errorcode.Detail(errorcode.PublicInvalidParameterValue, "当前类型下已存在相同名称的计划")
		}
	}

	updates := map[string]any{}
	if req.AssessmentType != nil {
		updates["assessment_type"] = *req.AssessmentType
	}
	if req.PlanType != nil {
		updates["plan_type"] = *req.PlanType
	}
	if req.PlanName != nil {
		updates["plan_name"] = *req.PlanName
	}
	if req.PlanDesc != nil {
		updates["plan_desc"] = *req.PlanDesc
	}
	if req.ResponsibleUID != nil {
		updates["responsible_uid"] = *req.ResponsibleUID
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	// 已删除冗余字段：reason, evaluation_content, content, priority
	if req.RelatedDataCollectionPlanID != nil {
		updates["related_data_collection_plan_id"] = *req.RelatedDataCollectionPlanID
	}

	// 根据考核类型和计划类型更新不同的字段
	if req.AssessmentType != nil && req.PlanType != nil {
		switch *req.AssessmentType {
		case 1: // 部门考核
			switch *req.PlanType {
			case 1: // 数据获取
				if req.PlanQuantity != nil {
					updates["plan_quantity"] = *req.PlanQuantity
				}
				if req.ActualQuantity != nil {
					updates["actual_quantity"] = *req.ActualQuantity
				}
			case 2: // 数据质量整改
				if req.PlanQuantity != nil {
					updates["plan_quantity"] = *req.PlanQuantity
				}
				if req.ActualQuantity != nil {
					updates["actual_quantity"] = *req.ActualQuantity
				}
			case 3: // 数据资源编目
				if req.PlanQuantity != nil {
					updates["plan_quantity"] = *req.PlanQuantity
				}
				if req.ActualQuantity != nil {
					updates["actual_quantity"] = *req.ActualQuantity
				}
			case 4: // 业务梳理
				if req.PlanQuantity != nil {
					updates["plan_quantity"] = *req.PlanQuantity
				}
				if req.ActualQuantity != nil {
					updates["actual_quantity"] = *req.ActualQuantity
				}
				if req.BusinessItems != nil {
					modelQty, processQty, tableQty := convertBusinessItemsToDBFields(*req.BusinessItems)
					if modelQty != nil {
						updates["business_model_quantity"] = *modelQty
					}
					if processQty != nil {
						updates["business_process_quantity"] = *processQty
					}
					if tableQty != nil {
						updates["business_table_quantity"] = *tableQty
					}
				}
			default:
				return fmt.Errorf("不支持的部门考核计划类型: %d", *req.PlanType)
			}
		case 2: // 运营考核
			switch *req.PlanType {
			case 1: // 数据获取
				if req.DataCollectionQuantity != nil {
					updates["data_collection_quantity"] = *req.DataCollectionQuantity
				}
				if req.RelatedDataCollectionPlanID != nil {
					updates["related_data_collection_plan_id"] = *req.RelatedDataCollectionPlanID
				}
			case 5: // 数据处理
				if req.DataProcessExploreQuantity != nil {
					updates["data_process_explore_quantity"] = *req.DataProcessExploreQuantity
				}
				if req.DataProcessFusionQuantity != nil {
					updates["data_process_fusion_quantity"] = *req.DataProcessFusionQuantity
				}
				if req.RelatedDataProcessPlanID != nil {
					updates["related_data_process_plan_id"] = *req.RelatedDataProcessPlanID
				}
			case 6: // 数据理解
				if req.DataUnderstandingQuantity != nil {
					updates["data_understanding_quantity"] = *req.DataUnderstandingQuantity
				}
				if req.RelatedDataUnderstandingPlanID != nil {
					updates["related_data_understanding_plan_id"] = *req.RelatedDataUnderstandingPlanID
				}
			default:
				return fmt.Errorf("不支持的运营考核计划类型: %d", *req.PlanType)
			}
		default:
			return fmt.Errorf("不支持的考核类型: %d", *req.AssessmentType)
		}
	} else {
		// 如果没有更新 assessment_type 和 plan_type，则更新通用字段
		if req.PlanQuantity != nil {
			updates["plan_quantity"] = *req.PlanQuantity
		}
		if req.ActualQuantity != nil {
			updates["actual_quantity"] = *req.ActualQuantity
		}
		if req.BusinessItems != nil {
			modelQty, processQty, tableQty := convertBusinessItemsToDBFields(*req.BusinessItems)
			if modelQty != nil {
				updates["business_model_quantity"] = *modelQty
			}
			if processQty != nil {
				updates["business_process_quantity"] = *processQty
			}
			if tableQty != nil {
				updates["business_table_quantity"] = *tableQty
			}
		}
		// 运营考核字段
		if req.DataCollectionQuantity != nil {
			updates["data_collection_quantity"] = *req.DataCollectionQuantity
		}
		if req.DataProcessExploreQuantity != nil {
			updates["data_process_explore_quantity"] = *req.DataProcessExploreQuantity
		}
		if req.DataProcessFusionQuantity != nil {
			updates["data_process_fusion_quantity"] = *req.DataProcessFusionQuantity
		}
		if req.DataUnderstandingQuantity != nil {
			updates["data_understanding_quantity"] = *req.DataUnderstandingQuantity
		}
		if req.RelatedDataProcessPlanID != nil {
			updates["related_data_process_plan_id"] = *req.RelatedDataProcessPlanID
		}
		if req.RelatedDataUnderstandingPlanID != nil {
			updates["related_data_understanding_plan_id"] = *req.RelatedDataUnderstandingPlanID
		}
	}

	// 设置更新人
	updates["updated_by"] = userID

	return r.db.WithContext(ctx).Model(&tTargetPlan{}).Where("id = ?", id).Updates(updates).Error
}

func (r *AssessmentRepoImpl) DeletePlan(ctx context.Context, id uint64, _ string) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&tTargetPlan{}).Error
}

func (r *AssessmentRepoImpl) GetPlan(ctx context.Context, id uint64) (*assessment.Plan, error) {
	var po tTargetPlan
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&po).Error; err != nil {
		return nil, err
	}
	return toPlanEntity(&po), nil
}

func (r *AssessmentRepoImpl) ListPlans(ctx context.Context, q assessment.PlanQuery) (*assessment.PageResp[assessment.Plan], error) {
	db := r.db.WithContext(ctx).Model(&tTargetPlan{})

	// 构建查询条件
	if q.TargetID != nil {
		db = db.Where("target_id = ?", *q.TargetID)
	}
	if q.PlanType != nil {
		db = db.Where("plan_type = ?", *q.PlanType)
	}
	if q.Status != nil {
		db = db.Where("status = ?", *q.Status)
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, err
	}

	// 构建排序逻辑
	var orderClause string
	switch q.Sort {
	case "plan_name":
		orderClause = fmt.Sprintf("plan_name %s", q.Direction)
	case "status":
		orderClause = fmt.Sprintf("status %s", q.Direction)
	case "created_at":
		orderClause = fmt.Sprintf("created_at %s", q.Direction)
	case "updated_at":
		orderClause = fmt.Sprintf("updated_at %s", q.Direction)
	default:
		// 默认按创建时间降序
		orderClause = "created_at DESC"
	}

	var list []tTargetPlan
	if err := db.Order(orderClause).Offset(q.Offset).Limit(q.Limit).Find(&list).Error; err != nil {
		return nil, err
	}

	resp := make([]assessment.Plan, 0, len(list))
	for i := range list {
		resp = append(resp, *toPlanEntity(&list[i]))
	}
	return &assessment.PageResp[assessment.Plan]{Total: total, List: resp}, nil
}

// 新增：根据目标ID查询计划列表
func (r *AssessmentRepoImpl) ListPlansByTargetID(ctx context.Context, targetID uint64) ([]assessment.Plan, error) {
	fmt.Printf("=== Repository: ListPlansByTargetID 开始执行，目标ID: %d ===\n", targetID)

	var list []tTargetPlan
	if err := r.db.WithContext(ctx).Where("target_id = ?", targetID).Find(&list).Error; err != nil {
		fmt.Printf("Repository: 查询计划失败: %v\n", err)
		return nil, err
	}

	fmt.Printf("Repository: 查询到 %d 个计划\n", len(list))
	for i, plan := range list {
		fmt.Printf("Repository: 计划 %d: ID=%d, Type=%d, Name=%s\n", i+1, plan.ID, plan.PlanType, plan.PlanName)
	}

	resp := make([]assessment.Plan, 0, len(list))
	for i := range list {
		resp = append(resp, *toPlanEntity(&list[i]))
	}

	fmt.Printf("Repository: 转换完成，返回 %d 个计划\n", len(resp))
	fmt.Printf("=== Repository: ListPlansByTargetID 执行完成 ===\n")
	return resp, nil
}

// 新增：根据目标ID和计划名称查询计划列表
func (r *AssessmentRepoImpl) ListPlansByTargetIDAndName(ctx context.Context, targetID uint64, planName *string) ([]assessment.Plan, error) {
	fmt.Printf("=== Repository: ListPlansByTargetIDAndName 开始执行，目标ID: %d, 计划名称: %v ===\n", targetID, planName)

	db := r.db.WithContext(ctx).Where("target_id = ?", targetID)

	// 如果提供了计划名称，添加模糊查询条件
	if planName != nil && *planName != "" {
		db = db.Where("plan_name LIKE ?", "%"+*planName+"%")
		fmt.Printf("Repository: 添加计划名称过滤条件: %s\n", *planName)
	}

	var list []tTargetPlan
	if err := db.Find(&list).Error; err != nil {
		fmt.Printf("Repository: 查询计划失败: %v\n", err)
		return nil, err
	}

	fmt.Printf("Repository: 查询到 %d 个计划\n", len(list))
	for i, plan := range list {
		fmt.Printf("Repository: 计划 %d: ID=%d, Type=%d, Name=%s\n", i+1, plan.ID, plan.PlanType, plan.PlanName)
	}

	resp := make([]assessment.Plan, 0, len(list))
	for i := range list {
		resp = append(resp, *toPlanEntity(&list[i]))
	}

	fmt.Printf("Repository: 转换完成，返回 %d 个计划\n", len(resp))
	fmt.Printf("=== Repository: ListPlansByTargetIDAndName 执行完成 ===\n")
	return resp, nil
}

// 新增：更新计划评价数据
func (r *AssessmentRepoImpl) UpdatePlanEvaluation(ctx context.Context, planID uint64, actualQuantity *int, modelActualCount *int, flowActualCount *int, tableActualCount *int, userID string) error {
	fmt.Printf("=== Repository: UpdatePlanEvaluation 开始执行，计划ID: %d ===\n", planID)

	updates := map[string]any{
		"updated_by": userID,
		"status":     1, // 设置为已填状态
	}

	// 根据计划类型设置不同的字段
	if actualQuantity != nil {
		updates["actual_quantity"] = *actualQuantity
	}
	if modelActualCount != nil {
		updates["business_model_quantity"] = *modelActualCount
	}
	if flowActualCount != nil {
		updates["business_process_quantity"] = *flowActualCount
	}
	if tableActualCount != nil {
		updates["business_table_quantity"] = *tableActualCount
	}

	if err := r.db.WithContext(ctx).Model(&tTargetPlan{}).Where("id = ?", planID).Updates(updates).Error; err != nil {
		fmt.Printf("Repository: 更新计划评价数据失败: %v\n", err)
		return err
	}

	fmt.Printf("Repository: 成功更新计划评价数据，计划ID: %d\n", planID)
	fmt.Printf("=== Repository: UpdatePlanEvaluation 执行完成 ===\n")
	return nil
}

// 新增：更新目标评价内容
func (r *AssessmentRepoImpl) UpdateTargetEvaluation(ctx context.Context, targetID uint64, evaluationContent string, userID string) error {
	fmt.Printf("=== Repository: UpdateTargetEvaluation 开始执行，目标ID: %d ===\n", targetID)

	updates := map[string]any{
		"status":     3, // 设置为已结束状态
		"updated_by": userID,
	}

	if evaluationContent != "" {
		updates["evaluation_content"] = evaluationContent
	}

	if err := r.db.WithContext(ctx).Model(&tTarget{}).Where("id = ?", targetID).Updates(updates).Error; err != nil {
		fmt.Printf("Repository: 更新目标评价内容失败: %v\n", err)
		return err
	}

	fmt.Printf("Repository: 成功更新目标评价内容，目标ID: %d\n", targetID)
	fmt.Printf("=== Repository: UpdateTargetEvaluation 执行完成 ===\n")
	return nil
}

// 新增：批量评价更新（支持事务）
func (r *AssessmentRepoImpl) SubmitEvaluationWithTransaction(ctx context.Context, targetID uint64, req assessment.EvaluationSubmitReq, userID string) error {
	fmt.Printf("=== Repository: SubmitEvaluationWithTransaction 开始执行，目标ID: %d ===\n", targetID)

	// 开始事务
	tx := r.db.WithContext(ctx).Begin()
	if tx.Error != nil {
		return tx.Error
	}

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 1. 处理数据获取类型评价
	for _, eval := range req.DataCollection {
		updates := map[string]any{
			"updated_by": userID,
			"status":     1, // 设置为已填状态
		}
		if eval.ActualQuantity > 0 {
			updates["actual_quantity"] = eval.ActualQuantity
		}

		if err := tx.Model(&tTargetPlan{}).Where("id = ?", eval.ID).Updates(updates).Error; err != nil {
			fmt.Printf("Repository: 更新数据获取类型评价失败: %v\n", err)
			tx.Rollback()
			return err
		}
	}

	// 2. 处理数据质量整改类型评价
	for _, eval := range req.QualityImprove {
		updates := map[string]any{
			"updated_by": userID,
			"status":     1, // 设置为已填状态
		}
		if eval.ActualQuantity > 0 {
			updates["actual_quantity"] = eval.ActualQuantity
		}

		if err := tx.Model(&tTargetPlan{}).Where("id = ?", eval.ID).Updates(updates).Error; err != nil {
			fmt.Printf("Repository: 更新数据质量整改类型评价失败: %v\n", err)
			tx.Rollback()
			return err
		}
	}

	// 3. 处理数据资源编目类型评价
	for _, eval := range req.ResourceCatalog {
		updates := map[string]any{
			"updated_by": userID,
			"status":     1, // 设置为已填状态
		}
		if eval.ActualQuantity > 0 {
			updates["actual_quantity"] = eval.ActualQuantity
		}

		if err := tx.Model(&tTargetPlan{}).Where("id = ?", eval.ID).Updates(updates).Error; err != nil {
			fmt.Printf("Repository: 更新数据资源编目类型评价失败: %v\n", err)
			tx.Rollback()
			return err
		}
	}

	// 4. 处理业务梳理类型评价
	for _, eval := range req.BusinessAnalysis {
		updates := map[string]any{
			"updated_by": userID,
			"status":     1, // 设置为已填状态
		}
		if eval.ModelActualCount > 0 {
			updates["business_model_actual_quantity"] = eval.ModelActualCount
		}
		if eval.FlowActualCount > 0 {
			updates["business_process_actual_quantity"] = eval.FlowActualCount
		}
		if eval.TableActualCount > 0 {
			updates["business_table_actual_quantity"] = eval.TableActualCount
		}

		if err := tx.Model(&tTargetPlan{}).Where("id = ?", eval.ID).Updates(updates).Error; err != nil {
			fmt.Printf("Repository: 更新业务梳理类型评价失败: %v\n", err)
			tx.Rollback()
			return err
		}
	}

	// 5. 新增：处理运维考核-数据获取类型评价
	for _, eval := range req.OperationDataCollection {
		updates := map[string]any{
			"updated_by": userID,
			"status":     1, // 设置为已填状态
		}
		if eval.ActualQuantity > 0 {
			updates["data_collection_actual_quantity"] = eval.ActualQuantity
		}

		if err := tx.Model(&tTargetPlan{}).Where("id = ?", eval.ID).Updates(updates).Error; err != nil {
			fmt.Printf("Repository: 更新运维考核-数据获取类型评价失败: %v\n", err)
			tx.Rollback()
			return err
		}
	}

	// 6. 新增：处理运维考核-数据处理类型评价
	for _, eval := range req.OperationDataProcess {
		updates := map[string]any{
			"updated_by": userID,
			"status":     1, // 设置为已填状态
		}
		if eval.DataProcessExploreActual > 0 {
			updates["data_process_explore_actual_quantity"] = eval.DataProcessExploreActual
		}
		if eval.DataProcessFusionActual > 0 {
			updates["data_process_fusion_actual_quantity"] = eval.DataProcessFusionActual
		}

		if err := tx.Model(&tTargetPlan{}).Where("id = ?", eval.ID).Updates(updates).Error; err != nil {
			fmt.Printf("Repository: 更新运维考核-数据处理类型评价失败: %v\n", err)
			tx.Rollback()
			return err
		}
	}

	// 7. 新增：处理运维考核-数据理解类型评价
	for _, eval := range req.OperationDataUnderstanding {
		updates := map[string]any{
			"updated_by": userID,
			"status":     1, // 设置为已填状态
		}
		if eval.DataUnderstandingActual > 0 {
			updates["data_understanding_actual_quantity"] = eval.DataUnderstandingActual
		}

		if err := tx.Model(&tTargetPlan{}).Where("id = ?", eval.ID).Updates(updates).Error; err != nil {
			fmt.Printf("Repository: 更新运维考核-数据理解类型评价失败: %v\n", err)
			tx.Rollback()
			return err
		}
	}

	// 8. 更新目标评价内容和状态
	targetUpdates := map[string]any{
		"status":     3, // 设置为已结束状态
		"updated_by": userID,
	}
	if req.EvaluationContent != "" {
		targetUpdates["evaluation_content"] = req.EvaluationContent
	}

	if err := tx.Model(&tTarget{}).Where("id = ?", targetID).Updates(targetUpdates).Error; err != nil {
		fmt.Printf("Repository: 更新目标评价内容失败: %v\n", err)
		tx.Rollback()
		return err
	}

	// 9. 提交事务
	if err := tx.Commit().Error; err != nil {
		fmt.Printf("Repository: 提交事务失败: %v\n", err)
		return err
	}

	fmt.Printf("Repository: 成功提交评价事务，目标ID: %d\n", targetID)
	fmt.Printf("=== Repository: SubmitEvaluationWithTransaction 执行完成 ===\n")
	return nil
}

// 新增：获取目标统计数据
func (r *AssessmentRepoImpl) GetTargetStatistics(ctx context.Context, targetID uint64) (*assessment.StatisticsOverview, error) {
	fmt.Printf("=== Repository: GetTargetStatistics 开始执行，目标ID: %d ===\n", targetID)

	// 查询该目标下的所有计划
	var plans []tTargetPlan
	if err := r.db.WithContext(ctx).Where("target_id = ?", targetID).Find(&plans).Error; err != nil {
		return nil, err
	}

	statistics := &assessment.StatisticsOverview{}

	// 按计划类型分组统计
	for _, plan := range plans {
		switch plan.PlanType {
		case 1: // 数据获取
			if statistics.DataCollection == nil {
				statistics.DataCollection = &assessment.DataCollectionStatistics{}
			}
			statistics.DataCollection.PlanCount += plan.PlanQuantity
			if plan.ActualQuantity != nil {
				statistics.DataCollection.ActualCount += *plan.ActualQuantity
			}
		case 2: // 数据质量整改
			if statistics.QualityImprove == nil {
				statistics.QualityImprove = &assessment.QualityImproveStatistics{}
			}
			statistics.QualityImprove.PlanCount += plan.PlanQuantity
			if plan.ActualQuantity != nil {
				statistics.QualityImprove.ActualCount += *plan.ActualQuantity
			}
		case 3: // 数据资源编目
			if statistics.ResourceCatalog == nil {
				statistics.ResourceCatalog = &assessment.ResourceCatalogStatistics{}
			}
			statistics.ResourceCatalog.PlanCount += plan.PlanQuantity
			if plan.ActualQuantity != nil {
				statistics.ResourceCatalog.ActualCount += *plan.ActualQuantity
			}
		case 4: // 业务梳理
			if statistics.BusinessAnalysis == nil {
				statistics.BusinessAnalysis = &assessment.BusinessAnalysisStatistics{}
			}
			// 从BusinessItems中提取计划数量
			if plan.BusinessModelQuantity != nil {
				statistics.BusinessAnalysis.ModelPlanCount += *plan.BusinessModelQuantity
			}
			if plan.BusinessProcessQuantity != nil {
				statistics.BusinessAnalysis.FlowPlanCount += *plan.BusinessProcessQuantity
			}
			if plan.BusinessTableQuantity != nil {
				statistics.BusinessAnalysis.TablePlanCount += *plan.BusinessTableQuantity
			}
			// 实际完成数量
			if plan.BusinessModelActualQuantity != nil {
				statistics.BusinessAnalysis.ModelActualCount += *plan.BusinessModelActualQuantity
			}
			if plan.BusinessProcessActualQuantity != nil {
				statistics.BusinessAnalysis.FlowActualCount += *plan.BusinessProcessActualQuantity
			}
			if plan.BusinessTableActualQuantity != nil {
				statistics.BusinessAnalysis.TableActualCount += *plan.BusinessTableActualQuantity
			}
		}
	}

	// 计算完成率
	if statistics.DataCollection != nil && statistics.DataCollection.PlanCount > 0 {
		statistics.DataCollection.CompletionRate = float64(statistics.DataCollection.ActualCount) / float64(statistics.DataCollection.PlanCount) * 100
	}
	if statistics.QualityImprove != nil && statistics.QualityImprove.PlanCount > 0 {
		statistics.QualityImprove.CompletionRate = float64(statistics.QualityImprove.ActualCount) / float64(statistics.QualityImprove.PlanCount) * 100
	}
	if statistics.ResourceCatalog != nil && statistics.ResourceCatalog.PlanCount > 0 {
		statistics.ResourceCatalog.CompletionRate = float64(statistics.ResourceCatalog.ActualCount) / float64(statistics.ResourceCatalog.PlanCount) * 100
	}
	if statistics.BusinessAnalysis != nil {
		if statistics.BusinessAnalysis.ModelPlanCount > 0 {
			statistics.BusinessAnalysis.ModelCompletionRate = float64(statistics.BusinessAnalysis.ModelActualCount) / float64(statistics.BusinessAnalysis.ModelPlanCount) * 100
		}
		if statistics.BusinessAnalysis.FlowPlanCount > 0 {
			statistics.BusinessAnalysis.FlowCompletionRate = float64(statistics.BusinessAnalysis.FlowActualCount) / float64(statistics.BusinessAnalysis.FlowPlanCount) * 100
		}
		if statistics.BusinessAnalysis.TablePlanCount > 0 {
			statistics.BusinessAnalysis.TableCompletionRate = float64(statistics.BusinessAnalysis.TableActualCount) / float64(statistics.BusinessAnalysis.TablePlanCount) * 100
		}
	}

	fmt.Printf("=== Repository: GetTargetStatistics 执行完成 ===\n")
	return statistics, nil
}

// 新增：获取部门第一个目标
func (r *AssessmentRepoImpl) GetFirstTargetByDepartment(ctx context.Context, departmentID string) (*assessment.Target, error) {
	var target tTarget
	if err := r.db.WithContext(ctx).Where("department_id = ?", departmentID).Order("created_at ASC").First(&target).Error; err != nil {
		return nil, err
	}
	return toTargetEntity(&target), nil
}

// 新增：根据部门ID和目标名称获取目标
func (r *AssessmentRepoImpl) GetTargetByDepartmentAndName(ctx context.Context, departmentID, targetName string) (*assessment.Target, error) {
	var target tTarget
	if err := r.db.WithContext(ctx).Where("department_id = ? AND target_name = ?", departmentID, targetName).First(&target).Error; err != nil {
		return nil, err
	}
	return toTargetEntity(&target), nil
}

// 新增：获取第一个已完成的目标（状态为3，按名称排序）
func (r *AssessmentRepoImpl) GetFirstCompletedTarget(ctx context.Context) (*assessment.Target, error) {
	var target tTarget
	if err := r.db.WithContext(ctx).Where("status = ?", 3).Order("target_name ASC").First(&target).Error; err != nil {
		return nil, err
	}
	return toTargetEntity(&target), nil
}

// 新增：根据名称获取已完成的目标（状态为3）
func (r *AssessmentRepoImpl) GetCompletedTargetByName(ctx context.Context, targetName string) (*assessment.Target, error) {
	var target tTarget
	if err := r.db.WithContext(ctx).Where("status = ? AND target_name = ?", 3, targetName).First(&target).Error; err != nil {
		return nil, err
	}
	return toTargetEntity(&target), nil
}

// 新增：根据名称获取目标（不管状态）
func (r *AssessmentRepoImpl) GetTargetByName(ctx context.Context, targetName string) (*assessment.Target, error) {
	var target tTarget
	if err := r.db.WithContext(ctx).Where("target_name = ?", targetName).First(&target).Error; err != nil {
		return nil, err
	}
	return toTargetEntity(&target), nil
}

// 运营考核计划相关方法
func (r *AssessmentRepoImpl) CreateOperationPlan(ctx context.Context, req assessment.OperationPlanCreateReq, userID string) (uint64, error) {
	// 设置默认值
	var status uint8 = 0 // 默认未填状态

	// 校验：当前类型下计划名称不能重复
	{
		var cnt int64
		err := r.db.WithContext(ctx).Model(&tTargetPlan{}).
			Where("target_id = ? AND plan_name = ? AND assessment_type = ? AND plan_type = ?",
				req.TargetID, req.PlanName, req.AssessmentType, req.PlanType).
			Count(&cnt).Error
		if err != nil {
			return 0, err // 直接返回原始错误，不使用 wrapDBErr
		}
		if cnt > 0 {
			return 0, errorcode.Detail(errorcode.PublicInvalidExistsPlanValue, "当前类型下已存在相同名称的计划")
		}
	}

	// 手动设置时间，去除毫秒
	now := time.Now().Truncate(time.Second) // 去除毫秒部分

	po := &tTargetPlan{
		TargetID:       req.TargetID,
		PlanType:       req.PlanType,
		PlanName:       req.PlanName,
		PlanDesc:       req.PlanDesc,
		ResponsibleUID: req.ResponsibleUID,
		Status:         status,
		CreatedBy:      userID,
		AssessmentType: req.AssessmentType,
		CreatedAt:      now,  // 手动设置创建时间
		UpdatedAt:      &now, // 手动设置更新时间
	}

	// 根据计划类型设置不同的字段（运营考核类型 1,5,6）
	// 根据考核类型和计划类型设置不同的字段
	switch req.AssessmentType {
	case 1: // 部门考核
		switch req.PlanType {
		case 1: // 数据获取
			po.PlanQuantity = req.PlanQuantity
			po.RelatedDataCollectionPlanID = req.RelatedDataCollectionPlanID // 字符串，用逗号隔开
		case 2: // 数据质量整改
			po.PlanQuantity = req.PlanQuantity
		case 3: // 数据资源编目
			po.PlanQuantity = req.PlanQuantity
		case 4: // 业务梳理
			po.PlanQuantity = req.PlanQuantity
			// 解析 business_items 数组，设置具体的数量字段
			var items []assessment.BusinessItem
			if req.BusinessItems != nil {
				items = *req.BusinessItems
			}
			modelQty, processQty, tableQty := convertBusinessItemsToDBFields(items)
			po.BusinessModelQuantity = modelQty
			po.BusinessProcessQuantity = processQty
			po.BusinessTableQuantity = tableQty

		default:
			return 0, fmt.Errorf("不支持的部门考核计划类型: %d", req.PlanType)
		}
	case 2: // 运营考核
		switch req.PlanType {
		case 1: // 数据获取
			po.PlanQuantity = req.PlanQuantity // 添加这行，保存plan_quantity
			po.DataCollectionQuantity = req.DataCollectionQuantity
			po.RelatedDataCollectionPlanID = req.RelatedDataCollectionPlanID
		case 5: // 数据处理
			po.PlanQuantity = req.PlanQuantity // 添加这行，保存plan_quantity
			po.DataProcessExploreQuantity = req.DataProcessExploreQuantity
			po.DataProcessFusionQuantity = req.DataProcessFusionQuantity
			po.RelatedDataProcessPlanID = req.RelatedDataProcessPlanID
		case 6: // 数据理解
			po.PlanQuantity = req.PlanQuantity // 添加这行，保存plan_quantity
			po.DataUnderstandingQuantity = req.DataUnderstandingQuantity
			po.RelatedDataUnderstandingPlanID = req.RelatedDataUnderstandingPlanID
		default:
			return 0, fmt.Errorf("不支持的运营考核计划类型: %d", req.PlanType)
		}
	default:
		return 0, fmt.Errorf("不支持的考核类型: %d", req.AssessmentType)
	}

	if err := r.db.WithContext(ctx).Create(po).Error; err != nil {
		return 0, wrapDBErr(err)
	}
	return po.ID, nil
}

func (r *AssessmentRepoImpl) UpdateOperationPlan(ctx context.Context, id uint64, req assessment.OperationPlanUpdateReq, userID string) error {
	// 如果修改了计划名称，校验当前类型下名称唯一
	if req.PlanName != nil && *req.PlanName != "" {
		var cur tTargetPlan
		if err := r.db.WithContext(ctx).Where("id = ?", id).First(&cur).Error; err != nil {
			return err // 直接返回原始错误，不使用 wrapDBErr
		}

		newAssessmentType := cur.AssessmentType
		newPlanType := cur.PlanType
		if req.AssessmentType != nil {
			newAssessmentType = *req.AssessmentType
		}
		if req.PlanType != nil {
			newPlanType = *req.PlanType
		}

		var cnt int64
		err := r.db.WithContext(ctx).Model(&tTargetPlan{}).
			Where("target_id = ? AND plan_name = ? AND assessment_type = ? AND plan_type = ? AND id <> ?",
				cur.TargetID, *req.PlanName, newAssessmentType, newPlanType, id).
			Count(&cnt).Error
		if err != nil {
			return err // 直接返回原始错误，不使用 wrapDBErr
		}
		if cnt > 0 {
			return errorcode.Detail(errorcode.PublicInvalidParameterValue, "当前类型下已存在相同名称的计划")
		}
	}

	updates := map[string]any{}

	if req.AssessmentType != nil {
		updates["assessment_type"] = *req.AssessmentType
	}
	if req.PlanType != nil {
		updates["plan_type"] = *req.PlanType
	}
	if req.PlanName != nil {
		updates["plan_name"] = *req.PlanName
	}
	if req.PlanDesc != nil {
		updates["plan_desc"] = *req.PlanDesc
	}
	if req.ResponsibleUID != nil {
		updates["responsible_uid"] = *req.ResponsibleUID
	}

	// 根据考核类型和计划类型更新不同的字段
	if req.AssessmentType != nil && req.PlanType != nil {
		switch *req.AssessmentType {
		case 1: // 部门考核
			switch *req.PlanType {
			case 1: // 数据获取
				if req.PlanQuantity != nil {
					updates["plan_quantity"] = *req.PlanQuantity
				}
				if req.RelatedDataCollectionPlanID != nil {
					updates["related_data_collection_plan_id"] = *req.RelatedDataCollectionPlanID
				}
			case 2: // 数据质量整改
				if req.PlanQuantity != nil {
					updates["plan_quantity"] = *req.PlanQuantity
				}
			case 3: // 数据资源编目
				if req.PlanQuantity != nil {
					updates["plan_quantity"] = *req.PlanQuantity
				}
			case 4: // 业务梳理
				if req.PlanQuantity != nil {
					updates["plan_quantity"] = *req.PlanQuantity
				}
				if req.BusinessItems != nil {
					modelQty, processQty, tableQty := convertBusinessItemsToDBFields(*req.BusinessItems)
					if modelQty != nil {
						updates["business_model_quantity"] = *modelQty
					}
					if processQty != nil {
						updates["business_process_quantity"] = *processQty
					}
					if tableQty != nil {
						updates["business_table_quantity"] = *tableQty
					}
				}
			default:
				return fmt.Errorf("不支持的部门考核计划类型: %d", *req.PlanType)
			}
		case 2: // 运营考核
			switch *req.PlanType {
			case 1: // 数据获取
				if req.DataCollectionQuantity != nil {
					updates["data_collection_quantity"] = *req.DataCollectionQuantity
				}
				if req.RelatedDataCollectionPlanID != nil {
					updates["related_data_collection_plan_id"] = *req.RelatedDataCollectionPlanID
				}
			case 5: // 数据处理
				if req.DataProcessExploreQuantity != nil {
					updates["data_process_explore_quantity"] = *req.DataProcessExploreQuantity
				}
				if req.DataProcessFusionQuantity != nil {
					updates["data_process_fusion_quantity"] = *req.DataProcessFusionQuantity
				}
				if req.RelatedDataProcessPlanID != nil {
					updates["related_data_process_plan_id"] = *req.RelatedDataProcessPlanID
				}
			case 6: // 数据理解
				if req.DataUnderstandingQuantity != nil {
					updates["data_understanding_quantity"] = *req.DataUnderstandingQuantity
				}
				if req.RelatedDataUnderstandingPlanID != nil {
					updates["related_data_understanding_plan_id"] = *req.RelatedDataUnderstandingPlanID
				}
			default:
				return fmt.Errorf("不支持的运营考核计划类型: %d", *req.PlanType)
			}
		default:
			return fmt.Errorf("不支持的考核类型: %d", *req.AssessmentType)
		}
	} else {
		// 如果没有更新 assessment_type 和 plan_type，则更新通用字段
		// 部门考核字段
		if req.PlanQuantity != nil {
			updates["plan_quantity"] = *req.PlanQuantity
		}
		if req.BusinessItems != nil {
			modelQty, processQty, tableQty := convertBusinessItemsToDBFields(*req.BusinessItems)
			if modelQty != nil {
				updates["business_model_quantity"] = *modelQty
			}
			if processQty != nil {
				updates["business_process_quantity"] = *processQty
			}
			if tableQty != nil {
				updates["business_table_quantity"] = *tableQty
			}
		}
		if req.RelatedDataCollectionPlanID != nil {
			updates["related_data_collection_plan_id"] = *req.RelatedDataCollectionPlanID
		}
		// 运营考核字段
		if req.DataCollectionQuantity != nil {
			updates["data_collection_quantity"] = *req.DataCollectionQuantity
		}
		if req.DataProcessExploreQuantity != nil {
			updates["data_process_explore_quantity"] = *req.DataProcessExploreQuantity
		}
		if req.DataProcessFusionQuantity != nil {
			updates["data_process_fusion_quantity"] = *req.DataProcessFusionQuantity
		}
		if req.RelatedDataProcessPlanID != nil {
			updates["related_data_process_plan_id"] = *req.RelatedDataProcessPlanID
		}
		if req.DataUnderstandingQuantity != nil {
			updates["data_understanding_quantity"] = *req.DataUnderstandingQuantity
		}
		if req.RelatedDataUnderstandingPlanID != nil {
			updates["related_data_understanding_plan_id"] = *req.RelatedDataUnderstandingPlanID
		}
	}

	// 设置更新人
	updates["updated_by"] = userID

	return r.db.WithContext(ctx).Model(&tTargetPlan{}).Where("id = ?", id).Updates(updates).Error
}

func (r *AssessmentRepoImpl) DeleteOperationPlan(ctx context.Context, id uint64, userID string) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&tTargetPlan{}).Error
}

func (r *AssessmentRepoImpl) ListOperationPlansByTargetID(ctx context.Context, targetID uint64) ([]assessment.Plan, error) {
	var list []tTargetPlan
	if err := r.db.WithContext(ctx).Where("target_id = ? AND plan_type IN (1, 5, 6)", targetID).Find(&list).Error; err != nil {
		return nil, err
	}

	resp := make([]assessment.Plan, 0, len(list))
	for i := range list {
		resp = append(resp, *toPlanEntity(&list[i]))
	}
	return resp, nil
}

// 新增：获取运营考核目标（支持条件查询）
func (r *AssessmentRepoImpl) GetOperationTargetByCondition(ctx context.Context, responsibleUID, assistantUID, targetID *string) (*assessment.Target, error) {
	query := r.db.WithContext(ctx).Where("target_type = ?", 2)

	// 如果指定了责任人，按责任人筛选
	if responsibleUID != nil && *responsibleUID != "" {
		query = query.Where("responsible_uid = ?", *responsibleUID)
	}

	// 如果指定了协助成员，按协助成员筛选
	if assistantUID != nil && *assistantUID != "" {
		query = query.Where("employee_id = ?", *assistantUID)
	}

	// 如果指定了目标ID，按目标ID查询
	if targetID != nil && *targetID != "" {
		query = query.Where("id = ?", targetID)
	}

	var target tTarget
	if err := query.Order("created_at ASC").First(&target).Error; err != nil {
		return nil, err
	}
	return toTargetEntity(&target), nil
}

// 新增：根据部门ID和目标ID获取目标（支持可选参数）
func (r *AssessmentRepoImpl) GetTargetByDepartmentAndTargetID(ctx context.Context, departmentID *string, targetID *uint64) (*assessment.Target, error) {
	query := r.db.WithContext(ctx)

	// 如果指定了部门ID，按部门ID查询
	if departmentID != nil && *departmentID != "" {
		query = query.Where("department_id = ?", *departmentID)
	}

	// 如果指定了目标ID，按目标ID查询
	if targetID != nil {
		query = query.Where("id = ?", *targetID)
	}

	// 按创建时间排序，获取第一个目标
	query = query.Order("created_at ASC")

	var target tTarget
	if err := query.First(&target).Error; err != nil {
		return nil, err
	}
	return toTargetEntity(&target), nil
}

// 新增：获取运营考核计划详情列表
func (r *AssessmentRepoImpl) GetOperationPlansByTargetID(ctx context.Context, targetID uint64, planName *string) ([]assessment.OperationPlanDetail, error) {
	query := r.db.WithContext(ctx).Where("target_id = ? AND plan_type IN (1, 5, 6)", targetID)

	// 如果指定了计划名称，按名称模糊查询
	if planName != nil && *planName != "" {
		query = query.Where("plan_name LIKE ?", "%"+*planName+"%")
	}

	var plans []tTargetPlan
	if err := query.Order("created_at DESC").Find(&plans).Error; err != nil {
		return nil, err
	}

	result := make([]assessment.OperationPlanDetail, 0, len(plans))
	for _, plan := range plans {
		planDetail := toOperationPlanDetailEntity(&plan)
		result = append(result, *planDetail)
	}

	return result, nil
}

// 新增：获取单个计划详情
func (r *AssessmentRepoImpl) GetOperationPlanDetail(ctx context.Context, id uint64) (*assessment.OperationPlanDetail, error) {
	var plan tTargetPlan
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&plan).Error; err != nil {
		return nil, err
	}

	return toOperationPlanDetailEntity(&plan), nil
}

// 将数据库字段转换为运营考核计划详情实体（与创建计划参数一致）
func toOperationPlanDetailEntity(po *tTargetPlan) *assessment.OperationPlanDetail {
	if po == nil {
		return nil
	}

	/*updatedAt := func() *string {
		if po.UpdatedAt != nil {
			timeStr := po.UpdatedAt.Format("2006-01-02 15:04:05.000")
			return &timeStr
		}
		return nil
	}()

	updatedBy := func() *string {
		if po.UpdatedBy != nil {
			return po.UpdatedBy
		}
		return nil
	}()*/

	return &assessment.OperationPlanDetail{
		ID:             po.ID,
		TargetID:       po.TargetID,
		PlanType:       po.PlanType,
		AssessmentType: po.AssessmentType,
		PlanName:       po.PlanName,
		PlanDesc:       po.PlanDesc,
		ResponsibleUID: po.ResponsibleUID,
		// 与创建计划参数一致的字段
		PlanQuantity:   po.PlanQuantity,
		ActualQuantity: po.ActualQuantity,
		// 数据获取类型字段（plan_type=1）
		DataCollectionQuantity:       po.DataCollectionQuantity,
		DataCollectionActualQuantity: po.DataCollectionActualQuantity,
		RelatedDataCollectionPlanID:  po.RelatedDataCollectionPlanID,
		// 数据处理类型字段（plan_type=5）
		DataProcessExploreQuantity:       po.DataProcessExploreQuantity,
		DataProcessExploreActualQuantity: po.DataProcessExploreActualQuantity,
		DataProcessFusionQuantity:        po.DataProcessFusionQuantity,
		DataProcessFusionActualQuantity:  po.DataProcessFusionActualQuantity,
		RelatedDataProcessPlanID:         po.RelatedDataProcessPlanID,
		// 数据理解类型字段（plan_type=6）
		DataUnderstandingQuantity:       po.DataUnderstandingQuantity,
		DataUnderstandingActualQuantity: po.DataUnderstandingActualQuantity,
		RelatedDataUnderstandingPlanID:  po.RelatedDataUnderstandingPlanID,
		// 业务梳理类型字段（plan_type=4）
		BusinessItems: convertDBFieldsToBusinessItems(po.BusinessModelQuantity, po.BusinessProcessQuantity, po.BusinessTableQuantity),
	}
}

// GetDataProcessPlansByIDs 根据ID列表获取数据处理计划信息
func (r *AssessmentRepoImpl) GetDataProcessPlansByIDs(ctx context.Context, planIDs []string) (map[string]assessment.DataProcessPlanInfo, error) {
	if len(planIDs) == 0 {
		return make(map[string]assessment.DataProcessPlanInfo), nil
	}

	// 定义数据处理计划表结构
	type DataProcessingPlan struct {
		ID   string `gorm:"column:id"`
		Name string `gorm:"column:name"`
	}

	var plans []DataProcessingPlan

	// 查询 af_tasks 数据库下的 data_processing_plan 表
	// 注意：这里需要跨库查询，实际使用时可能需要调整数据库连接
	err := r.db.Table("af_tasks.data_processing_plan").
		Select("id, name").
		Where("id IN ? AND deleted_at = 0", planIDs).
		Find(&plans).Error

	if err != nil {
		return nil, fmt.Errorf("查询数据处理计划失败: %v", err)
	}

	// 构建ID到计划信息的映射
	result := make(map[string]assessment.DataProcessPlanInfo)
	for _, plan := range plans {
		result[plan.ID] = assessment.DataProcessPlanInfo{
			ID:   plan.ID,
			Name: plan.Name,
		}
	}

	return result, nil
}

// GetDataUnderstandingPlansByIDs 根据ID列表获取数据理解计划信息
func (r *AssessmentRepoImpl) GetDataUnderstandingPlansByIDs(ctx context.Context, planIDs []string) (map[string]assessment.DataUnderstandingPlanInfo, error) {
	if len(planIDs) == 0 {
		return make(map[string]assessment.DataUnderstandingPlanInfo), nil
	}

	// 定义数据理解计划表结构
	type DataComprehensionPlan struct {
		ID   string `gorm:"column:id"`
		Name string `gorm:"column:name"`
	}

	var plans []DataComprehensionPlan

	// 查询 af_tasks 数据库下的 data_comprehension_plan 表
	// 注意：这里需要跨库查询，实际使用时可能需要调整数据库连接
	err := r.db.Table("af_tasks.data_comprehension_plan").
		Select("id, name").
		Where("id IN ? AND deleted_at = 0", planIDs).
		Find(&plans).Error

	if err != nil {
		return nil, fmt.Errorf("查询数据理解计划失败: %v", err)
	}

	// 构建ID到计划信息的映射
	result := make(map[string]assessment.DataUnderstandingPlanInfo)
	for _, plan := range plans {
		result[plan.ID] = assessment.DataUnderstandingPlanInfo{
			ID:   plan.ID,
			Name: plan.Name,
		}
	}

	return result, nil
}

// wrapDBErr 将底层数据库错误转换为更友好的业务错误
func wrapDBErr(err error) error {
	if err == nil {
		return nil
	}
	if util.IsMysqlDataTooLongErr(err) {
		col := util.ExtractTooLongColumn(err)
		if col != "" {
			return errorcode.Detail(errorcode.PublicInvalidLengthValue, fmt.Sprintf("字段[%s]长度超出限制", col))
		}
		return errorcode.Detail(errorcode.PublicInvalidLengthValue, "存在字段长度超出限制")
	}
	return err
}
