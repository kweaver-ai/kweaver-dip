package dto

type ParamPosition string

const (
	ParamPositionHeader ParamPosition = "header"
	ParamPositionPath   ParamPosition = "path"
	ParamPositionQuery  ParamPosition = "query"
	ParamPositionBody   ParamPosition = "body"
)

type ParamDataType string

const (
	ParamDataTypeString  ParamDataType = "string"
	ParamDataTypeInt     ParamDataType = "int"
	ParamDataTypeLong    ParamDataType = "long"
	ParamDataTypeFloat   ParamDataType = "float"
	ParamDataTypeDouble  ParamDataType = "double"
	ParamDataTypeBoolean ParamDataType = "boolean"
)

const (
	Offset = "offset"
	Limit  = "limit"
)

type QueryReq struct {
	ServicePath string `json:"service_path" uri:"service_path" binding:"required,URL"`
	Params      map[string]*Param
}

type Param struct {
	Value    interface{}   //参数值
	Position ParamPosition //参数位置
	DataType ParamDataType //参数类型
}

func NewParam(value interface{}, position ParamPosition, dataType ParamDataType) *Param {
	return &Param{Value: value, Position: position, DataType: dataType}
}

type QueryTestReq struct {
	Params                  map[string]*Param
	ServiceType             string                   `json:"service_type" binding:"required,oneof=service_generate service_register"` // 接口类型 service_generate 接口生成 service_register 接口注册
	CreateModel             string                   `json:"create_model" binding:"omitempty,oneof=wizard script"`                    // 创建模式 wizard 向导模式 script 脚本模式
	DataTableRequestParams  []DataTableRequestParam  `json:"data_table_request_params" binding:"dive"`                                // 请求参数
	DataTableResponseParams []DataTableResponseParam `json:"data_table_response_params" binding:"dive"`                               // 返回参数
	Rules                   []Rule                   `json:"rules" binding:"omitempty,dive"`                                          // 过滤规则

	// 数据源id
	//
	// Deprecated: 不再需要数据源 ID, 测试接口所需的 catalog 和 scheme 可以通过逻辑视图获取
	DatasourceId string `json:"datasource_id" binding:"omitempty,uuid"`

	DataViewId         string            `json:"data_view_id" binding:"omitempty,uuid"`                                             // 数据视图Id
	Script             string            `json:"script" binding:"omitempty"`                                                        // 脚本（仅脚本模式需要此参数）
	PageSize           int               `json:"page_size" binding:"omitempty,number,min=1,max=1000"`                               // 分页大小
	HTTPMethod         string            `json:"http_method" binding:"omitempty,oneof=post get put delete"`                         // 请求方式 post get put delete
	BackendServiceHost string            `json:"backend_service_host" form:"backend_service_host" binding:"omitempty,HOST,max=128"` // 后台服务域名/IP
	BackendServicePath string            `json:"backend_service_path" form:"backend_service_path" binding:"omitempty,URL,max=128"`  // 后台服务路径
	CurrentRules       *SubServiceDetail `json:"current_rules" form:"current_rules" binding:"omitempty,dive"`                       //当前接口测限定规则，授权管理页面用到的
}

type Rule struct {
	Param    string `json:"param" binding:"omitempty,VerifyNameEn"`                                             // 过滤字段
	Operator string `json:"operator" binding:"omitempty,oneof='=' '!=' '>' '>=' '<' '<=' 'like' 'in' 'not in'"` // 运算逻辑 = 等于, != 不等于, > 大于, >= 大于等于, < 小于, <= 小于等于, like 模糊匹配, in 包含, not in 不包含
	Value    string `json:"value" binding:"omitempty,VerifyDescription,max=128"`                                // 过滤值
}

type QueryTestRes struct {
	Request  interface{} `json:"request"`  // 请求详情
	Response interface{} `json:"response"` // 返回内容
}

type DataTableRequestParam struct {
	CNName       string `json:"cn_name" binding:"omitempty,VerifyDescription,max=255"`                              // 中文名称
	EnName       string `json:"en_name" binding:"required,max=255"`                                                 // 英文名称
	DataType     string `json:"data_type" binding:"required,oneof=string int long float double boolean"`            // 字段类型
	Required     string `json:"required" binding:"omitempty,oneof=yes no"`                                          // 是否必填 yes 必填 no非必填
	Operator     string `json:"operator" binding:"omitempty,oneof='=' '!=' '>' '>=' '<' '<=' 'like' 'in' 'not in'"` // 运算逻辑 = 等于, != 不等于, > 大于, >= 大于等于, < 小于, <= 小于等于, like 模糊匹配, in 包含, not in 不包含
	DefaultValue string `json:"default_value" binding:"omitempty,VerifyDescription,max=128"`                        // 默认值
	Description  string `json:"description" binding:"omitempty,VerifyDescription,max=255"`                          // 描述
}

type DataTableResponseParam struct {
	CNName      string `json:"cn_name" binding:"omitempty,VerifyDescription,max=255"`                    // 中文名称
	EnName      string `json:"en_name" binding:"required,max=255"`                                       // 英文名称
	DataType    string `json:"data_type" binding:"omitempty,oneof=string int long float double boolean"` // 字段类型
	Description string `json:"description" binding:"omitempty,VerifyDescription,max=255"`                // 描述
	Sort        string `json:"sort" binding:"omitempty,oneof=unsorted asc desc"`                         // 排序方式 unsorted 不排序 asc 升序 desc 降序 默认 unsorted
	Masking     string `json:"masking" binding:"omitempty,oneof=plaintext hash override replace"`        // 脱敏规则 plaintext 不脱敏 hash 哈希 override 覆盖 replace 替换 默认 plaintext
	Sequence    int64  `json:"sequence" binding:"omitempty,number,min=1"`                                // 序号
}

// SubServiceDetail 接口行列规则详情
type SubServiceDetail struct {
	//固定的字段ID
	ScopeFields []string `json:"scope_fields"`
	// 行过滤规则
	RowFilters RowFilters `json:"row_filters,omitempty"`
	//固定的行过滤规则
	FixedRowFilters *RowFilters `json:"fixed_row_filters,omitempty"`
}

// Field 列、字段
type Field struct {
	ID       string `json:"id,omitempty"`
	Name     string `json:"name,omitempty"`
	NameEn   string `json:"name_en,omitempty"`
	DataType string `json:"data_type,omitempty"`
}

// RowFilters 行过滤条件
type RowFilters struct {
	// 条件组间关系
	WhereRelation string `json:"where_relation,omitempty"`
	// 条件组列表
	Where []Where `json:"where,omitempty"`
}

// Where 过滤条件
type Where struct {
	// 限定对象
	Member []Member `json:"member,omitempty"`
	// 限定关系
	Relation string `json:"relation,omitempty"`
}

type Member struct {
	Field `json:",inline"`
	// 限定条件
	Operator string `json:"operator,omitempty"`
	// 限定比较值
	Value string `json:"value,omitempty"`
}
