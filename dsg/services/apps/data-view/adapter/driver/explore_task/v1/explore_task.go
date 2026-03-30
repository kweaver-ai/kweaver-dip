package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/explore_task"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

var _ = new(response.BoolResp)

type ExploreTaskService struct {
	uc explore_task.ExploreTaskUseCase
}

func NewExploreTaskService(uc explore_task.ExploreTaskUseCase) *ExploreTaskService {
	return &ExploreTaskService{uc: uc}
}

// CreateTask 新建探查任务
// @Description 新建探查任务
// @Tags        探查任务
// @Summary     新建探查任务
// @Accept      json
// @Produce     json
// @Param       Authorization     header   string   true 			"token"
// @Param       _     body       explore_task.CreateTaskReq true 	"请求参数"
// @Success     200       {object} explore_task.CreateTaskResp    	"成功响应参数"
// @Failure     400       {object} rest.HttpError            		"失败响应参数"
// @Router      /explore-task [post]
func (f *ExploreTaskService) CreateTask(c *gin.Context) {
	req := form_validator.Valid[explore_task.CreateTaskReq](c)
	if req == nil {
		return
	}
	res, err := util.TraceA1R2(c, req, f.uc.CreateTask)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// List 获取探查任务列表
// @Description	获取探查任务列表
// @Tags		探查任务
// @Summary		获取探查任务列表
// @Accept		application/json
// @Produce		application/json
// @Param		Authorization	header		string					        true	"token"
// @Param		_				query		explore_task.ListExploreTaskReq	true	"查询参数"
// @Success		200				{object}	explore_task.ListExploreTaskResp	    "成功响应参数"
// @Failure		400				{object}	rest.HttpError			        		"失败响应参数"
// @Router		/explore-task [get]
func (f *ExploreTaskService) List(c *gin.Context) {
	req := form_validator.Valid[explore_task.ListExploreTaskReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.List)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetTask 获取探查任务详情
// @Description	获取探查任务详情
// @Tags		探查任务
// @Summary		获取探查任务详情
// @Accept		application/json
// @Produce		application/json
// @Param		Authorization	header		string	true	"token"
// @Param		id				path      	string	true	"探查任务ID"
// @Success		200				{object}	explore_task.ExploreTaskResp	"成功响应参数"
// @Failure		400				{object}	rest.HttpError			        "失败响应参数"
// @Router		/explore-task/{id} [get]
func (f *ExploreTaskService) GetTask(c *gin.Context) {
	req := form_validator.Valid[explore_task.GetTaskReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetTask)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// CancelTask 取消探查任务
// @Description	取消探查任务
// @Tags		探查任务
// @Summary		取消探查任务
// @Accept		json
// @Produce		json
// @Param		Authorization 	header 		string	true	"token"
// @Param		id     			path      	string	true	"探查任务ID"
// @Param		_     			body      	explore_task.CancelTaskReqBody true 	"请求参数"
// @Success		200				{object}	explore_task.ExploreTaskIDResp	"成功响应参数"
// @Failure		400				{object}	rest.HttpError					"失败响应参数"
// @Router		/explore-task/{id} [put]
func (f *ExploreTaskService) CancelTask(c *gin.Context) {
	req := form_validator.Valid[explore_task.CancelTaskReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.CancelTask)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// DeleteRecord 删除探查记录
// @Description	删除探查记录
// @Tags		探查任务
// @Summary		删除探查记录
// @Accept		json
// @Produce		json
// @Param		Authorization	header		string	true	"token"
// @Param       id				path		string	true	"探查任务ID"
// @Success		200				{object}	explore_task.ExploreTaskIDResp	"成功响应参数"
// @Failure		400				{object}	rest.HttpError			     	"失败响应参数"
// @Router		/explore-task/{id} [delete]
func (f *ExploreTaskService) DeleteRecord(c *gin.Context) {
	req := form_validator.Valid[explore_task.DeleteRecordReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.DeleteRecord)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// CreateRule 新建规则
// @Description 新建规则
// @Tags        探查规则
// @Summary     新建规则
// @Accept      json
// @Produce     json
// @Param       Authorization     header   string   true 			"token"
// @Param       _     body       explore_task.CreateRuleReq true 	"请求参数"
// @Success     201       {object} explore_task.RuleIDResp    	"成功响应参数"
// @Failure     400       {object} rest.HttpError            		"失败响应参数"
// @Router      /explore-config/rule [post]
func (f *ExploreTaskService) CreateRule(c *gin.Context) {
	req := form_validator.Valid[explore_task.CreateRuleReq](c)
	if req == nil {
		return
	}
	res, err := util.TraceA1R2(c, req, f.uc.CreateRule)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	c.JSON(201, res)
}

func (f *ExploreTaskService) GetRuleList(c *gin.Context) {
	req := form_validator.Valid[explore_task.GetRuleListReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetRuleList)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetRule 获取规则详情
// @Description	获取规则详情
// @Tags		探查规则
// @Summary		获取规则详情
// @Accept		application/json
// @Produce		application/json
// @Param		Authorization	header		string	true	"token"
// @Param       id				path		string	true	"规则ID"
// @Success		200				{object}	explore_task.GetRuleResp	"成功响应参数"
// @Failure		400				{object}	rest.HttpError			    "失败响应参数"
// @Router		/explore-config/rule/{id} [get]
func (f *ExploreTaskService) GetRule(c *gin.Context) {
	req := form_validator.Valid[explore_task.GetRuleReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetRule)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// NameRepeat 规则重名校验
// @Description	规则重名校验
// @Tags		探查规则
// @Summary		规则重名校验
// @Accept		application/json
// @Produce		application/json
// @Param		Authorization	header		string	true	"token"
// @Param       _     query       explore_task.NameRepeatReq true 	"请求参数"
// @Success		200				{object}	response.BoolResp "成功响应参数"
// @Failure		400				{object}	rest.HttpError			    "失败响应参数"
// @Router		/explore-config/rule/repeat [get]
func (f *ExploreTaskService) NameRepeat(c *gin.Context) {
	req := form_validator.Valid[explore_task.NameRepeatReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.NameRepeat)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// UpdateRule 修改规则
// @Description	修改规则
// @Tags		探查规则
// @Summary		修改规则
// @Accept		json
// @Produce		json
// @Param		Authorization 	header 		string	true	"token"
// @Param       id				path		string	true	"规则ID"
// @Param		_     			body      	explore_task.UpdateRuleReqBody true 	"请求参数"
// @Success		200				{object}	explore_task.RuleIDResp	"成功响应参数"
// @Failure		400				{object}	rest.HttpError					"失败响应参数"
// @Router		/explore-config/rule/{id} [put]
func (f *ExploreTaskService) UpdateRule(c *gin.Context) {
	req := form_validator.Valid[explore_task.UpdateRuleReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.UpdateRule)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// UpdateRuleStatus 修改规则启用状态
// @Description	修改规则启用状态
// @Tags		探查规则
// @Summary		修改规则启用状态
// @Accept		json
// @Produce		json
// @Param		Authorization 	header 		string	true	"token"
// @Param		_     			body      	explore_task.UpdateRuleStatusReqBody true 	"请求参数"
// @Success		200				{object}	response.BoolResp "成功响应参数"
// @Failure		400				{object}	rest.HttpError					"失败响应参数"
// @Router		/explore-config/rule/status [put]
func (f *ExploreTaskService) UpdateRuleStatus(c *gin.Context) {
	req := form_validator.Valid[explore_task.UpdateRuleStatusReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.UpdateRuleStatus)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// DeleteRule 删除规则
// @Description	删除规则
// @Tags		探查规则
// @Summary		删除规则
// @Accept		json
// @Produce		json
// @Param		Authorization	header		string	true	"token"
// @Param       id				path		string	true	"规则ID"
// @Success		200				{object}	explore_task.RuleIDResp	"成功响应参数"
// @Failure		400				{object}	rest.HttpError			     	"失败响应参数"
// @Router		/explore-config/rule/{id} [delete]
func (f *ExploreTaskService) DeleteRule(c *gin.Context) {
	req := form_validator.Valid[explore_task.DeleteRuleReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.DeleteRule)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetInternalRule 查看内置规则
// @Description	查看内置规则
// @Tags		探查规则
// @Summary		查看内置规则
// @Accept		application/json
// @Produce		application/json
// @Param		Authorization	header		string	true	"token"
// @Success		200				{object}	explore_task.GetInternalRuleResp	"成功响应参数"
// @Failure		400				{object}	rest.HttpError			    "失败响应参数"
// @Router		/explore-config/internal-rule [get]
func (f *ExploreTaskService) GetInternalRule(c *gin.Context) {
	res, err := util.TraceA0R2(c, f.uc.GetInternalRule)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

func (f *ExploreTaskService) CreateWorkOrderTask(c *gin.Context) {
	req := form_validator.Valid[explore_task.CreateWorkOrderTaskReq](c)
	if req == nil {
		return
	}
	res, err := util.TraceA1R2(c, req, f.uc.CreateWorkOrderTask)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

func (f *ExploreTaskService) GetList(c *gin.Context) {
	req := form_validator.Valid[explore_task.ListExploreTaskReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.List)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

func (f *ExploreTaskService) GetWorkOrderExploreProgress(c *gin.Context) {
	req := form_validator.Valid[explore_task.WorkOrderExploreProgressReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetWorkOrderExploreProgress)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}
