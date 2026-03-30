package user

import (
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	"github.com/kweaver-ai/idrm-go-common/util/validation"
	"github.com/kweaver-ai/idrm-go-common/util/validation/field"
)

func validateUserListOptions(opts *configuration_center_v1.UserListOptions, fldPath *field.Path) (allErrs field.ErrorList) {
	if opts.DepartmentID != "" {
		validation.ValidateUUID(opts.DepartmentID, fldPath.Child("department_id"))
		allErrs = append(allErrs, validation.ValidateUUID(opts.DepartmentID, fldPath.Child("department_id"))...)
	}
	return
}
