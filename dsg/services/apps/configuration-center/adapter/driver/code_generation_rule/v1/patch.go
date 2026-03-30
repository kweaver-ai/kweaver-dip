package v1

import (
	"context"
	"fmt"
	"math"
	"regexp"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util/ptr"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util/sets"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util/validation/field"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/code_generation_rule"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type PatchCodeGenerationRuleRequest struct {
	Prefix               *string `json:"prefix,omitempty"`
	PrefixEnabled        *bool   `json:"prefix_enabled,omitempty" `
	RuleCodeEnabled      *bool   `json:"rule_code_enabled,omitempty" `
	CodeSeparator        *string `json:"code_separator,omitempty" `
	CodeSeparatorEnabled *bool   `json:"code_separator_enabled,omitempty" `
	DigitalCodeWidth     *int    `json:"digital_code_width,omitempty" `
	DigitalCodeStarting  *int    `json:"digital_code_starting,omitempty" `
	DigitalCodeEnding    *int    `json:"digital_code_ending,omitempty"`
}

func ValidatePatchCodeGenerationRuleRequest(req *PatchCodeGenerationRuleRequest, fldPath *field.Path) (errList field.ErrorList) {
	errList = append(errList, ValidatePrefix(req.PrefixEnabled, req.Prefix, fldPath)...)
	errList = append(errList, ValidateRuleCode(req.RuleCodeEnabled, fldPath)...)
	errList = append(errList, ValidateCodeSeparator(req.CodeSeparatorEnabled, req.CodeSeparator, fldPath)...)
	errList = append(errList, ValidateDigitalCode(req.DigitalCodeWidth, req.DigitalCodeStarting, req.DigitalCodeEnding, fldPath)...)
	return
}

var regPrefix = regexp.MustCompile(`^[A-Z]{2,6}$`)

func ValidatePrefix(enabledPtr *bool, prefixPtr *string, fldPath *field.Path) (errList field.ErrorList) {
	if enabledPtr == nil {
		errList = append(errList, field.Required(fldPath.Child("prefix_enabled"), ""))
		return
	}

	if !*enabledPtr {
		return
	}

	if prefixPtr == nil {
		errList = append(errList, field.Required(fldPath.Child("prefix"), ""))
	} else {
		errList = append(errList, ValidatePrefixValue(*prefixPtr, fldPath.Child("prefix"))...)
	}

	return
}

func ValidateRuleCode(enabled *bool, fldPath *field.Path) (errList field.ErrorList) {
	if enabled == nil {
		errList = append(errList, field.Required(fldPath.Child("rule_code"), ""))
	}
	return
}

var supportedCodeSeparators = sets.New(
	model.CodeGenerationRuleCodeSeparatorUnderscore,
	model.CodeGenerationRuleCodeSeparatorHyphen,
	model.CodeGenerationRuleCodeSeparatorSlash,
	model.CodeGenerationRuleCodeSeparatorBackslash,
)

func ValidateCodeSeparator(enabledPtr *bool, separatorPtr *string, fldPath *field.Path) (errList field.ErrorList) {
	if enabledPtr == nil {
		errList = append(errList, field.Required(fldPath.Child("code_separator_enabled"), ""))
		return
	}

	if !*enabledPtr {
		return
	}

	if separatorPtr == nil {
		errList = append(errList, field.Required(fldPath.Child("code_separator"), ""))
	} else {
		errList = append(errList, ValidateCodeSeparatorValue(*separatorPtr, fldPath.Child("code_separator"))...)
	}
	return
}

func ValidateCodeSeparatorValue(separator string, fldPath *field.Path) (errList field.ErrorList) {
	if !supportedCodeSeparators.Has(model.CodeGenerationRuleCodeSeparator(separator)) {
		errList = append(errList, field.NotSupported(fldPath, separator, sets.List(supportedCodeSeparators)))
	}
	return
}

func ValidateDigitalCode(widthPtr, startingPtr, endingPtr *int, fldPath *field.Path) (errList field.ErrorList) {
	errList = append(errList, ValidateDigitalCodeWidth(widthPtr, fldPath.Child("digital_code_width"))...)
	errList = append(errList, ValidateDigitalCodeStarting(widthPtr, startingPtr, fldPath.Child("digital_code_starting"))...)
	errList = append(errList, ValidateDigitalCodeEnding(widthPtr, endingPtr, fldPath.Child("digital_code_ending"))...)
	return
}

func ValidateDigitalCodeWidth(widthPtr *int, fldPath *field.Path) (errList field.ErrorList) {
	if widthPtr == nil {
		errList = append(errList, field.Required(fldPath, ""))
		return
	}

	if width := *widthPtr; width < 3 || width > 9 {
		errList = append(errList, field.Invalid(fldPath, width, "the value range of width is 3 to 9"))
	}
	return
}

func ValidateDigitalCodeStarting(widthPtr, startingPtr *int, fldPath *field.Path) (errList field.ErrorList) {
	if startingPtr == nil {
		errList = append(errList, field.Required(fldPath, ""))
		return
	}
	starting := *startingPtr

	if starting < 1 {
		errList = append(errList, field.Invalid(fldPath, starting, "should be greater than or equal to 1"))
	}

	// 位数未设置，无法进行后续验证
	if widthPtr == nil {
		return
	}
	width := *widthPtr

	if width < int(math.Log10(float64(starting))+1) {
		errList = append(errList, field.Invalid(fldPath, starting, "exceed digital_code_width"))
	}
	return
}

func ValidateDigitalCodeEnding(widthPtr, endingPtr *int, fldPath *field.Path) (errList field.ErrorList) {
	if endingPtr == nil {
		errList = append(errList, field.Required(fldPath, ""))
		return
	}
	ending := *endingPtr

	if ending < 1 {
		errList = append(errList, field.Invalid(fldPath, ending, "should be greater than or equal to 1"))
	}

	// 位数未设置，无法进行后续验证
	if widthPtr == nil {
		return
	}
	width := *widthPtr

	if want := generateDigitalCodeEnding(width); ending != want {
		errList = append(errList, field.Invalid(fldPath, ending, fmt.Sprintf("should be %d", want)))
	}
	return
}

// generateDigitalCodeEnding 生成指定宽度的数字码终止值，每一位都是 9
func generateDigitalCodeEnding(width int) (ending int) {
	for i := 0; i < width; i++ {
		ending = ending*10 + 9
	}
	return
}

// PatchCodeGenerationRule
//
//	@Summary    更新指定编码生成规则
//	@Tags       编码生成规则
//	@Produce    application/merge-patch+json
//	@Param      id  path    string  true                "编码生成规则的 ID"
//	@Param      _  body    PatchCodeGenerationRuleRequest  true                "更新编码生成规则所用的 Patch"
//	@Success    200 {object} model.CodeGenerationRule  "更新后的编码生成规则"
//	@Router     /code-generation-rules/{id} [patch]
func (s *Service) PatchCodeGenerationRule(c *gin.Context) {
	ctx, span := trace.StartInternalSpan(c)
	defer span.End()

	// 解析编码生成规则 ID
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err.Error()))
		return
	}

	req := &PatchCodeGenerationRuleRequest{}
	if err := c.ShouldBindJSON(req); err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameterJson, err.Error()))
		return
	}
	if errList := ValidatePatchCodeGenerationRuleRequest(req, nil); len(errList) != 0 {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errList.Error()))
		return
	}

	rule, err := s.uc.Patch(ctx, &domain.CodeGenerationRule{
		CodeGenerationRule: model.CodeGenerationRule{
			ID: id,
			CodeGenerationRuleSpec: model.CodeGenerationRuleSpec{
				Prefix:               ptr.Deref(req.Prefix, ""),
				PrefixEnabled:        ptr.Deref(req.PrefixEnabled, false),
				RuleCodeEnabled:      ptr.Deref(req.RuleCodeEnabled, false),
				CodeSeparator:        model.CodeGenerationRuleCodeSeparator(ptr.Deref(req.CodeSeparator, "")),
				CodeSeparatorEnabled: ptr.Deref(req.CodeSeparatorEnabled, false),
				DigitalCodeWidth:     ptr.Deref(req.DigitalCodeWidth, 0),
				DigitalCodeStarting:  ptr.Deref(req.DigitalCodeStarting, 0),
				DigitalCodeEnding:    ptr.Deref(req.DigitalCodeEnding, 0),
			},
			CodeGenerationRuleStatus: model.CodeGenerationRuleStatus{
				UpdaterID: getUserID(ctx),
			},
		},
	})
	response(c, rule, err)
}

func getUserID(ctx context.Context) uuid.UUID {
	log := log.WithContext(ctx)

	u, ok := ctx.Value(interception.InfoName).(*model.User)
	if !ok {
		log.Warn("context doesn't contain user info")
		return uuid.Nil
	}

	id, err := uuid.Parse(u.ID)
	if err != nil {
		log.Warn("user id is invalid uuid", zap.Error(err), zap.String("id", u.ID))
		return uuid.Nil
	}

	return id
}
