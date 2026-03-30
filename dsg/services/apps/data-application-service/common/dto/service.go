package dto

type ServiceListReq struct {
	Offset          int    `json:"offset" form:"offset,default=1" binding:"number,min=1" default:"1"`                                                                                                                                // 页码 默认 1
	Limit           int    `json:"limit" form:"limit,default=10" binding:"number,min=1,max=100" default:"10"`                                                                                                                        // 每页大小 默认 10
	Sort            string `json:"sort" form:"sort,default=create_time" binding:"omitempty,oneof=create_time update_time name online_time publish_time" default:"create_time"`                                                       // 排序类型 create_time 创建时间 update_time 更新时间 接口名称 name 默认 create_time
	Direction       string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`                                                                                                        // 排序方向 asc 正序 desc 倒序, 默认 desc
	DepartmentID    string `json:"department_id" form:"department_id" binding:"omitempty,VerifyNameEn" example:"019407c1-cf4e-7161-82cc-a97b906d1df0"`                                                                               // 所属部门id uncategory 表示未分类
	SubjectDomainId string `json:"subject_domain_id" form:"subject_domain_id" binding:"omitempty,uuid|eq=uncategory" example:"019407c1-f33a-7f39-83af-4647ac3967d3"`                                                                 // 主题域id uncategory 表示未分类
	OwnerId         string `json:"owner_id" form:"owner_id" binding:"omitempty,uuid" example:"019407c2-325a-77c3-a781-e480ad89336f"`                                                                                                 // 数据owner用户id
	EndTime         string `json:"end_time" form:"end_time" binding:"omitempty,datetime=2006-01-02 15:04:05" example:"2006-01-02 15:04:05"`                                                                                          // 结束时间 示例: 2006-01-02 15:04:05
	ServiceKeyword  string `json:"service_keyword" form:"service_keyword" binding:"omitempty"`                                                                                                                                       // 接口名称/接口编码
	ServiceType     string `json:"service_type" form:"service_type" binding:"omitempty,oneof=service_generate service_register"`                                                                                                     // 接口类型 service_generate 接口生成 service_register 接口注册
	StartTime       string `json:"start_time" form:"start_time" binding:"omitempty,datetime=2006-01-02 15:04:05" example:"2006-01-02 15:04:05"`                                                                                      // 开始时间 示例: 2006-01-02 15:04:05
	Status          string `json:"status" form:"status" binding:"omitempty,oneof=notline online offline up-auditing down-auditing up-reject down-reject"`                                                                            // 上线状态（单值，已废弃，建议使用 online_statuses）
	OnlineStatuses  string `json:"online_statuses" form:"online_statuses" binding:"omitempty" example:"online,down-auditing,down-reject"`                                                                                            // 上线状态（多值，支持逗号分隔，如：online,down-auditing,down-reject）
	PublishStatus   string `json:"publish_status" form:"publish_status" binding:"omitempty,oneof=unpublished pub-auditing published pub-reject change-auditing change-reject"`                                                       //发布状态
	AuditType       string `json:"audit_type" form:"audit_type" binding:"omitempty,oneof=af-data-application-online af-data-application-publish af-data-application-offline af-data-application-change af-data-application-request"` // 审核类型 unpublished 未发布 af-data-application-publish 发布审核
	AuditStatus     string `json:"audit_status" form:"audit_status" binding:"omitempty,oneof=unpublished auditing pass reject"`                                                                                                      // 审核状态 unpublished 未发布 auditing 审核中 pass 通过 reject 驳回
	IsAll           string `json:"is_all" form:"is_all,default=true" binding:"omitempty,oneof=true false"`                                                                                                                           // 是否查看部门/主题域的子节点 true 查看子节点 false 仅查看当前节点
	IsUserDep       string `json:"is_user_dep" form:"is_user_dep,default=false" binding:"omitempty,oneof=true false"`
	CategoryId      string `json:"category_id" form:"category_id" binding:"omitempty,uuid"`
	CategoryNodeId  string `json:"category_node_id" form:"category_node_id" binding:"omitempty,uuid"`
	InfoSystemId    string `json:"info_system_id" form:"info_system_id"`
	DataOwner       string `json:"data_owner" form:"data_owner" binding:"omitempty"` //数据owner过滤

	ServiceIDSlice []string `json:"-"`
	// 权限规则状态过滤器，非空时根据滤逻辑视图及其子视图的权限规则状态过滤。
	//
	//  Active：返回所有规则都处于有效期的逻辑视图
	//  Expired：返回任意规则已过期的逻辑视图
	PolicyStatus PolicyStatusFilter `json:"policy_status,omitempty" form:"policy_status"`
	// 非空时返回指定 Status 的 Service，包括发布状态和上线状态
	//
	// TODO: 使用 Status 过滤发布状态和上线状态，而不只是发布状态
	PublishAndOnlineStatuses string `json:"publish_and_online_statuses" form:"publish_and_online_status" example:"online,down-auditing,down"`
	IsAuthed                 bool   `json:"is_authed" form:"is_authed" binding:"omitempty"`
	MyDepartmentResource     bool   `json:"my_department_resource" form:"my_department_resource"` //本部门资源
}

type ServiceListRes struct {
	PageResult[ServiceInfoAndDraftFlag]
}

// ServiceInfoAndDraftFlag 新增草稿标识
type ServiceInfoAndDraftFlag struct {
	ServiceInfo
	// 是否拥有未发布的草稿
	HasDraft        bool   `json:"has_draft"`
	DataCatalogID   string `json:"data_catalog_id"`   // 所属目录ID
	DataCatalogName string `json:"data_catalog_name"` // 所属目录
	CatalogProvider string `json:"catalog_provider"`  // 目录提供方
	InvokeNum       int    `json:"invoke_num"`        // 调用次数
}
type ServiceIDReq struct {
	ServiceID string `json:"service_id" uri:"service_id" binding:"required,VerifyNameEn"`
}

type ServiceNameConverterReq struct {
	ServiceName string `json:"service_name" form:"service_name" binding:"required,VerifyDescription"`
}

type ServiceGetReq struct {
	ServiceID string `json:"service_id" uri:"service_id" binding:"required,VerifyNameEn" example:"019407b2-bf43-7eab-a9a6-277c5fb5f56c"`
}

type GetServicesDataViewRes struct {
	DataViewId string `json:"data_view_id" uri:"data_view_id" binding:"required,uuid"`
	ArrayResult[ServicesGetByDataViewId]
}

type ServicesGetByDataViewIdReq struct {
	DataViewId string `json:"data_view_id" uri:"data_view_id" binding:"required,uuid"`
}

type ServicesGetByDataViewIdRes struct {
	ArrayResult[ServicesGetByDataViewId]
}

type ServicesGetByDataViewId struct {
	ServiceID   string `json:"service_id"`   // 接口ID
	ServiceCode string `json:"service_code"` // 接口编码
	ServiceName string `json:"service_name"` // 接口名称
}

type ServiceSqlToFormReq struct {
	// Deprecated: 数据源通过逻辑视图关联
	DatasourceId string `json:"datasource_id" binding:"omitempty,uuid"` // 数据源id
	DataViewId   string `json:"data_view_id" binding:"required,uuid"`   // 数据视图Id
	SQL          string `json:"sql" binding:"required"`                 // sql
}

type ServiceFormToSqlReq struct {
	// Deprecated: 数据源通过逻辑视图关联
	DatasourceId            string                   `json:"datasource_id" binding:"omitempty,uuid"`             // 数据源id
	DataViewId              string                   `json:"data_view_id" binding:"required,uuid"`               // 数据视图Id
	DataTableRequestParams  []DataTableRequestParam  `json:"data_table_request_params" binding:"required,dive"`  // 请求参数
	DataTableResponseParams []DataTableResponseParam `json:"data_table_response_params" binding:"required,dive"` // 返回参数
}

type ServiceCheckServiceNameReq struct {
	ServiceID   string `json:"service_id" form:"service_id" binding:"omitempty,VerifyNameEn"`
	ServiceName string `json:"service_name" form:"service_name" binding:"required,VerifyDescription"`
}

type ServiceCheckServicePathReq struct {
	ServiceID   string `json:"service_id" form:"service_id" binding:"omitempty,VerifyNameEn"`
	ServicePath string `json:"service_path" form:"service_path" binding:"required,URL,max=255"`
}

type ServiceDeleteReq struct {
	ServiceID string `json:"service_id" uri:"service_id" binding:"required,VerifyNameEn"`
}

type ServiceCreateOrTempReq struct {
	IsTemp          bool              `json:"is_temp" default:"false"` //true即暂存
	ServiceInfo     ServiceInfo       `json:"service_info"`            // 基本信息
	CategoryInfo    []CategoryInfo    `json:"category_info"`           // 类目信息集合
	ServiceParam    ServiceParamWrite `json:"service_param"`           // 参数配置
	ServiceResponse ServiceResponse   `json:"service_response"`        // 返回结果
	ServiceTest     ServiceTest       `json:"service_test"`            // 接口测试
}

type ServiceCreateReq struct {
	ServiceInfo     ServiceInfo       `json:"service_info"`     // 基本信息
	ServiceParam    ServiceParamWrite `json:"service_param"`    // 参数配置
	ServiceResponse ServiceResponse   `json:"service_response"` // 返回结果
	ServiceTest     ServiceTest       `json:"service_test"`     // 接口测试
}

type ServiceUpdateUriReq struct {
	ServiceID string `json:"service_id" uri:"service_id" binding:"required,VerifyNameEn"`
}

type ServiceUpdateBodyReq struct {
	ServiceInfo     ServiceInfo       `json:"service_info"`     // 基本信息
	ServiceParam    ServiceParamWrite `json:"service_param"`    // 参数配置
	ServiceResponse ServiceResponse   `json:"service_response"` // 返回结果
	ServiceTest     ServiceTest       `json:"service_test"`     // 接口测试
}

type ServiceUpdateReq struct {
	ServiceUpdateUriReq
	ServiceUpdateBodyReq
}

type ServiceUpdateOrTempBodyReq struct {
	IsTemp          bool              `json:"is_temp" default:"false"`
	ServiceInfo     ServiceInfo       `json:"service_info"`     // 基本信息
	CategoryInfo    []CategoryInfo    `json:"category_info"`    // 类目信息集合
	ServiceParam    ServiceParamWrite `json:"service_param"`    // 参数配置
	ServiceResponse ServiceResponse   `json:"service_response"` // 返回结果
	ServiceTest     ServiceTest       `json:"service_test"`     // 接口测试
}

type ServiceUpdateReqOrTemp struct {
	ServiceUpdateUriReq
	ServiceUpdateOrTempBodyReq
}

type ServiceInfo struct {
	// 接口ID
	ServiceID string `json:"service_id" form:"service_id" binding:"omitempty,VerifyNameEn" example:"019407b3-d158-7177-a0c8-0da2f2683c50"`
	// 接口编码
	ServiceCode string `json:"service_code" form:"service_code" binding:"omitempty,VerifyNameEn" example:"jk20241227/000001"`
	// 申请数
	ApplyNum uint64 `json:"apply_num,omitempty" example:"114514"`
	// 预览数
	PreviewNum uint64 `json:"preview_num,omitempty" example:"12450"`
	// 状态 draft 草稿 publish 已发布
	Status string `json:"status" form:"status" binding:"omitempty,oneof=notline online offline up-auditing down-auditing up-reject"`
	//发布状态
	PublishStatus string `json:"publish_status" form:"publish_status" binding:"omitempty,oneof=unpublished pub-auditing published pub-reject change-auditing change-reject"`
	// 审核类型 unpublished 未发布 af-data-application-publish 发布审核
	AuditType string `json:"audit_type" form:"audit_type" binding:"omitempty,oneof=unpublished af-data-application-publish af-data-application-online af-data-application-offline af-data-application-change af-data-application-request"`
	// 审核状态 unpublished 未发布 auditing 审核中 pass 通过 reject 驳回
	AuditStatus string `json:"audit_status" form:"audit_status" binding:"omitempty,oneof=unpublished auditing pass reject"`
	// 审核意见，仅驳回时有用
	AuditAdvice string `json:"audit_advice" example:"拒绝"`
	// 上线审核意见
	OnlineAuditAdvice string `json:"online_audit_advice" example:"拒绝"`
	// 主题域id
	SubjectDomainId string `json:"subject_domain_id" form:"subject_domain_id" binding:"omitempty,uuid" example:"019407b5-1d1f-72ab-8b0a-5cd759737270"`
	// 获取主题域名称
	//
	// Deprecated: 通过 SubjectDomainId
	SubjectDomainName string `json:"subject_domain_name" form:"subject_domain_name" binding:"omitempty" example:"主题域名称"`
	// 接口类型 service_generate 接口生成 service_register 接口注册
	ServiceType string `json:"service_type" form:"service_type" binding:"required,oneof=service_generate service_register"`
	// 接口名称
	ServiceName string `json:"service_name" binding:"required,VerifyDescription" example:"接口名称"`
	// 所属部门
	Department Department `json:"department"`
	// 信息系统id
	InfoSystemId string `json:"info_system_id" form:"info_system_id" example:"019407b5-1d1f-72ab-8b0a-5cd759737270"`
	// 信息系统名称
	InfoSystemName string `json:"info_system_name" form:"info_system_name" binding:"omitempty" example:"信息系统名称"`
	// 应用id
	AppsId string `json:"apps_id" form:"apps_id" example:"019407b5-1d1f-72ab-8b0a-5cd759737270"`
	// 应用名称
	AppsName string `json:"apps_name" form:"apps_name" binding:"omitempty" example:"应用名称"`
	// 同步标识(success、fail)
	SyncFlag string `json:"sync_flag" form:"sync_flag" binding:"omitempty" example:"success"`
	// 同步消息
	SyncMsg string `json:"sync_msg" form:"sync_msg" binding:"omitempty" example:"同步消息"`
	// 授权id
	PaasID string `json:"paas_id" form:"paas_id" binding:"omitempty" example:"授权id"`
	// 网关路径前缀
	PrePath string `json:"pre_path" form:"pre_path" binding:"omitempty" example:"网关路径前缀"`
	// 来源类型(0原生，1迁移)
	SourceType int `json:"source_type" form:"source_type" binding:"omitempty" example:"0"`
	// 更新标识
	UpdateFlag string `json:"update_flag" form:"update_flag" binding:"omitempty" example:"success"`
	// 更新消息
	UpdateMsg string `json:"update_msg" form:"update_msg" binding:"omitempty" example:"更新消息"`

	CategoryInfo []CategoryInfo `json:"category_info"` // 类目信息集合
	// 数据owner用户id
	OwnerId string `json:"-"`
	// 数据owner用户名
	OwnerName string   `json:"-"`
	Owners    []Owners `json:"owners" binding:"omitempty,dive"`
	// 网关地址
	GatewayUrl string `json:"gateway_url"`
	// 接口路径
	ServicePath string `json:"service_path" binding:"omitempty,omitempty,URL,max=255" example:"/api/path"`
	// 后台服务域名/IP
	BackendServiceHost string `json:"backend_service_host" binding:"omitempty,HOST,max=128" example:"http://backend.example.org:8080"`
	// 后台服务路径
	BackendServicePath string `json:"backend_service_path" binding:"omitempty,URL,max=128" example:"/api/backend/path"`
	// 请求方式 post get
	HTTPMethod string `json:"http_method" binding:"omitempty,oneof=post get put delete"`
	// 返回类型 json
	ReturnType string `json:"return_type" binding:"omitempty,oneof=json"`
	// 协议 http
	Protocol string `json:"protocol" binding:"omitempty,oneof=http"`
	// 接口文档
	File File `json:"file"`
	// 接口说明
	Description string `json:"description" binding:"omitempty,VerifyDescription,max=255" example:"接口说明"`
	// 开发商
	Developer Developer `json:"developer"`
	// 调用频次 次/秒
	RateLimiting int64 `json:"rate_limiting" binding:"omitempty,number,min=0,max=100000"`
	// 超时时间
	Timeout int64 `json:"timeout" binding:"omitempty,number,min=1,max=86400"`
	// 上线时间
	OnlineTime string `json:"online_time,omitempty"`
	// 发布时间
	PublishTime string `json:"publish_time,omitempty"`
	//发起变更的接口的service_id
	ChangedServiceId string `json:"changed_service_id" form:"changed_service_id" example:"019407b9-4972-7f08-816e-657debee319a"`
	//已变更1，未变更0，默认0,用于标记service是否已变更
	IsChanged string `json:"is_changed" form:"is_changed" example:"0"`
	// 创建时间
	CreateTime string `json:"create_time,omitempty" example:"2024-12-27 18:43:59"`
	// 更新时间
	UpdateTime string `json:"update_time,omitempty" example:"2024-12-27 18:43:59"`
	// 创建者的用户 ID
	CreatedBy string `json:"created_by,omitempty" example:"019407ba-74da-7e20-b4d3-44c4844cf666"`
	// 更新者的用户 ID
	UpdateBy  string `json:"update_by,omitempty" example:"019407ba-74da-7e26-bf58-bbb44cc30cf9"`
	IsFavored bool   `json:"is_favored"`                // 是否已收藏
	FavorID   uint64 `json:"favor_id,string,omitempty"` // 收藏项ID，仅已收藏时返回该字段
	CanAuth   bool   `json:"can_auth"`                  // 是否可以授权给其他人
}

type CategoryInfo struct {
	CategoryId       string `json:"category_id" binding:"omitempty,uuid" example:"019407b6-c67b-7a4d-ad2a-dac2791d23b6"`
	CategoryName     string `json:"category_name" binding:"omitempty" example:"类目名称"`
	CategoryNodeID   string `json:"category_node_id" binding:"omitempty" example:"019407b6-c67b-7a4d-ad2a-dac2791d23b6"`
	CategoryNodeName string `json:"category_node_name" binding:"omitempty" example:"类目节点名称"`
}

type Owners struct {
	// 数据owner用户id
	OwnerId string `json:"owner_id" binding:"omitempty,uuid" example:"019407b6-c67b-7a4d-ad2a-dac2791d23b6"`
	// 数据owner用户名
	OwnerName string `json:"owner_name" binding:"omitempty" example:"数据 Owner 用户名"`
}

type ServiceFrontendInfo struct {
	ServiceID      string `json:"service_id,omitempty"`   // 接口ID
	ServiceCode    string `json:"service_code"`           // 接口编码
	ServiceName    string `json:"service_name,omitempty"` // 接口名称
	ServiceAddress string `json:"service_address"`        // 接口地址
	ServiceType    string `json:"service_type,omitempty"` // 接口类型 service_generate 接口生成 service_register 接口注册
	OrgCode        string `json:"org_code"`               // 部门id
	OrgName        string `json:"org_name"`               // 部门名称
	HTTPMethod     string `json:"http_method,omitempty"`  // 请求方式 post get
}

type ServiceParamRead struct {
	// 创建模式 wizard 向导模式 script 脚本模式
	CreateModel string `json:"create_model,omitempty" binding:"omitempty,oneof=wizard script"`
	// 数据源id
	DatasourceId string `json:"datasource_id" binding:"omitempty,uuid" example:"019407bc-0475-7854-b93d-3bd8190d14af"`
	// 数据源名称
	DatasourceName string `json:"datasource_name" binding:"omitempty" example:"数据源名称"`
	// 数据视图Id
	DataViewId string `json:"data_view_id" binding:"omitempty,uuid" example:"019407bc-0475-7858-8251-a1297572f048"`
	// 数据视图名称
	DataViewName string `json:"data_view_name" binding:"omitempty" example:"数据视图名称"`
	// 脚本（仅脚本模式需要此参数）
	Script string `json:"script,omitempty" binding:"omitempty" example:"SELECT * FROM testing"`
	// 请求参数
	DataTableRequestParams []DataTableRequestParam `json:"data_table_request_params" binding:"dive"`
	// 返回参数
	DataTableResponseParams []DataTableResponseParam `json:"data_table_response_params" binding:"dive"`
}

type ServiceParamWrite struct {
	CreateModel string `json:"create_model,omitempty" binding:"omitempty,oneof=wizard script"` // 创建模式 wizard 向导模式 script 脚本模式

	// 数据源 ID
	//
	// Deprecated: 数据源通过逻辑视图关联
	DatasourceId string `json:"datasource_id" binding:"omitempty,uuid"`

	// 数据源名称
	//
	// Deprecated: 数据源通过逻辑视图关联
	DatasourceName string `json:"datasource_name" binding:"omitempty"`

	DataViewId              string                   `json:"data_view_id" binding:"omitempty,uuid"`     // 数据视图Id
	DataViewName            string                   `json:"data_view_name" binding:"omitempty"`        // 数据视图名称
	Script                  string                   `json:"script,omitempty" binding:"omitempty"`      // 脚本（仅脚本模式需要此参数）
	DataTableRequestParams  []DataTableRequestParam  `json:"data_table_request_params" binding:"dive"`  // 请求参数
	DataTableResponseParams []DataTableResponseParam `json:"data_table_response_params" binding:"dive"` // 返回参数
}

type DataTableRequestParam struct {
	// 中文名称
	CNName string `json:"cn_name" binding:"omitempty,VerifyDescription,max=255" example:"年龄"`
	// 英文名称
	EnName string `json:"en_name" binding:"omitempty,max=255" example:"age"`
	// 字段类型
	DataType string `json:"data_type" binding:"omitempty,oneof=string int long float double boolean"`
	// 是否必填 yes 必填 no非必填
	Required string `json:"required" binding:"omitempty,oneof=yes no"`
	// 运算逻辑 = 等于, != 不等于, > 大于, >= 大于等于, < 小于, <= 小于等于, like 模糊匹配, in 包含, not in 不包含
	Operator string `json:"operator" binding:"omitempty,oneof='=' '!=' '>' '>=' '<' '<=' 'like' 'in' 'not in'"`
	// 默认值
	DefaultValue string `json:"default_value" binding:"omitempty,VerifyDescription,max=128"`
	// 描述
	Description string `json:"description" binding:"omitempty,VerifyDescription,max=255" example:"过滤不超过此年龄的用户"`
}

type DataTableResponseParam struct {
	// 中文名称
	CNName string `json:"cn_name" binding:"omitempty,VerifyDescription,max=255" example:"年龄"`
	// 英文名称
	EnName string `json:"en_name" binding:"omitempty,max=255" example:"age"`
	// 字段类型
	DataType string `json:"data_type" binding:"omitempty,oneof=string int long float double boolean"`
	// 描述
	Description string `json:"description" binding:"omitempty,VerifyDescription,max=255" example:"用户的年龄"`
	// 排序方式 unsorted 不排序 asc 升序 desc 降序 默认 unsorted
	Sort string `json:"sort" binding:"omitempty,oneof=unsorted asc desc"`
	// 脱敏规则 plaintext 不脱敏 hash 哈希 override 覆盖 replace 替换 默认 plaintext
	Masking string `json:"masking" binding:"omitempty,oneof=plaintext hash override replace"`
	// 序号
	Sequence int64 `json:"sequence" binding:"omitempty,number,min=1"`
}

type ServiceResponse struct {
	Rules    []Rule `json:"rules" binding:"omitempty,dive"`                      // 过滤规则
	Page     string `json:"page" binding:"omitempty,oneof=yes no"`               // 是否分页 yes 是 no 否
	PageSize int64  `json:"page_size" binding:"omitempty,number,min=1,max=1000"` // 分页大小
}

type Rule struct {
	Param    string `json:"param" binding:"omitempty,VerifyNameEn"`                                             // 过滤字段
	Operator string `json:"operator" binding:"omitempty,oneof='=' '!=' '>' '>=' '<' '<=' 'like' 'in' 'not in'"` // 运算逻辑 = 等于, != 不等于, > 大于, >= 大于等于, < 小于, <= 小于等于, like 模糊匹配, in 包含, not in 不包含
	Value    string `json:"value" binding:"omitempty,VerifyDescription,max=128"`                                // 过滤值
}

type ServiceTest struct {
	RequestExample  string `json:"request_example" binding:"omitempty,json"`  // 请求示例
	ResponseExample string `json:"response_example" binding:"omitempty,json"` // 返回示例
}

type Category struct {
	ID   string `json:"id" binding:"omitempty,VerifyNameEn"` // 分类id
	Name string `json:"name" binding:"omitempty"`            // 分类名称
}

type Department struct {
	ID   string `json:"id" binding:"omitempty,uuid"` // 部门id
	Name string `json:"name" binding:"omitempty"`    // 部门名称
}

type ServiceCreateRes struct {
	ServiceID string `json:"service_id"` //接口ID
}

type ServiceGetRes struct {
	ServiceInfo     ServiceInfo      `json:"service_info"`               // 基本信息
	CategoryInfo    []CategoryInfo   `json:"category_info"`              // 类目信息集合
	ServiceParam    ServiceParamRead `json:"service_param"`              // 参数配置
	ServiceResponse *ServiceResponse `json:"service_response,omitempty"` // 返回结果
	ServiceTest     ServiceTest      `json:"service_test"`               // 接口测试
}

type ServiceGetFrontendRes struct {
	ServiceGetRes
	ServiceApply ServiceApply `json:"service_apply"` // 申请详情
}

type ServiceSqlToFormRes struct {
	Tables                  []string                  `json:"tables"`                     // 表名
	DataTableRequestParams  []*DataTableRequestParam  `json:"data_table_request_params"`  // 请求字段
	DataTableResponseParams []*DataTableResponseParam `json:"data_table_response_params"` // 返回字段
}

type ServiceFormToSqlRes struct {
	SQL string `json:"sql"`
}

type ServiceDataQueryRes struct {
	Request  string `json:"request"`
	Response string `json:"response"`
}

// ServiceESMessage 接口数据变动同步到ES
type ServiceESMessage struct {
	Type string               `json:"type"` // 消息类型 create | update | delete
	Body ServiceESMessageBody `json:"body"`
}

type ServiceESMessageBody struct {
	DataOwnerId   string `json:"data_owner_id,omitempty"`   // 数据owner ID
	DataOwnerName string `json:"data_owner_name,omitempty"` // 数据owner名称
	Description   string `json:"description,omitempty"`     // 接口服务描述
	Docid         string `json:"docid"`                     // es docid，唯一标识
	Id            string `json:"id,omitempty"`              // id 接口服务唯一标识
	Code          string `json:"code,omitempty"`            // 编码
	Name          string `json:"name,omitempty"`            // 接口服务名称
	OnlineAt      int64  `json:"online_at,omitempty"`       // 接口服务上线时间
	//Orgcode               string     `json:"orgcode,omitempty"`                  // 所属组织架构ID
	//Orgname               string     `json:"orgname,omitempty"`                  // 组织架构名称
	//OrgnamePath           string     `json:"orgname_path,omitempty"`             // 组织架构完整路径
	//SubjectDomainId       string     `json:"subject_domain_id,omitempty"`        // 主题域id
	//SubjectDomainName     string     `json:"subject_domain_name,omitempty"`      // 主题域名称
	//SubjectDomainNamePath string     `json:"subject_domain_name_path,omitempty"` // 主题域完整路径
	UpdatedAt int64      `json:"updated_at,omitempty"` // 接口服务更新时间
	Fields    []Field    `json:"fields,omitempty"`     // 接口返回值的字段列表
	CateInfo  []CateInfo `json:"cate_info,omitempty"`  //类目信息
	// 接口是否已发布。接口的发布状态处于以下状态视为已发布
	//  - published 已发布
	//  - change-auditing 变更审核中
	//  - change-reject 变更审核未通过
	IsPublish bool `json:"is_publish,omitempty"` // 接口是否已经被发布
	// 接口是否已上线。接口的上线状态处于以下状态时视为已上线
	//  - online 已上线
	//  - down-auditing 下线审核中
	//  - down-reject 下线审核未通过
	ISOnline      bool   `json:"is_online,omitempty"`        // 接口是否已经上线
	PublishedAt   int64  `json:"published_at,omitempty"`     // 发布时间，时间戳，单位：毫秒
	PublishStatus string `json:"published_status,omitempty"` // 发布状态
	// 上线状态
	OnlineStatus string `json:"online_status,omitempty"`
	// 接口类型
	APIType string `json:"api_type,omitempty"`
}

type Field struct {
	// 中文名称
	FieldNameZH string `json:"field_name_zh"`
	// 英文名称
	FieldNameEN string `json:"field_name_en"`
}

type CateInfo struct {
	//类目ID
	CateId string `json:"cate_id"`
	//节点ID
	NodeId   string `json:"node_id"`
	NodeName string `json:"node_name"`
	NodePath string `json:"node_path"`
}

type ServiceSearchReq struct {
	Keyword         string    `json:"keyword" binding:"omitempty"`                             // 搜索关键词，支持字段：接口名称，接口说明
	OrgCode         string    `json:"org_code" binding:"omitempty,uuid"`                       // 部门id
	SubjectDomainId string    `json:"subject_domain_id" binding:"omitempty,uuid"`              // 主题域id
	PublishedAt     TimeRange `json:"published_at" binding:"omitempty"`                        // 发布时间
	Size            int       `json:"size" binding:"omitempty,gt=0" default:"20" example:"20"` // 要获取到的记录条数
	NextFlag        []string  `json:"next_flag" binding:"omitempty"`                           // 从该flag标志后获取数据，该flag标志由上次的搜索请求返回，若本次与上次的搜索参数存在变动，则该参数不能传入，否则结果不准确
}

type TimeRange struct {
	StartTime int64 `json:"start_time" binding:"omitempty,gte=0" example:"1682586655000"` // 开始时间，毫秒时间戳
	EndTime   int64 `json:"end_time" binding:"omitempty,gte=0"  example:"1682586655000"`  // 结束时间，毫秒时间戳
}

type ServiceSearch struct {
	ID             string `json:"id"`                    // 接口ID
	Name           string `json:"name"`                  // 接口名称，可能存在高亮标签
	RawName        string `json:"raw_name"`              // 接口名称，不会存在高亮标签
	Description    string `json:"description"`           // 接口描述，可能存在高亮标签
	RawDescription string `json:"raw_description"`       // 接口描述，不会存在高亮标签
	AuditStatus    string `json:"audit_status"`          // 接口申请状态 auditing 审核中 pass 通过 reject 驳回
	OnlineTime     int64  `json:"online_time,omitempty"` // 接口发布时间 时间戳
	OrgCode        string `json:"orgcode"`               // 部门id
	OrgName        string `json:"orgname"`               // 部门名称
	DataOwnerID    string `json:"data_owner_id"`         // 数据 owner id
	DataOwnerName  string `json:"data_owner_name"`       // 数据 owner 名称

	SearchAllExt
}

// 字段搜索需求扩展字段，避免修改原字段引起BUG，在原有字段基础上新增字段

type SearchAllExt struct {
	Code         string `json:"code"`  // 接口ID
	Title        string `json:"title"` // 接口名称 as Name
	RawTitle     string `json:"raw_title"`
	RawOrgName   string `json:"raw_orgname"`
	PublishedAt  int64  `json:"published_at"` // 接口发布时间 as PublishedAt
	OwnerID      string `json:"owner_id"`     // 数据owner id
	OwnerName    string `json:"owner_name"`   // 数据owner name
	RawOwnerName string `json:"raw_owner_name"`
}

type ServiceSearchRes struct {
	PageResult[ServiceSearch]
	NextFlag []string `json:"next_flag" example:"0.987,abc"` // 获取下一页数据的请求中，需携带本参数，若本参数为空，则数据已全部获取，没有下一页了
}

type ServiceListByCodesReq struct {
	Codes []string `json:"codes"`
}

type ServiceListByCodesResp struct {
	PageResult[ServiceInfo]
}

type OptionsInfoRes struct {
	PublishStatus []OptionsInfo `json:"publish_status"`
	UpdownStatus  []OptionsInfo `json:"updown_status"`
}

type OptionsInfo struct {
	Key  string `json:"key"`
	Text string `json:"text"`
}

type UndoAuditReq struct {
	ServiceID   string `json:"service_id"`                                                                           // 接口ID
	OperateType string `json:"operate_type" binding:"required,oneof=publish-audit change-audit up-audit down-audit"` //撤回审核的类型
}

type ServiceIdRes struct {
	ServiceID string `json:"service_id"` //接口ID
}

type ServiceIdReq struct {
	ServiceID string `json:"service_id" uri:"service_id" binding:"required,VerifyNameEn"` //接口ID
}

type ServiceIdsReq struct {
	ServiceIDs []string `json:"service_ids" form:"service_ids" binding:"omitempty,dive,uuid" example:"019407b3-d158-7177-a0c8-0da2f2683c50" description:"接口ID列表"` //接口IDs
}

type ServiceChangeReq struct {
	ServiceUpdateUriReq
	ServiceChangeBodyReq
}

type ServiceChangeBodyReq struct {
	IsTemp          bool              `json:"is_temp" default:"false"`
	ServiceInfo     ServiceInfo       `json:"service_info"`     // 基本信息
	ServiceParam    ServiceParamWrite `json:"service_param"`    // 参数配置
	ServiceResponse ServiceResponse   `json:"service_response"` // 返回结果
	ServiceTest     ServiceTest       `json:"service_test"`     // 接口测试
}
type ServiceUpOrDownReq struct {
	ServiceID   string `json:"service_id"` //接口ID
	OperateType string `json:"operate_type" form:"operate_type" binding:"omitempty,oneof=up down"`
}

type GetServicesMaxResponseReq struct {
	ServiceID []string `json:"service_id" form:"service_id" binding:"required,dive,uuid" example:"019407b2-bf43-7eab-a9a6-277c5fb5f56c"`
}

type ServiceIDListReq struct {
	IDs []string `json:"ids" binding:"required,dive,uuid" example:"019407b2-bf43-7eab-a9a6-277c5fb5f56c"`
}

type HasSubServiceAuthParamReq struct {
	HasSubServiceAuthParam `param_type:"query"`
}

type HasSubServiceAuthParam struct {
	UserID    string `binding:"required" form:"user_id"  json:"user_id"`
	ServiceID string `binding:"required" form:"service_id" json:"service_id,omitempty"`
}

// MonitorRecord 监控记录请求结构体
type MonitorListReq struct {
	ServiceID           string `json:"service_id" form:"service_id" binding:"omitempty,uuid" example:"019407b2-bf43-7eab-a9a6-277c5fb5f56c"`                       // 接口ID列表
	Keyword             string `json:"keyword" form:"keyword" binding:"omitempty" example:"接口名称"`                                                                  // 关键词
	ServiceDepartmentID string `json:"service_department_id" form:"service_department_id" binding:"omitempty,uuid" example:"019407b2-bf43-7eab-a9a6-277c5fb5f56c"` // 接口所属部门ID
	CallDepartmentID    string `json:"call_department_id" form:"call_department_id" binding:"omitempty,uuid" example:"019407b2-bf43-7eab-a9a6-277c5fb5f56c"`       // 调用部门ID
	CallInfoSystemID    string `json:"call_system_id" form:"call_system_id" binding:"omitempty,uuid" example:"019407b2-bf43-7eab-a9a6-277c5fb5f56c"`               // 调用信息系统ID
	CallAppID           string `json:"call_app_id" form:"call_app_id" binding:"omitempty,uuid" example:"019407b2-bf43-7eab-a9a6-277c5fb5f56c"`                     // 调用应用ID
	Status              string `json:"status" form:"status" binding:"omitempty,oneof=success fail" example:"success"`                                              // 调用状态 success 成功 fail
	StartTime           string `json:"start_time" form:"start_time" binding:"omitempty,datetime=2006-01-02 15:04:05" example:"2006-01-02 15:04:05"`                // 调用开始时间
	EndTime             string `json:"end_time" form:"end_time" binding:"omitempty,datetime=2006-01-02 15:04:05" example:"2006-01-02 15:04:05"`                    // 调用结束时间
	Offset              int    `json:"offset" form:"offset" binding:"omitempty,min=0" default:"0" example:"0"`                                                     // 偏移量
	Limit               int    `json:"limit" form:"limit" binding:"omitempty,min=1,max=100" default:"20" example:"20"`                                             // 每页大小
	Sort                string `json:"sort" form:"sort" binding:"omitempty,oneof=call_time call_start_time call_end_time" example:"call_time"`                     // 排序类型 call_time 调用时间 调用开始时间 call_start_time 调用结束时间 call_end_time
	Direction           string `json:"direction" form:"direction" binding:"omitempty,oneof=asc desc" example:"desc"`                                               // 排序方向 asc 正序 desc 倒序
}

// MonitorRecord 监控记录结构体
type MonitorRecord struct {
	ServiceID               string `json:"service_id"`                 // 服务ID
	ServiceName             string `json:"service_name"`               // 服务名称
	ServiceDepartmentID     string `json:"service_department_id"`      // 服务所属部门ID
	ServiceDepartmentName   string `json:"service_department_name"`    // 服务所属部门名称
	ServiceDepartmentPath   string `json:"service_department_path"`    // 服务所属部门全路径
	CallDepartmentID        string `json:"call_department_id"`         // 调用部门ID
	CallDepartmentName      string `json:"call_department_name"`       // 调用部门名称
	CallDepartmentPath      string `json:"call_department_path"`       // 调用部门全路径
	CallSystemID            string `json:"call_system_id"`             // 调用系统ID
	CallSystemName          string `json:"call_system_name"`           // 调用系统名称
	CallAppName             string `json:"call_app_name"`              // 调用应用名称
	CallAppID               string `json:"call_app_id"`                // 调用应用ID
	CallHostAndPort         string `json:"call_host_and_port"`         // 调用IP及端口
	CallTime                string `json:"call_time"`                  // 调用时间，格式为yyyy-MM-dd HH:mm:ss
	CallDuration            string `json:"call_duration"`              // 调用时长
	CallNum                 int    `json:"call_num"`                   // 调用次数
	CallAverageCallDuration int    `json:"call_average_call_duration"` // 平均调用时长
	Status                  string `json:"status"`                     // 状态 (success, fail)
}

// MonitorListRes 监控列表响应结构体
type MonitorListRes struct {
	PageResult[MonitorRecord]
}

// GatewayCollectionLogReq 第三方网关采集日志请求结构体
type GatewayCollectionLogReq struct {
	SvcID           string `json:"svc_id" form:"svc_id" binding:"omitempty,uuid" example:"019407b2-bf43-7eab-a9a6-277c5fb5f56c"` //服务ID列表
	Keyword         string `json:"keyword" form:"keyword" binding:"omitempty" example:"接口名称"`                                    //关键词
	SvcBelongDeptID string `json:"svc_belong_dept_id" form:"svc_belong_dept_id"`                                                 // 服务所属部门ID
	InvokeSvcDeptID string `json:"invoke_svc_dept_id" form:"invoke_svc_dept_id"`                                                 // 调用部门ID
	InvokeSystemID  string `json:"invoke_system_id" form:"invoke_system_id"`                                                     // 调用系统ID
	InvokeAppID     string `json:"invoke_app_id" form:"invoke_app_id"`
	StartTime       string `json:"start_time" form:"start_time" binding:"omitempty,datetime=2006-01-02 15:04:05" example:"2006-01-02 15:04:05"` // 调用开始时间
	EndTime         string `json:"end_time" form:"end_time" binding:"omitempty,datetime=2006-01-02 15:04:05" example:"2006-01-02 15:04:05"`     // 调用应用ID
	Offset          int    `json:"offset" form:"offset" binding:"omitempty,min=0" default:"0" example:"0"`                                      // 偏移量
	Limit           int    `json:"limit" form:"limit" binding:"omitempty,min=1,max=100" default:"10" example:"10"`                              // 每页大小
	Sort            string `json:"sort" form:"sort" binding:"omitempty,oneof=call_time call_start_time call_end_time" example:"call_time"`      // 排序类型 call_time 调用时间 调用开始时间 call_start_time 调用结束时间 call_end_time
	Direction       string `json:"direction" form:"direction" binding:"omitempty,oneof=asc desc" example:"desc"`                                // 排序方向 asc 正序 desc 倒序
}

// GatewayCollectionLog 第三方网关采集日志结构体
type GatewayCollectionLog struct {
	SvcID                     string `json:"svc_id"`                       // 服务ID
	SvcName                   string `json:"svc_name"`                     // 服务名称
	SvcBelongDeptID           string `json:"svc_belong_dept_id"`           // 服务所属部门ID
	SvcBelongDeptName         string `json:"svc_belong_dept_name"`         // 服务所属部门名称
	SvcBelongDeptPath         string `json:"svc_belong_dept_path"`         // 服务所属部门全路径
	InvokeSvcDeptID           string `json:"invoke_svc_dept_id"`           // 调用部门ID
	InvokeSvcDeptName         string `json:"invoke_svc_dept_name"`         // 调用部门名称
	InvokeSvcDeptPath         string `json:"invoke_svc_dept_path"`         // 调用部门全路径
	InvokeSystemID            string `json:"invoke_system_id"`             // 调用系统ID
	InvokeSystemName          string `json:"invoke_system_name"`           // 调用系统名称
	InvokeAppID               string `json:"invoke_app_id"`                // 调用应用ID
	InvokeAppName             string `json:"invoke_app_name"`              // 调用应用名称
	InvokeIPPort              string `json:"invoke_ip_port"`               // 调用IP及端口
	InvokeNum                 int    `json:"invoke_num"`                   // 调用次数
	InvokeAverageCallDuration int    `json:"invoke_average_call_duration"` // 平均调用时长
}

// GatewayCollectionLogRes 第三方网关采集日志响应结构体
type GatewayCollectionLogRes struct {
	PageResult[GatewayCollectionLog]
}

type ServiceGetDocumentationResp struct {
	ServiceID       string           `json:"service_id" form:"service_id" binding:"omitempty,VerifyNameEn" example:"019407b3-d158-7177-a0c8-0da2f2683c50"`
	ServiceName     string           `json:"service_name" binding:"required,VerifyDescription" example:"接口名称"`
	HTTPMethod      string           `json:"http_method" binding:"omitempty,oneof=post get put delete"`
	AccessUrl       string           `json:"access_url" binding:"omitempty,omitempty,URL,max=255" example:"https://10.4.134.54/"`
	ApiUrl          string           `json:"api_url" binding:"omitempty,omitempty,URL,max=255" example:"/api/path"`
	Timeout         int64            `json:"timeout" binding:"omitempty,number,min=1,max=86400"`
	ServiceParam    ServiceParamRead `json:"service_param"`
	ServiceResponse *ServiceResponse `json:"service_response,omitempty"`
	ServiceTest     ServiceTest      `json:"service_test"`
	ExampleCode     ExampleCode      `json:"example_code"`
}

type ExampleCode struct {
	ShellExampleCode  string `json:"shell_example_code"`
	GoExampleCode     string `json:"go_example_code"`
	PythonExampleCode string `json:"python_example_code"`
	JavaExampleCode   string `json:"java_example_code"`
}
