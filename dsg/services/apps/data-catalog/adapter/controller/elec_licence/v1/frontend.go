package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/elec_licence"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

// Search 搜索电子证照-前台
//
//	@Description	搜索电子证照-前台
//	@Tags			open电子证照前台
//	@Summary		搜索电子证照-前台
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			_				query		elec_licence.SearchReq	true	"请求参数"
//	@Success		200				{object}	elec_licence.SearchRes	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/elec-licence/search [post]
func (cl *Controller) Search(c *gin.Context) {
	var req elec_licence.SearchReq
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := cl.e.Search(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetElecLicenceDetailFrontend 查询电子证照详情-前台
//
//	@Description	查询电子证照详情-前台
//	@Tags			open电子证照前台
//	@Summary		查询电子证照详情-前台
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string									true	"token"
//	@Param			_				query		elec_licence.ElecLicenceIDRequired		true	"请求参数"
//	@Success		200				{object}	elec_licence.GetElecLicenceDetailRes	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError							"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/elec-licence/:elec_licence_id [get]
func (cl *Controller) GetElecLicenceDetailFrontend(c *gin.Context) {
	var req elec_licence.ElecLicenceIDRequired
	if _, err := form_validator.BindUriAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := cl.e.GetElecLicenceDetail(c, req.ElecLicenceID)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetElecLicenceColumnListFrontend 查询电子证照信息项列表-前台
//
//	@Description	查询电子证照信息项列表-前台
//	@Tags			open电子证照前台
//	@Summary		查询电子证照信息项列表-前台
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string										true	"token"
//	@Param			_				path		elec_licence.ElecLicenceIDRequired			true	"请求参数"
//	@Param			_				query		elec_licence.GetElecLicenceColumnListReq	true	"请求参数"
//	@Success		200				{object}	elec_licence.GetElecLicenceColumnListRes	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError								"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/elec-licence/:elec_licence_id/column [get]
func (cl *Controller) GetElecLicenceColumnListFrontend(c *gin.Context) {
	var IdReq elec_licence.ElecLicenceIDRequired
	if _, err := form_validator.BindUriAndValid(c, &IdReq); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	var req elec_licence.GetElecLicenceColumnListReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	req.ElecLicenceID = IdReq.ElecLicenceID
	resp, err := cl.e.GetElecLicenceColumnList(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
