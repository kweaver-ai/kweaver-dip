package validation

import (
	"fmt"
	"unicode/utf8"

	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util/sets"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util/validation/field"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/sub_view"
)

// ValidateSubViewCreate 在创建子视图时检查
func ValidateSubViewCreate(subView *sub_view.SubView) (allErrs field.ErrorList) {
	return ValidateSubView(subView)
}

// ValidateSubViewUpdate 在更新子视图时检查
func ValidateSubViewUpdate(oldSubView, newSubView *sub_view.SubView) (allErrs field.ErrorList) {
	allErrs = append(allErrs, ValidateSubView(newSubView)...)

	// 不支持修改子视图所属的逻辑视图
	if oldSubView.LogicViewID != newSubView.LogicViewID {
		allErrs = append(allErrs, field.Invalid(field.NewPath("logic_view_id"), newSubView.LogicViewID, "不支持修改子视图所属的逻辑视图"))
	}
	return
}

// 子视图名称的最大长度
const SubViewNameMaxLength int = 255

// ValidateSubView tests if required fields in the SubVew are set, and is called
// by ValidateSubViewCreate and ValidateSubViewUpdate.
func ValidateSubView(subView *sub_view.SubView) (allErrs field.ErrorList) {
	var fldPath *field.Path

	// 检查名称
	if subView.Name == "" {
		allErrs = append(allErrs, field.Required(fldPath.Child("name"), "name 为必填字段"))
	} else if utf8.RuneCountInString(subView.Name) > SubViewNameMaxLength {
		allErrs = append(allErrs, field.Invalid(fldPath.Child("name"), subView.Name, fmt.Sprintf("Name 长度不能超过 %d 个字符", SubViewNameMaxLength)))
	}

	// 检查逻辑视图 ID
	if subView.LogicViewID == uuid.Nil {
		allErrs = append(allErrs, field.Required(fldPath.Child("logic_view_id"), "logic_view_id 为必填字段"))
	}

	// 检查行列规则
	if subView.Detail == "" {
		allErrs = append(allErrs, field.Required(fldPath.Child("detail"), "detail 为必填字段"))
	}
	return
}

// ValidateListOptions 验证 list 的选项
func ValidateListOptions(opts *sub_view.ListOptions) (allErrs field.ErrorList) {
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
func ValidateSortBy(sortBy sub_view.SortBy, fldPath *field.Path, opts *ValidateSortByOptions) (allErrs field.ErrorList) {
	if opts.AllowEmpty && sortBy == "" {
		return
	}

	if !sub_view.SupportedSortBy.Has(sortBy) {
		allErrs = append(allErrs, field.NotSupported(fldPath, sortBy, sets.List(sub_view.SupportedSortBy)))
	}
	return
}

type ValidateDirectionOptions struct {
	// 允许 direction 为空
	AllowEmpty bool
}

// 验证 Direction
func ValidateDirection(direction sub_view.Direction, fldPath *field.Path, opts *ValidateDirectionOptions) (allErrs field.ErrorList) {
	if opts.AllowEmpty && direction == "" {
		return
	}

	if !sub_view.SupportedDirections.Has(direction) {
		allErrs = append(allErrs, field.NotSupported(fldPath, direction, sets.List(sub_view.SupportedDirections)))
	}
	return
}
