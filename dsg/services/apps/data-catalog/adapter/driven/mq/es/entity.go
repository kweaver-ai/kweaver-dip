package es

//region catalog

type ESIndexMsgEntity struct {
	Type      string          `json:"type"`       // 消息类型，create|delete|apply
	Body      *ESIndexMsgBody `json:"body"`       // 消息体
	UpdatedAt int64           `json:"updated_at"` // 目录更新时间，用于异步处理消息发送结果
}

type ESIndexMsgBody struct {
	DocID            string            `json:"docid"`                     // es docid，使用目录编码并将/替换为-，删除时仅需传docid
	ID               string            `json:"id"`                        // 目录ID
	Name             string            `json:"name"`                      // 目录名称
	Code             string            `json:"code"`                      // 目录编码
	Description      string            `json:"description"`               // 目录描述
	OwnerID          string            `json:"data_owner_id"`             // 数据owner ID
	OwnerName        string            `json:"data_owner_name"`           // 数据owner名称
	SharedType       int8              `json:"shared_type"`               // 共享属性
	DataRange        int32             `json:"data_range"`                // 数据范围
	UpdateCycle      int32             `json:"update_cycle"`              // 更新频率
	UpdatedAt        int64             `json:"updated_at"`                // 更新时间
	PublishedAt      int64             `json:"published_at"`              // 上线时间
	PublishedStatus  string            `json:"published_status"`          // 发布状态
	IsPublish        bool              `json:"is_publish"`                // 是否发布
	OnlineStatus     string            `json:"online_status"`             // 上线状态
	OnlineAt         int64             `json:"online_at"`                 // 上线时间
	IsOnline         bool              `json:"is_online"`                 // 是否上线
	SourceDepartment string            `json:"source_department"`         // 数据资源来源部门
	DataUpdatedAt    int64             `json:"data_updated_at,omitempty"` // 数据更新时间
	ApplyNum         int64             `json:"apply_num"`                 // 申请量
	MountResources   []*MountResources `json:"mount_data_resources"`      // 挂接资源
	BusinessObjects  []*BusinessObject `json:"business_objects"`          // 所属主题域
	CateInfos        []*CateInfo       `json:"cate_info"`                 // 所属分类
	Fields           []*Field          `json:"fields"`                    // 字段列表
}
type MountResources struct {
	Type string   `json:"data_resources_type"` // 挂接资源类型 1逻辑视图 2 接口 3 文件资源
	IDs  []string `json:"data_resources_ids"`  // 数据资源ID
}

type BusinessObject struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Path   string `json:"path"`
	PathID string `json:"path_id"`
}

type CateInfo struct {
	CateId   string `json:"cate_id"`
	NodeId   string `json:"node_id"`
	NodeName string `json:"node_name"`
	NodePath string `json:"node_path"`
}

type Field struct {
	FieldNameZH string `json:"field_name_zh"` // 字段中文名称
	FieldNameEN string `json:"field_name_en"` // 字段英文名称
}

//endregion

// region ElecLicence

type ElecLicenceESIndexMsgEntity struct {
	Type string                     `json:"type"` // 消息类型，create|delete
	Body *ElecLicenceESIndexMsgBody `json:"body"` // 消息体
}

type ElecLicenceESIndexMsgBody struct {
	DocID                string   `json:"docid"`                  // es docid，使用目录编码并将/替换为-，删除时仅需传docid
	ID                   string   `json:"id"`                     // 目录ID
	Name                 string   `json:"name"`                   // 目录名称
	Code                 string   `json:"code"`                   // 目录编码
	UpdatedAt            int64    `json:"updated_at"`             // 更新时间
	OnlineStatus         string   `json:"online_status"`          // 上线状态
	OnlineAt             int64    `json:"online_at"`              // 上线时间
	IsOnline             bool     `json:"is_online"`              // 是否上线
	LicenceType          string   `json:"license_type"`           // 证照类型
	CertificationLevel   string   `json:"certification_level"`    // 发证级别
	IndustryDepartmentID string   `json:"industry_department_id"` // 行业类别id
	IndustryDepartment   string   `json:"industry_department"`    // 行业类别
	HolderType           string   `json:"holder_type"`            // 证照主体
	Department           string   `json:"department"`             // 管理部门
	Expire               string   `json:"expire"`                 // 有效期
	Fields               []*Field `json:"fields"`                 // 信息项目列表
	//CateInfos          []*CateInfo `json:"cate_info"`           // 所属分类
}

//endregion
