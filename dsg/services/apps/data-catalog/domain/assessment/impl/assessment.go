package impl

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/assessment"
	repoif "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/assessment"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
)

// POCO结构体定义（用于事务处理）
type tTarget struct {
	ID                uint64     `gorm:"column:id;primaryKey;autoIncrement"`
	TargetName        string     `gorm:"column:target_name"`
	TargetType        uint8      `gorm:"column:target_type"`
	DepartmentID      string     `gorm:"column:department_id"`
	Description       string     `gorm:"column:description"`
	StartDate         time.Time  `gorm:"column:start_date;type:date"`
	EndDate           time.Time  `gorm:"column:end_date;type:date"`
	Status            uint8      `gorm:"column:status"`
	ResponsibleUID    string     `gorm:"column:responsible_uid"`
	EmployeeID        string     `gorm:"column:employee_id"`
	EvaluationContent *string    `gorm:"column:evaluation_content"`
	CreatedAt         time.Time  `gorm:"column:created_at;autoCreateTime"`
	CreatedBy         string     `gorm:"column:created_by"`
	UpdatedAt         *time.Time `gorm:"column:updated_at;autoUpdateTime"`
	UpdatedBy         *string    `gorm:"column:updated_by"`
}

func (tTarget) TableName() string { return "t_target" }

type tTargetPlan struct {
	ID                            uint64     `gorm:"column:id;primaryKey;autoIncrement"`
	TargetID                      uint64     `gorm:"column:target_id"`
	PlanType                      uint8      `gorm:"column:plan_type"`
	PlanName                      string     `gorm:"column:plan_name"`
	PlanDesc                      string     `gorm:"column:plan_desc"`
	ResponsibleUID                *string    `gorm:"column:responsible_uid"`
	PlanQuantity                  int        `gorm:"column:plan_quantity;default:0"`
	ActualQuantity                *int       `gorm:"column:actual_quantity"`
	Status                        uint8      `gorm:"column:status"`
	RelatedDataCollectionPlanID   *uint64    `gorm:"column:related_data_collection_plan_id"`
	BusinessModelQuantity         *int       `gorm:"column:business_model_quantity"`
	BusinessProcessQuantity       *int       `gorm:"column:business_process_quantity"`
	BusinessTableQuantity         *int       `gorm:"column:business_table_quantity"`
	BusinessModelActualQuantity   *int       `gorm:"column:business_model_actual_quantity"`
	BusinessProcessActualQuantity *int       `gorm:"column:business_process_actual_quantity"`
	BusinessTableActualQuantity   *int       `gorm:"column:business_table_actual_quantity"`
	CreatedAt                     time.Time  `gorm:"column:created_at;autoCreateTime"`
	CreatedBy                     string     `gorm:"column:created_by"`
	UpdatedAt                     *time.Time `gorm:"column:updated_at;autoUpdateTime"`
	UpdatedBy                     *string    `gorm:"column:updated_by"`
}

func (tTargetPlan) TableName() string { return "t_target_plan" }

type TargetDomainImpl struct {
	repo                      repoif.AssessmentRepo
	configurationCenterDriven configuration_center.Driven
}
type PlanDomainImpl struct {
	repo                      repoif.AssessmentRepo
	configurationCenterDriven configuration_center.Driven
}

// ================================
// 运营考核目标领域实现（包装器，避免与 TargetDomain 接口方法名冲突）
// ================================
type OperationTargetDomainImpl struct {
	target *TargetDomainImpl
}

func NewAssessmentTargetDomain(repo repoif.AssessmentRepo, configurationCenterDriven configuration_center.Driven) assessment.TargetDomain {
	return &TargetDomainImpl{
		repo:                      repo,
		configurationCenterDriven: configurationCenterDriven,
	}
}
func NewAssessmentPlanDomain(repo repoif.AssessmentRepo, configurationCenterDriven configuration_center.Driven) assessment.PlanDomain {
	return &PlanDomainImpl{
		repo:                      repo,
		configurationCenterDriven: configurationCenterDriven,
	}
}

func (d *TargetDomainImpl) Create(ctx context.Context, req assessment.TargetCreateReq, userID string) (uint64, error) {
	return d.repo.CreateTarget(ctx, req, userID)
}
func (d *TargetDomainImpl) Update(ctx context.Context, id uint64, req assessment.TargetUpdateReq, userID string) error {
	return d.repo.UpdateTarget(ctx, id, req, userID)
}
func (d *TargetDomainImpl) Delete(ctx context.Context, id uint64, userID string) error {
	fmt.Printf("=== Domain: DeleteTarget 开始执行，目标ID: %d，用户ID: %s ===\n", id, userID)

	// 调用Repository层删除
	err := d.repo.DeleteTarget(ctx, id, userID)
	if err != nil {
		fmt.Printf("Domain: 删除目标失败: %v\n", err)
		return err
	}

	fmt.Printf("Domain: 成功删除目标 ID=%d\n", id)
	fmt.Printf("=== Domain: DeleteTarget 执行完成 ===\n")
	return nil
}
func (d *TargetDomainImpl) Get(ctx context.Context, id uint64) (*assessment.Target, error) {
	target, err := d.repo.GetTarget(ctx, id)
	if err != nil {
		return nil, err
	}

	// 获取部门名称
	if target.DepartmentID != "" {
		departmentNameMap, _, err := d.GetDepartmentNameAndPathMap(ctx, []string{target.DepartmentID})
		if err == nil && len(departmentNameMap) > 0 {
			target.DepartmentName = departmentNameMap[target.DepartmentID]
		}
	}

	// 获取创建人和更新人名称
	userIds := []string{target.CreatedBy}
	if target.UpdatedBy != nil {
		userIds = append(userIds, *target.UpdatedBy)
	}
	userIds = util.DuplicateStringRemoval(userIds)

	userNameMap, err := d.GetUserNameMap(ctx, userIds)
	if err == nil {
		target.CreatedByName = userNameMap[target.CreatedBy]
		if target.UpdatedBy != nil {
			if name, ok := userNameMap[*target.UpdatedBy]; ok {
				target.UpdatedByName = &name
			}
		}
	}

	return target, nil
}
func (d *TargetDomainImpl) List(ctx context.Context, q assessment.TargetQuery) (*assessment.PageResp[assessment.Target], error) {
	// 如果需要过滤当前用户部门，自动获取当前用户的部门及子部门
	if q.FilterCurrentUserDepartment {
		uInfo := request.GetUserInfo(ctx)
		if uInfo != nil && len(uInfo.OrgInfos) > 0 {
			// 收集当前用户所有部门及其子部门
			allDepartmentIDs := make([]string, 0)
			for _, orgInfo := range uInfo.OrgInfos {
				// 添加当前部门
				allDepartmentIDs = append(allDepartmentIDs, orgInfo.OrgCode)
				// 添加子部门
				subDepartmentIDs := d.collectDepartmentWithDescendants(ctx, orgInfo.OrgCode)
				allDepartmentIDs = append(allDepartmentIDs, subDepartmentIDs...)
			}
			// 去重并设置到查询条件
			allDepartmentIDs = util.DuplicateStringRemoval(allDepartmentIDs)
			q.DepartmentID = strings.Join(allDepartmentIDs, ",")
		}
	} else if q.DepartmentID != "" {
		// 当传入 department_id 时，合并其子部门（递归）后一起查询
		ids := d.collectDepartmentWithDescendants(ctx, q.DepartmentID)
		if len(ids) > 0 {
			ids = util.DuplicateStringRemoval(ids)
			q.DepartmentID = strings.Join(ids, ",")
		}
	}

	resp, err := d.repo.ListTargets(ctx, q)
	if err != nil {
		return nil, err
	}

	// 收集所有部门ID和用户ID
	departmentIds := make([]string, 0)
	userIds := make([]string, 0)

	for _, target := range resp.List {
		if target.DepartmentID != "" {
			departmentIds = append(departmentIds, target.DepartmentID)
		}
		userIds = append(userIds, target.CreatedBy)
		if target.UpdatedBy != nil {
			userIds = append(userIds, *target.UpdatedBy)
		}
		// 添加责任人和协助成员的用户ID
		if target.ResponsibleUID != "" {
			userIds = append(userIds, target.ResponsibleUID)
		}
		if target.EmployeeID != "" {
			// 处理多个员工ID（逗号分隔）
			for _, eid := range strings.Split(target.EmployeeID, ",") {
				if id := strings.TrimSpace(eid); id != "" {
					userIds = append(userIds, id)
				}
			}
		}
	}

	// 去重
	departmentIds = util.DuplicateStringRemoval(departmentIds)
	userIds = util.DuplicateStringRemoval(userIds)

	// 获取部门名称映射
	departmentNameMap := make(map[string]string)
	if len(departmentIds) > 0 {
		departmentNameMap, _, err = d.GetDepartmentNameAndPathMap(ctx, departmentIds)
		if err != nil {
			// 记录错误但不影响返回
			departmentNameMap = make(map[string]string)
		}
	}

	// 获取用户名称映射
	userNameMap := make(map[string]string)
	if len(userIds) > 0 {
		userNameMap, err = d.GetUserNameMap(ctx, userIds)
		if err != nil {
			// 记录错误但不影响返回
			userNameMap = make(map[string]string)
		}
		// 添加调试日志
		fmt.Printf("=== List方法调试信息 ===\n")
		fmt.Printf("收集到的用户ID: %v\n", userIds)
		fmt.Printf("获取到的用户名称映射: %+v\n", userNameMap)
		fmt.Printf("=== 调试信息结束 ===\n")
	}

	// 填充名称信息
	for i := range resp.List {
		target := &resp.List[i]
		target.DepartmentName = departmentNameMap[target.DepartmentID]
		target.CreatedByName = userNameMap[target.CreatedBy]
		if target.UpdatedBy != nil {
			if name, ok := userNameMap[*target.UpdatedBy]; ok {
				target.UpdatedByName = &name
			}
		}
		// 填充责任人名称
		if target.ResponsibleUID != "" {
			if name, ok := userNameMap[target.ResponsibleUID]; ok {
				target.ResponsibleName = &name
			}
		}
		// 填充协助成员名称
		if target.EmployeeID != "" {
			// 处理多个员工ID（逗号分隔）
			employeeIds := strings.Split(target.EmployeeID, ",")
			employeeNames := make([]string, 0)
			for _, eid := range employeeIds {
				if id := strings.TrimSpace(eid); id != "" {
					if name, ok := userNameMap[id]; ok {
						employeeNames = append(employeeNames, name)
					}
				}
			}
			if len(employeeNames) > 0 {
				names := strings.Join(employeeNames, ",")
				target.EmployeeName = &names
			}
		}
	}

	return resp, nil
}
func (d *TargetDomainImpl) AutoUpdateStatusByDate(ctx context.Context) error {
	today := time.Now().Format("2006-01-02")
	return d.repo.UpdateTargetsStatusByDate(ctx, today)
}

func (d *TargetDomainImpl) CompleteTarget(ctx context.Context, id uint64, userID string) error {
	return d.repo.CompleteTarget(ctx, id, userID)
}

// 新增：获取目标详情（包含考核计划）
func (d *TargetDomainImpl) GetTargetDetailWithPlans(ctx context.Context, id uint64, q assessment.TargetDetailQuery) (*assessment.TargetDetailWithPlans, error) {
	fmt.Printf("=== GetTargetDetailWithPlans 开始执行，目标ID: %d ===\n", id)

	// 1. 获取目标详情
	target, err := d.repo.GetTarget(ctx, id)
	if err != nil {
		// 检查是否是"记录不存在"的错误
		if err.Error() == "record not found" {
			fmt.Printf("目标不存在，ID: %d，返回nil\n", id)
			return nil, nil // 返回nil表示没有数据，而不是错误
		}
		fmt.Printf("获取目标详情失败: %v\n", err)
		return nil, err
	}
	fmt.Printf("目标详情获取成功: ID=%d, Name=%s, Status=%d\n", target.ID, target.TargetName, target.Status)

	// 2. 获取部门名称
	departmentName := target.DepartmentName
	if target.DepartmentID != "" && departmentName == "" {
		departmentNameMap, _, err := d.GetDepartmentNameAndPathMap(ctx, []string{target.DepartmentID})
		if err == nil && len(departmentNameMap) > 0 {
			departmentName = departmentNameMap[target.DepartmentID]
		}
	}
	fmt.Printf("部门名称: %s\n", departmentName)

	// 3. 获取创建人和更新人名称
	userIds := []string{target.CreatedBy}
	if target.UpdatedBy != nil {
		userIds = append(userIds, *target.UpdatedBy)
	}
	userIds = util.DuplicateStringRemoval(userIds)

	userNameMap, err := d.GetUserNameMap(ctx, userIds)
	if err != nil {
		userNameMap = make(map[string]string)
	}
	fmt.Printf("用户名称映射: %+v\n", userNameMap)

	// 4. 查询考核计划列表（支持按计划名称过滤）
	fmt.Printf("开始查询考核计划列表，计划名称过滤条件: %v\n", q.PlanName)
	plans, err := d.repo.ListPlansByTargetIDAndName(ctx, id, q.PlanName)
	if err != nil {
		fmt.Printf("查询考核计划失败: %v，返回普通目标详情\n", err)
		// 如果查询计划失败，仍然返回目标详情，但不包含计划
		return &assessment.TargetDetailWithPlans{
			ID:             target.ID,
			TargetName:     target.TargetName,
			TargetType:     target.TargetType,
			DepartmentID:   target.DepartmentID,
			DepartmentName: departmentName,
			Description:    target.Description,
			StartDate:      target.StartDate,
			EndDate:        target.EndDate,
			Status:         target.Status,
			ResponsibleUID: target.ResponsibleUID,
			EmployeeID:     target.EmployeeID,
			CreatedAt:      target.CreatedAt,
			CreatedBy:      target.CreatedBy,
			CreatedByName:  userNameMap[target.CreatedBy],
			UpdatedAt:      target.UpdatedAt,
			UpdatedBy:      target.UpdatedBy,
			UpdatedByName: func() *string {
				if target.UpdatedBy != nil {
					if name, ok := userNameMap[*target.UpdatedBy]; ok {
						return &name
					}
				}
				return nil
			}(),
		}, nil
	}

	fmt.Printf("考核计划查询成功，共 %d 个计划\n", len(plans))
	for i, plan := range plans {
		fmt.Printf("计划 %d: ID=%d, Type=%d, Name=%s\n", i+1, plan.ID, plan.PlanType, plan.PlanName)
	}

	// 5. 按计划类型分组
	planGroups := make(map[uint8][]assessment.Plan)
	for _, plan := range plans {
		planGroups[plan.PlanType] = append(planGroups[plan.PlanType], plan)
	}
	fmt.Printf("计划分组结果: %+v\n", planGroups)

	// 6. 构建考核计划分组
	evaluationPlans := make([]assessment.EvaluationPlanGroup, 0)

	// 收集所有计划类型并排序
	planTypes := make([]uint8, 0, len(planGroups))
	for planType := range planGroups {
		planTypes = append(planTypes, planType)
	}

	// 按计划类型升序排序
	sort.Slice(planTypes, func(i, j int) bool {
		return planTypes[i] < planTypes[j]
	})

	// 按排序后的计划类型构建evaluation_plans
	for _, planType := range planTypes {
		planList := planGroups[planType]
		if len(planList) == 0 {
			continue
		}
		fmt.Printf("处理计划类型 %d，共 %d 个计划\n", planType, len(planList))

		// 先按创建时间倒序（后创建的在前）对 planList 排序
		sort.Slice(planList, func(i, j int) bool {
			// CreatedAt 为 "2006-01-02 15:04:05" 或 "2006-01-02 15:04:05.000" 字符串
			parse := func(s string) (time.Time, bool) {
				if t, err := time.Parse("2006-01-02 15:04:05.000", s); err == nil {
					return t, true
				}
				if t, err := time.Parse("2006-01-02 15:04:05", s); err == nil {
					return t, true
				}
				return time.Time{}, false
			}
			ti, okI := parse(planList[i].CreatedAt)
			tj, okJ := parse(planList[j].CreatedAt)
			if okI && okJ {
				return ti.After(tj)
			}
			return planList[i].CreatedAt > planList[j].CreatedAt
		})

		// 转换计划列表为评价格式
		planItems := make([]assessment.PlanListItem, 0, len(planList))
		for _, plan := range planList {
			planItem := assessment.PlanListItem{
				ID:          plan.ID,
				PlanName:    plan.PlanName,
				Description: plan.PlanDesc,
				Owner: func() string {
					if plan.ResponsibleUID != nil {
						return userNameMap[*plan.ResponsibleUID]
					}
					return ""
				}(),
				CreatedAt: plan.CreatedAt,
				UpdatedAt: func() string {
					if plan.UpdatedAt != nil {
						return *plan.UpdatedAt
					}
					return plan.CreatedAt
				}(),
			}

			// 根据计划类型设置不同的字段
			switch plan.PlanType {
			case 1: // 数据获取（运营考核优先）
				if plan.DataCollectionQuantity != nil {
					planItem.CollectionCount = plan.DataCollectionQuantity
				} else {
					planItem.CollectionCount = &plan.PlanQuantity
				}
				planItem.Unit = "个"
				if plan.DataCollectionActualQuantity != nil {
					planItem.ActualCollectionCount = plan.DataCollectionActualQuantity
				} else {
					planItem.ActualCollectionCount = plan.ActualQuantity
				}
				if plan.RelatedDataCollectionPlanID != nil {
					relatedPlans, err := d.getDataAggregationPlanNames(ctx, plan.RelatedDataCollectionPlanID)
					if err == nil {
						planItem.RelatedPlans = relatedPlans
					}
				}
				// 统一补齐 assessment_type 与实际数量默认值
				planItem.AssessmentType = plan.AssessmentType
				if planItem.ActualCollectionCount == nil {
					zero := 0
					planItem.ActualCollectionCount = &zero
				}
			case 2: // 数据质量整改
				planItem.CollectionCount = &plan.PlanQuantity
				planItem.Unit = "张"
				planItem.ActualCollectionCount = plan.ActualQuantity
				planItem.AssessmentType = plan.AssessmentType
				if planItem.ActualCollectionCount == nil {
					zero := 0
					planItem.ActualCollectionCount = &zero
				}
			case 3: // 数据资源编目
				planItem.CollectionCount = &plan.PlanQuantity
				planItem.Unit = "个"
				planItem.ActualCollectionCount = plan.ActualQuantity
				planItem.AssessmentType = plan.AssessmentType
				if planItem.ActualCollectionCount == nil {
					zero := 0
					planItem.ActualCollectionCount = &zero
				}
			case 4: // 业务梳理
				for _, item := range plan.BusinessItems {
					switch item.Type {
					case "model":
						planItem.ModelCount = &item.Quantity
					case "process":
						planItem.FlowCount = &item.Quantity
					case "table":
						planItem.TableCount = &item.Quantity
					}
				}
				planItem.ActualModelCount = plan.BusinessModelActualQuantity
				planItem.ActualFlowCount = plan.BusinessProcessActualQuantity
				planItem.ActualTableCount = plan.BusinessTableActualQuantity
				planItem.AssessmentType = plan.AssessmentType
			case 5: // 数据处理（运营考核）
				planItem.DataProcessExploreQuantity = plan.DataProcessExploreQuantity
				planItem.DataProcessExploreActual = plan.DataProcessExploreActualQuantity
				planItem.DataProcessFusionQuantity = plan.DataProcessFusionQuantity
				planItem.DataProcessFusionActual = plan.DataProcessFusionActualQuantity
				planItem.AssessmentType = plan.AssessmentType
				// 处理关联数据处理计划
				if plan.RelatedDataProcessPlanID != nil {
					relatedPlans, err := d.getDataProcessPlanNames(ctx, plan.RelatedDataProcessPlanID)
					if err == nil {
						planItem.RelatedPlans = relatedPlans
					}
				}
				// 确保字段稳定输出（nil -> 0）
				if planItem.DataProcessExploreQuantity == nil {
					z := 0
					planItem.DataProcessExploreQuantity = &z
				}
				if planItem.DataProcessExploreActual == nil {
					z := 0
					planItem.DataProcessExploreActual = &z
				}
				if planItem.DataProcessFusionQuantity == nil {
					z := 0
					planItem.DataProcessFusionQuantity = &z
				}
				if planItem.DataProcessFusionActual == nil {
					z := 0
					planItem.DataProcessFusionActual = &z
				}
			case 6: // 数据理解（运营考核）
				planItem.DataUnderstandingQuantity = plan.DataUnderstandingQuantity
				planItem.DataUnderstandingActual = plan.DataUnderstandingActualQuantity
				planItem.AssessmentType = plan.AssessmentType
				// 处理关联数据理解计划
				if plan.RelatedDataUnderstandingPlanID != nil {
					relatedPlans, err := d.getDataUnderstandingPlanNames(ctx, plan.RelatedDataUnderstandingPlanID)
					if err == nil {
						planItem.RelatedPlans = relatedPlans
					}
				}
				if planItem.DataUnderstandingQuantity == nil {
					z := 0
					planItem.DataUnderstandingQuantity = &z
				}
				if planItem.DataUnderstandingActual == nil {
					z := 0
					planItem.DataUnderstandingActual = &z
				}
			}

			planItems = append(planItems, planItem)
		}

		evaluationPlans = append(evaluationPlans, assessment.EvaluationPlanGroup{
			PlanType: int(planType),
			Plans: assessment.PlanGroupData{
				List:       planItems,
				TotalCount: len(planItems),
			},
		})
	}

	fmt.Printf("构建的考核计划分组数量: %d\n", len(evaluationPlans))

	// 7. 构建最终响应
	result := &assessment.TargetDetailWithPlans{
		ID:                target.ID,
		TargetName:        target.TargetName,
		TargetType:        target.TargetType,
		DepartmentID:      target.DepartmentID,
		DepartmentName:    departmentName,
		Description:       target.Description,
		StartDate:         target.StartDate,
		EndDate:           target.EndDate,
		Status:            target.Status,
		ResponsibleUID:    target.ResponsibleUID,
		EmployeeID:        target.EmployeeID,
		EvaluationContent: target.EvaluationContent,
		CreatedAt:         target.CreatedAt,
		CreatedBy:         target.CreatedBy,
		CreatedByName:     userNameMap[target.CreatedBy],
		UpdatedAt:         target.UpdatedAt,
		UpdatedBy:         target.UpdatedBy,
		UpdatedByName: func() *string {
			if target.UpdatedBy != nil {
				if name, ok := userNameMap[*target.UpdatedBy]; ok {
					return &name
				}
			}
			return nil
		}(),
		EvaluationPlans: evaluationPlans,
	}

	fmt.Printf("=== GetTargetDetailWithPlans 执行完成 ===\n")
	return result, nil
}

func (d *PlanDomainImpl) Create(ctx context.Context, req assessment.PlanCreateReq, userID string) (uint64, error) {
	return d.repo.CreatePlan(ctx, req, userID)
}
func (d *PlanDomainImpl) Update(ctx context.Context, id uint64, req assessment.PlanUpdateReq, userID string) error {
	return d.repo.UpdatePlan(ctx, id, req, userID)
}
func (d *PlanDomainImpl) Delete(ctx context.Context, id uint64, userID string) error {
	return d.repo.DeletePlan(ctx, id, userID)
}

/*func (d *PlanDomainImpl) Get(ctx context.Context, id uint64) (*assessment.Plan, error) {
	plan, err := d.repo.GetPlan(ctx, id)
	if err != nil {
		return nil, err
	}

	// 获取部门名称
	if plan.DepartmentID != "" {
		departmentNameMap, _, err := d.GetDepartmentNameAndPathMap(ctx, []string{plan.DepartmentID})
		if err == nil && len(departmentNameMap) > 0 {
			plan.DepartmentName = departmentNameMap[plan.DepartmentID]
		}
	}

	// 获取创建人和更新人名称
	userIds := []string{plan.CreatedBy}
	if plan.UpdatedBy != nil {
		userIds = append(userIds, *plan.UpdatedBy)
	}
	userIds = util.DuplicateStringRemoval(userIds)

	userNameMap, err := d.GetUserNameMap(ctx, userIds)
	if err == nil {
		plan.CreatedByName = userNameMap[plan.CreatedBy]
		if plan.UpdatedBy != nil {
			if name, ok := userNameMap[*plan.UpdatedBy]; ok {
				plan.UpdatedByName = &name
			}
		}
	}

	return plan, nil
}*/
/*func (d *PlanDomainImpl) List(ctx context.Context, q assessment.PlanQuery) (*assessment.PageResp[assessment.Plan], error) {
	resp, err := d.repo.ListPlans(ctx, q)
	if err != nil {
		return nil, err
	}

	// 收集所有部门ID和用户ID
	departmentIds := make([]string, 0)
	userIds := make([]string, 0)

	for _, plan := range resp.List {
		if plan.DepartmentID != "" {
			departmentIds = append(departmentIds, plan.DepartmentID)
		}
		userIds = append(userIds, plan.CreatedBy)
		if plan.UpdatedBy != nil {
			userIds = append(userIds, *plan.UpdatedBy)
		}
	}

	// 去重
	departmentIds = util.DuplicateStringRemoval(departmentIds)
	userIds = util.DuplicateStringRemoval(userIds)

	// 获取部门名称映射
	departmentNameMap := make(map[string]string)
	if len(departmentIds) > 0 {
		departmentNameMap, _, err = d.GetDepartmentNameAndPathMap(ctx, departmentIds)
		if err != nil {
			// 记录错误但不影响返回
			departmentNameMap = make(map[string]string)
		}
	}

	// 获取用户名称映射
	userNameMap := make(map[string]string)
	if len(userIds) > 0 {
		userNameMap, err = d.GetUserNameMap(ctx, userIds)
		if err != nil {
			// 记录错误但不影响返回
			userNameMap = make(map[string]string)
		}
	}

	// 填充名称信息
	for i := range resp.List {
		plan := &resp.List[i]
		plan.DepartmentName = departmentNameMap[plan.DepartmentID]
		plan.CreatedByName = userNameMap[plan.CreatedBy]
		if plan.UpdatedBy != nil {
			if name, ok := userNameMap[*plan.UpdatedBy]; ok {
				plan.UpdatedByName = &name
			}
		}
	}

	return resp, nil
}*/

// 新增：根据目标ID查询计划列表
func (d *PlanDomainImpl) ListPlansByTargetID(ctx context.Context, targetID uint64) ([]assessment.Plan, error) {
	plans, err := d.repo.ListPlansByTargetID(ctx, targetID)
	if err != nil {
		return nil, err
	}

	// 收集所有用户ID
	userIds := make([]string, 0)
	for _, plan := range plans {
		if plan.ResponsibleUID != nil {
			userIds = append(userIds, *plan.ResponsibleUID)
		}
		userIds = append(userIds, plan.CreatedBy)
		if plan.UpdatedBy != nil {
			userIds = append(userIds, *plan.UpdatedBy)
		}
	}

	// 去重
	userIds = util.DuplicateStringRemoval(userIds)

	// 获取用户名称映射
	userNameMap := make(map[string]string)
	if len(userIds) > 0 {
		userNameMap, err = d.GetUserNameMap(ctx, userIds)
		if err != nil {
			// 记录错误但不影响返回
			userNameMap = make(map[string]string)
		}
	}

	// 填充名称信息
	for i := range plans {
		plan := &plans[i]
		plan.CreatedByName = userNameMap[plan.CreatedBy]
		if plan.UpdatedBy != nil {
			if name, ok := userNameMap[*plan.UpdatedBy]; ok {
				plan.UpdatedByName = &name
			}
		}
	}

	return plans, nil
}

// 新增：获取评价页面数据
func (d *TargetDomainImpl) GetEvaluationPage(ctx context.Context, id uint64, q assessment.EvaluationPageQuery) (*assessment.EvaluationPageResp, error) {
	fmt.Printf("=== Domain: GetEvaluationPage 开始执行，目标ID: %d ===\n", id)

	// 1. 获取目标详情
	target, err := d.repo.GetTarget(ctx, id)
	if err != nil {
		if err.Error() == "record not found" {
			fmt.Printf("目标不存在，ID: %d，返回nil\n", id)
			return nil, nil
		}
		fmt.Printf("获取目标详情失败: %v\n", err)
		return nil, err
	}

	// 2. 检查目标状态，支持"待评价"和"已结束"状态
	/*if target.Status != 2 && target.Status != 3 {
		fmt.Printf("目标状态不支持评价查看，当前状态: %d\n", target.Status)
		return nil, fmt.Errorf("目标状态不支持评价查看，只有待评价或已结束状态才能查看")
	}*/

	// 3. 获取部门名称
	departmentName := target.DepartmentName
	if target.DepartmentID != "" && departmentName == "" {
		departmentNameMap, _, err := d.GetDepartmentNameAndPathMap(ctx, []string{target.DepartmentID})
		if err == nil && len(departmentNameMap) > 0 {
			departmentName = departmentNameMap[target.DepartmentID]
		}
	}

	// 4. 查询考核计划列表（支持按计划名称过滤）
	plans, err := d.repo.ListPlansByTargetIDAndName(ctx, id, q.PlanName)
	if err != nil {
		fmt.Printf("查询考核计划失败: %v\n", err)
		return nil, err
	}

	// 5. 获取用户名称映射
	userIds := make([]string, 0)

	// 添加目标自身的用户ID（修复：包含创建人、更新人）
	if target.CreatedBy != "" {
		userIds = append(userIds, target.CreatedBy)
	}
	if target.UpdatedBy != nil {
		userIds = append(userIds, *target.UpdatedBy)
	}

	// 添加目标自身的责任人与协助成员ID（支持逗号分隔多成员）
	if target.ResponsibleUID != "" {
		userIds = append(userIds, target.ResponsibleUID)
	}
	if target.EmployeeID != "" {
		for _, eid := range strings.Split(target.EmployeeID, ",") {
			if id := strings.TrimSpace(eid); id != "" {
				userIds = append(userIds, id)
			}
		}
	}

	// 添加计划中的责任人ID
	for _, plan := range plans {
		if plan.ResponsibleUID != nil {
			userIds = append(userIds, *plan.ResponsibleUID)
		}
	}
	userIds = util.DuplicateStringRemoval(userIds)

	userNameMap, err := d.GetUserNameMap(ctx, userIds)
	if err != nil {
		userNameMap = make(map[string]string)
	}

	// 6. 按计划类型分组并构建评价页面数据
	planGroups := make(map[uint8][]assessment.Plan)
	for _, plan := range plans {
		planGroups[plan.PlanType] = append(planGroups[plan.PlanType], plan)
	}

	// 收集所有计划类型并排序
	planTypes := make([]uint8, 0, len(planGroups))
	for planType := range planGroups {
		planTypes = append(planTypes, planType)
	}
	sort.Slice(planTypes, func(i, j int) bool {
		return planTypes[i] < planTypes[j]
	})

	// 构建评价计划分组
	evaluationPlans := make([]assessment.EvaluationPlanGroup, 0)
	for _, planType := range planTypes {
		planList := planGroups[planType]
		if len(planList) == 0 {
			continue
		}

		// 先按创建时间倒序（后创建的在前）对 planList 排序
		sort.Slice(planList, func(i, j int) bool {
			// CreatedAt 为 "2006-01-02 15:04:05" 或 "2006-01-02 15:04:05.000" 字符串
			parse := func(s string) (time.Time, bool) {
				if t, err := time.Parse("2006-01-02 15:04:05.000", s); err == nil {
					return t, true
				}
				if t, err := time.Parse("2006-01-02 15:04:05", s); err == nil {
					return t, true
				}
				return time.Time{}, false
			}
			ti, okI := parse(planList[i].CreatedAt)
			tj, okJ := parse(planList[j].CreatedAt)
			if okI && okJ {
				return ti.After(tj)
			}
			return planList[i].CreatedAt > planList[j].CreatedAt
		})

		// 转换计划列表为评价格式
		planItems := make([]assessment.PlanListItem, 0, len(planList))
		for _, plan := range planList {
			planItem := assessment.PlanListItem{
				ID:          plan.ID,
				PlanName:    plan.PlanName,
				Description: plan.PlanDesc,
				Owner: func() string {
					if plan.ResponsibleUID != nil {
						return userNameMap[*plan.ResponsibleUID]
					}
					return ""
				}(),
				CreatedAt: plan.CreatedAt,
				UpdatedAt: func() string {
					if plan.UpdatedAt != nil {
						return *plan.UpdatedAt
					}
					return plan.CreatedAt
				}(),
			}

			// 根据计划类型设置不同的字段
			switch plan.PlanType {
			case 1: // 数据获取（运营考核优先）
				if plan.DataCollectionQuantity != nil {
					planItem.CollectionCount = plan.DataCollectionQuantity
				} else {
					planItem.CollectionCount = &plan.PlanQuantity
				}
				planItem.Unit = "个"
				if plan.DataCollectionActualQuantity != nil {
					planItem.ActualCollectionCount = plan.DataCollectionActualQuantity
				} else {
					planItem.ActualCollectionCount = plan.ActualQuantity
				}
				if plan.RelatedDataCollectionPlanID != nil {
					relatedPlans, err := d.getDataAggregationPlanNames(ctx, plan.RelatedDataCollectionPlanID)
					if err == nil {
						planItem.RelatedPlans = relatedPlans
					}
				}
				// 统一补齐 assessment_type 与实际数量默认值
				planItem.AssessmentType = plan.AssessmentType
				if planItem.ActualCollectionCount == nil {
					zero := 0
					planItem.ActualCollectionCount = &zero
				}
			case 2: // 数据质量整改
				planItem.CollectionCount = &plan.PlanQuantity
				planItem.Unit = "张"
				planItem.ActualCollectionCount = plan.ActualQuantity
				planItem.AssessmentType = plan.AssessmentType
				if planItem.ActualCollectionCount == nil {
					zero := 0
					planItem.ActualCollectionCount = &zero
				}
			case 3: // 数据资源编目
				planItem.CollectionCount = &plan.PlanQuantity
				planItem.Unit = "个"
				planItem.ActualCollectionCount = plan.ActualQuantity
				planItem.AssessmentType = plan.AssessmentType
				if planItem.ActualCollectionCount == nil {
					zero := 0
					planItem.ActualCollectionCount = &zero
				}
			case 4: // 业务梳理
				for _, item := range plan.BusinessItems {
					switch item.Type {
					case "model":
						planItem.ModelCount = &item.Quantity
					case "process":
						planItem.FlowCount = &item.Quantity
					case "table":
						planItem.TableCount = &item.Quantity
					}
				}
				planItem.ActualModelCount = plan.BusinessModelActualQuantity
				planItem.ActualFlowCount = plan.BusinessProcessActualQuantity
				planItem.ActualTableCount = plan.BusinessTableActualQuantity
				planItem.AssessmentType = plan.AssessmentType
			case 5: // 数据处理（运营考核）
				planItem.DataProcessExploreQuantity = plan.DataProcessExploreQuantity
				planItem.DataProcessExploreActual = plan.DataProcessExploreActualQuantity
				planItem.DataProcessFusionQuantity = plan.DataProcessFusionQuantity
				planItem.DataProcessFusionActual = plan.DataProcessFusionActualQuantity
				planItem.AssessmentType = plan.AssessmentType
				// 处理关联数据处理计划
				if plan.RelatedDataProcessPlanID != nil {
					relatedPlans, err := d.getDataProcessPlanNames(ctx, plan.RelatedDataProcessPlanID)
					if err == nil {
						planItem.RelatedPlans = relatedPlans
					}
				}
				// 确保字段稳定输出（nil -> 0）
				if planItem.DataProcessExploreQuantity == nil {
					z := 0
					planItem.DataProcessExploreQuantity = &z
				}
				if planItem.DataProcessExploreActual == nil {
					z := 0
					planItem.DataProcessExploreActual = &z
				}
				if planItem.DataProcessFusionQuantity == nil {
					z := 0
					planItem.DataProcessFusionQuantity = &z
				}
				if planItem.DataProcessFusionActual == nil {
					z := 0
					planItem.DataProcessFusionActual = &z
				}
			case 6: // 数据理解（运营考核）
				planItem.DataUnderstandingQuantity = plan.DataUnderstandingQuantity
				planItem.DataUnderstandingActual = plan.DataUnderstandingActualQuantity
				planItem.AssessmentType = plan.AssessmentType
				// 处理关联数据理解计划
				if plan.RelatedDataUnderstandingPlanID != nil {
					relatedPlans, err := d.getDataUnderstandingPlanNames(ctx, plan.RelatedDataUnderstandingPlanID)
					if err == nil {
						planItem.RelatedPlans = relatedPlans
					}
				}
				if planItem.DataUnderstandingQuantity == nil {
					z := 0
					planItem.DataUnderstandingQuantity = &z
				}
				if planItem.DataUnderstandingActual == nil {
					z := 0
					planItem.DataUnderstandingActual = &z
				}
			}

			planItems = append(planItems, planItem)
		}

		evaluationPlans = append(evaluationPlans, assessment.EvaluationPlanGroup{
			PlanType: int(planType),
			Plans: assessment.PlanGroupData{
				List:       planItems,
				TotalCount: len(planItems),
			},
		})
	}

	// 7. 构建响应
	result := &assessment.EvaluationPageResp{
		Target: &assessment.Target{
			ID:             target.ID,
			TargetName:     target.TargetName,
			TargetType:     target.TargetType,
			DepartmentID:   target.DepartmentID,
			DepartmentName: departmentName,
			Description:    target.Description,
			StartDate:      target.StartDate,
			EndDate:        target.EndDate,
			Status:         target.Status,
			ResponsibleUID: target.ResponsibleUID,
			ResponsibleName: func() *string {
				if target.ResponsibleUID != "" {
					if name, ok := userNameMap[target.ResponsibleUID]; ok {
						return &name
					}
				}
				return nil
			}(),
			EmployeeID: target.EmployeeID,
			EmployeeName: func() *string {
				if target.EmployeeID != "" {
					// 处理多个员工ID（逗号分隔）
					employeeIds := strings.Split(target.EmployeeID, ",")
					employeeNames := make([]string, 0)
					for _, eid := range employeeIds {
						if id := strings.TrimSpace(eid); id != "" {
							if name, ok := userNameMap[id]; ok {
								employeeNames = append(employeeNames, name)
							}
						}
					}
					if len(employeeNames) > 0 {
						names := strings.Join(employeeNames, ",")
						return &names
					}
				}
				return nil
			}(),
			EvaluationContent: target.EvaluationContent, // 添加评价内容字段
			CreatedAt:         target.CreatedAt,
			CreatedBy:         target.CreatedBy,
			CreatedByName: func() string {
				if target.CreatedBy != "" {
					return userNameMap[target.CreatedBy]
				}
				return ""
			}(),
			UpdatedAt: target.UpdatedAt,
			UpdatedBy: target.UpdatedBy,
			UpdatedByName: func() *string {
				if target.UpdatedBy != nil {
					if name, ok := userNameMap[*target.UpdatedBy]; ok {
						return &name
					}
				}
				return nil
			}(),
		},
		EvaluationPlans: evaluationPlans,
	}

	fmt.Printf("=== Domain: GetEvaluationPage 执行完成 ===\n")
	return result, nil
}

// 新增：提交评价
func (d *TargetDomainImpl) SubmitEvaluation(ctx context.Context, id uint64, req assessment.EvaluationSubmitReq, userID string) error {
	fmt.Printf("=== Domain: SubmitEvaluation 开始执行，目标ID: %d ===\n", id)

	// 1. 检查目标是否存在且状态为待评价
	_, err := d.repo.GetTarget(ctx, id)
	if err != nil {
		fmt.Printf("获取目标详情失败: %v\n", err)
		return err
	}

	/*if target.Status != 2 {
		return fmt.Errorf("目标状态不是待评价，无法提交评价")
	}*/

	// 2. 使用repository层的事务方法进行批量更新
	err = d.repo.SubmitEvaluationWithTransaction(ctx, id, req, userID)
	if err != nil {
		fmt.Printf("提交评价失败: %v\n", err)
		return err
	}

	fmt.Printf("=== Domain: SubmitEvaluation 执行完成 ===\n")
	return nil
}

// GetDepartmentNameAndPathMap 获取部门名称和路径映射
func (d *TargetDomainImpl) GetDepartmentNameAndPathMap(ctx context.Context, departmentIds []string) (nameMap map[string]string, pathMap map[string]string, err error) {
	nameMap = make(map[string]string)
	pathMap = make(map[string]string)
	if len(departmentIds) == 0 {
		return nameMap, pathMap, nil
	}
	departmentInfos, err := d.configurationCenterDriven.GetDepartmentPrecision(ctx, departmentIds)
	if err != nil {
		return nameMap, pathMap, err
	}

	for _, departmentInfo := range departmentInfos.Departments {
		nameMap[departmentInfo.ID] = ""
		pathMap[departmentInfo.ID] = ""
		if departmentInfo.DeletedAt == 0 {
			nameMap[departmentInfo.ID] = departmentInfo.Name
			pathMap[departmentInfo.ID] = departmentInfo.Path
		}
	}
	return nameMap, pathMap, nil
}

// GetUserNameMap 获取用户名称映射
func (d *TargetDomainImpl) GetUserNameMap(ctx context.Context, userIds []string) (nameMap map[string]string, err error) {
	nameMap = make(map[string]string)
	if len(userIds) == 0 {
		return nameMap, nil
	}
	userInfos, err := d.configurationCenterDriven.GetUsers(ctx, userIds)
	if err != nil {
		return nameMap, err
	}

	for _, userInfo := range userInfos {
		nameMap[userInfo.ID] = userInfo.Name
	}
	return nameMap, nil
}

// GetDepartmentNameAndPathMap 获取部门名称和路径映射
func (d *PlanDomainImpl) GetDepartmentNameAndPathMap(ctx context.Context, departmentIds []string) (nameMap map[string]string, pathMap map[string]string, err error) {
	nameMap = make(map[string]string)
	pathMap = make(map[string]string)
	if len(departmentIds) == 0 {
		return nameMap, pathMap, nil
	}
	departmentInfos, err := d.configurationCenterDriven.GetDepartmentPrecision(ctx, departmentIds)
	if err != nil {
		return nameMap, pathMap, err
	}

	for _, departmentInfo := range departmentInfos.Departments {
		nameMap[departmentInfo.ID] = ""
		pathMap[departmentInfo.ID] = ""
		if departmentInfo.DeletedAt == 0 {
			nameMap[departmentInfo.ID] = departmentInfo.Name
			pathMap[departmentInfo.ID] = departmentInfo.Path
		}
	}
	return nameMap, pathMap, nil
}

// GetUserNameMap 获取用户名称映射
func (d *PlanDomainImpl) GetUserNameMap(ctx context.Context, userIds []string) (nameMap map[string]string, err error) {
	nameMap = make(map[string]string)
	if len(userIds) == 0 {
		return nameMap, nil
	}
	userInfos, err := d.configurationCenterDriven.GetUsers(ctx, userIds)
	if err != nil {
		return nameMap, err
	}

	for _, userInfo := range userInfos {
		nameMap[userInfo.ID] = userInfo.Name
	}
	return nameMap, nil
}

// 新增：获取部门数据概览
func (d *TargetDomainImpl) GetDepartmentOverview(ctx context.Context, q assessment.DepartmentOverviewQuery) (*assessment.DepartmentOverviewResp, error) {
	fmt.Printf("=== Domain: GetDepartmentOverview 开始执行 ===\n")
	fmt.Printf("查询参数: department_id=%v, target_id=%v\n", q.DepartmentID, q.TargetID)

	var target *assessment.Target
	var err error

	// 2. 根据查询参数获取目标（两个参数都是可选的）
	target, err = d.repo.GetTargetByDepartmentAndTargetID(ctx, q.DepartmentID, q.TargetID)

	if err != nil {
		if err.Error() == "record not found" {
			fmt.Printf("未找到目标数据\n")
			return nil, nil // 返回空数据，不是错误
		}
		return nil, err
	}

	// 2. 获取部门名称
	departmentNameMap, _, err := d.GetDepartmentNameAndPathMap(ctx, []string{target.DepartmentID})
	if err != nil {
		departmentNameMap = make(map[string]string)
	}
	departmentName := departmentNameMap[target.DepartmentID]

	// 3. 获取用户名称映射
	userIds := make([]string, 0)
	if target.CreatedBy != "" {
		userIds = append(userIds, target.CreatedBy)
	}
	if target.UpdatedBy != nil {
		userIds = append(userIds, *target.UpdatedBy)
	}
	// 添加责任人和协助成员的用户ID
	if target.ResponsibleUID != "" {
		userIds = append(userIds, target.ResponsibleUID)
	}
	if target.EmployeeID != "" {
		userIds = append(userIds, target.EmployeeID)
	}
	userIds = util.DuplicateStringRemoval(userIds)

	userNameMap, err := d.GetUserNameMap(ctx, userIds)
	if err != nil {
		userNameMap = make(map[string]string)
	}

	// 4. 构建目标概览信息
	targetOverview := &assessment.TargetOverview{
		ID:             target.ID,
		TargetName:     target.TargetName,
		TargetType:     target.TargetType,
		DepartmentID:   target.DepartmentID,
		DepartmentName: departmentName,
		Description:    target.Description,
		StartDate:      target.StartDate,
		EndDate:        target.EndDate,
		Status:         target.Status,
		ResponsibleName: func() *string {
			if target.ResponsibleUID != "" {
				if name, exists := userNameMap[target.ResponsibleUID]; exists {
					return &name
				}
			}
			return nil
		}(),
		EmployeeName: func() *string {
			if target.EmployeeID != "" {
				if name, exists := userNameMap[target.EmployeeID]; exists {
					return &name
				}
			}
			return nil
		}(),
		CreatedAt: target.CreatedAt,
		CreatedBy: target.CreatedBy,
		CreatedByName: func() string {
			if target.CreatedBy != "" {
				if name, exists := userNameMap[target.CreatedBy]; exists {
					return name
				}
			}
			return ""
		}(),
		UpdatedAt: func() string {
			if target.UpdatedAt != nil {
				return *target.UpdatedAt
			}
			return target.CreatedAt
		}(),
		UpdatedBy: func() string {
			if target.UpdatedBy != nil {
				return *target.UpdatedBy
			}
			return target.CreatedBy
		}(),
		UpdatedByName: func() string {
			if target.UpdatedByName != nil {
				return *target.UpdatedByName
			}
			return target.CreatedByName
		}(),
		EvaluationContent: target.EvaluationContent,
	}

	// 5. 获取统计数据
	statistics, err := d.repo.GetTargetStatistics(ctx, target.ID)
	if err != nil {
		return nil, err
	}

	// 6. 构建响应
	result := &assessment.DepartmentOverviewResp{
		Target:     targetOverview,
		Statistics: statistics,
	}

	fmt.Printf("=== Domain: GetDepartmentOverview 执行完成 ===\n")
	return result, nil
}

// ================================
// 运营考核目标领域实现
// ================================

// 创建运营考核目标
func (d *TargetDomainImpl) CreateOperationTarget(ctx context.Context, req assessment.OperationTargetCreateReq, userID string) (uint64, error) {
	// 转换为通用的TargetCreateReq，设置target_type=2
	targetReq := assessment.TargetCreateReq{
		TargetName: req.TargetName,
		TargetType: 2, // 运营考核类型
		// DepartmentID:   req.DepartmentID,
		Description:    req.Description,
		StartDate:      req.StartDate,
		EndDate:        req.EndDate,
		ResponsibleUID: req.ResponsibleUID,
		EmployeeID:     req.EmployeeID,
	}

	return d.Create(ctx, targetReq, userID)
}

// 更新运营考核目标
func (d *TargetDomainImpl) UpdateOperationTarget(ctx context.Context, id uint64, req assessment.OperationTargetUpdateReq, userID string) error {
	// 转换为通用的TargetUpdateReq
	targetReq := assessment.TargetUpdateReq{
		TargetName:     req.TargetName,
		DepartmentID:   req.DepartmentID,
		Description:    req.Description,
		StartDate:      req.StartDate,
		EndDate:        req.EndDate,
		Status:         req.Status,
		ResponsibleUID: req.ResponsibleUID,
		EmployeeID:     req.EmployeeID,
	}

	return d.Update(ctx, id, targetReq, userID)
}

// 删除运营考核目标
func (d *TargetDomainImpl) DeleteOperationTarget(ctx context.Context, id uint64, userID string) error {
	// 复用现有的删除逻辑
	return d.Delete(ctx, id, userID)
}

// 获取运营考核目标详情
func (d *TargetDomainImpl) GetOperationTarget(ctx context.Context, id uint64) (*assessment.Target, error) {
	// 复用现有的获取逻辑
	return d.Get(ctx, id)
}

// 运营考核目标列表查询
func (d *TargetDomainImpl) ListOperationTargets(ctx context.Context, q assessment.OperationTargetQuery) (*assessment.PageResp[assessment.Target], error) {
	// 转换为通用的TargetQuery，设置target_type=2
	targetQuery := assessment.TargetQuery{
		TargetName:     q.TargetName,   // 传递目标名称查询条件
		TargetType:     &[]uint8{2}[0], // 固定为运营考核类型
		DepartmentID:   q.DepartmentID,
		Status:         q.Status,
		StartDate:      q.StartDate,
		EndDate:        q.EndDate,
		ResponsibleUID: q.ResponsibleUID,
		EmployeeID:     q.EmployeeID,
		Sort:           q.Sort,
		Direction:      q.Direction,
		Offset:         q.Offset,
		Limit:          q.Limit,
	}

	// 直接调用通用的List方法，repository层会自动过滤target_type=2
	return d.List(ctx, targetQuery)
}

// 运营考核目标自动更新状态
func (d *TargetDomainImpl) AutoUpdateOperationTargetStatusByDate(ctx context.Context) error {
	// 复用现有的自动更新逻辑
	return d.AutoUpdateStatusByDate(ctx)
}

// 完成运营考核目标
func (d *TargetDomainImpl) CompleteOperationTarget(ctx context.Context, id uint64, userID string) error {
	// 复用现有的完成逻辑
	return d.CompleteTarget(ctx, id, userID)
}

// 新增：获取目标概览数据
func (d *TargetDomainImpl) GetTargetOverview(ctx context.Context, id uint64) (*assessment.TargetOverview, error) {
	fmt.Printf("=== Domain: GetTargetOverview 开始执行，目标ID: %d ===\n", id)

	// 1. 获取目标基本信息
	target, err := d.repo.GetTarget(ctx, id)
	if err != nil {
		if err.Error() == "record not found" {
			fmt.Printf("未找到目标数据\n")
			return nil, nil // 返回空数据，不是错误
		}
		return nil, err
	}

	// 2. 获取部门名称
	departmentNameMap, _, err := d.GetDepartmentNameAndPathMap(ctx, []string{target.DepartmentID})
	if err != nil {
		departmentNameMap = make(map[string]string)
	}
	departmentName := departmentNameMap[target.DepartmentID]

	// 3. 获取用户名称映射
	userIds := make([]string, 0)
	if target.CreatedBy != "" {
		userIds = append(userIds, target.CreatedBy)
	}
	if target.UpdatedBy != nil {
		userIds = append(userIds, *target.UpdatedBy)
	}
	// 添加责任人和协助成员的用户ID
	if target.ResponsibleUID != "" {
		userIds = append(userIds, target.ResponsibleUID)
	}
	if target.EmployeeID != "" {
		userIds = append(userIds, target.EmployeeID)
	}
	userIds = util.DuplicateStringRemoval(userIds)

	userNameMap, err := d.GetUserNameMap(ctx, userIds)
	if err != nil {
		userNameMap = make(map[string]string)
	}

	// 4. 构建目标概览信息
	targetOverview := &assessment.TargetOverview{
		ID:             target.ID,
		TargetName:     target.TargetName,
		TargetType:     target.TargetType,
		DepartmentID:   target.DepartmentID,
		DepartmentName: departmentName,
		Description:    target.Description,
		StartDate:      target.StartDate,
		EndDate:        target.EndDate,
		Status:         target.Status,
		ResponsibleName: func() *string {
			if target.ResponsibleUID != "" {
				if name, exists := userNameMap[target.ResponsibleUID]; exists {
					return &name
				}
			}
			return nil
		}(),
		EmployeeName: func() *string {
			if target.EmployeeID != "" {
				if name, exists := userNameMap[target.EmployeeID]; exists {
					return &name
				}
			}
			return nil
		}(),
		CreatedAt: target.CreatedAt,
		CreatedBy: target.CreatedBy,
		CreatedByName: func() string {
			if target.CreatedBy != "" {
				if name, exists := userNameMap[target.CreatedBy]; exists {
					return name
				}
			}
			return ""
		}(),
		UpdatedAt: func() string {
			if target.UpdatedAt != nil {
				return *target.UpdatedAt
			}
			return target.CreatedAt
		}(),
		UpdatedBy: func() string {
			if target.UpdatedBy != nil {
				return *target.UpdatedBy
			}
			return target.CreatedBy
		}(),
		UpdatedByName: func() string {
			if target.UpdatedByName != nil {
				return *target.UpdatedByName
			}
			return target.CreatedByName
		}(),
		EvaluationContent: target.EvaluationContent,
	}

	fmt.Printf("=== Domain: GetTargetOverview 执行完成 ===\n")
	return targetOverview, nil
}

// 新增：创建OperationTargetDomain实例的构造函数
func NewOperationTargetDomain(repo repoif.AssessmentRepo, configurationCenterDriven configuration_center.Driven) assessment.OperationTargetDomain {
	return &OperationTargetDomainImpl{target: &TargetDomainImpl{repo: repo, configurationCenterDriven: configurationCenterDriven}}
}

// 新增：POCO到实体的转换函数
func toTargetEntity(po *tTarget) *assessment.Target {
	if po == nil {
		return nil
	}

	var updatedAt *string
	if po.UpdatedAt != nil {
		updatedAtStr := po.UpdatedAt.Format("2006-01-02 15:04:05.000")
		updatedAt = &updatedAtStr
	}

	var updatedBy *string
	if po.UpdatedBy != nil {
		updatedBy = po.UpdatedBy
	}

	// Note: UpdatedByName will be populated by the domain layer after fetching user names
	var updatedByName *string

	return &assessment.Target{
		ID:                po.ID,
		TargetName:        po.TargetName,
		TargetType:        po.TargetType,
		DepartmentID:      po.DepartmentID,
		Description:       po.Description,
		StartDate:         po.StartDate.Format("2006-01-02"),
		EndDate:           po.EndDate.Format("2006-01-02"),
		Status:            po.Status,
		ResponsibleUID:    po.ResponsibleUID,
		EmployeeID:        po.EmployeeID,
		EvaluationContent: po.EvaluationContent,
		CreatedAt:         po.CreatedAt.Format("2006-01-02 15:04:05.000"),
		CreatedBy:         po.CreatedBy,
		UpdatedAt:         updatedAt,
		UpdatedBy:         updatedBy,
		UpdatedByName:     updatedByName,
	}
}

// 运营考核目标领域实现（对外接口，包装 TargetDomainImpl）
func (o *OperationTargetDomainImpl) Create(ctx context.Context, req assessment.OperationTargetCreateReq, userID string) (uint64, error) {
	// 转换为通用的TargetCreateReq，设置target_type=2
	targetReq := assessment.TargetCreateReq{
		TargetName:     req.TargetName,
		TargetType:     2,
		Description:    req.Description,
		StartDate:      req.StartDate,
		EndDate:        req.EndDate,
		ResponsibleUID: req.ResponsibleUID,
		EmployeeID:     req.EmployeeID,
	}
	return o.target.Create(ctx, targetReq, userID)
}

func (o *OperationTargetDomainImpl) Update(ctx context.Context, id uint64, req assessment.OperationTargetUpdateReq, userID string) error {
	targetReq := assessment.TargetUpdateReq{
		TargetName:     req.TargetName,
		DepartmentID:   req.DepartmentID,
		Description:    req.Description,
		StartDate:      req.StartDate,
		EndDate:        req.EndDate,
		Status:         req.Status,
		ResponsibleUID: req.ResponsibleUID,
		EmployeeID:     req.EmployeeID,
	}
	return o.target.Update(ctx, id, targetReq, userID)
}

func (o *OperationTargetDomainImpl) Delete(ctx context.Context, id uint64, userID string) error {
	return o.target.Delete(ctx, id, userID)
}

func (o *OperationTargetDomainImpl) Get(ctx context.Context, id uint64) (*assessment.Target, error) {
	return o.target.Get(ctx, id)
}

func (o *OperationTargetDomainImpl) List(ctx context.Context, q assessment.OperationTargetQuery) (*assessment.PageResp[assessment.Target], error) {
	targetQuery := assessment.TargetQuery{
		TargetName:     q.TargetName,
		TargetType:     &[]uint8{2}[0],
		DepartmentID:   q.DepartmentID,
		Status:         q.Status,
		StartDate:      q.StartDate,
		EndDate:        q.EndDate,
		ResponsibleUID: q.ResponsibleUID,
		EmployeeID:     q.EmployeeID,
		Sort:           q.Sort,
		Direction:      q.Direction,
		Offset:         q.Offset,
		Limit:          q.Limit,
	}
	return o.target.List(ctx, targetQuery)
}

func (o *OperationTargetDomainImpl) AutoUpdateStatusByDate(ctx context.Context) error {
	return o.target.AutoUpdateStatusByDate(ctx)
}

func (o *OperationTargetDomainImpl) CompleteTarget(ctx context.Context, id uint64, userID string) error {
	return o.target.CompleteTarget(ctx, id, userID)
}

// 新增：获取运营考核目标详情（包含计划列表）
func (d *OperationTargetDomainImpl) GetDetailWithPlans(ctx context.Context, id uint64, q assessment.OperationTargetDetailQuery) (*assessment.OperationTargetDetailWithPlans, error) {
	fmt.Printf("=== Domain: GetDetailWithPlans 开始执行，目标ID: %d ===\n", id)

	// 1. 获取目标基本信息
	target, err := d.target.repo.GetTarget(ctx, id)
	if err != nil {
		if err.Error() == "record not found" {
			fmt.Printf("未找到目标数据\n")
			return nil, nil // 返回空数据，不是错误
		}
		return nil, err
	}

	// 2. 验证目标类型是否为运营考核
	if target.TargetType != 2 {
		return nil, fmt.Errorf("目标类型不是运营考核类型")
	}

	// 3. 获取部门名称
	departmentNameMap, _, err := d.target.GetDepartmentNameAndPathMap(ctx, []string{target.DepartmentID})
	if err != nil {
		departmentNameMap = make(map[string]string)
	}
	departmentName := departmentNameMap[target.DepartmentID]

	// 4. 获取用户名称映射
	userIds := make([]string, 0)
	if target.CreatedBy != "" {
		userIds = append(userIds, target.CreatedBy)
	}
	if target.UpdatedBy != nil {
		userIds = append(userIds, *target.UpdatedBy)
	}
	// 添加责任人和协助成员的用户ID
	if target.ResponsibleUID != "" {
		userIds = append(userIds, target.ResponsibleUID)
	}
	if target.EmployeeID != "" {
		userIds = append(userIds, target.EmployeeID)
	}
	userIds = util.DuplicateStringRemoval(userIds)

	userNameMap, err := d.target.GetUserNameMap(ctx, userIds)
	if err != nil {
		userNameMap = make(map[string]string)
	}

	// 5. 获取计划详情列表
	plans, err := d.target.repo.GetOperationPlansByTargetID(ctx, id, q.PlanName)
	if err != nil {
		return nil, err
	}

	// 6. 为计划添加责任人名称和数据归集计划名称
	for i := range plans {
		if plans[i].ResponsibleUID != "" {
			if name, exists := userNameMap[plans[i].ResponsibleUID]; exists {
				plans[i].ResponsibleName = &name
			}
		}

		// 处理数据获取类型的关联数据归集计划名称
		if plans[i].PlanType == 1 && plans[i].RelatedDataCollectionPlanID != nil {
			// 这里可以调用通用函数获取数据归集计划名称
			// 由于当前结构体没有专门的名称字段，我们保持原有的ID格式
			// 如果需要显示名称，可以在这里添加相关逻辑
		}
	}

	// 7. 构建响应
	result := &assessment.OperationTargetDetailWithPlans{
		ID:             target.ID,
		TargetName:     target.TargetName,
		TargetType:     target.TargetType,
		DepartmentID:   target.DepartmentID,
		DepartmentName: departmentName,
		Description:    target.Description,
		StartDate:      target.StartDate,
		EndDate:        target.EndDate,
		Status:         target.Status,
		ResponsibleUID: target.ResponsibleUID,
		ResponsibleName: func() *string {
			if target.ResponsibleUID != "" {
				if name, exists := userNameMap[target.ResponsibleUID]; exists {
					return &name
				}
			}
			return nil
		}(),
		AssistantUID: target.EmployeeID,
		AssistantName: func() *string {
			if target.EmployeeID != "" {
				if name, exists := userNameMap[target.EmployeeID]; exists {
					return &name
				}
			}
			return nil
		}(),
		EmployeeID:        target.EmployeeID,
		EvaluationContent: target.EvaluationContent,
		CreatedAt:         target.CreatedAt,
		CreatedBy:         target.CreatedBy,
		/*CreatedByName: func() string {
			if target.CreatedBy != "" {
				if name, exists := userNameMap[target.CreatedBy]; exists {
					return name
				}
			}
			return ""
		}(),
		UpdatedAt: func() string {
			if target.UpdatedAt != nil {
				return *target.UpdatedAt
			}
			return target.CreatedAt
		}(),*/
		/*UpdatedBy: func() string {
			if target.UpdatedBy != nil {
				return *target.UpdatedBy
			}
			return target.CreatedBy
		}(),
		UpdatedByName: func() string {
			if target.UpdatedByName != nil {
				return *target.UpdatedByName
			}
			return target.CreatedByName
		}(),*/
		Plans: plans,
	}

	fmt.Printf("=== Domain: GetDetailWithPlans 执行完成 ===\n")
	return result, nil
}

// 运营考核计划领域实现
type OperationPlanDomainImpl struct {
	repo                      repoif.AssessmentRepo
	configurationCenterDriven configuration_center.Driven
}

func NewOperationPlanDomain(repo repoif.AssessmentRepo, configurationCenterDriven configuration_center.Driven) assessment.OperationPlanDomain {
	return &OperationPlanDomainImpl{
		repo:                      repo,
		configurationCenterDriven: configurationCenterDriven,
	}
}

func (d *OperationPlanDomainImpl) Create(ctx context.Context, req assessment.OperationPlanCreateReq, userID string) (uint64, error) {
	return d.repo.CreateOperationPlan(ctx, req, userID)
}

func (d *OperationPlanDomainImpl) Update(ctx context.Context, id uint64, req assessment.OperationPlanUpdateReq, userID string) error {
	return d.repo.UpdateOperationPlan(ctx, id, req, userID)
}

func (d *OperationPlanDomainImpl) Delete(ctx context.Context, id uint64, userID string) error {
	return d.repo.DeleteOperationPlan(ctx, id, userID)
}

func (d *OperationPlanDomainImpl) ListPlansByTargetID(ctx context.Context, targetID uint64) ([]assessment.Plan, error) {
	plans, err := d.repo.ListOperationPlansByTargetID(ctx, targetID)
	if err != nil {
		return nil, err
	}

	// 收集所有用户ID
	userIds := make([]string, 0)
	for _, plan := range plans {
		if plan.ResponsibleUID != nil {
			userIds = append(userIds, *plan.ResponsibleUID)
		}
		userIds = append(userIds, plan.CreatedBy)
		if plan.UpdatedBy != nil {
			userIds = append(userIds, *plan.UpdatedBy)
		}
	}

	// 去重
	userIds = util.DuplicateStringRemoval(userIds)

	// 获取用户名称映射
	userNameMap := make(map[string]string)
	if len(userIds) > 0 {
		userNameMap, err = d.GetUserNameMap(ctx, userIds)
		if err != nil {
			// 记录错误但不影响返回
			userNameMap = make(map[string]string)
		}
	}

	// 填充名称信息
	for i := range plans {
		plan := &plans[i]
		plan.CreatedByName = userNameMap[plan.CreatedBy]
		if plan.UpdatedBy != nil {
			if name, ok := userNameMap[*plan.UpdatedBy]; ok {
				plan.UpdatedByName = &name
			}
		}
	}

	return plans, nil
}

// 新增：获取单个计划详情
func (d *OperationPlanDomainImpl) GetDetail(ctx context.Context, id uint64) (*assessment.OperationPlanDetail, error) {
	fmt.Printf("=== Domain: GetDetail 开始执行，计划ID: %d ===\n", id)

	// 1. 获取计划基本信息
	plan, err := d.repo.GetOperationPlanDetail(ctx, id)
	if err != nil {
		if err.Error() == "record not found" {
			fmt.Printf("未找到计划数据\n")
			return nil, nil // 返回空数据，不是错误
		}
		return nil, err
	}

	// 2. 获取责任人名称
	if plan.ResponsibleUID != "" {
		userNameMap, err := d.GetUserNameMap(ctx, []string{plan.ResponsibleUID})
		if err == nil {
			if name, exists := userNameMap[plan.ResponsibleUID]; exists {
				plan.ResponsibleName = &name
			}
		}
	}

	// 3. 处理数据获取类型的关联数据归集计划名称
	if plan.PlanType == 1 && plan.RelatedDataCollectionPlanID != nil {
		relatedPlans, err := d.getDataAggregationPlanNamesForOperation(ctx, plan.RelatedDataCollectionPlanID)
		if err == nil {
			plan.RelatedDataCollectionPlans = relatedPlans
		}
	}

	fmt.Printf("=== Domain: GetDetail 执行完成 ===\n")
	return plan, nil
}

// 获取数据归集计划名称的通用函数（运营考核计划专用）
func (d *OperationPlanDomainImpl) getDataAggregationPlanNamesForOperation(ctx context.Context, relatedDataCollectionPlanID *string) ([]assessment.RelatedPlan, error) {
	if relatedDataCollectionPlanID == nil {
		return nil, nil
	}

	relatedPlans := make([]assessment.RelatedPlan, 0)
	// 解析逗号分隔的计划ID
	planIDs := strings.Split(*relatedDataCollectionPlanID, ",")
	planIDStrings := make([]string, 0)
	for _, planIDStr := range planIDs {
		if planIDStr = strings.TrimSpace(planIDStr); planIDStr != "" {
			planIDStrings = append(planIDStrings, planIDStr)
		}
	}

	// 批量获取数据归集计划名称
	if len(planIDStrings) > 0 {
		planNameMap, err := d.repo.GetDataAggregationPlansByIDs(ctx, planIDStrings)
		if err != nil {
			// 如果获取失败，使用ID作为名称
			for _, planID := range planIDStrings {
				relatedPlans = append(relatedPlans, assessment.RelatedPlan{
					ID:   planID,
					Name: fmt.Sprintf("数据归集计划-%s", planID),
				})
			}
		} else {
			// 使用真实的计划名称
			for _, planID := range planIDStrings {
				if planInfo, exists := planNameMap[planID]; exists {
					relatedPlans = append(relatedPlans, assessment.RelatedPlan{
						ID:   planInfo.ID,
						Name: planInfo.Name,
					})
				} else {
					// 如果找不到计划信息，使用ID作为名称
					relatedPlans = append(relatedPlans, assessment.RelatedPlan{
						ID:   planID,
						Name: fmt.Sprintf("数据归集计划-%s", planID),
					})
				}
			}
		}
	}

	return relatedPlans, nil
}

// 获取数据归集计划名称的通用函数
func (d *TargetDomainImpl) getDataAggregationPlanNames(ctx context.Context, relatedDataCollectionPlanID *string) ([]assessment.RelatedPlan, error) {
	if relatedDataCollectionPlanID == nil {
		return nil, nil
	}

	relatedPlans := make([]assessment.RelatedPlan, 0)
	// 解析逗号分隔的计划ID
	planIDs := strings.Split(*relatedDataCollectionPlanID, ",")
	planIDStrings := make([]string, 0)
	for _, planIDStr := range planIDs {
		if planIDStr = strings.TrimSpace(planIDStr); planIDStr != "" {
			planIDStrings = append(planIDStrings, planIDStr)
		}
	}

	// 批量获取数据归集计划名称
	if len(planIDStrings) > 0 {
		planNameMap, err := d.repo.GetDataAggregationPlansByIDs(ctx, planIDStrings)
		if err != nil {
			// 如果获取失败，使用ID作为名称
			for _, planID := range planIDStrings {
				relatedPlans = append(relatedPlans, assessment.RelatedPlan{
					ID:   planID,
					Name: fmt.Sprintf("数据归集计划-%s", planID),
				})
			}
		} else {
			// 使用真实的计划名称
			for _, planID := range planIDStrings {
				if planInfo, exists := planNameMap[planID]; exists {
					relatedPlans = append(relatedPlans, assessment.RelatedPlan{
						ID:   planInfo.ID,
						Name: planInfo.Name,
					})
				} else {
					// 如果找不到计划信息，使用ID作为名称
					relatedPlans = append(relatedPlans, assessment.RelatedPlan{
						ID:   planID,
						Name: fmt.Sprintf("数据归集计划-%s", planID),
					})
				}
			}
		}
	}

	return relatedPlans, nil
}

// 新增：获取运营考核概览
func (d *OperationTargetDomainImpl) GetOperationOverview(ctx context.Context, q assessment.OperationOverviewQuery) (*assessment.OperationOverviewResp, error) {
	fmt.Printf("=== Domain: GetOperationOverview 开始执行 ===\n")

	// 1. 根据查询条件获取运营考核目标
	target, err := d.target.repo.GetOperationTargetByCondition(ctx, q.ResponsibleUID, q.AssistantUID, q.TargetID)
	if err != nil {
		if err.Error() == "record not found" {
			fmt.Printf("未找到符合条件的运营考核目标，返回nil\n")
			return nil, nil
		}
		fmt.Printf("获取运营考核目标失败: %v\n", err)
		return nil, err
	}

	// 2. 检查目标类型是否为运营考核
	if target.TargetType != 2 {
		return nil, fmt.Errorf("目标类型不是运营考核，无法获取运营考核概览")
	}

	fmt.Printf("找到运营考核目标，ID: %d, Name: %s\n", target.ID, target.TargetName)

	// 3. 获取部门名称
	departmentName := target.DepartmentName
	if target.DepartmentID != "" && departmentName == "" {
		departmentNameMap, _, err := d.target.GetDepartmentNameAndPathMap(ctx, []string{target.DepartmentID})
		if err == nil && len(departmentNameMap) > 0 {
			departmentName = departmentNameMap[target.DepartmentID]
		}
	}

	// 4. 获取用户名称映射
	userIds := []string{target.CreatedBy}
	if target.UpdatedBy != nil {
		userIds = append(userIds, *target.UpdatedBy)
	}
	if target.ResponsibleUID != "" {
		userIds = append(userIds, target.ResponsibleUID)
	}
	if target.EmployeeID != "" {
		userIds = append(userIds, target.EmployeeID)
	}
	if target.EmployeeID != "" {
		userIds = append(userIds, target.EmployeeID)
	}
	userIds = util.DuplicateStringRemoval(userIds)

	userNameMap, err := d.target.GetUserNameMap(ctx, userIds)
	if err != nil {
		userNameMap = make(map[string]string)
	}

	// 5. 构建目标概览信息
	targetOverview := &assessment.TargetOverview{
		ID:             target.ID,
		TargetName:     target.TargetName,
		TargetType:     target.TargetType,
		DepartmentID:   target.DepartmentID,
		DepartmentName: departmentName,
		Description:    target.Description,
		StartDate:      target.StartDate,
		EndDate:        target.EndDate,
		Status:         target.Status,
		ResponsibleUID: target.ResponsibleUID,
		ResponsibleName: func() *string {
			if target.ResponsibleUID != "" {
				if name, exists := userNameMap[target.ResponsibleUID]; exists {
					return &name
				}
			}
			return nil
		}(),
		AssistantUID: target.EmployeeID,
		AssistantName: func() *string {
			if target.EmployeeID != "" {
				if name, exists := userNameMap[target.EmployeeID]; exists {
					return &name
				}
			}
			return nil
		}(),
		EmployeeName: func() *string {
			if target.EmployeeID != "" {
				if name, exists := userNameMap[target.EmployeeID]; exists {
					return &name
				}
			}
			return nil
		}(),
		CreatedAt: target.CreatedAt,
		CreatedBy: target.CreatedBy,
		CreatedByName: func() string {
			if target.CreatedBy != "" {
				if name, exists := userNameMap[target.CreatedBy]; exists {
					return name
				}
			}
			return ""
		}(),
		UpdatedAt: func() string {
			if target.UpdatedAt != nil {
				return *target.UpdatedAt
			}
			return target.CreatedAt
		}(),
		UpdatedBy: func() string {
			if target.UpdatedBy != nil {
				return *target.UpdatedBy
			}
			return target.CreatedBy
		}(),
		UpdatedByName: func() string {
			if target.UpdatedBy != nil {
				if name, exists := userNameMap[*target.UpdatedBy]; exists {
					return name
				}
			}
			return ""
		}(),
		EvaluationContent: target.EvaluationContent,
	}

	// 6. 查询运营考核计划列表
	plans, err := d.target.repo.ListOperationPlansByTargetID(ctx, target.ID)
	if err != nil {
		fmt.Printf("查询运营考核计划失败: %v\n", err)
		return nil, err
	}

	// 7. 按计划类型分组统计
	dataCollectionStats := &assessment.DataCollectionStatistics{}
	dataUnderstandingStats := &assessment.DataUnderstandingStatistics{}
	dataProcessStats := &assessment.DataProcessStatistics{}

	for _, plan := range plans {
		switch plan.PlanType {
		case 1: // 数据归集
			if plan.PlanQuantity > 0 {
				dataCollectionStats.PlanCount += plan.PlanQuantity
			}
			if plan.DataCollectionActualQuantity != nil {
				dataCollectionStats.ActualCount += *plan.DataCollectionActualQuantity
			}
		case 5: // 数据处理
			if plan.DataProcessExploreQuantity != nil {
				dataProcessStats.ExplorePlanCount += *plan.DataProcessExploreQuantity
			}
			if plan.DataProcessFusionQuantity != nil {
				dataProcessStats.FusionPlanCount += *plan.DataProcessFusionQuantity
			}
			if plan.DataProcessExploreActualQuantity != nil {
				dataProcessStats.ExploreActualCount += *plan.DataProcessExploreActualQuantity
			}
			if plan.DataProcessFusionActualQuantity != nil {
				dataProcessStats.FusionActualCount += *plan.DataProcessFusionActualQuantity
			}
		case 6: // 数据理解
			if plan.DataUnderstandingQuantity != nil {
				dataUnderstandingStats.PlanCount += *plan.DataUnderstandingQuantity
			}
			if plan.DataUnderstandingActualQuantity != nil {
				dataUnderstandingStats.ActualCount += *plan.DataUnderstandingActualQuantity
			}
		}
	}

	// 8. 计算完成率
	if dataCollectionStats.PlanCount > 0 {
		dataCollectionStats.CompletionRate = float64(dataCollectionStats.ActualCount) / float64(dataCollectionStats.PlanCount) * 100
	}
	if dataUnderstandingStats.PlanCount > 0 {
		dataUnderstandingStats.CompletionRate = float64(dataUnderstandingStats.ActualCount) / float64(dataUnderstandingStats.PlanCount) * 100
	}
	if dataProcessStats.ExplorePlanCount > 0 {
		dataProcessStats.ExploreCompletionRate = float64(dataProcessStats.ExploreActualCount) / float64(dataProcessStats.ExplorePlanCount) * 100
	}
	if dataProcessStats.FusionPlanCount > 0 {
		dataProcessStats.FusionCompletionRate = float64(dataProcessStats.FusionActualCount) / float64(dataProcessStats.FusionPlanCount) * 100
	}

	// 9. 清理全为0的统计分组，使其在JSON中省略，最终statistics可能为{}
	var stats assessment.OperationStatistics
	if !(dataCollectionStats.PlanCount == 0 && dataCollectionStats.ActualCount == 0 && dataCollectionStats.CompletionRate == 0) {
		stats.DataCollection = dataCollectionStats
	}
	if !(dataUnderstandingStats.PlanCount == 0 && dataUnderstandingStats.ActualCount == 0 && dataUnderstandingStats.CompletionRate == 0) {
		stats.DataUnderstanding = dataUnderstandingStats
	}
	if !(dataProcessStats.ExplorePlanCount == 0 && dataProcessStats.ExploreActualCount == 0 && dataProcessStats.ExploreCompletionRate == 0 &&
		dataProcessStats.FusionPlanCount == 0 && dataProcessStats.FusionActualCount == 0 && dataProcessStats.FusionCompletionRate == 0) {
		stats.DataProcess = dataProcessStats
	}

	// 构建响应
	result := &assessment.OperationOverviewResp{
		Target:     targetOverview,
		Statistics: &stats,
	}

	fmt.Printf("=== Domain: GetOperationOverview 执行完成 ===\n")
	return result, nil
}

// 获取用户名称映射
func (d *OperationPlanDomainImpl) GetUserNameMap(ctx context.Context, userIds []string) (nameMap map[string]string, err error) {
	nameMap = make(map[string]string)
	if len(userIds) == 0 {
		return nameMap, nil
	}
	userInfos, err := d.configurationCenterDriven.GetUsers(ctx, userIds)
	if err != nil {
		return nameMap, err
	}

	for _, userInfo := range userInfos {
		nameMap[userInfo.ID] = userInfo.Name
	}
	return nameMap, nil
}

// 获取数据处理计划名称的辅助函数
func (d *TargetDomainImpl) getDataProcessPlanNames(ctx context.Context, relatedDataProcessPlanID *string) ([]assessment.RelatedPlan, error) {
	if relatedDataProcessPlanID == nil {
		return nil, nil
	}

	relatedPlans := make([]assessment.RelatedPlan, 0)
	// 解析逗号分隔的计划ID
	planIDs := strings.Split(*relatedDataProcessPlanID, ",")
	planIDStrings := make([]string, 0)
	for _, planIDStr := range planIDs {
		if planIDStr = strings.TrimSpace(planIDStr); planIDStr != "" {
			planIDStrings = append(planIDStrings, planIDStr)
		}
	}

	// 批量获取数据处理计划名称
	if len(planIDStrings) > 0 {
		planNameMap, err := d.repo.GetDataProcessPlansByIDs(ctx, planIDStrings)
		if err != nil {
			// 如果获取失败，使用ID作为名称
			for _, planID := range planIDStrings {
				relatedPlans = append(relatedPlans, assessment.RelatedPlan{
					ID:   planID,
					Name: fmt.Sprintf("数据处理计划-%s", planID),
				})
			}
		} else {
			// 使用真实的计划名称
			for _, planID := range planIDStrings {
				if planInfo, exists := planNameMap[planID]; exists {
					relatedPlans = append(relatedPlans, assessment.RelatedPlan{
						ID:   planInfo.ID,
						Name: planInfo.Name,
					})
				} else {
					// 如果找不到计划信息，使用ID作为名称
					relatedPlans = append(relatedPlans, assessment.RelatedPlan{
						ID:   planID,
						Name: fmt.Sprintf("数据处理计划-%s", planID),
					})
				}
			}
		}
	}

	return relatedPlans, nil
}

// 获取数据理解计划名称的辅助函数
func (d *TargetDomainImpl) getDataUnderstandingPlanNames(ctx context.Context, relatedDataUnderstandingPlanID *string) ([]assessment.RelatedPlan, error) {
	if relatedDataUnderstandingPlanID == nil {
		return nil, nil
	}

	relatedPlans := make([]assessment.RelatedPlan, 0)
	// 解析逗号分隔的计划ID
	planIDs := strings.Split(*relatedDataUnderstandingPlanID, ",")
	planIDStrings := make([]string, 0)
	for _, planIDStr := range planIDs {
		if planIDStr = strings.TrimSpace(planIDStr); planIDStr != "" {
			planIDStrings = append(planIDStrings, planIDStr)
		}
	}

	// 批量获取数据理解计划名称
	if len(planIDStrings) > 0 {
		planNameMap, err := d.repo.GetDataUnderstandingPlansByIDs(ctx, planIDStrings)
		if err != nil {
			// 如果获取失败，使用ID作为名称
			for _, planID := range planIDStrings {
				relatedPlans = append(relatedPlans, assessment.RelatedPlan{
					ID:   planID,
					Name: fmt.Sprintf("数据理解计划-%s", planID),
				})
			}
		} else {
			// 使用真实的计划名称
			for _, planID := range planIDStrings {
				if planInfo, exists := planNameMap[planID]; exists {
					relatedPlans = append(relatedPlans, assessment.RelatedPlan{
						ID:   planInfo.ID,
						Name: planInfo.Name,
					})
				} else {
					// 如果找不到计划信息，使用ID作为名称
					relatedPlans = append(relatedPlans, assessment.RelatedPlan{
						ID:   planID,
						Name: fmt.Sprintf("数据理解计划-%s", planID),
					})
				}
			}
		}
	}

	return relatedPlans, nil
}

// collectDepartmentWithDescendants returns root department id plus all descendants' ids
func (d *TargetDomainImpl) collectDepartmentWithDescendants(ctx context.Context, rootID string) []string {
	ids := make([]string, 0, 16)
	queue := []string{rootID}
	seen := make(map[string]struct{})
	for len(queue) > 0 {
		cur := queue[0]
		queue = queue[1:]
		if _, ok := seen[cur]; ok {
			continue
		}
		seen[cur] = struct{}{}
		ids = append(ids, cur)
		if d.configurationCenterDriven != nil {
			children, err := d.configurationCenterDriven.GetChildDepartments(ctx, cur)
			if err != nil || children == nil {
				continue
			}
			for _, entry := range children.Entries {
				id := strings.TrimSpace(entry.ID)
				if id == "" {
					continue
				}
				if _, ok := seen[id]; !ok {
					queue = append(queue, id)
				}
			}
		}
	}
	return ids
}
