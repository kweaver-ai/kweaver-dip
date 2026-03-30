package info_resource_catalog

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/info_resource_catalog_statistic"
)

// [信息资源编目领域服务定义]
type InfoResourceCatalogDomain interface {
	// 创建信息资源目录
	CreateInfoResourceCatalog(ctx context.Context, req *CreateInfoResourceCatalogReq) (res *CreateInfoResourceCatalogRes, err error)
	// 更新信息资源目录
	UpdateInfoResourceCatalog(ctx context.Context, req *UpdateInfoResourceCatalogReq) (res *UpdateInfoResourceCatalogRes, err error)
	// 修改信息资源目录
	ModifyInfoResourceCatalog(ctx context.Context, req *ModifyInfoResourceCatalogReq) (err error)
	// 删除信息资源目录
	DeleteInfoResourceCatalog(ctx context.Context, req *DeleteInfoResourceCatalogReq) (err error)
	// 变更信息资源目录
	AlterInfoResourceCatalog(ctx context.Context, req *AlterInfoResourceCatalogReq) (res *AlterInfoResourceCatalogRes, err error)
	// 变更信息资源目录
	AlterAuditCancel(ctx context.Context, req *IDParamV1) (err error)
	// 变更恢复
	AlterRecover(ctx context.Context, req *AlterDelReq) (err error)
	// 获取冲突项
	GetConflictItems(ctx context.Context, req *GetConflictItemsReq) (res GetConflictItemsRes, err error)
	// 获取信息资源目录自动关联信息类
	GetAutoRelatedInfoClasses(ctx context.Context, req *GetInfoResourceCatalogAutoRelatedInfoClassesReq) (res GetInfoResourceCatalogAutoRelatedInfoClassesRes, err error)
	// 通过业务表查询已经发布的目录
	GetCatalogByStandardForms(ctx context.Context, req *GetCatalogByStandardForm) (res GetCatalogByStandardFormResp, err error)
	// 查询未编目业务表
	QueryUncatalogedBusinessForms(ctx context.Context, req *QueryUncatalogedBusinessFormsReq) (res *QueryUncatalogedBusinessFormsRes, err error)
	// 查询信息资源目录编目列表
	QueryCatalogingList(ctx context.Context, req *QueryInfoResourceCatalogCatalogingListReq) (res *QueryInfoResourceCatalogCatalogingListRes, err error)
	// 查询信息资源目录审核列表
	QueryAuditList(ctx context.Context, req *QueryInfoResourceCatalogAuditListReq) (res *QueryInfoResourceCatalogAuditListRes, err error)
	// 用户搜索信息资源目录
	SearchInfoResourceCatalogsByUser(ctx context.Context, req *SearchInfoResourceCatalogsByUserReq) (res *SearchInfoResourceCatalogsByUserRes, err error)
	// 运营搜索信息资源目录
	SearchInfoResourceCatalogsByAdmin(ctx context.Context, req *SearchInfoResourceCatalogsByAdminReq) (res *SearchInfoResourceCatalogsByAdminRes, err error)
	// 获取信息资源目录卡片基本信息
	GetInfoResourceCatalogCardBaseInfo(ctx context.Context, req *GetInfoResourceCatalogCardBaseInfoReq) (res *GetInfoResourceCatalogCardBaseInfoRes, err error)
	// 获取信息资源目录关联数据资源目录
	GetRelatedDataResourceCatalogs(ctx context.Context, req *GetInfoResourceCatalogRelatedDataResourceCatalogsReq) (res *GetInfoResourceCatalogRelatedDataResourceCatalogsRes, err error)
	// 用户获取信息资源目录详情
	GetInfoResourceCatalogDetailByUser(ctx context.Context, req *GetInfoResourceCatalogDetailReq) (res *GetInfoResourceCatalogDetailByUserRes, err error)
	// 运营获取信息资源目录详情
	GetInfoResourceCatalogDetailByAdmin(ctx context.Context, req *GetInfoResourceCatalogDetailReq) (res *GetInfoResourceCatalogDetailByAdminRes, err error)
	// 查询信息项
	QueryInfoItems(ctx context.Context, req *GetInfoResourceCatalogColumnsReq) (res *GetInfoResourceCatalogColumnsRes, err error)
	// 查询信息资源目录统计信息
	QueryInfoResourceCatalogStatistics(ctx context.Context, req *StatisticsParam) (res *StatisticsResp, err error)

	infoResourceCatalogDomain

	GetCatalogStatistics(ctx context.Context) (*CatalogStatistics, error)
	GetBusinessFormStatistics(ctx context.Context) (*BusinessFormStatistics, error)
	GetDeptCatalogStatistics(ctx context.Context) (*DeptCatalogStatistics, error)
	GetShareStatistics(ctx context.Context) (*ShareStatistics, error)
} // [/]

type infoResourceCatalogDomain interface {
	QueryUnCatalogedBusinessFormsV2(ctx context.Context, req *QueryUncatalogedBusinessFormsReq) (res *QueryUncatalogedBusinessFormsRes, err error)
}

type CatalogStatistics struct {
	TotalNum       int               `json:"total_num"`       // 目录总数
	UnpublishNum   int               `json:"unpublish_num"`   // 未发布目录数
	PublishedNum   int               `json:"published_num"`   // 已发布目录数
	NotonlineNum   int               `json:"notonline_num"`   // 未上线目录数
	OnlineNum      int               `json:"online_num"`      // 已上线目录数
	OfflineNum     int               `json:"offline_num"`     // 已下线目录数
	AuditStatistic []*AuditStatistic `json:"audit_statistic"` // 审核统计数组
}

type AuditStatistic struct {
	AuditType   string `json:"audit_type"`   // 审核类型 publish 发布审核 online 上线审核 offline 下线审核
	AuditingNum int    `json:"auditing_num"` // 审核中目录数
	PassNum     int    `json:"pass_num"`     // 审核通过目录数
	RejectNum   int    `json:"reject_num"`   // 审核驳回目录数
}

type BusinessFormStatistics struct {
	TotalNum       int                            `json:"total_num"`       // （已发布）业务标准表总数
	UncatalogedNum int                            `json:"uncataloged_num"` // 未编目（已发布）业务标准表数
	PublishNum     int                            `json:"publish_num"`     // 已发布目录数
	Rate           string                         `json:"rate,omitempty"`  // 编目完成率
	DeptStatistic  []*BusinessFormStatisticsEntry `json:"dept_statistic"`  // 部门业务标准表编目统计数组
}

type BusinessFormStatisticsEntry struct {
	*info_resource_catalog_statistic.BusinessFormStatistics
	DepartmentName string `json:"department_name"` // 所属部门名称
	DepartmentPath string `json:"department_path"` // 所属部门路径
}

type DeptCatalogStatistics struct {
	DeptStatistic []*DeptCatalogStatisticsEntry `json:"dept_statistic"` // 部门提供目录统计数组
}

type DeptCatalogStatisticsEntry struct {
	*info_resource_catalog_statistic.DeptCatalogStatistics
	DepartmentName string `json:"department_name"` // 所属部门名称
	DepartmentPath string `json:"department_path"` // 所属部门路径
}

type ShareStatistics struct {
	TotalNum        int                                              `json:"total_num"`       // 已发布目录总数
	ShareStatistics *info_resource_catalog_statistic.ShareStatistics `json:"share_statistic"` // 目录共享统计
}
