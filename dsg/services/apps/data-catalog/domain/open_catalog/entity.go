package open_catalog

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource_catalog"
)

type OpenCatalogDomain interface {
	GetOpenableCatalogList(ctx context.Context, req *GetOpenableCatalogListReq) (*DataCatalogRes, error)
	CreateOpenCatalog(ctx context.Context, req *CreateOpenCatalogReq) (resp *CreateOpenCatalogRes, err error)
	GetOpenCatalogList(ctx context.Context, req *GetOpenCatalogListReq) (*OpenCatalogRes, error)
	GetOpenCatalogDetail(ctx context.Context, ID uint64) (*OpenCatalogDetailRes, error)
	UpdateOpenCatalog(ctx context.Context, ID uint64, req *UpdateOpenCatalogReqBody) (resp *IDResp, err error)
	DeleteOpenCatalog(ctx context.Context, ID uint64) error
	CancelAudit(ctx context.Context, ID uint64) (resp *IDResp, err error)
	GetAuditList(ctx context.Context, req *GetAuditListReq) (resp *AuditListRes, err error)
	GetOverview(ctx context.Context) (resp *GetOverviewRes, err error)
}

type CatalogIDOmitempty struct {
	CatalogIDOmitempty models.ModelID `json:"catalog_id" form:"catalog_id" uri:"catalog_id" binding:"omitempty,VerifyModelID" example:"539255713394882848"` // 目录ID
}
type CatalogIDRequired struct {
	CatalogID models.ModelID `json:"catalog_id" form:"catalog_id" uri:"catalog_id" binding:"required,VerifyModelID" example:"539255713394882848"` // 目录ID
}
type CatalogIDsRequired struct {
	CatalogIDs []models.ModelID `json:"catalog_ids" form:"catalog_ids" uri:"catalog_ids" binding:"required"` // 目录ID列表
}
type IDRequired struct {
	ID models.ModelID `json:"id" form:"id" uri:"id" binding:"required,VerifyModelID" example:"539255713394882848"` // 目录ID
}

type IDResp struct {
	ID string `json:"id"` // 资源对象ID
}

// region GetOpenableCatalogList

type CatalogPageInfo struct {
	request.PageBaseInfo
	request.KeywordInfo
	Direction *string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc" example:"desc"`                           // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      *string `json:"sort" form:"sort,default=created_at" binding:"omitempty,oneof=created_at updated_at name" default:"created_at" example:"created_at"` // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序。默认按创建时间排序
}
type GetOpenableCatalogListReq struct {
	CatalogPageInfo
	SourceDepartmentID string   `json:"source_department_id" form:"source_department_id" binding:"omitempty,uuid" example:"c9e795a5-324b-4986-9403-51c5528f508e"` // 数据来源部门id
	SubDepartmentIDs   []string `json:"-"`                                                                                                                        // 数据来源部门的子部门id
	OpenType           int8     `json:"open_type" form:"open_type" binding:"omitempty,oneof=1 2"`                                                                 // 开放属性 1 无条件开 2 有条件开
	OpenCondition      string   `json:"open_condition" form:"open_condition" binding:"omitempty,VerifyDescription,max=255"  example:""`                           // 开放条件
}
type DataCatalogRes struct {
	Entries    []*DataCatalog `json:"entries" binding:"required"`     // 对象列表
	TotalCount int64          `json:"total_count" binding:"required"` // 当前筛选条件下的对象数量
}
type DataCatalog struct {
	ID   string `json:"id" binding:"required"`   // 目录id
	Name string `json:"name" binding:"required"` // 目录名称
	Code string `json:"code" binding:"required"` // 目录编码
}

//endregion

// region CreateOpenCatalog

type CreateOpenCatalogReq struct {
	CatalogIDsRequired      //目录ID列表
	OpenType           int8 `json:"open_type" binding:"required,oneof=1 2" default:"1" example:"1"` // 开放方式 1 无条件开放 2 有条件开放
	OpenLevel          int8 `json:"open_level" binding:"omitempty,oneof=1 2" default:"0"`           // 开放级别 1 实名认证开放 2 审核开放
}
type CreateOpenCatalogRes struct {
	Success []*CatalogInfo `json:"success_catalog" binding:"required"` // 成功添加的开放目录信息
	Failed  []*CatalogInfo `json:"failed_catalog" binding:"required"`  // 添加失败的数据目录信息
}
type CatalogInfo struct {
	Id   string `json:"id" binding:"required"`    // 目录id
	Name string `json:"name" binding:"omitempty"` // 目录名称
}

//endregion

// region GetOpenCatalogList

type GetOpenCatalogListReq struct {
	CatalogPageInfo
	UpdatedAtStart     int64    `json:"updated_at_start" form:"updated_at_start" binding:"omitempty,gt=0"`                                                        //编辑开始时间
	UpdatedAtEnd       int64    `json:"updated_at_end" form:"updated_at_end" binding:"omitempty,gt=0"`                                                            //编辑结束时间
	SourceDepartmentID string   `json:"source_department_id" form:"source_department_id" binding:"omitempty,uuid" example:"c9e795a5-324b-4986-9403-51c5528f508e"` // 数据来源部门id
	SubDepartmentIDs   []string `json:"-"`                                                                                                                        // 部门的子部门id
	OpenType           int8     `json:"open_type" form:"open_type" binding:"omitempty,oneof=1 2" default:"1" example:"1"`                                         // 开放方式 1 无条件开放 2 有条件开放
	OpenLevel          int8     `json:"open_level" form:"open_level" binding:"omitempty,oneof=1 2" default:"0"`                                                   // 开放级别 1 实名认证开放 2 审核开放
}
type OpenCatalogVo struct {
	ID                 uint64    `json:"id" gorm:"column:id"`                                     // id
	CatalogID          uint64    `json:"catalog_id" gorm:"column:catalog_id"`                     // 数据目录id
	Title              string    `json:"title" gorm:"column:title"`                               // 目录名称
	Code               string    `json:"code" gorm:"column:code"`                                 // 编码
	OpenStatus         string    `json:"open_status" gorm:"column:open_status"`                   // 开放状态 未开放 notOpen、已开放 opened
	OnlineStatus       string    `json:"online_status" gorm:"column:online_status"`               // 上线状态
	ViewCount          int       `gorm:"column:view_count;not null" json:"view_count"`            // 挂接逻辑视图数量
	ApiCount           int       `gorm:"column:api_count;not null" json:"api_count"`              // 挂接接口数量
	FileCount          int       `gorm:"column:file_count;not null" json:"file_count"`            // 挂接文件资源数量
	SourceDepartmentId string    `json:"source_department_id" gorm:"column:source_department_id"` // 数据来源部门
	UpdatedAt          time.Time `json:"updated_at" gorm:"column:updated_at"`                     // 目录更新时间
	AuditState         int8      `json:"audit_state" gorm:"column:audit_state"`                   // 审核状态，0 未审核  1 审核中  2 通过  3 驳回  4 未完成
	AuditAdvice        string    `json:"audit_advice" gorm:"column:audit_advice"`                 // 审核意见，仅驳回时有用

}
type OpenCatalogRes struct {
	Entries    []*OpenCatalog `json:"entries" binding:"required"`     // 对象列表
	TotalCount int64          `json:"total_count" binding:"required"` // 当前筛选条件下的对象数量
}
type OpenCatalog struct {
	ID           string `json:"id" binding:"required"`            // 开放目录id
	CatalogID    string `json:"catalog_id" binding:"required"`    // 数据目录id
	Name         string `json:"name" binding:"required"`          // 目录名称
	Code         string `json:"code" binding:"required"`          // 编码
	OpenStatus   string `json:"open_status" binding:"required"`   // 开放状态 未开放 notOpen、已开放 opened
	OnlineStatus string `json:"online_status" binding:"required"` // 上线状态
	//ResourceType         int8   `json:"resource_type" binding:"required"`           // 资源类型 1逻辑视图 2 接口
	Resource             []*data_resource_catalog.Resource `json:"resource"`                                   // 挂载资源
	SourceDepartment     string                            `json:"source_department" binding:"omitempty"`      // 数据来源部门
	SourceDepartmentPath string                            `json:"source_department_path" binding:"omitempty"` // 数据来源部门路径
	UpdatedAt            int64                             `json:"updated_at" binding:"omitempty"`             // 目录更新时间
	AuditState           int8                              `json:"audit_state" binding:"required"`             // 审核状态，0 未审核  1 审核中  2 通过  3 驳回  4 未完成
	AuditAdvice          string                            `json:"audit_advice" binding:"omitempty"`           // 审核意见，仅驳回时有用

}

//endregion

// region GetOpenCatalogDetail

type OpenCatalogDetailRes struct {
	ID                 string `json:"id" binding:"required"`                                                                        // 开放目录id
	CatalogID          string `json:"catalog_id" binding:"required"`                                                                // 数据目录id
	Name               string `json:"name" binding:"required"`                                                                      // 数据资源目录名称
	Description        string `json:"description" binding:"omitempty"`                                                              // 数据资源目录描述
	Code               string `json:"code" binding:"required"`                                                                      // 目录编码
	OpenType           int8   `json:"open_type" binding:"required"`                                                                 // 开放方式 1 无条件开放 2 有条件开放
	OpenLevel          int8   `json:"open_level" binding:"required"`                                                                // 开放级别 1 实名认证开放 2 审核开放
	AdministrativeCode *int32 `json:"administrative_code" binding:"omitempty"`                                                      // 行政区划代码
	SourceDepartmentId string `json:"source_department_id" binding:"omitempty,uuid" example:"c9e795a5-324b-4986-9403-51c5528f508e"` // 数据资源来源部门id
	SourceDepartment   string `json:"source_department" binding:"omitempty"`                                                        // 数据资源来源部门
	UpdatedAt          int64  `json:"updated_at" binding:"omitempty"`                                                               // 编辑时间
	PublishAt          int64  `json:"publish_at" binding:"omitempty"`                                                               // 发布时间

}

//endregion

// region UpdateOpenCatalog

type UpdateOpenCatalogReqBody struct {
	OpenType  int8 `json:"open_type" binding:"required,oneof=1 2" default:"1" example:"1"` // 开放方式 1 无条件开放 2 有条件开放
	OpenLevel int8 `json:"open_level" binding:"omitempty,oneof=1 2" default:"0"`           // 开放级别 1 实名认证开放 2 审核开放
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
	ID           string `json:"id" binding:"required"`                                                        //流程实例ID
	ApplyCode    string `json:"apply_code" binding:"required"`                                                //审核code
	CatalogTitle string `json:"catalog_title" binding:"required"`                                             //目录标题
	CatalogID    string `json:"catalog_id" binding:"required"`                                                //目录ID
	CatalogCode  string `json:"catalog_code" binding:"required"`                                              //目录编码
	ApplierID    string `json:"applier_id" binding:"required" example:"c9e795a5-324b-4986-9403-51c5528f508e"` //申请人ID
	ApplierName  string `json:"applier_name" binding:"required"`                                              //申请人名称
	ApplierTime  int64  `json:"apply_time" binding:"required"`                                                //申请时间
}

//endregion

// region GetOverview

type GetOverviewRes struct {
	CatalogTotalCount      int64                     `json:"catalog_total_count" binding:"required"`      //开放目录总数量
	AuditingCatalogCount   int64                     `json:"auditing_catalog_count" binding:"required"`   //审核中的数量
	TypeCatalogCount       []*TypeCatalogCount       `json:"type_catalog_count" binding:"required"`       //资源类型开放目录数量
	NewOpenCatalogCount    []*NewOpenCatalogCount    `json:"new_catalog_count" binding:"required"`        //近一年开放目录新增数量(按月统计)
	DepartmentCatalogCount []*DepartmentCatalogCount `json:"department_catalog_count" binding:"required"` //部门提供目录数量TOP10
	CatalogThemeCount      []*CatalogThemeCount      `json:"catalog_theme_count" binding:"required"`      //开放目录主题数量
}
type TypeCatalogCount struct {
	Type       uint8   `json:"type" binding:"required"`       //资源类型
	Count      int64   `json:"count" binding:"required"`      //目录数量
	Proportion float64 `json:"proportion" binding:"required"` //比例
}
type NewOpenCatalogCount struct {
	Month string `json:"month" binding:"required"` //月份 格式：(年-月）
	Count int64  `json:"count" binding:"required"` //目录数量
}
type DepartmentCatalogCount struct {
	DepartmentId   string `json:"department_id" binding:"required"`   //部门id
	DepartmentName string `json:"department_name" binding:"required"` //部门名称
	Count          int64  `json:"count" binding:"required"`           //目录数量
}
type CatalogThemeCount struct {
	ThemeId    string  `json:"theme_id" binding:"required"`   //主题id
	ThemeName  string  `json:"theme_name" binding:"required"` //主题名称
	Count      int64   `json:"count" binding:"required"`      //目录数量
	Proportion float64 `json:"proportion" binding:"required"` //比例
}

//endregion
