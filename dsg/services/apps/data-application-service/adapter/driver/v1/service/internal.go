package service

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/form_validator"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

// HasSubViewAuth 检查用户是否有子视图的授权规则
func (s *ServiceController) HasSubViewAuth(c *gin.Context) {
	req := form_validator.Valid[dto.HasSubServiceAuthParamReq](c)
	if req == nil {
		return
	}
	resp, err := s.domain.QueryAuthedSubService(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
