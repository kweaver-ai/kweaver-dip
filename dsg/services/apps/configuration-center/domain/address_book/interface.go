package firm

import (
	"context"
	"mime/multipart"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models"
)

type UseCase interface {
	Create(ctx context.Context, uid string, req *UserInfoReq) (*IDResp, error)
	Import(ctx context.Context, uid string, file *multipart.FileHeader) (*TotalCountResp, error)
	Update(ctx context.Context, uid string, recordId uint64, req *UserInfoReq) (*IDResp, error)
	Delete(ctx context.Context, uid string, recordId uint64) (*IDResp, error)
	GetList(ctx context.Context, req *ListReq) (*ListResp, error)
}

type IDReq struct {
	ID models.ModelID `uri:"id" json:"id" binding:"TrimSpace,required,VerifyModelID" example:"545911190992222513"` // 人员信息ID
}
type IDResp struct {
	ID string `json:"id" binding:"required" example:"545911190992222513"` // 人员信息ID
}

type UserInfoReq struct {
	Name         string `json:"name" binding:"TrimSpace,required,min=1,max=128" example:"name"`                                    // 人员姓名
	DepartmentID string `json:"department_id" binding:"required,uuid" example:"151bcb65-48ce-4b62-973f-0bb6685f9cb8"`              // 部门ID
	ContactPhone string `json:"contact_phone" binding:"TrimSpace,required,min=3,max=20,VerifyPhoneNumber" example:"13166789247"`   // 手机号码
	ContactMail  string `json:"contact_mail" binding:"TrimSpace,omitempty,min=5,max=128,VerifyEmail" example:"siwei.zhou@163.com"` // 邮箱地址
}

type TotalCountResp struct {
	TotalCount int64 `json:"total_count"  binding:"required,gte=0" example:"1"` // 总条目数
}

type ListReq struct {
	Offset       int    `form:"offset,default=1" binding:"omitempty,min=1" default:"1" example:"1"`                                // 页码，默认1
	Limit        int    `form:"limit,default=10" binding:"omitempty,min=10,max=1000" default:"10" example:"10"`                    // 每页大小，默认10
	Direction    string `form:"direction,default=desc" binding:"TrimSpace,omitempty,oneof=asc desc" default:"desc" example:"desc"` // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort         string `form:"sort,default=name" binding:"TrimSpace,omitempty,oneof=name" default:"name" example:"name"`          // 排序类型，枚举：name: 按人员名称排序。默认按人员名称排序
	Keyword      string `form:"keyword" binding:"TrimSpace,omitempty,min=1,max=255" example:"keyword"`                             // 关键字，模糊匹配人员名称、所属部门及手机号码
	DepartmentID string `form:"department_id" binding:"omitempty,uuid" example:"151bcb65-48ce-4b62-973f-0bb6685f9cb8"`             // 部门ID
}

type ListResp struct {
	Entries    []*ListItem `json:"entries" binding:"required"`                       // 人员信息列表
	TotalCount int64       `json:"total_count" binding:"required,gte=0" example:"1"` // 当前筛选条件下的人员信息数量
}
type ListItem struct {
	ID           uint64 `json:"id,string" binding:"required" example:"545911190992222513"`                            // 人员信息ID
	Name         string `json:"name" binding:"required" example:"name"`                                               // 人员名称
	DepartmentID string `json:"department_id" binding:"required,uuid" example:"151bcb65-48ce-4b62-973f-0bb6685f9cb8"` // 所属部门ID
	Department   string `json:"department" binding:"required" example:"组织架构"`                                         // 所属部门
	ContactPhone string `json:"contact_phone" binding:"required" example:"13166789247"`                               // 手机号码
	ContactMail  string `json:"contact_mail" binding:"omitempty" example:"siwei.zhou@163.com"`                        // 邮箱地址
}
