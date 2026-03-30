package af_configuration

import (
	"context"
	"time"
)

type AFConfigurationInterface interface {
	// 数据源
	Datasources() DatasourceInterface
	// 信息系统
	InfoSystems() InfoSystemInterface
	// 部门、组织架构、对象
	Objects() ObjectInterface
	// 用户
	Users() UserInterface
}

type DatasourceInterface interface {
	Get(ctx context.Context, id string) (*Datasource, error)
	GetByHuaAoId(ctx context.Context, id string) (*Datasource, error)
}

type Datasource struct {
	ID           string
	Name         string
	CatalogName  string
	DatabaseName string
	HuaAoId      string
	TypeName     string
	Schema       string
}

type InfoSystemInterface interface {
	Get(ctx context.Context, id string) (*InfoSystem, error)
}

type InfoSystem struct {
	ID   string
	Name string
}

type ObjectInterface interface {
	Get(ctx context.Context, id string) (*Object, error)
}

type Object struct {
	ID   string
	Path string
}

type UserInterface interface {
	Get(ctx context.Context, id string) (*User, error)
}

// 用户
type User struct {
	ID string `json:"id,omitempty"`
	// 显示名称
	Name string `json:"name,omitempty"`
	// 状态 1 正常 2 删除
	Status int `json:"status,omitempty"`
	// 用户状态,1正常,2删除
	UserType int `json:"user_type,omitempty"`
	// 手机号码
	PhoneNumber string `json:"phone_number,omitempty"`
	// 邮箱地址
	MailAddress string `json:"mail_address,omitempty"`
	// 登录名
	LoginName string `json:"login_name,omitempty"`
	// 权限范围
	Scope string `json:"scope,omitempty"`
	// 更新时间
	UpdatedAt time.Time `json:"updated_at,omitempty"`
	// 第三方用户 ID
	FThirdUserID string `json:"f_third_user_id,omitempty"`
	// 更新人 ID
	UpdatedBy string `json:"updated_by,omitempty"`
}
