package form_validator

import "github.com/kweaver-ai/dsg/services/apps/data-application-service/common/util/validation/field"

// CreateValidErrorsFromFieldErrorList 根据
// common/util/validation/field.ErrorList 创建 ValidErrors
func CreateValidErrorsFromFieldErrorList(fieldErrs field.ErrorList) ValidErrors {
	var errs ValidErrors
	for _, e := range fieldErrs {
		errs = append(errs, &ValidError{Key: e.Field, Message: e.Detail})
	}
	return errs
}
