package validation

import (
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/util/validation/field"
)

// TODO: 最大值定义应该在类似 API 定义的模块
const subViewNameMaxLength = 128

func validateSubViewSpec(spec *dto.SubViewSpec, fldPath *field.Path) (allErrs field.ErrorList) {
	// name
	allErrs = append(allErrs, validateRequiredUTF8EncodedStringWithMaxLength(spec.Name, subViewNameMaxLength, fldPath.Child("name"))...)
	// logic_view_id
	allErrs = append(allErrs, validateRequiredUUID(spec.LogicViewID, fldPath.Child("logic_view_id"))...)
	// detail
	if spec.Detail == "" {
		allErrs = append(allErrs, field.Required(fldPath.Child("detail"), ""))
	}

	return
}
