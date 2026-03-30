package v1

import (
	"github.com/gin-gonic/gin"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util/ptr"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util/validation/field"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type ExistenceCheckPrefixRequest struct {
	Prefix *string `json:"prefix,omitempty"`
}

func ValidateExistenceCheckPrefixRequest(req *ExistenceCheckPrefixRequest, fldPath *field.Path) (errList field.ErrorList) {
	errList = append(errList, ValidatePrefix(ptr.To(true), req.Prefix, fldPath.Child("prefix"))...)
	return
}

func ValidatePrefixValue(prefix string, fldPath *field.Path) (errList field.ErrorList) {
	if !regPrefix.MatchString(prefix) {
		errList = append(errList, field.Invalid(fldPath, prefix, "should be 2 to 6 uppercase characters"))
	}
	return
}

type ExistenceCheckPrefixResponse struct {
	Existence bool `json:"existence"`
}

// ExistenceCheckPrefix
//
//	@Summary    存在性检查：前缀
//	@Tags       编码生成规则
//	@Produce    application/json
//	@Param      _   body     ExistenceCheckPrefixRequest true "请求参数"
//	@Success    200 {object} ExistenceCheckPrefixResponse        "编码生成规则"
//	@Router     /code-generation-rules/uniqueness-check/prefix [post]
func (s *Service) ExistenceCheckPrefix(c *gin.Context) {
	ctx, span := trace.StartInternalSpan(c.Request.Context())
	defer span.End()

	// 检查 Body 参数
	req := &ExistenceCheckPrefixRequest{}
	if err := c.ShouldBindJSON(req); err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameterJson, err.Error()))
		return
	}
	if errList := ValidateExistenceCheckPrefixRequest(req, nil); len(errList) != 0 {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errList.Error()))
		return
	}

	result, err := s.uc.ExistenceCheckPrefix(ctx, *req.Prefix)
	response(c, &ExistenceCheckPrefixResponse{Existence: result}, err)
}
