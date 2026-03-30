package v1

import (
	"fmt"
	"net/url"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/system_operation"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Controller struct {
	d system_operation.SystemOperationDomain
}

func NewController(systemOperationDomain system_operation.SystemOperationDomain) *Controller {
	return &Controller{d: systemOperationDomain}
}

// GetDetails 系统运行明细列表
// @Description 系统运行明细列表
// @Tags        系统运行评价
// @Summary     系统运行明细列表
// @Accept		application/json
// @Produce		application/json
// @Param       _     query    system_operation.GetDetailsReq false "查询参数"
// @Success     200   {object} system_operation.GetDetailsResp   "成功响应参数"
// @Failure     400   {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/system-operation/details [get]
func (controller *Controller) GetDetails(c *gin.Context) {
	var req system_operation.GetDetailsReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in get detatils, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	res, err := controller.d.GetDetails(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// UpdateWhiteList 修改系统运行白名单设置
// @Description 修改系统运行白名单设置
// @Tags        系统运行评价
// @Summary     修改系统运行白名单设置
// @Accept		application/json
// @Produce		application/json
// @Param       id     path    string true "视图id"
// @Param       _     body    system_operation.UpdateWhiteListReq true "查询参数"
// @Success     200   {object} system_operation.UpdateWhiteListResp   "成功响应参数"
// @Failure     400   {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/system-operation/white-list/{id} [put]
func (controller *Controller) UpdateWhiteList(c *gin.Context) {
	var pathParam system_operation.UpdateWhiteListPathParam
	if _, err := form_validator.BindUriAndValid(c, &pathParam); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in UpdateWhiteList, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	var req system_operation.UpdateWhiteListReq
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req json param in UpdateWhiteList, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	res, err := controller.d.UpdateWhiteList(c, pathParam.ID, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetRule 获取系统运行规则设置
// @Description 获取系统运行规则设置
// @Tags        系统运行评价
// @Summary     获取系统运行规则设置
// @Accept		application/json
// @Produce		application/json
// @Success     200   {object} system_operation.GetRuleResp   "成功响应参数"
// @Failure     400   {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/system-operation/rule [get]
func (controller *Controller) GetRule(c *gin.Context) {
	res, err := controller.d.GetRule(c)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// UpdateRule 修改系统运行规则设置
// @Description 修改系统运行规则设置
// @Tags        系统运行评价
// @Summary     修改系统运行规则设置
// @Accept		application/json
// @Produce		application/json
// @Param       _     body    system_operation.UpdateRuleReq true "查询参数"
// @Failure     400   {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/system-operation/rule [put]
func (controller *Controller) UpdateRule(c *gin.Context) {
	var req system_operation.UpdateRuleReq
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req json param in UpdateRule, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	err := controller.d.UpdateRule(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, nil)
}

// ExportDetails 系统运行明细导出
// @Description 系统运行明细导出
// @Tags        系统运行评价
// @Summary     系统运行明细导出
// @Accept		application/json
// @Produce		application/json
// @Param       _     body    system_operation.ExportDetailsReq false "查询参数"
// @Failure     400   {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/system-operation/details/export [post]
func (controller *Controller) ExportDetails(c *gin.Context) {
	var req system_operation.ExportDetailsReq
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req param in ExportDetailsReq, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	file, err := controller.d.ExportDetails(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	fileName := fmt.Sprintf("%s.xlsx", req.FileName)
	c.Writer.Header().Set("Content-Type", "application/octet-stream")
	fileName = url.QueryEscape(fileName)
	disposition := fmt.Sprintf("attachment; filename*=utf-8''%s", fileName)
	c.Writer.Header().Set("Content-disposition", disposition)
	c.Writer.Header().Set("Content-Transfer-Encoding", "binary")
	_ = file.Write(c.Writer)
}

// OverallEvaluations 整体评价结果列表
// @Description 整体评价结果列表
// @Tags        系统运行评价
// @Summary     整体评价结果列表
// @Accept		application/json
// @Produce		application/json
// @Param       _     query    system_operation.OverallEvaluationsReq false "查询参数"
// @Success     200   {object} system_operation.OverallEvaluationsResp   "成功响应参数"
// @Failure     400   {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/system-operation/overall-evaluations [get]
func (controller *Controller) OverallEvaluations(c *gin.Context) {
	var req system_operation.OverallEvaluationsReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req param in OverallEvaluationsReq, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	res, err := controller.d.OverallEvaluations(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// ExportOverallEvaluations 整体评价结果导出
// @Description 整体评价结果导出
// @Tags        系统运行评价
// @Summary     整体评价结果导出
// @Accept		application/json
// @Produce		application/json
// @Param       _     body    system_operation.ExportOverallEvaluationsReq false "查询参数"
// @Failure     400   {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/system-operation/overall-evaluations/export [post]
func (controller *Controller) ExportOverallEvaluations(c *gin.Context) {
	var req system_operation.ExportOverallEvaluationsReq
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req param in ExportDetailsReq, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	file, err := controller.d.ExportOverallEvaluations(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	fileName := fmt.Sprintf("%s.xlsx", req.FileName)
	c.Writer.Header().Set("Content-Type", "application/octet-stream")
	fileName = url.QueryEscape(fileName)
	disposition := fmt.Sprintf("attachment; filename*=utf-8''%s", fileName)
	c.Writer.Header().Set("Content-disposition", disposition)
	c.Writer.Header().Set("Content-Transfer-Encoding", "binary")
	_ = file.Write(c.Writer)
}

// CreateDetail 定时更新明细表
//
//	@Description	定时更新明细表
//	@Tags			系统运行评价
//	@Summary		定时更新明细表
//	@Accept			application/json
//	@Produce		application/json
//	@Success		200	{object}	map[string]any	"成功响应参数"
//	@Router			/api/internal/data-catalog/v1/system-operation/detail [post]
func (controller *Controller) CreateDetail(c *gin.Context) {
	go controller.d.CreateDetail()
	ginx.ResOKJson(c, nil)
}

// DataCount 定时更新数据量表
//
//	@Description	定时更新数据量表
//	@Tags			系统运行评价
//	@Summary		定时更新数据量表
//	@Accept			application/json
//	@Produce		application/json
//	@Success		200	{object}	map[string]any	"成功响应参数"
//	@Router			/api/internal/data-catalog/v1/system-operation/data-count [post]
func (controller *Controller) DataCount(c *gin.Context) {
	go controller.d.DataCount()
	ginx.ResOKJson(c, nil)
}
