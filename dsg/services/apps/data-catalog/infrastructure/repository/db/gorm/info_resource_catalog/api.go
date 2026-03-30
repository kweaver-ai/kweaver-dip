package info_resource_catalog

import (
	"context"
	"fmt"
	"strconv"

	"github.com/biocrosscoder/flex/typed/collections/arraylist"
	"github.com/biocrosscoder/flex/typed/collections/dict"
	"github.com/biocrosscoder/flex/typed/collections/orderedcontainers"
	"github.com/biocrosscoder/flex/typed/functools"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"github.com/kweaver-ai/idrm-go-common/rest/business_grooming"
	"gorm.io/gorm"
)

// 创建信息资源目录
func (repo *infoResourceCatalogRepo) Create(ctx context.Context, catalog *domain.InfoResourceCatalog) error {
	return repo.handleDbTx(ctx, func(tx *gorm.DB) (err error) {
		// [向信息资源目录表插入记录]
		catalogPO, err := repo.buildInfoResourceCatalogPO(catalog)
		if err != nil {
			return
		}
		err = repo.insertInfoResourceCatalog(tx, catalogPO)
		if err != nil {
			return
		} // [/]
		// [向信息资源目录来源信息表插入记录]
		sourceInfoPO, err := repo.buildInfoResourceCatalogSourceInfoPO(catalog)
		if err != nil {
			return
		}
		err = repo.insertInfoResourceCatalogSourceInfo(tx, sourceInfoPO)
		if err != nil {
			return
		} // [/]
		// [从未编目业务表中删除来源业务表]
		err = repo.deleteBusinessFormNotCataloged(tx, sourceInfoPO.BusinessFormID)
		if err != nil {
			return
		} // [/]
		// [向信息资源目录关联项表插入记录]
		relatedItemPOs, err := repo.buildInfoResourceCatalogRelatedItemPOs(catalog)
		if err != nil {
			return
		}
		err = skipEmpty(tx, relatedItemPOs, repo.insertInfoResourceCatalogRelatedItems)
		if err != nil {
			return
		} // [/]
		// [向信息资源目录类目节点表插入记录]
		categoryNodePOs, err := repo.buildInfoResourceCatalogCategoryNodePOs(catalog)
		if err != nil {
			return
		}
		err = skipEmpty(tx, categoryNodePOs, repo.insertInfoResourceCatalogCategoryNodes)
		if err != nil {
			return
		} // [/]
		// [向业务场景表插入记录]
		businessScenePOs, err := repo.buildBusinessScenePOs(catalog)
		if err != nil {
			return
		}
		err = skipEmpty(tx, businessScenePOs, repo.insertInfoResourceCatalogBusinessScenes)
		if err != nil {
			return
		} // [/]
		// [向信息资源目录下属信息项表插入记录]
		columnPOs, err := repo.buildInfoResourceCatalogColumnPOs(catalog)
		if err != nil {
			return
		}
		err = skipEmpty(tx, columnPOs, repo.insertInfoResourceCatalogColumns)
		if err != nil {
			return
		} // [/]
		// [向信息资源目录信息项关联信息表插入记录]
		columnRelatedInfoPOs, err := repo.buildInfoResourceCatalogColumnRelatedInfoPOs(catalog)
		if err != nil {
			return
		}
		err = skipEmpty(tx, columnRelatedInfoPOs, repo.insertInfoResourceCatalogColumnRelatedInfos) // [/]
		return
	})
}

// 插入或更新信息资源目录变更版本
func (repo *infoResourceCatalogRepo) UpsertAlterVersion(tx *gorm.DB, isAlterExisted bool, catalog *domain.InfoResourceCatalog) error {
	// [更新/新增信息资源目录表记录]
	catalogPO, err := repo.buildInfoResourceCatalogPO(catalog)
	if err != nil {
		return err
	}

	if isAlterExisted {
		err = repo.updateInfoResourceCatalog(tx, catalogPO)
	} else {
		err = repo.insertInfoResourceCatalog(tx, catalogPO)
	}
	if err != nil {
		return err
	} // [/]

	catalogIDs := []int64{catalogPO.ID}
	// [删除信息资源目录关联项]
	err = repo.deleteInfoResourceCatalogRelatedItemsByCatalogIDs(tx, catalogIDs)
	if err != nil {
		return err
	} // [/]
	// [删除信息资源目录关联类目节点]
	err = repo.deleteInfoResourceCatalogCategoryNodesByCatalogIDs(tx, catalogIDs)
	if err != nil {
		return err
	} // [/]
	// [删除业务场景]
	err = repo.deleteBusinessScenesByCatalogIDs(tx, catalogIDs)
	if err != nil {
		return err
	} // [/]
	// [删除信息资源目录下属信息项]
	if err = repo.deleteInfoResourceCatalogColumnRelatedInfosByCatalogIDs(tx, catalogIDs); err != nil {
		return err
	}
	if err = repo.deleteInfoResourceCatalogColumnsByCatalogIDs(tx, catalogIDs); err != nil {
		return err
	}

	// [新增信息资源目录关联项]
	relatedItemsNew, err := repo.buildInfoResourceCatalogRelatedItemPOs(catalog)
	if err != nil {
		return err
	}
	err = skipEmpty(tx, relatedItemsNew, repo.insertInfoResourceCatalogRelatedItems)
	if err != nil {
		return err
	} // [/]
	// [新增信息资源目录类目节点]
	categoryNodesNew, err := repo.buildInfoResourceCatalogCategoryNodePOs(catalog)
	if err != nil {
		return err
	}
	err = skipEmpty(tx, categoryNodesNew, repo.insertInfoResourceCatalogCategoryNodes)
	if err != nil {
		return err
	} // [/]
	// [新增业务场景]
	businessScenesNew, err := repo.buildBusinessScenePOs(catalog)
	if err != nil {
		return err
	}
	err = skipEmpty(tx, businessScenesNew, repo.insertInfoResourceCatalogBusinessScenes)
	if err != nil {
		return err
	} // [/]
	// [新增信息项]
	infoResourceCatalogColumnsNew, err := repo.buildInfoResourceCatalogColumnPOs(catalog)
	if err != nil {
		return err
	}
	err = skipEmpty(tx, infoResourceCatalogColumnsNew, repo.insertInfoResourceCatalogColumns)
	if err != nil {
		return err
	} // [/]
	// [插入信息项关联信息]
	columnRelatedInfoNew, err := repo.buildInfoResourceCatalogColumnRelatedInfoPOs(catalog)
	if err != nil {
		return err
	}
	err = skipEmpty(tx, columnRelatedInfoNew, repo.insertInfoResourceCatalogColumnRelatedInfos) // [/]
	return err
}

// 更新信息资源目录
func (repo *infoResourceCatalogRepo) Update(ctx context.Context, catalog *domain.InfoResourceCatalog) error {
	return repo.handleDbTx(ctx, func(tx *gorm.DB) (err error) {
		// [更新信息资源目录表记录]
		catalogPO, err := repo.buildInfoResourceCatalogPO(catalog)
		if err != nil {
			return
		}
		err = repo.updateInfoResourceCatalog(tx, catalogPO)
		if err != nil {
			return
		} // [/]
		// [更新信息资源目录关联项]
		conditions := orderedcontainers.NewOrderedDict[string, []any]()
		conditions.Set(buildEqualParams([]*domain.SearchParamItem{
			{
				Keys:     []string{"f_info_resource_catalog_id"},
				Values:   []any{catalog.ID},
				Exclude:  false,
				Priority: 0,
			},
		}))
		where, values := buildWhereParams(conditions)
		relatedItemsOld, err := repo.queryInfoResourceCatalogRelatedItems(tx, where, 0, 0, values)
		if err != nil {
			return
		}
		relatedItemsNew, err := repo.buildInfoResourceCatalogRelatedItemPOs(catalog)
		if err != nil {
			return
		}
		relatedItemsToInsert, relatedItemsToUpdate, relatedItemsToDelete := diffRelatedItems(relatedItemsOld, relatedItemsNew)
		err = skipEmpty(tx, relatedItemsToDelete, repo.deleteInfoResourceCatalogRelatedItems)
		if err != nil {
			return
		}
		for _, item := range relatedItemsToUpdate {
			err = repo.updateInfoResourceCatalogRelatedItem(tx, item)
			if err != nil {
				return
			}
		}
		err = skipEmpty(tx, relatedItemsToInsert, repo.insertInfoResourceCatalogRelatedItems)
		if err != nil {
			return
		} // [/]
		// [更新信息资源目录类目节点]
		categoryNodesOld, err := repo.selectInfoResourceCatalogCategoryNodes(tx, catalogPO.ID)
		if err != nil {
			return
		}
		categoryNodesNew, err := repo.buildInfoResourceCatalogCategoryNodePOs(catalog)
		if err != nil {
			return
		}
		categoryNodesToInsert, _, categoryNodesToDelete := diff(categoryNodesOld, categoryNodesNew)
		err = skipEmpty(tx, categoryNodesToDelete, repo.deleteInfoResourceCatalogCategoryNodes)
		if err != nil {
			return
		}
		err = skipEmpty(tx, categoryNodesToInsert, repo.insertInfoResourceCatalogCategoryNodes)
		if err != nil {
			return
		} // [/]
		// [更新业务场景]
		err = repo.deleteBusinessScenes(tx, catalogPO.ID)
		if err != nil {
			return
		}
		businessScenesNew, err := repo.buildBusinessScenePOs(catalog)
		if err != nil {
			return
		}
		err = skipEmpty(tx, businessScenesNew, repo.insertInfoResourceCatalogBusinessScenes)
		if err != nil {
			return
		} // [/]
		// [比对新旧信息项差异]
		infoResourceCatalogColumnsOld, err := repo.selectInfoResourceCatalogColumns(tx, catalogPO.ID)
		if err != nil {
			return
		}
		infoResourceCatalogColumnsNew, err := repo.buildInfoResourceCatalogColumnPOs(catalog)
		if err != nil {
			return
		}
		infoResourceCatalogColumnsToInsert, infoResourceCatalogColumnsToUpdate, infoResourceCatalogColumnsToDelete := diff(infoResourceCatalogColumnsOld, infoResourceCatalogColumnsNew) // [/]
		// [删除信息项]
		err = skipEmpty(tx, infoResourceCatalogColumnsToDelete, repo.deleteInfoResourceCatalogColumns)
		if err != nil {
			return
		} // [/]
		// [更新信息项]
		for _, item := range infoResourceCatalogColumnsToUpdate {
			err = repo.updateInfoResourceCatalogColumn(tx, item)
			if err != nil {
				return
			}
		} // [/]
		// [新增信息项]
		err = skipEmpty(tx, infoResourceCatalogColumnsToInsert, repo.insertInfoResourceCatalogColumns)
		if err != nil {
			return
		} // [/]
		// [清空信息项关联信息]
		_, _, columnRelatedInfoOld := diff(infoResourceCatalogColumnsOld, nil)
		err = skipEmpty(tx, columnRelatedInfoOld, repo.deleteInfoResourceCatalogColumnRelatedInfos)
		if err != nil {
			return
		} // [/]
		// [插入信息项关联信息]
		columnRelatedInfoNew, err := repo.buildInfoResourceCatalogColumnRelatedInfoPOs(catalog)
		if err != nil {
			return
		}
		err = skipEmpty(tx, columnRelatedInfoNew, repo.insertInfoResourceCatalogColumnRelatedInfos) // [/]
		return
	})
}

// 修改信息资源目录
func (repo *infoResourceCatalogRepo) Modify(ctx context.Context, catalog *domain.InfoResourceCatalog, fields []string) error {
	return repo.handleDbTx(ctx, func(tx *gorm.DB) (err error) {
		po, err := repo.buildInfoResourceCatalogPO(catalog)
		if err != nil {
			return
		}
		err = repo.updateInfoResourceCatalogFields(tx, po, fields)
		return
	})
}

// 删除指定信息资源目录(变更恢复删除变更版本)
func (repo *infoResourceCatalogRepo) DeleteForAlterRecover(tx *gorm.DB, ctx context.Context, id int64) (err error) {
	// [删除信息资源目录表记录]
	err = repo.deleteInfoResourceCatalogForAlter(tx, id)
	if err != nil {
		return
	} // [/]

	catalogIDs := []int64{id}
	// [删除信息资源目录关联项]
	err = repo.deleteInfoResourceCatalogRelatedItemsByCatalogIDs(tx, catalogIDs)
	if err != nil {
		return err
	} // [/]
	// [删除信息资源目录关联类目节点]
	err = repo.deleteInfoResourceCatalogCategoryNodesByCatalogIDs(tx, catalogIDs)
	if err != nil {
		return err
	} // [/]
	// [删除业务场景]
	err = repo.deleteBusinessScenesByCatalogIDs(tx, catalogIDs)
	if err != nil {
		return err
	} // [/]
	// [删除信息资源目录下属信息项]
	if err = repo.deleteInfoResourceCatalogColumnRelatedInfosByCatalogIDs(tx, catalogIDs); err != nil {
		return err
	}
	if err = repo.deleteInfoResourceCatalogColumnsByCatalogIDs(tx, catalogIDs); err != nil {
		return err
	}
	return
}

// 删除指定信息资源目录
func (repo *infoResourceCatalogRepo) DeleteByID(ctx context.Context, id int64) error {
	return repo.handleDbTx(ctx, func(tx *gorm.DB) (err error) {
		// [删除信息资源目录表记录]
		err = repo.deleteInfoResourceCatalog(tx, id)
		if err != nil {
			return
		} // [/]
		// [查询信息资源目录来源信息]
		sourceInfo, err := repo.selectInfoResourceCatalogSourceInfoByID(tx, id)
		if err != nil {
			return
		} // [/]
		// [删除信息资源目录来源信息]
		err = repo.deleteInfoResourceCatalogSourceInfo(tx, id)
		if err != nil {
			return
		} // [/]
		// [查询新增业务表]
		bizForm, err := repo.bizGrooming.GetBusinessFormDetails(ctx, []string{sourceInfo.BusinessFormID}, []string{fmt.Sprintf("%d", business_grooming.TableKindBusinessStandard)}, 1, 1)
		if err != nil {
			return
		} // [/]
		// [将来源业务表重新加入未编目业务表]
		if len(bizForm) > 0 {
			po := repo.buildBusinessFormNotCatalogedPOFromDetail(bizForm[0])
			err = repo.insertBusinessFormNotCataloged(tx, []*domain.BusinessFormNotCatalogedPO{po})
			if err != nil {
				return
			}
		} // [/]
		// [删除信息资源目录关联项]
		conditions := orderedcontainers.NewOrderedDict[string, []any]()
		conditions.Set(buildEqualParams([]*domain.SearchParamItem{
			{
				Keys:     []string{"f_info_resource_catalog_id"},
				Values:   []any{strconv.FormatInt(id, 10)},
				Exclude:  false,
				Priority: 0,
			},
		}))
		where, values := buildWhereParams(conditions)
		relatedItems, err := repo.queryInfoResourceCatalogRelatedItems(tx, where, 0, 0, values)
		if err != nil {
			return
		}
		if len(relatedItems) > 0 {
			err = repo.deleteInfoResourceCatalogRelatedItems(tx, functools.Map(func(x *domain.InfoResourceCatalogRelatedItemPO) int64 {
				return x.ID
			}, relatedItems))
			if err != nil {
				return
			}
		} // [/]
		// [删除信息资源目录关联类目节点]
		categoryNodes, err := repo.selectInfoResourceCatalogCategoryNodes(tx, id)
		if err != nil {
			return
		}
		_, _, categoryNodesToDelete := diff(categoryNodes, nil)
		err = skipEmpty(tx, categoryNodesToDelete, repo.deleteInfoResourceCatalogCategoryNodes)
		if err != nil {
			return
		} // [/]
		// [删除业务场景]
		err = repo.deleteBusinessScenes(tx, id)
		if err != nil {
			return
		} // [/]
		// [删除信息资源目录下属信息项]
		infoResourceCatalogColumns, err := repo.selectInfoResourceCatalogColumns(tx, id)
		if err != nil {
			return
		}
		_, _, infoResourceCatalogColumnsToDelete := diff(infoResourceCatalogColumns, nil)
		err = skipEmpty(tx, infoResourceCatalogColumnsToDelete, repo.deleteInfoResourceCatalogColumns)
		if err != nil {
			return
		}
		err = skipEmpty(tx, infoResourceCatalogColumnsToDelete, repo.deleteInfoResourceCatalogColumnRelatedInfos) // [/]
		return
	})
}

func (repo *infoResourceCatalogRepo) BatchUpdate(tx *gorm.DB, catalogs []*domain.InfoResourceCatalog) error {
	var (
		catalogPO *domain.InfoResourceCatalogPO
		err       error
	)
	for i := range catalogs {
		catalogPO, err = repo.buildInfoResourceCatalogPO(catalogs[i])
		if err != nil {
			return err
		}
		if err = repo.updateInfoResourceCatalog(tx, catalogPO); err != nil {
			return err
		}
	}
	return err
}

func (repo *infoResourceCatalogRepo) BatchUpdateForAudit(tx *gorm.DB, catalogs []*domain.InfoResourceCatalog) error {
	var (
		catalogPO *domain.InfoResourceCatalogPO
		err       error
	)
	for i := range catalogs {
		catalogPO, err = repo.buildInfoResourceCatalogPO(catalogs[i])
		if err != nil {
			return err
		}
		if err = repo.updateInfoResourceCatalogForAudit(tx, catalogPO); err != nil {
			return err
		}
	}
	return err
}

// 变更完成指定信息资源目录
func (repo *infoResourceCatalogRepo) AlterComplete(tx *gorm.DB, catalog *domain.InfoResourceCatalog) error {
	var (
		nextID    int64
		catalogPO *domain.InfoResourceCatalogPO
		err       error
	)
	// [更新信息资源目录表记录]
	catalogPO, err = repo.buildInfoResourceCatalogPO(catalog)
	if err != nil {
		return err
	}
	nextID = catalogPO.NextID
	catalogPO.NextID = 0
	if err = repo.updateInfoResourceCatalog(tx, catalogPO); err != nil {
		return err
	}

	catalogIDs := make([]int64, 0, 2)
	catalogIDs = append(catalogIDs, catalogPO.ID)
	/*---------------------------------删除变更版本---------------------------------*/
	if nextID > 0 {
		// [删除信息资源目录表记录]
		err = repo.deleteInfoResourceCatalogForAlter(tx, nextID)
		if err != nil {
			return err
		} // [/]

		catalogIDs = append(catalogIDs, nextID)
	}

	/*---------------------------------删除当前版本及变更版本的相关信息（除信息资源目录表及source_info表）---------------------------------*/
	// [删除信息资源目录关联项]
	err = repo.deleteInfoResourceCatalogRelatedItemsByCatalogIDs(tx, catalogIDs)
	if err != nil {
		return err
	} // [/]
	// [删除信息资源目录关联类目节点]
	err = repo.deleteInfoResourceCatalogCategoryNodesByCatalogIDs(tx, catalogIDs)
	if err != nil {
		return err
	} // [/]
	// [删除业务场景]
	err = repo.deleteBusinessScenesByCatalogIDs(tx, catalogIDs)
	if err != nil {
		return err
	} // [/]
	// [删除信息资源目录下属信息项]
	if err = repo.deleteInfoResourceCatalogColumnRelatedInfosByCatalogIDs(tx, catalogIDs); err != nil {
		return err
	}
	if err = repo.deleteInfoResourceCatalogColumnsByCatalogIDs(tx, catalogIDs); err != nil {
		return err
	}
	// [/]

	/*---------------------------------重新为当前版本的添加变更后的相关信息（除source_info表）---------------------------------*/
	// [向信息资源目录关联项表插入记录]
	relatedItemPOs, err := repo.buildInfoResourceCatalogRelatedItemPOs(catalog)
	if err != nil {
		return err
	}
	err = skipEmpty(tx, relatedItemPOs, repo.insertInfoResourceCatalogRelatedItems)
	if err != nil {
		return err
	} // [/]
	// [向信息资源目录类目节点表插入记录]
	categoryNodePOs, err := repo.buildInfoResourceCatalogCategoryNodePOs(catalog)
	if err != nil {
		return err
	}
	err = skipEmpty(tx, categoryNodePOs, repo.insertInfoResourceCatalogCategoryNodes)
	if err != nil {
		return err
	} // [/]
	// [向业务场景表插入记录]
	businessScenePOs, err := repo.buildBusinessScenePOs(catalog)
	if err != nil {
		return err
	}
	err = skipEmpty(tx, businessScenePOs, repo.insertInfoResourceCatalogBusinessScenes)
	if err != nil {
		return err
	} // [/]
	// [向信息资源目录下属信息项表插入记录]
	columnPOs, err := repo.buildInfoResourceCatalogColumnPOs(catalog)
	if err != nil {
		return err
	}
	err = skipEmpty(tx, columnPOs, repo.insertInfoResourceCatalogColumns)
	if err != nil {
		return err
	} // [/]
	// [向信息资源目录信息项关联信息表插入记录]
	columnRelatedInfoPOs, err := repo.buildInfoResourceCatalogColumnRelatedInfoPOs(catalog)
	if err != nil {
		return err
	}
	return skipEmpty(tx, columnRelatedInfoPOs, repo.insertInfoResourceCatalogColumnRelatedInfos) // [/]
}

// 查询未分类信息资源目录计数
func (repo *infoResourceCatalogRepo) CountUnallocatedBy(ctx context.Context, categoryID string, in, equals, likes, between []*domain.SearchParamItem) (count int, err error) {
	join, filter := repo.buildListUnallocatedByJoin(categoryID)
	equals = filterDeleted("DeleteAt", util.DeepCopySlice(equals))
	where, values := repo.buildListUnallocatedByWhere(util.DeepCopySlice(in), equals, util.DeepCopySlice(likes), util.DeepCopySlice(between), filter, categoryID, "c.")
	count, err = repo.countInfoResourceCatalog(repo.db.WithContext(ctx), where, join, values)
	return
}

func (repo *infoResourceCatalogRepo) buildListUnallocatedByJoin(categoryID string) (join, filter string) {
	if categoryID != "" {
		join = /*sql*/ `LEFT JOIN af_data_catalog.t_info_resource_catalog_category_node AS n ON c.f_id = n.f_info_resource_catalog_id`
		filter = /*sql*/ `(EXISTS (SELECT 1 FROM af_data_catalog.t_info_resource_catalog_category_node WHERE f_info_resource_catalog_id = c.f_id AND f_category_cate_id = ? AND f_category_node_id='00000000-0000-0000-0000-000000000000') OR 
							NOT EXISTS (SELECT 1 FROM af_data_catalog.t_info_resource_catalog_category_node WHERE f_info_resource_catalog_id = c.f_id AND f_category_cate_id = ?))`
	}
	return
}

func (repo *infoResourceCatalogRepo) buildListUnallocatedByWhere(in, equals, likes, between []*domain.SearchParamItem, filter, categoryID, prefix string) (where string, values []any) {
	// [映射查询字段]
	catalogPO := &domain.InfoResourceCatalogPO{}
	mappingSearchFields(catalogPO, equals, prefix)
	mappingSearchFields(catalogPO, in, prefix)
	mappingSearchFields(catalogPO, likes, prefix)
	mappingSearchFields(catalogPO, between, prefix) // [/]
	// [组装查询条件]
	conditions := orderedcontainers.NewOrderedDict[string, []any]()
	if filter != "" {
		conditions.Set(filter, []any{categoryID, categoryID})
	}
	conditions.Set(buildEqualParams(equals))
	conditions.Set(buildEqualParams(in))
	conditions.Set(buildBetweenParams(between))
	conditions.Set(buildLikeParams(likes))
	where, values = buildWhereParams(conditions) // [/]
	return
}

// 查询未分类信息资源目录
func (repo *infoResourceCatalogRepo) ListUnallocatedBy(ctx context.Context, categoryID string, in, equals, likes, between []*domain.SearchParamItem, orderBy []*domain.OrderParamItem, offset, limit int) (records []*domain.InfoResourceCatalog, err error) {
	// [查询信息资源目录列表]
	join, filter := repo.buildListUnallocatedByJoin(categoryID)
	equals = filterDeleted("DeleteAt", util.DeepCopySlice(equals))
	prefix := "c."
	where, values := repo.buildListUnallocatedByWhere(util.DeepCopySlice(in), equals, util.DeepCopySlice(likes), util.DeepCopySlice(between), filter, categoryID, prefix)
	orderByParams := buildOrderByParams[domain.InfoResourceCatalogPO](util.DeepCopySlice(orderBy), prefix)
	infoCatalogs, err := repo.queryInfoResourceCatalog(repo.db.WithContext(ctx), where, join, orderByParams, offset, limit, values)
	if err != nil {
		return
	} // [/]
	// [组装查询结果列表]
	records = make([]*domain.InfoResourceCatalog, len(infoCatalogs))
	for i, catalog := range infoCatalogs {
		records[i], err = repo.buildInfoResourceCatalogEntity(catalog, nil, nil, nil, nil, nil)
		if err != nil {
			return
		}
	} // [/]
	return
}

// 查询信息资源目录计数
func (repo *infoResourceCatalogRepo) CountBy(ctx context.Context, categoryNodeIDs []string, categoryID string, in, equals, likes, between []*domain.SearchParamItem) (count int, err error) {
	join, filter := repo.buildListByJoin(categoryNodeIDs, categoryID)
	equals = filterDeleted("DeleteAt", util.DeepCopySlice(equals))
	where, values := repo.buildListByWhere(util.DeepCopySlice(in), equals, util.DeepCopySlice(likes), util.DeepCopySlice(between), filter, "c.")
	count, err = repo.countInfoResourceCatalog(repo.db.WithContext(ctx), where, join, values)
	return
}

func (repo *infoResourceCatalogRepo) CountByMultiCateFilter(ctx context.Context, cateIDNodeIDs map[string][]string, in, equals, likes, between []*domain.SearchParamItem) (count int, err error) {
	joins, filter, unallocatedCateID, unallocatedFilter := repo.buildListByJoins(cateIDNodeIDs)
	equals = filterDeleted("DeleteAt", util.DeepCopySlice(equals))
	where, values := repo.buildListByWhereMultiCateFilter(util.DeepCopySlice(in), equals, util.DeepCopySlice(likes), util.DeepCopySlice(between), filter, "c.", unallocatedCateID, unallocatedFilter)
	count, err = repo.countInfoResourceCatalogByMultiJoins(repo.db.WithContext(ctx), where, joins, values)
	return
}

func (repo *infoResourceCatalogRepo) buildListByJoin(categoryNodeIDs []string, categoryID string) (join string, filter []*domain.SearchParamItem) {
	filter = make([]*domain.SearchParamItem, 0)
	if len(categoryNodeIDs) == 0 || categoryID == "" {
		return
	}
	join = /*sql*/ `JOIN af_data_catalog.t_info_resource_catalog_category_node AS n ON c.f_id = n.f_info_resource_catalog_id`
	// [添加等值查询匹配条件]
	filter = append(filter,
		&domain.SearchParamItem{
			Keys:     []string{ /*sql*/ `n.f_category_node_id`},
			Values:   util.TypedListToAnyList(categoryNodeIDs),
			Exclude:  false,
			Priority: 1,
		},
		&domain.SearchParamItem{
			Keys:     []string{ /*sql*/ `n.f_category_cate_id`},
			Values:   []any{categoryID},
			Exclude:  false,
			Priority: 0,
		},
	) // [/]
	return
}

func (repo *infoResourceCatalogRepo) buildListByJoins(categoryNodeIDs map[string][]string) (joins []string, filters []*domain.SearchParamItem, unallocatedCateID, unallocatedFilter string) {
	filters = make([]*domain.SearchParamItem, 0)
	joins = make([]string, 0)
	count := 0
	for cateID, nodeIDs := range categoryNodeIDs {
		if cateID == "" || len(nodeIDs) == 0 {
			continue
		}

		if nodeIDs[0] == constant.UnallocatedId {
			unallocatedCateID = cateID
			join, filter := repo.buildListUnallocatedByJoin(cateID)
			joins = append(joins, join)
			unallocatedFilter = filter
			continue
		}

		alias := fmt.Sprintf("n%d", count)
		joins = append(joins, /*sql*/
			fmt.Sprintf(
				`JOIN af_data_catalog.t_info_resource_catalog_category_node AS %s ON c.f_id = %s.f_info_resource_catalog_id`,
				alias, alias),
		)
		// [添加等值查询匹配条件]
		filters = append(filters,
			&domain.SearchParamItem{
				Keys:     []string{ /*sql*/ fmt.Sprintf(`%s.f_category_node_id`, alias)},
				Values:   util.TypedListToAnyList(nodeIDs),
				Exclude:  false,
				Priority: 1,
			},
			&domain.SearchParamItem{
				Keys:     []string{ /*sql*/ fmt.Sprintf(`%s.f_category_cate_id`, alias)},
				Values:   []any{cateID},
				Exclude:  false,
				Priority: 0,
			},
		) // [/]
		count++
	}
	return
}

func (repo *infoResourceCatalogRepo) buildListByWhere(in, equals, likes, between, filter []*domain.SearchParamItem, prefix string) (where string, values []any) {
	// [映射查询字段]
	catalogPO := &domain.InfoResourceCatalogPO{}
	mappingSearchFields(catalogPO, equals, prefix)
	mappingSearchFields(catalogPO, in, prefix)
	mappingSearchFields(catalogPO, likes, prefix)
	mappingSearchFields(catalogPO, between, prefix) // [/]
	// [组装查询条件]
	conditions := orderedcontainers.NewOrderedDict[string, []any]()
	conditions.Set(buildEqualParams(filter))
	conditions.Set(buildEqualParams(equals))
	conditions.Set(buildEqualParams(in))
	conditions.Set(buildBetweenParams(between))
	conditions.Set(buildLikeParams(likes))
	where, values = buildWhereParams(conditions) // [/]
	return
}

func (repo *infoResourceCatalogRepo) buildListByWhereMultiCateFilter(in, equals, likes, between, filter []*domain.SearchParamItem, prefix, unallocatedCateID, unallocatedFilter string) (where string, values []any) {
	// [映射查询字段]
	catalogPO := &domain.InfoResourceCatalogPO{}
	mappingSearchFields(catalogPO, equals, prefix)
	mappingSearchFields(catalogPO, in, prefix)
	mappingSearchFields(catalogPO, likes, prefix)
	mappingSearchFields(catalogPO, between, prefix) // [/]
	// [组装查询条件]
	conditions := orderedcontainers.NewOrderedDict[string, []any]()
	if unallocatedFilter != "" {
		conditions.Set(unallocatedFilter, []any{unallocatedCateID, unallocatedCateID})
	}
	conditions.Set(buildEqualParams(filter))
	conditions.Set(buildEqualParams(equals))
	conditions.Set(buildEqualParams(in))
	conditions.Set(buildBetweenParams(between))
	conditions.Set(buildLikeParams(likes))
	where, values = buildWhereParams(conditions) // [/]
	return
}

// 查询信息资源目录
func (repo *infoResourceCatalogRepo) ListBy(ctx context.Context, categoryNodeIDs []string, categoryID string, in, equals, likes, between []*domain.SearchParamItem, orderBy []*domain.OrderParamItem, offset, limit int) (records []*domain.InfoResourceCatalog, err error) {
	// [查询信息资源目录列表]
	join, filter := repo.buildListByJoin(categoryNodeIDs, categoryID)
	equals = filterDeleted("DeleteAt", util.DeepCopySlice(equals))
	prefix := "c."
	where, values := repo.buildListByWhere(util.DeepCopySlice(in), equals, util.DeepCopySlice(likes), util.DeepCopySlice(between), filter, prefix)
	orderByParams := buildOrderByParams[domain.InfoResourceCatalogPO](util.DeepCopySlice(orderBy), prefix)
	infoCatalogs, err := repo.queryInfoResourceCatalog(repo.db.WithContext(ctx), where, join, orderByParams, offset, limit, values)
	if err != nil {
		return
	} // [/]
	// [组装查询结果列表]
	records = make([]*domain.InfoResourceCatalog, len(infoCatalogs))
	for i, catalog := range infoCatalogs {
		records[i], err = repo.buildInfoResourceCatalogEntity(catalog, nil, nil, nil, nil, nil)
		if err != nil {
			return
		}
	} // [/]
	return
}

// 查询信息资源目录
func (repo *infoResourceCatalogRepo) ListByMultiCateFilter(ctx context.Context, cateIDNodeIDs map[string][]string, in, equals, likes, between []*domain.SearchParamItem, orderBy []*domain.OrderParamItem, offset, limit int) (records []*domain.InfoResourceCatalog, err error) {
	// [查询信息资源目录列表]
	joins, filter, unallocatedCateID, unallocatedFilter := repo.buildListByJoins(cateIDNodeIDs)
	equals = filterDeleted("DeleteAt", util.DeepCopySlice(equals))
	prefix := "c."
	where, values := repo.buildListByWhereMultiCateFilter(util.DeepCopySlice(in), equals, util.DeepCopySlice(likes), util.DeepCopySlice(between), filter, prefix, unallocatedCateID, unallocatedFilter)
	orderByParams := buildOrderByParams[domain.InfoResourceCatalogPO](util.DeepCopySlice(orderBy), prefix)
	infoCatalogs, err := repo.queryInfoResourceCatalogByMultiJoins(repo.db.WithContext(ctx), where, joins, orderByParams, offset, limit, values)
	if err != nil {
		return
	} // [/]
	// [组装查询结果列表]
	records = make([]*domain.InfoResourceCatalog, len(infoCatalogs))
	for i, catalog := range infoCatalogs {
		records[i], err = repo.buildInfoResourceCatalogEntity(catalog, nil, nil, nil, nil, nil)
		if err != nil {
			return
		}
	} // [/]
	return
}

// 查询未编目业务表
func (repo *infoResourceCatalogRepo) ListUncatalogedBusinessFormsBy(ctx context.Context, equals, likes []*domain.SearchParamItem, orderBy []*domain.OrderParamItem, offset, limit int) (records []*domain.BusinessFormCopy, err error) {
	// [查询未编目业务表列表]
	where, values := repo.buildListUncatalogedBusinessFormsByWhere(util.DeepCopySlice(equals), util.DeepCopySlice(likes))
	orderByParams := buildOrderByParams[domain.BusinessFormNotCatalogedPO](util.DeepCopySlice(orderBy), "")
	businessForms, err := repo.queryBusinessFormNotCataloged(repo.db.WithContext(ctx), where, orderByParams, offset, limit, values)
	if err != nil {
		return
	} // [/]
	// [组装查询结果列表]
	records = make([]*domain.BusinessFormCopy, len(businessForms))
	for i, form := range businessForms {
		records[i] = repo.buildBusinessFormEntity(form)
	} // [/]
	return
}

func (repo *infoResourceCatalogRepo) buildListUncatalogedBusinessFormsByWhere(equals, likes []*domain.SearchParamItem) (where string, values []any) {
	// [映射查询字段]
	businessFormPO := &domain.BusinessFormNotCatalogedPO{}
	parseFields := func(items []*domain.SearchParamItem) {
		for _, item := range items {
			item.Keys = functools.Map(func(field string) string {
				return structFieldToDBColumn(businessFormPO, field)
			}, item.Keys)
		}
	}
	parseFields(equals)
	parseFields(likes) // [/]
	// [组装查询条件]
	conditions := orderedcontainers.NewOrderedDict[string, []any]()
	conditions.Set(buildEqualParams(equals))
	conditions.Set(buildLikeParams(likes))
	where, values = buildWhereParams(conditions) // [/]
	return
}

// 查询未编目业务表计数
func (repo *infoResourceCatalogRepo) CountUncatalogedBusinessForms(ctx context.Context, equals, likes []*domain.SearchParamItem) (count int, err error) {
	where, values := repo.buildListUncatalogedBusinessFormsByWhere(util.DeepCopySlice(equals), util.DeepCopySlice(likes))
	count, err = repo.countBusinessFormNotCataloged(repo.db.WithContext(ctx), where, values)
	return
}

func (repo *infoResourceCatalogRepo) FindBaseInfoByID(ctx context.Context, id int64) (catalog *domain.InfoResourceCatalog, err error) {
	tx := repo.db.WithContext(ctx)
	// [查询信息资源目录]
	catalogPO, err := repo.selectInfoResourceCatalogByID(tx, id)
	if err != nil {
		return
	} // [/]

	catalog, err = repo.buildInfoResourceCatalogEntity(catalogPO, nil, nil, nil, nil, nil)
	return
}

// 获取指定信息资源目录详情
func (repo *infoResourceCatalogRepo) FindByID(ctx context.Context, id int64) (catalog *domain.InfoResourceCatalog, err error) {
	tx := repo.db.WithContext(ctx)
	// [查询信息资源目录]
	catalogPO, err := repo.selectInfoResourceCatalogByID(tx, id)
	if err != nil {
		return
	} // [/]

	// 业务表ID需要唯一，因此变更的版本在获取来源信息时必须通过现行即前一版本的ID获取
	sID := catalogPO.ID
	if catalogPO.CurrentVersion == 0 {
		sID = catalogPO.PreID
	}
	// [查询信息资源目录来源信息]
	sourceInfoPO, err := repo.selectInfoResourceCatalogSourceInfoByID(tx, sID)
	if err != nil {
		return
	} // [/]
	// [查询信息资源目录关联项]
	conditions := orderedcontainers.NewOrderedDict[string, []any]()
	conditions.Set(buildEqualParams([]*domain.SearchParamItem{
		{
			Keys:     []string{"f_info_resource_catalog_id"},
			Values:   []any{strconv.FormatInt(id, 10)},
			Exclude:  false,
			Priority: 0,
		},
	}))
	where, values := buildWhereParams(conditions)
	relatedItemPOs, err := repo.queryInfoResourceCatalogRelatedItems(tx, where, 0, 0, values)
	if err != nil {
		return
	} // [/]
	// [查询信息资源目录关联类目节点]
	categoryNodes, err := repo.selectInfoResourceCatalogCategoryNodes(tx, id)
	if err != nil {
		return
	} // [/]
	// [查询信息资源目录来源/关联业务场景]
	businessScenes, err := repo.selectInfoResourceCatalogBusinessScenes(tx, id)
	if err != nil {
		return
	} // [/]
	catalog, err = repo.buildInfoResourceCatalogEntity(catalogPO, sourceInfoPO, relatedItemPOs, categoryNodes, businessScenes, nil)
	return
}

// 获取指定信息资源目录详情（变更专用，需要获取信息项）
func (repo *infoResourceCatalogRepo) FindByIDForAlter(ctx context.Context, id int64) (catalog *domain.InfoResourceCatalog, err error) {
	tx := repo.db.WithContext(ctx)
	// [查询信息资源目录]
	catalogPO, err := repo.selectInfoResourceCatalogByID(tx, id)
	if err != nil {
		return
	} // [/]

	// 业务表ID需要唯一，因此变更的版本在获取来源信息时必须通过现行即前一版本的ID获取
	sID := catalogPO.ID
	if catalogPO.CurrentVersion == 0 {
		sID = catalogPO.PreID
	}
	// [查询信息资源目录来源信息]
	sourceInfoPO, err := repo.selectInfoResourceCatalogSourceInfoByID(tx, sID)
	if err != nil {
		return
	} // [/]
	// [查询信息资源目录关联项]
	conditions := orderedcontainers.NewOrderedDict[string, []any]()
	conditions.Set(buildEqualParams([]*domain.SearchParamItem{
		{
			Keys:     []string{"f_info_resource_catalog_id"},
			Values:   []any{strconv.FormatInt(id, 10)},
			Exclude:  false,
			Priority: 0,
		},
	}))
	where, values := buildWhereParams(conditions)
	relatedItemPOs, err := repo.queryInfoResourceCatalogRelatedItems(tx, where, 0, 0, values)
	if err != nil {
		return
	} // [/]
	// [查询信息资源目录关联类目节点]
	categoryNodes, err := repo.selectInfoResourceCatalogCategoryNodes(tx, id)
	if err != nil {
		return
	} // [/]
	// [查询信息资源目录来源/关联业务场景]
	businessScenes, err := repo.selectInfoResourceCatalogBusinessScenes(tx, id)
	if err != nil {
		return
	} // [/]
	catalog, err = repo.buildInfoResourceCatalogEntity(catalogPO, sourceInfoPO, relatedItemPOs, categoryNodes, businessScenes, nil)
	if err != nil {
		return
	}

	// [查询信息资源目录下属信息项列表]
	// [查询信息项列表]
	equals := []*info_resource_catalog.SearchParamItem{
		{
			Keys:   []string{"InfoResourceCatalogID"},
			Values: []any{id},
		},
	}
	where, values = repo.buildListColumnsByWhere(equals, nil)
	columns, err := repo.queryInfoResourceCatalogColumns(tx, where, 0, 0, values)
	if err != nil {
		return
	} // [/]
	// [查询信息项关联信息]
	conditions = orderedcontainers.NewOrderedDict[string, []any]()
	conditions.Set(buildEqualParams([]*domain.SearchParamItem{
		{
			Keys: []string{"f_id"},
			Values: functools.Map(func(x *domain.InfoResourceCatalogColumnPO) any {
				return strconv.FormatInt(x.ID, 10)
			}, columns),
			Exclude:  false,
			Priority: 0,
		},
	}))
	where, values = buildWhereParams(conditions)
	columnRelatedInfos, err := repo.queryInfoResourceCatalogColumnRelatedInfo(tx, where, 0, 0, values)
	if err != nil {
		return
	} // [/]
	// [组装查询结果列表]
	relatedInfoMap := make(map[int64]*domain.InfoResourceCatalogColumnRelatedInfoPO)
	for _, relatedInfo := range columnRelatedInfos {
		relatedInfoMap[relatedInfo.ID] = relatedInfo
	}
	catalog.Columns = make([]*domain.InfoItem, len(columns))
	for _, column := range columns {
		catalog.Columns[column.Order] = repo.buildInfoItemEntity(column, relatedInfoMap[column.ID], nil)
	} // [/]
	return
}

// 查询信息资源目录关联项
func (repo *infoResourceCatalogRepo) ListRelatedItemsBy(ctx context.Context, equals []*domain.SearchParamItem, offset, limit int) (records []*domain.InfoResourceCatalogRelatedItemPO, err error) {
	where, values := repo.buildListRelatedItemsByWhere(util.DeepCopySlice(equals))
	records, err = repo.queryInfoResourceCatalogRelatedItems(repo.db.WithContext(ctx), where, offset, limit, values)
	return
}

func (repo *infoResourceCatalogRepo) buildListRelatedItemsByWhere(equals []*domain.SearchParamItem) (where string, values []any) {
	// [映射查询字段]
	relatedItemPO := &domain.InfoResourceCatalogRelatedItemPO{}
	for _, item := range equals {
		item.Keys = functools.Map(func(field string) string {
			return structFieldToDBColumn(relatedItemPO, field)
		}, item.Keys)
	}
	// [组装查询条件]
	conditions := orderedcontainers.NewOrderedDict[string, []any]()
	conditions.Set(buildEqualParams(equals))
	where, values = buildWhereParams(conditions) // [/]
	return
}

// 查询信息资源目录关联项计数
func (repo *infoResourceCatalogRepo) CountRelatedItemsBy(ctx context.Context, equals []*domain.SearchParamItem) (count int, err error) {
	where, values := repo.buildListRelatedItemsByWhere(util.DeepCopySlice(equals))
	count, err = repo.countInfoResourceCatalogRelatedItems(repo.db.WithContext(ctx), where, values)
	return
}

// 查询信息资源目录下属信息项
func (repo *infoResourceCatalogRepo) ListColumnsBy(ctx context.Context, equals, likes []*domain.SearchParamItem, offset, limit int) (records []*domain.InfoItem, err error) {
	tx := repo.db.WithContext(ctx)
	// [查询信息资源目录下属信息项列表]
	where, values := repo.buildListColumnsByWhere(util.DeepCopySlice(equals), util.DeepCopySlice(likes))
	columns, err := repo.queryInfoResourceCatalogColumns(tx, where, offset, limit, values)
	if err != nil {
		return
	} // [/]
	// [查询信息项关联信息]
	conditions := orderedcontainers.NewOrderedDict[string, []any]()
	conditions.Set(buildEqualParams([]*domain.SearchParamItem{
		{
			Keys: []string{"f_id"},
			Values: functools.Map(func(x *domain.InfoResourceCatalogColumnPO) any {
				return strconv.FormatInt(x.ID, 10)
			}, columns),
			Exclude:  false,
			Priority: 0,
		},
	}))
	where, values = buildWhereParams(conditions)
	columnRelatedInfos, err := repo.queryInfoResourceCatalogColumnRelatedInfo(tx, where, 0, 0, values)
	if err != nil {
		return
	} // [/]
	// [组装查询结果列表]
	relatedInfoMap := make(map[int64]*domain.InfoResourceCatalogColumnRelatedInfoPO)
	for _, relatedInfo := range columnRelatedInfos {
		relatedInfoMap[relatedInfo.ID] = relatedInfo
	}
	records = make([]*domain.InfoItem, 0, len(columns))

	for _, column := range columns {
		records = append(records, repo.buildInfoItemEntity(column, relatedInfoMap[column.ID], nil))
		// records[column.Order] = repo.buildInfoItemEntity(column, relatedInfoMap[column.ID], nil)
	} // [/]
	return
}

func (repo *infoResourceCatalogRepo) buildListColumnsByWhere(equals, likes []*domain.SearchParamItem) (where string, values []any) {
	// [映射查询字段]
	columnPO := &domain.InfoResourceCatalogColumnPO{}
	parseFields := func(items []*domain.SearchParamItem) {
		for _, item := range items {
			item.Keys = functools.Map(func(field string) string {
				return structFieldToDBColumn(columnPO, field)
			}, item.Keys)
		}
	}
	parseFields(equals)
	parseFields(likes) // [/]
	// [组装查询条件]
	conditions := orderedcontainers.NewOrderedDict[string, []any]()
	conditions.Set(buildEqualParams(equals))
	conditions.Set(buildLikeParams(likes))
	where, values = buildWhereParams(conditions) // [/]
	return
}

// 查询信息项计数
func (repo *infoResourceCatalogRepo) CountColumnsBy(ctx context.Context, equals, likes []*domain.SearchParamItem) (count int, err error) {
	where, values := repo.buildListColumnsByWhere(util.DeepCopySlice(equals), util.DeepCopySlice(likes))
	count, err = repo.countInfoResourceCatalogColumns(repo.db.WithContext(ctx), where, values)
	return
}

// 更新关联项名称
func (repo *infoResourceCatalogRepo) UpdateRelatedItemNames(ctx context.Context, names map[domain.InfoResourceCatalogRelatedItemRelationTypeEnum][]*domain.BusinessEntity) error {
	return repo.handleDbTx(ctx, func(tx *gorm.DB) (err error) {
		for itemType, itemList := range names {
			for _, item := range itemList {
				switch itemType {
				case domain.BelongDepartment, domain.BelongOffice:
					// [更新来源部门名称]
					sourcePO := &domain.InfoResourceCatalogSourceInfoPO{
						DepartmentID:   item.ID,
						DepartmentName: item.Name,
					}
					err = repo.updateInfoResourceCatalogSourceDepartmentNames(tx, sourcePO)
					if err != nil {
						return
					} // [/]
					fallthrough
				default:
					// [更新关联项名称]
					po := &domain.InfoResourceCatalogRelatedItemPO{
						RelatedItemID:       item.ID,
						RelatedItemName:     item.Name,
						RelatedItemDataType: item.DataType,
						RelationType:        itemType,
					}
					err = repo.updateInfoResourceCatalogRelatedItemNames(tx, po)
					if err != nil {
						return
					} // [/]
				}
			}
		}
		return
	})
}

// 获取信息资源目录来源信息
func (repo *infoResourceCatalogRepo) GetSourceInfos(ctx context.Context, equals []*domain.SearchParamItem) (records []*domain.InfoResourceCatalog, err error) {
	// [查询信息资源目录来源信息]
	where, values := repo.buildGetInfoResourceCatalogSourceInfoWhere(util.DeepCopySlice(equals))
	sourceInfos, err := repo.queryInfoResourceCatalogSourceInfo(repo.db.WithContext(ctx), where, values)
	if err != nil {
		return
	} // [/]
	// [组装查询结果列表]
	records = functools.Map(func(x *domain.InfoResourceCatalogSourceInfoPO) *domain.InfoResourceCatalog {
		return &domain.InfoResourceCatalog{
			ID:                 strconv.FormatInt(x.ID, 10),
			SourceBusinessForm: repo.buildBusinessEntity(x.BusinessFormID, x.BusinessFormName, ""),
			SourceDepartment:   repo.buildBusinessEntity(x.DepartmentID, x.DepartmentName, ""),
		}
	}, sourceInfos) // [/]
	return
}

func (repo *infoResourceCatalogRepo) buildGetInfoResourceCatalogSourceInfoWhere(equals []*domain.SearchParamItem) (where string, values []any) {
	// [映射查询字段]
	sourceInfoPO := &domain.InfoResourceCatalogSourceInfoPO{}
	for _, item := range equals {
		item.Keys = functools.Map(func(field string) string {
			return structFieldToDBColumn(sourceInfoPO, field)
		}, item.Keys)
	} // [/]
	// [组装查询条件]
	conditions := orderedcontainers.NewOrderedDict[string, []any]()
	conditions.Set(buildEqualParams(equals))
	where, values = buildWhereParams(conditions) // [/]
	return
}

// 更新信息项关联信息
func (repo *infoResourceCatalogRepo) UpdateColumnRelatedInfos(ctx context.Context, items map[domain.ColumnRelatedInfoRelatedTypeEnum][]*domain.BusinessEntity) error {
	return repo.handleDbTx(ctx, func(tx *gorm.DB) (err error) {
		var itemID int64
		// [更新关联数据元名称]
		for _, item := range items[domain.RelatedDataRefer] {
			itemID, err = strconv.ParseInt(item.ID, 10, 64)
			if err != nil {
				return
			}
			po := &domain.InfoResourceCatalogColumnRelatedInfoPO{
				DataReferID:   itemID,
				DataReferName: item.Name,
			}
			err = repo.updateInfoResourceCatalogColumnRelatedDataReferNames(tx, po)
			if err != nil {
				return
			}
		} // [/]
		// [更新关联代码集名称]
		for _, item := range items[domain.RelatedCodeSet] {
			itemID, err = strconv.ParseInt(item.ID, 10, 64)
			if err != nil {
				return
			}
			po := &domain.InfoResourceCatalogColumnRelatedInfoPO{
				CodeSetID:   itemID,
				CodeSetName: item.Name,
			}
			err = repo.updateInfoResourceCatalogColumnRelatedCodeSetNames(tx, po)
			if err != nil {
				return
			}
		} // [/]
		return
	})
}

// 批量更新信息资源目录
func (repo *infoResourceCatalogRepo) BatchUpdateBy(ctx context.Context, by []*domain.SearchParamItem, updates map[string]any) error {
	return repo.handleDbTx(ctx, func(tx *gorm.DB) (err error) {
		where, values := repo.buildBatchUpdateByWhere(util.DeepCopySlice(by))
		return repo.batchUpdateInfoResourceCatalog(tx, where, values, updates)
	})
}

func (repo *infoResourceCatalogRepo) buildBatchUpdateByWhere(equals []*domain.SearchParamItem) (where string, values []any) {
	// [映射查询字段]
	catalogPO := &domain.InfoResourceCatalogPO{}
	mappingSearchFields(catalogPO, equals, "") // [/]
	// [组装查询条件]
	conditions := orderedcontainers.NewOrderedDict[string, []any]()
	conditions.Set(buildEqualParams(equals))
	where, values = buildWhereParams(conditions) // [/]
	return
}

// 获取信息资源目录关联类目节点
func (repo *infoResourceCatalogRepo) GetRelatedCategoryNodes(ctx context.Context, equals []*domain.SearchParamItem) (records dict.Dict[string, arraylist.ArrayList[*domain.CategoryNode]], err error) {
	// [查询信息资源目录关联类目节点]
	where, values := repo.buildGetRelatedCategoryNodesWhere(util.DeepCopySlice(equals))
	categoryNodePOs, err := repo.queryInfoResourceCatalogCategoryNodes(repo.db.WithContext(ctx), where, values)
	if err != nil {
		return
	} // [/]
	// [组装查询结果]
	records = make(dict.Dict[string, arraylist.ArrayList[*domain.CategoryNode]])
	for _, po := range categoryNodePOs {
		catalogID := strconv.FormatInt(po.InfoResourceCatalogID, 10)
		nodeGroup := records.Get(catalogID, arraylist.Of[*domain.CategoryNode]())
		entity := &domain.CategoryNode{
			CateID: po.CategoryCateID,
			NodeID: po.CategoryNodeID,
		}
		records.Set(catalogID, nodeGroup.Concat(arraylist.Of(entity)))
	} // [/]
	return
}

func (repo *infoResourceCatalogRepo) buildGetRelatedCategoryNodesWhere(equals []*domain.SearchParamItem) (where string, values []any) {
	// [映射查询字段]
	categoryNodePO := &domain.InfoResourceCatalogCategoryNodePO{}
	for _, item := range equals {
		item.Keys = functools.Map(func(field string) string {
			return structFieldToDBColumn(categoryNodePO, field)
		}, item.Keys)
	} // [/]
	// [组装查询条件]
	conditions := orderedcontainers.NewOrderedDict[string, []any]()
	conditions.Set(buildEqualParams(equals))
	where, values = buildWhereParams(conditions) // [/]
	return
}
