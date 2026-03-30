package info_system

// SearchRequest 代表搜索信息系统的请求
//
// Deprecated: Use GoCommon/api/data_catalog/v1/frontend
type SearchRequest struct {
	// 关键字
	Keyword string `json:"keyword,omitempty"`
	// 过滤器，未指定代表不过滤
	Filter *SearchFilter `json:"filter,omitempty"`
	// TODO: 参考 OpenSearch 的分页参数
	Continue string `json:"continue,omitempty"`
}

// SearchFilter 代表搜索信息系统的过滤器
//
// Deprecated: Use GoCommon/api/data_catalog/v1/frontend
type SearchFilter struct {
	// 部门 ID，过滤属于指定部门及其子部门的信息系统。未指定代表不过滤。空字符串
	// 代表过滤未属于任何部门的信息系统。
	DepartmentID string `json:"department_id,omitempty"`
}

// SearchResponse 代表搜索信息系统的响应
//
// Deprecated: Use GoCommon/api/data_catalog/v1/frontend
type SearchResponse struct {
	Entries    []InfoSystem `json:"entries"`
	TotalCount int          `json:"total_count"`
}

// InfoSystem 代表一条信息系统的搜索结果
//
// Deprecated: Use GoCommon/api/data_catalog/v1/frontend
type InfoSystem struct {
	// ID
	ID string `json:"id,omitempty"`
	// 带有高亮标签的名称
	Name string `json:"name,omitempty"`
	// 名称
	RawName string `json:"raw_name,omitempty"`
	// 带有高亮标签的描述
	Description string `json:"description,omitempty"`
	// 描述
	RawDescription string `json:"raw_description,omitempty"`
	// 所属部门的 ID，未指定、空字符串代表不属于任何部门。
	DepartmentID string `json:"department_id,omitempty"`
	// 所属部门的完整路径，未指定、空字符传代表不属于任何部门。
	DepartmentPath string `json:"department_path,omitempty"`
}
