package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/exploration"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

var _ response.NameIDResp

type Controller struct {
	dc exploration.Domain
}

func NewController(dc exploration.Domain) *Controller {
	return &Controller{dc: dc}
}

/*
// DataExplore 执行异步数据探查
// @Description 按提交参数执行异步数据探查
// @Tags        数据探查
// @Summary     按提交参数执行异步数据探查，不支持随机探查
// @Accept      json
// @Produce     json
// @Param       Authorization header      string    true "token"
// @Param			_	body		exploration.DataASyncExploreReq	true	"请求参数"
// @Success     200       {object} []exploration.DataASyncExploreResp    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /data-exploration-service/v1/reports [post]
func (controller *Controller) DataExplore(c *gin.Context) {
	req := &exploration.DataASyncExploreReq{}
	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		log.Errorf("failed to binding req param in DataExplore, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	detail, err := controller.dc.DataASyncExplore(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, detail)
}
*/

func (controller *Controller) GetDataExploreReports(c *gin.Context) {
	req := &exploration.GetDataExploreReportsReq{}
	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		log.Errorf("failed to binding req param in GetDataExploreReports, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	detail, err := controller.dc.GetDataExploreReports(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, detail)
}

/*
func (controller *Controller) InternalDataExplore(c *gin.Context) {
	req := &exploration.DataASyncExploreReq{}
	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		log.Errorf("failed to binding req param in DataExplore, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	detail, err := controller.dc.DataASyncExplore(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, detail)
}*/

// DataExplore 按编号获取数据探查报告
// @Description 按编号获取数据探查报告
// @Tags        数据探查报告管理
// @Summary     按编号获取数据探查报告
// @Accept      json
// @Produce     json
// @Param       Authorization header      string    true "token"
// @Param		code	path		string					true	"exploration code"	default(1)	minLength(1)
// @Success     200       {object} exploration.ReportFormat    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /data-exploration-service/v1/report/{code} [get]
func (controller *Controller) GetDataExploreReport(c *gin.Context) {
	req := &exploration.CodePathParam{}
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		log.Errorf("failed to binding req param in DataExplore, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	detail, err := controller.dc.GetDataExploreReport(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, detail)
}

// DataExplore 按表或任务获取数据探查报告
// @Description 按表或任务获取数据探查报告
// @Tags        数据探查报告管理
// @Summary     按表或任务获取数据探查报告
// @Accept      json
// @Produce     json
// @Param       Authorization header      string    true "token"
// @Param		_	query		exploration.ReportSearchReq   		true	"请求参数"
// @Success     200       {object} exploration.ReportFormat    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router     /data-exploration-service/v1/report [get]
func (controller *Controller) GetDataExploreReportByParam(c *gin.Context) {
	req := &exploration.ReportSearchReq{}
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		log.Errorf("failed to binding req param in DataExplore, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	detail, err := controller.dc.GetDataExploreReportByParam(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, detail)
}

// GetFieldDataExploreReport 获取表字段数据探查报告
// @Description 获取表字段数据探查报告
// @Tags        数据探查报告管理
// @Summary     获取表字段数据探查报告
// @Accept      json
// @Produce     json
// @Param       Authorization header      string    true "token"
// @Param		_	query		exploration.FieldReportSearchReq   		true	"请求参数"
// @Success     200       {object} exploration.FieldReportResp    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router     /data-exploration-service/v1/report/field [get]
func (controller *Controller) GetFieldDataExploreReport(c *gin.Context) {
	req := &exploration.FieldReportSearchReq{}
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		log.Errorf("failed to binding req param in DataExplore, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	detail, err := controller.dc.GetFieldDataExploreReport(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, detail)
}

// GetTaskConfigList 获取数据探查任务列表配置
// @Description 获取数据探查任务列表配置
// @Tags        数据探查报告管理
// @Summary     获取数据探查任务列表配置
// @Accept      json
// @Produce     json
// @Param       Authorization header      string    true "token"
// @Param		_	query		exploration.ReportListSearchReq  		true	"请求参数"
// @Success     200       {object} exploration.ListReportRespParam    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router     /data-exploration-service/v1/reports [get]
func (controller *Controller) GetDataExploreReportList(c *gin.Context) {
	req := &exploration.ReportListSearchReq{}
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in GetDataExploreReportList, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	detail, err := controller.dc.GetDataExploreReportListByParam(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, detail)
}

func (controller *Controller) InternalGetDataExploreReportList(c *gin.Context) {
	req := &exploration.ReportListReq{}
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in GetDataExploreReportList, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	detail, err := controller.dc.GetLatestDataExploreReportList(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, detail)
}

// DeleteTask 删除探查任务
// @Description 删除探查任务
// @Tags        数据探查任务管理
// @Summary     删除探查任务
// @Accept      json
// @Produce     json
// @Param       Authorization	header	string  true 	"token"
// @Param		id				path	string	true	"任务id"
// @Success     200       {object} exploration.DeleteTaskResp    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /data-exploration-service/v1/explore-task/{id} [delete]
func (controller *Controller) DeleteTask(c *gin.Context) {
	req := &exploration.DeleteTaskReq{}
	if _, err := form_validator.BindUriAndValid(c, &req.DeleteTaskParam); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req path param in DeleteTask, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	detail, err := controller.dc.DeleteTask(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, detail)
}

// GetDataExploreThirdPartyReportByParam 按表或任务获取第三方数据探查报告
// @Description 按表或任务获取第三方数据探查报告
// @Tags        数据探查报告管理
// @Summary     按表或任务获取第三方数据探查报告
// @Accept      json
// @Produce     json
// @Param       Authorization header      string    true "token"
// @Param		_	query		exploration.ReportSearchReq   		true	"请求参数"
// @Success     200       {object} exploration.ReportFormat    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router     /data-exploration-service/v1/report [get]
func (controller *Controller) GetDataExploreThirdPartyReportByParam(c *gin.Context) {
	req := &exploration.ReportSearchReq{}
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		log.Errorf("failed to binding req param in DataExplore, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	detail, err := controller.dc.GetDataExploreThirdPartyReportByParam(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, detail)
}

func (controller *Controller) GetDataExploreThirdPartyReportList(c *gin.Context) {
	req := &exploration.ReportListSearchReq{}
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in GetDataExploreReportList, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	detail, err := controller.dc.GetDataExploreThirdPartyReportListByParam(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, detail)
}

// DeleteDataExploreReport 删除数据探报告
// @Description 删除数据探报告
// @Tags        数据探查报告管理
// @Summary     删除数据探报告
// @Accept      json
// @Produce     json
// @Param       Authorization header      string    true "token"
// @Param		task_id	path		string					true	"exploration task_id"	default(1)	minLength(1)
// @Param		_	query		exploration.DeleteDataExploreReportReq   		true	"请求参数"
// @Success     200       {object} exploration.DeleteDataExploreReportResp    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /data-exploration-service/v1/report/{task_id} [delete]
func (controller *Controller) DeleteDataExploreReport(c *gin.Context) {
	req := &exploration.DeleteDataExploreReportReq{}
	if _, err := form_validator.BindUriAndValid(c, &req.TaskIdParam); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req path param in DeleteTaskConfig, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	if _, err := form_validator.BindQueryAndValid(c, &req.TaskVersionParam); err != nil {
		log.Errorf("failed to binding req param in DataExplore, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	res, err := controller.dc.DeleteExploreReport(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}
