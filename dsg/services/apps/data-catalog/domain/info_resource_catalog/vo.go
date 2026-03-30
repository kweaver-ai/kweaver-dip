package info_resource_catalog

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/idrm-go-common/rest/label"
	"github.com/kweaver-ai/idrm-go-common/util/sets"
)

// [信息资源目录管理接口]

// [新建信息资源目录]

// [新建信息资源目录请求]
type CreateInfoResourceCatalogReq struct {
	Action          EnumAction        `json:"action" binding:"required,oneof=save submit,InjectStack"`                                                                               // 动作
	Name            string            `json:"name" binding:"required,TrimSpace,min=1,max=128"`                                                                                       // 信息资源目录名称
	BelongInfo      *BelongInfoVO     `json:"belong_info" binding:"required_if=Action submit"`                                                                                       // 所属信息
	DataRange       string            `json:"data_range" binding:"required_if=Action submit,omitempty,oneof=all city district"`                                                      // 数据范围
	UpdateCycle     string            `json:"update_cycle" binding:"required_if=Action submit,omitempty,oneof=quarterly monthly weekly daily realtime irregular yearly half-yearly"` // 更新周期
	Description     string            `json:"description" binding:"required_if=Action submit,omitempty,VerifyDescription"`                                                           // 信息资源目录描述
	CategoryNodeIDs []string          `json:"category_node_ids"`                                                                                                                     // 类目节点ID列表
	RelationInfo    *RelationInfoVO   `json:"relation_info" binding:"required_if=Action submit"`                                                                                     // 关联信息
	SharedOpenInfo  *SharedOpenInfoVO `json:"shared_open_info" binding:"required"`                                                                                                   // 共享开放信息
	SourceInfo      *SourceInfoVO     `json:"source_info" binding:"required"`                                                                                                        // 来源信息
	Columns         []*InfoItemVO     `json:"columns" binding:"dive"`                                                                                                                // 信息项列表
	LabelIds        []string          `json:"label_ids" binding:"omitempty,lte=5,dive,max=20"`                                                                                       //资源标签：数组，最多5个，标签ID
} // [/]

// [新建信息资源目录响应]
type CreateInfoResourceCatalogRes struct {
	ID        string   `json:"id"`         // 信息资源目录ID
	Code      string   `json:"code"`       // 信息资源目录编码
	ColumnIDs []string `json:"column_ids"` // 信息项ID列表
	ErrorMessage
} // [/]

// [/]

// [更新信息资源目录（更新是指用新值全量替换旧值）]

// [更新信息资源目录请求]
type UpdateInfoResourceCatalogReq struct {
	Action          EnumAction        `json:"action" binding:"required,oneof=save submit,InjectStack"`                                                                               // 动作
	Name            string            `json:"name" binding:"required,TrimSpace,min=1,max=128"`                                                                                       // 信息资源目录名称
	BelongInfo      *BelongInfoVO     `json:"belong_info" binding:"required_if=Action submit"`                                                                                       // 所属信息
	DataRange       string            `json:"data_range" binding:"required_if=Action submit,omitempty,oneof=all city district"`                                                      // 数据范围
	UpdateCycle     string            `json:"update_cycle" binding:"required_if=Action submit,omitempty,oneof=quarterly monthly weekly daily realtime irregular yearly half-yearly"` // 更新周期
	Description     string            `json:"description" binding:"required_if=Action submit,omitempty,VerifyDescription"`                                                           // 信息资源目录描述
	CategoryNodeIDs []string          `json:"category_node_ids"`                                                                                                                     // 类目节点ID列表
	RelationInfo    *RelationInfoVO   `json:"relation_info" binding:"required_if=Action submit"`                                                                                     // 关联信息
	SharedOpenInfo  *SharedOpenInfoVO `json:"shared_open_info" binding:"required"`                                                                                                   // 共享开放信息
	Columns         []*InfoItemObject `json:"columns" binding:"dive"`                                                                                                                // 信息项列表
	IDParam
	LabelIds []string `json:"label_ids" binding:"omitempty,lte=5,dive,max=20"` //资源标签：数组，最多5个，标签ID
} // [/]

// [更新信息资源目录响应]
type UpdateInfoResourceCatalogRes struct {
	ErrorMessage
} // [/]

// [/]

// [变更信息资源目录]

// [变更信息资源目录请求]
type AlterInfoResourceCatalogReq struct {
	Action          EnumAction        `json:"action" binding:"required,oneof=save submit,InjectStack"`                                                                               // 动作
	ID              models.ModelID    `json:"id" binding:"omitempty,VerifyModelID"`                                                                                                  // 当前变更版本ID，若无则不填
	Name            string            `json:"name" binding:"required,TrimSpace,min=1,max=128"`                                                                                       // 信息资源目录名称
	BelongInfo      *BelongInfoVO     `json:"belong_info" binding:"required_if=Action submit"`                                                                                       // 所属信息
	DataRange       string            `json:"data_range" binding:"required_if=Action submit,omitempty,oneof=all city district"`                                                      // 数据范围
	UpdateCycle     string            `json:"update_cycle" binding:"required_if=Action submit,omitempty,oneof=quarterly monthly weekly daily realtime irregular yearly half-yearly"` // 更新周期
	Description     string            `json:"description" binding:"required_if=Action submit,omitempty,VerifyDescription"`                                                           // 信息资源目录描述
	CategoryNodeIDs []string          `json:"category_node_ids"`                                                                                                                     // 类目节点ID列表
	RelationInfo    *RelationInfoVO   `json:"relation_info" binding:"required_if=Action submit"`                                                                                     // 关联信息
	SharedOpenInfo  *SharedOpenInfoVO `json:"shared_open_info" binding:"required"`                                                                                                   // 共享开放信息
	Columns         []*InfoItemVO     `json:"columns" binding:"dive"`                                                                                                                // 信息项列表
	LabelIds        []string          `json:"label_ids" binding:"omitempty,lte=5,dive,max=20"`                                                                                       //资源标签：数组，最多5个，标签ID
	IDParamV1
} // [/]

// [变更信息资源目录响应]
type AlterInfoResourceCatalogRes struct {
	ErrorMessage
} // [/]

// [/]

// [信息目录变更恢复]

// [信息目录变更恢复参数]
type AlterDelReq struct {
	ID      models.ModelID `uri:"id" binding:"required,VerifyModelID"`      // 信息目录ID
	AlterID models.ModelID `uri:"alterID" binding:"required,VerifyModelID"` // 变更版本临时ID
} // [/]

// [/]

// [修改信息资源目录状态（修改是指部分旧值变更为新值）]

// [修改信息资源目录状态请求]
type ModifyInfoResourceCatalogReq struct {
	IDParam
	Status EnumTargetStatus `json:"status" binding:"required,oneof=prev next"` // 目标状态
}

type EnumTargetStatus string

const (
	StatusTargetPrevious EnumTargetStatus = "prev"
	StatusTargetNext     EnumTargetStatus = "next"
) // [/]

// [/]

// [删除信息资源目录]

// [删除信息资源目录请求]
type DeleteInfoResourceCatalogReq struct {
	IDParam
} // [/]

// [/]

// [获取冲突项]

// [获取冲突项请求]
type GetConflictItemsReq struct {
	ID   string `form:"id"`   // 信息资源目录ID，多个用逗号分隔
	Name string `form:"name"` // 信息资源目录名称
} // [/]

// [获取冲突项响应]
type GetConflictItemsRes []string // [/]

// [/]

// [获取信息资源目录自动关联信息类]

// [获取信息资源目录自动关联信息类请求]
type GetInfoResourceCatalogAutoRelatedInfoClassesReq struct {
	SourceID string `form:"source_id" binding:"required"` // 来源业务表ID
} // [/]

// [通过业务标准表查询目录]
type GetCatalogByStandardForm struct {
	StandardFormID []string `form:"standard_form_id" binding:"required"` // 业务标准表ID
} // [/]

// [获取信息资源目录自动关联信息类响应]
type GetCatalogByStandardFormResp []*GetCatalogByStandardFormItem

//[/]

// [信息类]
type GetCatalogByStandardFormItem struct {
	ID             string `json:"id"`               // 信息类ID
	Name           string `json:"name"`             // 信息类名称
	Code           string `json:"code"`             // 信息类编码
	BusinessFormID string `json:"business_form_id"` //业务标准表ID
} // [/]

// [获取信息资源目录自动关联信息类响应]
type GetInfoResourceCatalogAutoRelatedInfoClassesRes []*InfoClassVO // [/]

// [/]

// [查询未编目业务表]

// [查询未编目业务表请求]
type QueryUncatalogedBusinessFormsReq struct {
	DepartmentID      *string  `json:"department_id"` //所属部门ID
	DepartmentIDSlice []string `json:"-"  `
	NodeID            *string  `json:"node_id"`        //业务领域节点，用来通过业务领域查询的，可能是业务领域的任何节点
	ChildNodeSlice    []string `json:"-"`              //nodeID的子节点
	InfoSystemID      *string  `json:"info_system_id"` //信息系统，传空表示查询康
	QueryParamsTemplate
} // [/]

// [查询未编目业务表响应]
type QueryUncatalogedBusinessFormsRes QueryResultTemplate[*BusinessFormVO] // [/]

// [/]

// [查询信息资源目录编目列表]

// [查询信息资源目录编目列表请求]
type QueryInfoResourceCatalogCatalogingListReq struct {
	UserDepartment      bool                        `json:"user_department"`        // 是否仅用户部门数据
	Filter              *CatalogQueryFilterParamsVO `json:"filter"`                 // 筛选条件
	CateInfo            *CateInfoParam              `json:"cate_info"`              // 资源属性分类信息
	AutoRelatedSourceID string                      `json:"auto_related_source_id"` // 自动关联来源业务表ID
	QueryParamsTemplate
} // [/]

// [查询信息资源目录编目列表响应]
type QueryInfoResourceCatalogCatalogingListRes QueryResultTemplate[*InfoResourceCatalogCatalogingListItem] // [/]

// [/]

// [查询信息资源目录待审核列表]

// [查询信息资源目录待审核列表请求]
type QueryInfoResourceCatalogAuditListReq struct {
	Filter *AuditQueryFilterParamsVO `json:"filter"` // 筛选条件
	PaginationParamWithKeyword
} // [/]

// [查询信息资源目录待审核列表响应]
type QueryInfoResourceCatalogAuditListRes QueryResultTemplate[*InfoResourceCatalogAuditListItem] // [/]

// [/]

// [/]

// [信息资源目录使用接口]

// [用户搜索信息资源目录]

// [用户搜索信息资源目录请求]
type SearchInfoResourceCatalogsByUserReq SearchParamsTemplate[*UserSearchFilterParams] // [/]

// [用户搜索信息资源目录响应]
type SearchInfoResourceCatalogsByUserRes SearchResultTemplate[*UserSearchListItem] // [/]

// [/]

// [运营搜索信息资源目录]

// [运营搜索信息资源目录请求]
type SearchInfoResourceCatalogsByAdminReq SearchParamsTemplate[*AdminSearchOperationFilterParams] // [/]

// [运营搜索信息资源目录响应]
type SearchInfoResourceCatalogsByAdminRes SearchResultTemplate[*AdminSearchListItem] // [/]

// [/]

// [获取信息资源目录卡片基本信息]

// [获取信息资源目录卡片基本信息请求]
type GetInfoResourceCatalogCardBaseInfoReq struct {
	IDParam
} // [/]

// [获取信息资源目录卡片基本信息响应]
type GetInfoResourceCatalogCardBaseInfoRes struct {
	Name        string `json:"name"`        // 信息资源目录名称
	Code        string `json:"code"`        // 信息资源目录编码
	Description string `json:"description"` // 信息资源目录描述
} // [/]

// [/]

// [获取信息资源目录关联数据资源目录]

// [获取信息资源目录关联数据资源目录请求]
type GetInfoResourceCatalogRelatedDataResourceCatalogsReq struct {
	IDParam
	PaginationParam
} // [/]

// [获取信息资源目录关联数据资源目录响应]
type GetInfoResourceCatalogRelatedDataResourceCatalogsRes QueryResultTemplate[*DataResoucreCatalogCard] // [/]

// [/]

// [获取信息资源目录详情]

// [获取信息资源目录详情请求]
type GetInfoResourceCatalogDetailReq struct {
	IDParam
} // [/]

// [用户获取信息资源目录详情响应]
type GetInfoResourceCatalogDetailByUserRes struct {
	InfoResourceCatalogDetail
} // [/]

// [运营获取信息资源目录详情响应]
type GetInfoResourceCatalogDetailByAdminRes struct {
	InfoResourceCatalogDetail
	Status     *InfoResourceCatalogStatusVO `json:"status"` // 状态
	*AuditInfo                              // 审核信息
	*AlterInfo                              // 变更信息
} // [/]

// [/]

// [获取信息资源目录下属信息项]

// [获取信息资源目录下属信息项请求]
type GetInfoResourceCatalogColumnsReq struct {
	IDParam
	PaginationParamWithKeyword
}

// [/]

// [获取信息资源目录下属信息项响应]
type GetInfoResourceCatalogColumnsRes QueryResultTemplate[*InfoItemObject] // [/]

// [/]

// [/]

// [数据模型]

// [来源信息]
type SourceInfoVO struct {
	BusinessForm *BusinessEntity `json:"business_form" binding:"required"` // 来源业务表
	Department   *BusinessEntity `json:"department"`                       // 来源部门
} // [/]

// [所属信息]
type BelongInfoVO struct {
	Action          EnumAction        `json:"-"`                                                                         // 动作，影子字段
	Department      *BusinessEntity   `json:"department"`                                                                // 所属部门
	Office          *OfficeVO         `json:"office"`                                                                    // 所属处室
	BusinessProcess []*BusinessEntity `json:"business_process" binding:"required_if=Action submit,omitempty,min=1,dive"` // 所属业务流程
} // [/]

// [处室]
type OfficeVO struct {
	Action                 EnumAction `json:"-"`                                    // 动作，影子字段
	ID                     string     `json:"id" binding:"required"`                // 处室ID
	Name                   string     `json:"name" binding:"required_unless=ID ''"` // 处室名称
	BusinessResponsibility string     `json:"business_responsibility"`              // 处室业务责任
} // [/]

// [关联信息]
type RelationInfoVO struct {
	Action                EnumAction         `json:"-"`                                                                                // 动作，影子字段
	InfoSystems           []*BusinessEntity  `json:"info_systems" binding:"dive"`                                                      // 关联信息系统列表
	DataResourceCatalogs  []*BusinessEntity  `json:"data_resource_catalogs" binding:"dive"`                                            // 关联数据资源目录列表
	InfoResourceCatalogs  []*BusinessEntity  `json:"info_resource_catalogs" binding:"dive"`                                            // 关联信息类列表
	InfoItems             []*BusinessEntity  `json:"info_items" binding:"dive"`                                                        // 关联信息项列表
	RelatedBusinessScenes []*BusinessSceneVO `json:"related_business_scenes" binding:"required_if=Action submit,omitempty,min=1,dive"` // 关联业务场景列表
	SourceBusinessScenes  []*BusinessSceneVO `json:"source_business_scenes" binding:"required_if=Action submit,omitempty,min=1,dive"`  // 来源业务场景列表
} // [/]

// [业务场景值对象]
type BusinessSceneVO struct {
	Type  string `json:"type"`  // 业务场景类型
	Value string `json:"value"` // 业务场景值
} // [/]

// [共享开放信息]
type SharedOpenInfoVO struct {
	Action        EnumAction `json:"-"`                                                                                         // 动作，影子字段
	SharedType    string     `json:"shared_type" binding:"required,oneof=none all partial"`                                     // 共享属性
	SharedMessage string     `json:"shared_message"`                                                                            // 共享信息：共享属性为不予共享时是不予共享依据，共享属性为有条件共享时是共享条件
	SharedMode    string     `json:"shared_mode" binding:"required_unless=SharedType none,omitempty,oneof=platform mail media"` // 共享方式
	OpenType      string     `json:"open_type" binding:"required,oneof=none all partial"`                                       // 开放属性
	OpenCondition string     `json:"open_condition"`                                                                            // 开放条件
} // [/]

// [信息项]
type InfoItemVO struct {
	Action           EnumAction      `json:"-"`                                                              // 动作，影子字段
	Name             string          `json:"name" binding:"required,min=1,max=255"`                          // 信息项名称
	FieldNameEN      string          `json:"field_name_en" binding:"required,VerifyNameStandardLimitPrefix"` // 关联业务表字段英文名称
	FieldNameCN      string          `json:"field_name_cn" binding:"required,min=1,max=255"`                 // 关联业务表字段中文名称
	DataRefer        *BusinessEntity `json:"data_refer"`                                                     // 关联数据元
	CodeSet          *BusinessEntity `json:"code_set"`                                                       // 关联代码集
	Metadata         *MetadataVO     `json:"metadata" binding:"required"`                                    // 元数据
	IsSensitive      *bool           `json:"is_sensitive" binding:"required_if=Action submit"`               // 是否敏感属性
	IsSecret         *bool           `json:"is_secret" binding:"required_if=Action submit"`                  // 是否涉密
	IsPrimaryKey     bool            `json:"is_primary_key"`                                                 // 是否主键
	IsIncremental    bool            `json:"is_incremental"`                                                 // 是否增量字段
	IsLocalGenerated bool            `json:"is_local_generated"`                                             // 是否本部门产生
	IsStandardized   bool            `json:"is_standardized"`                                                // 是否标准化
} // [/]

// [元数据]
type MetadataVO struct {
	DataType   string `json:"data_type" binding:"required,oneof=char date datetime bool other int float decimal time number"` // 数据类型
	DataLength int    `json:"data_length"`                                                                                    // 数据长度
	DataRange  string `json:"data_range" binding:"omitempty,VerifyNameStandardLimitPrefix"`                                   // 数据范围
} // [/]

// [关联项]
type RelatedItemVO struct {
	ID       string         `json:"id"`                  // 关联项ID
	Name     string         `json:"name"`                // 关联项名称
	DataType string         `json:"data_type,omitempty"` // 关联项信息项数据类型
	Type     EnumObjectType `json:"type"`                // 关联项类型
} // [/]

// [信息资源目录可编辑属性]
type InfoResourceCatalogEditableAttrs struct {
	Name            string            `json:"name"`              // 信息资源目录名称
	BelongInfo      *BelongInfoVO     `json:"belong_info"`       // 所属信息
	DataRange       string            `json:"data_range"`        // 数据范围
	UpdateCycle     string            `json:"update_cycle"`      // 更新周期
	Description     string            `json:"description"`       // 信息资源目录描述
	CategoryNodeIDs []string          `json:"category_node_ids"` // 类目节点ID列表
	RelationInfo    *RelationInfoVO   `json:"relation_info"`     // 关联信息
	SharedOpenInfo  *SharedOpenInfoVO `json:"shared_open_info"`  // 共享开放信息
} // [/]

// [信息类]
type InfoClassVO struct {
	ID      string          `json:"id"`      // 信息类ID
	Name    string          `json:"name"`    // 信息类名称
	Code    string          `json:"code"`    // 信息类编码
	Columns []*InfoItemCard `json:"columns"` // 信息项列表
} // [/]

// [信息项卡片]
type InfoItemCard struct {
	BusinessEntity
	DataType string `json:"data_type"` // 数据类型
} // [/]

// [信息项对象]
type InfoItemObject struct {
	Action EnumAction `json:"-"`  // 动作，影子字段
	ID     string     `json:"id"` // 信息项ID
	InfoItemVO
} // [/]

// [错误提示信息]
type ErrorMessage struct {
	InvalidItems []*RelatedItemVO `json:"invalid_items"` // 无效关联项列表
} // [/]

// [业务表]
type BusinessFormVO struct {
	ID                 string             `json:"id"`                   // 业务表ID
	Name               string             `json:"name"`                 // 业务表名称
	Description        string             `json:"description"`          // 业务表描述
	DepartmentID       string             `json:"department_id"`        // 所属部门ID
	DepartmentName     string             `json:"department_name"`      // 所属部门名称
	DepartmentPath     string             `json:"department_path"`      // 所属部门路径
	RelatedInfoSystems []*BusinessEntity  `json:"related_info_systems"` // 关联信息系统列表
	BusinessDomainID   string             `json:"business_domain_id"`   //业务流程ID
	BusinessDomainName string             `json:"business_domain_name"` //业务流程名称
	DomainID           string             `json:"domain_id"`            //业务域ID
	DomainName         string             `json:"domain_name"`          //业务域名称
	DomainGroupID      string             `json:"domain_group_id"`      //业务域分组ID
	DomainGroupName    string             `json:"domain_group_name"`    //业务域分组名称
	UpdateAt           int64              `json:"update_at"`            // 更新时间
	UpdateBy           string             `json:"update_by"`            // 更新者
	LabelListResp      []*label.LabelResp `json:"label_list_resp"`      //关联标签列表
} // [/]

// [编目查询过滤参数]
type CatalogQueryFilterParamsVO struct {
	PublishStatus []string     `json:"publish_status"` // 发布状态
	OnlineStatus  []string     `json:"online_status"`  // 上线状态
	UpdateAt      *TimeRangeVO `json:"update_at"`      // 更新时间
} // [/]

// [时间范围]
type TimeRangeVO struct {
	Start int `json:"start"` // 开始时间
	End   int `json:"end"`   // 结束时间
} // [/]

// [信息资源目录列表属性]
type InfoResourceCatalogListAttrs struct {
	ID                          string             `json:"id"`                             // 信息资源目录ID
	Name                        string             `json:"name"`                           // 信息资源目录名称
	Code                        string             `json:"code"`                           // 信息资源目录编码
	Department                  string             `json:"department"`                     // 所属部门
	DepartmentPath              string             `json:"department_path"`                // 所属部门路径
	RelatedDataResourceCatalogs []*BusinessEntity  `json:"related_data_resource_catalogs"` // 关联数据资源目录列表
	LabelListResp               []*label.LabelResp `json:"label_list_resp"`                //标签列表
} // [/]

type AlterInfo struct {
	AlterUID      string `json:"alter_uid,omitempty"`       // 变更创建人ID
	AlterName     string `json:"alter_name,omitempty"`      // 变更创建人名称
	AlterAt       int64  `json:"alter_at,omitempty"`        // 变更创建时间
	NextID        int64  `json:"next_id,string,omitempty"`  // 后一版本ID
	AlterAuditMsg string `json:"alter_audit_msg,omitempty"` // 变更审核信息，最后一次审核意见
}

// [信息资源目录编目列表项]
type InfoResourceCatalogCatalogingListItem struct {
	InfoResourceCatalogListAttrs
	UpdateAt int                          `json:"update_at"` // 更新时间
	Status   *InfoResourceCatalogStatusVO `json:"status"`    // 状态
	AuditMsg string                       `json:"audit_msg"` // 审核信息，最后一次审核意见
	*AlterInfo
} // [/]

// [信息资源目录发布/上线状态]
type InfoResourceCatalogStatusVO struct {
	Publish string `json:"publish"` // 发布状态
	Online  string `json:"online"`  // 上线状态
} // [/]

// [审核查询过滤参数]
type AuditQueryFilterParamsVO struct {
	AuditType []EnumAuditTypeParam `json:"audit_type"` // 审核类型
} // [/]

// [信息资源目录审核列表项]
type InfoResourceCatalogAuditListItem struct {
	InfoResourceCatalogListAttrs
	AuditAt       int    `json:"audit_at"`        // 申请审核时间
	AuditType     string `json:"audit_type"`      // 审核类型
	ProcessID     string `json:"process_id"`      // 审核流程ID
	ApplyUserName string `json:"apply_user_name"` // 申请人名称
} // [/]

// [信息资源目录搜索通用筛选条件]
type UserSearchFilterParams struct {
	BusinessProcessIDs []string       `json:"business_process_ids"` // 业务流程列表
	UpdateCycle        []string       `json:"update_cycle"`         // 更新周期列表
	SharedType         []string       `json:"shared_type"`          // 共享属性列表
	OnlineAt           *TimeRangeVO   `json:"online_at"`            // 上线时间范围
	CateInfo           *CateInfoParam `json:"cate_info"`            // 资源属性分类
} // [/]

// [信息资源目录搜索运营筛选条件]
type AdminSearchOperationFilterParams struct {
	UserSearchFilterParams
	PublishStatus []string `json:"publish_status"` // 发布状态列表
	OnlineStatus  []string `json:"online_status"`  // 上线状态列表
} // [/]

type SearchListItemInterface interface {
	GetID() string
	SetIsFavored(bool)
	SetFavorID(uint64)
}

// [信息资源目录通用搜索结果列表项]
type UserSearchListItem struct {
	ID             string          `json:"id"`                        // 信息资源目录ID
	Name           string          `json:"name"`                      // 信息资源目录名称标签，带CSS颜色样式
	RawName        string          `json:"raw_name"`                  // 信息资源目录名称文本
	Code           string          `json:"code"`                      // 信息资源目录编码标签，带CSS颜色样式
	RawCode        string          `json:"raw_code"`                  // 信息资源目录编码文本
	Description    string          `json:"description"`               // 信息资源目录描述标签，带CSS颜色样式
	RawDescription string          `json:"raw_description"`           // 信息资源目录描述文本
	OnlineAt       int             `json:"online_at"`                 // 上线时间
	Columns        []*ColumnVO     `json:"columns"`                   // 信息项列表
	CateInfo       []*CategoryNode `json:"cate_info"`                 // 类目信息列表
	FavorID        uint64          `json:"favor_id,string,omitempty"` // 收藏项ID，仅已收藏时返回该字段
	IsFavored      bool            `json:"is_favored"`                // 是否已收藏
	// 信息资源目录 - 业务表
	BusinessForm Reference `json:"business_form,omitempty"`
	// 信息资源目录 - 业务表 - 业务模型
	BusinessModel Reference `json:"business_model,omitempty"`
	// 信息资源目录 - 业务表 - 业务模型 - 主干业务
	MainBusiness []Reference `json:"main_business,omitempty"`
	// 信息资源目录 - 业务表 - 业务模型 - 主干业务 - 部门及其上级部门，为从顶级部门开始
	MainBusinessDepartments []Reference `json:"main_business_departments,omitempty"`
	// 信息资源目录 - 业务表 - 业务模型 - 主干业务 - 业务领域
	BusinessDomain Reference `json:"business_domain,omitempty"`
	// 信息资源目录 - 数据资源目录
	DataResourceCatalogs []Reference        `json:"data_resource_catalogs,omitempty"`
	LabelListResp        []*label.LabelResp `json:"label_list_resp"` //标签列表

	UpdateCycle string `json:"update_cycle"` // 更新周期
	SharedType  string `json:"shared_type"`  // 共享属性
	OpenType    string `json:"open_type"`    // 开放属性
}

// 对资源的引用，包括资源的名称
type Reference struct {
	// 资源类型
	Type string `json:"type,omitempty"`
	// 资源 ID
	ID string `json:"id,omitempty"`
	// 资源名称
	Name string `json:"name,omitempty"`
}

func (u *UserSearchListItem) GetID() string {
	return u.ID
}

func (u *UserSearchListItem) SetIsFavored(isFavored bool) {
	u.IsFavored = isFavored
}

func (u *UserSearchListItem) SetFavorID(favorID uint64) {
	u.FavorID = favorID
}

type ColumnVO struct {
	Name    string `json:"name"`     // 信息项名称标签，带CSS颜色样式
	RawName string `json:"raw_name"` // 信息项名称文本
} // [/]

// [信息资源目录运营搜索结果列表项]
type AdminSearchListItem struct {
	UserSearchListItem
	Status *InfoResourceCatalogStatusVO `json:"status"` // 状态
} // [/]

// [数据资源目录卡片]
type DataResoucreCatalogCard struct {
	ID        string `json:"id"`         // 数据资源目录ID
	Name      string `json:"name"`       // 数据资源目录名称
	Code      string `json:"code"`       // 数据资源目录编码
	PublishAt int    `json:"publish_at"` // 发布时间
} // [/]

// [信息资源目录详情]
type InfoResourceCatalogDetail struct {
	Name           string            `json:"name"`                      // 信息资源目录名称
	BelongInfo     *BelongInfoVO     `json:"belong_info"`               // 所属信息
	DataRange      string            `json:"data_range"`                // 数据范围
	UpdateCycle    string            `json:"update_cycle"`              // 更新周期
	Description    string            `json:"description"`               // 信息资源目录描述
	CateInfo       []*CategoryNode   `json:"cate_info"`                 // 类目信息列表
	RelationInfo   *RelationInfoVO   `json:"relation_info"`             // 关联信息
	SharedOpenInfo *SharedOpenInfoVO `json:"shared_open_info"`          // 共享开放信息
	Code           string            `json:"code"`                      // 信息资源目录编码
	SourceInfo     *SourceInfoVO     `json:"source_info"`               // 来源信息
	FavorID        uint64            `json:"favor_id,string,omitempty"` // 收藏项ID，仅已收藏时返回该字段
	IsFavored      bool              `json:"is_favored"`                // 是否已收藏
	LabelIds       []string          `json:"label_ids"`                 //资源标签：数组，最多5个，标签ID
} // [/]

// [类目信息查询参数]
type CateInfoParam struct {
	CateID string `json:"cate_id" binding:"required"` // 类目类型ID
	NodeID string `json:"node_id" binding:"required"` // 类目节点ID
} // [/]

type CateInfoParams struct {
	CateID string   `json:"cate_id" binding:"required"` // 类目类型ID
	NodeID []string `json:"node_id" binding:"required"` // 类目节点ID
} // [/]

// [/]

// [查询-搜索参数模板]

// [排序参数]
type SortParams struct {
	Fields    []string `json:"fields"`                                       // 排序字段列表
	Direction *string  `json:"direction" binding:"omitempty,oneof=asc desc"` // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
} // [/]

// [查询参数模板]
type QueryParamsTemplate struct {
	SortBy *SortParams `json:"sort_by"` // 排序依据
	PaginationParamWithKeyword
} // [/]

// [查询结果模板]
type QueryResultTemplate[T any] struct {
	TotalCount int `json:"total_count"` // 查询项总数
	Entries    []T `json:"entries"`     // 查询结果列表
} // [/]

// [搜索参数模板]
type SearchParamsTemplate[T any] struct {
	KeywordParam          // 搜索关键字
	Filter       T        `json:"filter"`    // 筛选条件
	NextFlag     []string `json:"next_flag"` // 分页标识
} // [/]

// [搜索结果模板]
type SearchResultTemplate[T any] struct {
	QueryResultTemplate[T]
	NextFlag []string `json:"next_flag"` // 分页标识
} // [/]

// [获取详情参数]
type IDParam struct {
	ID string `uri:"id"` // 对象ID
} // [/]

// [获取详情参数]
type IDParamV1 struct {
	ID models.ModelID `uri:"id" binding:"required,VerifyModelID"` // 对象ID
} // [/]

// [关键字参数]
type KeywordParam struct {
	Keyword string `json:"keyword" form:"keyword" binding:"TrimSpace,omitempty,min=1,max=255"` // 关键字查询，字符无限制
	// 关键字匹配匹配指定的字段。未指定时匹配信息资源目录名称、编码、描述、信息项
	Fields []KeywordField `json:"fields,omitempty"`
} // [/]

type KeywordField string

const (
	// 信息资源目录名称
	KeywordFieldName KeywordField = "name"
	// 信息资源目录编码
	KeywordFieldCode KeywordField = "code"
	// 信息资源目录描述
	KeywordFieldDescription KeywordField = "description"
	// 信息项
	KeywordFieldColumn KeywordField = "column"
	// 信息资源目录 - 业务表 - 名称
	KeywordFieldBusinessForm KeywordField = "business_form.name"
	// 信息资源目录 - 业务表 - 业务模型 - 名称
	KeywordFieldBusinessModelName KeywordField = "business_model.name"
	// 信息资源目录 - 业务表 - 业务模型 - 主干业务 - 名称
	KeywordFieldMainBusinessName KeywordField = "main_business.name"
	// 信息资源目录 - 业务表 - 业务模型 - 主干业务 - 部门及其上级部门 - 名称
	KeywordFieldMainBusinessDepartmentsName KeywordField = "main_business_departments.name"
	// 信息资源目录 - 业务表 - 业务模型 - 主干业务 - 业务领域 - 名称
	KeywordFieldBusinessDomainName KeywordField = "business_domain.name"
	// 信息资源目录 - 数据资源目录 - 名称
	KeywordFieldDataResourceCatalogName KeywordField = "data_resource_catalogs.name"
	// 信息资源目录 - 标签 - 名称
	KeywordFieldLabelsCatalogName KeywordField = "label_list_resp.name"
)

// 支持搜索的关键字字段，用于参数验证
var SupportedKeywordFields = sets.New(
	// 信息资源目录名称
	KeywordFieldName,
	// 信息资源目录编码
	KeywordFieldCode,
	// 信息资源目录描述
	KeywordFieldDescription,
	// 信息项
	KeywordFieldColumn,
	// 信息资源目录 - 业务表 - 名称
	KeywordFieldBusinessForm,
	// 信息资源目录 - 业务表 - 业务模型 - 名称
	KeywordFieldBusinessModelName,
	// 信息资源目录 - 业务表 - 业务模型 - 主干业务 - 名称
	KeywordFieldMainBusinessName,
	// 信息资源目录 - 业务表 - 业务模型 - 主干业务 - 部门及其上级部门 - 名称
	KeywordFieldMainBusinessDepartmentsName,
	// 信息资源目录 - 业务表 - 业务模型 - 主干业务 - 业务领域 - 名称
	KeywordFieldBusinessDomainName,
	// 信息资源目录 - 数据资源目录 - 名称
	KeywordFieldDataResourceCatalogName,
	// 信息资源目录 - 标签 - 名称
	KeywordFieldLabelsCatalogName,
)

// 返回默认的关键字匹配字段列表
func DefaultKeywordFields() []KeywordField {
	return []KeywordField{
		KeywordFieldName,
		KeywordFieldCode,
		KeywordFieldDescription,
		KeywordFieldColumn,
		KeywordFieldLabelsCatalogName,
	}
}

// [分页参数]
type PaginationParam struct {
	PageNumber *int `json:"offset" form:"offset" binding:"omitempty,min=1"`        // 页码，默认1
	Limit      *int `json:"limit" form:"limit" binding:"omitempty,min=0,max=2000"` // 每页大小，默认10 limit=0不分页
} // [/]

// [带关键字参数的分页参数]
type PaginationParamWithKeyword struct {
	PaginationParam
	KeywordParam
} // [/]

// [信息资源目录统计接口参数]
type StatisticsParam struct {
	OrgCode string `form:"org_code" binding:"required,uuid"` // 用户所属（一级）部门code
} // [/]

// [信息资源目录统计接口响应]
type StatisticsResp struct {
	AllCatalogNum        *int `json:"all_catalog_num,omitempty"` // 所有信息资源目录计数，仅运营角色返回，其它角色不返回
	OrgRelatedCatalogNum int  `json:"org_related_catalog_num"`   // 本（一级）部门及其下级部门信息资源目录计数
} // [/]

// [/]
