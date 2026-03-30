package v1

import (
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

//	 创建信息资源目录接口
//		@Description	创建信息资源目录接口
//		@Tags			信息资源目录管理
//		@Summary		创建信息资源目录接口
//		@Accept			json
//		@Produce		json
//		@Param			_				body		info_resource_catalog.CreateInfoResourceCatalogReq	true	"请求参数"
//		@Success		200				{object}	info_resource_catalog.CreateInfoResourceCatalogRes			"成功响应参数"
//		@Failure		400				{object}	rest.HttpError			"失败响应参数"
//		@Router			/v1/info-resource-catalog [post]
func (ctrl *Controller) CreateInfoResourceCatalog(c *gin.Context) {
	req := new(info_resource_catalog.CreateInfoResourceCatalogReq)
	if ok, err := form_validator.BindJsonAndValid(c, req); !ok {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	if err := extraVerify(req.BelongInfo, req.SharedOpenInfo); err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	res, err := ctrl.infoCatalog.CreateInfoResourceCatalog(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

//	 更新信息资源目录接口
//		@Description	更新信息资源目录接口
//		@Tags			信息资源目录管理
//		@Summary		更新信息资源目录接口
//		@Accept			json
//		@Produce		json
//		@Param			_				body		info_resource_catalog.UpdateInfoResourceCatalogReq	true	"请求参数"
//		@Success		200				{object}	info_resource_catalog.UpdateInfoResourceCatalogRes			"成功响应参数"
//		@Failure		400				{object}	rest.HttpError			"失败响应参数"
//		@Router			/v1/info-resource-catalog/{id} [put]
func (ctrl *Controller) UpdateInfoResourceCatalog(c *gin.Context) {
	var req info_resource_catalog.UpdateInfoResourceCatalogReq
	if ok, err := form_validator.BindUriAndValid(c, &req.IDParam); !ok {
		form_validator.UriParamErrorHandle(c, err)
		return
	}
	if ok, err := form_validator.BindJsonAndValid(c, &req); !ok {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	if err := extraVerify(req.BelongInfo, req.SharedOpenInfo); err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	res, err := ctrl.infoCatalog.UpdateInfoResourceCatalog(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

func (ctrl *Controller) ModifyInfoResourceCatalog(c *gin.Context) {
	var req info_resource_catalog.ModifyInfoResourceCatalogReq
	if ok, err := form_validator.BindUriAndValid(c, &req.IDParam); !ok {
		form_validator.UriParamErrorHandle(c, err)
		return
	}
	if ok, err := form_validator.BindJsonAndValid(c, &req); !ok {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	err := ctrl.infoCatalog.ModifyInfoResourceCatalog(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, nil)
}

func (ctrl *Controller) DeleteInfoResourceCatalog(c *gin.Context) {
	req := new(info_resource_catalog.DeleteInfoResourceCatalogReq)
	if ok, err := form_validator.BindUriAndValid(c, req); !ok {
		form_validator.UriParamErrorHandle(c, err)
		return
	}
	err := ctrl.infoCatalog.DeleteInfoResourceCatalog(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, nil)
}

func (ctrl *Controller) GetConflictItems(c *gin.Context) {
	req := new(info_resource_catalog.GetConflictItemsReq)
	if ok, err := form_validator.BindQueryAndValid(c, req); !ok {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	res, err := ctrl.infoCatalog.GetConflictItems(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

func (ctrl *Controller) GetAutoRelatedInfoClasses(c *gin.Context) {
	req := new(info_resource_catalog.GetInfoResourceCatalogAutoRelatedInfoClassesReq)
	if ok, err := form_validator.BindQueryAndValid(c, req); !ok {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	res, err := ctrl.infoCatalog.GetAutoRelatedInfoClasses(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

func (ctrl *Controller) GetCatalogByStandardForm(c *gin.Context) {
	req := new(info_resource_catalog.GetCatalogByStandardForm)
	if ok, err := form_validator.BindQueryAndValid(c, req); !ok {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	res, err := ctrl.infoCatalog.GetCatalogByStandardForms(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// 查询待编目的业务标准表
//
//	@Description	查询待编目的业务标准表
//	@Tags			信息资源目录管理
//	@Summary		查询待编目的业务标准表
//	@Accept			json
//	@Produce		json
//	@Param			_				body		info_resource_catalog.QueryUncatalogedBusinessFormsReq	true	"请求参数"
//	@Success		200				{object}	info_resource_catalog.QueryUncatalogedBusinessFormsRes			"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/v1/info-resource-catalog/business-form/search [post]
func (ctrl *Controller) QueryUncatalogedBusinessForms(c *gin.Context) {
	req := new(info_resource_catalog.QueryUncatalogedBusinessFormsReq)
	if ok, err := form_validator.BindJsonAndValid(c, req); !ok {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	ctrl.setDefaultValue(req.PaginationParam)
	ctrl.setDefaultValue(req.SortBy)
	res, err := ctrl.infoCatalog.QueryUnCatalogedBusinessFormsV2(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

func (ctrl *Controller) QueryInfoResourceCatalogCatalogingList(c *gin.Context) {
	req := new(info_resource_catalog.QueryInfoResourceCatalogCatalogingListReq)
	if ok, err := form_validator.BindJsonAndValid(c, req); !ok {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	ctrl.setDefaultValue(req.PaginationParam)
	ctrl.setDefaultValue(req.SortBy)
	res, err := ctrl.infoCatalog.QueryCatalogingList(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

//	 分页查询信息资源目录
//		@Description	分页查询信息资源目录
//		@Tags			信息资源目录管理
//		@Summary		分页查询信息资源目录
//		@Accept			json
//		@Produce		json
//		@Param			_				body		info_resource_catalog.QueryInfoResourceCatalogAuditListReq	true	"请求参数"
//		@Success		200				{object}	info_resource_catalog.QueryInfoResourceCatalogAuditListRes			"成功响应参数"
//		@Failure		400				{object}	rest.HttpError			"失败响应参数"
//		@Router			/v1/info-resource-catalog/search [post]
func (ctrl *Controller) QueryInfoResourceCatalogAuditList(c *gin.Context) {
	req := new(info_resource_catalog.QueryInfoResourceCatalogAuditListReq)
	if ok, err := form_validator.BindJsonAndValid(c, req); !ok {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	ctrl.setDefaultValue(req.PaginationParam)
	res, err := ctrl.infoCatalog.QueryAuditList(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

//	 变更信息资源目录接口
//		@Description	变更信息资源目录接口
//		@Tags			信息资源目录管理
//		@Summary		变更信息资源目录接口
//		@Accept			json
//		@Produce		json
//		@Param			_				body		info_resource_catalog.AlterInfoResourceCatalogReq	true	"请求参数"
//		@Success		200				{object}	info_resource_catalog.AlterInfoResourceCatalogRes			"成功响应参数"
//		@Failure		400				{object}	rest.HttpError			"失败响应参数"
//		@Router			/v1/info-resource-catalog/{id}/alter [put]
func (ctrl *Controller) AlterInfoResourceCatalog(c *gin.Context) {
	var req info_resource_catalog.AlterInfoResourceCatalogReq
	if ok, err := form_validator.BindUriAndValid(c, &req.IDParamV1); !ok {
		form_validator.UriParamErrorHandle(c, err)
		return
	}
	if ok, err := form_validator.BindJsonAndValid(c, &req); !ok {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	if err := extraVerify(req.BelongInfo, req.SharedOpenInfo); err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	res, err := ctrl.infoCatalog.AlterInfoResourceCatalog(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

func (ctrl *Controller) AlterAuditCancel(c *gin.Context) {
	var req info_resource_catalog.IDParamV1
	if ok, err := form_validator.BindUriAndValid(c, &req); !ok {
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	err := ctrl.infoCatalog.AlterAuditCancel(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, nil)
}

func (ctrl *Controller) AlterRecover(c *gin.Context) {
	var req info_resource_catalog.AlterDelReq
	if ok, err := form_validator.BindUriAndValid(c, &req); !ok {
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	err := ctrl.infoCatalog.AlterRecover(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, nil)
}

func (ctrl *Controller) QueryInfoResourceCatalogStatistics(c *gin.Context) {
	req := new(info_resource_catalog.StatisticsParam)
	if ok, err := form_validator.BindQueryAndValid(c, req); !ok {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	res, err := ctrl.infoCatalog.QueryInfoResourceCatalogStatistics(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

func (ctrl *Controller) GetCatalogStatistics(c *gin.Context) {
	res, err := ctrl.infoCatalog.GetCatalogStatistics(c)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

func (ctrl *Controller) GetBusinessFormStatistics(c *gin.Context) {
	res, err := ctrl.infoCatalog.GetBusinessFormStatistics(c)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

func (ctrl *Controller) GetDeptCatalogStatistics(c *gin.Context) {
	res, err := ctrl.infoCatalog.GetDeptCatalogStatistics(c)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

func (ctrl *Controller) GetShareStatistics(c *gin.Context) {
	res, err := ctrl.infoCatalog.GetShareStatistics(c)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// ExportInfoCatalog 导出信息资源目录
//
//	@Description	导出信息资源目录
//	@Tags			数据资源目录管理
//	@Summary		导出信息资源目录
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string													true	"token"
//	@Param			_				query		info_catalog.ExportInfoCatalogReq				true	"查询参数"
//	@Failure		400				{object}	rest.HttpError											"失败响应参数"
//	@Router			/api/data-catalog/v1/info-resource-catalog/export [post]
func (controller *Controller) ExportInfoCatalog(c *gin.Context) {
	var req info_catalog.ExportInfoCatalogReq
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in get catalog list, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	file, err := controller.infoCatalogNew.ExportInfoCatalog(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	fileName := fmt.Sprintf("info-resource-catalog-%d.xlsx", time.Now().Unix())
	util.Write(c, fileName, file)
}
