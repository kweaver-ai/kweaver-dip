package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_quality"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type DataQualityService struct {
	service data_quality.DataQualityUseCase
}

func NewUserService(s data_quality.DataQualityUseCase) *DataQualityService {
	return &DataQualityService{
		service: s,
	}
}

// ReportList  数据质量报告列表
//
//	@Description	数据质量报告列表
//	@Tags			数据质量工单
//	@Summary		数据质量报告列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string						true	"token"
//	@Param			_				query		data_quality.ReportListReq	true	"请求参数"
//	@Success		200				"成功响应参数"
//	@Failure		400				{object}	rest.HttpError
//	@Router			/data-quality/reports  [GET]
func (s *DataQualityService) ReportList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	var req data_quality.ReportListReq
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		return
	}
	pageResult, err := s.service.ReportList(ctx, &req)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, pageResult)
}

// Improvement  数据质量工单整改内容对比
//
//	@Description	数据质量工单整改内容对比
//	@Tags			数据质量工单
//	@Summary		数据质量工单整改内容对比
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string							true	"token"
//	@Param			_				query		data_quality.ImprovementReq		true	"请求参数"
//	@Success		200				{object}	data_quality.ImprovementResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError
//	@Router			/data-quality/improvement  [GET]
func (s *DataQualityService) Improvement(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	var req data_quality.ImprovementReq
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		return
	}
	pageResult, err := s.service.Improvement(ctx, &req)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, pageResult)
}

// DataQualityStatus  数据质量工单整改状态
//
//	@Description	数据质量工单整改状态
//	@Tags			数据质量工单
//	@Summary		数据质量工单整改状态
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string								true	"token"
//	@Param			_				query		data_quality.DataQualityStatusReq	true	"请求参数"
//	@Success		200				{object}	data_quality.DataQualityStatusResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError
//	@Router			/data-quality/status  [GET]
func (s *DataQualityService) DataQualityStatus(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	var req data_quality.DataQualityStatusReq
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		return
	}
	pageResult, err := s.service.QueryStatus(ctx, &req)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, pageResult)
}

// ReceiveQualityReport 接收质量报告
// @Description 接收质量报告接口
// @Tags 数据质量工单
// @Summary 接收质量报告
// @Accept application/json
// @Produce application/json
// @Param Authorization header string true "token"
// @Param _ body data_quality.ReceiveQualityReportReq true "质量报告信息"
// @Failure 400 {object} rest.HttpError
// @Router /data-quality/reports [POST]
func (s *DataQualityService) ReceiveQualityReport(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	var req data_quality.ReceiveQualityReportReq
	valid, errs := form_validator.BindJsonAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		return
	}
	err = s.service.ReceiveQualityReport(ctx, &req)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, nil)
}
