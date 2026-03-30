package agentretrieval

// QueryObjectInstanceRequest 查询对象实例请求
type QueryObjectInstanceRequest struct {
	Limit      int         `json:"limit"`
	Condition  Condition   `json:"condition"`
}

type Condition struct {
	Operation     string          `json:"operation"`
	SubConditions []SubCondition `json:"sub_conditions"`
}

type SubCondition struct {
	Field     string `json:"field"`
	Operation string `json:"operation"`
	ValueFrom string `json:"value_from"`
	Value     string `json:"value"`
}

// QueryObjectInstanceResponse 查询对象实例响应
type QueryObjectInstanceResponse struct {
	StatusCode int           `json:"status_code"`
	Datas      []InstanceData `json:"datas"`
}

type InstanceData struct {
	FormViewId string `json:"form_view_id"`
	ObjectName string `json:"object_name"`
	ObjectType int    `json:"object_type"`
	MdlId      string `json:"mdl_id"`
	InstanceId string `json:"_instance_id"`
	Display    string `json:"_display"`
	Id         string `json:"id"`
}
