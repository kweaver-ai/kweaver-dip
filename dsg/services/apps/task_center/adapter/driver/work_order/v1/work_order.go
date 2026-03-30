package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/data_aggregation_inventory/v1/validation"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order"
	"github.com/kweaver-ai/idrm-go-common/util/validation/field"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type WorkOrderService struct {
	service work_order.WorkOrderUseCase
}

func NewUserService(s work_order.WorkOrderUseCase) *WorkOrderService {
	return &WorkOrderService{
		service: s,
	}
}

// Create  创建工单
//
//	@Description	创建工单
//	@Tags			工单
//	@Summary		创建工单
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string							true	"token"
//	@Param			_				body		work_order.WorkOrderCreateReq	true	"请求参数"
//	@Success		200				{object}	work_order.IDResp				"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router			/api/task-center/v1/work-order [POST]
func (s *WorkOrderService) Create(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var processingPlanReq work_order.WorkOrderCreateReq
	valid, errs := form_validator.BindJsonAndValid(c, &processingPlanReq)
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
	// TODO: Validation
	if inventory := processingPlanReq.DataAggregationInventory; inventory != nil {
		if allErrs := validation.ValidateAggregatedDataAggregationResources(inventory.Resources, field.NewPath("data_aggregation_inventory.resources")); allErrs != nil {
			ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, form_validator.NewValidErrorsForFieldErrorList(allErrs)))
			return
		}
	}

	resp, err := s.service.Create(ctx, &processingPlanReq, info.ID, info.Name, info.OrgInfos[0].OrgCode)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Update  修改工单
//
//	@Description	修改工单
//	@Tags			工单
//	@Summary		修改工单
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string							true	"token"
//	@Param			id				path		string							true	"工单id"
//	@Param			_				body		work_order.WorkOrderUpdateReq	true	"请求参数"
//	@Success		200				{object}	work_order.IDResp				"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router			/api/task-center/v1/work-order/{id}  [PUT]
func (s *WorkOrderService) Update(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	taskPathModel := work_order.WorkOrderPathReq{}
	valid, errs := form_validator.BindUriAndValid(c, &taskPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		return
	}

	var workOrderUpdateReq work_order.WorkOrderUpdateReq
	valid, errs = form_validator.BindJsonAndValid(c, &workOrderUpdateReq)

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

	// TODO: Validation
	if inventory := workOrderUpdateReq.DataAggregationInventory; inventory != nil {
		if allErrs := validation.ValidateAggregatedDataAggregationResources(inventory.Resources, field.NewPath("data_aggregation_inventory.resources")); allErrs != nil {
			ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, form_validator.NewValidErrorsForFieldErrorList(allErrs)))
			return
		}
	}

	resp, err := s.service.Update(ctx, taskPathModel.Id, &workOrderUpdateReq, info.ID)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// UpdateStatus  修改工单状态
//
//	@Description	修改工单状态
//	@Tags			工单
//	@Summary		修改工单状态
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string								true	"token"
//	@Param			id				path		string								true	"工单id"
//	@Param			_				body		work_order.WorkOrderUpdateStatusReq	true	"请求参数"
//	@Success		200				{object}	work_order.IDResp					"成功响应参数"
//	@Failure		400				{object}	rest.HttpError						"失败响应参数"
//	@Router			/api/task-center/v1/work-order/{id}/status  [PUT]
func (s *WorkOrderService) UpdateStatus(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	taskPathModel := work_order.WorkOrderPathReq{}
	valid, errs := form_validator.BindUriAndValid(c, &taskPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		return
	}

	var workOrderUpdateReq work_order.WorkOrderUpdateStatusReq
	valid, errs = form_validator.BindJsonAndValid(c, &workOrderUpdateReq)

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
	resp, err := s.service.UpdateStatus(ctx, taskPathModel.Id, &workOrderUpdateReq, info.ID, info.Name)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// CheckNameRepeat 检查工单是否同名
//
//	@Description	检查工单是否同名
//	@Tags			工单
//	@Summary		检查工单是否同名
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string								true	"token"
//	@Param			_				query		work_order.WorkOrderNameRepeatReq	true	"请求参数"
//	@Success		200				bool		true								"成功响应参数"
//	@Failure		400				{object}	rest.HttpError						"失败响应参数"
//	@Router			/api/task-center/v1/work-order/name-check  [GET]
func (s *WorkOrderService) CheckNameRepeat(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req work_order.WorkOrderNameRepeatReq
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		return
	}

	resp, err := s.service.CheckNameRepeat(ctx, &req)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// List  查看工单列表
//
//	@Description	查看工单列表
//	@Tags			工单
//	@Summary		查看工单列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string							true	"token"
//	@Param			_				query		work_order.WorkOrderListReq		true	"请求参数"
//	@Success		200				{object}	work_order.WorkOrderListResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError
//	@Router			/api/task-center/v1/work-order  [GET]
func (s *WorkOrderService) List(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req work_order.WorkOrderListReq
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		return
	}
	pageResult, err := s.service.List(ctx, &req)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, pageResult)
}

// GetById  查看工单详情
//
//	@Description	查看工单详情
//	@Tags			工单
//	@Summary		查看工单详情
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string							true	"token"
//	@Param			id				path		string							true	"工单id"
//	@Success		200				{object}	work_order.WorkOrderDetailResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router			/api/task-center/v1/work-order/{id}  [GET]
func (s *WorkOrderService) GetById(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	taskPathModel := work_order.WorkOrderPathReq{}
	valid, errs := form_validator.BindUriAndValid(c, &taskPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		return
	}

	resp, err := s.service.GetById(ctx, taskPathModel.Id)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Delete  删除工单
//
//	@Description	删除工单
//	@Tags			工单
//	@Summary		删除工单
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header	string	true	"token"
//	@Param			id				path	string	true	"工单id"
//	@Success		200				"成功响应参数"
//	@Failure		400				{object}	rest.HttpError	"失败响应参数"
//	@Router			/work-order/{id}  [Delete]
func (s *WorkOrderService) Delete(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	taskPathModel := work_order.WorkOrderPathReq{}
	valid, errs := form_validator.BindUriAndValid(c, &taskPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		return
	}

	err = s.service.Delete(ctx, taskPathModel.Id)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, nil)
}

// ListCreatedByMe 查看工单列表，创建人是我
func (s *WorkOrderService) ListCreatedByMe(c *gin.Context) {
	opts := work_order.WorkOrderListCreatedByMeOptions{}
	query := c.Request.URL.Query()
	if err := work_order.Convert_url_Values_To_WorkOrderListCreatedByMeOptions(&query, &opts); err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	// Completion
	work_order.CompleteWorkOrderListCreatedByMeOptions(&opts)

	// TODO: Validation

	entries, count, err := s.service.ListCreatedByMe(c, opts)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}
	ginx.ResList(c, entries, count)
}

// ListMyResponsibilities 查看工单列表，责任人是我。如果配置了工单审核，则排除未
// 通过审核的工单。
func (s *WorkOrderService) ListMyResponsibilities(c *gin.Context) {
	opts := work_order.WorkOrderListMyResponsibilitiesOptions{}
	query := c.Request.URL.Query()
	if err := work_order.Convert_url_Values_To_WorkOrderListMyResponsibilitiesOptions(&query, &opts); err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	// Completion
	work_order.CompleteWorkOrderListMyResponsibilitiesOptions(&opts)

	// TODO: Validation

	entries, count, err := s.service.ListMyResponsibilities(c, opts)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}
	ginx.ResList(c, entries, count)
}

// AcceptanceList  查看工单签收列表
//
//	@Description	查看工单签收列表
//	@Tags			工单签收
//	@Summary		查看工单签收列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string									true	"token"
//	@Param			_				query		work_order.WorkOrderAcceptanceListReq	true	"请求参数"
//	@Success		200				{object}	work_order.WorkOrderAcceptanceListResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError
//	@Router			/work-order/acceptance  [GET]
func (s *WorkOrderService) AcceptanceList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req work_order.WorkOrderAcceptanceListReq
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		return
	}
	pageResult, err := s.service.AcceptanceList(ctx, &req)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, pageResult)
}

// ProcessingList  查看工单处理列表
//
//	@Description	查看工单处理列表
//	@Tags			工单处理
//	@Summary		查看工单处理列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string									true	"token"
//	@Param			_				query		work_order.WorkOrderProcessingListReq	true	"请求参数"
//	@Success		200				{object}	work_order.WorkOrderProcessingListResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError
//	@Router			/work-order/processing  [GET]
func (s *WorkOrderService) ProcessingList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req work_order.WorkOrderProcessingListReq
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		return
	}
	info, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	pageResult, err := s.service.ProcessingList(ctx, &req, info.ID)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, pageResult)
}

// Cancel  撤回工单审核
//
//	@Description	撤回工单审核
//	@Tags			工单
//	@Summary		撤回工单审核
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header	string	true	"token"
//	@Param			id				path	string	true	"工单ID，uuid"
//	@Success		200				"成功响应参数"
//	@Failure		400				{object}	rest.HttpError	"失败响应参数"
//	@Router			/work-order/:id/audit/cancel  [PUT]
func (s *WorkOrderService) Cancel(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	taskPathModel := work_order.WorkOrderPathReq{}
	valid, errs := form_validator.BindUriAndValid(c, &taskPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		return
	}

	err = s.service.Cancel(ctx, taskPathModel.Id)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, nil)
}

// AuditList  查看工单审核列表
//
//	@Description	查看工单审核列表
//	@Tags			工单
//	@Summary		查看工单审核列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string								true	"token"
//	@Param			_				query		work_order.AuditListGetReq			true	"请求参数"
//	@Success		200				{object}	work_order.WorkOrderAuditListResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError
//	@Router			/work-order/audit [GET]
func (s *WorkOrderService) AuditList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req work_order.AuditListGetReq
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		return
	}
	pageResult, err := s.service.AuditList(ctx, &req)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, pageResult)
}

// GetList  根据来源id或者工单id批量查询工单列表
//
//	@Description	根据来源id或者工单id批量查询工单列表
//	@Tags			工单
//	@Summary		根据来源id或者工单id批量查询工单列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			_				query		work_order.GetListReq	true	"请求参数"
//	@Success		200				{object}	work_order.GetListResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError
//	@Router			/api/task-center/v1/work-order/list [POST]
func (s *WorkOrderService) GetList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req work_order.GetListReq
	valid, errs := form_validator.BindJsonAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		return
	}
	pageResult, err := s.service.GetList(ctx, &req)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, pageResult)
}

// Remind  催办
//
//	@Description	催办
//	@Tags			工单
//	@Summary		催办
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string				true	"token"
//	@Param			id				path		string				true	"工单id"
//	@Success		200				{object}	work_order.IDResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError		"失败响应参数"
//	@Router			/work-order/{id}/remind  [PUT]
func (s *WorkOrderService) Remind(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	workOrderPathModel := work_order.WorkOrderPathReq{}
	valid, errs := form_validator.BindUriAndValid(c, &workOrderPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		return
	}

	resp, err := s.service.Remind(ctx, workOrderPathModel.Id)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Feedback  反馈
//
//	@Description	反馈
//	@Tags			工单
//	@Summary		反馈
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string							true	"token"
//	@Param			id				path		string							true	"工单id"
//	@Param			_				body		work_order.WorkOrderFeedbackReq	true	"请求参数"
//	@Success		200				{object}	work_order.IDResp				"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router			/work-order/{id}/feedback  [PUT]
func (s *WorkOrderService) Feedback(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	workOrderPathModel := work_order.WorkOrderPathReq{}
	valid, errs := form_validator.BindUriAndValid(c, &workOrderPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		return
	}

	var workOrderFeedbackReq work_order.WorkOrderFeedbackReq
	valid, errs = form_validator.BindJsonAndValid(c, &workOrderFeedbackReq)

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
	resp, err := s.service.Feedback(ctx, workOrderPathModel.Id, &workOrderFeedbackReq, info.ID, info.Name)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Reject  驳回工单
//
//	@Description	驳回工单
//	@Tags			工单
//	@Summary		驳回工单
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string							true	"token"
//	@Param			id				path		string							true	"工单id"
//	@Param			_				body		work_order.WorkOrderRejectReq	true	"请求参数"
//	@Success		200				{object}	work_order.IDResp				"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router			/work-order/{id}/reject  [PUT]
func (s *WorkOrderService) Reject(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	workOrderPathModel := work_order.WorkOrderPathReq{}
	valid, errs := form_validator.BindUriAndValid(c, &workOrderPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		return
	}

	var workOrderRejectReq work_order.WorkOrderRejectReq
	valid, errs = form_validator.BindJsonAndValid(c, &workOrderRejectReq)

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
	resp, err := s.service.Reject(ctx, workOrderPathModel.Id, &workOrderRejectReq, info.ID, info.Name)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Sync 同步工单到第三方
//
//	@Description	同步工单到第三方
//	@Tags			工单
//	@Summary		同步工单到第三方
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string							true	"token"
//	@Param			id				path		string							true	"工单id"
//	@Success		200									"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router			/work-order/{id}/sync  [POST]
func (s WorkOrderService) Sync(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	pathReq := &work_order.WorkOrderPathReq{}
	if _, err := form_validator.BindUriAndValid(c, pathReq); err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, err))
		return
	}

	if err := s.service.Sync(ctx, pathReq.Id); err != nil {
		var code int
		switch agerrors.Code(err).GetErrorCode() {
		case errorcode.NonSynchronizedWorkOrderType:
			code = http.StatusUnprocessableEntity
		default:
			code = http.StatusInternalServerError
		}
		ginx.ResErrJsonWithCode(c, code, err)
		return
	}

	ginx.ResOKJson(c, nil)
}

// DataQualityImprovement  查看质量工单整改信息
//
//	@Description	查看质量工单整改信息
//	@Tags			数据质量工单
//	@Summary		查看质量工单整改信息
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string									true	"token"
//	@Success		200				{object}	work_order.DataQualityImprovementResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError
//	@Router			/work-order/data-quality-improvement  [GET]
func (s *WorkOrderService) DataQualityImprovement(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	resp, err := s.service.GetDataQualityImprovement(ctx)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// CheckQualityAuditRepeat 检查质量稽核是否重复
//
//	@Description	检查质量稽核是否重复，根据视图id筛选出关联有已经通过审核但还没完成的质量稽核工单的视图
//	@Tags			工单
//	@Summary		检查质量稽核是否重复
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string									true	"token"
//	@Param			_				body		work_order.CheckQualityAuditRepeatReq	true	"请求参数"
//	@Success		200				{object}	work_order.CheckQualityAuditRepeatResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError							"失败响应参数"
//	@Router			/api/task-center/v1/work-order/quality-audit-check  [POST]
func (s *WorkOrderService) CheckQualityAuditRepeat(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req work_order.CheckQualityAuditRepeatReq
	valid, errs := form_validator.BindJsonAndValid(c, &req)
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
	resp, err := s.service.CheckQualityAuditRepeat(ctx, &req)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// DataFusionPreviewSQL
//
//	@Description	预览融合工单sql
//	@Tags			工单
//	@Summary		预览融合工单sql
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string									true	"token"
//	@Param			_				body		work_order.DataFusionPreviewSQLReq	true	"请求参数"
//	@Success		200				{object}	work_order.DataFusionPreviewSQLResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError							"失败响应参数"
//	@Router			/api/task-center/v1/work-order/fusion-preview-sql  [POST]
func (s *WorkOrderService) DataFusionPreviewSQL(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req work_order.DataFusionPreviewSQLReq
	valid, errs := form_validator.BindJsonAndValid(c, &req)
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
	resp, err := s.service.QueryDataFusionPreviewSQL(ctx, &req)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// List  给质检工单使用的归集工单列表
//
//	@Description	给质检工单使用的归集工单列表
//	@Tags			工单
//	@Summary		给质检工单使用的归集工单列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string							true	"token"
//	@Param			_				query		work_order.AggregationForQualityAuditListReq		true	"请求参数"
//	@Success		200				{object}	work_order.AggregationForQualityAuditListResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError
//	@Router			/api/task-center/v1/work-order/aggregation-for-quality-audit  [GET]
func (s *WorkOrderService) AggregationForQualityAudit(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req work_order.AggregationForQualityAuditListReq
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		return
	}

	pageResult, err := s.service.AggregationForQualityAudit(ctx, &req)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, pageResult)
}

// QualityAuditResource  查看质量检测资源
//
//	@Description	查看质量检测资源
//	@Tags			数据质量工单
//	@Summary		查看质量检测资源
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string									true	"token"
//	@Param			id				path		string							true	"工单id"
//	@Param			_				query		work_order.QualityAuditResourceReq	true	"请求参数"
//	@Success		200				{object}	work_order.QualityAuditResourceResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError
//	@Router			/work-order/{id}/quality-audit-resource  [GET]
func (s *WorkOrderService) QualityAuditResource(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	workOrderPath := work_order.WorkOrderPathReq{}
	valid, errs := form_validator.BindUriAndValid(c, &workOrderPath)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		return
	}
	var req work_order.QualityAuditResourceReq
	valid, errs = form_validator.BindQueryAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		return
	}
	pageResult, err := s.service.QualityAuditResource(ctx, workOrderPath.Id, &req)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, pageResult)
}

// ReExplore  质量检测工单重新发起检测
//
//	@Description	质量检测工单重新发起检测
//	@Tags			工单
//	@Summary		质量检测工单重新发起检测
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string							true	"token"
//	@Param			id				path		string							true	"工单id"
//	@Param			_				body		work_order.ReExploreReq	true	"请求参数"
//	@Success		200				{object}	work_order.IDResp				"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router			/work-order/{id}/re-explore  [POST]
func (s *WorkOrderService) ReExplore(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	taskPathModel := work_order.WorkOrderPathReq{}
	valid, errs := form_validator.BindUriAndValid(c, &taskPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		return
	}

	var workOrderReExploreReq work_order.ReExploreReq
	valid, errs = form_validator.BindJsonAndValid(c, &workOrderReExploreReq)

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

	resp, err := s.service.ReExplore(ctx, taskPathModel.Id, info.ID, info.Name, &workOrderReExploreReq)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
