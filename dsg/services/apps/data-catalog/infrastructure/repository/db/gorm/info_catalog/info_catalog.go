package info_catalog

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type InfoCatalogRepo struct {
	db *gorm.DB
}

func NewInfoCatalogRepo(db *gorm.DB) *InfoCatalogRepo {
	return &InfoCatalogRepo{db: db}
}

func (i *InfoCatalogRepo) GetByCatalogIds(ctx context.Context, IDS []uint64) (infoCatalogs []*model.TInfoResourceCatalog, err error) {
	err = i.db.WithContext(ctx).Where("f_id in ?", IDS).Find(&infoCatalogs).Error
	return
}

func (i *InfoCatalogRepo) GetCatalogWithByCatalogIds(ctx context.Context, IDS []uint64) (infoCatalogs []*model.InfoResourceCatalog, err error) {
	err = i.db.WithContext(ctx).Select("c.*,i.*").Table("t_info_resource_catalog c").
		Joins("inner join t_info_resource_catalog_source_info i on  c.f_id =i.f_id").
		Where("c.f_id in ?", IDS).Find(&infoCatalogs).Error
	return
}

func (i *InfoCatalogRepo) GetByCategoryCatalogId(ctx context.Context, id uint64) (infoCatalogsCategory []*model.TInfoResourceCatalogCategoryNode, err error) {
	err = i.db.WithContext(ctx).Where("f_info_resource_catalog_id = ?", id).Find(&infoCatalogsCategory).Error
	return
}
func (i *InfoCatalogRepo) GetColumnByCatalogId(ctx context.Context, id uint64) (infoCatalogsColumn []*model.TInfoResourceCatalogColumn, err error) {
	err = i.db.WithContext(ctx).Where("f_id = ?", id).Find(&infoCatalogsColumn).Error
	return
}

func (i *InfoCatalogRepo) GetColumnAllInfoByCatalogId(ctx context.Context, id uint64) (infoCatalogsColumn []*model.InfoResourceCatalogColumn, err error) {
	err = i.db.WithContext(ctx).Select("c.*,i.*").Table("t_info_resource_catalog_column c").
		Joins("inner join t_info_resource_catalog_column_related_info i on  c.f_id =i.f_id").
		Where("c.f_info_resource_catalog_id = ?", id).Find(&infoCatalogsColumn).Error
	return
}

func (i *InfoCatalogRepo) GetCatalogRelatedItemByCatalogId(ctx context.Context, id uint64) (infoCatalogRelatedItem []*model.TInfoResourceCatalogRelatedItem, err error) {
	err = i.db.WithContext(ctx).Where("f_info_resource_catalog_id = ?", id).Find(&infoCatalogRelatedItem).Error
	return
}

func (i *InfoCatalogRepo) GetTBusinessSceneByCatalogId(ctx context.Context, id uint64) (businessScene []*model.TBusinessScene, err error) {
	err = i.db.WithContext(ctx).Where("f_info_resource_catalog_id = ?", id).Find(&businessScene).Error
	return
}

func (i *InfoCatalogRepo) GetCategoryIdByCatalogId(ctx context.Context, id uint64) (category []*model.TInfoResourceCatalogCategoryNode, err error) {
	err = i.db.WithContext(ctx).Where("f_info_resource_catalog_id = ?", id).Find(&category).Error
	return
}

func (i *InfoCatalogRepo) GetCategoryByCatalogId(ctx context.Context, id uint64) (category []*model.CategoryNode, err error) {
	err = i.db.WithContext(ctx).Table("category_node_ext cn").
		Joins("inner join t_info_resource_catalog_category_node i on  i.f_category_node_id =cn.category_node_id").
		Where("i.f_info_resource_catalog_id = ?", id).Find(&category).Error
	return
}
