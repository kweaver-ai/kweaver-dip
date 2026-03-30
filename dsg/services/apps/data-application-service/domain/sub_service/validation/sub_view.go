package validation

import (
	"fmt"
	"unicode/utf8"

	"github.com/kweaver-ai/idrm-go-common/util/sets"

	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/util/validation/field"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/domain/sub_service"
)

// ValidateSubServiceCreate 在创建子视图时检查
func ValidateSubServiceCreate(SubService *sub_service.SubService) (allErrs field.ErrorList) {
	return ValidateSubService(SubService)
}

// ValidateSubServiceUpdate 在更新子视图时检查
func ValidateSubServiceUpdate(oldSubService, newSubService *sub_service.SubService) (allErrs field.ErrorList) {
	allErrs = append(allErrs, ValidateSubService(newSubService)...)

	// 不支持修改子接口所属的接口
	if oldSubService.ServiceID != newSubService.ServiceID {
		allErrs = append(allErrs, field.Invalid(field.NewPath("service_id"), newSubService.ServiceID, "不支持修改限定规则的接口"))
	}
	return
}

// SubServiceNameMaxLength 子视图名称的最大长度
const SubServiceNameMaxLength int = 255

// ValidateSubService tests if required fields in the SubVew are set, and is called
// by ValidateSubServiceCreate and ValidateSubServiceUpdate.
func ValidateSubService(SubService *sub_service.SubService) (allErrs field.ErrorList) {
	var fldPath *field.Path

	// 检查名称
	if SubService.Name == "" {
		allErrs = append(allErrs, field.Required(fldPath.Child("name"), "name 为必填字段"))
	} else if utf8.RuneCountInString(SubService.Name) > SubServiceNameMaxLength {
		allErrs = append(allErrs, field.Invalid(fldPath.Child("name"), SubService.Name, fmt.Sprintf("Name 长度不能超过 %d 个字符", SubServiceNameMaxLength)))
	}

	// 检查接口服务的 ID
	if SubService.ServiceID == uuid.Nil {
		allErrs = append(allErrs, field.Required(fldPath.Child("service_id"), "service_id 为必填字段"))
	}

	// 检查行列规则
	if SubService.Detail == "" {
		allErrs = append(allErrs, field.Required(fldPath.Child("detail"), "detail 为必填字段"))
	}
	return
}

// ValidateListOptions 验证 list 的选项
func ValidateListOptions(opts *sub_service.ListOptions) (allErrs field.ErrorList) {
	var root *field.Path
	// sort
	allErrs = append(allErrs, ValidateSortBy(opts.Sort, root.Child("sort"), &ValidateSortByOptions{AllowEmpty: true})...)
	// direction 未设置 sort 时允许为空
	allErrs = append(allErrs, ValidateDirection(opts.Direction, root.Child("direction"), &ValidateDirectionOptions{AllowEmpty: opts.Sort == ""})...)
	return
}

type ValidateSortByOptions struct {
	// 允许 sort by 为空
	AllowEmpty bool
}

// ValidateSortBy 验证 sortBy
func ValidateSortBy(sortBy sub_service.SortBy, fldPath *field.Path, opts *ValidateSortByOptions) (allErrs field.ErrorList) {
	if opts.AllowEmpty && sortBy == "" {
		return
	}

	if !sub_service.SupportedSortBy.Has(sortBy) {
		allErrs = append(allErrs, field.NotSupported(fldPath, sortBy, sets.List(sub_service.SupportedSortBy)))
	}
	return
}

type ValidateDirectionOptions struct {
	// 允许 direction 为空
	AllowEmpty bool
}

// ValidateDirection 验证 Direction
func ValidateDirection(direction sub_service.Direction, fldPath *field.Path, opts *ValidateDirectionOptions) (allErrs field.ErrorList) {
	if opts.AllowEmpty && direction == "" {
		return
	}

	if !sub_service.SupportedDirections.Has(direction) {
		allErrs = append(allErrs, field.NotSupported(fldPath, direction, sets.List(sub_service.SupportedDirections)))
	}
	return
}
