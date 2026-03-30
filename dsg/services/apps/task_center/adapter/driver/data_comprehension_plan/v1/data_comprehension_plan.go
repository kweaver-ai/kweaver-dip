package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_comprehension_plan"
	_ "github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type ComprehensionPlanService struct {
	service data_comprehension_plan.DataComprehensionPlan
}

func NewUserService(d data_comprehension_plan.DataComprehensionPlan) *ComprehensionPlanService {
	return &ComprehensionPlanService{
		service: d,
	}
}

// Create  godoc
//
//	@Description	创建数据理解计划
//	@Tags			数据理解计划
//	@Summary		创建数据理解计划
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string												true	"token"
//	@Param			body			body		data_comprehension_plan.ComprehensionPlanCreateReq	true	"请求参数"
//	@Success		200				{object}	data_comprehension_plan.IDResp						"成功响应参数"
//	@Failure		400				{object}	rest.HttpError										"失败响应参数"
//	@Router			/api/task-center/v1/data/comprehension-plan [POST]
func (d *ComprehensionPlanService) Create(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var comprehensionPlanReq data_comprehension_plan.ComprehensionPlanCreateReq
	valid, errs := form_validator.BindJsonAndValid(c, &comprehensionPlanReq)
	if !valid {
		c.Writer.WriteHeader(400)
		_, ok := errs.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.TaskInvalidParameterJson))
		}
		return
	}
	info, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	resp, err := d.service.Create(ctx, &comprehensionPlanReq, info.ID, info.Name)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Delete  godoc
//
//	@Description	删除数据理解计划
//	@Tags			数据理解计划
//	@Summary		删除数据理解计划
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header	string	true	"token"
//	@Param			id				path	string	true	"计划ID，uuid"
//	@Success		200				"成功响应参数"
//	@Failure		400				{object}	rest.HttpError	"失败响应参数"
//	@Router			/api/task-center/v1/data/comprehension-plan/{id}  [Delete]
func (d *ComprehensionPlanService) Delete(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	taskPathModel := data_comprehension_plan.BriefComprehensionPlanPathModel{}
	valid, errs := form_validator.BindUriAndValid(c, &taskPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}

	err = d.service.Delete(ctx, taskPathModel.Id)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, nil)
}

// Update  godoc
//
//	@Description	修改数据理解计划
//	@Tags			数据理解计划
//	@Summary		修改数据理解计划
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string												true	"token"
//	@Param			id				path		string												true	"计划ID，uuid"
//	@Param			body			body		data_comprehension_plan.ComprehensionPlanUpdateReq	true	"请求参数"
//	@Success		200				{object}	data_comprehension_plan.IDResp						"成功响应参数"
//	@Failure		400				{object}	rest.HttpError										"失败响应参数"
//	@Router			/api/task-center/v1/data/comprehension-plan/{id}  [PUT]
func (d *ComprehensionPlanService) Update(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	taskPathModel := data_comprehension_plan.BriefComprehensionPlanPathModel{}
	valid, errs := form_validator.BindUriAndValid(c, &taskPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}

	var comprehensionPlanReq data_comprehension_plan.ComprehensionPlanUpdateReq
	valid, errs = form_validator.BindJsonAndValid(c, &comprehensionPlanReq)
	if !valid {
		c.Writer.WriteHeader(400)
		_, ok := errs.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.TaskInvalidParameterJson))
		}
		return
	}
	info, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	resp, err := d.service.Update(ctx, &comprehensionPlanReq, taskPathModel.Id, info.ID, info.Name)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetById  godoc
//
//	@Description	查看数据理解计划详情
//	@Tags			数据理解计划
//	@Summary		查看数据理解计划详情
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string												true	"token"
//	@Param			id				path		string												true	"计划ID，uuid"
//	@Success		200				{object}	data_comprehension_plan.ComprehensionPlanGetByIdReq	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError										"失败响应参数"
//	@Router			/api/task-center/v1/data/comprehension-plan/{id}  [GET]
func (d *ComprehensionPlanService) GetById(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	taskPathModel := data_comprehension_plan.BriefComprehensionPlanPathModel{}
	valid, errs := form_validator.BindUriAndValid(c, &taskPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}

	resp, err := d.service.GetById(ctx, taskPathModel.Id)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// CheckNameRepeat godoc
//
//	@Description	检查理解计划是否同名
//	@Tags			数据理解计划
//	@Summary		检查理解计划是否同名
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string													true	"token"
//	@Param			id				query		string													true	"计划ID，uuid"
//	@Param			name			query		string													true	"计划名称"
//	@Success		200				{object}	data_comprehension_plan.ComprehensionPlanNameRepeatReq	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError											"失败响应参数"
//	@Router			/api/task-center/v1/data/comprehension-plan/name-check  [GET]
func (d *ComprehensionPlanService) CheckNameRepeat(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req data_comprehension_plan.ComprehensionPlanNameRepeatReq
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.ProjectInvalidParameter, errs))
		return
	}

	if err := d.service.CheckNameRepeat(ctx, &req); err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, response.CheckRepeatResp{Name: req.Name, Repeat: false})
}

// List  godoc
//
//	@Description	查看数据理解计划列表
//	@Tags			数据理解计划
//	@Summary		查看数据理解计划列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string												true	"token"
//	@Param			_				query		data_comprehension_plan.ComprehensionPlanQueryParam	true	"请求参数"
//	@Success		200				"成功响应参数"
//	@Failure		400				{object}	rest.HttpError
//	@Router			/api/task-center/v1/data/comprehension-plan  [GET]
func (d *ComprehensionPlanService) List(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req data_comprehension_plan.ComprehensionPlanQueryParam
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.ProjectInvalidParameter, errs))
		return
	}
	// if !form_validator.CheckKeyWord(&req.Name) {
	// 	pageResult := response.PageResult{
	// 		Limit:      int(req.Limit),
	// 		Offset:     int(req.Offset),
	// 		TotalCount: 0,
	// 		Entries:    []string{},
	// 	}
	// 	ginx.ResOKJson(c, pageResult)
	// 	return
	// }
	pageResult, err := d.service.List(ctx, &req)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, pageResult)
}

// Cancel  godoc
//
//	@Description	撤回数据理解计划审核
//	@Tags			数据理解计划
//	@Summary		撤回数据理解计划审核
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header	string	true	"token"
//	@Param			id				path	string	true	"计划ID，uuid"
//	@Success		200				"成功响应参数"
//	@Failure		400				{object}	rest.HttpError	"失败响应参数"
//	@Router			/api/task-center/v1/data/comprehension-plan/:id/audit/cancel  [PUT]
func (d *ComprehensionPlanService) Cancel(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	taskPathModel := data_comprehension_plan.BriefComprehensionPlanPathModel{}
	valid, errs := form_validator.BindUriAndValid(c, &taskPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}

	err = d.service.Cancel(ctx, taskPathModel.Id)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, nil)
}

// AuditList  godoc
//
//	@Description	查看数据理解计划审核列表
//	@Tags			数据理解计划
//	@Summary		查看数据理解计划审核列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string													true	"token"
//	@Param			_				query		data_comprehension_plan.AuditListGetReq					true	"请求参数"
//	@Success		200					"成功响应参数"
//	@Failure		400				{object}	rest.HttpError
//	@Router			/data/comprehension-plan/audit [GET]
func (d *ComprehensionPlanService) AuditList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req data_comprehension_plan.AuditListGetReq
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.ProjectInvalidParameter, errs))
		return
	}
	pageResult, err := d.service.AuditList(ctx, &req)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, pageResult)
}

// UpdateStatus  修改数据理解计划状态
//
//	@Description	修改数据理解计划状态
//	@Tags			数据理解计划
//	@Summary		修改数据理解计划状态
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string														true	"token"
//	@Param			id				path		string														true	"工单id"
//	@Param			_				body		data_comprehension_plan.ComprehensionPlanUpdateStatusReq	true	"请求参数"
//	@Success		200				{object}	data_comprehension_plan.IDResp								"成功响应参数"
//	@Failure		400				{object}	rest.HttpError												"失败响应参数"
//	@Router			/data/comprehension-plan/{id}/status  [PUT]
func (d *ComprehensionPlanService) UpdateStatus(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	taskPathModel := data_comprehension_plan.BriefComprehensionPlanPathModel{}
	valid, errs := form_validator.BindUriAndValid(c, &taskPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}

	var comprehensionPlanUpdateReq data_comprehension_plan.ComprehensionPlanUpdateStatusReq
	valid, errs = form_validator.BindJsonAndValid(c, &comprehensionPlanUpdateReq)
	if !valid {
		c.Writer.WriteHeader(400)
		_, ok := errs.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.WorkOrderInvalidParameterJson))
		}
		return
	}
	info, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	resp, err := d.service.UpdateStatus(ctx, taskPathModel.Id, &comprehensionPlanUpdateReq, info.ID)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
