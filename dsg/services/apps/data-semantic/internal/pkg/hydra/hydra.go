package hydra

import "context"

// VisitorType 访问者类型
type VisitorType int32

// 访问者类型定义
const (
	RealName  VisitorType = 1 // 实名用户
	Anonymous VisitorType = 4 // 匿名用户
	Business  VisitorType = 5 // 应用账户
	App       VisitorType = 6 // 应用账户
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

// visitorTypeMap 访问者类型映射
var visitorTypeMap = map[string]VisitorType{
	"realname":  RealName,
	"anonymous": Anonymous,
	"business":  App,
}

// accountTypeMap 账号类型映射
var accountTypeMap = map[string]AccountType{
	"other":   Other,
	"id_card": IDCard,
}

// clientTypeMap 设备类型映射
var clientTypeMap = map[string]ClientType{
	"unknown":        Unknown,
	"ios":            IOS,
	"android":        Android,
	"windows_phone":  WindowsPhone,
	"windows":        Windows,
	"mac_os":         MacOS,
	"web":            Web,
	"mobile_web":     MobileWeb,
	"nas":            Nas,
	"console_web":    ConsoleWeb,
	"deploy_web":     DeployWeb,
	"linux":          Linux,
}

// TokenIntrospectInfo 令牌内省结果
type TokenIntrospectInfo struct {
	Active     bool        // 令牌状态
	Sub        string      // 用户ID (subject)
	VisitorID  string      // 访问者ID
	Scope      string      // 权限范围
	ClientID   string      // 客户端ID
	VisitorTyp VisitorType // 访问者类型
	LoginIP    string      // 登陆IP
	Udid       string      // 设备码
	AccountTyp AccountType // 账户类型
	ClientTyp  ClientType  // 设备类型
}

// Hydra Hydra 授权服务接口
type Hydra interface {
	// Introspect token内省
	Introspect(ctx context.Context, token string) (info TokenIntrospectInfo, err error)
}
