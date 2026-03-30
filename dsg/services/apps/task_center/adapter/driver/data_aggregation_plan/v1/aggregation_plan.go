package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_aggregation_plan"
	_ "github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type AggregationPlanService struct {
	service data_aggregation_plan.DataAggregationPlan
}

func NewUserService(d data_aggregation_plan.DataAggregationPlan) *AggregationPlanService {
	return &AggregationPlanService{
		service: d,
	}
}

// Create  godoc
//
//	@Description	创建数据归集计划
//	@Tags			数据归集计划
//	@Summary		创建数据归集计划
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string											true	"token"
//	@Param			body			body		data_aggregation_plan.AggregationPlanCreateReq	true	"请求参数"
//	@Success		200				{object}	data_aggregation_plan.IDResp					"成功响应参数"
//	@Failure		400				{object}	rest.HttpError									"失败响应参数"
//	@Router			/api/task-center/v1/data/aggregation-plan [POST]
func (d *AggregationPlanService) Create(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var aggregationPlanReq data_aggregation_plan.AggregationPlanCreateReq
	valid, errs := form_validator.BindJsonAndValid(c, &aggregationPlanReq)
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
	resp, err := d.service.Create(ctx, &aggregationPlanReq, info.ID, info.Name)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Delete  godoc
//
//	@Description	删除数据归集计划
//	@Tags			数据归集计划
//	@Summary		删除数据归集计划
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header	string	true	"token"
//	@Param			id				path	string	true	"计划ID，uuid"
//	@Success		200				"成功响应参数"
//	@Failure		400				{object}	rest.HttpError	"失败响应参数"
//	@Router			/api/task-center/v1/data/aggregation-plan/{id}  [Delete]
func (d *AggregationPlanService) Delete(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	taskPathModel := data_aggregation_plan.BriefAggregationPlanPathModel{}
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
//	@Description	修改数据归集计划
//	@Tags			数据归集计划
//	@Summary		修改数据归集计划
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string											true	"token"
//	@Param			id				path		string											true	"计划ID，uuid"
//	@Param			body			body		data_aggregation_plan.AggregationPlanUpdateReq	true	"请求参数"
//	@Success		200				{object}	data_aggregation_plan.IDResp					"成功响应参数"
//	@Failure		400				{object}	rest.HttpError									"失败响应参数"
//	@Router			/api/task-center/v1/data/aggregation-plan/{id}  [PUT]
func (d *AggregationPlanService) Update(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	taskPathModel := data_aggregation_plan.BriefAggregationPlanPathModel{}
	valid, errs := form_validator.BindUriAndValid(c, &taskPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}

	var aggregationPlanReq data_aggregation_plan.AggregationPlanUpdateReq
	valid, errs = form_validator.BindJsonAndValid(c, &aggregationPlanReq)

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
	resp, err := d.service.Update(ctx, &aggregationPlanReq, taskPathModel.Id, info.ID, info.Name)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetById  godoc
//
//	@Description	查看数据归集计划详情
//	@Tags			数据归集计划
//	@Summary		查看数据归集计划详情
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string											true	"token"
//	@Param			id				path		string											true	"计划ID，uuid"
//	@Success		200				{object}	data_aggregation_plan.AggregationPlanGetByIdReq	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError									"失败响应参数"
//	@Router			/api/task-center/v1/data/aggregation-plan/{id}  [GET]
func (d *AggregationPlanService) GetById(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	taskPathModel := data_aggregation_plan.BriefAggregationPlanPathModel{}
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
//	@Description	检查数据归集计划是否同名
//	@Tags			数据归集计划
//	@Summary		检查数据归集计划是否同名
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string												true	"token"
//	@Param			id				query		string												true	"计划ID，uuid"
//	@Param			name			query		string												true	"计划名称"
//	@Success		200				{object}	data_aggregation_plan.AggregationPlanNameRepeatReq	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError										"失败响应参数"
//	@Router			/api/task-center/v1/data/aggregation-plan/name-check  [GET]
func (d *AggregationPlanService) CheckNameRepeat(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req data_aggregation_plan.AggregationPlanNameRepeatReq
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
//	@Description	查看数据归集计划列表（支持按用户ID过滤，默认显示当前用户相关的计划）
//	@Tags			数据归集计划
//	@Summary		查看数据归集计划列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string											true	"token"
//	@Param			_				query		data_aggregation_plan.AggregationPlanQueryParam	true	"请求参数"
//	@Success		200			"成功响应参数"
//	@Failure		400				{object}	rest.HttpError
//	@Router			/api/task-center/v1/data/aggregation-plan  [GET]
func (d *AggregationPlanService) List(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req data_aggregation_plan.AggregationPlanQueryParam
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
//	@Description	撤回数据归集计划审核
//	@Tags			数据归集计划
//	@Summary		撤回数据归集计划审核
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header	string	true	"token"
//	@Param			id				path	string	true	"计划ID，uuid"
//	@Success		200				"成功响应参数"
//	@Failure		400				{object}	rest.HttpError	"失败响应参数"
//	@Router			/api/task-center/v1/data/aggregation-plan/:id/audit/cancel  [PUT]
func (d *AggregationPlanService) Cancel(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	taskPathModel := data_aggregation_plan.BriefAggregationPlanPathModel{}
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
//	@Description	查看数据归集计划审核列表
//	@Tags			数据归集计划
//	@Summary		查看数据归集计划审核列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string												true	"token"
//	@Param			_				query		data_aggregation_plan.AuditListGetReq				true	"请求参数"
//	@Success		200				"成功响应参数"
//	@Failure		400				{object}	rest.HttpError
//	@Router			/api/task-center/v1/data/aggregation-plan/audit [GET]
func (d *AggregationPlanService) AuditList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req data_aggregation_plan.AuditListGetReq
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

// UpdateStatus  修改数据理解计划状态
//
//	@Description	修改数据理解计划状态
//	@Tags			数据理解计划
//	@Summary		修改数据理解计划状态
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string													true	"token"
//	@Param			id				path		string													true	"工单id"
//	@Param			_				body		data_aggregation_plan.ComprehensionPlanUpdateStatusReq	true	"请求参数"
//	@Success		200				{object}	data_aggregation_plan.IDResp							"成功响应参数"
//	@Failure		400				{object}	rest.HttpError											"失败响应参数"
//	@Router			/data/comprehension-plan/{id}/status  [PUT]
func (d *AggregationPlanService) UpdateStatus(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	taskPathModel := data_aggregation_plan.BriefAggregationPlanPathModel{}
	valid, errs := form_validator.BindUriAndValid(c, &taskPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}

	var aggregationPlanUpdateReq data_aggregation_plan.ComprehensionPlanUpdateStatusReq
	valid, errs = form_validator.BindJsonAndValid(c, &aggregationPlanUpdateReq)
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
	resp, err := d.service.UpdateStatus(ctx, taskPathModel.Id, &aggregationPlanUpdateReq, info.ID)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
