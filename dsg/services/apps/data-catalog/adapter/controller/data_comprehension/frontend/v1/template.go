package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_comprehension"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

// TemplateNameExist 数据理解模板名称校验
// @Description 数据理解模板名称校验
// @Tags        数据理解
// @Summary     数据理解模板名称校验
// @Accept      plain
// @Produce     json
// @Param       _           body  data_comprehension.TemplateNameExistReq true "请求参数"
// @Success     200       bool    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/frontend/v1/data-comprehension/template/repeat [GET]
func (controller *Controller) TemplateNameExist(c *gin.Context) {
	var err error
	var req data_comprehension.TemplateNameExistReq
	if _, err = form_validator.BindQueryAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	if err = controller.dc.TemplateNameExist(c, &req); err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, true)
}

// CreateTemplate 创建数据理解模板
// @Description 创建数据理解模板
// @Tags        数据理解
// @Summary     创建数据理解模板
// @Accept      plain
// @Produce     json
// @Param       _           body  data_comprehension.TemplateReq true "请求参数"
// @Success     200       bool    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/frontend/v1/data-comprehension/template [POST]
func (controller *Controller) CreateTemplate(c *gin.Context) {
	var err error
	var req data_comprehension.TemplateReq
	if _, err = form_validator.BindJsonAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	id, err := controller.dc.CreateTemplate(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, id)
}

// UpdateTemplate 编辑数据理解模板
// @Description 编辑数据理解模板
// @Tags        数据理解
// @Summary     编辑数据理解模板
// @Accept      plain
// @Produce     json
// @Param       _           body  data_comprehension.UpdateTemplateReq true "请求参数"
// @Success     200       bool    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/frontend/v1/data-comprehension/template [PUT]
func (controller *Controller) UpdateTemplate(c *gin.Context) {
	var err error
	var req data_comprehension.UpdateTemplateReq
	if _, err = form_validator.BindJsonAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	err = controller.dc.UpdateTemplate(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, true)
}

// GetTemplateList 查询数据理解模板列表
// @Description 查询数据理解模板列表
// @Tags        数据理解
// @Summary     查询数据理解模板列表
// @Accept      plain
// @Produce     json
// @Param       _           body  data_comprehension.GetTemplateListReq true "请求参数"
// @Success     200       {object} data_comprehension.GetTemplateListRes    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/frontend/v1/data-comprehension/template [GET]
func (controller *Controller) GetTemplateList(c *gin.Context) {
	var err error
	var req data_comprehension.GetTemplateListReq
	if _, err = form_validator.BindQueryAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	res, err := controller.dc.GetTemplateList(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetTemplateDetail 查询数据理解模板详情
// @Description 查询数据理解模板详情
// @Tags        数据理解
// @Summary     查询数据理解模板详情
// @Accept      plain
// @Produce     json
// @Param       _           body  data_comprehension.GetTemplateDetailReq true "请求参数"
// @Success     200       {object} data_comprehension.GetTemplateDetailRes    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/frontend/v1/data-comprehension/template/detail [GET]
func (controller *Controller) GetTemplateDetail(c *gin.Context) {
	var err error
	var req data_comprehension.GetTemplateDetailReq
	if _, err = form_validator.BindQueryAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	res, err := controller.dc.GetTemplateDetail(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetTemplateConfig 查询数据理解模板配置
// @Description 查询数据理解模板配置
// @Tags        数据理解
// @Summary     查询数据理解模板配置
// @Accept      plain
// @Produce     json
// @Param       _           body  data_comprehension.GetTemplateConfigReq true "请求参数"
// @Success     200       {object} data_comprehension.Configuration    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/frontend/v1/data-comprehension/template/config [GET]
func (controller *Controller) GetTemplateConfig(c *gin.Context) {
	var err error
	var req data_comprehension.GetTemplateConfigReq
	if _, err = form_validator.BindQueryAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	res, err := controller.dc.GetTemplateConfig(c, req.ID)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// DeleteTemplate 删除数据理解模板
// @Description 删除数据理解模板
// @Tags        数据理解
// @Summary     删除数据理解模板
// @Accept      plain
// @Produce     json
// @Param       _           body  data_comprehension.IDRequired true "请求参数"
// @Success     200       bool    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/frontend/v1/data-comprehension/template [DELETE]
func (controller *Controller) DeleteTemplate(c *gin.Context) {
	var err error
	var req data_comprehension.IDRequired
	if _, err = form_validator.BindQueryAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	err = controller.dc.DeleteTemplate(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, true)
}
