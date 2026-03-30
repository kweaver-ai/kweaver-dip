package info_resource_catalog

import "github.com/kweaver-ai/idrm-go-common/rest/label"

// [ES索引消息体]
type EsIndexCreateMsgBody struct {
	DocID                string             `json:"docid"`                                 // es docid，直接使用ID，删除时仅需传docid
	ID                   string             `json:"id"`                                    // 信息资源目录ID
	Name                 string             `json:"name"`                                  // 信息资源目录名称
	Code                 string             `json:"code"`                                  // 信息资源目录编码
	Description          string             `json:"description"`                           // 信息资源目录描述
	Fields               []*Field           `json:"fields"`                                // 信息项列表
	CateInfos            []*CategoryNode    `json:"cate_info"`                             // 所属分类（类目信息）
	BusinessProcesses    []*BusinessEntity  `json:"business_processes"`                    // 所属业务流程列表
	UpdateCycle          int8               `json:"update_cycle"`                          // 更新周期
	SharedType           int8               `json:"shared_type"`                           // 共享属性
	PublishedStatus      string             `json:"published_status"`                      // 发布状态
	PublishedAt          int64              `json:"published_at"`                          // 发布时间
	OnlineStatus         string             `json:"online_status"`                         // 上线状态
	OnlineAt             int64              `json:"online_at"`                             // 上线时间
	UpdatedAt            int64              `json:"updated_at"`                            // 更新时间
	FormID               string             `json:"form_id"`                               //业务表ID
	FormName             string             `json:"form_name"`                             //业务表名称
	BusinessModelID      string             `json:"business_model_id"`                     //业务模型ID
	BusinessModelName    string             `json:"business_model_name"`                   //模型名称
	ProcessPathID        string             `json:"process_path_id"`                       //包含主干业务ID的path
	ProcessPathName      string             `json:"process_path_name"`                     //包含主干业务名称的path
	DomainID             string             `json:"domain_id" `                            //业务域id
	DomainName           string             `json:"domain_name"`                           //业务域名称
	DepartmentPathID     string             `json:"department_path_id"`                    //业务表部门
	DepartmentPathName   string             `json:"department_path_name"`                  //部门名称
	DataResourceCatalogs []*BusinessEntity  `json:"data_resource_catalogs" binding:"dive"` // 关联数据资源目录列表
	LabelIds             string             `json:"label_ids"`                             //资源标签：最多5个，标签ID
	LabelListResp        []*label.LabelResp `json:"label_list_resp"`                       //标签列表
}

type Field struct {
	FieldNameZH string `json:"field_name_zh"` // 字段中文名称，这里用信息项名称
}

type EsIndexUpdateMsgBody struct {
	Query map[string]any `json:"query"`
	Value map[string]any `json:"value"`
} // [/]

// [ES搜索参数]
const SearchInfoResourceCatalogRequestSize = 20

type CateInfoQuery struct {
	CateID  string   `json:"cate_id"`  // 类目类型ID
	NodeIDs []string `json:"node_ids"` // 类目节点ID列表
}

type EsSearchParam struct {
	IDs                []string         `json:"ids"`                  // 待过滤信息资源目录ID列表
	Keyword            string           `json:"keyword"`              // 搜索关键字
	Fields             []KeywordField   `json:"fields,omitempty"`     // 关键字匹配的字段
	BusinessProcessIDs []string         `json:"business_process_ids"` // 业务流程ID列表
	CateInfos          []*CateInfoQuery `json:"cate_info"`            // 类目节点列表
	UpdateCycle        []int8           `json:"update_cycle"`         // 更新周期列表
	SharedType         []int8           `json:"shared_type"`          // 共享属性列表
	OnlineAt           *TimeRange       `json:"online_at"`            // 上线时间范围
	PublishedStatus    []string         `json:"published_status"`     // 发布状态列表
	OnlineStatus       []string         `json:"online_status"`        // 上线状态列表
	Size               int              `json:"size"`                 // 查询获取的记录条数
	NextFlag           []string         `json:"next_flag"`            // 分页标识
}

type TimeRange struct {
	StartTime int `json:"start_time"`
	EndTime   int `json:"end_time"`
} // [/]

// [ES搜索结果]
type EsSearchResult SearchResultTemplate[*EsSearchEntryListItem]

type FieldInfo struct {
	FieldNameZH    string `json:"field_name_zh"`     // 信息项名称标签，带CSS样式
	RawFieldNameZH string `json:"raw_field_name_zh"` // 信息项名称文本
}

type EsSearchEntryListItem struct {
	ID              string          `json:"id"`               // 信息资源目录ID
	Name            string          `json:"name"`             // 信息资源目录名称标签，带CSS颜色样式
	RawName         string          `json:"raw_name"`         // 信息资源目录名称文本
	Code            string          `json:"code"`             // 信息资源目录编码标签，带CSS颜色样式
	RawCode         string          `json:"raw_code"`         // 信息资源目录编码文本
	Description     string          `json:"description"`      // 信息资源目录描述标签，带CSS颜色样式
	RawDescription  string          `json:"raw_description"`  // 信息资源目录描述文本
	OnlineAt        int             `json:"online_at"`        // 上线时间
	Fields          []*FieldInfo    `json:"fields"`           // 信息项列表
	CateInfo        []*CategoryNode `json:"cate_info"`        // 类目信息列表
	PublishedStatus string          `json:"published_status"` // 发布状态
	OnlineStatus    string          `json:"online_status"`    // 上线状态
	// 信息资源目录 - 业务表
	BusinessForm Reference `json:"business_form,omitempty"`
	// 信息资源目录 - 业务表 - 业务模型
	BusinessModel Reference `json:"business_model,omitempty"`
	// 信息资源目录 - 业务表 - 业务模型 - 主干业务
	BusinessProcesses []Reference `json:"business_processes,omitempty"`
	// 信息资源目录 - 业务表 - 业务模型 - 主干业务 - 部门及其上级部门，为从顶级部门开始
	MainBusinessDepartments []Reference `json:"main_business_departments,omitempty"`
	// 信息资源目录 - 业务表 - 业务模型 - 主干业务 - 业务领域
	BusinessDomain Reference `json:"business_domain,omitempty"`
	// 信息资源目录 - 数据资源目录
	DataResourceCatalogs []Reference        `json:"data_resource_catalogs,omitempty"`
	LabelIds             string             `json:"label_ids,omitempty"` //资源标签：最多5个，标签ID
	LabelListResp        []*label.LabelResp `json:"label_list_resp"`     //标签列表

	UpdateCycle int8 `json:"update_cycle"` // 更新周期
	SharedType  int8 `json:"shared_type"`  // 共享属性
	OpenType    int8 `json:"open_type"`    // 开放属性
} // [/]
