package data_resource_catalog

import (
	"context"
	"errors"
	"time"

	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type DataResourceCatalogRepo interface {
	Db() *gorm.DB
	Create(ctx context.Context, catalog *model.TDataCatalog) error
	Update(ctx context.Context, catalog *model.TDataCatalog, tx ...*gorm.DB) error
	UpdateApplyNum(ctx context.Context, catalogId uint64) error
	CreateTransaction(ctx context.Context, catalog *model.TDataCatalog, apiParams []*model.TApi, resource []*model.TDataResource, category []*model.TDataCatalogCategory, columns []*model.TDataCatalogColumn) error
	SaveTransaction(ctx context.Context, catalog *model.TDataCatalog, apiParams []*model.TApi, resource []*model.TDataResource, category []*model.TDataCatalogCategory, columns []*model.TDataCatalogColumn, openSSZD bool) error
	SaveDraftCopyTransaction(ctx context.Context, catalogID uint64, draftCatalog *model.TDataCatalog, apiParams []*model.TApi, dataResource []*model.TDataResource, category []*model.TDataCatalogCategory, columns []*model.TDataCatalogColumn, openSSZD bool) error
	CreateDraftCopyTransaction(ctx context.Context, catalogID uint64, catalog *model.TDataCatalog, apiParams []*model.TApi, resources []*model.TDataResource, category []*model.TDataCatalogCategory, columns []*model.TDataCatalogColumn, openSSZD bool) error
	GetCatalogList(ctx context.Context, req *domain.GetDataCatalogList) (totalCount int64, catalogs []*model.TDataCatalog, err error)
	Get(ctx context.Context, id uint64, tx ...*gorm.DB) (*model.TDataCatalog, error)
	GetByDraftId(ctx context.Context, draftId uint64, tx ...*gorm.DB) (catalog *model.TDataCatalog, err error)
	GetCategoryByCatalogId(ctx context.Context, catalogId uint64) (category []*model.TDataCatalogCategory, err error)
	GetCategoriesByCatalogIds(ctx context.Context, catalogIds []uint64) (categories []*model.TDataCatalogCategory, err error)
	DeleteTransaction(ctx context.Context, catalogId uint64) error
	CheckRepeat(ctx context.Context, catalogID uint64, name string) (bool, error)
	AuditApplyUpdate(ctx context.Context, catalog *model.TDataCatalog, tx ...*gorm.DB) error
	GetAllCatalog(ctx context.Context, req *domain.PushCatalogToEsReq) (catalogs []*model.TDataCatalog, err error)
	ListCatalogsByIDs(ctx context.Context, ids []uint64) (records []*model.TDataCatalog, err error)
	CreateAuditLog(ctx context.Context, auditLog []*model.AuditLog, tx ...*gorm.DB) error
	Count(ctx context.Context) (res *CatalogCountRes, err error)
	DepartmentCount(ctx context.Context) (res []*DepartmentCount, err error)
	AuditLogCount(ctx context.Context, req *AuditLogCountReq) (res []*AuditLogCountRes, err error)
	ModifyTransaction(ctx context.Context, catalog *model.TDataCatalog) error
	ModifyDC(ctx context.Context, catalog *model.TDataCatalog, tx *gorm.DB) error
	CreateDataCatalogApply(ctx context.Context, catalog *model.TDataCatalogApply) error
	GetCategoryByCatalogIdAndType(ctx context.Context, catalogId uint64, catalogType int32) (category []*model.TDataCatalogCategory, err error)
	GetPublishedList(ctx context.Context, publishStatus []string) (catalogs []*model.TDataCatalog, err error)
	SaveInterfaceApplyNum(ctx context.Context, svc *model.TDataInterfaceApply) error
	UpdateInterfaceApplyNum(ctx context.Context, interfaceId string, bizDate string) error
	GetInterfaceEntity(ctx context.Context, interfaceId string, bizDate string) (applyNum int32, err error)
	AggregateInterfaceApplyData(ctx context.Context) error
	GetInterfaceAggregateRank(ctx context.Context) (interfaces []*model.TDataInterfaceAggregate, err error)
	DataGetOverview(ctx context.Context, req *domain.DataGetOverviewReq) *domain.DataGetOverviewRes
	DataGetDepartmentDetail(ctx context.Context, req *domain.DataGetDepartmentDetailReq) (*domain.DataGetDepartmentDetailRes, []string)
	DataGetAggregationOverview(ctx context.Context, req *domain.DataGetDepartmentDetailReq) (res *domain.DataGetAggregationOverviewRes, err error)
	DataAssetsOverview(ctx context.Context, req *domain.DataAssetsOverviewReq) (res *domain.DataAssetsOverviewRes, err error)
	DataAssetsDetail(ctx context.Context, req *domain.DataAssetsDetailReq) (res *domain.DataAssetsDetailRes, err error)
	DataUnderstandOverview(ctx context.Context, req *domain.DataUnderstandOverviewReq) *domain.DataUnderstandOverviewRes
	DataUnderstandDepartTopOverview(ctx context.Context, req *domain.DataUnderstandDepartTopOverviewReq) (res []*domain.DataUnderstandDepartTopOverview, totalCount int64, err error)
	DataUnderstandDomainOverview(ctx context.Context, req *domain.DataUnderstandDomainOverviewReq) (res *domain.DataUnderstandDomainOverviewRes, err error)
	DataUnderstandTaskDetailOverview(ctx context.Context, req *domain.DataUnderstandTaskDetailOverviewReq) (res *domain.DataUnderstandTaskDetailOverviewRes, err error)
	DataUnderstandDepartDetailOverview(ctx context.Context, req *domain.DataUnderstandDepartDetailOverviewReq) (res []*domain.DataUnderstandDepartDetail, totalCount int64, err error)
	GetReportByViewIds(ctx context.Context, viewId ...string) (report []*Report, err error)
	GetApplyDepartmentNum(ctx context.Context, catalogIDS []uint64) (count []*GetApplyDepartmentNumRes, err error)
}

var NameRepeat = errors.New("catalog name repeat")
var DataResourceNotExist = errors.New("DataResourceNotExist")

type CatalogCountRes struct {
	CatalogCount          int64
	PublishedCatalogCount int64
	NotLineCatalogCount   int64
	OnLineCatalogCount    int64
	OffLineCatalogCount   int64

	PublishAuditingCatalogCount int64
	PublishPassCatalogCount     int64
	PublishRejectCatalogCount   int64

	OnlineAuditingCatalogCount int64
	OnlinePassCatalogCount     int64
	OnlineRejectCatalogCount   int64

	OfflineAuditingCatalogCount int64
	OfflinePassCatalogCount     int64
	OfflineRejectCatalogCount   int64

	UnconditionalShared int64 `json:"unconditional_shared"` //  无条件共享
	ConditionalShared   int64 `json:"conditional_shared"`   // 有条件共享
	NotShared           int64 `json:"not_shared"`           //不予共享

}

type AuditLogCountReq struct {
	Time          string    `json:"time"`
	CreatedAtTime string    `json:"created_at_time"`
	Start         time.Time `json:"-"`
	End           time.Time `json:"-"`
}

type DepartmentCount struct {
	DepartmentId string `json:"department_id"`
	Count        int    `json:"count"`
}
type AuditLogCountRes struct {
	AuditType         string `json:"audit_type"`
	AuditState        int    `json:"audit_state"`
	AuditResourceType int    `json:"audit_resource_type"`
	Dive              string `json:"dive"`
	Count             int    `json:"count"`
}

type Report struct {
	ID                   uint64     `gorm:"column:f_id;primaryKey;comment:主键id" json:"id"`                               // 主键id
	Code                 *string    `gorm:"column:f_code;comment:探查报告编号" json:"code"`                                    // 探查报告编号
	TaskID               uint64     `gorm:"column:f_task_id;not null;comment:任务配置记录id" json:"task_id"`                   // 任务配置记录id
	TaskVersion          *int32     `gorm:"column:f_task_version;comment:任务配置版本" json:"task_version"`                    // 任务配置版本
	QueryParams          *string    `gorm:"column:f_query_params;comment:探查任务请求参数，json格式字符串" json:"query_params"`        // 探查任务请求参数，json格式字符串
	ExploreType          *int32     `gorm:"column:f_explore_type;comment:探查类型" json:"explore_type"`                      // 探查类型
	Table                *string    `gorm:"column:f_table;comment:表名" json:"table"`                                      // 表名
	TableID              *string    `gorm:"column:f_table_id;comment:表id" json:"table_id"`                               // 表id
	Schema               *string    `gorm:"column:f_schema;comment:库名" json:"schema"`                                    // 库名
	VeCatalog            *string    `gorm:"column:f_ve_catalog;comment:虚拟化引擎数据源编目" json:"ve_catalog"`                    // 虚拟化引擎数据源编目
	TotalSample          *int32     `gorm:"column:f_total_sample;comment:探查样本数量" json:"total_sample"`                    // 探查样本数量
	TotalNum             *int32     `gorm:"column:f_total_num;comment:探查表总行数" json:"total_num"`                          // 探查表总行数
	TotalScore           *float64   `gorm:"column:f_total_score;comment:探查分数" json:"total_score"`                        // 探查分数
	Result               *string    `gorm:"column:f_result;comment:探查结果" json:"result"`                                  // 探查结果
	Status               *int32     `gorm:"column:f_status;comment:报告状态" json:"status"`                                  // 报告状态
	Latest               int32      `gorm:"column:f_latest;not null;comment:最近一次探查结果" json:"latest"`                     // 最近一次探查结果
	CreatedAt            *time.Time `gorm:"column:f_created_at;comment:创建时间" json:"created_at"`                          // 创建时间
	CreatedByUID         *string    `gorm:"column:f_created_by_uid;comment:创建人" json:"created_by_uid"`                   // 创建人
	CreatedByUname       *string    `gorm:"column:f_created_by_uname;comment:创建人中文名" json:"created_by_uname"`            // 创建人中文名
	FinishedAt           *time.Time `gorm:"column:f_finished_at;comment:完成时间" json:"finished_at"`                        // 完成时间
	Reason               *string    `gorm:"column:f_reason;comment:探查异常说明" json:"reason"`                                // 探查异常说明
	DvTaskID             *string    `gorm:"column:f_dv_task_id;comment:data-view任务id" json:"dv_task_id"`                 // data-view任务id
	TotalCompleteness    *float64   `gorm:"column:f_total_completeness;comment:完整性总分" json:"f_total_completeness"`       // 完整性总分
	TotalStandardization *float64   `gorm:"column:f_total_standardization;comment:规范性总分" json:"f_total_standardization"` // 规范性总分
	TotalUniqueness      *float64   `gorm:"column:f_total_uniqueness;comment:唯一性总分" json:"f_total_uniqueness"`           // 唯一性总分
	TotalAccuracy        *float64   `gorm:"column:f_total_accuracy;comment:准确性总分" json:"f_total_accuracy"`               // 准确性总分
	TotalConsistency     *float64   `gorm:"column:f_total_consistency;comment:一致性总分" json:"f_total_consistency"`         // 一致性总分
}

type GetApplyDepartmentNumRes struct {
	ID    uint64 `json:"id"`
	Count int64  `json:"count"`
}
