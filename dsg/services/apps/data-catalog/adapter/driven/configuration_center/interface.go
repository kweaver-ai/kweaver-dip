package configuration_center

import (
	"context"
	"time"
)

type Repo interface {
	GetAlgServerConf(ctx context.Context, name string) (resp []*GetAlgServerConfResp, err error)
	GetInfoSysName(ctx context.Context, ids []string) (resp map[string]string, err error)
	GetInfoSysList(ctx context.Context) (infos *GetInfoSysListResp, err error)
	GetSubOrgCodes(ctx context.Context, req *GetSubOrgCodesReq) (*GetSubOrgCodesResp, error)
	GetUserByIds(ctx context.Context, ids string) ([]*GetUserByIdsResp, error)
	GetDepartmentById(ctx context.Context, id string) (*GetDepartmentByIdResp, error)
}

type GetSubOrgCodesReq struct {
	OrgCode string
}

type GetSubOrgCodesResp struct {
	Codes []string
}

type GetAlgServerConfResp struct {
	Name string `json:"name"`
	Addr string `json:"addr"`
}

type GetInfoSysNameResp []*DSIDInfoSysName

type DSIDInfoSysName struct {
	DataSourceID   string `json:"data_source_id"`
	InfoSystemID   string `json:"info_system_id"`
	InfoSystemName string `json:"info_system_name"`
}

type GetInfoSysListResp struct {
	TotalCount int64 `json:"total_count"`
}

type GetUserByIdsResp struct {
	ID          string    `gorm:"column:id;primaryKey" json:"id"` // 主键，uuid
	Name        string    `gorm:"column:name" json:"name"`
	Status      int32     `gorm:"column:status;not null;default:1;comment:用户状态,1正常,2删除" json:"status"`           // 用户状态,1正常,2删除
	UserType    int32     `gorm:"column:user_type;not null;default:1;comment:用户类型,1普通账号,2应用账号" json:"user_type"` // 用户类型,1普通账号,2应用账号
	PhoneNumber string    `gorm:"column:phone_number" json:"phone_number"`                                       // 手机号码
	MailAddress string    `gorm:"column:mail_address" json:"mail_address"`                                       // 邮箱地址
	LoginName   string    `gorm:"column:login_name" json:"login_name"`                                           // 登录名称
	Scope       string    `gorm:"column:scope" json:"scope"`                                                     // 权限范围
	UpdatedAt   time.Time `gorm:"column:updated_at;not null;default:current_timestamp(3)" json:"updated_at"`     // 更新时间
	ThirdUserId string    `gorm:"column:f_third_user_id" json:"third_user_id"`
	UpdatedBy   string    `gorm:"column:updated_by" json:"updated_by"` // 更新人id
}

type GetDepartmentByIdResp struct {
	ID          string `json:"id" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d" binding:"required,uuid"` // 对象ID
	Name        string `json:"name" binding:"required,VerifyObjectName"`                                  // 对象名称
	Path        string `json:"path" binding:"lte=65535"`
	PathID      string `json:"path_id" binding:"lte=65535,gte=36"`
	Type        string `json:"type" binding:"required,oneof=root organization department"`
	Subtype     int32  `json:"subtype" binding:"required,min=0,max=3"` // 对象子类型，用于对象类型二次分类，有效值包括0-未分类 1-行政区 2-部门 3-处（科）室
	Attributes  any    `json:"attributes"`                             // 对象属性
	ThirdDeptId string `json:"third_dept_id"`                          //第三方部门ID
}
