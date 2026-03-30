package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_research_report"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type DataResearchReportService struct {
	service data_research_report.DataResearchReport
}

func NewUserService(d data_research_report.DataResearchReport) *DataResearchReportService {
	return &DataResearchReportService{
		service: d,
	}
}

// Create  godoc
//
//	@Description	创建数据调研报告
//	@Tags			数据调研报告
//	@Summary		创建数据调研报告
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string												true	"token"
//	@Param			body			body		data_research_report.DataResearchReportCreateParam	true	"请求参数"
//	@Success		200				{object}	data_research_report.IDResp							"成功响应参数"
//	@Failure		400				{object}	rest.HttpError										"失败响应参数"
//	@Router			/api/task-center/v1/data/research-report [POST]
func (d *DataResearchReportService) Create(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var dataResearchReportReq data_research_report.DataResearchReportCreateParam
	valid, errs := form_validator.BindJsonAndValid(c, &dataResearchReportReq)
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
	resp, err := d.service.Create(ctx, &dataResearchReportReq, info.ID, info.Name)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Delete  godoc
//
//	@Description	删除数据调研报告
//	@Tags			数据调研报告
//	@Summary		删除数据调研报告
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header	string	true	"token"
//	@Param			id				path	string	true	"报告ID，uuid"
//	@Success		200				"成功响应参数"
//	@Failure		400				{object}	rest.HttpError	"失败响应参数"
//	@Router			/api/task-center/v1/data/research-report/{id}  [Delete]
func (d *DataResearchReportService) Delete(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	taskPathModel := data_research_report.BriefDataResearchReportPathModel{}
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
//	@Description	修改数据调研报告
//	@Tags			数据调研报告
//	@Summary		修改数据调研报告
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string												true	"token"
//	@Param			id				path		string												true	"报告ID，uuid"
//	@Param			body			body		data_research_report.DataResearchReportUpdateReq	true	"请求参数"
//	@Success		200				{object}	data_research_report.IDResp							"成功响应参数"
//	@Failure		400				{object}	rest.HttpError										"失败响应参数"
//	@Router			/api/task-center/v1/data/research-report/{id}  [PUT]
func (d *DataResearchReportService) Update(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	taskPathModel := data_research_report.BriefDataResearchReportPathModel{}
	valid, errs := form_validator.BindUriAndValid(c, &taskPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}

	var dataResearchReportReq data_research_report.DataResearchReportUpdateReq
	valid, errs = form_validator.BindJsonAndValid(c, &dataResearchReportReq)

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
	resp, err := d.service.Update(ctx, &dataResearchReportReq, taskPathModel.Id, info.ID, info.Name)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetById  godoc
//
//	@Description	查看数据调研报告详情
//	@Tags			数据调研报告
//	@Summary		查看数据调研报告详情
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string												true	"token"
//	@Param			id				path		string												true	"报告ID，uuid"
//	@Success		200				{object}	data_research_report.DataResearchReportDetailResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError										"失败响应参数"
//	@Router			/api/task-center/v1/data/research-report/{id}  [GET]
func (d *DataResearchReportService) GetById(c *gin.Context) {
	var err error
	var resp *data_research_report.DataResearchReportDetailResp
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	taskPathModel := data_research_report.BriefDataResearchReportPathModel{}
	valid, errs := form_validator.BindUriAndValid(c, &taskPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}

	resp, err = d.service.GetById(ctx, taskPathModel.Id)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetById  godoc
//
//	@Description	查看数据调研报告详情(根据工单id)
//	@Tags			数据调研报告
//	@Summary		查看数据调研报告详情(根据工单id)
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string												true	"token"
//	@Param			id				path		string												true	"工单ID，uuid"
//	@Success		200				{object}	data_research_report.DataResearchReportDetailResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError										"失败响应参数"
//	@Router			/api/task-center/v1/data/research-report/work-order/{id}  [GET]
func (d *DataResearchReportService) GetByWorkOrderId(c *gin.Context) {
	var err error
	var resp *data_research_report.DataResearchReportDetailResp
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	taskPathModel := data_research_report.BriefDataResearchReportPathModel{}
	valid, errs := form_validator.BindUriAndValid(c, &taskPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}

	resp, err = d.service.GetByWorkOrderId(ctx, taskPathModel.Id)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// CheckNameRepeat godoc
//
//	@Description	检查数据调研报告是否同名
//	@Tags			数据调研报告
//	@Summary		检查数据调研报告是否同名
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string													true	"token"
//	@Param			id				query		string													true	"报告ID，uuid"
//	@Param			name			query		string													true	"报告名称"
//	@Success		200				{object}	data_research_report.DataResearchReportNameRepeatReq	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError											"失败响应参数"
//	@Router			/api/task-center/v1/data/research-report/name-check  [GET]
func (d *DataResearchReportService) CheckNameRepeat(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req data_research_report.DataResearchReportNameRepeatReq
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
//	@Description	查看数据调研报告列表
//	@Tags			数据调研报告
//	@Summary		查看数据调研报告列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string											true	"token"
//	@Param			_				query		data_research_report.ResearchReportQueryParam	true	"请求参数"
//	@Success		200				{object}	data_research_report.DataResearchReportListResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError
//	@Router			/api/task-center/v1/data/research-report  [GET]
func (d *DataResearchReportService) List(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req data_research_report.ResearchReportQueryParam
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.ProjectInvalidParameter, errs))
		return
	}

	pageResult, err := d.service.GetList(ctx, &req)
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
//	@Description	撤回数据调研报告审核
//	@Tags			数据调研报告
//	@Summary		撤回数据调研报告审核
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header	string	true	"token"
//	@Param			id				path	string	true	"报告ID，uuid"
//	@Success		200				"成功响应参数"
//	@Failure		400				{object}	rest.HttpError	"失败响应参数"
//	@Router			/api/task-center/v1/data/research-report/:id/audit/cancel  [PUT]
func (d *DataResearchReportService) Cancel(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	taskPathModel := data_research_report.BriefDataResearchReportPathModel{}
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
//	@Description	查看数据调研报告审核列表
//	@Tags			数据调研报告
//	@Summary		查看数据调研报告审核列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string													true	"token"
//	@Param			_				query		data_research_report.AuditListGetReq					true	"请求参数"
//	@Success		200				{object}	data_research_report.DataResearchReportAuditListResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError
//	@Router			/api/task-center/v1/data/research-report/audit [GET]
func (d *DataResearchReportService) AuditList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req data_research_report.AuditListGetReq
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
