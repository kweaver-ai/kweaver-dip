package v1

import (
	"strings"

	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util/sets"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util/validation/field"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/frontend/data_catalog"
)

// 验证搜索请求
func ValidateSearchRequest(req *SearchRequest, fldPath *field.Path) (errList field.ErrorList) {
	errList = append(errList, ValidateSearchRequestFilter(&req.Filter, fldPath.Child("filter"))...)
	return
}

func ValidateSearchForOperRequest(req *SearchForOperRequest, fldPath *field.Path) (errList field.ErrorList) {
	errList = append(errList, ValidateSearchForOperRequestFilter(&req.Filter, fldPath.Child("filter"))...)
	return
}

// 所有支持搜索的数据资源类型
var supportedDataResourceTypes = sets.New(
	common.DataResourceTypeDataView,
	common.DataResourceTypeInterface,
	common.DataResourceTypeFile,
)

// 所有支持搜索的数据资源发布状态
var supportedDataResourcePublishStatus = sets.New(

	common.DRPS_UNPUBLISHED,
	common.DRPS_PUB_AUDITING,
	common.DRPS_PUBLISHED,
	common.DRPS_PUB_REJECT,
	common.DRPS_CHANGE_AUDITING,
	common.DRPS_CHANGE_REJECT,
)

// 所有支持搜索的数据资源上线状态
var supportedDataResourceOnlineStatus = sets.New(
	common.DROS_NOT_ONLINE,
	common.DROS_ONLINE,
	common.DROS_OFFLINE,
	common.DROS_UP_AUDITING,
	common.DROS_DOWN_AUDITING,
	common.DROS_UP_REJECT,
	common.DROS_DOWN_REJECT,
)

// 验证搜索请求的过滤器
func ValidateSearchRequestFilter(filter *data_catalog.DataCatalogSearchFilter, fldPath *field.Path) (errList field.ErrorList) {
	// 检查主题域的 ID
	if len(filter.BusinessObjectID) > 0 {

		for i := range filter.BusinessObjectID {

			if _, err := uuid.Parse(filter.BusinessObjectID[i]); err != nil {
				errList = append(errList, field.Invalid(fldPath.Child("subject_object_id"), filter.BusinessObjectID[i], "请传入有效的 UUID"))
				break
			}
		}

	}

	if len(filter.CateInfoReq) > 0 {
		for _, v := range filter.CateInfoReq {
			if _, err := uuid.Parse(v.CateID); err != nil {
				errList = append(errList, field.Invalid(fldPath.Child("cate_id"), v, "请传入有效的 UUID"))
				break
			}
		}
	}

	if len(filter.UpdateCycle) > 0 {
		for _, v := range filter.UpdateCycle {
			if v > 8 || v < 0 {
				errList = append(errList, field.Invalid(fldPath.Child("update_cycle"), filter.UpdateCycle, "更新周期的值只允许1-8"))
			}
		}
	}

	if len(filter.DataRange) > 0 {
		for _, v := range filter.DataRange {
			if v > 3 || v < 0 {
				errList = append(errList, field.Invalid(fldPath.Child("data_range"), filter.DataRange, "数据区域范围的值只允许1-3"))
			}
		}
	}
	if len(filter.SharedType) > 0 {
		for _, v := range filter.SharedType {
			if v > 3 || v < 0 {
				errList = append(errList, field.Invalid(fldPath.Child("share_type"), filter.SharedType, "共享属性的值只允许1-3"))
			}
		}
	}

	// 检查数据资源类型是否未指定，或者是支持的类型
	if len(filter.DataResourceType) > 0 {
		for i := range filter.DataResourceType {
			if !supportedDataResourceTypes.Has(filter.DataResourceType[i]) {
				errList = append(errList, field.NotSupported(fldPath.Child("data_resource_type"), filter.DataResourceType, sets.List(supportedDataResourceTypes)))
			}
		}
	}

	if filter.PublishedAt.Start != nil && *filter.PublishedAt.Start < 0 {
		errList = append(errList, field.Invalid(fldPath.Child("published_at").Child("start"), *filter.PublishedAt.Start, "应该大于等于 0"))
	}

	if filter.PublishedAt.End != nil && *filter.PublishedAt.End < 0 {
		errList = append(errList, field.Invalid(fldPath.Child("published_at").Child("end"), *filter.PublishedAt.End, "应该大于等于 0"))
	}

	// 同时设置时间发布时间范围的开始时间和结束时间时，检查结束时间是否晚于开始时间
	if filter.PublishedAt.Start != nil && filter.PublishedAt.End != nil && *filter.PublishedAt.End <= *filter.PublishedAt.Start {
		errList = append(errList, field.Invalid(fldPath.Child("published_at").Child("end"), *filter.PublishedAt.End, "应该大于 start"))
	}

	if filter.OnlineAt.Start != nil && *filter.OnlineAt.Start < 0 {
		errList = append(errList, field.Invalid(fldPath.Child("online_at").Child("start"), *filter.OnlineAt.Start, "应该大于等于 0"))
	}

	if filter.OnlineAt.End != nil && *filter.OnlineAt.End < 0 {
		errList = append(errList, field.Invalid(fldPath.Child("online_at").Child("end"), *filter.OnlineAt.End, "应该大于等于 0"))
	}

	// 同时设置时间上线时间范围的开始时间和结束时间时，检查结束时间是否晚于开始时间
	if filter.OnlineAt.Start != nil && filter.OnlineAt.End != nil && *filter.OnlineAt.End <= *filter.OnlineAt.Start {
		errList = append(errList, field.Invalid(fldPath.Child("online_at").Child("end"), *filter.OnlineAt.End, "应该大于 start"))
	}

	if filter.UpdatedAt.Start != nil && *filter.UpdatedAt.Start < 0 {
		errList = append(errList, field.Invalid(fldPath.Child("updated_at").Child("start"), *filter.UpdatedAt.Start, "应该大于等于 0"))
	}

	if filter.UpdatedAt.End != nil && *filter.UpdatedAt.End < 0 {
		errList = append(errList, field.Invalid(fldPath.Child("updated_at").Child("end"), *filter.UpdatedAt.End, "应该大于等于 0"))
	}

	// 同时设置时间更新时间范围的开始时间和结束时间时，检查结束时间是否晚于开始时间
	if filter.UpdatedAt.Start != nil && filter.UpdatedAt.End != nil && *filter.UpdatedAt.End <= *filter.UpdatedAt.Start {
		errList = append(errList, field.Invalid(fldPath.Child("updated_at").Child("end"), *filter.UpdatedAt.End, "应该大于 start"))
	}

	// for i := range filter.IDs {
	// 	if len(filter.IDs[i]) == 36 {
	// 		if _, err := uuid.Parse(filter.IDs[i]); err == nil {
	// 			continue
	// 		}
	// 	}
	// 	errList = append(errList, field.Invalid(fldPath.Child("ids"), filter.IDs[i], "请传入有效的 UUID"))
	// }

	for i := range filter.IDs {
		if len(strings.TrimSpace(filter.IDs[i])) > 0 && len(filter.IDs[i]) <= 36 {
			continue
		}
		errList = append(errList, field.Invalid(fldPath.Child("ids"), filter.IDs[i], "请传入有效的ID"))
	}

	// 关键字待匹配字段
	if len(filter.Fields) > 0 {
		for i := range filter.Fields {
			if filter.Fields[i] != "name" && filter.Fields[i] != "code" && filter.Fields[i] != "description" {
				errList = append(errList, field.NotSupported(fldPath.Child("fields"), filter.Fields[i], []string{"name", "code", "description"}))
				break
			}
		}
	}

	return
}

func ValidateSearchForOperRequestFilter(filter *data_catalog.DataCatalogSearchFilterForOper, fldPath *field.Path) (errList field.ErrorList) {
	// 检查主题域的 ID
	if len(filter.BusinessObjectID) > 0 {
		for _, v := range filter.BusinessObjectID {
			if _, err := uuid.Parse(v); err != nil {
				errList = append(errList, field.Invalid(fldPath.Child("subject_object_id"), v, "请传入有效的 UUID"))
				break
			}
		}
	}

	if len(filter.UpdateCycle) > 0 {
		for _, v := range filter.UpdateCycle {
			if v > 8 || v < 0 {
				errList = append(errList, field.Invalid(fldPath.Child("update_cycle"), filter.UpdateCycle, "更新周期的值只允许1-8"))
			}
		}
	}

	if len(filter.DataRange) > 0 {
		for _, v := range filter.DataRange {
			if v > 3 || v < 0 {
				errList = append(errList, field.Invalid(fldPath.Child("data_range"), filter.DataRange, "数据区域范围的值只允许1-3"))
			}
		}
	}
	if len(filter.SharedType) > 0 {
		for _, v := range filter.SharedType {
			if v > 3 || v < 0 {
				errList = append(errList, field.Invalid(fldPath.Child("share_type"), filter.SharedType, "共享属性的值只允许1-3"))
			}
		}
	}

	// 检查数据资源类型是否未指定，或者是支持的类型
	if len(filter.DataResourceType) > 0 {
		for _, v := range filter.DataResourceType {
			if !supportedDataResourceTypes.Has(v) {
				errList = append(errList, field.NotSupported(fldPath.Child("data_resource_type"), v, sets.List(supportedDataResourceTypes)))
				break
			}
		}
	}

	if len(filter.CateInfoReq) > 0 {
		for _, v := range filter.CateInfoReq {
			if _, err := uuid.Parse(v.CateID); err != nil {
				errList = append(errList, field.Invalid(fldPath.Child("cate_id"), v, "请传入有效的 UUID"))
				break
			}
		}
	}

	if filter.PublishedAt.Start != nil && *filter.PublishedAt.Start < 0 {
		errList = append(errList, field.Invalid(fldPath.Child("published_at").Child("start"), *filter.PublishedAt.Start, "应该大于等于 0"))
	}

	if filter.PublishedAt.End != nil && *filter.PublishedAt.End < 0 {
		errList = append(errList, field.Invalid(fldPath.Child("published_at").Child("end"), *filter.PublishedAt.End, "应该大于等于 0"))
	}

	// 同时设置时间发布时间范围的开始时间和结束时间时，检查结束时间是否晚于开始时间
	if filter.PublishedAt.Start != nil && filter.PublishedAt.End != nil && *filter.PublishedAt.End <= *filter.PublishedAt.Start {
		errList = append(errList, field.Invalid(fldPath.Child("published_at").Child("end"), *filter.PublishedAt.End, "应该大于 start"))
	}

	if filter.OnlineAt.Start != nil && *filter.OnlineAt.Start < 0 {
		errList = append(errList, field.Invalid(fldPath.Child("online_at").Child("start"), *filter.OnlineAt.Start, "应该大于等于 0"))
	}

	if filter.OnlineAt.End != nil && *filter.OnlineAt.End < 0 {
		errList = append(errList, field.Invalid(fldPath.Child("online_at").Child("end"), *filter.OnlineAt.End, "应该大于等于 0"))
	}

	// 同时设置时间上线时间范围的开始时间和结束时间时，检查结束时间是否晚于开始时间
	if filter.OnlineAt.Start != nil && filter.OnlineAt.End != nil && *filter.OnlineAt.End <= *filter.OnlineAt.Start {
		errList = append(errList, field.Invalid(fldPath.Child("online_at").Child("end"), *filter.OnlineAt.End, "应该大于 start"))
	}

	if filter.UpdatedAt.Start != nil && *filter.UpdatedAt.Start < 0 {
		errList = append(errList, field.Invalid(fldPath.Child("updated_at").Child("start"), *filter.UpdatedAt.Start, "应该大于等于 0"))
	}

	if filter.UpdatedAt.End != nil && *filter.UpdatedAt.End < 0 {
		errList = append(errList, field.Invalid(fldPath.Child("updated_at").Child("end"), *filter.UpdatedAt.End, "应该大于等于 0"))
	}

	// 同时设置时间更新时间范围的开始时间和结束时间时，检查结束时间是否晚于开始时间
	if filter.UpdatedAt.Start != nil && filter.UpdatedAt.End != nil && *filter.UpdatedAt.End <= *filter.UpdatedAt.Start {
		errList = append(errList, field.Invalid(fldPath.Child("updated_at").Child("end"), *filter.UpdatedAt.End, "应该大于 start"))
	}

	// for i := range filter.IDs {
	// 	if len(filter.IDs[i]) == 36 {
	// 		if _, err := uuid.Parse(filter.IDs[i]); err == nil {
	// 			continue
	// 		}
	// 	}
	// 	errList = append(errList, field.Invalid(fldPath.Child("ids"), filter.IDs[i], "请传入有效的 UUID"))
	// }

	for i := range filter.IDs {
		if len(strings.TrimSpace(filter.IDs[i])) > 0 && len(filter.IDs[i]) <= 36 {
			continue
		}
		errList = append(errList, field.Invalid(fldPath.Child("ids"), filter.IDs[i], "请传入有效的ID"))
	}

	// 关键字待匹配字段
	if len(filter.Fields) > 0 {
		for i := range filter.Fields {
			if filter.Fields[i] != "name" && filter.Fields[i] != "code" && filter.Fields[i] != "description" {
				errList = append(errList, field.NotSupported(fldPath.Child("fields"), filter.Fields[i], []string{"name", "code", "description"}))
				break
			}
		}
	}

	if len(filter.PublishedStatus) == sets.New(filter.PublishedStatus...).Len() {
		for i := range filter.PublishedStatus {
			if !supportedDataResourcePublishStatus.Has(filter.PublishedStatus[i]) {
				errList = append(errList, field.NotSupported(fldPath.Child("published_status"), filter.DataResourceType, sets.List(supportedDataResourcePublishStatus)))
			}
		}
	} else {
		errList = append(errList, field.Invalid(fldPath.Child("published_status"), filter.PublishedStatus, "不能出现重复的发布状态"))
	}

	if len(filter.OnlineStatus) == sets.New(filter.OnlineStatus...).Len() {
		for i := range filter.OnlineStatus {
			if !supportedDataResourceOnlineStatus.Has(filter.OnlineStatus[i]) {
				errList = append(errList, field.NotSupported(fldPath.Child("online_status"), filter.DataResourceType, sets.List(supportedDataResourceOnlineStatus)))
			}
		}
	} else {
		errList = append(errList, field.Invalid(fldPath.Child("online_status"), filter.OnlineStatus, "不能出现重复的上线状态"))
	}

	return
}
