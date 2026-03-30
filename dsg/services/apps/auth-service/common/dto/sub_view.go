package dto

type SubView struct {
	ID string `json:"id,omitempty" example:"0194078b-5413-7022-a7a8-75a820dbf994"`

	SubViewSpec `json:",inline"`
}

type SubViewSpec struct {
	// 行列规则（子视图）名称
	Name string `json:"name,omitempty" example:"北区数据"`
	//授权范围
	AuthScopeID string `json:"auth_scope_id"`
	// 行列规则（子视图）所属的逻辑视图 ID
	LogicViewID string `json:"logic_view_id,omitempty" example:"0194077d-2290-7387-b505-ac3208b20087"`
	// 行列规则（子视图）的详细定义，JSON 字符串
	Detail string `json:"detail,omitempty" example:"{\"fields\":[{\"id\":\"84d26012-e586-4559-93c3-42e1caa49707\",\"name_en\":\"a1611\",\"name\":\"a1611\",\"data_type\":\"int\"}],\"row_filters\":{\"where\":[],\"where_relation\":\"and\"}}"`
}
