package v1

import (
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/assessment"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Controller struct {
	TargetDomain          assessment.TargetDomain
	PlanDomain            assessment.PlanDomain
	OperationTargetDomain assessment.OperationTargetDomain
	OperationPlanDomain   assessment.OperationPlanDomain
}

func NewController(target assessment.TargetDomain, plan assessment.PlanDomain, operationTarget assessment.OperationTargetDomain, operationPlan assessment.OperationPlanDomain) *Controller {
	return &Controller{
		TargetDomain:          target,
		PlanDomain:            plan,
		OperationTargetDomain: operationTarget,
		OperationPlanDomain:   operationPlan,
	}
}

type idUri struct {
	ID uint64 `uri:"id" binding:"required"`
}

// target
func (ctl *Controller) CreateTarget(c *gin.Context) {
	var req assessment.TargetCreateReq
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	uInfo := request.GetUserInfo(c)
	id, err := ctl.TargetDomain.Create(c, req, uInfo.ID)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, gin.H{"id": id})
}
func (ctl *Controller) UpdateTarget(c *gin.Context) {
	var p idUri
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		form_validator.UriParamErrorHandle(c, err)
		return
	}
	var req assessment.TargetUpdateReq
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	uInfo := request.GetUserInfo(c)
	if err := ctl.TargetDomain.Update(c, p.ID, req, uInfo.ID); err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, gin.H{"id": p.ID})
}
func (ctl *Controller) DeleteTarget(c *gin.Context) {
	fmt.Printf("=== Controller: DeleteTarget 开始执行 ===\n")

	var p idUri
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		fmt.Printf("Controller: URI参数验证失败: %v\n", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	uInfo := request.GetUserInfo(c)
	fmt.Printf("Controller: 删除目标 ID=%d，操作用户=%s\n", p.ID, uInfo.ID)

	if err := ctl.TargetDomain.Delete(c, p.ID, uInfo.ID); err != nil {
		fmt.Printf("Controller: 删除目标失败: %v\n", err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	fmt.Printf("Controller: 成功删除目标 ID=%d\n", p.ID)
	fmt.Printf("=== Controller: DeleteTarget 执行完成 ===\n")
	ginx.ResOKJson(c, gin.H{"id": p.ID})
}
func (ctl *Controller) GetTarget(c *gin.Context) {
	var p idUri
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		form_validator.UriParamErrorHandle(c, err)
		return
	}
	resp, err := ctl.TargetDomain.Get(c, p.ID)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// 新增：获取目标详情（包含考核计划）
func (ctl *Controller) GetTargetDetailWithPlans(c *gin.Context) {
	var p idUri
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	var q assessment.TargetDetailQuery
	if _, err := form_validator.BindQueryAndValid(c, &q); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := ctl.TargetDomain.GetTargetDetailWithPlans(c, p.ID, q)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	// 如果返回nil，表示目标不存在，返回空的JSON响应
	if resp == nil {
		ginx.ResOKJson(c, gin.H{})
		return
	}

	ginx.ResOKJson(c, resp)
}
func (ctl *Controller) ListTargets(c *gin.Context) {
	var q assessment.TargetQuery
	if _, err := form_validator.BindQueryAndValid(c, &q); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	// 如果is_operator=true，获取当前登录用户ID并设置查询条件
	if q.IsOperator {
		uInfo := request.GetUserInfo(c)
		if uInfo != nil && uInfo.ID != "" {
			// 按当前用户ID查询：responsible_uid 或 employee_id 为当前用户ID
			q.ResponsibleUID = &uInfo.ID
			q.EmployeeID = &uInfo.ID
		}
	}

	// 如果没有指定department_id，自动过滤当前用户部门
	// 注意：仅对type=1（部门考核）应用部门过滤，type=2（运营考核）的department_id通常为空，不需要过滤
	if q.DepartmentID == "" && q.TargetType != nil && *q.TargetType == 1 {
		q.FilterCurrentUserDepartment = true // 标记需要过滤当前用户部门
	}

	resp, err := ctl.TargetDomain.List(c, q)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// 完成目标（设置状态为已结束）
func (ctl *Controller) CompleteTarget(c *gin.Context) {
	var p idUri
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		form_validator.UriParamErrorHandle(c, err)
		return
	}
	uInfo := request.GetUserInfo(c)
	if err := ctl.TargetDomain.CompleteTarget(c, p.ID, uInfo.ID); err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, gin.H{"id": p.ID, "status": 3})
}

// plan
func (ctl *Controller) CreatePlan(c *gin.Context) {
	var req assessment.PlanCreateReq
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	uInfo := request.GetUserInfo(c)
	id, err := ctl.PlanDomain.Create(c, req, uInfo.ID)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, gin.H{"id": id})
}
func (ctl *Controller) UpdatePlan(c *gin.Context) {
	var p idUri
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		form_validator.UriParamErrorHandle(c, err)
		return
	}
	var req assessment.PlanUpdateReq
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	uInfo := request.GetUserInfo(c)
	if err := ctl.PlanDomain.Update(c, p.ID, req, uInfo.ID); err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, gin.H{"id": p.ID})
}
func (ctl *Controller) DeletePlan(c *gin.Context) {
	var p idUri
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		form_validator.UriParamErrorHandle(c, err)
		return
	}
	uInfo := request.GetUserInfo(c)
	if err := ctl.PlanDomain.Delete(c, p.ID, uInfo.ID); err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, gin.H{"id": p.ID})
}

/*func (ctl *Controller) GetPlan(c *gin.Context) {
	var p idUri
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		form_validator.UriParamErrorHandle(c, err)
		return
	}
	resp, err := ctl.PlanDomain.Get(c, p.ID)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}*/
/*func (ctl *Controller) ListPlans(c *gin.Context) {
	var q assessment.PlanQuery
	if _, err := form_validator.BindQueryAndValid(c, &q); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	resp, err := ctl.PlanDomain.List(c, q)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}*/

// 新增：获取评价页面数据
func (ctl *Controller) GetEvaluationPage(c *gin.Context) {
	var p idUri
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	var q assessment.EvaluationPageQuery
	if _, err := form_validator.BindQueryAndValid(c, &q); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := ctl.TargetDomain.GetEvaluationPage(c, p.ID, q)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	// 如果返回nil，表示目标不存在，返回空的JSON响应
	if resp == nil {
		ginx.ResOKJson(c, gin.H{})
		return
	}

	ginx.ResOKJson(c, resp)
}

// 新增：提交评价
func (ctl *Controller) SubmitEvaluation(c *gin.Context) {
	var p idUri
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	var req assessment.EvaluationSubmitReq
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	uInfo := request.GetUserInfo(c)
	if err := ctl.TargetDomain.SubmitEvaluation(c, p.ID, req, uInfo.ID); err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, gin.H{"id": p.ID})
}

// 新增：获取部门数据概览
func (h *Controller) GetDepartmentOverview(c *gin.Context) {
	fmt.Printf("=== Controller: GetDepartmentOverview 开始执行 ===\n")

	// 1. 解析查询参数
	var q assessment.DepartmentOverviewQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		fmt.Printf("Controller: 参数绑定失败: %v\n", err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	// 2. 参数验证（两个参数都是可选的，无需验证）

	// 3. 调用Domain层
	resp, err := h.TargetDomain.GetDepartmentOverview(c.Request.Context(), q)
	if err != nil {
		fmt.Printf("Controller: 获取部门概览失败: %v\n", err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	// 4. 处理空数据情况
	if resp == nil {
		fmt.Printf("Controller: 未找到部门概览数据，返回空对象\n")
		ginx.ResOKJson(c, gin.H{})
		return
	}

	fmt.Printf("Controller: 成功获取部门概览数据\n")
	fmt.Printf("=== Controller: GetDepartmentOverview 执行完成 ===\n")
	ginx.ResOKJson(c, resp)
}

// ================================
// 运营考核目标控制器方法
// ================================

// 创建运营考核目标
func (ctl *Controller) CreateOperationTarget(c *gin.Context) {
	var req assessment.OperationTargetCreateReq
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	uInfo := request.GetUserInfo(c)
	id, err := ctl.OperationTargetDomain.Create(c, req, uInfo.ID)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, gin.H{"id": id})
}

// 更新运营考核目标
func (ctl *Controller) UpdateOperationTarget(c *gin.Context) {
	var p idUri
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		form_validator.UriParamErrorHandle(c, err)
		return
	}
	var req assessment.OperationTargetUpdateReq
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	uInfo := request.GetUserInfo(c)
	if err := ctl.OperationTargetDomain.Update(c, p.ID, req, uInfo.ID); err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, gin.H{"id": p.ID})
}

// 删除运营考核目标
func (ctl *Controller) DeleteOperationTarget(c *gin.Context) {
	var p idUri
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		form_validator.UriParamErrorHandle(c, err)
		return
	}
	uInfo := request.GetUserInfo(c)
	if err := ctl.OperationTargetDomain.Delete(c, p.ID, uInfo.ID); err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, gin.H{"id": p.ID})
}

// 获取运营考核目标详情
func (ctl *Controller) GetOperationTarget(c *gin.Context) {
	var p idUri
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		form_validator.UriParamErrorHandle(c, err)
		return
	}
	resp, err := ctl.OperationTargetDomain.Get(c, p.ID)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// 获取运营考核目标详情（包含计划信息）
func (ctl *Controller) GetOperationTargetDetailWithPlans(c *gin.Context) {
	var p idUri
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	var q assessment.OperationTargetDetailQuery
	if _, err := form_validator.BindQueryAndValid(c, &q); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := ctl.OperationTargetDomain.GetDetailWithPlans(c, p.ID, q)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	if resp == nil {
		ginx.ResOKJson(c, gin.H{})
		return
	}

	ginx.ResOKJson(c, resp)
}

// 运营考核目标列表查询
func (ctl *Controller) ListOperationTargets(c *gin.Context) {
	var req assessment.OperationTargetQuery
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	resp, err := ctl.OperationTargetDomain.List(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// 运营考核计划相关控制器方法

// 创建运营考核计划
func (ctl *Controller) CreateOperationPlan(c *gin.Context) {
	var req assessment.OperationPlanCreateReq
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	uInfo := request.GetUserInfo(c)
	id, err := ctl.OperationPlanDomain.Create(c, req, uInfo.ID)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, gin.H{"id": id})
}

// 更新运营考核计划
func (ctl *Controller) UpdateOperationPlan(c *gin.Context) {
	var p idUri
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		form_validator.UriParamErrorHandle(c, err)
		return
	}
	var req assessment.OperationPlanUpdateReq
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	uInfo := request.GetUserInfo(c)
	if err := ctl.OperationPlanDomain.Update(c, p.ID, req, uInfo.ID); err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, gin.H{"id": p.ID})
}

// 删除运营考核计划
func (ctl *Controller) DeleteOperationPlan(c *gin.Context) {
	var p idUri
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		form_validator.UriParamErrorHandle(c, err)
		return
	}
	uInfo := request.GetUserInfo(c)
	if err := ctl.OperationPlanDomain.Delete(c, p.ID, uInfo.ID); err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, gin.H{"id": p.ID})
}

// 获取运营考核计划列表
func (ctl *Controller) ListOperationPlans(c *gin.Context) {
	var q assessment.OperationPlanQuery
	if _, err := form_validator.BindQueryAndValid(c, &q); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	// 如果指定了目标ID，查询该目标下的运营考核计划
	if q.TargetID != nil {
		plans, err := ctl.OperationPlanDomain.ListPlansByTargetID(c, *q.TargetID)
		if err != nil {
			ginx.ResBadRequestJson(c, err)
			return
		}
		ginx.ResOKJson(c, gin.H{"list": plans, "total": len(plans)})
		return
	}

	ginx.ResBadRequestJson(c, fmt.Errorf("target_id is required"))
}

// 新增：获取运营考核概览
func (ctl *Controller) GetOperationOverview(c *gin.Context) {
	fmt.Printf("=== Controller: GetOperationOverview 开始执行 ===\n")

	// 1. 解析查询参数
	var q assessment.OperationOverviewQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		fmt.Printf("Controller: 参数绑定失败: %v\n", err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	// 2. 调用Domain层
	resp, err := ctl.OperationTargetDomain.GetOperationOverview(c.Request.Context(), q)
	if err != nil {
		fmt.Printf("Controller: 获取运营考核概览失败: %v\n", err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	// 3. 处理空数据情况
	if resp == nil {
		fmt.Printf("Controller: 未找到运营考核概览数据，返回空对象\n")
		ginx.ResOKJson(c, gin.H{})
		return
	}

	fmt.Printf("Controller: 成功获取运营考核概览数据\n")
	fmt.Printf("=== Controller: GetOperationOverview 执行完成 ===\n")
	ginx.ResOKJson(c, resp)
}

// 获取运营考核计划详情
func (ctl *Controller) GetOperationPlanDetail(c *gin.Context) {
	var p idUri
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	resp, err := ctl.OperationPlanDomain.GetDetail(c, p.ID)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	if resp == nil {
		ginx.ResOKJson(c, gin.H{})
		return
	}

	ginx.ResOKJson(c, resp)
}
