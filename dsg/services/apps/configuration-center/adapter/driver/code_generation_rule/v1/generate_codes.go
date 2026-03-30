package v1

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/code_generation_rule"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type GenerateCodesRequest struct {
	Count int `json:"count" binding:"required,gt=0"`
}

// GenerateCodes
//
//	@Summary    根据编码生成规则生成编码
//	@Tags       编码生成规则
//	@Produce    application/json
//	@Param      id  path    string  true                "编码生成规则的 ID"
//	@Param      _  body    GenerateCodesRequest true "生成"
//	@Success    200 {object} domain.CodeList  "编码生成规则"
//	@Router     /code-generation-rules/{id} [get]
func (s *Service) GenerateCodes(c *gin.Context) {
	ctx, span := trace.StartInternalSpan(c)
	defer span.End()

	// 解析编码生成规则的 ID
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err.Error()))
		return
	}

	// 检查 Body 参数
	req := &GenerateCodesRequest{}
	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)

		if ve := new(form_validator.ValidErrors); errors.As(err, &ve) {
			ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, ve.Error()))
			return
		}

		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameterJson, err.Error()))
		return
	}

	list, err := s.uc.Generate(ctx, id, domain.GenerateOptions{Count: req.Count})
	response(c, list, err)
}
