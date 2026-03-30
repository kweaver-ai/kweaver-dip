package dwh_auth_request_form

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto/validation"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/domain/dwh_data_auth_request"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"net/http"
)

type Controller struct {
	service dwh_data_auth_request.UseCase
}

func NewAuthController(service dwh_data_auth_request.UseCase) *Controller {
	return &Controller{service: service}
}

// Create 创建数仓数据权限申请
//
//	@Description	创建数仓数据权限申请
//	@Tags			数仓数据权限申请
//	@Summary		创建数仓数据权限申请
//	@Accept			json
//	@Produce		json
//	@Param			_											body		dto.DataAuthRequestArg	true	"请求参数"
//	@Success		200											{object}	dto.IDResp				"成功响应参数"
//	@Failure		400											{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/auth-service/v1/dwh-data-auth-request 	[post]
func (ctrl *Controller) Create(c *gin.Context) {
	req := &dto.DataAuthRequestArg{}
	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		ginx.AbortResponseWithCode(c, http.StatusBadRequest, errorcode.PublicInvalidParameterJsonErr.Detail(err))
		return
	}
	if err := validation.ValidateDWHDataAuthRequest(req); err != nil {
		verr := errorcode.PublicInvalidParameterErr.Detail(form_validator.NewValidErrorsForFieldErrorList(err))
		ginx.AbortResponseWithCode(c, http.StatusBadRequest, verr)
		return
	}
	id, err := ctrl.service.Create(c, req)
	if err != nil {
		ginx.AbortResponseWithCode(c, http.StatusInternalServerError, err)
		return
	}
	ginx.ResOKJson(c, dto.NewIDResp(id))
}

// Update 更新数仓数据权限申请
//
//	@Description	更新数仓数据权限申请
//	@Tags			数仓数据权限申请
//	@Summary		更新数仓数据权限申请
//	@Accept			json
//	@Produce		json
//	@Param			id	path		string					true	"数仓数据权限申请单ID"	Format(uuid)
//	@Param			_	body		dto.DataAuthRequestArg	true	"请求参数"
//	@Success		200	{object}	dto.DataAuthRequestArg	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/auth-service/v1/dwh-data-auth-request/{id}   [put]
func (ctrl *Controller) Update(c *gin.Context) {
	// Path 参数
	idReq := &dto.IDReq{}
	if _, err := form_validator.BindUriAndValid(c, idReq); err != nil {
		ginx.AbortResponseWithCode(c, http.StatusBadRequest, errorcode.PublicInvalidParameterErr.Detail(err))
		return
	}
	// Body 参数
	req := &dto.DataAuthRequestArg{}
	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		ginx.AbortResponseWithCode(c, http.StatusBadRequest, errorcode.PublicInvalidParameterErr.Detail(err))
		return
	}
	req.ID = idReq.ID

	if err := validation.ValidateDWHDataAuthRequest(req); err != nil {
		verr := errorcode.PublicInvalidParameterErr.Detail(form_validator.NewValidErrorsForFieldErrorList(err))
		ginx.AbortResponseWithCode(c, http.StatusBadRequest, verr)
		return
	}
	result, err := ctrl.service.Update(c, req)
	if err != nil {
		ginx.AbortResponseWithCode(c, http.StatusInternalServerError, err)
		return
	}
	ginx.ResOKJson(c, dto.NewIDResp(result))
}

// Get 获取数仓数据权限申请详情
//
//	@Description	获取数仓数据权限申请详情
//	@Tags			数仓数据权限申请
//	@Summary		获取数仓数据权限申请详情
//	@Accept			text/plain
//	@Produce		json
//	@Param			id	path		string					true	"逻辑视图授权申请 ID"	Format(uuid)
//	@Success		200	{object}	dto.DataAuthFormDetail	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/auth-service/v1/dwh-data-auth-request/{id} [get]
func (ctrl *Controller) Get(c *gin.Context) {
	// 获取 path 参数
	req := &dto.IDReq{}
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		ginx.AbortResponseWithCode(c, http.StatusBadRequest, errorcode.PublicInvalidParameterErr.Detail(err))
		return
	}
	result, err := ctrl.service.Get(c, req.ID)
	if err != nil {
		ginx.AbortResponseWithCode(c, http.StatusInternalServerError, err)
		return
	}
	ginx.ResOKJson(c, result)
}

// Delete 删除数仓数据申请单
//
//	@Description	删除数仓数据申请单
//	@Tags			数仓数据权限申请
//	@Summary		删除
//	@Accept			text/plain
//	@Produce		text/plain
//	@Param			id	path		string			true	"逻辑视图授权申请 ID"	Format(uuid)
//	@Success		200	{object}	string			"成功响应参数: OK"
//	@Failure		400	{object}	rest.HttpError	"失败响应参数"
//	@Router			/api/auth-service/v1/dwh-data-auth-request/{id}  [DELETE]
func (ctrl *Controller) Delete(c *gin.Context) {
	req := &dto.IDReq{}
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		ginx.AbortResponseWithCode(c, http.StatusBadRequest, errorcode.PublicInvalidParameterErr.Detail(err))
		return
	}
	err := ctrl.service.Delete(c, req.ID)
	if err != nil {
		ginx.AbortResponseWithCode(c, http.StatusInternalServerError, err)
		return
	}
	ginx.ResOKJson(c, nil)
}

// List 获取数仓数据权限申请列表
//
//	@Description	获取数仓数据权限申请列表
//	@Tags			数仓数据权限申请
//	@Summary		获取列表
//	@Accept			text/plain
//	@Produce		json
//	@Param			_	query		dto.DataAuthRequestListArgs					true	"请求参数"
//	@Success		200	{object}	dto.PageResult[dto.DataAuthFormListItem]	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError								"失败响应参数"
//	@Router			/api/auth-service/v1/dwh-data-auth-request [get]
func (ctrl *Controller) List(c *gin.Context) {
	req := &dto.DataAuthRequestListArgs{}
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		ginx.AbortResponseWithCode(c, http.StatusBadRequest, errorcode.PublicInvalidParameterErr.Detail(err))
		return
	}

	result, err := ctrl.service.List(c, req)
	if err != nil {
		ginx.AbortResponseWithCode(c, http.StatusInternalServerError, err)
		return
	}

	ginx.ResOKJson(c, result)
}

// AuditList 获取数仓数据权限申请审核列表
//
//	@Description	获取数仓数据权限申请审核列表
//	@Tags			数仓数据权限申请
//	@Summary		获取审核列表
//	@Accept			text/plain
//	@Produce		json
//	@Param			_	query		dto.AuditListReq									true	"请求参数"
//	@Success		200	{object}	dto.PageResult[dto.DataAuthReqFormAuditListItem]	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError										"失败响应参数"
//	@Router			/api/auth-service/v1/dwh-data-auth-request/audit [get]
func (ctrl *Controller) AuditList(c *gin.Context) {
	req := &dto.AuditListReq{}
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		ginx.AbortResponseWithCode(c, http.StatusBadRequest, errorcode.PublicInvalidParameterErr.Detail(err))
		return
	}

	result, err := ctrl.service.AuditList(c, req)
	if err != nil {
		ginx.AbortResponseWithCode(c, http.StatusInternalServerError, err)
		return
	}

	ginx.ResOKJson(c, result)
}

// CancelAudit 撤回数仓数据权限申请审核
//
//	@Description	撤回数仓数据权限申请审核
//	@Tags			数仓数据权限申请
//	@Summary		撤回审核
//	@Accept			text/plain
//	@Produce		text/plain
//	@Param			_	query		dto.IDReq		true	"请求参数"
//	@Success		200	{object}	string			"成功响应参数:OK"
//	@Failure		400	{object}	rest.HttpError	"失败响应参数"
//	@Router			/api/auth-service/v1/dwh-data-auth-request/{id}   [post]
func (ctrl *Controller) CancelAudit(c *gin.Context) {
	req := &dto.IDReq{}
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		ginx.AbortResponseWithCode(c, http.StatusBadRequest, errorcode.PublicInvalidParameterErr.Detail(err))
		return
	}
	err := ctrl.service.Cancel(c, req.ID)
	if err != nil {
		ginx.AbortResponseWithCode(c, http.StatusInternalServerError, err)
		return
	}
	ginx.ResOKJson(c, nil)
}
