package info_system

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type UseCase interface {
	// CreateInfoSystem 创建信息系统
	CreateInfoSystem(ctx context.Context, req *CreateInfoSystem) (*response.NameIDResp, error)
	CheckInfoSystemRepeat(ctx context.Context, req *NameRepeatReq) (bool, error)
	GetInfoSystems(ctx context.Context, req *QueryPageReqParam) (*QueryPageRes, error)
	GetInfoSystemByIds(ctx context.Context, req *GetInfoSystemByIdsReq) ([]*GetInfoSystemByIdsRes, error)
	GetInfoSystem(ctx context.Context, req *GetInfoSystemReq) (*model.InfoSystem, error)
	// DeleteInfoSystem 删除信息系统
	DeleteInfoSystem(ctx context.Context, req *InfoSystemId) (*response.NameIDResp, error)
	// ModifyInfoSystem 修改信息系统
	ModifyInfoSystem(ctx context.Context, req *ModifyInfoSystemReq) (*response.NameIDResp, error)
	// EnqueueInfoSystem 入队信息系统
	EnqueueInfoSystem(ctx context.Context, id string) error
	// EnqueueInfoSystems 入队信息系统
	EnqueueInfoSystems(ctx context.Context) (*EnqueueInfoSystemRes, error)
	Migration(ctx context.Context) error

	// 注册信息系统
	RegisterInfoSystem(ctx context.Context, id string, req *RegisterInfoSystem, userInfo *model.User) (*response.NameIDResp2, error)
	SystemIdentifierRepeat(ctx context.Context, req *IdentifierRepeat) error
}

const (
	NotRegisteGateway = 0 // 未注册
	RegisteGateway    = 1 //已注册
)

type PageInfo struct {
	Offset    *int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                                                      // 页码，默认1
	Limit     *int    `json:"limit" form:"limit,default=12" binding:"omitempty,min=1,max=2000" default:"12"`                                             // 每页大小，默认12
	Direction *string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`                                 // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      *string `json:"sort" form:"sort,default=created_at" binding:"omitempty,oneof=created_at updated_at register_at name" default:"created_at"` // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序。默认按创建时间排序
}

type QueryPageReqParam struct {
	PageInfo
	Keyword           string `json:"keyword" form:"keyword" binding:"omitempty,VerifyXssString,min=1,max=128"`                                         // 关键字查询，字符无限制
	DepartmentId      string `json:"department_id" form:"department_id" binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`       // 部门ID
	IsRegisterGateway string `json:"is_register_gateway" form:"is_register_gateway" binding:"omitempty,oneof=false true" example:"false"`              // 是否注册
	JsDepartmentId    string `json:"js_department_id" form:"js_department_id" binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 建设部门ID
	Status            int    `json:"status" form:"status" binding:"omitempty,oneof=1 2 3" example:"1" `                                                // 状态1已建、2拟建、3在建
}

type GetInfoSystemReq struct {
	ID string `json:"id" form:"id" uri:"id" binding:"required,uuid"` // 信息系统标识
}

type GetInfoSystemByIdsReq struct {
	ID    []string `json:"ids" form:"ids" uri:"ids" binding:"required_without=Names,dive,uuid"` // 信息系统标识
	Names []string `json:"names" form:"names" uri:"names" binding:"required_without=ID"`        //信息系统的名称
}
type GetInfoSystemByIdsRes struct {
	ID             string `json:"id" binding:"required,uuid"`                                                               // 信息系统业务id
	Name           string `json:"name" binding:"required,VerifyObjectName"`                                                 // 信息系统名称
	Description    string `json:"description" binding:"lte=300"`                                                            // 信息系统描述
	DepartmentId   string `json:"department_id" binding:"omitempty"`                                                        // 信息系统部门ID
	CreatedAt      int64  `json:"created_at" binding:"required"`                                                            // 创建时间
	CreatedByUID   string `json:"created_by_uid" binding:"required,uuid"`                                                   // 创建用户ID
	UpdatedAt      int64  `json:"updated_at" binding:"required"`                                                            // 更新时间
	UpdatedByUID   string `json:"updated_by_uid" binding:"required,uuid"`                                                   // 更新用户ID
	JsDepartmentId string `json:"js_department_id" binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 建设部门ID
	Status         int    `json:"status" binding:"omitempty,oneof=1 2 3" example:"1" `                                      // 状态1已建、2拟建、3在建
}

type InfoSystemPage struct {
	ID                string          `json:"id" binding:"required,uuid"`                                                               // 信息系统id
	Name              string          `json:"name" binding:"required,VerifyObjectName"`                                                 // 信息系统名称
	Description       string          `json:"description" binding:"lte=300"`                                                            // 信息系统描述
	DepartmentId      string          `json:"department_id" binding:"uuid"`                                                             // 部门ID
	DepartmentName    string          `json:"department_name" binding:"VerifyObjectName"`                                               // 部门名称
	DepartmentPath    string          `json:"department_path" binding:"VerifyObjectName"`                                               // 部门路径
	Responsiblers     []*Responsibler `json:"responsiblers"  uri:"responsiblers"`                                                       // 负责人
	SystemIdentifier  string          `json:"system_identifier"`                                                                        // 系统标识
	RegisterAt        int64           `json:"register_at" binding:"required"`                                                           // 信息系统注册时间
	AcceptanceAt      int64           `json:"acceptance_at"`                                                                            // 验收日期
	IsRegisterGateway bool            `json:"is_register_gateway"`                                                                      // 是否注册到网关
	CreatedAt         int64           `json:"created_at" binding:"required"`                                                            // 信息系统创建时间
	CreatedUser       string          `json:"created_user" binding:"required,VerifyObjectName"`                                         // 信息系统创建用户名称
	UpdatedAt         int64           `json:"updated_at" binding:"required"`                                                            // 信息系统更新时间
	UpdatedUser       string          `json:"updated_user" binding:"required,VerifyObjectName"`                                         // 信息系统更新用户名称
	JsDepartmentId    string          `json:"js_department_id" binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 建设部门ID
	JsDepartmentName  string          `json:"js_department_name" binding:"VerifyObjectName"`                                            // 建设部门名称
	JsDepartmentPath  string          `json:"js_department_path" binding:"VerifyObjectName"`                                            // 建设部门路经
	Status            int             `json:"status" binding:"omitempty,oneof=1 2 3" example:"1" `                                      // 状态1已建、2拟建、3在建
}

type QueryPageRes struct {
	Entries    []*InfoSystemPage `json:"entries" binding:"required"`                      // 运营流程对象列表
	TotalCount int64             `json:"total_count" binding:"required,ge=0" example:"3"` // 当前筛选条件下的运营流程数量
}

type CreateInfoSystem struct {
	Name           string `json:"name"  binding:"required,VerifyXssString,lte=128"`                                                            // 信息系统名称
	Description    string `json:"description"  binding:"omitempty,VerifyXssString,lte=300,VerifyDescriptionReduceSpace" example:"description"` // 信息系统描述
	DepartmentId   string `json:"department_id" binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`                       // 部门ID
	AcceptanceAt   int64  `json:"acceptance_at" binding:"omitempty" example:"4102329600"`                                                      // 验收日期
	JsDepartmentId string `json:"js_department_id" binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`                    // 建设部门ID
	Status         int    `json:"status" binding:"omitempty,oneof=1 2 3" example:"1" `                                                         // 状态1已建、2拟建、3在建
}
type ModifyInfoSystemReq struct {
	ID             string `json:"-"`                                                                                                           // 信息系统标识
	Name           string `json:"name" binding:"required,VerifyXssString,lte=128"`                                                             // 信息系统名称
	Description    string `json:"description"  binding:"omitempty,VerifyXssString,lte=300,VerifyDescriptionReduceSpace" example:"description"` // 信息系统描述
	DepartmentId   string `json:"department_id" binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`                       // 部门ID
	AcceptanceAt   int64  `json:"acceptance_at" binding:"omitempty" example:"4102329600"`                                                      // 验收日期
	JsDepartmentId string `json:"js_department_id" binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`                    // 建设部门ID
	Status         int    `json:"status" binding:"omitempty,oneof=1 2 3" example:"1" `                                                         // 状态1已建、2拟建、3在建
}
type NameRepeatReq struct {
	ID   string `json:"id" uri:"id" binding:"omitempty,uuid"`                                                       // 信息系统标识，用于修改时名称校验
	Name string `json:"name" form:"name" binding:"required,VerifyXssString,min=1,max=128" example:"InfoSystemName"` // 信息系统名称
}

type InfoSystemId struct {
	ID string `json:"id" uri:"id" binding:"required,uuid"` // 信息系统标识
}

type RegisterInfoSystem struct {
	DepartmentId     string   `json:"department_id" binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`    // 部门ID
	InfoSystemID     string   `json:"info_system_id"  binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`  // 信息系统ID
	SystemIdentifier string   `json:"system_identifier" binding:"required,VerifyXssString,lte=128"`                             // 系统标识
	ResponsibleUIDS  []string `json:"responsible_uids"  uri:"responsible_uids" binding:"required,dive,uuid"`                    // 负责人
	JsDepartmentId   string   `json:"js_department_id" binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 建设部门ID
	Status           int      `json:"status" binding:"omitempty,oneof=1 2 3" example:"1" `                                      // 状态1已建、2拟建、3在建
}

type QueryRegisterPageReqParam struct {
	Offset    int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                                          // 页码，默认1
	Limit     int    `json:"limit" form:"limit,default=12" binding:"omitempty,min=1,max=2000" default:"12"`                                 // 每页大小，默认12
	Direction string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`                     // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      string `json:"sort" form:"sort,default=created_at" binding:"omitempty,oneof=created_at updated_at name" default:"created_at"` // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序。默认按创建时间排序
	Keyword   string `json:"keyword" form:"keyword" binding:"omitempty,VerifyXssString,min=1,max=128"`                                      // 关键字查询，字符无限制
}

type QueryRegisterPageRes struct {
	Entries    []*InfoRegisterSystemPage `json:"entries" binding:"required"`                      // 运营流程对象列表
	TotalCount int64                     `json:"total_count" binding:"required,ge=0" example:"3"` // 当前筛选条件下的运营流程数量
}

type InfoRegisterSystemPage struct {
	ID               string          `json:"id" binding:"required,uuid"`                                                               // 信息系统id
	Name             string          `json:"name" binding:"required,VerifyObjectName"`                                                 // 信息系统名称
	Description      string          `json:"description" binding:"lte=300"`                                                            // 信息系统描述
	DepartmentId     string          `json:"department_id" binding:"uuid"`                                                             // 部门ID
	DepartmentName   string          `json:"department_name" binding:"VerifyObjectName"`                                               // 部门名称
	DepartmentPath   string          `json:"department_path" binding:"VerifyObjectName"`                                               // 部门名称
	Responsiblers    []*Responsibler `json:"responsiblers"  uri:"responsiblers"`                                                       // 负责人
	SystemIdentifier string          `json:"system_identifier"`                                                                        // 系统标识
	RegisterAt       int64           `json:"register_at" binding:"required"`                                                           // 信息系统注册时间
	CreatedAt        int64           `json:"created_at" binding:"required"`                                                            // 信息系统创建时间
	CreatedUser      string          `json:"created_user" binding:"required,VerifyObjectName"`                                         // 信息系统创建用户名称
	UpdatedAt        int64           `json:"updated_at" binding:"required"`                                                            // 信息系统更新时间
	UpdatedUser      string          `json:"updated_user" binding:"required,VerifyObjectName"`                                         // 信息系统更新用户名称
	JsDepartmentId   string          `json:"js_department_id" binding:"omitempty,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 建设部门ID
	Status           int             `json:"status" binding:"omitempty,oneof=1 2 3" example:"1" `                                      // 状态1已建、2拟建、3在建
}

type Responsibler struct {
	ID   string `json:"id" example:"1"`
	Name string `json:"name" example:"zhangsan"`
}

type IpAddr struct {
	IP   string `json:"ip"`
	Port int    `json:"port"`
}

// type InfoSystemRegisterPage struct {
// 	ID                string `json:"id" binding:"required,uuid"`                       // 信息系统id
// 	Name              string `json:"name" binding:"required,VerifyObjectName"`         // 信息系统名称
// 	Description       string `json:"description" binding:"lte=300"`                    // 信息系统描述
// 	DepartmentId      string `json:"department_id" binding:"uuid"`                     // 部门ID
// 	DepartmentName    string `json:"department_name" binding:"VerifyObjectName"`       // 部门名称
// 	AcceptanceAt      int64  `json:"acceptance_at"`                                    // 验收日期
// 	IsRegisterGateway bool   `json:"is_register_gateway"`                              // 是否注册到网关
// 	CreatedAt         int64  `json:"created_at" binding:"required"`                    // 信息系统创建时间
// 	CreatedUser       string `json:"created_user" binding:"required,VerifyObjectName"` // 信息系统创建用户名称
// 	UpdatedAt         int64  `json:"updated_at" binding:"required"`                    // 信息系统更新时间
// 	UpdatedUser       string `json:"updated_user" binding:"required,VerifyObjectName"` // 信息系统更新用户名称
// }

type IdentifierRepeat struct {
	ID         string `json:"id" form:"id" binding:"omitempty,uuid"`           // 信息系统ID，用于修改时名称校验
	Identifier string `json:"identifier" form:"identifier" binding:"required"` // 信息系统标识
}

type EnqueueInfoSystemRes struct {
	// 成功的数量
	Succeed int `json:"succeed,omitempty"`
	// 失败的数量
	Failed int `json:"failed,omitempty"`
}
