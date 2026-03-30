package formulas

type JoinConfig struct {
	ConfigFields   []ConfigField   `json:"config_fields"`
	RelationFields []RelationField `json:"relation_field"`
	RelationType   string          `json:"relation_type"`
}

type RelationField struct {
	Alias        string `json:"alias"`
	Id           string `json:"id"`
	Name         string `json:"name"`
	SourceId     string `json:"sourceId"`
	OriginName   string `json:"originName"`
	Checked      bool   `json:"checked"`
	BeEditing    bool   `json:"beEditing"`
	DataType     string `json:"data_type"`
	NodeId       string `json:"nodeId"`
	SourceNodeId string `json:"source_node_id"`
}
