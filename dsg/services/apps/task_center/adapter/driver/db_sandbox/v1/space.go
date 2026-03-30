package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/response"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/db_sandbox"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

var _ = new(response.IDResp)

// SandboxSpaceList  godoc
//
//	@Description	项目沙箱空间列表
//	@Tags			沙箱管理
//	@Summary		项目沙箱空间列表
//	@Accept			text/plain
//	@Produce		application/json
//	@Param			Authorization	header		string			true	"token"
//	@Param			_			    query		domain.SandboxSpaceListReq	true	 "请求参数"
//	@Success		200				{object}	response.PageResultNew[domain.SandboxSpaceListItem]     "成功响应参数"
//	@Failure		400				{object}	rest.HttpError					 "失败响应参数"
//	@Router		/api/task-center/v1/sandbox/space  [GET]
func (s *Service) SandboxSpaceList(c *gin.Context) {
	req, err := form_validator.BindQuery[domain.SandboxSpaceListReq](c)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	resp, err := s.uc.SandboxSpaceList(c, req)
	if err != nil {
		log.WithContext(c).Error(err.Error())
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
