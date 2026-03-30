package deploy_management

import "context"

type DrivenDeployMgm interface {
	GetHost(ctx context.Context) (*GetHostRes, error)
	GetLoginConfig(ctx context.Context, host string) (*LoginConfig, error)
}
type GetHostRes struct {
	Host   string `json:"host"`
	Port   string `json:"port"`
	Scheme string `json:"scheme"`
}

type LoginConfig struct {
	// DualfactorAuthServerStatus 双因素认证服务器状态配置
	DualfactorAuthServerStatus struct {
		AuthByOTP   bool `json:"auth_by_OTP"`   // 是否启用OTP认证
		AuthByUkey  bool `json:"auth_by_Ukey"`  // 是否启用Ukey认证
		AuthByEmail bool `json:"auth_by_email"` // 是否启用邮件认证
		AuthBySms   bool `json:"auth_by_sms"`   // 是否启用短信认证
	} `json:"dualfactor_auth_server_status"`

	// EnableSecretMode 是否启用秘密模式
	EnableSecretMode bool `json:"enable_secret_mode"`
	// EnableStrongPwd 是否启用强密码策略
	EnableStrongPwd bool `json:"enable_strong_pwd"`

	// OEMConfig OEM相关配置
	OEMConfig struct {
		RememberPass bool `json:"rememberpass"` // 是否记住密码
	} `json:"oemconfig"`

	// StrongPwdLength 强密码最小长度要求
	StrongPwdLength int `json:"strong_pwd_length"`

	// ThirdAuth 第三方认证配置
	ThirdAuth struct {
		// Config 第三方认证服务器配置
		Config struct {
			AuthServer     string `json:"authServer"`     // 认证服务器地址
			HideLogin      bool   `json:"hideLogin"`      // 是否隐藏登录入口
			HideThirdLogin bool   `json:"hideThirdLogin"` // 是否隐藏第三方登录
			MatchUrl       string `json:"matchUrl"`       // URL匹配规则
		} `json:"config"`
		ID string `json:"id"` // 第三方认证ID
	} `json:"thirdauth"`

	// VcodeLoginConfig 验证码登录配置
	VcodeLoginConfig struct {
		IsEnable     bool `json:"isenable"`     // 是否启用验证码登录
		PasswdErrCnt int  `json:"passwderrcnt"` // 密码错误次数限制
	} `json:"vcode_login_config"`

	// VcodeServerStatus 验证码服务器状态
	VcodeServerStatus struct {
		SendVcodeByEmail bool `json:"send_vcode_by_email"` // 是否启用邮件发送验证码
		SendVcodeBySms   bool `json:"send_vcode_by_sms"`   // 是否启用短信发送验证码
	} `json:"vcode_server_status"`

	// WindowsAdSso Windows AD单点登录配置
	WindowsAdSso struct {
		IsEnabled bool `json:"is_enabled"` // 是否启用AD单点登录
	} `json:"windows_ad_sso"`
}
