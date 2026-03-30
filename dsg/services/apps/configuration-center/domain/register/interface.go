package register

import (
	"context"
)

type UseCase interface {
	//用户注册
	Register(ctx context.Context, req *UserReq) (*IDReps, error)
	//获取用户注册信息
	GetRegisterInfo(ctx context.Context, req *ListUserReq) (*ListUserResp, error)
	//获取用户列表
	GetUserList(ctx context.Context, req *ListReq) (*ListUserAllResp, error)
	// 获取用户详情
	GetUserInfo(ctx context.Context, req *IDPath) (*RegisterReq, error)
	// 用户名称唯一性检验
	UserUnique(ctx context.Context, req *UserUniqueReq) (bool, error)
	//用户机构注册
	OrganizationRegister(ctx context.Context, req *LiyueRegisterReq) (*IDReps, error)
	// 用户机构修改
	OrganizationUpdate(ctx context.Context, req *LiyueRegisterReq) (*IDReps, error)
	// 用户机构查询列表
	OrganizationList(ctx context.Context, req *ListReq) (*ListOrganizationResp, error)
	// 机构唯一性检测
	OrganizationUnique(ctx context.Context, req *OrganizationUniqueReq) (bool, error)
	// 根据机构ID查询机构信息
	GetOrganizationInfo(ctx context.Context, id string) (*LiyueRegisterReq, error)
	// 删除机构注册信息
	DeleteOrganization(ctx context.Context, id string) error
}

type RegisterReq struct {
	ID           string `gorm:"column:id" json:"id"`
	UserId       string `gorm:"column:user_id" json:"user_id"`
	Name         string `gorm:"column:name" json:"user_name" binding:"required"`
	DepartmentID string `gorm:"column:department_id" json:"dept_id" binding:"required"`
	Department   string `gorm:"-" json:"dept_name"`
	LoginName    string `gorm:"column:login_name" json:"login_name" binding:"required"`
	PhoneNumber  string `gorm:"column:phone_number" json:"phone"`
	Mail         string `gorm:"column:mail" json:"mail"`
	CreatedAt    string `gorm:"column:created_at" json:"created_at"`
	IsRegister   string `gorm:"-" json:"is_register,omitempty"`
}

type UserReq struct {
	UserId         string `gorm:"column:user_id" json:"user_id"`
	ID             string `gorm:"column:id" json:"id"`
	ThirdServiceId string `gorm:"column:third_service_id" json:"third_service_id"`
}

type UserInfo struct {
	ID           string `json:"id"`           // 主键，uuid
	Name         string `json:"name"`         // 显示名称
	Status       int32  `json:"status"`       // 用户状态,1正常,2删除
	UserType     int32  `json:"user_type"`    // 用户类型,1普通账号,2应用账号
	PhoneNumber  string `json:"phone_number"` // 手机号码
	MailAddress  string `json:"mail_address"` // 邮箱地址
	LoginName    string `json:"login_name"`   // 登录名称
	UpdatedAt    int64  `json:"updated_at"`   // 更新时间
	IsRegister   string `gorm:"is_register" json:"is_register,omitempty"`
	RegisterTime string `json:"register_time"`
}

func (UserInfo) TableName() string {
	return "user"
}

// 指定表名称
func (RegisterReq) TableName() string {
	return "principal_registrations"
}

// 用户名称唯一性检测
type UserUniqueReq struct {
	Name string `form:"name" binding:"TrimSpace,omitempty"`
}

// CREATE TABLE IF NOT EXISTS `organization_registrations` (
//    `id` varchar(36) NOT NULL COMMENT '机构注册ID',
//    `dept_id` varchar(36) NOT NULL COMMENT '机构ID',
//    `organization_name` VARCHAR(255) NOT NULL COMMENT '机构名称',
//    `organization_code` VARCHAR(255) NOT NULL COMMENT '机构标识',
//    `register_id` varchar(38) NOT NULL COMMENT '负责人ID',
//    `business_duty`  varchar(200) NOT NULL COMMENT '机构业务责任',
//    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间'

type OrganizationRegisterReq struct {
	ID               string `gorm:"column:id" json:"id"`
	OrganizationID   string `gorm:"column:organization_id" json:"dept_id"`
	OrganizationName string `gorm:"column:organization_name" json:"dept_name"`
	OrganizationCode string `gorm:"column:organization_code" json:"dept_tag"`
	UserID           string `gorm:"column:manager" json:"managers"`
	BusinessDuty     string `gorm:"column:business_duty" json:"business_duty"`
	CreatedAt        string `gorm:"column:created_at" json:"created_at"`
	UserName         string `gorm:"-" json:"user_name"`
	UpdatedAt        string `gorm:"column:updated_at" json:"updated_at,omitempty"`
}

// CREATE TABLE `liyue_registrations` (
//  `id` varchar(36) NOT NULL COMMENT '机构注册ID',
//  `liyue_id` varchar(38) NOT NULL COMMENT '对应到里约网关注册的机构、系统、应用',
//  `user_id` varchar(36) NOT NULL COMMENT '负责人ID',
//  `type` tinyint(4) DEFAULT NULL COMMENT '1 机构注册 2 信息系统注册  3 应用注册',
//  PRIMARY KEY (`id`)
//) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='机构注册信息表'

// CREATE TABLE `liyue_registrations` (
//  `id` varchar(36) NOT NULL COMMENT '机构注册ID',
//  `liyue_id` varchar(38) NOT NULL COMMENT '对应到里约网关注册的机构、系统、应用',
//  `user_id` varchar(36) NOT NULL COMMENT '负责人ID',
//  `type` tinyint(4) DEFAULT NULL COMMENT '1 机构注册 2 信息系统注册  3 应用注册',
//  PRIMARY KEY (`id`)
//) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='机构注册信息表'

type LiyueRegisterReq struct {
	ID      string `gorm:"column:id" json:"id"`
	LiyueID string `gorm:"column:liyue_id" json:"liyue_id"`
	UserID  string `gorm:"column:user_id" json:"user_id"`
	Type    int32  `gorm:"column:type" json:"type"`
}

func (LiyueRegisterReq) TableName() string {
	return "liyue_registrations"
}

type LiyueUserReq struct {
	UserID string `gorm:"column:user_id" json:"user_id"`
}

type ObjectRegisterReq struct {
	userId      string `gorm:"column:id" json:"id"`
	Isegistered bool   `gorm:"column:is_register" json:"is_register"`
	RegisterAt  string `gorm:"column:register_at" json:"register_at"`
	DeptTag     string `gorm:"column:dept_tag" json:"dept_tag"`
}

type LiyueRegisterReqs struct {
	UserIDs      []*LiyueUserReq `json:"user_ids"`
	DeptId       string          `json:"dept_id"`
	DeptTag      string          `json:"dept_tag"`
	BusinessDuty string          `json:"business_duty"`
}

// 机构唯一性检测
type OrganizationUniqueReq struct {
	OrganizationCode string `form:"dept_tag" binding:"TrimSpace,omitempty"`
	OrganizationName string `form:"dept_name" binding:"TrimSpace,omitempty"`
}

// 创建表
func (OrganizationRegisterReq) TableName() string {
	return "organization_registrations"
}

type IDReps struct {
	ID string `json:"id"`
}
type IDPath struct {
	ID string `uri:"id" binding:"required" validate:"required" example:"1"`
}

type ListUserReq struct {
	Offset       int    `form:"offset,default=1" binding:"omitempty,min=1" default:"1" example:"1"`                                // 页码，默认1
	Limit        int    `form:"limit,default=10" binding:"omitempty,min=10,max=1000" default:"10" example:"10"`                    // 每页大小，默认10
	Direction    string `form:"direction,default=desc" binding:"TrimSpace,omitempty,oneof=asc desc" default:"desc" example:"desc"` // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort         string `form:"sort" binding:"TrimSpace,omitempty" default:"created_at" example:"created_at"`                      // 排序类型，枚举：name: 按厂商名称排序。默认按厂商名称排序
	Name         string `form:"name" binding:"TrimSpace,omitempty"`
	DepartmentID string `form:"dept_id" binding:"TrimSpace,omitempty"`
}

type ListReq struct {
	Offset     int    `form:"offset,default=1" binding:"omitempty,min=1" default:"1" example:"1"`                                // 页码，默认1
	Limit      int    `form:"limit,default=10" binding:"omitempty,min=10,max=1000" default:"10" example:"10"`                    // 每页大小，默认10
	Direction  string `form:"direction,default=desc" binding:"TrimSpace,omitempty,oneof=asc desc" default:"desc" example:"desc"` // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort       string `form:"sort" binding:"TrimSpace,omitempty" default:"created_at" example:"created_at"`                      // 排序类型，枚举：name: 按厂商名称排序。默认按厂商名称排序
	Department string `form:"dept_id" binding:"TrimSpace,omitempty"`
	Name       string `form:"name" binding:"TrimSpace,omitempty"`
}

type ListUserResp struct {
	Items []*RegisterReq `json:"items"`
	Total int64          `json:"total"`
}

type ListOrganizationResp struct {
	Items []*OrganizationRegisterReq `json:"items"`
	Total int64                      `json:"total"`
}

type User struct {
	ID           string `gorm:"column:user_id;primaryKey" json:"user_id"` // 主键，uuid
	Name         string `gorm:"column:user_name" json:"user_name"`
	PhoneNumber  string `gorm:"column:phone" json:"phone"`           // 手机号码
	MailAddress  string `gorm:"column:mail" json:"mail"`             // 邮箱地址
	LoginName    string `gorm:"column:login_name" json:"login_name"` // 登录名称
	IsRegister   string `gorm:"column:is_register" json:"is_register"`
	DepartmentId string `gorm:"column:department_id" json:"dept_id"`
	Department   string `gorm:"-" json:"dept_name"`
}

type UserReg struct {
	ID           string `gorm:"column:user_id;primaryKey" json:"user_id"` // 主键，uuid
	Name         string `gorm:"column:user_name" json:"user_name"`
	PhoneNumber  string `gorm:"column:phone" json:"phone"`           // 手机号码
	MailAddress  string `gorm:"column:mail" json:"mail"`             // 邮箱地址
	LoginName    string `gorm:"column:login_name" json:"login_name"` // 登录名称
	IsRegister   bool   `gorm:"column:is_register" json:"is_register"`
	DepartmentId string `gorm:"column:department_id" json:"dept_id"`
	Department   string `gorm:"-" json:"dept_name"`
}

func (User) TableName() string {
	return "user"
}

type ListUserAllResp struct {
	Items []*UserReg `json:"items"`
	Total int64      `json:"total"`
}
