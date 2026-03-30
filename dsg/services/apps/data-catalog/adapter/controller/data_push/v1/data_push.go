package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	data_push "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_push"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

var _ response.PageResult[string]

type Controller struct {
	dp data_push.UseCase
}

func NewController(dp data_push.UseCase) *Controller {
	return &Controller{dp: dp}
}

// Create 新增数据推送
// @Description 新增数据推送
// @Tags        数据推送
// @Summary     新增数据推送
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Param       req        body    data_push.CreateReq    true "请求参数"
// @Success     200       {object} response.IDNameResp    "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/data-push [POST]
func (controller *Controller) Create(c *gin.Context) {
	req := new(data_push.CreateReq)
	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	resp, err := controller.dp.Create(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)

}

// Update 更新数据推送
// @Description 更新数据推送
// @Tags        数据推送
// @Summary     更新数据推送
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Param       req        body    data_push.UpdateReq    true "请求参数"
// @Success     200       {object} response.IDNameResp    "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/data-push [PUT]
func (controller *Controller) Update(c *gin.Context) {
	req := new(data_push.UpdateReq)
	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	resp, err := controller.dp.Update(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// BatchUpdateStatus 批量更新推送状态
// @Description 批量更新推送状态,由草稿状态到审核中
// @Tags        数据推送
// @Summary     批量更新推送状态
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Param       req        body    data_push.BatchUpdateStatusReq    true "请求参数"
// @Success     200       {object} response.IDNameResp    "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/data-push/statuses [PUT]
func (controller *Controller) BatchUpdateStatus(c *gin.Context) {
	req := new(data_push.BatchUpdateStatusReq)
	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	resp, err := controller.dp.BatchUpdateStatus(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Get 数据推送详情
// @Description 数据推送详情
// @Tags        数据推送
// @Summary     数据推送详情
// @Accept      text/plain
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Param       req        path    data_push.CommonIDReq    true "请求参数"
// @Success     200       {object} data_push.DataPushModelDetail    "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/data-push/:id [GET]
func (controller *Controller) Get(c *gin.Context) {
	req := new(data_push.CommonIDReq)
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	resp, err := controller.dp.Get(c, req.ID.Uint64())
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// List  数据推送列表
// @Description 数据推送列表
// @Tags        数据推送
// @Summary     数据推送列表
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Param       req        query    data_push.ListPageReq    true "请求参数"
// @Success     200       {object} response.PageResult[data_push.DataPushModelObject]    "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/data-push [GET]
func (controller *Controller) List(c *gin.Context) {
	req := new(data_push.ListPageReq)
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	resp, err := controller.dp.List(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// ListSchedule  数据推送监控
// @Description 数据推送监控
// @Tags        数据推送
// @Summary     数据推送监控
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Param       req        query    data_push.ListPageReq    true "请求参数"
// @Success     200       {object} response.PageResult[data_push.DataPushScheduleObject]    "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/data-push/schedule [GET]
func (controller *Controller) ListSchedule(c *gin.Context) {
	req := new(data_push.ListPageReq)
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	resp, err := controller.dp.ListSchedule(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// QuerySandboxPushCount 查询沙箱图送的数量
func (controller *Controller) QuerySandboxPushCount(c *gin.Context) {
	req := new(data_push.QuerySandboxPushReq)
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	resp, err := controller.dp.QuerySandboxPushCount(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp.Res)
}

// Delete 删除数据推送
// @Description 删除数据推送
// @Tags        数据推送
// @Summary     删除数据推送
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Param       req        path    data_push.CommonIDReq    true "请求参数"
// @Success     200       {object} response.IDRes         "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/data-push/:id [DELETE]
func (controller *Controller) Delete(c *gin.Context) {
	req := new(data_push.CommonIDReq)
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	err := controller.dp.Delete(c, req.ID.Uint64())
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, response.IDRes{req.ID.String()})
}

// Execute 执行一次
// @Description 执行一次
// @Tags        数据推送
// @Summary     执行一次
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Param       req        path    data_push.CommonIDReq    true "请求参数"
// @Success     200       {object} response.IDRes         "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/data-push/execute/:id [POST]
func (controller *Controller) Execute(c *gin.Context) {
	req := new(data_push.CommonIDReq)
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	err := controller.dp.Execute(c, req.ID.Uint64())
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, response.IDRes{req.ID.String()})
}

// Switch 启用停用
// @Description 启用停用
// @Tags        数据推送
// @Summary     启用停用
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Param       req        body    data_push.SwitchReq    true "请求参数"
// @Success     200       {object} response.IDRes         "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/data-push/switch [PUT]
func (controller *Controller) Switch(c *gin.Context) {
	req := new(data_push.SwitchReq)
	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	req.InitOperation()
	err := controller.dp.Switch(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, response.IDRes{req.ID.String()})
}

// Schedule 修改调度计划
// @Description 修改调度计划
// @Tags        数据推送
// @Summary     修改调度计划
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Param       req        body    data_push.SchedulePlanReq    true "请求参数"
// @Success     200       {object} response.IDRes         "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/data-push/schedule [PUT]
func (controller *Controller) Schedule(c *gin.Context) {
	req := new(data_push.SchedulePlanReq)
	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	err := controller.dp.Schedule(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, response.IDRes{req.ID.String()})
}

// History 查询调度日志
// @Description 查询调度日志
// @Tags        数据推送
// @Summary     查询调度日志
// @Accept      text/plan
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Param       req        query    data_push.TaskExecuteHistoryReq    true "请求参数"
// @Success     200       {object}  data_push.LocalPageResult[data_push.TaskLogInfo]         "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/data-push/schedule/history [GET]
func (controller *Controller) History(c *gin.Context) {
	req := new(data_push.TaskExecuteHistoryReq)
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	resp, err := controller.dp.History(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// ScheduleCheck 校验crontab表达式
// @Description 修改调度计划
// @Tags        数据推送
// @Summary     修改调度计划
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Param       req        body    data_push.SchedulePlanReq    true "请求参数"
// @Success     200       {object} response.IDRes         "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/data-push/schedule [PUT]
func (controller *Controller) ScheduleCheck(c *gin.Context) {
	req := new(data_push.ScheduleCheckReq)
	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	nextTime, err := controller.dp.ScheduleCheck(req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, gin.H{
		"next_time": nextTime,
	})
}
