package data_resource

import (
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
)

// region common

const (
	ResourceTypeView         int8 = 1
	ResourceTypeService      int8 = 2
	ResourceTypeFileResource int8 = 3
)

//endregion

// region GetCount

type GetCountReq struct {
	UserDepartment  bool     `json:"user_department"  form:"user_department" ` // 本部门的目录
	MyDepartmentIDs []string `json:"-"`
	OnlineStatus    []string `json:"online_status"  form:"online_status" binding:"omitempty,dive,oneof=notline online offline up-auditing down-auditing up-reject down-reject" example:"online"`          //上线状态
	PublishStatus   []string `json:"publish_status" form:"publish_status" binding:"omitempty,dive,oneof=unpublished pub-auditing published pub-reject change-auditing change-reject" example:"published"` //发布状态
}

type GetCountRes struct {
	NotCatalogCount    int64 `json:"not_catalog_count"`    // 未编目数量
	DoneCatalogCount   int64 `json:"done_catalog_count"`   // 已编目数量
	DepartCatalogCount int64 `json:"depart_catalog_count"` // 本部门已编目数量
}

//endregion

// region DataResourceInfo

type DataResourceInfoReq struct {
	request.PageBaseInfo
	request.KeywordInfo
	Direction            *string        `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc" default:"desc" example:"desc"`                // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort                 *string        `json:"sort" form:"sort,default=publish_at" binding:"oneof=publish_at name" default:"publish_at" example:"publish_at"` // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序。默认按创建时间排序
	ResourceType         int8           `json:"resource_type" form:"resource_type" binding:"omitempty,oneof=1 2 3" example:"1"`                                // 资源类型 1逻辑视图 2 接口 3 文件资源
	PublishAtStart       *int64         `json:"publish_at_start" form:"publish_at_start" binding:"omitempty,gt=0" example:"1682586655000"`                     // 发布时间开始时间
	PublishAtEnd         *int64         `json:"publish_at_end" form:"publish_at_end" binding:"omitempty,gt=0" example:"1682586655000"`                         // 发布时间结束时间
	DepartmentID         string         `json:"department_id" form:"department_id" binding:"omitempty,uuid" example:"664c3791-297e-44da-bfbb-2f1b82f3b672"`    // 部门id
	SubjectID            string         `json:"subject_id" form:"subject_id" binding:"omitempty,uuid" example:"664c3791-297e-44da-bfbb-2f1b82f3b672"`          // 主题id
	SubDepartmentIDs     []string       `json:"-"`                                                                                                             // 部门的子部门id 	// 未分配部门
	SubSubjectIDs        []string       `json:"-"`                                                                                                             // 部门的子部门id 	// 未分配部门
	CatalogID            models.ModelID `json:"catalog_id" form:"catalog_id" uri:"catalog_id" binding:"omitempty,VerifyModelID" example:"1"`
	InfoSystemID         *string        `json:"info_system_id" form:"info_system_id" binding:"omitempty"`                 // 信息系统id
	DataSourceSourceType string         `json:"datasource_source_type" form:"datasource_source_type" binding:"omitempty"` // 数据源来源类型 records 信息系统 analytical 数据仓库   sandbox 数据沙箱
	DatasourceType       string         `json:"datasource_type" form:"datasource_type" binding:"omitempty"`               // 数据源类型
	FormViewIDS          *[]string      `json:"-"`
	DatasourceId         string         `json:"datasource_id" form:"datasource_id" binding:"omitempty,uuid"` // 数据源id
}

type DataResourceRes struct {
	Entries    []*DataResource `json:"entries"`     // 对象列表
	TotalCount int64           `json:"total_count"` // 当前筛选条件下的对象数量
}
type DataResource struct {
	ResourceId     string          `json:"resource_id"`     // 数据资源id
	Name           string          `json:"name"`            // 数据资源名称
	Code           string          `json:"code"`            // 编码
	ResourceType   int8            `json:"resource_type"`   // 资源类型 1逻辑视图 2 接口 3 文件资源
	DepartmentID   string          `json:"department_id"`   // 所属部门id
	Department     string          `json:"department"`      // 所属部门
	DepartmentPath string          `json:"department_path"` // 所属部门路径
	SubjectID      string          `json:"subject_id"`      // 所属主题id
	Subject        string          `json:"subject"`         // 所属主题
	SubjectPathId  string          `json:"subject_path_id"` // 所属主题路径id
	SubjectPath    string          `json:"subject_path"`    // 所属主题路径
	PublishAt      int64           `json:"publish_at"`      // 发布时间时间
	CatalogID      string          `json:"catalog_id"`      // 所属目录id
	Children       []*DataResource `json:"children"`        // 子节点
}

//endregion

//region

type DataCatalogResourceListReq struct {
	SubjectID     string   `json:"subject_id" form:"subject_id"` // 主题ID
	SubSubjectIDs []string `json:"-"`                            // 子主题域名id
	request.PageInfoWithKeyword
}

type DataCatalogResourceListObject struct {
	ResourceId     string ` json:"resource_id"`    // 数据资源id
	ResourceName   string `json:"name"`            // 数据资源名称
	TechnicalName  string `json:"technical_name"`  // 数据资源技术名称
	Code           string `json:"code"`            // 编码
	ResourceType   int8   `json:"resource_type"`   // 资源类型 1逻辑视图 2 接口
	Department     string `json:"department"`      // 所属部门
	DepartmentPath string `json:"department_path"` // 所属部门路径
	DatasourceID   string `json:"datasource_id"`   // 数据源ID
	CatalogName    string `json:"catalog_name"`    // 目录名称
	DatasourceType string `json:"datasource_type"` // 数据库类型
	PublishAt      int64  `json:"publish_at"`      // 发布时间时间
	CatalogID      string `json:"catalog_id"`      // 目录ID
}

// region EntityChange

type EntityChangeReq struct {
	Header  Header  `json:"header"`
	Payload Payload `json:"payload"`
}

type Header struct {
}
type Payload struct {
	Type    PayloadType `json:"type"`
	Content Content     `json:"content"`
}
type PayloadType string

const (
	PayloadTypeBusinessRelationGraph            PayloadType = "business-relation-graph"              //业务架构知识图谱名称
	PayloadTypeCognitiveSearchDataResourceGraph PayloadType = "cognitive-search-data-resource-graph" //认知搜索图谱_数据资源版
	PayloadTypeCognitiveSearchDataCatalogGraph  PayloadType = "cognitive-search-data-catalog-graph"  //认知搜索图谱_数据目录版
	PayloadTypeSmartRecommendationGraph         PayloadType = "smart-recommendation-graph"           //AF智能推荐场景图谱
)

const (
	TableNameFormView string = "form_view"
	TableNameService  string = "service"
)

const (
	ContentTypeInsert string = "insert"
	ContentTypeUpdate string = "update"
	ContentTypeDelete string = "delete"
)
const (
	Create string = "create"
	Update string = "update"
	Delete string = "delete"
)

type Content struct {
	Type      string `json:"type"`       //insert update delete
	TableName string `json:"table_name"` //form_view 视图 service 接口
	Entities  []any  `json:"entities"`
}
type ViewEntities struct {
	ID   string `json:"id"`
	Code string `json:"uniform_catalog_code"` // 统一编目的编码
	Name string `json:"business_name"`        // 视图名称
	//DepartmentId sql.NullString `json:"department_id"`        // 所属部门id
	PublishAt *time.Time `json:"publish_at"` // 发布时间
	CreatedAt time.Time  `json:"created_at"` // 创建时间
	UpdatedAt time.Time  `json:"updated_at"` // 编辑时间
}
type ApiEntities struct {
	ServiceID        string     `json:"service_id"`
	ServiceCode      string     `json:"service_code"`   // 统一编目的编码
	ServiceName      string     `json:"service_name"`   // 接口名称
	DepartmentID     string     `json:"department_id"`  // 所属部门id
	PublishStatus    string     `json:"publish_status"` // 发布状态
	PublishTime      *time.Time `json:"publish_time"`   // 发布时间
	DeleteTime       uint64     `json:"delete_time"`    // 删除时间
	CreateTime       time.Time  `json:"create_time"`    // 创建时间
	UpdateTime       time.Time  `json:"update_time"`    // 更新时间
	ChangedServiceId string     `json:"changed_service_id"`
	IsChanged        string     `json:"is_changed"`
	AuditStatus      string     `json:"audit_status"`
}

//endregion

// region InterfacePushToES

type InterfacePushToES struct {
	Type string `json:"type"` // 类型
	Body struct {
		DocID     string `json:"docid"`      // 文档ID
		ID        string `json:"id"`         // ID
		Code      string `json:"code"`       // 代码
		Name      string `json:"name"`       // 名称
		UpdatedAt int64  `json:"updated_at"` // 更新时间戳
		Fields    []struct {
			FieldNameZh string `json:"field_name_zh"` // 字段名称（中文）
			FieldNameEn string `json:"field_name_en"` // 字段名称（英文）
		} `json:"fields"` // 字段列表
		IsPublish       bool   `json:"is_publish"`       // 是否发布
		PublishedAt     int64  `json:"published_at"`     // 发布时间戳
		PublishedStatus string `json:"published_status"` // 发布状态
		OnlineStatus    string `json:"online_status"`    // 在线状态
		ApiType         string `json:"api_type"`         // API类型
	} `json:"body"` // 主体内容
}

//endregion

// region InterfaceCatalog

type InterfaceCatalog struct {
	ServiceID        string `json:"service_id"`
	Type             string `json:"type"`
	PublishStatus    string `json:"publish_status"`         // 发布状态
	PublishTime      string `json:"publish_time"`           // 发布时间
	DataViewId       string `json:"data_view_id"`           // 数据视图Id
	ServiceName      string `json:"service_name,omitempty"` // 接口名称
	ServiceCode      string `json:"service_code,omitempty"` // 编码
	DepartmentId     string `json:"department_id"`          // 部门ID
	SubjectDomainId  string `json:"subject_domain_id"`      // 主题域id
	ChangedServiceId string `json:"changed_service_id"`
}

//endregion
