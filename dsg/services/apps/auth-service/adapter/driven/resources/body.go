package resources

import (
	"github.com/kweaver-ai/idrm-go-common/rest/authorization"
)

var resourceBodyMap = map[string]*authorization.ResourceConfig{
	authorization.API_RESOURCE_NAME:         idrmApi,
	authorization.SUB_SERVICE_RESOURCE_NAME: idrmApiRowRule,
	authorization.RESOURCE_TYPE_MENUS:       idrmMenus,            //数据语义治理
	authorization.RESOURCE_SMART_DATA_QUERY: smartDataQueryMenus,  //智能问数
	authorization.RESOURCE_SMART_DATA_FIND:  smartDataSearchMenus, //智能找数
}

var smartDataSearchMenus = &authorization.ResourceConfig{
	ID:          authorization.RESOURCE_SMART_DATA_FIND,
	Name:        "智能找数",
	Description: "iDRM智能找数菜单资源",
	InstanceUrl: resourceInstanceURL(authorization.RESOURCE_SMART_DATA_FIND),
	DataStruct:  "tree",
	Operation: []authorization.ResourceOperation{
		{
			ID:          auth_service.ActionCreate.String,
			Name:        []authorization.ResourceOperationName{{"zh-cn", auth_service.ActionCreate.Display}},
			Description: auth_service.ActionCreate.Display,
			Scope:       []string{"type", "instance"},
		},
		{
			ID:          auth_service.ActionUpdate.String,
			Name:        []authorization.ResourceOperationName{{"zh-cn", auth_service.ActionUpdate.Display}},
			Description: auth_service.ActionUpdate.Display,
			Scope:       []string{"type", "instance"},
		},
		{
			ID:          auth_service.ActionRead.String,
			Name:        []authorization.ResourceOperationName{{"zh-cn", auth_service.ActionRead.Display}},
			Description: auth_service.ActionRead.Display,
			Scope:       []string{"type", "instance"},
		},
		{
			ID:          auth_service.ActionDelete.String,
			Name:        []authorization.ResourceOperationName{{"zh-cn", auth_service.ActionDelete.Display}},
			Description: auth_service.ActionDelete.Display,
			Scope:       []string{"type", "instance"},
		},
		{
			ID:          auth_service.ActionImport.String,
			Name:        []authorization.ResourceOperationName{{"zh-cn", auth_service.ActionImport.Display}},
			Description: auth_service.ActionImport.Display,
			Scope:       []string{"type", "instance"},
		},
		{
			ID:          auth_service.ActionOffline.String,
			Name:        []authorization.ResourceOperationName{{"zh-cn", auth_service.ActionOffline.Display}},
			Description: auth_service.ActionOffline.Display,
			Scope:       []string{"type", "instance"},
		},
		{
			ID:          auth_service.ActionOnline.String,
			Name:        []authorization.ResourceOperationName{{"zh-cn", auth_service.ActionOnline.Display}},
			Description: auth_service.ActionOnline.Display,
			Scope:       []string{"type", "instance"},
		},
	},
}

var smartDataQueryMenus = &authorization.ResourceConfig{
	ID:          authorization.RESOURCE_SMART_DATA_QUERY,
	Name:        "智能问数",
	Description: "智能问数菜单资源",
	InstanceUrl: resourceInstanceURL(authorization.RESOURCE_SMART_DATA_QUERY),
	DataStruct:  "tree",
	Operation: []authorization.ResourceOperation{
		{
			ID:          auth_service.ActionClassify.String,
			Name:        []authorization.ResourceOperationName{{"zh-cn", auth_service.ActionClassify.Display}},
			Description: auth_service.ActionClassify.Display,
			Scope:       []string{"type", "instance"},
		},
		{
			ID:          auth_service.ActionOffline.String,
			Name:        []authorization.ResourceOperationName{{"zh-cn", auth_service.ActionOffline.Display}},
			Description: auth_service.ActionOffline.Display,
			Scope:       []string{"type", "instance"},
		},
		{
			ID:          auth_service.ActionOnline.String,
			Name:        []authorization.ResourceOperationName{{"zh-cn", auth_service.ActionOnline.Display}},
			Description: auth_service.ActionOnline.Display,
			Scope:       []string{"type", "instance"},
		},
	},
}

var idrmMenus = &authorization.ResourceConfig{
	ID:          authorization.RESOURCE_TYPE_MENUS,
	Name:        "数据语义治理",
	Description: "数据语义治理菜单资源",
	InstanceUrl: resourceInstanceURL(authorization.RESOURCE_TYPE_MENUS),
	DataStruct:  "tree",
	Operation: []authorization.ResourceOperation{
		{
			ID:          auth_service.ActionCreate.String,
			Name:        []authorization.ResourceOperationName{{"zh-cn", auth_service.ActionCreate.Display}},
			Description: auth_service.ActionCreate.Display,
			Scope:       []string{"type", "instance"},
		},
		{
			ID:          auth_service.ActionUpdate.String,
			Name:        []authorization.ResourceOperationName{{"zh-cn", auth_service.ActionUpdate.Display}},
			Description: auth_service.ActionUpdate.Display,
			Scope:       []string{"type", "instance"},
		},
		{
			ID:          auth_service.ActionRead.String,
			Name:        []authorization.ResourceOperationName{{"zh-cn", auth_service.ActionRead.Display}},
			Description: auth_service.ActionRead.Display,
			Scope:       []string{"type", "instance"},
		},
		{
			ID:          auth_service.ActionDelete.String,
			Name:        []authorization.ResourceOperationName{{"zh-cn", auth_service.ActionDelete.Display}},
			Description: auth_service.ActionDelete.Display,
			Scope:       []string{"type", "instance"},
		},
		{
			ID:          auth_service.ActionImport.String,
			Name:        []authorization.ResourceOperationName{{"zh-cn", auth_service.ActionImport.Display}},
			Description: auth_service.ActionImport.Display,
			Scope:       []string{"type", "instance"},
		},
		{
			ID:          auth_service.ActionOffline.String,
			Name:        []authorization.ResourceOperationName{{"zh-cn", auth_service.ActionOffline.Display}},
			Description: auth_service.ActionOffline.Display,
			Scope:       []string{"type", "instance"},
		},
		{
			ID:          auth_service.ActionOnline.String,
			Name:        []authorization.ResourceOperationName{{"zh-cn", auth_service.ActionOnline.Display}},
			Description: auth_service.ActionOnline.Display,
			Scope:       []string{"type", "instance"},
		},
	},
}

var idrmApi = &authorization.ResourceConfig{
	ID:          authorization.API_RESOURCE_NAME,
	Name:        "iDRM接口服务",
	Description: "iDRM接口服务的配置信息",
	InstanceUrl: "GET /api/mdl-data-model/v1/resources?resource_type=data_view",
	DataStruct:  "string",
	Operation: []authorization.ResourceOperation{
		{
			ID: "read",
			Name: []authorization.ResourceOperationName{
				{"zh-cn", "读取"},
				{"en-us", "read"},
				{"zh-tw", "读取"},
			},
			Description: "读取或应用接口服务",
			Scope:       []string{"type", "instance"},
		},
		{
			ID: "download",
			Name: []authorization.ResourceOperationName{
				{"zh-cn", "下载"},
				{"en-us", "download"},
				{"zh-tw", "下載"},
			},
			Description: "下载接口服务",
			Scope:       []string{"type", "instance"},
		},
		{
			ID: "auth",
			Name: []authorization.ResourceOperationName{
				{"zh-cn", "授权"},
				{"en-us", "auth"},
				{"zh-tw", "授權"},
			},
			Description: "授权接口服务",
			Scope:       []string{"type", "instance"},
		},
		{
			ID: "allocate",
			Name: []authorization.ResourceOperationName{
				{"zh-cn", "授权仅分配"},
				{"en-us", "allocate"},
				{"zh-tw", "授權僅分配"},
			},
			Description: "授权仅分配接口服务",
			Scope:       []string{"type", "instance"},
		},
	},
}

var idrmApiRowRule = &authorization.ResourceConfig{
	ID:          authorization.SUB_SERVICE_RESOURCE_NAME,
	Name:        "接口限定规则",
	Description: "接口限定规则的配置信息",
	InstanceUrl: "GET /api/mdl-data-model/v1/resources?resource_type=data_view_row_column_rule",
	DataStruct:  "string",
	Operation: []authorization.ResourceOperation{
		{
			ID: "read",
			Name: []authorization.ResourceOperationName{
				{"zh-cn", "读取"},
				{"en-us", "read"},
				{"zh-tw", "读取"},
			},
			Description: "读取或应用接口服务",
			Scope:       []string{"type", "instance"},
		},
		{
			ID: "download",
			Name: []authorization.ResourceOperationName{
				{"zh-cn", "下载"},
				{"en-us", "download"},
				{"zh-tw", "下載"},
			},
			Description: "下载接口服务",
			Scope:       []string{"type", "instance"},
		},
		{
			ID: "auth",
			Name: []authorization.ResourceOperationName{
				{"zh-cn", "授权"},
				{"en-us", "auth"},
				{"zh-tw", "授權"},
			},
			Description: "授权接口服务",
			Scope:       []string{"type", "instance"},
		},
		{
			ID: "allocate",
			Name: []authorization.ResourceOperationName{
				{"zh-cn", "授权仅分配"},
				{"en-us", "allocate"},
				{"zh-tw", "授權僅分配"},
			},
			Description: "授权仅分配接口服务",
			Scope:       []string{"type", "instance"},
		},
	},
}
