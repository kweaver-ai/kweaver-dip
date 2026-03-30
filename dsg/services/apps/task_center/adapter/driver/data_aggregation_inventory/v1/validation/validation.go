package validation

import (
	task_center_v1 "github.com/kweaver-ai/idrm-go-common/api/task_center/v1"
	"github.com/kweaver-ai/idrm-go-common/util/sets"
	"github.com/kweaver-ai/idrm-go-common/util/validation/field"
)

func ValidateDataAggregationResources(resources []task_center_v1.DataAggregationResource, fldPath *field.Path) field.ErrorList {
	var allErrs field.ErrorList

	var allDataViewIDs = make(sets.Set[string])
	for i, r := range resources {
		path := fldPath.Index(i)
		if allDataViewIDs.Has(r.DataViewID) {
			allErrs = append(allErrs, field.Duplicate(path, r.DataViewID))
		} else {
			allDataViewIDs.Insert(r.DataViewID)
		}
	}

	// TODO: 检查其他字段

	return allErrs
}

func ValidateAggregatedDataAggregationResources(resources []task_center_v1.AggregatedDataAggregationResource, fldPath *field.Path) field.ErrorList {
	var allErrs field.ErrorList

	var allDataViewIDs = make(sets.Set[string])
	for i, r := range resources {
		path := fldPath.Index(i)
		if allDataViewIDs.Has(r.DataViewID) {
			allErrs = append(allErrs, field.Duplicate(path.Child("data_view_id"), r.DataViewID))
		} else {
			allDataViewIDs.Insert(r.DataViewID)
		}
	}

	// TODO: 检查其他字段

	return allErrs
}
