package user

import (
	"context"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/user_management"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util/sets"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/access_control"
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	configuration_center_v2 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v2"
)

type UseCase interface {
	GetByUserId(ctx context.Context, userId string) (*model.User, error)
	GetByUserIds(ctx context.Context, uids []string) ([]*model.User, error)
	GetByUserNameMap(ctx context.Context, uids []string) (map[string]string, error)
	GetByUserIdNotNil(ctx context.Context, userId string) (*model.User, error)
	GetUserNameNoErr(ctx context.Context, userId string) string
	UpdateUserNameNSQ(ctx context.Context, userId string, name string)
	UpdateUserMobileMail(ctx context.Context, userId string, mobile string, mail string)
	UpdateUserName(ctx context.Context, userId string, name string) error
	CreateUserNSQ(ctx context.Context, userId, name, userType string)
	CreateUser(ctx context.Context, userId, name, userType string) error
	GetUserRoles(ctx context.Context, uid string) ([]*model.SystemRole, error)
	AccessControl(ctx context.Context) (*access_control.ScopeTransfer, []string, error)
	AddAccessControl(ctx context.Context) error
	HasAccessPermission(ctx context.Context, uid string, accessType access_control.AccessType, resource access_control.Resource) (bool, error)
	HasManageAccessPermission(ctx context.Context) (bool, error)
	GetUserDepart(ctx context.Context) ([]*Depart, error)
	GetUserDirectDepart(ctx context.Context) ([]*Depart, error)
	GetUserIdDirectDepart(ctx context.Context, uid string) ([]*Depart, error)
	GetUserByDepartAndRole(ctx context.Context, req *GetUserByDepartAndRoleReq) ([]*User, error)
	GetUserByDirectDepartAndRole(ctx context.Context, req *GetUserByDepartAndRoleReq) ([]*User, error)
	GetDepartUsers(ctx context.Context, req *GetDepartUsersReq) ([]*GetDepartUsersRespItem, error)
	GetDepartAndUsersPage(ctx context.Context, req *DepartAndUserReq) ([]*DepartAndUserResp, error)
	DeleteUserNSQ(ctx context.Context, userId string)
	DeleteUser(ctx context.Context, userId string) error
	// GetUsers 返回指定 ID 的用户。
	GetUser(ctx context.Context, userID string, opts GetUserOptions) (*User, error)
	GetUserByIds(ctx context.Context, ids string) ([]*model.User, error)
	QueryUserByIds(ctx context.Context, ids []string) ([]*model.User, error)
	CheckUserExist(ctx context.Context, userId string) error
	GetUserDeparts(ctx context.Context, userID string, opts GetUserOptions) ([]*Department, error)
	GetUserDetail(ctx context.Context, userId string) (*UserRespItem, error)
	GetUserList(ctx context.Context, req *GetUserListReq) (*ListResp, error)
	// UpdateScopeAndPermissions 更新指定用户的权限
	UpdateScopeAndPermissions(ctx context.Context, id string, sap *configuration_center_v1.ScopeAndPermissions) error
	// GetScopeAndPermissions 获取指定用户的权限
	GetScopeAndPermissions(ctx context.Context, id string) (*configuration_center_v1.ScopeAndPermissions, error)
	// UserRoleOrRoleGroupBindingBatchProcessing 更新用户角色或角色组绑定，批处理
	UserRoleOrRoleGroupBindingBatchProcessing(ctx context.Context, p *configuration_center_v1.UserRoleOrRoleGroupBindingBatchProcessing) error
	// FrontGet 获取指定用户及其相关数据
	FrontGet(ctx context.Context, id string) (*configuration_center_v2.User, error)
	// FrontList 获取用户列表及其相关数据
	FrontList(ctx context.Context, opts *configuration_center_v1.UserListOptions) (*configuration_center_v2.UserList, error)
	// FrontListWithSubDepartments 获取用户列表及其相关数据，支持子部门查询
	FrontListWithSubDepartments(ctx context.Context, opts *configuration_center_v1.UserListOptions, includeSubDepartments bool) (*configuration_center_v2.UserList, error)
	// 同步有管理审核策略权限的用戶到proton登录管理台和AS审核策略
	SyncUserAuditToProton(ctx context.Context, userIds []string)
	// ListUserNames 获取用户名称
	ListUserNames(ctx context.Context) ([]model.UserWithName, error)
	GetUserIdByMainDeptIds(ctx context.Context, userId string) ([]string, error)
	GetUserDefaultMainDeptId(ctx context.Context, userId string) (string, error)
	GetFrontendUserMainDept(ctx context.Context, userId string) (*model.Object, error)
}

type UriReqParamUId struct {
	UId *string `json:"uid,omitempty" form:"uid" binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 用户UID，uuid
}

type SystemRole struct {
	ID        string    `gorm:"column:id;primaryKey" json:"id"`                                // 主键，uuid
	Name      string    `gorm:"column:name;not null" json:"name"`                              // 角色名称
	Color     string    `gorm:"column:color" json:"color"`                                     // 角色背景色
	Icon      string    `gorm:"column:icon" json:"icon"`                                       // 角色图标
	Status    int32     `gorm:"column:status;default:1" json:"status"`                         // 角色状态（可用1、废弃2)
	System    int32     `gorm:"column:system;not null" json:"system"`                          // 是否是系统默认的角色1表示是默认，0表示不是
	CreatedAt time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP" json:"created_at"` // 创建时间
	UpdatedAt time.Time `gorm:"column:updated_at;default:CURRENT_TIMESTAMP" json:"updated_at"` // 更新时间
}
type SystemRoles []*SystemRole

// Len 实现sort.Interface接口取元素数量方法
func (s SystemRoles) Len() int {
	return len(s)
}

// Less 实现sort.Interface接口比较元素方法
func (s SystemRoles) Less(i, j int) bool {
	//return s[i].Name[0] < s[j].Name[0]
	a, _ := util.UTF82GBK(s[i].Name)
	b, _ := util.UTF82GBK(s[j].Name)
	bLen := len(b)
	for idx, chr := range a {
		if idx > bLen-1 {
			return false
		}
		if chr != b[idx] {
			return chr < b[idx]
		}
	}
	return true
}

// Swap 实现sort.Interface接口交换元素方法
func (s SystemRoles) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}

type HasAccessPermissionReq struct {
	AccessType int32  `form:"access_type" binding:"required,gt=0" example:"3"` //访问类型
	Resource   int32  `form:"resource" binding:"required,gt=0" example:"3"`    //访问资源类型
	UserId     string `form:"user_id" binding:"omitempty,uuid"`                //用户id
}

type AccessControl3 struct {
	Normal Normal `json:"normal"`
	Task   Task   `json:"task"`
}
type Normal struct {
	NormalBusinessDomain    int32 `json:"business_domain"`         //业务域
	NormalBusinessStructure int32 `json:"enterprise_architecture"` //业务架构
	NormalBusinessModel     int32 `json:"business_model"`          //主干业务
	NormalBusinessForm      int32 `json:"business_form"`           //业务表
	NormalBusinessFlowchart int32 `json:"business_flowchart"`      //业务流程图
	NormalBusinessIndicator int32 `json:"business_indicator"`      //指标
	//NormalBusinessReport           int32 `json:"business_report"`            //业务诊断
	NormalProject                  int32 `json:"project"`                    //项目列表
	NormalPipelineKanban           int32 `json:"pipeline_kanban"`            //流水线看板
	NormalTaskKanban               int32 `json:"task_kanban"`                //任务看板
	NormalTask                     int32 `json:"task"`                       //任务列表
	NormalPipeline                 int32 `json:"pipeline"`                   //流水线
	NormalRole                     int32 `json:"role"`                       //角色
	NormalBusinessStandard         int32 `json:"business_standard"`          //业务标准
	NormalBusinessKnowledgeNetwork int32 `json:"business_knowledge_network"` //业务知识网络
	NormalDataAcquisition          int32 `json:"data_acquisition"`           //数据采集
	NormalDataConnect              int32 `json:"data_connection"`            //数据连接
	NormalMetadata                 int32 `json:"metadata"`                   //元数据管理
	NormalDataSecurity             int32 `json:"data_security"`              //数据安全
	NormalDataQuality              int32 `json:"data_quality"`               //数据质量
	NormalDataProcessing           int32 `json:"data_processing"`            //数据加工
	NormalDataUnderstand           int32 `json:"data_understand"`            //数据理解
	NormalNewStandard              int32 `json:"new_standard"`               //新建标准
}
type Task struct {
	TaskBusinessModel     int32 `json:"business_model"`     //主干业务
	TaskBusinessForm      int32 `json:"business_form"`      //业务表
	TaskBusinessFlowchart int32 `json:"business_flowchart"` //业务流程图
	TaskBusinessIndicator int32 `json:"business_indicator"` //指标
	TaskNewStandard       int32 `json:"new_standard"`       //新建标准
}

//以下结构废弃

type AccessControl2 struct {
	BusinessDomain              int32 `json:"business_domain"`               //业务域
	BusinessStructure           int32 `json:"enterprise_architecture"`       //业务架构
	BusinessModel               Sub   `json:"business_model"`                //主干业务
	BusinessForm                Sub   `json:"business_form"`                 //业务表
	BusinessFlowchart           Sub   `json:"business_flowchart"`            //业务流程图
	BusinessIndicator           Sub   `json:"business_indicator"`            //指标
	BusinessReport              int32 `json:"business_report"`               //业务诊断
	Project                     int32 `json:"project"`                       //项目列表
	PipelineKanban              int32 `json:"pipeline_kanban"`               //流水线看板
	TaskKanban                  int32 `json:"task_Kanban"`                   //任务看板
	Task                        int32 `json:"task"`                          //任务列表
	BusinessModelingTask        int32 `json:"business_modeling_task"`        //业务建模任务
	BusinessStandardizationTask int32 `json:"business_standardization_task"` //业务标准化任务
	BusinessIndicatorTask       int32 `json:"business_indicator_task"`       //业务指标梳理任务
	Pipeline                    int32 `json:"pipeline"`                      //流水线
	Role                        int32 `json:"role"`                          //角色
	BusinessStandard            int32 `json:"business_standard"`             //业务标准
	BusinessKnowledgeNetwork    int32 `json:"business_knowledge_network"`    //业务知识网络
	DataAcquisition             int32 `json:"data_acquisition"`              //数据采集
	DataConnect                 int32 `json:"data_connection"`               //数据连接
	Metadata                    int32 `json:"metadata"`                      //元数据管理
	DataSecurity                int32 `json:"data_security"`                 //数据安全
	DataQuality                 int32 `json:"data_quality"`                  //数据质量
	DataProcessing              int32 `json:"data_processing"`               //数据加工
	DataUnderstand              int32 `json:"data_understand"`               //数据理解
}
type Sub struct {
	Normal int32 `json:"normal"`
	Task   int32 `json:"task"`
}
type AccessControl struct {
	BusinessGrooming    BusinessGrooming    `json:"business_grooming"`
	TaskCenter          TaskCenter          `json:"task_center"`
	ConfigurationCenter ConfigurationCenter `json:"configuration_center"`
	HomePage            HomePage            `json:"home_page"`
}
type BusinessGrooming struct {
	BusinessDomain    int `json:"business_domain"`         //业务域
	BusinessStructure int `json:"enterprise_architecture"` //业务架构
	BusinessModel     int `json:"business_model"`          //主干业务
	BusinessForm      int `json:"business_form"`           //业务表
	BusinessFlowchart int `json:"business_flowchart"`      //业务流程图
	BusinessIndicator int `json:"business_indicator"`      //指标
	BusinessReport    int `json:"business_report"`         //业务诊断
}

type TaskCenter struct {
	Project        int `json:"project"`         //项目列表
	PipelineKanban int `json:"pipeline_kanban"` //流水线看板
	TaskKanban     int `json:"task_Kanban"`     //任务看板
	Task           int `json:"task"`            //任务列表
	/*	BusinessModel     int `json:"business_model"`     //主干业务
		BusinessForm      int `json:"business_form"`      //业务表
		BusinessFlowchart int `json:"business_flowchart"` //业务流程图
		BusinessIndicator int `json:"business_indicator"` //指标*/
	BusinessModelingTask        int `json:"business_modeling_task"`        //业务建模任务
	BusinessStandardizationTask int `json:"business_standardization_task"` //业务标准化任务
	BusinessIndicatorTask       int `json:"business_indicator_task"`       //业务指标梳理任务
}

type ExecTask struct {
	BusinessModelingTask        ModelingTask        `json:"business_modeling_task"`        //业务建模任务
	BusinessStandardizationTask StandardizationTask `json:"business_standardization_task"` //业务标准化任务
	BusinessIndicatorTask       IndicatorTask       `json:"business_indicator_task"`       //业务指标梳理任务
}
type ModelingTask struct {
	BusinessModel     int `json:"business_model"`     //主干业务
	BusinessForm      int `json:"business_form"`      //业务表
	BusinessFlowchart int `json:"business_flowchart"` //业务流程图
}

type StandardizationTask struct {
	BusinessForm int `json:"business_form"` //业务表
}

type IndicatorTask struct {
	BusinessIndicator int `json:"business_indicator"` //指标
}
type ConfigurationCenter struct {
	Pipeline               int `json:"pipeline"`                //流水线
	Role                   int `json:"role"`                    //角色
	EnterpriseArchitecture int `json:"enterprise_architecture"` //业务架构
}

type HomePage struct {
	BusinessModel            int `json:"business_model"`             //业务建模
	BusinessStandard         int `json:"business_standard"`          //业务标准
	BusinessKnowledgeNetwork int `json:"business_knowledge_network"` //业务知识网络
	DataAcquisition          int `json:"data_acquisition"`           //数据采集
	DataConnect              int `json:"data_connection"`            //数据连接
	Metadata                 int `json:"metadata"`                   //元数据管理
	DataSecurity             int `json:"data_security"`              //数据安全
	DataQuality              int `json:"data_quality"`               //数据质量
	DataProcessing           int `json:"data_processing"`            //数据加工
	DataUnderstand           int `json:"data_understand"`            //数据理解
}
type Depart struct {
	ID     string `json:"id"`      // 部门标识
	Name   string `json:"name"`    // 部门名称
	Path   string `json:"path"`    // 部门路径
	PathID string `json:"path_id"` // 部门路径id
}
type GetUserByDepartAndRoleReq struct {
	RoleId   string `form:"role_id" json:"role_id"  binding:"required,uuid"`    //角色id
	DepartId string `form:"depart_id" json:"depart_id" binding:"required,uuid"` //部门id
	UserId   string `form:"user_id" json:"user_id"  binding:"omitempty,uuid"`   //用户id
}

// User 定义用户对象。仅包含用到的字段，需要时再补充。
type User struct {
	// 用户标识
	ID string `json:"id,omitempty"`
	// 用户名称
	Name string `json:"name,omitempty"`
	// 用户所属的部门
	ParentDeps []DepartmentPath `json:"parent_deps,omitempty"`
}

type DepartmentPath []Department
type Department struct {
	// 部门 ID
	ID string `json:"id,omitempty"`
	// 部门名称
	Name        string `json:"name,omitempty"`
	ThirdDeptId string `json:"third_dept_id"` //第三方部门ID
}

type GetDepartUsersReq struct {
	DepartId       string `form:"depart_id" json:"depart_id" binding:"required,uuid"`                   //部门id
	IsDepartInNeed string `form:"is_depart_in_need,default=false" binding:"omitempty,oneof=false true"` //是否返回用户部门信息
}

type GetUserListReq struct {
	DepartId                 string   `form:"depart_id" json:"depart_id" binding:"omitempty,uuid"`                                            //部门id
	IsDepartInNeed           string   `form:"is_depart_in_need,default=false" binding:"omitempty,oneof=false true" default:"false"`           //是否返回用户部门信息
	IsIncludeUnassignedRoles string   `form:"is_include_unassigned_roles,default=false" binding:"omitempty,oneof=false true" default:"false"` //是否返回未分配角色的用户
	Offset                   int      `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                           // 页码
	Limit                    int      `json:"limit" form:"limit,default=0" binding:"omitempty,min=0,max=200" default:"0"`                     // 每页大小，默认为0不分页
	Keyword                  string   `json:"keyword" form:"keyword"  binding:"omitempty,TrimSpace"`                                          // 关键字查询
	Direction                string   `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`      // 排序方向，可选值：asc desc，默认desc
	Sort                     string   `json:"sort" form:"sort,default=name" binding:"omitempty,oneof=name updated_at" default:"name"`         // 排序类型，可选值：name updated_at，默认name
	UserID                   []string `json:"user_id" form:"user_id" binding:"omitempty"`
	Register                 int      `json:"register" form:"register,default=1" binding:"omitempty,oneof=0 1" default:"1"`
}

type QueryUserIdsReq struct {
	IDs []string `json:"ids" form:"ids" binding:"required,dive"`
}

type DepartAndUserReq struct {
	Offset  int    `json:"offset" form:"offset,default=1" binding:"min=1" default:"1"`         // 页码
	Limit   int    `json:"limit" form:"limit,default=10" binding:"min=0,max=200" default:"10"` // 每页大小，为0时不分页
	Keyword string `json:"keyword" form:"keyword"  binding:"TrimSpace"`                        // 关键字查询
}

type DepartAndUserResp struct {
	DepartAndUserRes
	ParentDeps [][]DepartV1 `json:"parent_deps"`
	Roles      []*Role      `json:"roles"`
}

type DepartAndUserRes struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Type string `json:"type"`
	Path string `json:"path"`
}
type Role struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type DepartV1 struct {
	ID          string `json:"department_id"`   // 部门标识
	Name        string `json:"department_name"` // 部门名称
	ThirdDeptId string `json:"third_dept_id"`   // 第三方部门ID
}

type GetDepartUsersRespItem struct {
	model.User
	ParentDeps [][]DepartV1 `json:"parent_deps"`
	Roles      []*Role      `json:"roles"`
}

type UserInfo struct {
	ID          string `json:"id"`                      // 主键，uuid
	Name        string `json:"name"`                    // 显示名称
	Status      int32  `json:"status"`                  // 用户状态,1正常,2删除
	UserType    int32  `json:"user_type"`               // 用户类型,1普通账号,2应用账号
	PhoneNumber string `json:"phone_number"`            // 手机号码
	MailAddress string `json:"mail_address"`            // 邮箱地址
	LoginName   string `json:"login_name"`              // 登录名称
	UpdatedAt   int64  `json:"updated_at"`              // 更新时间
	ThirdUserId string `json:"third_user_id,omitempty"` //第三方用户ID
}

type UserRespItem struct {
	UserInfo
	ParentDeps [][]DepartV1 `json:"parent_deps"`
	Roles      []*Role      `json:"roles"`
}

type ListResp struct {
	Entries    []*UserRespItem `json:"entries" binding:"required"`                       // 用户列表
	TotalCount int64           `json:"total_count" binding:"required,gte=0" example:"1"` // 当前筛选条件下的用户数量
}

type GetUserByIdsReqParam struct {
	Ids string `json:"ids" form:"ids"  uri:"ids" binding:"required"` // 用户ids
}

type GetUserPathParameters struct {
	ID string `uri:"id" binding:"required,uuid"`
}

type GetUserQueryParameters struct {
	GetUserOptions
}

// GetUserOptions 定义获取用户的选项，比如返回哪些字段
type GetUserOptions struct {
	Fields []UserField `form:"fields"`
}

// UserField 定义用户对象的字段
type UserField user_management.UserInfoField

const (
	// 用户显示名
	UserFieldName = UserField(user_management.UserInfoFieldName)
	// 父部门信息
	UserFieldParentDeps = UserField(user_management.UserInfoFieldParentDeps)
)

var supportedUserFields = sets.New(
	UserFieldName,
	UserFieldParentDeps,
)

// CompleteGetUserOptions 补全 GetUserOptions 的默认值
func CompleteGetUserOptions(opts *GetUserOptions) {
	// 如果未指定查询的字段，则查询所有支持的字段
	if opts.Fields == nil {
		for f := range supportedUserFields {
			opts.Fields = append(opts.Fields, f)
		}
	}
}

func ValidateGetUserOptions(opts *GetUserOptions) (errs form_validator.ValidErrors) {
	for i, f := range opts.Fields {
		if !supportedUserFields.Has(f) {
			var quoteValues []string
			for _, v := range supportedUserFields.UnsortedList() {
				quoteValues = append(quoteValues, string(v))
			}
			sort.Strings(quoteValues)
			for i, v := range quoteValues {
				quoteValues[i] = strconv.Quote(v)
			}
			errs = append(errs, &form_validator.ValidError{
				Key:     fmt.Sprintf("fields[%d]", i),
				Message: fmt.Sprintf("must be one of supported values: %s", strings.Join(quoteValues, ", ")),
			})
		}
	}
	return
}
