package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/open_catalog"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"github.com/samber/lo"
)

type Controller struct {
	oc open_catalog.OpenCatalogDomain
}

func NewController(
	oc open_catalog.OpenCatalogDomain,
) *Controller {
	ctl := &Controller{
		oc: oc,
	}
	return ctl
}

// GetOpenableCatalogList 获取可开放的数据资源目录列表
//
//	@Description	可开放的数据资源目录列表,针对已上线已编目未开放的目录进行过滤
//	@Tags			开放目录管理
//	@Summary		获取可开放的数据资源目录列表
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string									true	"token"
//	@Param			_				query		open_catalog.GetOpenableCatalogListReq	true	"查询参数"
//	@Success		200				{object}	open_catalog.DataCatalogRes				"成功响应参数"
//	@Failure		400				{object}	rest.HttpError							"失败响应参数"
//	@Router			/api/data-catalog/v1/open-catalog/openable-catalog [get]
func (controller *Controller) GetOpenableCatalogList(c *gin.Context) {
	var req open_catalog.GetOpenableCatalogListReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	if *req.Limit == 0 {
		req.Offset = lo.ToPtr(1)
	}

	res, err := controller.oc.GetOpenableCatalogList(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// CreateOpenCatalog 添加开放目录
//
//	@Description	添加开放目录,支持批量添加
//	@Tags			开放目录管理
//	@Summary		添加开放目录
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string								true	"token"
//	@Param			_				body		open_catalog.CreateOpenCatalogReq	true	"请求参数"
//	@Success		200				{object}	open_catalog.CreateOpenCatalogRes	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError						"失败响应参数"
//	@Router			/api/data-catalog/v1/open-catalog [post]
func (controller *Controller) CreateOpenCatalog(c *gin.Context) {
	var req open_catalog.CreateOpenCatalogReq
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req body param, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.oc.CreateOpenCatalog(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetOpenCatalogList 获取开放目录列表
//
//	@Description	获取开放目录列表
//	@Tags			开放目录管理
//	@Summary		获取开放目录列表
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string								true	"token"
//	@Param			_				query		open_catalog.GetOpenCatalogListReq	true	"查询参数"
//	@Success		200				{object}	open_catalog.OpenCatalogRes			"成功响应参数"
//	@Failure		400				{object}	rest.HttpError						"失败响应参数"
//	@Router			/api/data-catalog/v1/open-catalog [get]
func (controller *Controller) GetOpenCatalogList(c *gin.Context) {
	var req open_catalog.GetOpenCatalogListReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	if *req.Limit == 0 {
		req.Offset = lo.ToPtr(1)
	}
	if req.UpdatedAtStart != 0 && req.UpdatedAtEnd != 0 && req.UpdatedAtStart > req.UpdatedAtEnd {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, "开始时间必须小于结束时间"))
		return
	}

	res, err := controller.oc.GetOpenCatalogList(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetOpenCatalogDetail 获取开放目录详情
//
//	@Description	获取开放目录详情
//	@Tags			开放目录管理
//	@Summary		获取开放目录详情
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string								true	"token"
//	@Param			id				path		uint64								true	"开放目录ID"	default(1)
//	@Success		200				{object}	open_catalog.OpenCatalogDetailRes	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError						"失败响应参数"
//	@Router			/api/data-catalog/v1/open-catalog/{id} [get]
func (controller *Controller) GetOpenCatalogDetail(c *gin.Context) {
	var p open_catalog.IDRequired
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	data, err := controller.oc.GetOpenCatalogDetail(c, p.ID.Uint64())
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, data)
}

// UpdateOpenCatalog 编辑开放目录
//
//	@Description	编辑开放目录
//	@Tags			开放目录管理
//	@Summary		编辑开放目录
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string									true	"token"
//	@Param			id				path		uint64									true	"开放目录ID"	default(1)
//	@Param			_				body		open_catalog.UpdateOpenCatalogReqBody	true	"请求参数"
//	@Success		200				{object}	open_catalog.IDResp						"成功响应参数"
//	@Failure		400				{object}	rest.HttpError							"失败响应参数"
//	@Router			/api/data-catalog/v1/open-catalog/{id} [put]
func (controller *Controller) UpdateOpenCatalog(c *gin.Context) {
	var p open_catalog.IDRequired
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	var req open_catalog.UpdateOpenCatalogReqBody
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req body param, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.oc.UpdateOpenCatalog(c, p.ID.Uint64(), &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// DeleteOpenCatalog 删除开放目录（逻辑删除）
//
//	@Description	删除开放目录（逻辑删除）
//	@Tags			开放目录管理
//	@Summary		删除开放目录（逻辑删除）
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string			true	"token"
//	@Param			id				path		string			true	"开放目录ID"	default(1)
//	@Success		200				{object}	response.IDRes	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError	"失败响应参数"
//	@Router			/api/data-catalog/v1/open-catalog/{id} [delete]
func (controller *Controller) DeleteOpenCatalog(c *gin.Context) {
	var p open_catalog.IDRequired
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	err := controller.oc.DeleteOpenCatalog(c, p.ID.Uint64())
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, response.IDRes{ID: p.ID.String()})
}

// CancelAudit 撤销开放目录审核
//
//	@Description	撤销开放目录审核
//	@Tags			开放目录管理
//	@Summary		撤销开放目录审核
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string				true	"token"
//	@Param			id				path		string				true	"开放目录ID"
//	@Success		200				{object}	open_catalog.IDResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError		"失败响应参数"
//	@Router			/api/data-catalog/v1/open-catalog/cancel/{id} [put]
func (controller *Controller) CancelAudit(c *gin.Context) {
	var req open_catalog.IDRequired
	if _, err := form_validator.BindUriAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.oc.CancelAudit(c, req.ID.Uint64())
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetAuditList   获取待审核开放目录列表
//
//	@Description	获取待审核开放目录列表
//	@Tags			开放目录管理
//	@Summary		获取待审核开放目录列表
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string							true	"token"
//	@Param			_				query		open_catalog.GetAuditListReq	true	"请求参数"
//	@Success		200				{object}	open_catalog.AuditListRes		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router			/api/data-catalog/v1/open-catalog/audit [GET]
func (controller *Controller) GetAuditList(c *gin.Context) {
	var req open_catalog.GetAuditListReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.oc.GetAuditList(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetOverview 获取开放目录概览
//
//	@Description	获取开放目录概览
//	@Tags			开放目录管理
//	@Summary		获取开放目录概览
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string						true	"token"
//	@Success		200				{object}	open_catalog.GetOverviewRes	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/v1/open-catalog/overview [get]
func (controller *Controller) GetOverview(c *gin.Context) {
	res, err := controller.oc.GetOverview(c)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}
