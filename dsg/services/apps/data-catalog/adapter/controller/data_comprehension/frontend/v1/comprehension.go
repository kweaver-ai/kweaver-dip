package v1

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_comprehension"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"github.com/samber/lo"
)

var _ response.NameIDResp

type Controller struct {
	dc data_comprehension.ComprehensionDomain
}

func NewController(dc data_comprehension.ComprehensionDomain) *Controller {
	return &Controller{dc: dc}
}

// DimensionConfigs 获取数据理解的维度配置
// @Description 获取数据理解的维度配置
// @Tags        数据理解
// @Summary     获取数据理解的维度配置
// @Accept		application/json
// @Produce		application/json
// @Success     200       {object} data_comprehension.Configuration    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/frontend/v1/data-comprehension/config [get]
func (controller *Controller) DimensionConfigs(c *gin.Context) {
	ginx.ResOKJson(c, data_comprehension.Config())
}

// Upsert 数据理解新建接口
//
//	@Description	新建数据理解接口
//	@Tags			数据理解
//	@Summary		新建数据理解接口
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string										true	"token"
//	@Param			_				body		data_comprehension.ComprehensionUpsertReq	true	"数据理解参数"
//	@Success		200				{object}	data_comprehension.ComprehensionDetail		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError								"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/data-comprehension/{catalogID} [PUT]
func (controller *Controller) Upsert(c *gin.Context) {
	req := new(data_comprehension.ComprehensionUpsertReq)
	if _, err := form_validator.BindUriAndValid(c, &req.ReqPathParams); err != nil {
		log.WithContext(c.Request.Context()).Errorf(err.Error())
		form_validator.UriParamErrorHandle(c, err)
		return
	}
	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	//获取操作者
	uInfo := request.GetUserInfo(c)
	req.Updater = uInfo.Name
	req.UpdaterId = uInfo.ID

	reqJson := lo.T2(json.Marshal(req)).A
	log.WithContext(c.Request.Context()).Infof("upsert req: %s", reqJson)

	//upsert 数据理解
	detailConfig, err := controller.dc.Upsert(c, req)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("req: %s, err: %v", reqJson, err)
		if detailConfig != nil {
			c.JSON(http.StatusBadRequest, detailConfig)
		} else {
			c.Writer.WriteHeader(http.StatusBadRequest)
			ginx.ResErrJson(c, err)
		}
		return
	}
	ginx.ResOKJson(c, &response.NameIDResp2{ID: fmt.Sprint(req.CatalogID.String())})
}

// Delete 删除数据理解
//
//	@Description	删除数据理解
//	@Tags			数据理解
//	@Summary		删除数据理解
//	@Accept			text/plain
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			catalogID		path		string					true	"目录的ID"
//	@Success		200				{object}	response.NameIDResp2	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/data-comprehension/{catalogID} [DELETE]
func (controller *Controller) Delete(c *gin.Context) {
	req := new(data_comprehension.ReqPathParams)
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	if err := controller.dc.Delete(c, req.CatalogID.Uint64()); err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, &response.NameIDResp2{ID: fmt.Sprint(req.CatalogID)})
}

// CancelMark 红点消除接口
//
//	@Description	红点消除
//	@Tags			数据理解
//	@Summary		红点消除
//	@Accept			text/plain
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			catalog_id		query		string					true	"目录的ID"
//	@Param			task_id			query		string					true	"任务的ID"
//	@Success		200				{object}	response.NameIDResp2	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/data-comprehension/mark [PUT]
func (controller *Controller) CancelMark(c *gin.Context) {
	req := new(data_comprehension.MarkReqArgs)
	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	if err := controller.dc.UpdateMark(c, req.CatalogID.Uint64(), req.TaskId); err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, &response.NameIDResp2{ID: fmt.Sprint(req.CatalogID)})
}

// Detail 数据理解详情
//
//	@Description	获取数据理解配置详情
//	@Tags			数据理解
//	@Summary		获取数据理解配置详情
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string									true	"token"
//	@Param			catalogID		path		string									true	"目录的ID"
//	@Param			template_id		query		string									false	"模板的ID"
//	@Success		200				{object}	data_comprehension.ComprehensionDetail	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError							"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/data-comprehension/{catalogID} [get]
func (controller *Controller) Detail(c *gin.Context) {
	req := new(data_comprehension.ReqPathParams)
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf(err.Error())
		form_validator.UriParamErrorHandle(c, err)
		return
	}
	queryReq := new(data_comprehension.ReqQueryParams)
	if _, err := form_validator.BindQueryAndValid(c, queryReq); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	detail, err := controller.dc.Detail(c, req.CatalogID.Uint64(), queryReq)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, detail)
}

// UploadReport 上传理解结果
//
//	@Description	上传理解结果
//	@Tags			数据理解
//	@Summary		上传理解结果
//	@Accept			plain
//	@Produce		json
//	@Param			Authorization	header		string					true	"token"
//	@Param			catalog_id		query		string					true	"目录的ID"
//	@Param			task_id			query		string					true	"目录的ID"
//	@Success		200				{object}	response.NameIDResp2	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/data-comprehension/json [POST]
func (controller *Controller) UploadReport(c *gin.Context) {
	req := make([]*data_comprehension.ComprehensionResult, 0)
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	data, err := controller.dc.UpsertResults(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, data)
}

// GetDataComprehensionList 通过id数组查询数据资源目理解
// @Description 通过id数组查询数据资源目理解
// @Tags        数据理解
// @Summary     通过id数组查询数据资源目理解
// @Accept      plain
// @Produce     json
// @Param       _           body  data_comprehension.GetDataComprehensionListReq true "请求参数"
// @Success     200       {object} data_comprehension.GetDataComprehensionListRes    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/frontend/v1/data-comprehension/list [GET]
//func (controller *Controller) GetDataComprehensionList(c *gin.Context) {
//	req := new(data_comprehension.GetDataComprehensionListReq)
//	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
//		log.WithContext(c.Request.Context()).Error(err.Error())
//		form_validator.ReqParamErrorHandle(c, err)
//		return
//	}
//	data, err := controller.dc.GetDataComprehensionList(c, req.IDs)
//	if err != nil {
//		ginx.ResBadRequestJson(c, err)
//		return
//	}
//	ginx.ResOKJson(c, data)
//}

// GetTaskCatalogList 通过任务id查询数据资源目理解
// @Description 通过任务id查询数据资源目理解
// @Tags        数据理解
// @Summary     通过任务id查询数据资源目理解
// @Accept      plain
// @Produce     json
// @Param       _           query  data_comprehension.GetTaskCatalogListReq true "请求参数"
// @Success     200       {object} data_comprehension.GetTaskCatalogListRes    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/frontend/v1/data-comprehension/task/catalog/list [GET]
func (controller *Controller) GetTaskCatalogList(c *gin.Context) {
	req := new(data_comprehension.GetTaskCatalogListReq)
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	data, err := controller.dc.GetTaskCatalogList(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, data)
}

// GetReportList 查询数据资源目理解报告列表
// @Description 查询数据资源目理解报告列表
// @Tags        数据理解
// @Summary     查询数据资源目理解报告列表
// @Accept      plain
// @Produce     json
// @Param       _           query  data_comprehension.GetReportListReq true "请求参数"
// @Success     200       {object} data_comprehension.GetReportListRes    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/frontend/v1/data-comprehension/list [GET]
func (controller *Controller) GetReportList(c *gin.Context) {
	//获取header中的scope，all，department，self或者空字符串
	//scope := interception.GetHeaderScope(c)
	req := new(data_comprehension.GetReportListReq)
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	data, err := controller.dc.GetReportList(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, data)
}

// GetCatalogList 查询可以生成数据理解报告的目录
// @Description 查询可以生成数据理解报告的目录
// @Tags        数据理解
// @Summary     查询可以生成数据理解报告的目录
// @Accept      plain
// @Produce     json
// @Param       _           query  data_comprehension.GetCatalogListReq true "请求参数"
// @Success     200       {object} data_comprehension.GetCatalogListRes    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/frontend/v1/data-comprehension/catalog [GET]
func (controller *Controller) GetCatalogList(c *gin.Context) {
	req := new(data_comprehension.GetCatalogListReq)
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	data, err := controller.dc.GetCatalogList(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, data)
}
