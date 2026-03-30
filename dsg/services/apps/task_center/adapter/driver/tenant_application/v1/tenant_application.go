package v1

import (
	"github.com/gin-gonic/gin"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/tenant_application"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type TenantApplicationService struct {
	service tenant_application.TenantApplication
}

func NewUserService(t tenant_application.TenantApplication) *TenantApplicationService {
	return &TenantApplicationService{
		service: t,
	}
}

// Create  godoc
//
//	@Description	创建租户申请
//	@Tags			租户申请
//	@Summary		创建租户申请
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string												true	"token"
//	@Param			body			body		tenant_application.TenantApplicationCreateReq	    true	"请求参数"
//	@Success		200				{object}	tenant_application.IDResp							"成功响应参数"
//	@Failure		400				{object}	rest.HttpError										"失败响应参数"
//	@Router			/api/task-center/v1/tenant-application [POST]
func (t *TenantApplicationService) Create(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var tenantApplicationReq tenant_application.TenantApplicationCreateReq
	valid, errs := form_validator.BindJsonAndValid(c, &tenantApplicationReq)
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
	resp, err := t.service.Create(ctx, &tenantApplicationReq, info.ID, info.Name)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Delete  godoc
//
//	@Description	删除租户申请
//	@Tags			租户申请
//	@Summary		删除租户申请
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header	string	true	"token"
//	@Param			id				path	string	true	"申请ID，uuid"
//	@Success		200				"成功响应参数"
//	@Failure		400				{object}	rest.HttpError	"失败响应参数"
//	@Router			/api/task-center/v1/tenant-application/{id}  [Delete]
func (d *TenantApplicationService) Delete(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	taskPathModel := tenant_application.BriefTenantApplicationPathModel{}
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
//	@Description	修改租户申请
//	@Tags			租户申请
//	@Summary		修改租户申请
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string												true	"token"
//	@Param			id				path		string												true	"报告ID，uuid"
//	@Param			body			body		tenant_application.TenantApplicationUpdateReq	true	"请求参数"
//	@Success		200				{object}	tenant_application.IDResp							"成功响应参数"
//	@Failure		400				{object}	rest.HttpError										"失败响应参数"
//	@Router			/api/task-center/v1/tenant-application/{id}  [PUT]
func (d *TenantApplicationService) Update(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	taskPathModel := tenant_application.BriefTenantApplicationPathModel{}
	valid, errs := form_validator.BindUriAndValid(c, &taskPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}

	var tenantApplicationReq tenant_application.TenantApplicationUpdateReq
	valid, errs = form_validator.BindJsonAndValid(c, &tenantApplicationReq)

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
	resp, err := d.service.Update(ctx, &tenantApplicationReq, taskPathModel.Id, info.ID, info.Name)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetDetails  godoc
//
//	@Description	查看数据调研报告租户申请详情
//	@Tags			租户申请
//	@Summary		查看租户申请详情
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string												true	"token"
//	@Param			id				path		string												true	"报告ID，uuid"
//	@Success		200				{object}	tenant_application.TenantApplicationDetailResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError										"失败响应参数"
//	@Router			/api/task-center/v1/tenant-application/{id}  [GET]
func (d *TenantApplicationService) GetDetails(c *gin.Context) {
	var err error
	var resp *tenant_application.TenantApplicationDetailResp
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	taskPathModel := tenant_application.BriefTenantApplicationPathModel{}
	valid, errs := form_validator.BindUriAndValid(c, &taskPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}

	resp, err = d.service.GetDetails(ctx, taskPathModel.Id)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// CheckNameRepeat godoc
//
//	@Description	检查租户申请是否同名
//	@Tags			租户申请
//	@Summary		检查租户申请是否同名
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string													true	"token"
//	@Param			id				query		string													true	"报告ID，uuid"
//	@Param			name			query		string													true	"报告名称"
//	@Success		200				{object}	response.CheckRepeatResp	                            "成功响应参数"
//	@Failure		400				{object}	rest.HttpError											"失败响应参数"
//	@Router			/api/task-center/v1/tenant-application/name-check  [GET]
func (d *TenantApplicationService) CheckNameRepeat(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req tenant_application.TenantApplicationNameRepeatReq
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.ProjectInvalidParameter, errs))
		return
	}
	var resp *tenant_application.TenantApplicationNameRepeatReqResp

	if resp, err = d.service.CheckNameRepeatV2(ctx, &req); err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, response.CheckRepeatResp{Name: req.Name, Repeat: resp.IsRepeated})
}

// GetList  godoc
//
//	@Description	查看租户申请列表
//	@Tags			租户申请
//	@Summary		查看租户申请列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string											true	"token"
//	@Param			_				query		tenant_application.TenantApplicationListReq	true	"请求参数"
//	@Success		200				{object}	tenant_application.TenantApplicationListResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError
//	@Router			/api/task-center/v1/tenant-application  [GET]
func (d *TenantApplicationService) GetList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req tenant_application.TenantApplicationListReq
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.ProjectInvalidParameter, errs))
		return
	}

	info, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}

	pageResult, err := d.service.GetList(ctx, &req, info.ID)
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
//	@Description	撤回租户申请审核
//	@Tags			租户申请
//	@Summary		撤回租户申请审核
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header	string	true	"token"
//	@Param			id				path	string	true	"报告ID，uuid"
//	@Success		200				"成功响应参数"
//	@Failure		400				{object}	rest.HttpError	"失败响应参数"
//	@Router			/api/task-center/v1/tenant-application/:id/audit/cancel  [PUT]
func (d *TenantApplicationService) Cancel(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	taskPathModel := tenant_application.BriefTenantApplicationPathModel{}
	valid, errs := form_validator.BindUriAndValid(c, &taskPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}

	var cancelReq tenant_application.TenantApplicationCancelReq
	valid, errs = form_validator.BindJsonAndValid(c, &cancelReq)

	err = d.service.Cancel(ctx, &cancelReq, taskPathModel.Id)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, nil)
}

// AuditList  godoc
//
//	@Description	查看租户申请审核列表
//	@Tags			租户申请
//	@Summary		查看租户申请审核列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string													true	"token"
//	@Param			_				query		tenant_application.AuditListGetReq					true	"请求参数"
//	@Success		200				{object}	tenant_application.TenantApplicationAuditListResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError
//	@Router			/api/task-center/v1/tenant-application/audit [GET]
func (d *TenantApplicationService) AuditList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req tenant_application.AuditListGetReq
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

// CreateTenantApplicationDatabaseAccount  godoc
//
//	@Description	添加租户申请数据库账号
//	@Tags			租户申请
//	@Summary		添加租户申请数据库账号
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string													true	"token"
//	@Param			_				query		tenant_application.AuditListGetReq					true	"请求参数"
//	@Success		200				{object}	tenant_application.TenantApplicationAuditListResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError
//	@Router			/api/task-center/v1/tenant-application/audit [GET]
func (d *TenantApplicationService) CreateTenantApplicationDatabaseAccount(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req tenant_application.AuditListGetReq
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

// GetTenantApplicationDatabaseAccountDetails  godoc
//
//	@Description	查看租户申请数据库账号详情
//	@Tags			租户申请
//	@Summary		查看租户申请数据库账号详情
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string													true	"token"
//	@Param			_				query		tenant_application.AuditListGetReq					true	"请求参数"
//	@Success		200				{object}	tenant_application.TenantApplicationAuditListResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError
//	@Router			/api/task-center/v1/tenant-application/audit [GET]
func (d *TenantApplicationService) GetTenantApplicationDatabaseAccountDetails(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req tenant_application.AuditListGetReq
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

// GetTenantApplicationDatabaseAccountList  godoc
//
//	@Description	查看租户申请数据库账号列表
//	@Tags			租户申请
//	@Summary		查看租户申请数据库账号列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string													true	"token"
//	@Param			_				query		tenant_application.AuditListGetReq					true	"请求参数"
//	@Success		200				{object}	tenant_application.TenantApplicationAuditListResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError
//	@Router			/api/task-center/v1/tenant-application/audit [GET]
func (d *TenantApplicationService) GetTenantApplicationDatabaseAccountList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req tenant_application.AuditListGetReq
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

// UpdateTenantApplicationStatus  godoc
//
//	@Description	修改租户申请状态
//	@Tags			租户申请
//	@Summary		修改租户申请状态
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string													true	"token"
//	@Param			_				query		tenant_application.AuditListGetReq					true	"请求参数"
//	@Success		200				{object}	tenant_application.TenantApplicationAuditListResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError
//	@Router			/api/task-center/v1/tenant-application/audit [PUT]
func (d *TenantApplicationService) UpdateTenantApplicationStatus(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	taskPathModel := tenant_application.BriefTenantApplicationPathModel{}
	valid, errs := form_validator.BindUriAndValid(c, &taskPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}

	var tenantApplicationReq tenant_application.UpdateTenantApplicationStatusReq
	valid, errs = form_validator.BindJsonAndValid(c, &tenantApplicationReq)

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
	resp, err := d.service.UpdateTenantApplicationStatus(ctx, &tenantApplicationReq, taskPathModel.Id, info.ID)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
