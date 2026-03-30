package formulas

type OutputField struct {
	DataType   string `json:"data_type"`
	NameEn     string `json:"name_en"`
	Id         string `json:"id"`
	SourceId   string `json:"sourceId"`
	Name       string `json:"name"`
	OutId      string `json:"outId,omitempty"`
	OriginName string `json:"originName"`
}

type DistinctConfig struct {
	ConfigFields []ConfigField `json:"config_fields"`
}
