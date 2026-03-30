package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/task_config"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

var _ response.NameIDResp

type Controller struct {
	dc task_config.Domain
}

func NewController(dc task_config.Domain) *Controller {
	return &Controller{dc: dc}
}

// CreateTaskConfig 添加数据探查任务配置
// @Description 按提交参数添加数据探查任务配置
// @Tags        数据探查任务管理
// @Summary     按提交参数添加数据探查任务配置
// @Accept      json
// @Produce     json
// @Param       Authorization header      string    true "token"
// @Param			_	body		task_config.TaskConfigReq	true	"请求参数"
// @Success     200       {object} task_config.TaskConfigResp    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /data-exploration-service/v1/task [post]
func (controller *Controller) CreateTaskConfig(c *gin.Context) {
	req := &task_config.TaskConfigReq{}
	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		log.Errorf("failed to binding req param in CreateTaskConfig, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	detail, err := controller.dc.CreateTaskConfig(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, detail)
}

func (controller *Controller) InternalCreateTaskConfig(c *gin.Context) {
	req := &task_config.TaskConfigReq{}
	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		log.Errorf("failed to binding req param in CreateTaskConfig, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	detail, err := controller.dc.CreateTaskConfig(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, detail)
}

// UpdateTaskConfig 更新数据探查任务配置
// @Description 按提交参数更新数据探查任务配置
// @Tags        数据探查任务管理
// @Summary     按提交参数更新数据探查任务配置
// @Accept      json
// @Produce     json
// @Param       Authorization header      string    true "token"
// @Param			_	body		task_config.TaskConfigUpdateReq	true	"请求参数"
// @Success     200       {object} task_config.TaskConfigResp    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /data-exploration-service/v1/task/{task_id} [put]
func (controller *Controller) UpdateTaskConfig(c *gin.Context) {
	req := &task_config.TaskConfigUpdateReq{}
	if _, err := form_validator.BindUriAndValid(c, &req.TaskIdPathParam); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req path param in UpdateTaskConfig, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req param in UpdateTaskConfig, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	detail, err := controller.dc.UpdateTaskConfig(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, detail)
}

func (controller *Controller) InternalUpdateTaskConfig(c *gin.Context) {
	req := &task_config.TaskConfigUpdateReq{}
	if _, err := form_validator.BindUriAndValid(c, &req.TaskIdPathParam); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req path param in UpdateTaskConfig, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req param in UpdateTaskConfig, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	detail, err := controller.dc.UpdateTaskConfig(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, detail)
}

// DeleteTaskConfig 删除数据探查任务配置
// @Description 删除数据探查任务配置
// @Tags        数据探查任务管理
// @Summary     删除数据探查任务配置
// @Accept      json
// @Produce     json
// @Param       Authorization header      string    true "token"
// @Param		task_id	path		string					true	"exploration task_id"	default(1)	minLength(1)
// @Success     200       {object} task_config.TaskConfigResp    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /data-exploration-service/v1/task/{task_id} [delete]
func (controller *Controller) DeleteTaskConfig(c *gin.Context) {
	req := &task_config.TaskConfigDeleteReq{}
	if _, err := form_validator.BindUriAndValid(c, &req.TaskIdPathParam); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req path param in DeleteTaskConfig, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	detail, err := controller.dc.DeleteTaskConfig(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, detail)
}

// GetTaskConfig 获取数据探查任务配置
// @Description 获取数据探查任务配置
// @Tags        数据探查任务管理
// @Summary     获取数据探查任务配置
// @Accept      json
// @Produce     json
// @Param       Authorization header      string    true "token"
// @Param		task_id	path		string					true	"exploration task_id"	default(1)	minLength(1)
// @Success     200       {object} task_config.TaskConfigRespDetail    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router     /data-exploration-service/v1/task/{task_id} [get]
func (controller *Controller) GetTaskConfig(c *gin.Context) {
	req := &task_config.TaskConfigDetailReq{}
	if _, err := form_validator.BindUriAndValid(c, &req.TaskIdPathParam); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req path param in GetTaskConfig, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	if _, err := form_validator.BindQueryAndValid(c, &req.Version); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in GetTaskConfig, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	detail, err := controller.dc.GetTaskConfigByTaskVersion(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, detail)
}

// GetTaskConfigList 获取数据探查任务列表配置
// @Description 获取数据探查任务列表配置
// @Tags        数据探查任务管理
// @Summary     获取数据探查任务列表配置
// @Accept      json
// @Produce     json
// @Param       Authorization header      string    true "token"
// @Param		_	query		task_config.TaskConfigListReq  		true	"请求参数"
// @Success     200       {object} task_config.TaskConfigListRespParam    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /data-exploration-service/v1/tasks [get]
func (controller *Controller) GetTaskConfigList(c *gin.Context) {
	req := &task_config.TaskConfigListReq{}
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in GetTaskConfig, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	detail, err := controller.dc.GetTaskConfigList(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, detail)
}

func (controller *Controller) GetTaskStatus(c *gin.Context) {
	req := &task_config.TaskStatusReq{}
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in GetTaskStatus, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	detail, err := controller.dc.GetTaskStatus(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, detail)
}

func (controller *Controller) GetTableTaskStatus(c *gin.Context) {
	req := &task_config.TableTaskStatusReq{}
	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req json param in GetTableTaskStatus, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	detail, err := controller.dc.GetTableTaskStatus(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, detail)
}

func (controller *Controller) InternalCreateThirdPartyTaskConfig(c *gin.Context) {
	req := &task_config.ThirdPartyTaskConfigReq{}
	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		log.Errorf("failed to binding req param in CreateTaskConfig, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	detail, err := controller.dc.CreateThirdPartyTaskConfig(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, detail)
}
