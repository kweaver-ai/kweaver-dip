package validation

import (
	"fmt"
	"unicode/utf8"

	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/util/sets"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/util/validation/field"
)

func ValidateLogicViewAuthorizingRequestCreate(req *dto.LogicViewAuthorizingRequest) (allErrs field.ErrorList) {
	allErrs = append(allErrs, validateLogicViewAuthorizingRequestSpecCreate(&req.Spec, field.NewPath("spec"))...)
	return
}

func ValidateLogicViewAuthorizingRequestUpdate(req *dto.LogicViewAuthorizingRequest) (allErrs field.ErrorList) {
	allErrs = append(allErrs, validateRequiredUUID(req.ID, field.NewPath("id"))...)
	allErrs = append(allErrs, validateLogicViewAuthorizingRequestSpecUpdate(&req.Spec, field.NewPath("spec"))...)
	return
}

func ValidateLogicViewAuthorizingRequestCreateBatch(list *dto.LogicViewAuthorizingRequestList) (allErrs field.ErrorList) {
	itemsPath := field.NewPath("items")
	for i, req := range list.Items {
		allErrs = append(allErrs, validateLogicViewAuthorizingRequestSpecCreate(&req.Spec, itemsPath.Index(i).Child("spec"))...)
	}
	return
}

func ValidateLogicViewAuthorizingRequestUpdateBatch(list *dto.LogicViewAuthorizingRequestList) (allErrs field.ErrorList) {
	itemsPath := field.NewPath("items")
	for i, req := range list.Items {
		allErrs = append(allErrs, validateRequiredUUID(req.ID, itemsPath.Index(i).Child("id"))...)
		allErrs = append(allErrs, validateLogicViewAuthorizingRequestSpecUpdate(&req.Spec, itemsPath.Index(i).Child("spec"))...)
	}
	return
}

// TODO: 最大值定义应该在类似 API 定义的模块
const logicViewAuthorizingRequestSpecReasonMaxLength = 800

func validateLogicViewAuthorizingRequestSpecCreate(spec *dto.LogicViewAuthorizingRequestSpec, fldPath *field.Path) (allErrs field.ErrorList) {
	allErrs = append(allErrs, validateRequiredUUID(spec.ID, fldPath.Child("id"))...)

	// 只有用于授权申请时限制整权限、行列规则权限只有一个
	if spec.Usage == dto.LogicViewAuthorizingRequestAuthorizingRequest {
		// 整表权限、行列权限，有且只有一个
		if len(spec.Policies) == 0 && len(spec.SubViews) == 0 {
			allErrs = append(allErrs, field.Invalid(fldPath, "", "either .policies or .sub_views is required"))
		}
		if len(spec.Policies) != 0 && len(spec.SubViews) != 0 {
			allErrs = append(allErrs, field.Invalid(fldPath, "", ".policies and .sub_views are mutually exclusive"))
		}
		if len(spec.SubViews) > 1 {
			allErrs = append(allErrs, field.TooMany(fldPath.Child("sub_views"), len(spec.SubViews), 1))
		}
	}

	for i, p := range spec.Policies {
		allErrs = append(allErrs, validateSubjectPolicy(&p, fldPath.Child("policies").Index(i))...)
	}

	for i, spec := range spec.SubViews {
		allErrs = append(allErrs, validateSubViewAuthorizingRequestSpec(&spec, fldPath.Child("sub_views").Index(i))...)
	}

	// requester_id
	allErrs = append(allErrs, validateRequiredUUID(spec.RequesterID, fldPath.Child("requester_id"))...)

	// reason
	allErrs = append(allErrs, validateRequiredUTF8EncodedStringWithMaxLength(spec.Reason, logicViewAuthorizingRequestSpecReasonMaxLength, fldPath.Child("reason"))...)

	// usage
	if spec.Usage == "" {
		allErrs = append(allErrs, field.Required(fldPath.Child("usage"), ""))
	} else if !dto.SupportedLogicViewAuthorizingRequestUsages.Has(spec.Usage) {
		allErrs = append(allErrs, field.NotSupported(fldPath.Child("usage"), spec.Usage, sets.List(dto.SupportedLogicViewAuthorizingRequestUsages)))
	}

	return
}

func validateLogicViewAuthorizingRequestSpecUpdate(spec *dto.LogicViewAuthorizingRequestSpec, fldPath *field.Path) (allErrs field.ErrorList) {
	if spec.Suspend {
		allErrs = append(allErrs, field.Invalid(fldPath.Child("suspend"), spec.Suspend, "only support changing to false"))
	}
	return
}

func validateSubViewAuthorizingRequestSpec(spec *dto.SubViewAuthorizingRequestSpec, fldPath *field.Path) (allErrs field.ErrorList) {
	if spec.ID == "" && spec.Spec == nil {
		allErrs = append(allErrs, field.Invalid(fldPath, "", "either .id or .spec is required"))
	}
	if spec.ID != "" && spec.Spec != nil {
		allErrs = append(allErrs, field.Invalid(fldPath, "", ".id and .spec are mutually exclusive"))
	}

	if spec.ID != "" {
		allErrs = append(allErrs, validateRequiredUUID(spec.ID, fldPath.Child("id"))...)
	}

	if spec.Spec != nil {
		allErrs = append(allErrs, validateSubViewSpec(spec.Spec, fldPath.Child("spec"))...)
	}

	for i, p := range spec.Policies {
		allErrs = append(allErrs, validateSubjectPolicy(&p, fldPath.Child("policies").Index(i))...)
	}

	return
}

// 支持的授权逻辑视图、子视图给这些访问者类型
var supportedSubjectTypesForDataView = sets.New(
	dto.SubjectAPP,
	dto.SubjectUser,
)

func validateSubjectPolicy(policy *dto.SubjectPolicy, fldPath *field.Path) (allErrs field.ErrorList) {
	// 当前仅支持 user，不支持 role，domain
	if policy.SubjectType == "" {
		allErrs = append(allErrs, field.Required(fldPath.Child("subject_type"), ""))
	} else if !supportedSubjectTypesForDataView.Has(policy.SubjectType) {
		allErrs = append(allErrs, field.NotSupported(fldPath.Child("subject_type"), policy.SubjectType, sets.List(supportedSubjectTypesForDataView)))
	}

	allErrs = append(allErrs, validateRequiredUUID(policy.SubjectID, fldPath.Child("subject_id"))...)

	seen := sets.Set[dto.Action]{}
	for i, act := range policy.Actions {
		if !dto.SupportedActions.Has(act) {
			allErrs = append(allErrs, field.NotSupported(fldPath.Child("actions").Index(i), act, sets.List(dto.SupportedActions)))
			continue
		}
		if seen.Has(act) {
			allErrs = append(allErrs, field.Duplicate(fldPath.Child("actions").Index(i), act))
			continue
		}
		seen.Insert(act)
	}
	if len(seen) == 0 {
		allErrs = append(allErrs, field.Required(fldPath.Child("actions"), ""))
	}

	return
}

func ValidateListLogicViewAuthorizingRequestOptions(opts *dto.ListLogicViewAuthorizingRequestOptions) (allErrs field.ErrorList) {
	// 使用 Query 参数名，而非 Struct 的字段名作为 path
	idPath := field.NewPath("id")
	for i, id := range opts.IDs {
		allErrs = append(allErrs, validateRequiredUUID(id, idPath.Index(i))...)
	}
	return
}

func validateRequiredUUID(id string, fldPath *field.Path) (allErrs field.ErrorList) {
	if id == "" {
		allErrs = append(allErrs, field.Required(fldPath, ""))
	} else {
		allErrs = append(allErrs, validateUUID(id, fldPath)...)
	}
	return
}

func validateUUID(id string, fldPath *field.Path) (allErrs field.ErrorList) {
	if _, err := uuid.Parse(id); err != nil {
		allErrs = append(allErrs, field.Invalid(fldPath, id, fmt.Sprintf("%s 必须是一个有效的 uuid", fldPath)))
	}
	return
}

func validateRequiredUTF8EncodedStringWithMaxLength(s string, maxLength int, fldPath *field.Path) (allErrs field.ErrorList) {
	if !utf8.ValidString(s) {
		allErrs = append(allErrs, field.Invalid(fldPath, s, "不是 uf8 编码"))
		return
	}

	if c := utf8.RuneCountInString(s); c == 0 {
		allErrs = append(allErrs, field.Required(fldPath, ""))
	} else if c > maxLength {
		allErrs = append(allErrs, field.TooLong(fldPath, s, maxLength))
	}

	return
}
