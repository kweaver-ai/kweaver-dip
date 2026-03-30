package carousels

import (
	"context"
	"github.com/gin-gonic/gin"
	"mime/multipart"
	"time"
)

type IService interface {
	Upload(ctx context.Context, file *multipart.FileHeader, applicationExampleID string, types string) (*IDResp, error)
	UploadModify(ctx context.Context, file *multipart.FileHeader, id string, applicationExampleID string, types string) (*IDResp, error)
	// 文件删除
	Delete(ctx context.Context, req *IDPathParam) (*IDResp, error)
	// 文件更新
	Update(ctx context.Context, req *UpdateFileReq) (*UpdateFileReq, error)
	// 文件查询
	GetList(ctx context.Context, req *ListReq) (*ListResp, error)
	//文件预览
	Preview(ctx context.Context, req *IDPathParam) (*DownloadResp, error)
	// 更新排序
	UpdateSort(ctx context.Context, req *UpdateSortReq) error

	Replace(ctx *gin.Context, req *ReplaceFileReq, file *multipart.FileHeader) error

	UpdateCase(ctx *gin.Context, req *UploadCasePathParam, file *multipart.FileHeader) error
	//获取oss文件流
	GetOssFile(ctx context.Context, req *IDPathParam) ([]byte, error)
	//更新状态
	UpdateState(ctx context.Context, req *UploadCaseStateParam) (*IDResp, error)
	//获取carouselCase
	GetByCaseName(ctx context.Context, opts *ListCaseReq) ([]*CarouselCaseWithCaseName, error)
	//删除carouselCase
	DeleteCase(ctx context.Context, req *IDPathParam) (*IDResp, error)
	UpdateInterval(ctx context.Context, opts *IntervalSeconds) error
	UpdateTop(ctx context.Context, req *IDResp) error
	CheckDefaultImageExists(ctx context.Context) (bool, error)
}

type IDResp struct {
	ID string `json:"id,string"`
}

// ReplaceFileReq 替换文件请求结构
type ReplaceFileReq struct {
	ID      string `uri:"id" binding:"required" validate:"required" example:"1"` // 文件ID
	NewFile *multipart.FileHeader
}

type IDPathParam struct {
	ID string `uri:"id" binding:"required" validate:"required" example:"1"` // 文件ID
}

type UploadCasePathReq struct {
	ID   string `uri:"id" binding:"required" validate:"required" example:"1"`   // 文件ID
	Type string `uri:"type" binding:"required" validate:"required" example:"1"` //类型
}

type UploadCasePathParam struct {
	ID                   string `uri:"id" binding:"required" validate:"required" example:"1"`   // 文件ID
	ApplicationExampleID string `uri:"application_example_id" binding:"required"  example:"1"`  //案例ID
	Type                 string `uri:"type" binding:"required" validate:"required" example:"1"` //类型
}

type DownloadResp struct {
	Name    string `json:"name"  binding:"required" example:"标准文件.pdf"` // 文件名称
	Content []byte // 文件流
}

type UpdateFileReq struct {
	ID   string `json:"id,string"`
	Name string `json:"name"`
}

type UploadCaseStateParam struct {
	ID    string `uri:"id" binding:"required" validate:"required" example:"1"` // 文件ID
	State string `uri:"state" binding:"required" validate:"required" example:"1"`
}

type ListCaseReq struct {
	Offset   int    `form:"offset,default=1" binding:"omitempty,min=1" default:"1" example:"1"`             // 页码，默认1
	Limit    int    `form:"limit,default=10" binding:"omitempty,min=10,max=1000" default:"10" example:"10"` // 每页大小，默认10
	Name     string `json:"name"  form:"name" binding:"omitempty" example:"xxx"`
	Id       string `form:"id"  json:"id" example:"151bcb65-48ce-4b62-973f-0bb6685f9cb8"`
	Position string `form:"position" json:"position" example:"xxxx"`
}

type IntervalSeconds struct {
	IntervalSeconds string `form:"interval_seconds,default=3" binding:"omitempty,min=1" default:"3" example:"3" json:"interval_seconds"`
}

type CarouselCaseQuery struct {
	ID                   string `gorm:"column:id;type:char(36);primary_key"`
	ApplicationExampleID string `gorm:"column:application_example_id;type:char(36);null"`
	Name                 string `gorm:"column:name;type:varchar(256);not null"`
	Type                 string `gorm:"column:type;type:varchar(64);null"`
	State                string `gorm:"column:state;type:char(36);default:1"`
	IsTop                string `gorm:"column:is_top;type:char(36);default:1"`
	CaseName             string `gorm:"column:caseName" json:"caseName"`
	Uuid                 string `gorm:"column:uuid" json:"uuid"`
}

type CarouselCase struct {
	ID                   string    `gorm:"column:id;type:char(36);primary_key"`
	ApplicationExampleID string    `gorm:"column:application_example_id;type:char(36);null"`
	Name                 string    `gorm:"column:name;type:varchar(256);not null"`
	UUID                 string    `gorm:"column:uuid;type:varchar(256);not null"`
	Size                 int64     `gorm:"column:size;type:bigint(20);not null;default:0"`
	SavePath             string    `gorm:"column:save_path;type:text;not null"`
	CreatedAt            time.Time `gorm:"column:created_at;type:datetime(3);not null;default:current_timestamp(3)"`
	CreatedBy            string    `gorm:"column:created_by;type:varchar(64);null"`
	UpdatedAt            time.Time `gorm:"column:updated_at;type:datetime(3);not null;default:current_timestamp(3)"`
	Type                 string    `gorm:"column:type;type:varchar(64);default:0"`
	State                string    `gorm:"column:state;type:char(36);default:1"`
	//interval_seconds 字段，默认值3 int类型
	IntervalSeconds string `gorm:"column:interval_seconds;type:char(36);default:3"`
	IsTop           string `gorm:"column:is_top;type:char(36);default:1"`
	SortOrder       int    `gorm:"column:sort_order;type:int;default:1000"`
	//CaseName        string `gorm:"-" json:"caseName"`
}

type CarouselCaseWithCaseName struct {
	CarouselCase
	CaseName string `json:"caseName" gorm:"column:CaseName"` // 注意字段名匹配 SQL 中的别名
}

// ListReq defines the request parameters for fetching a list of carousels
// For example, Page and Limit fields can be used for pagination
//
// You may need to adjust these fields according to your business needs.
type ListReq struct {
	Offset   int    `form:"offset,default=1" binding:"omitempty,min=1" default:"1" example:"1"`             // 页码，默认1
	Limit    int    `form:"limit,default=10" binding:"omitempty,min=10,max=1000" default:"10" example:"10"` // 每页大小，默认10
	Id       string `form:"id"  json:"id" example:"151bcb65-48ce-4b62-973f-0bb6685f9cb8"`
	Position string `form:"position" json:"position" example:"151bcb65-48ce-4b62-973f-0bb6685f9cb8"`
}

// ListResp defines the response structure for fetching a list of carousels
// Items contains the fetched carousel data
// Total represents the total number of records
//
// These definitions may vary depending on your specific requirements.
type ListResp struct {
	Items []CarouselCase `json:"items"`
	Total int64          `json:"total"`
}

// UpdateSortReq 更新排序请求结构
type UpdateSortReq struct {
	ID        string `form:"id" json:"id" binding:"required"`
	SortOrder int    `form:"position" json:"position" binding:"required"`
	Type      string `form:"type" json:"type" binding:"required"`
}
