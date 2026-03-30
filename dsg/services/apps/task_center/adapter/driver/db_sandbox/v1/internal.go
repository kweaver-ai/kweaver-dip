package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/request"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

func (s *Service) SandboxSpaceSimple(c *gin.Context) {
	req, err := form_validator.BindUri[request.IDReq](c)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	resp, err := s.uc.SandboxSpaceSimple(c, req)
	if err != nil {
		log.WithContext(c).Error(err.Error())
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
