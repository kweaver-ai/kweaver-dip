package v1

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	_ "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_push"

	//"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/cognitive_service_system"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

// GetSingleCatalogInfo 获取单目录信息
// @Description 获取单目录信息
// @Tags        认知服务系统
// @Summary     获取单目录信息
// @Accept      text/plan
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Param       req        query    data_push.AuditListReq    true "请求参数"
// @Success     200       {object} data_push.AuditListItem         "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/cognitive-service-system/single-catalog/info [GET]
func (controller *Controller) GetSingleCatalogInfo(c *gin.Context) {
	req := new(cognitive_service_system.GetSingleCatalogInfoReq)
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	resp, err := controller.css.GetSingleCatalogInfo(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// SearchSingleCatalog 获取单目录信息
// @Description 获取单目录信息
// @Tags        认知服务系统
// @Summary     获取单目录信息
// @Accept      text/plan
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Param       req        query    data_push.AuditListReq    true "请求参数"
// @Success     200       {object} data_push.AuditListItem         "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/cognitive-service-system/single-catalog/info [GET]
func (controller *Controller) SearchSingleCatalog(c *gin.Context) {
	req := new(cognitive_service_system.SearchSingleCatalogReq)
	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	resp, err := controller.css.SearchSingleCatalog(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// CreateSingleCatalogTemplate 获取单目录信息
// @Description 获取单目录信息
// @Tags        认知服务系统
// @Summary     获取单目录信息
// @Accept      text/plan
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Param       req        query    data_push.AuditListReq    true "请求参数"
// @Success     200       {object} data_push.AuditListItem         "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/cognitive-service-system/single-catalog/info [GET]
func (controller *Controller) CreateSingleCatalogTemplate(c *gin.Context) {
	req := new(cognitive_service_system.CreateSingleCatalogTemplateReq)
	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	resp, err := controller.css.CreateSingleCatalogTemplate(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetSingleCatalogTemplateList 获取单目录信息
// @Description 获取单目录信息
// @Tags        认知服务系统
// @Summary     获取单目录信息
// @Accept      text/plan
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Param       req        query    data_push.AuditListReq    true "请求参数"
// @Success     200       {object} data_push.AuditListItem         "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/cognitive-service-system/single-catalog/info [GET]
func (controller *Controller) GetSingleCatalogTemplateList(c *gin.Context) {
	req := new(cognitive_service_system.GetSingleCatalogTemplateListReq)
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	resp, err := controller.css.GetSingleCatalogTemplateList(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetSingleCatalogTemplateDetails 获取单目录信息
// @Description 获取单目录信息
// @Tags        认知服务系统
// @Summary     获取单目录信息
// @Accept      text/plan
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Param       req        query    data_push.AuditListReq    true "请求参数"
// @Success     200       {object} data_push.AuditListItem         "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/cognitive-service-system/single-catalog/info [GET]
func (controller *Controller) GetSingleCatalogTemplateDetails(c *gin.Context) {
	req := new(cognitive_service_system.GetSingleCatalogTemplateDetailsReq)
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	resp, err := controller.css.GetSingleCatalogTemplateDetails(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// UpdateSingleCatalogTemplate 获取单目录信息
// @Description 获取单目录信息
// @Tags        认知服务系统
// @Summary     获取单目录信息
// @Accept      text/plan
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Param       req        query    data_push.AuditListReq    true "请求参数"
// @Success     200       {object} data_push.AuditListItem         "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/cognitive-service-system/single-catalog/info [GET]
func (controller *Controller) UpdateSingleCatalogTemplate(c *gin.Context) {
	req := new(cognitive_service_system.UpdateSingleCatalogTemplateReq)
	if _, err := form_validator.BindUriAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req body param, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.css.UpdateSingleCatalogTemplate(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// DeleteSingleCatalogTemplate 获取单目录信息
// @Description 获取单目录信息
// @Tags        认知服务系统
// @Summary     获取单目录信息
// @Accept      text/plan
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Param       req        query    data_push.AuditListReq    true "请求参数"
// @Success     200       {object} data_push.AuditListItem         "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/cognitive-service-system/single-catalog/info [GET]
func (controller *Controller) DeleteSingleCatalogTemplate(c *gin.Context) {
	req := new(cognitive_service_system.DeleteSingleCatalogTemplateReq)
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	resp, err := controller.css.DeleteSingleCatalogTemplate(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetSingleCatalogHistoryList 获取单目录信息
// @Description 获取单目录信息
// @Tags        认知服务系统
// @Summary     获取单目录信息
// @Accept      text/plan
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Param       req        query    data_push.AuditListReq    true "请求参数"
// @Success     200       {object} data_push.AuditListItem         "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/cognitive-service-system/single-catalog/info [GET]
func (controller *Controller) GetSingleCatalogHistoryList(c *gin.Context) {
	req := new(cognitive_service_system.GetSingleCatalogHistoryListReq)
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	resp, err := controller.css.GetSingleCatalogHistoryList(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetSingleCatalogHistoryDetails 获取历史记录详情
// @Description 获取历史记录详情
// @Tags        认知服务系统
// @Summary     获取历史记录详情
// @Accept      text/plan
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Param       req        query    data_push.AuditListReq    true "请求参数"
// @Success     200       {object} data_push.AuditListItem         "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/cognitive-service-system/single-catalog/history/:id [GET]
func (controller *Controller) GetSingleCatalogHistoryDetails(c *gin.Context) {
	req := new(cognitive_service_system.GetSingleCatalogHistoryDetailsReq)
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	resp, err := controller.css.GetSingleCatalogHistoryDetails(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetSingleCatalogTemplateNameUnique 检查模板名称是否唯一
// @Description 检查模板名称是否唯一
// @Tags        认知服务系统
// @Summary     检查模板名称是否唯一
// @Accept      text/plan
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Param       req        query    data_push.AuditListReq    true "请求参数"
// @Success     200       {object} data_push.AuditListItem         "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/cognitive-service-system/single-catalog/template/unique-check [GET]
func (controller *Controller) GetSingleCatalogTemplateNameUnique(c *gin.Context) {
	req := new(cognitive_service_system.GetSingleCatalogTemplateNameUniqueReq)
	if _, err := form_validator.BindFormAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	resp, err := controller.css.GetSingleCatalogTemplateNameUnique(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
