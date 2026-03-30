package info_system

import (
	"context"
	"database/sql"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/request"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/info_system"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type Repo interface {
	ListByPaging(ctx context.Context, pageInfo *request.PageInfo, keyword string) ([]*model.InfoSystem, int64, error)
	ListByPagingNew(ctx context.Context, pageInfo *domain.QueryPageReqParam) (res []*model.InfoSystemObjectUser, total int64, err error)
	ListOrderByInfoStstemID(ctx context.Context, firstInfoStstemID uint64, limit int) ([]model.InfoSystem, error)
	GetByID(ctx context.Context, id string) (*model.InfoSystem, error)
	GetByIDs(ctx context.Context, ids []string) ([]*model.InfoSystem, error)
	GetByNames(ctx context.Context, names []string) ([]*model.InfoSystem, error)
	Insert(ctx context.Context, infoSystem *model.InfoSystem) error
	Inserts(ctx context.Context, infoSystem []*model.InfoSystem) error
	Update(ctx context.Context, infoSystem *model.InfoSystem) error
	Delete(ctx context.Context, infoSystem *model.InfoSystem) error
	NameExistCheck(ctx context.Context, name string, ids ...string) (bool, error)
	GetBusinessSystem(ctx context.Context) ([]*model.Object, error)
	DeleteBusinessSystem(ctx context.Context) error
	// 注册信息系统
	RegisterInfoSystem(ctx context.Context, infoSystem *model.InfoSystem, registers []*model.LiyueRegistration) error
	CheckSystemIdentifierRepeat(ctx context.Context, identifier, id string) (isRepeat bool, err error)
	GetAllByIDS(ctx context.Context, ids []string) ([]*InfoSystemRegister, error)
	GetAllByDepartmentId(ctx context.Context, departmentId string) ([]*model.InfoSystem, error)
}
type InfoSystemRegister struct {
	ID               string         `gorm:"column:id;not null" json:"id"`                         // 信息系统业务id
	Name             string         `gorm:"column:name;not null" json:"name"`                     // 信息系统名称
	Description      sql.NullString `gorm:"column:description" json:"description"`                // 信息系统描述
	DepartmentId     string         `gorm:"column:department_id" json:"department_id"`            // 信息系统部门ID
	DepartmentName   string         `gorm:"column:department_name" json:"department_name"`        // 部门名称
	DepartmentPath   string         `gorm:"column:department_path" json:"department_path"`        // 部门路径
	SystemIdentifier string         `gorm:"column:system_identifier" json:"system_identifier"`    // 系统标识·
	ResponsibleUID   string         `gorm:"column:responsible_uid" json:"responsible_uid"`        // 负责人ID
	RegisterAt       time.Time      `gorm:"column:register_at;not null" json:"register_at"`       // 注册时间
	CreatedAt        time.Time      `gorm:"column:created_at;not null" json:"created_at"`         // 创建时间
	CreatedByUID     string         `gorm:"column:created_by_uid;not null" json:"created_by_uid"` // 创建用户ID
	UpdatedAt        time.Time      `gorm:"column:updated_at;not null" json:"updated_at"`         // 更新时间
	UpdatedByUID     string         `gorm:"column:updated_by_uid;not null" json:"updated_by_uid"` // 更新用户ID

	//CreatedUserName string                `gorm:"column:created_user_name" json:"created_user_name"`      // 创建人名称
	UpdatedUserName string `gorm:"column:updated_user_name" json:"updated_user_name"` // 更新人名称
}
