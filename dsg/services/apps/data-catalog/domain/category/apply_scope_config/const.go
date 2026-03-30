package apply_scope_config

// 固定的模块清单，不依赖 t_apply_scope 表。
// 注意：ID 使用稳定的 UUID，供前后端与关系表引用。

type ScopeDef struct {
	ID   string
	Name string
}

type ModuleTreeDef struct {
	Key         string
	Name        string
	NodeNames   []string
	ParentNames []string
}

var (
	ScopeInterfaceService    = ScopeDef{ID: "00000000-0000-0000-0000-000000000001", Name: "接口服务管理"}
	ScopeDataResourceCatalog = ScopeDef{ID: "00000000-0000-0000-0000-000000000002", Name: "数据资源目录"}
	ScopeInfoResourceCatalog = ScopeDef{ID: "00000000-0000-0000-0000-000000000003", Name: "信息资源目录"}
	DefaultApplyScopes       = []ScopeDef{ScopeInterfaceService, ScopeDataResourceCatalog, ScopeInfoResourceCatalog}
	ModuleTreeDefs           = map[string][]ModuleTreeDef{
		ScopeInterfaceService.ID: {
			{Key: "interface_service_left", Name: "接口服务管理左侧树", NodeNames: []string{"接口列表左侧树"}, ParentNames: []string{"接口服务管理"}},
			{Key: "market_left", Name: "数据服务超市左侧树", NodeNames: []string{"数据服务超市左侧树"}, ParentNames: []string{"接口服务管理"}},
		},
		ScopeDataResourceCatalog.ID: {
			{Key: "data_resource_left", Name: "数据资源目录左侧树", NodeNames: []string{"数据资源目录左侧树"}, ParentNames: []string{"数据资源目录"}},
			{Key: "market_left", Name: "数据服务超市左侧树", NodeNames: []string{"数据服务超市左侧树"}, ParentNames: []string{"数据资源目录"}},
		},
		ScopeInfoResourceCatalog.ID: {
			{Key: "info_resource_left", Name: "信息资源目录左侧树", NodeNames: []string{"信息资源目录左侧树"}, ParentNames: []string{"信息资源目录"}},
		},
	}
)
