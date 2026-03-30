package info_resource_catalog

import (
	"context"

	"github.com/biocrosscoder/flex/typed/collections/arraylist"
	"github.com/biocrosscoder/flex/typed/collections/dict"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

// [信息资源编目资源库定义]
type InfoResourceCatalogRepo interface {
	// 事务处理
	HandleDbTx(ctx context.Context, operation func(*gorm.DB) error) (err error)
	// 创建信息资源目录
	Create(ctx context.Context, catalog *InfoResourceCatalog) (err error)
	// 更新信息资源目录
	Update(ctx context.Context, catalog *InfoResourceCatalog) (err error)
	// 插入或更新信息资源目录变更版本
	UpsertAlterVersion(tx *gorm.DB, isAlterExisted bool, catalog *InfoResourceCatalog) error
	// 批量更新信息资源目录
	BatchUpdateBy(ctx context.Context, by []*SearchParamItem, updates map[string]any) (err error)
	// 修改信息资源目录
	Modify(ctx context.Context, catalog *InfoResourceCatalog, fields []string) (err error)
	// 删除指定信息资源目录
	DeleteByID(ctx context.Context, id int64) (err error)
	// 删除指定信息资源目录(变更恢复删除变更版本)
	DeleteForAlterRecover(tx *gorm.DB, ctx context.Context, id int64) (err error)
	// 信息资源目录批量更新
	BatchUpdate(tx *gorm.DB, catalogs []*InfoResourceCatalog) (err error)
	// 信息资源目录批量更新（审核用防止审核意见被覆盖）
	BatchUpdateForAudit(tx *gorm.DB, catalogs []*InfoResourceCatalog) (err error)
	// 信息资源目录变更完成
	AlterComplete(tx *gorm.DB, catalog *InfoResourceCatalog) error
	// 查询信息资源目录计数
	CountBy(ctx context.Context, categoryNodeIDs []string, categoryID string, in, equals, likes, between []*SearchParamItem) (counts int, err error)

	CountByMultiCateFilter(ctx context.Context, cateIDNodeIDs map[string][]string, in, equals, likes, between []*SearchParamItem) (counts int, err error)
	// 查询未分类信息资源目录计数
	CountUnallocatedBy(ctx context.Context, categoryID string, in, equals, likes, between []*SearchParamItem) (counts int, err error)
	// 查询信息资源目录
	ListBy(ctx context.Context, categoryNodeIDs []string, categoryID string, in, equals, likes, between []*SearchParamItem, orderBy []*OrderParamItem, offset, limit int) (records []*InfoResourceCatalog, err error)

	ListByMultiCateFilter(ctx context.Context, cateIDNodeIDs map[string][]string, in, equals, likes, between []*SearchParamItem, orderBy []*OrderParamItem, offset, limit int) (records []*InfoResourceCatalog, err error)

	// 查询未分类信息资源目录
	ListUnallocatedBy(ctx context.Context, categoryID string, in, equals, likes, between []*SearchParamItem, orderBy []*OrderParamItem, offset, limit int) (records []*InfoResourceCatalog, err error)
	// 查询未编目业务表
	ListUncatalogedBusinessFormsBy(ctx context.Context, equals, likes []*SearchParamItem, orderBy []*OrderParamItem, offset, limit int) (records []*BusinessFormCopy, err error)
	// 查询未编目业务表计数
	CountUncatalogedBusinessForms(ctx context.Context, equals, likes []*SearchParamItem) (count int, err error)
	// 获取指定信息资源目录详情
	FindByID(ctx context.Context, id int64) (catalog *InfoResourceCatalog, err error)

	FindBaseInfoByID(ctx context.Context, id int64) (catalog *InfoResourceCatalog, err error)
	// 获取指定信息资源目录详情（变更专用，需要获取信息项）
	FindByIDForAlter(ctx context.Context, id int64) (catalog *InfoResourceCatalog, err error)
	// 查询信息资源目录关联项
	ListRelatedItemsBy(ctx context.Context, equals []*SearchParamItem, offset, limit int) (records []*InfoResourceCatalogRelatedItemPO, err error)
	// 查询信息资源目录关联项计数
	CountRelatedItemsBy(ctx context.Context, equals []*SearchParamItem) (count int, err error)
	// 查询信息项
	ListColumnsBy(ctx context.Context, equals, likes []*SearchParamItem, offset, limit int) (records []*InfoItem, err error)
	// 查询信息项计数
	CountColumnsBy(ctx context.Context, equals, likes []*SearchParamItem) (count int, err error)
	// 更新关联项名称
	UpdateRelatedItemNames(ctx context.Context, names map[InfoResourceCatalogRelatedItemRelationTypeEnum][]*BusinessEntity) (err error)
	// 获取信息资源目录来源信息
	GetSourceInfos(ctx context.Context, equals []*SearchParamItem) (records []*InfoResourceCatalog, err error)
	// 更新信息项关联信息
	UpdateColumnRelatedInfos(ctx context.Context, items map[ColumnRelatedInfoRelatedTypeEnum][]*BusinessEntity) (err error)
	// 获取信息资源目录关联类目节点
	GetRelatedCategoryNodes(ctx context.Context, equals []*SearchParamItem) (records dict.Dict[string, arraylist.ArrayList[*CategoryNode]], err error)
	// InfoResourceCatalogRepoV2  新版本的接口，旨在逐步替换原来的方法
	InfoResourceCatalogRepoV2
} // [/]

type InfoResourceCatalogRepoV2 interface {
	ListUnCatalogedBusinessFormsByV2(ctx context.Context, req *QueryUncatalogedBusinessFormsReq) (total int64, records []*model.TBusinessFormNotCataloged, err error)
	DeleteForms(ctx context.Context, formSliceID []string) error
	QueryFormByDomainID(ctx context.Context, domainIDSlice ...string) (ds []*model.TBusinessFormNotCataloged, err error)
}

// [搜索参数项] 多个项之间为与关系
type SearchParamItem struct {
	Keys     []string // 搜索字段，多个字段之间为或关系
	Values   []any    // 搜索值，多个值之间为或关系
	Exclude  bool     // 是否排除，默认为否；如果为是，则表示该字段查询条件取反
	Priority uint8    // 优先级，值越小优先级越高；用于优化SQL语句查询条件以充分利用索引，值相同时无先后顺序
} // [/]

// [排序方向枚举]
type OrderDirection string

const (
	AscendingOrder  OrderDirection = "asc"
	DescendingOrder OrderDirection = "desc"
) // [/]

// [排序参数字段]
type OrderParamItem struct {
	Field     string         // 排序字段
	Direction OrderDirection // 排序方向
} // [/]

// [信息项关联类型枚举]
type ColumnRelatedInfoRelatedTypeEnum int8

const (
	RelatedDataRefer ColumnRelatedInfoRelatedTypeEnum = iota
	RelatedCodeSet
) // [/]
