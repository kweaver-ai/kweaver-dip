package v1

import (
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/elec_licence"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Controller struct {
	e elec_licence.ElecLicenceUseCase
}

func NewController(e elec_licence.ElecLicenceUseCase) *Controller {
	return &Controller{e: e}
}

// GetElecLicenceList 查询电子证照列表
//
//	@Description	查询电子证照列表
//	@Tags			电子证照
//	@Summary		查询电子证照列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string							true	"token"
//	@Param			_				query		elec_licence.ElecLicenceListReq	true	"请求参数"
//	@Success		200				{object}	elec_licence.ElecLicenceListRes	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router			/api/data-catalog/v1/elec-licence [get]
func (cl *Controller) GetElecLicenceList(c *gin.Context) {
	var req elec_licence.ElecLicenceListReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := cl.e.GetElecLicenceList(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetElecLicenceDetail 查询电子证照详情
//
//	@Description	查询电子证照详情
//	@Tags			电子证照
//	@Summary		查询电子证照详情
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string									true	"token"
//	@Param			_				query		elec_licence.ElecLicenceIDRequired		true	"请求参数"
//	@Success		200				{object}	elec_licence.GetElecLicenceDetailRes	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError							"失败响应参数"
//	@Router			/api/data-catalog/v1/elec-licence/:elec_licence_id [get]
func (cl *Controller) GetElecLicenceDetail(c *gin.Context) {
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

// GetElecLicenceColumnList 查询电子证照信息项列表
//
//	@Description	查询电子证照信息项列表
//	@Tags			电子证照
//	@Summary		查询电子证照信息项列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string										true	"token"
//	@Param			_				path		elec_licence.ElecLicenceIDRequired			true	"请求参数"
//	@Param			_				query		elec_licence.GetElecLicenceColumnListReq	true	"请求参数"
//	@Success		200				{object}	elec_licence.GetElecLicenceColumnListRes	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError								"失败响应参数"
//	@Router			/api/data-catalog/v1/elec-licence/:elec_licence_id/column [get]
func (cl *Controller) GetElecLicenceColumnList(c *gin.Context) {
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

// GetClassifyTree 查询行业部门类别树
//
//	@Description	查询行业部门类别树
//	@Tags			电子证照
//	@Summary		查询行业部门类别树
//	@Accept			application/json
//	@Produce		application/json
//	@Success		200	{object}	elec_licence.GetClassifyTreeRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError					"失败响应参数"
//	@Router			/api/data-catalog/v1/elec-licence/:elec_licence_id/industry-departmen/tree [get]
func (cl *Controller) GetClassifyTree(c *gin.Context) {
	resp, err := cl.e.GetClassifyTree(c)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetClassify 查询行业部门类别
//
//	@Description	查询行业部门类别
//	@Tags			电子证照
//	@Summary		查询行业部门类别
//	@Accept			application/json
//	@Produce		application/json
//	@Success		200	{object}	elec_licence.GetClassifyRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/v1/elec-licence/industry-departmen [get]
func (cl *Controller) GetClassify(c *gin.Context) {
	var req elec_licence.GetClassifyReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	resp, err := cl.e.GetClassify(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Import 电子证照导入
//
//	@Description	电子证照导入
//	@Tags			电子证照
//	@Summary		电子证照导入
//	@Accept			application/json
//	@Produce		application/octet-stream
//	@param			file	formData	file			true	"上传的文件"
//	@Failure		400		{object}	rest.HttpError	"失败响应参数"
//	@Router			/api/data-catalog/v1/elec-licence/import [post]
func (cl *Controller) Import(c *gin.Context) {
	form, err := c.MultipartForm()
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.FormExistRequiredEmpty, err.Error()))
		return
	}
	headers := form.File["file"]
	if len(headers) != 1 {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Desc(errorcode.FormOneMax))
		return
	}
	formFile := headers[0]

	if formFile.Size > 10*1<<20 {
		ginx.ResBadRequestJson(c, errorcode.Desc(errorcode.FormFileSizeLarge))
		return
	}
	format := strings.HasSuffix(formFile.Filename, ".xlsx")
	if !format {
		ginx.ResBadRequestJson(c, errorcode.Desc(errorcode.FormExcelInvalidType))
		return
	}

	reader, err := formFile.Open()
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Desc(errorcode.FormOpenExcelFileError))
		return
	}

	if err = cl.e.Import(c, reader); err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, "success")

}

// Export 电子证照导出
//
//	@Description	电子证照导出
//	@Tags			电子证照
//	@Summary		电子证照导出
//	@Accept			application/json
//	@Produce		application/octet-stream
//	@Param			_	body		elec_licence.ExportReq	true	"请求参数"
//	@Failure		400	{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-catalog/v1/elec-licence/export [post]
func (cl *Controller) Export(c *gin.Context) {
	defer func() {
		if err := recover(); err != nil {
			if v, ok := err.(error); ok {
				log.WithContext(c.Request.Context()).Error("ImportBusinessForms Panic " + v.Error())
				c.Writer.WriteHeader(400)
				ginx.ResErrJson(c, errorcode.Detail(errorcode.ElecLicenceExport, v.Error()))
				return
			}
			log.WithContext(c.Request.Context()).Error(fmt.Sprintf("ImportModifyBusinessForm Panic %v", err))
			c.Writer.WriteHeader(400)
			ginx.ResErrJson(c, errorcode.Desc(errorcode.ElecLicenceExport))
			return
		}
	}()
	var req elec_licence.ExportReq
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	file, err := cl.e.Export(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	fileName := fmt.Sprintf("%s-%d.xlsx", "电子证照", time.Now().Unix())
	c.Writer.Header().Set("Content-Type", "application/octet-stream")
	fileName = url.QueryEscape(fileName)
	disposition := fmt.Sprintf("attachment; filename*=utf-8''%s", fileName)
	c.Writer.Header().Set("Content-disposition", disposition)
	c.Writer.Header().Set("Content-Transfer-Encoding", "binary")
	_ = file.Write(c.Writer)
}

// CreateAuditInstance 创建电子证照审核流程实例
//
//	@Description	创建电子证照审核流程实例
//	@Tags			电子证照
//	@Summary		创建电子证照审核流程实例
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string								true	"token"
//	@Param			_				path		elec_licence.CreateAuditInstanceReq	true	"请求参数"
//	@Failure		400				{object}	rest.HttpError						"失败响应参数"
//	@Router			/api/data-catalog/v1/elec-licence/:elec_licence_id/audit-flow/:audit_type/instance [post]
func (cl *Controller) CreateAuditInstance(c *gin.Context) {
	var req elec_licence.CreateAuditInstanceReq
	if _, err := form_validator.BindUriAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	err := cl.e.CreateAuditInstance(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, true)
}

// PushToEs 全量推送到es
//
//	@Description	全量推送到es
//	@Tags			电子证照
//	@Summary		全量推送到es
//	@Accept			application/json
//	@Produce		application/json
//	@Failure		400				{object}	rest.HttpError						"失败响应参数"
//	@Router			/api/internal/data-catalog/v1/elec-licence/push-all-to-es [post]
func (cl *Controller) PushToEs(c *gin.Context) {
	err := cl.e.PushToEs(c)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, true)
}
