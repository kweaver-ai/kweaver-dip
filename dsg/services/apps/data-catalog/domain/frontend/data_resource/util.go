package data_resource

import (
	"fmt"

	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/auth_service"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util/sets"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// dataResourceTypesFromFilterType 返回需要搜索的数据资源的类型列表，未指定时搜索所有类型
func dataResourceTypesFromFilterType(t DataResourceType) []DataResourceType {
	if t == "" {
		return sets.List(SupportedDataResourceTypes)
	}

	return []DataResourceType{t}
}

// ObjectTypesFromDataResourceTypes 转换 []DataResourceType -> []auth_service.ObjectType
func ObjectTypesFromDataResourceTypes(types []DataResourceType) (result []auth_service.ObjectType) {
	for _, t := range types {
		b, err := dataResourceTypeObjectTypePolicyActionBindingFromDataResourceType(t)
		if err != nil {
			continue
		}
		result = append(result, b.objectType)
	}
	return
}

// dataResourceTypeObjectTypePolicyActionBinding 根据 DataResourceType 返回 dataResourceTypeObjectTypePolicyActionBinding
func dataResourceTypeObjectTypePolicyActionBindingFromDataResourceType(t DataResourceType) (*dataResourceTypeObjectTypePolicyActionBinding, error) {
	for _, b := range dataResourceTypeObjectTypePolicyActionBindings {
		if b.dataResourceType != t {
			continue
		}
		return &b, nil
	}
	return nil, fmt.Errorf("dataResourceTypeObjectTypePolicyActionBinding for DataResourceType %q is not found", t)
}

// dataResourceTypeObjectTypePolicyActionBinding 根据 auth_service.ObjectType 返回 dataResourceTypeObjectTypePolicyActionBinding
func dataResourceTypeObjectTypePolicyActionBindingFromObjectType(t auth_service.ObjectType) (*dataResourceTypeObjectTypePolicyActionBinding, error) {
	for _, b := range dataResourceTypeObjectTypePolicyActionBindings {
		if b.objectType != t {
			continue
		}
		return &b, nil
	}
	return nil, fmt.Errorf("dataResourceTypeObjectTypePolicyActionBinding for ObjectType %q is not found", t)
}

type objectTypeBinding struct {
	// data-catalog 定义的资源类型
	DataResourceType DataResourceType `json:"data_resource_type_data_view,omitempty"`
	// auth-service 定义的资源类型
	ObjectType auth_service.ObjectType `json:"object_type,omitempty"`
}

var objectTypeBindings = []objectTypeBinding{
	// 逻辑视图
	{
		DataResourceType: DataResourceTypeDataView,
		ObjectType:       auth_service.ObjectTypeDataView,
	},
	// 接口
	{
		DataResourceType: DataResourceTypeInterface,
		ObjectType:       auth_service.ObjectTypeAPI,
	},
	// 指标
	{
		DataResourceType: DataResourceTypeIndicator,
		ObjectType:       auth_service.ObjectTypeIndicator,
	},
}

func objectTypeForDataSourceType(dst DataResourceType) auth_service.ObjectType {
	for _, b := range objectTypeBindings {
		if b.DataResourceType == dst {
			return b.ObjectType
		}
	}
	log.Warn("unsupported data resource type", zap.Any("type", dst))
	return ""
}
