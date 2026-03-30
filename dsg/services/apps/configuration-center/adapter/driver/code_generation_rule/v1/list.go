package v1

import (
	"github.com/gin-gonic/gin"

	_ "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/code_generation_rule"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

// ListCodeGenerationRules
//
//	@Summary    获取所有编码生成规则的列表
//	@Tags       编码生成规则
//	@Produce    application/json
//	@Success    200 {object} code_generation_rule.CodeGenerationRuleList	"编码生成规则列表"
//	@Router     /code-generation-rules [get]
func (s *Service) ListCodeGenerationRules(c *gin.Context) {
	ctx, span := trace.StartInternalSpan(c)
	defer span.End()

	list, err := s.uc.List(ctx)
	response(c, list, err)
}
