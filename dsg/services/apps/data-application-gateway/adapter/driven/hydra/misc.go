package hydra

import "context"

// TokenIntrospectInfo 令牌内省结果
type TokenIntrospectInfo struct {
	Active     bool        // 令牌状态
	VisitorID  string      // 访问者ID
	Scope      string      // 权限范围
	ClientID   string      // 客户端ID
	VisitorTyp VisitorType // 访问者类型
	// 以下字段只在visitorType=1，即实名用户时才存在
	LoginIP    string      // 登陆IP
	Udid       string      // 设备码
	AccountTyp AccountType // 账户类型
	ClientTyp  ClientType  // 设备类型
}

// VisitorType 访问者类型
type VisitorType int32

// 访问者类型定义
const (
	RealName  VisitorType = 1 // 实名用户
	Anonymous VisitorType = 4 // 匿名用户
	Business  VisitorType = 5 // 应用账户  2.4
	App       VisitorType = 6 // 应用账户  2.6
)

// AccountType 登录账号类型
type AccountType int32

// 登录账号类型定义
const (
	Other  AccountType = 0
	IDCard AccountType = 1
)

// ClientType 设备类型
type ClientType int32

// 设备类型定义
const (
	Unknown ClientType = iota
	IOS
	Android
	WindowsPhone
	Windows
	MacOS
	Web
	MobileWeb
	Nas
	ConsoleWeb
	DeployWeb
	Linux
)

// Hydra 授权服务接口
type Hydra interface {
	// Introspect token内省
	Introspect(ctx context.Context, token string) (info TokenIntrospectInfo, err error)
}
