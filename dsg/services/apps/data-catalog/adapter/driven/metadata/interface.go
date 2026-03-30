package metadata

type Repo interface {
	//GetDataSource(ctx context.Context, dataSourceID string) (*DataSourceInfo, error)
	//GetTableFieldsList(ctx context.Context, req []*GetTableFieldsListReq) (*GetTableFieldsListResp, error)
}

type GetDataSourceResp struct {
	Code        string          `json:"code"`
	Description string          `json:"description"`
	Data        *DataSourceInfo `json:"data"`
}

type DataSourceInfo struct {
	DataSourceType     int    `json:"data_source_type"`      // 数据源类型
	DataSourceTypeName string `json:"data_source_type_name"` // 数据源类型名称
	ID                 int    `json:"id"`
	Name               string `json:"name"`        // 数据源名称
	Description        string `json:"description"` // 数据源描述
	UserName           string `json:"user_name"`   // 用户名
	Host               string `json:"host"`        // ip地址
	Port               int    `json:"port"`        // 端口
	Password           string `json:"-"`
	DatabaseName       string `json:"database_name"` // 数据库名
}

/*

{
    "code":"0",
    "description":"success",
    "data":{
        "data_source_type":1,
        "data_source_type_name":"数据源类型名称",
        "id":1,
        "name":"数据源名称",
        "description":"数据源描述",
        "user_name":"用户名",
        "password":"密码",
        "host":"ip地址",
        "port":"端口",
        "extend_property":"扩展属性",
        "enable_status":1,
        "connect_status":1
    }
}

*/

type GetTableFieldsListReq struct {
	DSID     string `json:"ds_id"`
	DBName   string `json:"db_name"`
	DBSchema string `json:"db_schema"`
	TBName   string `json:"tb_name"`
}

type GetTableFieldsListResp struct {
	Code        string         `json:"code"`
	Description string         `json:"description"`
	Data        []*TableFields `json:"data"`
}

type TableFields struct {
	DSID     string    `json:"ds_id"`
	DBName   string    `json:"db_name"`
	DBSchema string    `json:"db_schema"`
	TBName   string    `json:"tb_name"`
	Fields   []*Fields `json:"fields"`
}

type Fields struct {
	FieldName      string `json:"field_name"`
	FieldType      string `json:"field_type"`
	PrimaryKeyFlag bool   `json:"primary_key"`
}
