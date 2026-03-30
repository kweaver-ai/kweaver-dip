package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	_ "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/code_generation_rule"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

// GetCodeGenerationRule
// @Summary    获取指定编码生成规则
// @Tags       编码生成规则
// @Produce    application/json
// @Param      id  path    string  true                "编码生成规则的 ID"
// @Success    200 {object} code_generation_rule.CodeGenerationRule  "编码生成规则"
// @Router     /code-generation-rules/{id} [get]
func (s *Service) GetCodeGenerationRule(c *gin.Context) {
	ctx, span := trace.StartInternalSpan(c)
	defer span.End()

	// 解析编码生成规则的 ID
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err.Error()))
		return
	}

	rule, err := s.uc.Get(ctx, id)
	response(c, rule, err)
}
