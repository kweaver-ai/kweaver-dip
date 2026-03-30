package data_catalog

type ESIndexMsgEntity struct {
	Type      string          `json:"type"`       // 消息类型，create|update|delete
	Body      *ESIndexMsgBody `json:"body"`       // 消息体
	UpdatedAt int64           `json:"updated_at"` // 目录更新时间，用于异步处理消息发送结果
}

type ESIndexMsgBody struct {
	DocID       string  `json:"docid"`                     // es docid，使用目录编码并将/替换为-，删除时仅需传docid
	Code        string  `json:"code,omitempty"`            // 目录编码
	ID          uint64  `json:"id,string,omitempty"`       // 目录ID
	Title       string  `json:"title,omitempty"`           // 目录名称
	Description string  `json:"description,omitempty"`     // 目录描述
	OrgCode     string  `json:"orgcode,omitempty"`         // 数源单位ID
	OrgName     string  `json:"orgname,omitempty"`         // 数源单位名称
	GroupID     uint64  `json:"group_id,string,omitempty"` // 资源分类ID
	SharedType  int8    `json:"shared_type,omitempty"`     // 共享属性
	DataKind    []int32 `json:"data_kind,omitempty"`       // 基础信息分类
	DataRange   int32   `json:"data_range,omitempty"`      // 数据范围
	UpdateCycle int32   `json:"update_cycle,omitempty"`    // 更新频率
	PublishedAt int64   `json:"published_at,omitempty"`    // 上线时间戳
	UpdatedAt   int64   `json:"updated_at,omitempty"`      // 数据更新时间戳

	OwnerID   string `json:"owner_id,omitempty"` // 数据owner ID
	OwnerName string `json:"owner_name"`         // 数据owner名称
	TableInfo
	MetaInfo

	BusinessObjects []IDNameEntity `json:"business_objects,omitempty"` // 业务对象ID数组，里面ID用于左侧树业务域选中节点筛选
	InfoSystems     []IDNameEntity `json:"info_systems,omitempty"`     // 信息系统数组，里面ID用于左侧树信息系统选中节点筛选

	Fields []*Field `json:"fields"` // 字段列表
}

type TableInfo struct {
	TableID   uint64 `json:"table_id,string,omitempty"` // 库表ID
	TableRows int64  `json:"table_rows,omitempty"`      // 数据量
	TableName string `json:"table_name,omitempty"`      // 库表名称
}

type Field struct {
	FieldNameZH string `json:"field_name_zh"` // 字段中文名称
	FieldNameEN string `json:"field_name_en"` // 字段英文名称
}

type MetaInfo struct {
	SchemaID       string `json:"schema_id"`                // 数据SchemaID
	SchemaName     string `json:"schema_name"`              // 数据Schema名称
	DataSourceID   string `json:"data_source_id,omitempty"` // 数据源ID
	DataSourceName string `json:"data_source_name"`         // 数据源名称
}

type IDNameEntity struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}
