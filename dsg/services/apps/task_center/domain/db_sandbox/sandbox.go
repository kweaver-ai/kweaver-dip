package db_sandbox

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type SandboxSpace interface {
	SandboxSpaceSimple(ctx context.Context, req *request.IDReq) (*model.DBSandbox, error)
	SandboxSpaceList(ctx context.Context, req *SandboxSpaceListReq) (*response.PageResultNew[SandboxSpaceListItem], error)
}

type SandboxSpaceListReq struct {
	SandboxAccessor
	request.KeywordInfo
	request.PageBaseInfo
	UpdateStartTime int64   `json:"update_start_time" form:"update_start_time" binding:"omitempty"`                                                        // 更新开始时间
	UpdateEndTime   int64   `json:"update_end_time" form:"update_end_time" binding:"omitempty"`                                                            // 更新结束时间
	Direction       *string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc" default:"desc" example:"desc"`                        // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort            *string `json:"sort" form:"sort,default=updated_at" binding:"oneof=updated_at project_name" default:"updated_at" example:"updated_at"` // 排序类型，枚举：updated_at project_name
}

type SandboxSpaceListItem struct {
	SandboxID          string    `gorm:"column:sandbox_id;not null" json:"sandbox_id"`                     // 沙箱ID
	ApplicantID        string    `gorm:"column:applicant_id" json:"applicant_id"`                          // 申请人ID
	ApplicantName      string    `gorm:"column:applicant_name" json:"applicant_name"`                      // 申请人名称
	ApplicantPhone     string    `gorm:"column:applicant_phone" json:"applicant_phone"`                    // 申请人手机号
	DepartmentID       string    `gorm:"column:department_id;not null" json:"department_id"`               // 所属部门ID
	DepartmentName     string    `gorm:"column:department_name;not null" json:"department_name"`           // 所属部门名称
	ProjectID          string    `gorm:"column:project_id;not null" json:"project_id"`                     // 项目ID
	ProjectName        string    `gorm:"column:project_name;not null" json:"project_name"`                 // 项目名称
	DatasourceID       string    `gorm:"column:datasource_id;not null" json:"datasource_id"`               // 数据源UUID
	DatasourceName     string    `gorm:"column:datasource_name;not null" json:"datasource_name"`           // 数据源名称,catalog
	DatasourceTypeName string    `gorm:"column:datasource_type_name;not null" json:"datasource_type_name"` // 数据库类型名称
	DatabaseName       string    `gorm:"column:database_name;not null" json:"database_name"`               // 数据库名称
	TotalSpace         int32     `gorm:"column:total_space" json:"total_space"`                            // 总的沙箱空间，单位GB
	UsedSpace          float64   `gorm:"-" json:"used_space"`                                              // 已用空间
	ValidStart         int64     `gorm:"column:valid_start" json:"valid_start"`                            // 有效期开始时间，单位毫秒
	ValidEnd           int64     `gorm:"column:valid_end" json:"valid_end"`                                // 有效期结束时间，单位毫秒
	DataSetNumber      int       `gorm:"-" json:"data_set_number"`                                         // 数据集数量
	RecentDataSet      string    `gorm:"column:recent_data_set"  json:"recent_data_set"`                   // 最近的一个数据及名称
	UpdatedAtObj       time.Time `gorm:"column:updated_at" json:"-"`                                       // 数据集更新时间
	UpdatedAtStr       string    `gorm:"-" json:"updated_at"`                                              // 数据集更新时间
}

type SandboxSpaceLogListReq struct {
	request.IDReq
	request.PageInfoWithKeyword
}

type SandboxDataSetInfo struct {
	SandboxID       string `json:"sandbox_id"`        // 沙箱ID
	TargetTableName string `json:"target_table_name"` // 最近推送的数据集名称
}
