package sub_service

import (
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/domain/sub_service"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

// Create 创建子接口
//
//	@Description    创建子接口，也就是在接口的结果上再加一层过滤
//	@Tags           子接口
//	@Accept         application/json
//	@Produce        application/json
//	@Param          _   body        sub_service.SubService    true    "请求参数"
//	@Success        200 {object}    sub_service.SubService            "成功响应参数"
//	@Failure        400 {object}    rest.HttpError              "失败响应参数"
//	@Router         /api/v1/data-application-service/v1/sub-views [post]
func (s *SubServiceService) Create(c *gin.Context) {
	var req sub_service.SubService
	if err := c.ShouldBindJSON(&req); err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameterJson, err.Error()))
		return
	}
	isInternal := strings.Contains(c.Request.RequestURI, "internal")

	resp, err := s.uc.Create(c, &req, isInternal)
	if err != nil {
		resErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}
