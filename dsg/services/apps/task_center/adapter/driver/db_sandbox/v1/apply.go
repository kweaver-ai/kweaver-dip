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

var _ = new(response.PageResultNew[string])

type Service struct {
	uc domain.UseCase
}

func NewService(d domain.UseCase) *Service {
	return &Service{
		uc: d,
	}
}

// Apply  godoc
//
//	@Description	沙箱申请
//	@Tags			沙箱管理
//	@Summary		沙箱申请
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string									true	"token"
//	@Param			_			    body		domain.SandboxApplyReq	true	  "请求参数"
//	@Success		200				{object}	response.IDResp							"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router		/api/task-center/v1/sandbox/apply [POST]
func (s *Service) Apply(c *gin.Context) {
	req, err := form_validator.BindJson[domain.SandboxApplyReq](c)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	resp, err := s.uc.Apply(c, req)
	if err != nil {
		log.WithContext(c).Error(err.Error())
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Extend  godoc
//
//	@Description	沙箱扩容
//	@Tags			沙箱管理
//	@Summary		沙箱扩容
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string			true	"token"
//	@Param			_			    body		domain.SandboxExtendReq	true	 "请求参数"
//	@Success		200				{object}	response.IDResp				     "成功响应参数"
//	@Failure		400				{object}	rest.HttpError					 "失败响应参数"
//	@Router		/api/task-center/v1/sandbox/extend [POST]
func (s *Service) Extend(c *gin.Context) {
	req, err := form_validator.BindJson[domain.SandboxExtendReq](c)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	resp, err := s.uc.Extend(c, req)
	if err != nil {
		log.WithContext(c).Error(err.Error())
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// ApplyList  godoc
//
//	@Description	沙箱申请列表
//	@Tags			沙箱管理
//	@Summary		沙箱申请列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string			true	"token"
//	@Param			_			    query		domain.SandboxApplyListArg	true	 "请求参数"
//	@Success		200				{object}	response.PageResultNew[domain.SandboxApplyListItem] "成功响应参数"
//	@Failure		400				{object}	rest.HttpError					 "失败响应参数"
//	@Router		/api/task-center/v1/sandbox  [GET]
func (s *Service) ApplyList(c *gin.Context) {
	req, err := form_validator.BindQuery[domain.SandboxApplyListArg](c)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	resp, err := s.uc.ApplyList(c, req)
	if err != nil {
		log.WithContext(c).Error(err.Error())
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// SandboxDetail  godoc
//
//	@Description	项目沙箱请求详情
//	@Tags			沙箱管理
//	@Summary		项目沙箱请求详情
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string			true	"token"
//	@Param			_			    path		string	true	 "请求参数"
//	@Success		200				{object}	domain.SandboxSpaceDetail     "成功响应参数"
//	@Failure		400				{object}	rest.HttpError					 "失败响应参数"
//	@Router		/api/task-center/v1/sandbox/:id  [GET]
func (s *Service) SandboxDetail(c *gin.Context) {
	req, err := form_validator.BindUri[request.IDReq](c)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	resp, err := s.uc.SandboxDetail(c, req)
	if err != nil {
		log.WithContext(c).Error(err.Error())
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
