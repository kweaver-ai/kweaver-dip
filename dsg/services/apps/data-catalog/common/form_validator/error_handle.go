package form_validator

import (
	"errors"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

func IsBindError(c *gin.Context, err error) (bool, error) {
	if err == nil {
		return false, nil
	}

	var sliceValidatorErrors SliceValidationError
	var validatorErrors validator.ValidationErrors
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
			for _, err := range genStructError(validatorErrors.Translate(getTrans(c))) {
				errs = append(errs, err)
			}
		} else {
			errs = append(errs, sliceValidatorErrors[i])
		}
	}

	return true, errs
}

func ReqParamErrorHandle(c *gin.Context, err error) {
	if errors.As(err, &ValidErrors{}) {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	ginx.ResBadRequestJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
}

func UriParamErrorHandle(c *gin.Context, err error) {
	if errors.As(err, &ValidErrors{}) {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	ginx.ResBadRequestJson(c, errorcode.Desc(errorcode.PublicInvalidParameterValue))
}
