package news_policy

import (
	"context"
	"mime/multipart"
	"time"
)

type UseCase interface {
	NewAdd(ctx context.Context, req *NewsPolicyAddRes, file *multipart.FileHeader, userId string) (*NewsPolicySaveReq, error)
	UpdateAdd(ctx context.Context, req *NewsPolicyAddRes, file *multipart.FileHeader, id string, userId string) (*NewsPolicySaveReq, error)
	Delete(ctx context.Context, req *NewsPolicyDeleteReq) (*NewsPolicyDeleteReq, error)
	Get(ctx context.Context, req *ListReq) (*ListResp, error)
	//获取oss文件流
	GetOssFile(ctx context.Context, req *NewsPolicyDeleteReq) ([]byte, error)
	GetOssPreviewFile(ctx context.Context, req *NewsPolicyDeleteReq) (*HelpDocument, []byte, error)
	GetNewsPolicyList(ctx context.Context, req *NewsDetailsReq) (*CmsContent, error)
	UpdatePolicyStatus(ctx context.Context, req *UpdatePolicyPath) (*NewsPolicySaveReq, error)

	GetHelpDocumentList(ctx context.Context, req *ListHelpDocumentReq) (*ListDocumentResp, error)
	CreateHelpDocument(ctx context.Context, req *HelpDocument, file *multipart.FileHeader, userId string) (*NewsPolicySaveReq, error)
	UpdateHelpDocument(ctx context.Context, req *HelpDocument, file *multipart.FileHeader, id string, userId string) (*NewsPolicySaveReq, error)
	DeleteHelpDocument(ctx context.Context, req *DeleteHelpDocumentReq) (*NewsPolicyDeleteReq, error)
	GetHelpDocumentDetail(ctx context.Context, req *GetHelpDocumentReq) (*HelpDocument, error)
	Preview(ctx context.Context, req *NewsPolicySaveReq) (*DownloadResp, error)
	UpdateHelpDocumentStatus(ctx context.Context, req *UpdateHelpDocumentPath) (*NewsPolicySaveReq, error)
	GeneratePreview(ctx context.Context, objID string, storageID, tmpFileName string, data []byte) (id string, err error)
}

type DownloadResp struct {
	Name    string `json:"name"  binding:"required" example:"标准文件.pdf"` // 文件名称
	Content []byte // 文件流
}
type NewsPolicyDeleteReq struct {
	ID string `json:"id" uri:"id" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`
}
type NewsPolicySaveReq struct {
	ID string `json:"id" uri:"id" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`
}
type NewsPathReq struct {
	ID *string `json:"id" uri:"id" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`
}
type UpdatePolicyPath struct {
	ID     string `form:"id" binding:"required"`
	Status string `form:"status" binding:"required"`
	Type   string `form:"type" binding:"required"`
}

type UpdateHelpDocumentPath struct {
	ID     string `form:"id" binding:"required"`
	Status string `form:"status" binding:"required"`
}
type NewsPolicyGetReq struct {
	ID     string `json:"id" uri:"id" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`
	Offset int    `form:"page" binding:"required"`
	Limit  int    `form:"size" binding:"required"`
	Status *int32 `form:"status" binding:"omitempty,min=1,max=3"`
	name   string `form:"name" binding:"required"`
}

type NewsPolicyListReq struct {
	Title  string `form:"title"`
	Status *int   `form:"status"`
	Type   *int   `form:"type"` // 0-新闻 1-政策
	Page   int    `form:"page" binding:"required"`
	Size   int    `form:"size" binding:"required"`
}

type NewsPolicyListResp struct {
	List  []*NewsPolicyListItem `json:"list"`
	Total int64                 `json:"total"`
}

type ListReq struct {
	Offset    int    `form:"offset,default=1" binding:"omitempty,min=1" default:"1" example:"1"`                                // 页码，默认1
	Limit     int    `form:"limit,default=10" binding:"omitempty,min=10,max=1000" default:"10" example:"10"`                    // 每页大小，默认10
	Direction string `form:"direction,default=desc" binding:"TrimSpace,omitempty,oneof=asc desc" default:"desc" example:"desc"` // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      string `form:"sort,default=name" binding:"TrimSpace,omitempty,oneof=name" default:"name" example:"name"`          // 排序类型，枚举：name: 按厂商名称排序。默认按厂商名称排序
	Status    string `form:"status" binding:"TrimSpace,omitempty,min=1,max=128" example:"keyword"`                              // 关键字，模糊匹配厂商名称、统一社会信用代码及法定代表
	Title     string `form:"title" binding:"TrimSpace,omitempty"`                                                               // 厂商IDs，多个用英文逗号分隔
	Type      string `form:"type" binding:"TrimSpace,omitempty,min=1,max=128" example:"keyword"`
	Name      string `form:"name" binding:"TrimSpace,omitempty"`
	HomeShow  string `form:"home_show" binding:"TrimSpace,omitempty,min=1,max=128" example:"keyword"`
}

type NewsPolicyListItem struct {
	ID         string `json:"id"`
	Title      string `json:"title"`
	Status     int    `json:"status"`
	Updater    string `json:"updater"`
	UpdateTime string `json:"update_time"`
	Type       int    `json:"type"`
}

type ListResp struct {
	Items []*CmsContent `json:"items"`
	Total int64         `json:"total"`
}

type ListDocumentResp struct {
	Items []*HelpDocument `json:"items"`
	Total int64           `json:"total"`
}

type NewsDetailsReq struct {
	ID     string `json:"id" uri:"id"  example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`
	Type   string `json:"type" uri:"type"  example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`
	Status string `json:"status"  example:"1"`
}

type NewsPolicyAddRes struct {
	Title     string ` json:"title"  example:"1"`
	Summary   string `json:"summary"  example:"1"`
	Content   string `json:"content"  example:"1"`
	ImageUrls string ` json:"file"  example:"1"`
	Status    string `json:"status"   example:"1"`
	Type      string ` json:"type"   example:"1"`
	HomeShow  string `json:"homeShow"  example:"1"`
}
type NewsPolicyCreateReq struct {
	Title       string   `json:"title" binding:"required"`
	Summary     string   `json:"summary"`
	Content     string   `json:"content" binding:"required"`
	Type        int      `json:"type" binding:"required"` // 0-新闻 1-政策
	Status      int      `json:"status" binding:"required"`
	PublishTime string   `json:"publish_time"`
	HomeShow    string   `json:"home_show"`
	ImageUrls   []string `json:"image_urls"` // 新闻时必填
}

type NewsPolicyUpdateReq struct {
	ID        string `uri:"id" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"`
	Title     string `uri:"title" binding:"required" validate:"required" example:"1"`
	Summary   string `uri:"summary" binding:"required" validate:"required" example:"1"`
	Content   string `uri:"content" binding:"required" validate:"required" example:"1"`
	ImageUrls string `uri:"image_urls" binding:"required" validate:"required" example:"1"`
	Status    int    `uri:"status" binding:"required" validate:"required" example:"1"`
	Type      int    `uri:"type" binding:"required" validate:"required" example:"1"`
	HomeShow  string `uri:"home_show" binding:"required" validate:"required" example:"1"`
}

type NewsPolicyDetailResp struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Summary     string   `json:"summary"`
	Content     string   `json:"content"`
	Type        int      `json:"type"`
	Status      int      `json:"status"`
	PublishTime *string  `json:"publish_time"`
	HomeShow    bool     `json:"home_show"`
	ImageUrls   []string `json:"image_urls"`
	Creator     string   `json:"creator"`
	CreateTime  string   `json:"create_time"`
	Updater     string   `json:"updater"`
	UpdateTime  string   `json:"update_time"`
}

type CmsContent struct {
	ID          string     `gorm:"column:id;primaryKey"`
	Title       string     `gorm:"column:title" json:"title"`
	Summary     string     `gorm:"column:summary" json:"summary"`
	Content     string     `gorm:"column:content" json:"content"`
	Type        string     `gorm:"column:type" json:"type"`
	Status      string     `gorm:"column:status" json:"status"`
	HomeShow    string     `gorm:"column:home_show" json:"homeShow"`
	ImageId     string     `gorm:"column:image_id" json:"imageId"`
	SavePath    string     `gorm:"column:save_path" json:"savePath"`
	Size        *int64     `gorm:"column:size;type:bigint(20);default:0" json:"size"`
	PublishTime *time.Time `gorm:"column:publish_time"`
	CreatorID   string     `gorm:"column:creator_id"`
	UpdaterID   string     `gorm:"column:updater_id"`
	CreateTime  string     `gorm:"column:create_time"`
	UpdateTime  string     `gorm:"column:update_time"`
	IsDeleted   string     `gorm:"column:is_deleted"`
	Creator     string     `gorm:"-"`
	Updater     string     `gorm:"-"`
}

func (CmsContent) TableName() string {
	return "t_cms_content"
}

type CmsContentImage struct {
	ID         int64     `gorm:"column:id;primaryKey;autoIncrement"`
	ContentID  string    `gorm:"column:content_id"`
	ImageUrl   string    `gorm:"column:image_url"`
	IsCover    int       `gorm:"column:is_cover"`
	CreateTime time.Time `gorm:"column:create_time"`
}

func (CmsContentImage) TableName() string {
	return "t_cms_content_image"
}

// domain/help_document.go

type HelpDocument struct {
	ID          string `gorm:"column:id"`
	Title       string `gorm:"column:title" json:"title"`
	Type        string `gorm:"column:type" json:"type"`      // 0-使用手册，1-常见问题
	Status      string ` gorm:"column:status" json:"status"` // 0-未发布，1-已发布
	ImageID     string `gorm:"column:image_id" json:"image_id,omitempty"`
	SavePath    string `gorm:"column:save_path" json:"save_path,omitempty"`
	Size        int64  `gorm:"column:size" json:"size,omitempty"`
	IsDeleted   string ` gorm:"column:is_deleted" json:"is_deleted"`
	CreatedAt   string `gorm:"column:created_at" json:"create_time"`
	UpdatedAt   string `gorm:"column:updated_at" json:"update_time"`
	CreatedBy   string `gorm:"column:created_by" json:"created_by"`
	UpdatedBy   string `gorm:"column:updated_by" json:"updated_by"`
	PublishedAt string `gorm:"column:published_at" json:"published_at"`
}

func (HelpDocument) TableName() string {
	return "t_help_document"
}

type ListHelpDocumentReq struct {
	Offset    int    `form:"offset,default=1" binding:"omitempty,min=1" default:"1" example:"1"`             // 页码，默认1
	Limit     int    `form:"limit,default=10" binding:"omitempty,min=10,max=1000" default:"10" example:"10"` // 每页大小，默认10
	Title     string `form:"title" json:"title"`
	Status    string `form:"status" json:"status"`
	Type      string `form:"type" json:"type"`
	Direction string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"` // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      string `json:"sort" form:"sort,default=published_at" binding:"omitempty" default:"published_at"`          // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序。默认按创建时间排序
}

type CreateHelpDocumentReq struct {
	Title  string `form:"title" binding:"required"`
	Type   int    `form:"type" binding:"required,oneof=0 1"`
	Status int    `form:"status" binding:"omitempty,oneof=0 1"`
	File   *multipart.FileHeader
}

type UpdateHelpDocumentReq struct {
	ID     int64  `uri:"id" binding:"required"`
	Title  string `form:"title" binding:"required"`
	Type   int    `form:"type" binding:"required,oneof=0 1"`
	Status int    `form:"status" binding:"omitempty,oneof=0 1"`
	File   *multipart.FileHeader
}

type DeleteHelpDocumentReq struct {
	ID string `uri:"id" binding:"required"`
}

type GetHelpDocumentReq struct {
	ID string `form:"id" binding:"required"`
}
