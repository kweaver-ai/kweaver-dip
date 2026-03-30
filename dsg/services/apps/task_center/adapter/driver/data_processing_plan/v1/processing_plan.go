package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_processing_plan"
	_ "github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type ProcessingPlanService struct {
	service data_processing_plan.DataProcessingPlan
}

func NewUserService(d data_processing_plan.DataProcessingPlan) *ProcessingPlanService {
	return &ProcessingPlanService{
		service: d,
	}
}

// Create  godoc
//
//	@Description	创建数据处理计划
//	@Tags			数据处理计划
//	@Summary		创建数据处理计划
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string											true	"token"
//	@Param			body			body		data_processing_plan.ProcessingPlanCreateReq	true	"请求参数"
//	@Success		200				{object}	data_processing_plan.IDResp						"成功响应参数"
//	@Failure		400				{object}	rest.HttpError									"失败响应参数"
//	@Router			/api/task-center/v1/processing-plan [POST]
func (d *ProcessingPlanService) Create(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var processingPlanReq data_processing_plan.ProcessingPlanCreateReq
	valid, errs := form_validator.BindJsonAndValid(c, &processingPlanReq)
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
	resp, err := d.service.Create(ctx, &processingPlanReq, info.ID, info.Name)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Delete  godoc
//
//	@Description	删除数据处理计划
//	@Tags			数据处理计划
//	@Summary		删除数据处理计划
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header	string	true	"token"
//	@Param			id				path	string	true	"计划ID，uuid"
//	@Success		200				"成功响应参数"
//	@Failure		400				{object}	rest.HttpError	"失败响应参数"
//	@Router			/api/task-center/v1/data/processing-plan/{id}  [Delete]
func (d *ProcessingPlanService) Delete(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	taskPathModel := data_processing_plan.BriefProcessingPlanPathModel{}
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
//	@Description	修改数据处理计划
//	@Tags			数据处理计划
//	@Summary		修改数据处理计划
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string											true	"token"
//	@Param			id				path		string											true	"计划ID，uuid"
//	@Param			body			body		data_processing_plan.ProcessingPlanUpdateReq	true	"请求参数"
//	@Success		200				{object}	data_processing_plan.IDResp						"成功响应参数"
//	@Failure		400				{object}	rest.HttpError									"失败响应参数"
//	@Router			/api/task-center/v1/data/processing-plan/{id}  [PUT]
func (d *ProcessingPlanService) Update(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	taskPathModel := data_processing_plan.BriefProcessingPlanPathModel{}
	valid, errs := form_validator.BindUriAndValid(c, &taskPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}

	var processingPlanReq data_processing_plan.ProcessingPlanUpdateReq
	valid, errs = form_validator.BindJsonAndValid(c, &processingPlanReq)

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
	resp, err := d.service.Update(ctx, &processingPlanReq, taskPathModel.Id, info.ID, info.Name)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetById  godoc
//
//	@Description	查看数据处理计划详情
//	@Tags			数据处理计划
//	@Summary		查看数据处理计划详情
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string											true	"token"
//	@Param			id				path		string											true	"计划ID，uuid"
//	@Success		200				{object}	data_processing_plan.ProcessingPlanGetByIdReq	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError									"失败响应参数"
//	@Router			/api/task-center/v1/data/processing-plan/{id}  [GET]
func (d *ProcessingPlanService) GetById(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	taskPathModel := data_processing_plan.BriefProcessingPlanPathModel{}
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
//	@Description	检查数据处理计划是否同名
//	@Tags			数据处理计划
//	@Summary		检查数据处理计划是否同名
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string												true	"token"
//	@Param			id				query		string												true	"计划ID，uuid"
//	@Param			name			query		string												true	"计划名称"
//	@Success		200				{object}	data_processing_plan.ProcessingPlanNameRepeatReq	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError										"失败响应参数"
//	@Router			/api/task-center/v1/data/processing-plan/name-check  [GET]
func (d *ProcessingPlanService) CheckNameRepeat(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req data_processing_plan.ProcessingPlanNameRepeatReq
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
//	@Description	查看数据处理计划列表
//	@Tags			数据处理计划
//	@Summary		查看数据处理计划列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string											true	"token"
//	@Param			_				query		data_processing_plan.ProcessingPlanQueryParam	true	"请求参数"
//	@Success		200				"成功响应参数"
//	@Failure		400				{object}	rest.HttpError
//	@Router			/api/task-center/v1/data/processing-plan  [GET]
func (d *ProcessingPlanService) List(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req data_processing_plan.ProcessingPlanQueryParam
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
//	@Description	撤回数据处理计划审核
//	@Tags			数据处理计划
//	@Summary		撤回数据处理计划审核
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header	string	true	"token"
//	@Param			id				path	string	true	"计划ID，uuid"
//	@Success		200				"成功响应参数"
//	@Failure		400				{object}	rest.HttpError	"失败响应参数"
//	@Router			/api/task-center/v1/data/processing-plan/:id/audit/cancel  [PUT]
func (d *ProcessingPlanService) Cancel(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	taskPathModel := data_processing_plan.BriefProcessingPlanPathModel{}
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
//	@Description	查看数据处理计划审核列表
//	@Tags			数据处理计划
//	@Summary		查看数据处理计划审核列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string												true	"token"
//	@Param			_				query		data_processing_plan.AuditListGetReq				true	"请求参数"
//	@Success		200				"成功响应参数"
//	@Failure		400				{object}	rest.HttpError
//	@Router			/api/task-center/v1/data/processing-plan/audit [GET]
func (d *ProcessingPlanService) AuditList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req data_processing_plan.AuditListGetReq
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
	pageResult, err := d.service.AuditList(ctx, &req)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, pageResult)
}

// UpdateStatus  修改数据处理计划状态
//
//	@Description	修改数据处理计划状态
//	@Tags			数据理解计划
//	@Summary		修改数据处理计划状态
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string												true	"token"
//	@Param			id				path		string												true	"工单id"
//	@Param			_				body		data_processing_plan.ProcessingPlanUpdateStatusReq	true	"请求参数"
//	@Success		200				{object}	data_processing_plan.IDResp							"成功响应参数"
//	@Failure		400				{object}	rest.HttpError										"失败响应参数"
//	@Router			/data/processing-plan/{id}/status  [PUT]
func (d *ProcessingPlanService) UpdateStatus(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	taskPathModel := data_processing_plan.BriefProcessingPlanPathModel{}
	valid, errs := form_validator.BindUriAndValid(c, &taskPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}

	var processingPlanUpdateReq data_processing_plan.ProcessingPlanUpdateStatusReq
	valid, errs = form_validator.BindJsonAndValid(c, &processingPlanUpdateReq)
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
	resp, err := d.service.UpdateStatus(ctx, taskPathModel.Id, &processingPlanUpdateReq, info.ID)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
