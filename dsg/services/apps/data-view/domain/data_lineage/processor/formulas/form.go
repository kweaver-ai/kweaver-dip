package formulas

type FormConfig struct {
	ConfigFields []ConfigField `json:"config_fields"`
	FormID       string        `json:"form_id"`
	Other        OtherOption   `json:"other"`
}

type OtherOption struct {
	CatalogOptions CatalogOption `json:"catalogOptions"`
}

type CatalogOption struct {
	Id                    string      `json:"id"`
	TechnicalName         string      `json:"technical_name"`
	BusinessName          string      `json:"business_name"`
	UniformCatalogCode    string      `json:"uniform_catalog_code"`
	ViewSourceCatalogName string      `json:"view_source_catalog_name"`
	Fields                []ViewField `json:"fields"`
}

type ViewField struct {
	Id                  string      `json:"id"`
	TechnicalName       string      `json:"technical_name"`
	BusinessName        string      `json:"business_name"`
	Comment             string      `json:"comment"`
	Status              string      `json:"status"`
	PrimaryKey          bool        `json:"primary_key"`
	DataType            string      `json:"data_type"`
	DataLength          int         `json:"data_length"`
	DataAccuracy        int         `json:"data_accuracy"`
	OriginalDataType    string      `json:"original_data_type"`
	IsNullable          string      `json:"is_nullable"`
	BusinessTimestamp   bool        `json:"business_timestamp"`
	StandardCode        string      `json:"standard_code"`
	Standard            string      `json:"standard"`
	StandardType        string      `json:"standard_type"`
	StandardTypeName    string      `json:"standard_type_name"`
	StandardStatus      string      `json:"standard_status"`
	CodeTableId         string      `json:"code_table_id"`
	CodeTable           string      `json:"code_table"`
	CodeTableStatus     string      `json:"code_table_status"`
	IsReadable          bool        `json:"is_readable"`
	IsDownloadable      bool        `json:"is_downloadable"`
	AttributeId         interface{} `json:"attribute_id"`
	AttributeName       string      `json:"attribute_name"`
	AttributePath       string      `json:"attribute_path"`
	LabelId             string      `json:"label_id"`
	LabelName           string      `json:"label_name"`
	LabelIcon           string      `json:"label_icon"`
	LabelPath           string      `json:"label_path"`
	ClassfityType       interface{} `json:"classfity_type"`
	EnableRules         int         `json:"enable_rules"`
	TotalRules          int         `json:"total_rules"`
	ResetBeforeDataType string      `json:"reset_before_data_type"`
	ResetConvertRules   string      `json:"reset_convert_rules"`
	ResetDataLength     int         `json:"reset_data_length"`
	ResetDataAccuracy   int         `json:"reset_data_accuracy"`
	SimpleType          string      `json:"simple_type"`
	Index               int         `json:"index"`
}
