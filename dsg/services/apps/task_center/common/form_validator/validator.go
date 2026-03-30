package form_validator

import (
	"fmt"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
	"reflect"
	"strings"
)

type customValidator struct {
	Validate *validator.Validate
}

func NewCustomValidator() binding.StructValidator {
	v := validator.New()
	v.SetTagName("binding")
	return &customValidator{
		Validate: v,
	}
}

func (v *customValidator) ValidateStruct(obj any) error {
	if obj == nil {
		return nil
	}

	value := reflect.Indirect(reflect.ValueOf(obj))
	switch value.Kind() {
	case reflect.Struct:
		return v.Validate.Struct(obj)

	case reflect.Slice, reflect.Array:
		count := value.Len()
		validateRet := make(SliceValidationError, 0)
		for i := 0; i < count; i++ {
			itemVal := value.Index(i)
			if itemVal.Kind() != reflect.Ptr && itemVal.CanAddr() {
				itemVal = itemVal.Addr()
			}

			if err := v.ValidateStruct(itemVal.Interface()); err != nil {
				validateRet = append(validateRet, err)
			}
		}

		if len(validateRet) == 0 {
			return nil
		}

		return validateRet

	default:
		return nil
	}
}

func (v *customValidator) Engine() any {
	return v.Validate
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
