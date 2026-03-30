package v1

import (
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/sub_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/sub_view/validation"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"github.com/gin-gonic/gin"
	"strings"
)

// Create 创建子视图
//
//	@Description    创建子视图
//	@Tags           子视图
//	@Summary        创建子视图
//	@Accept         application/json
//	@Produce        application/json
//	@Param          _   body        sub_view.SubView    true    "请求参数"
//	@Success        200 {object}    sub_view.SubView            "成功响应参数"
//	@Failure        400 {object}    rest.HttpError              "失败响应参数"
//	@Router         /sub-views [post]
func (s *SubViewService) Create(c *gin.Context) {
	var req sub_view.SubView
	if err := c.ShouldBindJSON(&req); err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameterJson, err.Error()))
		return
	}

	// 参数格式检查
	if allErrs := validation.ValidateSubViewCreate(&req); allErrs != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, form_validator.CreateValidErrorsFromFieldErrorList(allErrs)))
		return
	}
	isInternal := strings.Contains(c.Request.URL.Path, "internal")

	resp, err := s.uc.Create(c, &req, isInternal)
	if err != nil {
		resErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}
