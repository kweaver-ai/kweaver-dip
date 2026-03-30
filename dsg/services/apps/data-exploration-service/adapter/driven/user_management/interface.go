package user_management

// DrivenUserMgnt 服务处理接口
type DrivenUserMgnt interface {
	GetUserNameByUserID(userID string) (name string, isNormalUser bool, err error)
	GetUserRolesByUserID(userID string) (roleTypes []RoleType, err error)
	GetDepAllUsers(depID string) (userIDs []string, err error)
	GetDepAllUserInfos(depID string) (userInfos []UserInfo, err error)
	GetGroupMembers(groupID string) (userIDs []string, depIDs []string, err error)
	GetNameByAccessorIDs(accessorIDs map[string]AccessorType) (accessorNames map[string]string, err error)
	// 创建、修改匿名账户
	//SetAnonymous(info *ASharedLinkInfo) (err error)
	// 删除匿名账户
	//DeleteAnonymous(anonymousID []string) (err error)
	// 获取应用账户信息
	GetAppInfo(appID string) (info AppInfo, err error)
	// GetDepIDsByUserID 获取用户所属部门ID
	GetDepIDsByUserID(userID string) (pathIDs []string, err error)
	// BatchGetUserInfoByID 批量获取用户的基础信息
	BatchGetUserInfoByID(userIDs []string) (userInfoMap map[string]UserInfo, err error)
	// GetAccessorIDsByUserID 获取指定用户的访问令牌
	GetAccessorIDsByUserID(userID string) (accessorIDs []string, err error)
	// GetAccessorIDsByDepartID 获取部门访问令牌
	GetAccessorIDsByDepartID(depID string) (accessorIDs []string, err error)
	// GetUserParentDepartments 根据用户ID获取父部门信息
	GetUserParentDepartments(userID string) (parentDeps [][]Department, err error)
	// GetUserInfoByID 根据用户ID获取用户及所属部门所在的用户组信息
	GetUserInfoByID(userID string) (userInfo UserInfo, err error)
}

// UserInfo 用户基本信息
type UserInfo struct {
	ID         string            // 用户id
	Account    string            // 用户名称
	VisionName string            // 显示名
	CsfLevel   int               // 密级
	Frozen     bool              // 冻结状态
	Roles      map[RoleType]bool // 角色
	Email      string            // 邮箱地址
	Telephone  string            // 电话号码
	ThirdAttr  string            // 第三方应用属性
	ThirdID    string            // 第三方应用id
	UserType   AccessorType      // 用户类型
	Groups     []Group           // 用户及其所属部门所在的用户组
}

// AccessorType 访问者类型
type AccessorType int

// 访问者类型
const (
	_                     AccessorType = iota
	AccessorUser                       // 用户
	AccessorDepartment                 // 部门
	AccessorContactor                  // 联系人
	AccessorAnonymous                  // 匿名用户
	AccessorGroup                      // 用户组
	AccessorApp                        // 应用账户
	AccessorGroupInternal              // 内部组
)

// AppInfo 文档信息
type AppInfo struct {
	ID   string //  应用账户ID
	Name string //  应用账户名称
}

// RoleType 用户角色类型
type RoleType int32

// 用户角色类型定义
const (
	SuperAdmin        RoleType = iota // 超级管理员
	SystemAdmin                       // 系统管理员
	AuditAdmin                        // 审计管理员
	SecurityAdmin                     // 安全管理员
	OrganizationAdmin                 // 组织管理员
	OrganizationAudit                 // 组织审计员
	NormalUser                        // 普通用户
)

// DocPermValue 权限值
type DocPermValue int32

// 权限值定义
const (
	DocDisplay  DocPermValue = 1 << iota // 显示
	DocPreview                           // 预览
	DocDownload                          // 下载
	DocCreate                            // 创建
	DocModify                            // 修改
	DocDelete                            // 删除

	DocPermMax DocPermValue = 0x0000003F // 权限配置最大值
)

// Department 组织结构部门
type Department struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Type string `json:"type"`
}

// Group 组基本信息(可包含用户和部门)
type Group struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Type string `json:"type"`
}
