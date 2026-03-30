package formulas

type SQLConfig struct {
	Sql          SQLDetail     `json:"sql"`
	SqlOrigin    string        `json:"sql_origin"`
	ConfigFields []ConfigField `json:"config_fields"`
	SqlFieldArr  []string      `json:"sqlFieldArr"`
	SqlTableArr  []string      `json:"sqlTableArr"`
	SqlTextArr   []interface{} `json:"sqlTextArr"`
}

type SQLDetail struct {
	SQLInfo `json:"sql_info"`
}

type SQLInfo struct {
	SqlStr string `json:"sql_str"`
}
