package auth

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/form_validator"
	v1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	"github.com/kweaver-ai/idrm-go-common/api/auth-service/v1/validation"
	"github.com/kweaver-ai/idrm-go-common/interception"
	middleware "github.com/kweaver-ai/idrm-go-common/middleware/v1"
	"github.com/kweaver-ai/idrm-go-common/util/validation/field"
)

func validateObjectTypeAndSubjectTypes(objectType string, subjects []dto.Subject) (allErrs field.ErrorList) {
	for i, s := range subjects {
		for _, p := range s.Permissions {
			fpath := field.NewPath("subjects").Index(i).Child("subject_type")
			errs := validation.ValidateSubjectTypeAndObjectTypeV2(v1.SubjectType(s.SubjectType), v1.ObjectType(objectType), v1.Action(p.Action), fpath)
			allErrs = append(allErrs, errs...)
		}
	}
	return
}

// completeListSubViewsReq 补全 ListSubViewsReq
func completeListSubViewsReq(c *gin.Context, req *dto.ListSubViewsReq) {
	if req.UserID != "" {
		return
	}

	if u, err := middleware.UserFromContext(c); err == nil {
		req.UserID = u.ID
		return
	}

	v, ok := c.Get(interception.InfoName)
	if !ok {
		return
	}

	u, ok := v.(*dto.UserInfo)
	if !ok {
		return
	}

	req.UserID = u.Id
}

// validateListSubViewsReq 验证 ListSubViewsReq
func validateListSubViewsReq(req *dto.ListSubViewsReq) (errs form_validator.ValidErrors) {
	if req.LogicViewName == "" {
		errs = append(errs, &form_validator.ValidError{Key: "logic_view_name", Message: "未指定逻辑视图名称"})
	}

	if req.UserID != "" {
		if err := uuid.Validate(req.UserID); err != nil {
			errs = append(errs, &form_validator.ValidError{Key: "user_id", Message: fmt.Sprintf("用户 ID 格式错误: %v", err)})
		}
	}

	for _, a := range req.Actions.List() {
		if a != "view" && a != "read" && a != "download" {
			errs = append(errs, &form_validator.ValidError{Key: "action", Message: fmt.Sprintf("不支持的值 %q, 支持的值: view, read, download", a)})
		}
	}

	return
}
