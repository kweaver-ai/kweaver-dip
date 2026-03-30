package dto

type ServiceApply struct {
	ApplyId       string `json:"apply_id"`       // 申请编码
	ServiceID     string `json:"service_id"`     // 接口ID
	ServiceName   string `json:"service_name"`   // 接口名称
	ServiceStatus string `json:"service_status"` // 接口状态 draft 草稿 publish 已发布
	OrgCode       string `json:"org_code"`       // 部门id
	OrgName       string `json:"org_name"`       // 部门名称
	OwnerId       string `json:"owner_id"`       // 数据Owner用户ID
	OwnerName     string `json:"owner_name"`     // 数据Owner用户名称
	ApplyDays     uint32 `json:"apply_days"`     // 申请时长 0表示长期
	ApplyReason   string `json:"apply_reason"`   // 申请理由
	AuditStatus   string `json:"audit_status"`   // 审核状态 auditing 审核中 pass 通过 reject 驳回
	AuthTime      string `json:"auth_time"`      // 授权时间
	ExpiredTime   string `json:"expired_time"`   // 过期时间 空字符串表示长期
	CreateTime    string `json:"create_time"`    // 申请时间
	UpdateTime    string `json:"update_time"`    // 更新时间
}

type ServiceApplyListReq struct {
	PageInfo
	Keyword     string `json:"keyword" form:"keyword" binding:"omitempty"`                                    // 搜索关键词 接口ID/接口名称
	AuditStatus string `json:"audit_status" form:"audit_status" binding:"omitempty"`                          // 审核状态 auditing 审核中 pass 通过 reject 驳回, 多个以逗号分隔
	StartTime   string `json:"start_time" form:"start_time" binding:"omitempty,datetime=2006-01-02 15:04:05"` // 开始时间 示例: 2006-01-02 15:04:05
	EndTime     string `json:"end_time" form:"end_time" binding:"omitempty,datetime=2006-01-02 15:04:05"`     // 结束时间 示例: 2006-01-02 15:04:05
}

type ServiceApplyListRes struct {
	PageResult[ServiceApply]
}

type ServiceApplyGetReq struct {
	ApplyId string `json:"apply_id" uri:"apply_id" binding:"required,VerifyNameEn"` //申请id
}

type ServiceApplyGetRes struct {
	App          App                 `json:"app"`           // 授权信息
	ServiceApply ServiceApply        `json:"service_apply"` // 申请详情
	ServiceInfo  ServiceFrontendInfo `json:"service_info"`  // 接口详情
}

type ServiceApplyCreateReq struct {
	ServiceID   string  `json:"service_id" form:"service_id" binding:"required,VerifyNameEn"`        // 接口ID
	ApplyDays   *uint32 `json:"apply_days" binding:"required,oneof=0"`                               // 申请时长 0表示长期
	ApplyReason string  `json:"apply_reason" binding:"required,TrimSpace,max=800,VerifyDescription"` // 申请理由
}

type ServiceAuthInfoReq struct {
	ServiceID string `json:"service_id" uri:"service_id" binding:"required,VerifyNameEn"` // 接口ID
}

type ServiceAuthInfoRes struct {
	ServiceAddress string `json:"service_address"` // 接口地址
	AppId          string `json:"app_id"`          // AppId
	AppSecret      string `json:"app_secret"`      // AppSecret
	AuditStatus    string `json:"audit_status"`    // 审核状态 auditing 审核中 pass 通过 reject 驳回
	ExpiredTime    string `json:"expired_time"`    // 过期时间 空字符串表示长期
}

type AvailableAssets struct {
	ServiceID         string `json:"service_id"`          // 接口ID
	ServiceCode       string `json:"service_code"`        // 接口编码
	ServiceName       string `json:"service_name"`        // 接口名称
	OrgCode           string `json:"org_code"`            // 部门ID
	OrgName           string `json:"org_name"`            // 部门名称
	SubjectDomainID   string `json:"subject_domain_id"`   // 主题域 ID
	SubjectDomainName string `json:"subject_domain_name"` // 主题域名称
	OwnerId           string `json:"owner_id"`            // 数据owner用户ID
	OwnerName         string `json:"owner_name"`          // 数据owner用户名称
	Description       string `json:"description"`         // 接口描述
	OnlineTime        string `json:"online_time"`         // 发布时间
	//逻辑视图及其子视图（行列规则）的权限规则
	Policies []*SubjectObjectsResEntity `json:"policies,omitempty"`
}

type AvailableAssetsListReq struct {
	Offset    int    `json:"offset" form:"offset,default=1" binding:"number,min=1" default:"1"`                                             // 页码 默认 1
	Limit     int    `json:"limit" form:"limit,default=10" binding:"number,min=1,max=100" default:"10"`                                     // 每页大小 默认 10 最大100
	Sort      string `json:"sort" form:"sort,default=online_time" binding:"omitempty,oneof=online_time publish_time" default:"online_time"` // 排序类型 online_time 发布时间
	Direction string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`                     // 排序方向 asc 正序 desc 倒序, 默认 desc
	Keyword   string `json:"keyword" form:"keyword" binding:"omitempty"`                                                                    // 搜索关键词 接口编码/接口名称
	OrgCode   string `json:"org_code" form:"org_code" binding:"omitempty,uuid"`                                                             // 部门id

	// 主题域 ID
	//  - 过滤属于此主题域的资源
	//  - 空字符串不过滤资源
	//  - uncategory 过滤未分类的资源
	SubjectDomainID string `json:"subject_domain_id" form:"subject_domain_id" binding:"omitempty,uuid|eq=uncategory"`

	// 访问者，返回指定的访问者拥有 read 权限的接口列表，默认是当前用户
	//
	// 格式 `{type}:{id}``
	//  指定访问者是某个用户 subject=user:00000000-0000-0000-0000-000000000000
	//  指定访问者是某个应用 subject=app:00000000-0000-0000-0000-000000000000
	Subject string `json:"subject" form:"subject" binding:"omitempty,auth_subject"`
	// 权限规则状态过滤器，非空时根据滤接口服务的权限规则状态过滤。
	//
	//  Active：返回规则处于有效期的接口服务
	//  Expired：返回规则已过期的接口服务
	PolicyStatus PolicyStatusFilter `json:"policy_status,omitempty" form:"policy_status"`
}

// 权限规则状态过滤器
type PolicyStatusFilter string

const (
	// 权限规则处于有效期内
	PolicyActive PolicyStatusFilter = "Active"
	// 权限规则已过期
	PolicyExpired PolicyStatusFilter = "Expired"
)

type AvailableAssetsListRes struct {
	PageResult[AvailableAssets]
}

type GetOwnerAuditorsReq struct {
	ApplyId string `json:"apply_id" uri:"apply_id" binding:"required"` //申请id
}

type GetOwnerAuditorsRes []AuditUser

type AuditUser struct {
	UserId string `json:"user_id"` // 审核员用户id
}
