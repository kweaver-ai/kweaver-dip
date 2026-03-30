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

// AuditList  godoc
//
//	@Description	沙箱审核列表
//	@Tags			沙箱管理
//	@Summary		沙箱审核列表
//	@Accept			text/plain
//	@Produce		application/json
//	@Param			Authorization	header		string									true	"token"
//	@Param			_			    query		domain.AuditListReq	true	  "请求参数"
//	@Success		200				{object}	response.PageResultNew[domain.AuditListItem]	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router		/api/task-center/v1/sandbox/audit [POST]
func (s *Service) AuditList(c *gin.Context) {
	req, err := form_validator.BindQuery[domain.AuditListReq](c)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	resp, err := s.uc.AuditList(c, req)
	if err != nil {
		log.WithContext(c).Error(err.Error())
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Revocation  godoc
//
//	@Description	撤回沙箱申请审核
//	@Tags			沙箱管理
//	@Summary		撤回沙箱申请审核
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string									true	"token"
//	@Param			_			    body		request.IDReq	true	  "请求参数"
//	@Success		200				{object}	response.IDResp							"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router		/api/task-center/v1/sandbox/audit/revocation [PUT]
func (s *Service) Revocation(c *gin.Context) {
	req, err := form_validator.BindJson[request.IDReq](c)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	if err = s.uc.Revocation(c, req); err != nil {
		log.WithContext(c).Error(err.Error())
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, req)
}
