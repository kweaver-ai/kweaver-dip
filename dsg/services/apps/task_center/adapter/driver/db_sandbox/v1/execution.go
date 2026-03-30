package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/response"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/db_sandbox"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

var _ = new(response.IDResp)

// Executing  godoc
//
//	@Description	沙箱实施
//	@Tags			沙箱管理
//	@Summary		沙箱实施
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string									true	"token"
//	@Param			_			    body		domain.ExecuteReq	true	  "请求参数"
//	@Success		200				{object}	response.IDResp							"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router		/api/task-center/v1/sandbox/execution [POST]
func (s *Service) Executing(c *gin.Context) {
	req, err := form_validator.BindJson[domain.ExecuteReq](c)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	resp, err := s.uc.Executing(c, req)
	if err != nil {
		log.WithContext(c).Error(err.Error())
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Executed  godoc
//
//	@Description	沙箱实施完成
//	@Tags			沙箱管理
//	@Summary		沙箱实施完成
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string									true	"token"
//	@Param			_			    body		domain.ExecutedReq	true	  "请求参数"
//	@Success		200				{object}	response.IDResp							"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router		/api/task-center/v1/sandbox/execution  [PUT]
func (s *Service) Executed(c *gin.Context) {
	req, err := form_validator.BindJson[domain.ExecutedReq](c)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	resp, err := s.uc.Executed(c, req)
	if err != nil {
		log.WithContext(c).Error(err.Error())
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// ExecutionList  godoc
//
//	@Description	沙箱实施列表
//	@Tags			沙箱管理
//	@Summary		沙箱实施列表
//	@Accept			text/plain
//	@Produce		application/json
//	@Param			Authorization	header		string									true	"token"
//	@Param			_			    query		domain.SandboxExecutionListArg	true	  "请求参数"
//	@Success		200				{object}	response.PageResultNew[domain.SandboxExecutionListItem]							"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router		/api/task-center/v1/sandbox/execution [GET]
func (s *Service) ExecutionList(c *gin.Context) {
	req, err := form_validator.BindQuery[domain.SandboxExecutionListArg](c)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	resp, err := s.uc.ExecutionList(c, req)
	if err != nil {
		log.WithContext(c).Error(err.Error())
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)

}

// ExecutionDetail  godoc
//
//	@Description	沙箱实施详情
//	@Tags			沙箱管理
//	@Summary		沙箱实施详情
//	@Accept			text/plain
//	@Produce		application/json
//	@Param			Authorization	header		string									true	"token"
//	@Param			_			    path		string	true	  "请求参数"
//	@Success		200				{object}	response.IDResp							"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router		/api/task-center/v1/sandbox/execution/:id  [GET]
func (s *Service) ExecutionDetail(c *gin.Context) {
	req, err := form_validator.BindUri[request.IDReq](c)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	resp, err := s.uc.ExecutionDetail(c, req)
	if err != nil {
		log.WithContext(c).Error(err.Error())
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// ExecutionLogs  godoc
//
//	@Description	沙箱实施日志
//	@Tags			沙箱管理
//	@Summary		沙箱实施日志
//	@Accept			text/plain
//	@Produce		application/json
//	@Param			Authorization	header		string									true	"token"
//	@Param			_			    body		string 	true	  "请求参数"
//	@Success		200				{object}	[]domain.SandboxExecutionLogListItem							"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router		/api/task-center/v1/sandbox/execution/logs [GET]
func (s *Service) ExecutionLogs(c *gin.Context) {
	req, err := form_validator.BindQuery[request.IDReq](c)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	resp, err := s.uc.ExecutionLog(c, req)
	if err != nil {
		log.WithContext(c).Error(err.Error())
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
