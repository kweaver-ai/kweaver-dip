package v1

import (
	"strings"

	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util/sets"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util/validation/field"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/frontend/data_resource"
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
	data_resource.DataResourceTypeDataView,
	data_resource.DataResourceTypeInterface,
	data_resource.DataResourceTypeIndicator,
)

// 所有支持搜索的数据资源发布状态
var supportedDataResourcePublishStatus = sets.New(
	data_resource.DRPS_UNPUBLISHED,
	data_resource.DRPS_PUB_AUDITING,
	data_resource.DRPS_PUBLISHED,
	data_resource.DRPS_PUB_REJECT,
	data_resource.DRPS_CHANGE_AUDITING,
	data_resource.DRPS_CHANGE_REJECT,
)

// 所有支持搜索的数据资源上线状态
var supportedDataResourceOnlineStatus = sets.New(
	data_resource.DROS_NOT_ONLINE,
	data_resource.DROS_ONLINE,
	data_resource.DROS_OFFLINE,
	data_resource.DROS_UP_AUDITING,
	data_resource.DROS_DOWN_AUDITING,
	data_resource.DROS_UP_REJECT,
	data_resource.DROS_DOWN_REJECT,
)

// 所有支持搜索的接口服务类型
var supportedAPITypes = sets.New(
	data_resource.APITypeGenerate,
	data_resource.APITypeRegister,
)

// 验证搜索请求的过滤器
func ValidateSearchRequestFilter(filter *data_resource.Filter, fldPath *field.Path) (errList field.ErrorList) {
	// 检查主题域的 ID
	if filter.SubjectDomainID != "" && filter.SubjectDomainID != data_resource.UncategorizedSubjectDomainID {
		if _, err := uuid.Parse(filter.SubjectDomainID); err != nil {
			errList = append(errList, field.Invalid(fldPath.Child("subject_domain_id"), filter.SubjectDomainID, "请传入有效的 UUID"))
		}
	}

	// 检查部门的 ID
	if filter.DepartmentID != "" && filter.DepartmentID != data_resource.UncategorizedDepartmentID {
		if _, err := uuid.Parse(filter.DepartmentID); err != nil {
			errList = append(errList, field.Invalid(fldPath.Child("department_id"), filter.DepartmentID, "请传入有效的 UUID"))
		}
	}

	// 检查数据资源类型是否未指定，或者是支持的类型
	if filter.Type != "" && !supportedDataResourceTypes.Has(filter.Type) {
		errList = append(errList, field.NotSupported(fldPath.Child("type"), filter.Type, sets.List(supportedDataResourceTypes)))
	}
	// 检查接口服务类型
	if filter.APIType != "" && !supportedAPITypes.Has(filter.APIType) {
		errList = append(errList, field.NotSupported(fldPath.Child("api_type"), filter.APIType, sets.List(supportedAPITypes)))
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
		errList = append(errList, field.Invalid(fldPath.Child("online_at").Child("start"), *filter.PublishedAt.Start, "应该大于等于 0"))
	}

	if filter.OnlineAt.End != nil && *filter.OnlineAt.End < 0 {
		errList = append(errList, field.Invalid(fldPath.Child("online_at").Child("end"), *filter.PublishedAt.End, "应该大于等于 0"))
	}

	// 同时设置时间上线时间范围的开始时间和结束时间时，检查结束时间是否晚于开始时间
	if filter.OnlineAt.Start != nil && filter.OnlineAt.End != nil && *filter.OnlineAt.End <= *filter.OnlineAt.Start {
		errList = append(errList, field.Invalid(fldPath.Child("online_at").Child("end"), *filter.OnlineAt.End, "应该大于 start"))
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

func ValidateSearchForOperRequestFilter(filter *data_resource.FilterForOper, fldPath *field.Path) (errList field.ErrorList) {
	// 检查主题域的 ID
	if filter.SubjectDomainID != "" && filter.SubjectDomainID != data_resource.UncategorizedSubjectDomainID {
		if _, err := uuid.Parse(filter.SubjectDomainID); err != nil {
			errList = append(errList, field.Invalid(fldPath.Child("subject_domain_id"), filter.SubjectDomainID, "请传入有效的 UUID"))
		}
	}

	// 检查部门的 ID
	if filter.DepartmentID != "" && filter.DepartmentID != data_resource.UncategorizedDepartmentID {
		if _, err := uuid.Parse(filter.DepartmentID); err != nil {
			errList = append(errList, field.Invalid(fldPath.Child("department_id"), filter.DepartmentID, "请传入有效的 UUID"))
		}
	}

	// 检查数据资源类型是否未指定，或者是支持的类型
	if filter.Type != "" && !supportedDataResourceTypes.Has(filter.Type) {
		errList = append(errList, field.NotSupported(fldPath.Child("type"), filter.Type, sets.List(supportedDataResourceTypes)))
	}
	// 检查接口服务类型
	if filter.APIType != "" && !supportedAPITypes.Has(filter.APIType) {
		errList = append(errList, field.NotSupported(fldPath.Child("api_type"), filter.APIType, sets.List(supportedAPITypes)))
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
		errList = append(errList, field.Invalid(fldPath.Child("online_at").Child("start"), *filter.PublishedAt.Start, "应该大于等于 0"))
	}

	if filter.OnlineAt.End != nil && *filter.OnlineAt.End < 0 {
		errList = append(errList, field.Invalid(fldPath.Child("online_at").Child("end"), *filter.PublishedAt.End, "应该大于等于 0"))
	}

	// 同时设置时间上线时间范围的开始时间和结束时间时，检查结束时间是否晚于开始时间
	if filter.OnlineAt.Start != nil && filter.OnlineAt.End != nil && *filter.OnlineAt.End <= *filter.OnlineAt.Start {
		errList = append(errList, field.Invalid(fldPath.Child("online_at").Child("end"), *filter.OnlineAt.End, "应该大于 start"))
	}

	if len(filter.PublishedStatus) == sets.New(filter.PublishedStatus...).Len() {
		for i := range filter.PublishedStatus {
			if !supportedDataResourcePublishStatus.Has(filter.PublishedStatus[i]) {
				errList = append(errList, field.NotSupported(fldPath.Child("published_status"), filter.Type, sets.List(supportedDataResourcePublishStatus)))
			}
		}
	} else {
		errList = append(errList, field.Invalid(fldPath.Child("published_status"), filter.PublishedStatus, "不能出现重复的发布状态"))
	}

	if len(filter.OnlineStatus) == sets.New(filter.OnlineStatus...).Len() {
		for i := range filter.OnlineStatus {
			if !supportedDataResourceOnlineStatus.Has(filter.OnlineStatus[i]) {
				errList = append(errList, field.NotSupported(fldPath.Child("online_status"), filter.Type, sets.List(supportedDataResourceOnlineStatus)))
			}
		}
	} else {
		errList = append(errList, field.Invalid(fldPath.Child("online_status"), filter.OnlineStatus, "不能出现重复的上线状态"))
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
