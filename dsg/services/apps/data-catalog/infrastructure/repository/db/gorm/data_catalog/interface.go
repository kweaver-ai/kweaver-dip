package data_catalog

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/middleware"
	"gorm.io/gorm"
)

type BusinessObjectListItem struct {
	ID          uint64     `json:"id,string"`             // 业务对象id
	Code        string     `json:"-"`                     // 业务对象编码
	Name        string     `json:"name"`                  // 业务对象名称
	Description string     `json:"description,omitempty"` // 业务对象描述
	SystemID    string     `json:"system_id"`             // 业务系统ID
	SystemName  string     `json:"system_name"`           // 业务系统名称
	Orgcode     string     `json:"orgcode"`               // 数源单位ID
	Orgname     string     `json:"orgname"`               // 数源单位名称
	UpdatedAt   *util.Time `json:"updated_at"`            // 数据更新时间
	ApplyNum    int        `json:"apply_num,omitempty"`   // 申请数量
	PreviewNum  int        `json:"preview_num,omitempty"` // 预览数量
	OwnerID     string     `json:"owner_id"`              // owner ID
	OwnerName   string     `json:"owner_name"`            // owner名称
}
type ComprehensionCatalogListItem struct {
	model.TDataCatalog
	OrgPaths                []string   `json:"-"` //编目的部门路径数组
	ComprehensionUpdateTime *util.Time `gorm:"column:comprehension_update_time" json:"comprehension_update_time"`
	ComprehensionStatus     int8       `gorm:"column:comprehension_status" json:"comprehension_status"`
}

type RepoOp interface {
	Get(tx *gorm.DB, ctx context.Context, id uint64) (*model.TDataCatalog, error)
	Insert(tx *gorm.DB, ctx context.Context, catalog *model.TDataCatalog) error
	DeleteIntoHistory(tx *gorm.DB, ctx context.Context, catalogID uint64, uInfo *middleware.User) (bool, error)
	Update(tx *gorm.DB, ctx context.Context, catalog *model.TDataCatalog) (bool, error)
	GetComprehensionCatalogList(tx *gorm.DB, ctx context.Context, page *request.PageInfo, comprehensionState []int8, catalogIds []uint64,
		req *request.CatalogListReqBase, orgcodes, catagoryIDs, businessDomainIDs []string, excludeCatalogIds []uint64) ([]*ComprehensionCatalogListItem, int64, error)
	GetList(tx *gorm.DB, ctx context.Context, page *request.PageInfo, catalogIds []uint64,
		req *request.CatalogListReqBase, orgcodes, catagoryIDs, businessDomainIDs []string, excludeCatalogIds []uint64) ([]*ComprehensionCatalogListItem, int64, error)
	GetDetail(tx *gorm.DB, ctx context.Context, id uint64, orgcodes []string) (*model.TDataCatalog, error)
	GetDetailByIds(tx *gorm.DB, ctx context.Context, orgcodes []string, ids ...uint64) ([]*model.TDataCatalog, error)
	GetDetailWithComprehensionByIds(tx *gorm.DB, ctx context.Context, ids ...uint64) (datas []*ComprehensionCatalogListItem, err error)
	TitleValidCheck(tx *gorm.DB, ctx context.Context, code string, title string) (bool, error)
	GetEXUnindexList(tx *gorm.DB, ctx context.Context) ([]*model.TDataCatalog /*, []*model.TDataCatalog*/, error)
	UpdateIndexFlag(tx *gorm.DB, ctx context.Context, catalogID uint64, updatedAt *util.Time) (bool, error)
	// UpdateHistoryIndexFlag(tx *gorm.DB, ctx context.Context, catalogID uint64) (bool, error)
	GetBusinessObjectList(tx *gorm.DB, ctx context.Context, page *request.BOPageInfo,
		req *request.BusinessObjectListReqBase, businessDomainIDs []string, orgCodes []string) ([]*BusinessObjectListItem, int64, error)
	GetOnlineBusinessObjectList(tx *gorm.DB, ctx context.Context) ([]*model.TDataCatalog, int64, error)
	AuditResultUpdate(tx *gorm.DB, ctx context.Context, auditType string, catalogID, auditApplySN uint64, alterInfo map[string]interface{}) (bool, error)
	AuditApplyUpdate(tx *gorm.DB, ctx context.Context, catalogID uint64, flowType int, alterInfo map[string]interface{}) (bool, error)
	GetCatalogIDByCode(tx *gorm.DB, ctx context.Context, code []string) ([]*model.TDataCatalog, error)
	GetByCodes(tx *gorm.DB, ctx context.Context, code []string) ([]*model.TDataCatalog, error)
	//GetTopList(tx *gorm.DB, ctx context.Context, topNum int, dimension string) ([]*BusinessObjectListItem, error)
	GetOfflineWaitProcList(tx *gorm.DB, ctx context.Context) ([]string, error)
	CancelFlagUpdate(tx *gorm.DB, ctx context.Context, code string, alterInfo map[string]interface{}) (bool, error)
	UpdateAuditStateByProcDefKey(tx *gorm.DB, ctx context.Context, auditType string, procDefKeys []string) (bool, error)
	GetDetailByCode(tx *gorm.DB, ctx context.Context, code string) (*model.TDataCatalog, error)
	GetListByOrgCode(tx *gorm.DB, ctx context.Context, orgCode string) ([]*model.TDataCatalog, error)
	//CreateCatalog(tx *gorm.DB, ctx context.Context, code string) (*model.TDataCatalog, error)
}
