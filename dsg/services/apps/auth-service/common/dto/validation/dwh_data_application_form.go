package validation

import (
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/util/validation/field"
)

// ValidateDWHDataAuthRequest 数仓申请新建错误
func ValidateDWHDataAuthRequest(req *dto.DataAuthRequestArg) (allErrs field.ErrorList) {
	specPath := field.NewPath("spec")
	if req.Spec == "" {
		allErrs = append(allErrs, field.Required(specPath, ""))
	}
	return allErrs
}
