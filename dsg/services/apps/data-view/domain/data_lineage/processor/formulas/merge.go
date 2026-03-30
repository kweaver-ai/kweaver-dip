package formulas

type MergeConfig struct {
	ConfigFields []ConfigField `json:"config_fields"`
	Merge        *Merge        `json:"merge,omitempty"`
}

type ConfigField struct {
	Alias        string `json:"alias"`
	Id           string `json:"id"`
	DataType     string `json:"data_type"`
	OriginName   string `json:"originName"`
	SourceId     string `json:"sourceId"`
	NameEn       string `json:"name_en"`
	FormulaId    string `json:"formulaId"`
	Name         string `json:"name"`
	SourceNodeId string `json:"source_node_id"`
}

type Merge struct {
	Deduplicate bool        `json:"deduplicate"`
	Nodes       []MergeNode `json:"nodes"`
}

type MergeNode struct {
	Fields       []ConfigField `json:"fields"`
	SourceNodeId string        `json:"source_node_id"`
}


