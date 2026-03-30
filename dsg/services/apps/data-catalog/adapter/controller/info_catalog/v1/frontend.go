package v1

import (
	"fmt"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/samber/lo"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"github.com/kweaver-ai/idrm-go-common/util/sets"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

func (ctrl *Controller) SearchInfoResourceCatalogByUser(c *gin.Context) {
	req := new(info_resource_catalog.SearchInfoResourceCatalogsByUserReq)
	if ok, err := form_validator.BindJsonAndValid(c, req); !ok {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	// Completion
	if req.Fields == nil {
		req.Fields = info_resource_catalog.DefaultKeywordFields()
	}
	// Validation
	var allErrs form_validator.ValidErrors
	var seenFields = make(sets.Set[info_resource_catalog.KeywordField])
	for i, f := range req.Fields {
		if !info_resource_catalog.SupportedKeywordFields.Has(f) {
			allErrs = append(allErrs, &form_validator.ValidError{
				Key:     fmt.Sprintf("fields[%d]", i),
				Message: fmt.Sprintf("必须是 %s 其中之一", strings.Join(lo.Map(sets.List(info_resource_catalog.SupportedKeywordFields), func(f info_resource_catalog.KeywordField, _ int) string { return string(f) }), ", ")),
			})
		}
		if seenFields.Has(f) {
			allErrs = append(allErrs, &form_validator.ValidError{
				Key:     fmt.Sprintf("fields[%d]", i),
				Message: "重复的参数",
			})
			continue
		}
		seenFields.Insert(f)
	}
	if allErrs != nil {
		form_validator.ReqParamErrorHandle(c, allErrs)
		return
	}

	res, err := ctrl.infoCatalog.SearchInfoResourceCatalogsByUser(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

//	 信息资源目录搜索
//		@Description	信息资源目录搜索
//		@Tags			服务超市管理
//		@Summary		信息资源目录搜索
//		@Accept			json
//		@Produce		json
//		@Param			_				body		info_resource_catalog.SearchInfoResourceCatalogsByAdminReq	true	"请求参数"
//		@Success		200				{object}	info_resource_catalog.CreateInfoResourceCatalogRes			"成功响应参数"
//		@Failure		400				{object}	rest.HttpError			"失败响应参数"
//		@Router			/frontend/v1/info-resource-catalog/operation/search [post]
func (ctrl *Controller) SearchInfoResourceCatalogByAdmin(c *gin.Context) {
	req := new(info_resource_catalog.SearchInfoResourceCatalogsByAdminReq)
	if ok, err := form_validator.BindJsonAndValid(c, req); !ok {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	// Completion
	if req.Fields == nil {
		req.Fields = info_resource_catalog.DefaultKeywordFields()
	}
	// Validation
	var allErrs form_validator.ValidErrors
	var seenFields = make(sets.Set[info_resource_catalog.KeywordField])
	for i, f := range req.Fields {
		if !info_resource_catalog.SupportedKeywordFields.Has(f) {
			allErrs = append(allErrs, &form_validator.ValidError{
				Key:     fmt.Sprintf("fields[%d]", i),
				Message: fmt.Sprintf("必须是 %s 其中之一", strings.Join(lo.Map(sets.List(info_resource_catalog.SupportedKeywordFields), func(f info_resource_catalog.KeywordField, _ int) string { return string(f) }), ", ")),
			})
		}
		if seenFields.Has(f) {
			allErrs = append(allErrs, &form_validator.ValidError{
				Key:     fmt.Sprintf("fields[%d]", i),
				Message: "重复的参数",
			})
			continue
		}
		seenFields.Insert(f)
	}
	if allErrs != nil {
		form_validator.ReqParamErrorHandle(c, allErrs)
		return
	}
	res, err := ctrl.infoCatalog.SearchInfoResourceCatalogsByAdmin(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

func (ctrl *Controller) GetInfoResourceCatalogCardBaseInfo(c *gin.Context) {
	req := new(info_resource_catalog.GetInfoResourceCatalogCardBaseInfoReq)
	if ok, err := form_validator.BindUriAndValid(c, req); !ok {
		form_validator.UriParamErrorHandle(c, err)
		return
	}
	res, err := ctrl.infoCatalog.GetInfoResourceCatalogCardBaseInfo(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

func (ctrl *Controller) GetInfoResourceCatalogRelatedDataResourceCatalogs(c *gin.Context) {
	var req info_resource_catalog.GetInfoResourceCatalogRelatedDataResourceCatalogsReq
	if ok, err := form_validator.BindUriAndValid(c, &req.IDParam); !ok {
		form_validator.UriParamErrorHandle(c, err)
		return
	}
	if ok, err := form_validator.BindQueryAndValid(c, &req.PaginationParam); !ok {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	ctrl.setDefaultValue(req.PaginationParam)
	res, err := ctrl.infoCatalog.GetRelatedDataResourceCatalogs(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

func (ctrl *Controller) GetInfoResourceCatalogDetailByUser(c *gin.Context) {
	req := new(info_resource_catalog.GetInfoResourceCatalogDetailReq)
	if ok, err := form_validator.BindUriAndValid(c, req); !ok {
		form_validator.UriParamErrorHandle(c, err)
		return
	}
	res, err := ctrl.infoCatalog.GetInfoResourceCatalogDetailByUser(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

func (ctrl *Controller) GetInfoResourceCatalogDetailByAdmin(c *gin.Context) {
	req := new(info_resource_catalog.GetInfoResourceCatalogDetailReq)
	if ok, err := form_validator.BindUriAndValid(c, req); !ok {
		form_validator.UriParamErrorHandle(c, err)
		return
	}
	res, err := ctrl.infoCatalog.GetInfoResourceCatalogDetailByAdmin(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

func (ctrl *Controller) GetInfoResourceCatalogColumns(c *gin.Context) {
	var req info_resource_catalog.GetInfoResourceCatalogColumnsReq
	if ok, err := form_validator.BindUriAndValid(c, &req.IDParam); !ok {
		form_validator.UriParamErrorHandle(c, err)
		return
	}
	if ok, err := form_validator.BindQueryAndValid(c, &req.PaginationParamWithKeyword); !ok {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	ctrl.setDefaultValue(req.PaginationParam)
	res, err := ctrl.infoCatalog.QueryInfoItems(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}
