package resources

import (
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/middleware"
	auth_service "github.com/kweaver-ai/idrm-go-common/rest/auth-service"
	"github.com/kweaver-ai/idrm-go-common/rest/authorization"
	"github.com/samber/lo"
)

var obligationTypeReq = &authorization.ObligationTypeReq{
	Name: "语义治理义务",
	Schema: authorization.Schema{
		Type: "object",
		Properties: authorization.SchemaProperties{
			Scope: authorization.ScopeSchema{
				Type:        "string",
				Description: "语义治理调用的接口的数据范围的义务类型",
				Title:       "接口数据范围",
				Enum: []string{
					middleware.SCOPE_DEPARTMENT,
					middleware.SCOPE_ALL,
					middleware.SCOPE_SELF,
				},
				EnumNames: []string{
					middleware.SCOPE_CN_DEPARTMENT,
					middleware.SCOPE_CN_ALL,
					middleware.SCOPE_CN_SELF,
				},
				Default: "all",
			},
		},
		Required: []string{
			"scope",
		},
	},
	ApplicableResourceTypes: authorization.ApplicableResourceTypes{
		Unlimited: false,
		ResourceTypes: []authorization.ObligationResourceType{
			{
				ID: authorization.RESOURCE_TYPE_MENUS,
				ApplicableOperations: authorization.ApplicableOperations{
					Unlimited: false,
					Operations: []any{
						*lo.ToPtr(map[string]any{
							"id": auth_service.ActionRead.String,
						}),
					},
				},
			},
			{
				ID: authorization.RESOURCE_SMART_DATA_FIND,
				ApplicableOperations: authorization.ApplicableOperations{
					Unlimited: false,
					Operations: []any{
						*lo.ToPtr(map[string]any{
							"id": auth_service.ActionRead.String,
						}),
					},
				},
			},
		},
	},
	Description: "string",
	DefaultValue: authorization.DefaultValue{
		Scope: middleware.SCOPE_ALL,
	},
}

var policyConfigReq = []*authorization.CreatePolicyReq{
	{
		Accessor: authorization.Accessor{
			ID:   "00000000-0000-0000-0000-000000000000",
			Type: "department",
		},
		Resource: authorization.ResourceObject{
			ID:   "*",
			Type: authorization.RESOURCE_TYPE_MENUS,
			Name: "语义治理",
		},
		Operation: authorization.AuthOperation{
			Allow: []*authorization.OperationObject{
				{
					ID:          auth_service.ActionRead.String,
					Name:        "展示",
					Description: "展示资源实例",
					Obligations: []authorization.ObligationItem{
						{
							TypeId: authorization.OBLIGATION_TYPE_IDRM_DATA,
							Value: map[string]any{
								interception.PermissionScope: middleware.SCOPE_ALL,
							},
						},
					},
				},
			},
			Deny: []*authorization.OperationObject{},
		},
		ExpiresAt: "1970-01-01T08:00:00+08:00",
	},
	{
		Accessor: authorization.Accessor{
			ID:   "00000000-0000-0000-0000-000000000000",
			Type: "department",
		},
		Resource: authorization.ResourceObject{
			ID:   "*",
			Type: authorization.RESOURCE_SMART_DATA_FIND,
			Name: "智能找数",
		},
		Operation: authorization.AuthOperation{
			Allow: []*authorization.OperationObject{
				{
					ID:          auth_service.ActionRead.String,
					Name:        "展示",
					Description: "展示资源实例",
					Obligations: []authorization.ObligationItem{
						{
							TypeId: authorization.OBLIGATION_TYPE_IDRM_DATA,
							Value: map[string]any{
								interception.PermissionScope: middleware.SCOPE_ALL,
							},
						},
					},
				},
			},
			Deny: []*authorization.OperationObject{},
		},
		ExpiresAt: "1970-01-01T08:00:00+08:00",
	},
}
