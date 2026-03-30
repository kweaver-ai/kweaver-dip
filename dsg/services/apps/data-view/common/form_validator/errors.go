package form_validator

import (
	"errors"
	"fmt"
	"strings"

	"github.com/gin-gonic/gin"
	val "github.com/go-playground/validator/v10"

	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util/validation/field"
)

type ValidError struct {
	Key     string `json:"key"`
	Message string `json:"message"`
}

type ValidErrors []*ValidError

// CreateValidErrorsFromFieldErrorList 根据
// common/util/validation/field.ErrorList 创建 ValidErrors
func CreateValidErrorsFromFieldErrorList(fieldErrs field.ErrorList) ValidErrors {
	var errs ValidErrors
	for _, e := range fieldErrs {
		errs = append(errs, &ValidError{Key: e.Field, Message: e.Detail})
	}
	return errs
}

func (v *ValidError) Error() string {
	return v.Message
}

func (v ValidErrors) Error() string {
	return strings.Join(v.Errors(), ",")
}

func (v ValidErrors) Errors() []string {
	var errs []string
	for _, err := range v {
		errs = append(errs, err.Error())
	}

	return errs
}

type SliceValidationError []error

// Error concatenates all error elements in SliceValidationError into a single string separated by \n.
func (err SliceValidationError) Error() string {
	n := len(err)
	switch n {
	case 0:
		return ""
	default:
		var b strings.Builder
		if err[0] != nil {
			_, _ = fmt.Fprintf(&b, "[%d]: %s", 0, err[0].Error())
		}
		if n > 1 {
			for i := 1; i < n; i++ {
				if err[i] != nil {
					b.WriteString("\n")
					_, _ = fmt.Fprintf(&b, "[%d]: %s", i, err[i].Error())
				}
			}
		}
		return b.String()
	}
}

func IsBindError(c *gin.Context, err error) (bool, error) {
	if err == nil {
		return false, nil
	}

	var sliceValidatorErrors SliceValidationError
	var validatorErrors val.ValidationErrors
	if !errors.As(err, &sliceValidatorErrors) && !errors.As(err, &validatorErrors) {
		return false, err
	}

	if validatorErrors != nil {
		sliceValidatorErrors = append(sliceValidatorErrors, validatorErrors)
	}

	var errs SliceValidationError
	for i := range sliceValidatorErrors {
		validatorErrors = nil
		if errors.As(sliceValidatorErrors[i], &validatorErrors) {
			zhTranslator, _ := uniTrans.GetTranslator("zh")
			for _, err := range genStructError(validatorErrors.Translate(zhTranslator)) {
				errs = append(errs, err)
			}
		} else {
			errs = append(errs, sliceValidatorErrors[i])
		}
	}

	return true, errs
}
