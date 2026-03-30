package open_catalog

import (
	"context"
	"mime/multipart"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
)

type FileResourceDomain interface {
	CreateFileResource(ctx context.Context, req *CreateFileResourceReq) (resp *IDResp, err error)
	GetFileResourceList(ctx context.Context, req *GetFileResourceListReq) (*GetFileResourceListRes, error)
	GetFileResourceDetail(ctx context.Context, ID uint64) (*GetFileResourceDetailRes, error)
	UpdateFileResource(ctx context.Context, ID uint64, req *UpdateFileResourceReq) (resp *IDResp, err error)
	DeleteFileResource(ctx context.Context, ID uint64) error
	PublishFileResource(ctx context.Context, ID uint64) (resp *IDResp, err error)
	CancelAudit(ctx context.Context, ID uint64) (resp *IDResp, err error)
	GetAuditList(ctx context.Context, req *GetAuditListReq) (resp *AuditListRes, err error)
	GetAttachmentList(ctx context.Context, ID string, req *GetAttachmentListReq) (*GetAttachmentListRes, error)
	UploadAttachment(ctx context.Context, ID uint64, files []*multipart.FileHeader) (resp *UploadAttachmentRes, err error)
	PreviewPdf(ctx context.Context, req *PreviewPdfReq) (resp *PreviewPdfRes, err error)
	DeleteAttachment(ctx context.Context, ID string) error
}

type IDRequired struct {
	ID models.ModelID `json:"id" form:"id" uri:"id" binding:"required,VerifyModelID" example:"539255713394882848"` // ID
}

type IDResp struct {
	ID string `json:"id"` // 资源对象ID
}

// region CreateFileResource

type CreateFileResourceReq struct {
	Name         string `json:"name" binding:"required"`                                                              // 文件资源名称
	DepartmentId string `json:"department_id" binding:"required,uuid" example:"664c3791-297e-44da-bfbb-2f1b82f3b672"` // 所属部门id
	Description  string `json:"description" binding:"omitempty"`                                                      // 描述
}

//endregion

// region GetFileResourceList

type ResourcePageInfo struct {
	request.PageBaseInfo
	request.KeywordInfo
	Direction *string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc" example:"desc"`                             // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      *string `json:"sort" form:"sort,default=updated_at" binding:"omitempty,oneof=updated_at name published_at" default:"updated_at" example:"updated_at"` // 排序类型，枚举：name：按资源名称排序，updated_at：按更新时间排序。默认按更新时间排序
}
type GetFileResourceListReq struct {
	ResourcePageInfo
	UpdatedAtStart       int64    `json:"updated_at_start" form:"updated_at_start" binding:"omitempty,gt=0"`                                                                     // 更新开始时间
	UpdatedAtEnd         int64    `json:"updated_at_end" form:"updated_at_end" binding:"omitempty,gt=0"`                                                                         // 更新结束时间
	DepartmentID         string   `json:"department_id" form:"department_id" binding:"omitempty,uuid" example:"c9e795a5-324b-4986-9403-51c5528f508e"`                            // 所属部门id
	SubDepartmentIDs     []string `json:"-"`                                                                                                                                     // 部门的子部门id
	PublishStatus        []string `json:"publish_status" form:"publish_status" binding:"omitempty,dive,oneof=unpublished pub-auditing pub-reject published" example:"published"` // 发布状态 未发布unpublished 、发布审核中pub-auditing、已发布published、发布审核未通过pub-reject
	MyDepartmentResource bool     `json:"my_department_resource" form:"my_department_resource"`                                                                                  //本部门资源
}

type GetFileResourceListRes struct {
	Entries    []*FileResource `json:"entries" binding:"required"`     // 对象列表
	TotalCount int64           `json:"total_count" binding:"required"` // 当前筛选条件下的对象数量
}
type FileResource struct {
	ID                  string `json:"id" binding:"required"`               // 文件资源id
	Name                string `json:"name" binding:"required"`             // 文件资源名称
	Code                string `json:"code" binding:"required"`             // 文件资源编码
	DepartmentId        string `json:"department_id" binding:"required"`    // 所属部门id
	Department          string `json:"department" binding:"required"`       // 所属部门
	DepartmentPath      string `json:"department_path" binding:"required"`  // 所属部门路径
	Description         string `json:"description" binding:"omitempty"`     // 描述
	PublishStatus       string `json:"publish_status" binding:"required"`   // 发布状态 未发布 unpublished、已发布 published
	AuditState          int8   `json:"audit_state" binding:"required"`      // 审核状态，0 未审核  1 审核中  2 通过  3 驳回
	AuditAdvice         string `json:"audit_advice" binding:"omitempty"`    // 审核意见，仅驳回时有用
	AttachmentCount     int64  `json:"attachment_count" binding:"required"` // 附件数量
	UpdatedAt           int64  `json:"updated_at" binding:"omitempty"`      // 文件资源更新时间
	DataCatalogID       string `json:"data_catalog_id"`
	DataCatalogName     string `json:"data_catalog_name"`
	PublishedAt         int64  `json:"published_at" binding:"omitempty"`
	CatalogProviderPath string `json:"catalog_provider_path" binding:"omitempty"` // 目录提供方（部门路径）
}

//endregion

// region GetFileResourceDetail

type GetFileResourceDetailRes struct {
	ID                  string `json:"id" binding:"required"`                     // 文件资源id
	Name                string `json:"name" binding:"required"`                   // 文件资源名称
	Code                string `json:"code" binding:"required"`                   // 文件资源编码
	DepartmentId        string `json:"department_id" binding:"required"`          // 所属部门id
	Department          string `json:"department" binding:"required"`             // 所属部门
	DepartmentPath      string `json:"department_path" binding:"required"`        // 所属部门路径
	Description         string `json:"description" binding:"omitempty"`           // 描述
	PublishStatus       string `json:"publish_status"`                            // 发布状态 未发布unpublished 、发布审核中pub-auditing、已发布published、发布审核未通过pub-reject
	PublishedAt         int64  `json:"published_at" binding:"omitempty"`          // 发布时间
	CreatedAt           int64  `json:"created_at" binding:"required"`             // 创建时间
	CreatorUID          string `json:"creator_uid" binding:"omitempty"`           // 创建用户ID
	CreatorName         string `json:"creator_name" binding:"omitempty"`          // 创建用户名称
	UpdatedAt           int64  `json:"updated_at" binding:"omitempty"`            // 更新时间
	UpdaterUID          string `json:"updater_uid" binding:"omitempty"`           // 更新用户ID
	UpdaterName         string `json:"updater_name" binding:"omitempty"`          // 更新用户名称
	CatalogProviderPath string `json:"catalog_provider_path" binding:"omitempty"` // 目录提供方（部门路径）
}

//endregion

// region UpdateFileResource

type UpdateFileResourceReq struct {
	Name         string `json:"name" binding:"required"`                                                              // 文件资源名称
	DepartmentId string `json:"department_id" binding:"required,uuid" example:"664c3791-297e-44da-bfbb-2f1b82f3b672"` // 所属部门id
	Description  string `json:"description" binding:"omitempty"`                                                      // 描述
}

//endregion

// region GetAuditList

type GetAuditListReq struct {
	request.PageBaseInfo
	request.KeywordInfo
}

type AuditListRes struct {
	TotalCount int64           `json:"total_count" binding:"required"` //总数
	Entries    []*WorkflowItem `json:"entries" binding:"required"`     //workflow申请记录
}
type WorkflowItem struct {
	ID               string `json:"id" binding:"required"`                                                        //流程实例ID
	ApplyCode        string `json:"apply_code" binding:"required"`                                                //审核code
	FileResourceID   string `json:"file_resource_id" binding:"required"`                                          //文件资源ID
	FileResourceName string `json:"file_resource_name" binding:"required"`                                        //文件资源名称
	FileResourceCode string `json:"file_resource_code" binding:"required"`                                        //文件资源编码
	Department       string `json:"department" binding:"required"`                                                //所属部门
	DepartmentPath   string `json:"department_path" binding:"required"`                                           //所属部门路径
	Description      string `json:"description" binding:"omitempty"`                                              //文件资源描述
	ApplierID        string `json:"applier_id" binding:"required" example:"c9e795a5-324b-4986-9403-51c5528f508e"` //申请人ID
	ApplierName      string `json:"applier_name" binding:"required"`                                              //申请人名称
	ApplierTime      int64  `json:"apply_time" binding:"required"`                                                //申请时间
}

//endregion

// region GetAttachmentList

type GetAttachmentListReq struct {
	request.KeywordInfo
	request.PageBaseInfo
}

type GetAttachmentListRes struct {
	Entries    []*AttachmentInfo `json:"entries" binding:"required"`     // 对象列表
	TotalCount int64             `json:"total_count" binding:"required"` // 当前筛选条件下的对象数量
}
type AttachmentInfo struct {
	ID           string `json:"id" binding:"required"`              // 文件id
	Name         string `json:"name" binding:"required"`            // 文件名称
	Type         string `json:"type" binding:"omitempty"`           // 文件类型
	Size         int64  `json:"size" binding:"omitempty"`           // 文件大小
	PreviewOssID string `json:"preview_oss_id" binding:"omitempty"` // 预览pdf的对象存储ID，没有数据时后台没转好需前端按钮变灰
	OssID        string `json:"oss_id" binding:"omitempty"`
	CreatedAt    int64  `json:"created_at" binding:"required"` // 创建时间
}

//endregion

// region PreviewPdf

type PreviewPdfReq struct {
	ID        string `form:"id"  binding:"required"  example:"12"`            //文件id
	PreviewID string `form:"preview_id"  binding:"required"  example:"12222"` //文件预览对象存储id
}

type PreviewPdfRes struct {
	ID        string `json:"id"  binding:"required"  example:"12"`                                      //文件id
	PreviewID string `json:"preview_id"  binding:"required"  example:"12222"`                           //文件预览对象存储id
	HrefUrl   string `json:"href_url"  binding:"required"  example:"http://xxx.xxx.xxx/ddd/sss?ss.pdf"` //预览链接地址
}

//endregion

// region UploadAttachment

type FileInfo struct {
	OssID string `json:"oss_id" binding:"required"` // 对象存储ID
	Name  string `json:"name" binding:"required"`   // 附件名称
}

type UploadAttachmentRes struct {
	FileSuccess []*FileInfo `json:"file_success" binding:"required"` // 成功添加的附件信息
	FileFailed  []string    `json:"file_failed" binding:"required"`  // 添加失败的附件名称
}

//endregion
