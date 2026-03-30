package apps

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
)

type AppsUseCase interface {
	AppsCreate(ctx context.Context, req *CreateReqBody, userInfo *model.User) (*CreateOrUpdateResBody, error)
	AppsUpdate(ctx context.Context, req *UpdateReq, userInfo *model.User) (*CreateOrUpdateResBody, error)
	AppsDelete(ctx context.Context, req *DeleteReq) error
	AppById(ctx context.Context, req *AppsID, version string) (*Apps, error)
	AppsList(ctx context.Context, req *ListReqQuery, userInfo *model.User) (*ListRes, error)
	AppsAllListBrief(ctx context.Context) ([]*AppsAllListBrief, error)
	NameRepeat(ctx context.Context, req *NameRepeatReq) (bool, error)
	// AccountNameRepeat(ctx context.Context, req *NameRepeatReq) (bool, error)
	// HasAccessPermission(ctx context.Context, req *HasAccessPermissionReq) (bool, error)
	AppByAccountId(ctx context.Context, req *AppsID) (*Apps, error)
	AppByApplicationDeveloperId(ctx context.Context, req *AppsID) ([]*AppsAllListBrief, error)
	GetFormEnum() *EnumObject
	GetAuditList(ctx context.Context, req *AuditListGetReq) (*AuditListResp, error)
	Cancel(ctx context.Context, req *DeleteReq) error
	// 省直达上报接口
	ReportAppsList(ctx context.Context, req *ProvinceAppListReq) (*GetAppDetailInfoListResp, error)
	Report(ctx context.Context, req *AppsIDS, userInfo *model.User) error
	GetReportAuditList(ctx context.Context, req *AuditListGetReq) (*AuditListResp, error)
	ReportCancel(ctx context.Context, req *DeleteReq) error
	// workflow消费
	AppApplyAuditResultMsgProc(ctx context.Context, msg *wf_common.AuditResultMsg) error
	AppApplyProcessMsgProc(ctx context.Context, msg *wf_common.AuditProcessMsg) error
	AppReportAuditResultMsgProc(ctx context.Context, msg *wf_common.AuditResultMsg) error
	AppReportProcessMsgProc(ctx context.Context, msg *wf_common.AuditProcessMsg) error
	// 应用注册
	AppRegister(ctx context.Context, req *AppRegister, userInfo *model.User) (*CreateOrUpdateResBody, error)
	AppsRegisterList(ctx context.Context, req *ListRegisteReqQuery, userInfo *model.User) (*ListRegisteRes, error)
	PassIDRepeat(ctx context.Context, req *PassIDRepeatReq) (bool, error)
}

const (
	NotRegisteGateway = 0 // 未注册
	RegisteGateway    = 1 //已注册
)
const (
	MarkCommon = "common" // 通用、正常创建
	MarkCssjj  = "cssjj"  // xx数据集注册使用
)

type EnumObject struct {
	AreaName  []KV `json:"area_name"`
	RangeName []KV `json:"range_name"`
}
type KV struct {
	ID    string `json:"id"`
	Value string `json:"value"`
	// ValueEn string `json:"value_en"`
}

//region common

type UserInfoResp struct {
	UID      string `json:"id"`   // 用户id，uuid
	UserName string `json:"name"` // 用户名
}

type InfoSystem struct {
	ID   string `json:"id"`   // 信息系统id，uuid
	Name string `json:"name"` // 信息系统名称
}

type Apps struct {
	ID                   string           `json:"id" example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"` // 应用ID
	PassID               string           `json:"pass_id" example:"passid"`                          // PassID
	Token                string           `json:"token" example:"token"`                             // Token
	Name                 string           `json:"name" example:"name"`                               // 应用名称
	Description          string           `json:"description" example:"description"`                 // 应用描述
	InfoSystem           *InfoSystem      `json:"info_systems"`                                      // 信息系统
	ApplicationDeveloper *UserInfoResp    `json:"application_developer"`                             // 应用开发者
	AppType              string           `json:"app_type"`                                          // 应用类型
	Responsiblers        []*Responsibler  `json:"responsiblers"  uri:"responsiblers"`                // 负责人
	IpAddrs              []*IpAddr        `json:"ip_addr"`
	AccountName          string           `json:"account_name" example:"account_name"`                       // 账号名称
	AccountID            string           `json:"account_id" example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"` // 账号Id
	HasResources         bool             `json:"has_resource"`                                              //是否有资源
	ProvinceAppInfo      *ProvinceAppResp `json:"province_app_info" binding:"omitempty"`
	CreatedAt            int64            `json:"created_at" example:"1684301771000"` // 创建时间
	CreatedName          string           `json:"creator_name" example:"创建人名称"`       //创建人
	UpdatedAt            int64            `json:"updated_at" example:"1684301771000"` // 更新时间
	UpdatedName          string           `json:"updater_name" example:"更新人名称"`       //更新人
}

type Responsibler struct {
	ID   string `json:"id" example:"1"`
	Name string `json:"name" example:"zhangsan"`
}

type AppsAllListBrief struct {
	ID          string `json:"id" example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"` // 应用ID
	Name        string `json:"name" example:"name"`                               // 应用名称
	Description string `json:"description" example:"description"`                 // 应用描述
	// InfoSystemName           string `json:"info_system_name" binding:"omitempty"`              //信息系统名称
	// ApplicationDeveloperName string `json:"application_developer_name" binding:"omitempty"`    //应用开发者名称
}

type AppsID struct {
	Id string `json:"id" uri:"id" binding:"required,uuid" example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"` // 应用ID
}

type AppsIDS struct {
	IDs []string `json:"ids" form:"ids" binding:"required,dive,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
}

type CreateOrUpdateResBody struct {
	ID string `json:"id" example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"` // 应用ID
}

type AppReq struct {
	AppsID
}

type AppReqQuery struct {
	Version string `json:"version" form:"version" binding:"omitempty,oneof=published editing to_report reported" default:"desc"`
}

type Org struct {
	ID    string `json:"id"`    // 信息系统id，uuid
	Value string `json:"value"` // 信息系统名称
}

type ProvinceApp struct {
	ProvinceUrl  string `json:"province_url"  binding:"omitempty,lte=300" example:"provinceUrl"`                                   // 对外提供url地址
	ProvinceIp   string `json:"province_ip"  binding:"required_with=ProvinceUrl,lte=30" example:"provinceIp"`                      // 对外提供ip地址
	ContactName  string `json:"contact_name"  binding:"required_with=ProvinceUrl,lte=100" example:"contactName"`                   // 联系人姓名
	ContactPhone string `json:"contact_phone" binding:"required_with=ProvinceUrl,lte=100" example:"contactPhone"`                  // 联系人联系方式
	AreaId       string `json:"area_id" binding:"required_with=ProvinceUrl"`                                                       // 应用领域ID
	RangeId      string `json:"range_id"  binding:"required_with=ProvinceUrl"`                                                     // 应用范围ID
	DepartmentId string `json:"department_id"  binding:"required_with=ProvinceUrl" example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"` // 应用系统所属部门
	OrgCode      string `json:"org_code" binding:"required_with=ProvinceUrl,lte=32" example:"orgCode"`                             // 应用系统所属组织机构ID
	DeployPlace  string `json:"deploy_place" binding:"omitempty,lte=100"`                                                          // 部署地点
}

type OrgInfo struct {
	OrgCode        string `json:"org_code" example:"orgCode"`                      // 应用系统所属组织机构编码
	OrgName        string `json:"org_name" binding:"omitempty"  example:"orgName"` // 应用系统所属组织机构名称
	DepartmentName string `json:"department_name"`                                 //部门名称
	DepartmentId   string `json:"department_id"`                                   //部门id
	DepartmentPath string `json:"department_path" binding:"omitempty"`             //部门路径
}

type ProvinceAppResp struct {
	AppId        string   `json:"app_id"`                               // 省平台注册ID
	AccessKey    string   `json:"access_key"`                           // 省平台应用key
	AccessSecret string   `json:"access_secret"`                        // 省平台应用secret
	ProvinceIp   string   `json:"province_ip" example:"provinceIp"`     // 对外提供ip地址
	ProvinceUrl  string   `json:"province_url" example:"provinceUrl"`   // 对外提供url地址
	ContactName  string   `json:"contact_name" example:"contactName"`   // 联系人姓名
	ContactPhone string   `json:"contact_phone" example:"contactPhone"` // 联系人联系方式
	AreaInfo     *KV      `json:"area_info"`                            // 应用领域
	RangeInfo    *KV      `json:"range_info"`                           // 应用范围
	OrgInfo      *OrgInfo `json:"org_info"`                             // 部门信息
	DeployPlace  string   `json:"deploy_place"`                         // 部署地点
}
type IpAddr struct {
	IP   string `json:"ip"`
	Port int    `json:"port"`
}

//endregion

// region  AppsCreate
type CreateReq struct {
	CreateReqBody `param_type:"body"`
}
type CreateReqBody struct {
	Name                   string    `json:"name" binding:"required,lte=32" example:"name"`                                               // 应用名称
	PassID                 string    `json:"pass_id" binding:"omitempty" example:"passid"`                                                // PassID(仅xx使用)
	Description            string    `json:"description"  binding:"omitempty,lte=300,VerifyDescriptionReduceSpace" example:"description"` // 应用描述
	InfoSystem             string    `json:"info_system_id"  binding:"omitempty,uuid"`                                                    // 信息系统id
	ApplicationDeveloperId string    `json:"application_developer_id"  binding:"omitempty,uuid" example:"application_developer_id"`       // 应用开发者id                                                                // 应用类型
	AppType                string    `json:"app_type" binding:"omitempty,oneof=micro_type non_micro_type"`                                // 应用类型(仅xx使用)
	IpAddrs                []*IpAddr `json:"ip_addr" binding:"omitempty"`                                                                 // ip地址(仅xx使用)
	Mark                   string    `json:"mark" binding:"omitempty,oneof=cssjj" example:"mark"`                                         // 标记(标记为xx客户)
	AccountName            string    `json:"account_name"  binding:"omitempty,lte=128,VerifyObjectName" example:"account_name"`           // 账号名称
	Password               string    `json:"password" binding:"required_with=AccountName"`                                                // 账号密码
	ProvinceApp
}

//endregion

//region AppsUpdate

type UpdateReq struct {
	UpdateReqPath `param_type:"path"`
	UpdateReqBody `param_type:"body"`
}
type UpdateReqPath struct {
	AppsID
}
type UpdateReqBody struct {
	Name                   string    `json:"name" binding:"required,lte=32"`                                                              // 应用名称
	Description            string    `json:"description"  binding:"omitempty,lte=300,VerifyDescriptionReduceSpace" example:"description"` // 应用描述
	PassID                 string    `json:"pass_id" binding:"omitempty" example:"passid"`                                                // PassID
	Token                  string    `json:"token" binding:"omitempty" example:"token"`                                                   // Token
	InfoSystem             string    `json:"info_system_id"  binding:"omitempty,uuid"`                                                    // 信息系统id
	ApplicationDeveloperId string    `json:"application_developer_id"  binding:"required,uuid" example:"application_developer_id"`        // 应用开发者id
	AccountName            string    `json:"account_name"  binding:"omitempty,lte=128,VerifyObjectName"`                                  // 账号名称
	Password               string    `json:"password" binding:"omitempty"`                                                                // 账号密码
	AppType                string    `json:"app_type" binding:"omitempty,oneof=micro_type non_micro_type"`                                // 应用类型
	IpAddrs                []*IpAddr `json:"ip_addr" binding:"omitempty"`
	ProvinceApp
}

//endregion

//region AppsDelete

type DeleteReq struct {
	AppsID
}

//endregion

//region AppsList

type PageInfo struct {
	Offset    int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                                                      // 页码，默认1
	Limit     int    `json:"limit" form:"limit,default=12" binding:"omitempty,min=1,max=2000" default:"12"`                                             // 每页大小，默认12
	Direction string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`                                 // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      string `json:"sort" form:"sort,default=created_at" binding:"omitempty,oneof=created_at updated_at name register_at" default:"created_at"` // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序。默认按创建时间排序
}

type ListReq struct {
	ListReqQuery `param_type:"query"`
}

type ListReqQuery struct {
	PageInfo
	Keyword       string `json:"keyword" form:"keyword" binding:"TrimSpace,omitempty,min=1,max=128"` // 关键字查询，字符无限制
	OnlyDeveloper bool   `json:"only_developer" form:"only_developer" binding:"omitempty"`           // 应用开发者查询自己管理的
	NeedAccount   bool   `json:"need_account" form:"need_account" binding:"omitempty"`               // 查询必须有应用账号的
}

type UserManagementAppsListReq struct {
	UserManagementAppsListReqQuery `param_type:"query"`
}

type UserManagementAppsListReqQuery struct {
	Offset    int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                                     // 页码，默认1
	Limit     int    `json:"limit" form:"limit,default=20" binding:"omitempty,min=1,max=1000" default:"20"`                            // 每页大小，默认20
	Direction string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`                // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      string `json:"sort" form:"sort,default=date_created" binding:"omitempty,oneof=date_created name" default:"date_created"` // 排序类型，枚举：date_created：按创建时间排序；date_created：按更新时间排序。默认按创建时间排序
	Keyword   string `json:"keyword" form:"keyword" binding:"TrimSpace,omitempty,min=1,max=128"`                                       // 关键字查询，字符无限制
}

// NeedAccount bool   `json:"need_account" form:"need_account" binding:"omitempty"`               // 查询必须有应用账号的

type ListRes struct {
	response.PageResults[AppsList]
}
type AppsList struct {
	ID                       string `json:"id" example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"`         // 应用ID
	Name                     string `json:"name" example:"name"`                                       // 应用名称
	Description              string `json:"description" example:"description"`                         // 应用描述
	InfoSystemName           string `json:"info_system_name"`                                          //信息系统名称
	ApplicationDeveloperName string `json:"application_developer_name"`                                //应用开发者名称
	AccountName              string `json:"account_name" example:"account_name"`                       // 账号名称
	AccountID                string `json:"account_id" example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"` // 账号Id
	HasResources             bool   `json:"has_resource"`                                              //是否有资源
	AppId                    string `json:"app_id"`                                                    // 省平台注册ID
	AccessKey                string `json:"access_key"`                                                // 省平台应用key
	AccessSecret             string `json:"access_secret"`                                             // 省平台应用secret
	CreatedAt                int64  `json:"created_at" example:"1684301771000"`                        // 创建时间
	CreatedName              string `json:"creator_name" example:"创建人名称"`                              //创建人
	UpdatedAt                int64  `json:"updated_at" example:"1684301771000"`                        // 更新时间
	UpdatedName              string `json:"updater_name" example:"更新人名称"`                              //更新人
	Status                   string `json:"status"`                                                    //状态:"auditing, audit_rejected, audit_canceled, audit_agreed"
	RejectedReason           string `json:"rejected_reason"`                                           //拒绝原因
	CanDelete                bool   `json:"can_delete"`                                                // 能否删除,true可以删除, false不能删除
}

//endregion

type NameRepeatReq struct {
	ID   string `json:"id" form:"id" binding:"omitempty,uuid" example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"` // ID
	Name string `json:"name" form:"name" binding:"TrimSpace,required,min=1,max=32" example:"name"`            // 名称
}

type PassIDRepeatReq struct {
	ID     string `json:"id" form:"id" binding:"omitempty,uuid" example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"` // ID
	PassId string `json:"pass_id" form:"pass_id" binding:"required" example:"name"`                             // PassID
}

// type HasAccessPermissionReq struct {
// 	UserId   string `form:"user_id" binding:"required,uuid"` //用户id
// 	Resource string `form:"resource" binding:"required"`     //访问资源类型
// }

type User struct {
	ID       string `json:"id"`        //用户ID
	Name     string `json:"name"`      //用户名称
	UserType string `json:"user_type"` //用户类型
	NewName  string `json:"new_name"`  //更新后的名字
	Type     string `json:"type"`      //类型
}

type GetAuditProcessRes struct {
	ID          string `json:"id"`
	AuditType   string `json:"audit_type"` // 审核类型
	ProcDefKey  string `json:"proc_def_key"`
	ServiceType string `json:"service_type"`
}

//endregion

type Data struct {
	Id          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	SubmitTime  int64  `json:"submit_time"`
	Type        string `json:"type"`
}

// region  ReportAppsList
type PageInfoa struct {
	Offset    uint64 `json:"offset" form:"offset,default=1" binding:"min=1"`                                                       // 页码, 默认1
	Limit     uint64 `json:"limit" form:"limit,default=10" binding:"min=1,max=2000"`                                               // 每页大小, 默认1
	Direction string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc" default:"desc"`                      // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      string `json:"sort" form:"sort,default=updated_at" binding:"oneof=name updated_at reported_at" default:"updated_at"` // 排序类型，枚举：updated_at：按更新时间排序。默认按更新时间排序 updated_at 更新时间
}

type KeywordInfo struct {
	Keyword string `form:"keyword" binding:"TrimSpace,omitempty,min=1,max=128"` // 关键字查询，字符无限制
}
type PageInfoWithKeyword struct {
	PageInfoa
	KeywordInfo
}
type ProvinceAppListReq struct {
	PageInfoWithKeyword
	IsUpdate   string `form:"is_update" binding:"omitempty,oneof=all true false"`      // 是否更新：all所有，true更新上报，false创建上报
	ReportType string `form:"report_type" binding:"required,oneof=to_report reported"` // 上报类型：to_report待上报, reported已经上报
}

type GetAppDetailInfoListResp struct {
	response.PageResults[GetAppDetailInfoListItem]
}

type GetAppDetailInfoListItem struct {
	ID             string `json:"id"`                                       // 主键，uuid
	Name           string `json:"name"`                                     // 应用名称
	Description    string `json:"description"`                              // 应用描述
	AuditStatus    string `json:"status"`                                   // 审核状态:"normal, auditing, audit_rejected, report_failed "
	RejectedReason string `json:"rejected_reason"`                          //拒绝原因
	DepartmentName string `json:"department_name" binding:"omitempty,uuid"` // 所属部门
	DepartmentPath string `json:"department_path" binding:"omitempty,uuid"` // 所属部门路径
	UpdatedAt      int64  `json:"updated_at"`                               // 更新时间
	ReportedAt     int64  `json:"reported_at"`                              // 上报时间
	IsUpdate       bool   `json:"is_update"`                                // 是否有更新， 更新上报：true， 创建上报：false
}

//endregion

// region GetReportAuditList
type AuditListGetReq struct {
	Target    string `form:"target" binding:"required,oneof=tasks historys"`                                      // 审核列表类型 tasks 待审核 historys 已审核
	Offset    int    `json:"offset" form:"offset,default=1" binding:"min=1"`                                      // 页码, 默认1
	Limit     int    `json:"limit" form:"limit,default=10" binding:"min=1,max=2000"`                              // 每页大小, 默认1
	Direction string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc" default:"desc"`     // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      string `json:"sort" form:"sort,default=apply_time" binding:"oneof=apply_time" default:"apply_time"` // 排序类型，枚举：apply_at：按申请时间排序
}

type AuditListResp struct {
	response.PageResults[AuditListItem]
}

type AuditListItem struct {
	ID          string `json:"id"`                              // 主键，uuid
	Name        string `json:"name"`                            // 应用名称
	ReportType  string `json:"report_type"`                     // 上报类型 【report：上报 】
	Applyer     string `json:"applyer"`                         // 申请人
	ApplyTime   string `json:"apply_time"`                      // 申请时间
	AuditStatus string `json:"audit_status" example:"auditing"` // 审核状态
	AuditTime   string `json:"audit_time"`                      // 审核时间
	ProcInstID  string `json:"proc_inst_id"`                    // 审核实例ID
	TaskID      string `json:"task_id"`                         // 审核任务ID
}

//endregion

// region AppRegister

type AppRegister struct {
	Id              string   `json:"id" uri:"id" binding:"omitempty,uuid" example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"` // 应用ID
	ResponsibleUIDS []string `json:"responsible_uids"  uri:"responsible_uids" binding:"required,dive,uuid"`               // 负责人
}

// type Responsibler struct {
// 	ID   string `json:"id" example:"1"`
// 	gatewayID string `json:"name" example:"zhangsan"`
// }

//endregion

//region AppsRegisterList

type ListRegisteReq struct {
	ListRegisteReqQuery `param_type:"query"`
}
type ListRegisteReqQuery struct {
	PageInfo
	Keyword           string `json:"keyword" form:"keyword" binding:"TrimSpace,omitempty,min=1,max=128"`                                  // 关键字查询，字符无限制
	IsRegisterGateway string `json:"is_register_gateway" form:"is_register_gateway" binding:"omitempty,oneof=false true" example:"false"` // 是否注册
	DepartmentID      string `json:"department_id" form:"department_id" binding:"omitempty"`                                              // 信息系统id
	InfoSystem        string `json:"info_system_id" form:"info_system_id" binding:"omitempty"`                                            // 信息系统id
	AppType           string `json:"app_type" form:"app_type" binding:"omitempty,oneof=micro_type non_micro_type"`                        // 应用类型
	StartedAt         int64  `json:"started_at" form:"started_at" binding:"omitempty" example:"4102329600"`                               // 注册时间开始
	FinishedAt        int64  `json:"finished_at" form:"finished_at" binding:"omitempty" example:"4102329600"`                             // 注册时间结束
}

// NeedAccount bool   `json:"need_account" form:"need_account" binding:"omitempty"`               // 查询必须有应用账号的

type ListRegisteRes struct {
	response.PageResults[RegisteList]
}
type RegisteList struct {
	ID                string    `json:"id" example:"f5600699-b4c8-443e-a37e-39e3fd5d2159"` // 应用ID
	Name              string    `json:"name" example:"name"`                               // 应用名称
	Description       string    `json:"description" example:"description"`                 // 应用描述
	PassID            string    `json:"pass_id" example:"passid"`                          // PassID 应用标识
	InfoSystemName    string    `json:"info_system_name"`                                  // 信息系统名称
	AppType           string    `json:"app_type"`                                          // 应用类型
	DepartmentId      string    `json:"department_id"`                                     // 部门ID
	DepartmentName    string    `json:"department_name" binding:"VerifyObjectName"`        // 部门名称
	DepartmentPath    string    `json:"department_path" binding:"VerifyObjectName"`        // 部门路径
	IsRegisterGateway bool      `json:"is_register_gateway"`                               // 是否注册到网关
	RegisterAt        int64     `json:"register_at"`                                       // 信息系统注册时间
	IpAddrs           []*IpAddr `json:"ip_addr"`
}

//endregion
