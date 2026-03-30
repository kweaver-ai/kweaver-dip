package impl

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/kweaver-ai/idrm-go-frame/core/store/gormx"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_comprehension"

	"github.com/samber/lo"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_resource_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type catalogRepo struct {
	db *gorm.DB
}

// ModifyDC SaveCatalog
func (d *catalogRepo) Db() *gorm.DB {
	return d.db
}
func (d *catalogRepo) do(tx []*gorm.DB) *gorm.DB {
	if len(tx) > 0 && tx[0] != nil {
		return tx[0]
	}
	return d.db
}

func NewDataResourceCatalogRepo(db *gorm.DB) data_resource_catalog.DataResourceCatalogRepo {
	return &catalogRepo{db: db}
}

func (d *catalogRepo) Create(ctx context.Context, catalog *model.TDataCatalog) error {
	return d.db.WithContext(ctx).Create(catalog).Error
}

func (d *catalogRepo) Update(ctx context.Context, catalog *model.TDataCatalog, tx ...*gorm.DB) error {
	return d.do(tx).WithContext(ctx).Where("id=?", catalog.ID).Updates(catalog).Error
}
func (d *catalogRepo) UpdateApplyNum(ctx context.Context, catalogId uint64) error {
	return d.db.WithContext(ctx).Model(&model.TDataCatalog{}).Where("id=?", catalogId).Update("apply_num", gorm.Expr("apply_num + ?", 1)).Error
}
func (d *catalogRepo) SaveInterfaceApplyNum(ctx context.Context, svc *model.TDataInterfaceApply) error {
	return d.db.WithContext(ctx).Create(svc).Error
}
func (d *catalogRepo) AggregateInterfaceApplyData(ctx context.Context) error {
	return d.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 先清空现有的聚合数据
		if err := tx.Where("1 = 1").Delete(&model.TDataInterfaceAggregate{}).Error; err != nil {
			return err
		}

		// 执行聚合查询: SELECT interface_id, SUM(apply_num) as total_apply_num FROM t_data_interface_apply GROUP BY interface_id
		var aggregateResults []struct {
			InterfaceID   string `gorm:"column:interface_id"`
			TotalApplyNum int64  `gorm:"column:total_apply_num"`
		}

		if err := tx.Table("t_data_interface_apply").
			Select("interface_id, SUM(apply_num) as total_apply_num").
			Group("interface_id").
			Find(&aggregateResults).Error; err != nil {
			return err
		}

		// 如果没有数据，直接返回
		if len(aggregateResults) == 0 {
			return nil
		}
		// 批量插入聚合数据
		var aggregateModels []*model.TDataInterfaceAggregate
		for _, result := range aggregateResults {
			aggregateModels = append(aggregateModels, &model.TDataInterfaceAggregate{
				InterfaceID: result.InterfaceID,
				ApplyNum:    result.TotalApplyNum,
			})
		}

		// 批量插入聚合数据
		if err := tx.Create(&aggregateModels).Error; err != nil {
			return err
		}

		return nil
	})
}
func (d *catalogRepo) UpdateInterfaceApplyNum(ctx context.Context, interfaceId string, bizDate string) error {
	return d.db.WithContext(ctx).Model(&model.TDataInterfaceApply{}).Where("interface_id=? and biz_date=?", interfaceId, bizDate).Update("apply_num", gorm.Expr("apply_num + ?", 1)).Error
}
func (d *catalogRepo) GetInterfaceAggregateRank(ctx context.Context) (interfaces []*model.TDataInterfaceAggregate, err error) {
	// 按照apply_num数量排名统计前5条数据
	var results []*model.TDataInterfaceAggregate

	err = d.db.WithContext(ctx).Raw(`
        WITH ranked_services AS (
            SELECT service_id, service_name,
                   ROW_NUMBER() OVER (PARTITION BY service_id ORDER BY id DESC) as rn
            FROM data_application_service.service
        )
        SELECT agg.id, agg.interface_id, agg.apply_num, rs.service_name
        FROM t_data_interface_aggregate agg
        INNER JOIN ranked_services rs 
            ON (agg.interface_id COLLATE utf8mb4_unicode_ci) = (rs.service_id COLLATE utf8mb4_unicode_ci)
            AND rs.rn = 1
        ORDER BY agg.apply_num DESC
        LIMIT 5
    `).Scan(&results).Error

	return results, err
}
func (d *catalogRepo) GetInterfaceEntity(ctx context.Context, interfaceId string, bizDate string) (applyNum int32, err error) {
	var entity *model.TDataInterfaceApply
	err = d.db.WithContext(ctx).Where("interface_id=? and biz_date=?", interfaceId, bizDate).Take(&entity).Error
	if err != nil {
		// 处理记录不存在的情况，不抛出异常，返回0
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, nil // 记录不存在时返回0，无错误
		}
		return 0, err // 其他数据库错误则返回错误
	}
	return entity.ApplyNum, nil
}
func (d *catalogRepo) CreateTransaction(ctx context.Context, catalog *model.TDataCatalog, apiParams []*model.TApi, dataResource []*model.TDataResource, category []*model.TDataCatalogCategory, columns []*model.TDataCatalogColumn) error {
	if tErr := d.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		return d.CreateDC(ctx, catalog, apiParams, dataResource, category, columns, tx)
	}); tErr != nil {
		log.WithContext(ctx).Error("【catalogRepo】CreateTransaction ", zap.Error(tErr))
		return tErr
	}
	return nil
}
func (d *catalogRepo) CreateDC(ctx context.Context, catalog *model.TDataCatalog, apiParams []*model.TApi, dataResource []*model.TDataResource, category []*model.TDataCatalogCategory, columns []*model.TDataCatalogColumn, tx *gorm.DB) error {
	var err error

	var findCatalog *model.TDataCatalog
	//创建目录
	err = tx.Where("title=?", catalog.Title).Take(&findCatalog).Error
	if err == nil {
		return data_resource_catalog.NameRepeat
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	if err = tx.Create(&catalog).Error; err != nil {
		return err
	}

	// 校验挂载数据
	/*for _, dr := range dataResource {
		var resource *model.TDataResource
		if err = tx.Where("resource_id=?", dr.ResourceId).Take(&resource).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return data_resource_catalog.DataResourceNotExist
			}
			return err
		}
		if resource.CatalogID != 0 {
			return data_resource_catalog.DataResourceNotExist
		}
	}*/
	// 检查重复挂载
	if err = d.CreateVerifyMount(dataResource, tx); err != nil {
		return err
	}

	err = d.updateCatalogOthersInfo(tx, catalog, apiParams, dataResource, category, columns)
	if err != nil {
		return err
	}

	return nil
}
func (d *catalogRepo) CreateVerifyMount(dataResource []*model.TDataResource, tx *gorm.DB) error {
	// 检查重复挂载
	var resources []*model.TDataResource
	if err := d.db.Where("resource_id IN (?)",
		lo.Map(dataResource, func(dr *model.TDataResource, _ int) string { return dr.ResourceId }),
	).Find(&resources).Error; err != nil {
		return err
	}

	for _, res := range resources {
		if res.CatalogID != 0 {
			return errors.New(fmt.Sprintf("resource %s already mounted", res.ResourceId))
		}
	}
	return nil
}
func (d *catalogRepo) CreateDraftCopyTransaction(ctx context.Context, catalogID uint64, draftCatalog *model.TDataCatalog, apiParams []*model.TApi, resources []*model.TDataResource, category []*model.TDataCatalogCategory, columns []*model.TDataCatalogColumn, openSSZD bool) error {
	tx := d.db.WithContext(ctx).Begin()
	var err error
	//err = tx.Updates(&model.TDataCatalog{ID: catalogID, DraftID: catalog.ID}).Error
	err = tx.Exec("UPDATE `t_data_catalog` SET `draft_id`=? WHERE `id` = ?", draftCatalog.ID, catalogID).Error
	if err != nil {
		tx.Rollback()
		return err
	}
	//目录名称校验
	var id uint64
	err = tx.Select("id").Model(&model.TDataCatalog{}).Where("title=? and id!=?", draftCatalog.Title, catalogID).Take(&id).Error
	if err == nil {
		tx.Rollback()
		return data_resource_catalog.NameRepeat
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) { //todo callback会出现commands out of sync. Did you run multiple statements at once?
		tx.Rollback()
		return err
	}
	draftCatalog.DraftID = constant.DraftFlag
	if err = tx.Create(&draftCatalog).Error; err != nil {
		tx.Rollback()
		return err
	}
	err = d.updateCatalogOthersInfoDraft(tx, catalogID, draftCatalog, apiParams, resources, category, columns)
	if err != nil {
		tx.Rollback()
		return err
	}
	tx.Commit()
	return nil
}

/*func (d *catalogRepo) ModifyTransaction(ctx context.Context, draftID uint64, catalog *model.TDataCatalog, apiParams []*model.TApi, dataResource []*model.TDataResource, category []*model.TDataCatalogCategory, columns []*model.TDataCatalogColumn, openSSZD bool) error {
	if tErr := d.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var err error
		if err = d.SaveCatalog(ctx, catalog, apiParams, dataResource, category, columns, openSSZD, tx); err != nil { //更新草稿副本
			return err
		}
		if err = tx.Select("").Where("id=?", catalog.ID).Updates(&model.TDataCatalog{
			ID:            0,
			PublishStatus: "",
			DraftID:       0,
		}).Error; err != nil {
			return err
		}
		return nil
	}); tErr != nil {
		log.WithContext(ctx).Error("【catalogRepo】 DraftTransaction", zap.Error(tErr))
		return tErr
	}
	return nil
}*/
//
//func (d *catalogRepo) DeleteDraftCopyTransaction(ctx context.Context, draftID uint64, catalog *model.TDataCatalog, apiParams []*model.TApi, dataResource []*model.TDataResource, category []*model.TDataCatalogCategory, columns []*model.TDataCatalogColumn, openSSZD bool) error {
//	if tErr := d.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
//		var err error
//
//		/*	if err = tx.Model(&model.TDataCatalog{}).UpdateColumn("draft_id", 0).Error; err != nil { //发布目录取消关联
//			return err
//		}*/
//		catalog.DraftID = 0
//		/*if err = tx.Delete(&model.TDataCatalog{ID: draftID}).Error; err != nil { //删除草稿副本
//			return err
//		}*/
//		if err = d.DeleteDC(ctx, draftID, tx); err != nil { //删除草稿副本
//			return err
//		}
//		if err = d.SaveCatalog(ctx, catalog, apiParams, dataResource, category, columns, openSSZD, tx); err != nil { //更新草稿副本
//			return err
//		}
//		return nil
//	}); tErr != nil {
//		log.WithContext(ctx).Error("【catalogRepo】 DraftTransaction", zap.Error(tErr))
//		return tErr
//	}
//	return nil
//}

func (d *catalogRepo) SaveDraftCopyTransaction(ctx context.Context, catalogID uint64, draftCatalog *model.TDataCatalog, apiParams []*model.TApi, dataResource []*model.TDataResource, category []*model.TDataCatalogCategory, columns []*model.TDataCatalogColumn, openSSZD bool) error {
	if tErr := d.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var err error
		err = d.SaveCatalog(ctx, draftCatalog, apiParams, dataResource, category, columns, openSSZD, tx)
		if err != nil {
			return err
		}

		// 更新新挂的数据资源
		dataResourceIds := make([]string, len(dataResource))
		dataCatalogResource := make([]*model.TDataCatalogResource, len(dataResource))
		for i, resource := range dataResource {
			dataResourceIds[i] = resource.ResourceId
			dataCatalogResource[i] = &model.TDataCatalogResource{
				ResourceID:     resource.ResourceId,
				CatalogID:      draftCatalog.ID,
				RequestFormat:  resource.RequestFormat,
				ResponseFormat: resource.ResponseFormat,
				SchedulingPlan: resource.SchedulingPlan,
				Interval:       resource.Interval,
				Time:           resource.Time,
			}
		}
		var count int64
		if err = tx.Table(model.TableNameTDataResource).Where("catalog_id != ? and catalog_id != ? and catalog_id!=0  and resource_id in ?", catalogID, draftCatalog.ID, dataResourceIds).Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			return data_resource_catalog.DataResourceNotExist //资源被其他目录占用
		}
		//清理草稿副本挂载
		if err = tx.Where("catalog_id = ?", draftCatalog.ID).Delete(&model.TDataCatalogResource{}).Error; err != nil {
			return err
		}
		//绑定草稿副本挂载
		if err = tx.Create(&dataCatalogResource).Error; err != nil {
			return err
		}

		//标记数据资源被目录变更占用
		var (
			resources        []*model.TDataResource
			isViewMounted    bool
			mountedViewCount int
		)
		resourceIdMap := make(map[string]bool)
		if err = tx.Where("catalog_id = ?", catalogID).Find(&resources).Error; err != nil {
			return err
		}
		for _, dr := range resources {
			resourceIdMap[dr.ResourceId] = true
			if dr.Type == constant.MountView {
				isViewMounted = true
			}
		}
		for _, dr := range dataResource {
			if dr.Type == constant.MountView {
				mountedViewCount++
				if mountedViewCount > 1 {
					return errors.New("视图只能挂载一个")
				}
			}
			if !resourceIdMap[dr.ResourceId] { //新挂的数据资源
				if isViewMounted && dr.Type == constant.MountView {
					return errors.New("视图不能更换")
				}
				if err = tx.Table(model.TableNameTDataResource).Where("resource_id=?", dr.ResourceId).Update("catalog_id", draftCatalog.ID).Error; err != nil {
					return err
				}
			}
		}

		err = d.updateCatalogExDataResourceOthersInfo(tx, draftCatalog, apiParams, category, columns)
		if err != nil {
			return err
		}
		return nil
	}); tErr != nil {
		log.WithContext(ctx).Error("【catalogRepo】 SaveTransaction", zap.Error(tErr))
		return tErr
	}
	return nil

}
func (d *catalogRepo) SaveTransaction(ctx context.Context, catalog *model.TDataCatalog, apiParams []*model.TApi, dataResource []*model.TDataResource, category []*model.TDataCatalogCategory, columns []*model.TDataCatalogColumn, openSSZD bool) error {
	if tErr := d.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var err error
		err = d.SaveCatalog(ctx, catalog, apiParams, dataResource, category, columns, openSSZD, tx)
		if err != nil {
			return err
		}
		err = d.updateCatalogOthersInfo(tx, catalog, apiParams, dataResource, category, columns)
		if err != nil {
			return err
		}
		return nil
	}); tErr != nil {
		log.WithContext(ctx).Error("【catalogRepo】 SaveTransaction", zap.Error(tErr))
		return tErr
	}
	return nil
}
func (d *catalogRepo) SaveCatalog(ctx context.Context, catalog *model.TDataCatalog, apiParams []*model.TApi, dataResource []*model.TDataResource, category []*model.TDataCatalogCategory, columns []*model.TDataCatalogColumn, openSSZD bool, tx *gorm.DB) error {
	var err error
	var findCatalog *model.TDataCatalog
	var orgCatalog *model.TDataCatalog

	//校验目录id是否存在
	if findCatalog, err = d.Get(ctx, catalog.ID, tx); err != nil {
		return err
	}
	//目录名称校验
	txTmp := tx.Where("title=? and id!=?", catalog.Title, catalog.ID)
	if findCatalog.DraftID == constant.DraftFlag { //草稿副本
		if err = d.db.WithContext(ctx).Where("draft_id=?", findCatalog.ID).Take(&orgCatalog).Error; err != nil {
			return err
		}
		txTmp.Where("id<>?", orgCatalog.ID)
	} else if findCatalog.DraftID != 0 {
		txTmp.Where("id<>?", findCatalog.DraftID)
	}

	err = txTmp.Take(&model.TDataCatalog{}).Error
	if err == nil {
		return data_resource_catalog.NameRepeat
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	//暂存目录

	selectFields := []string{
		"title", "description", "data_range", "update_cycle", "other_update_cycle", "shared_type", "shared_condition",
		"open_type", "open_condition", "shared_mode", "physical_deletion", "sync_mechanism", "sync_frequency",
		"department_id", "updater_uid", "publish_flag", "app_scene_classify", "other_app_scene_classify",
		"source_department_id", "data_related_matters", "business_matters", "data_classify", "type", "draft_id", "time_range", "operation_authorized",
	}
	if openSSZD {
		selectFields = append(selectFields, "data_domain", "data_level", "time_range", "provider_channel", "central_department_code", "processing_level", "catalog_tag")
		if catalog.AdministrativeCode != nil {
			selectFields = append(selectFields, "administrative_code")
		}
		if catalog.IsElectronicProof != nil {
			selectFields = append(selectFields, "is_electronic_proof")
		}
	}

	if err = tx.Select(selectFields).Where("id=?", catalog.ID).Updates(catalog).Error; err != nil {
		return err
	}

	// 校验挂载数据
	/*for _, dr := range dataResource {
		var resource *model.TDataResource
		if err = tx.Where("resource_id=?", dr.ResourceId).Take(&resource).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return data_resource_catalog.DataResourceNotExist
			}
			return err
		}
	}*/
	var resources []*model.TDataResource
	if err = d.db.Where("resource_id IN (?)",
		lo.Map(dataResource, func(dr *model.TDataResource, _ int) string { return dr.ResourceId }),
	).Find(&resources).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return data_resource_catalog.DataResourceNotExist
		}
		return err
	}

	return nil
}

func (d *catalogRepo) updateCatalogOthersInfo(tx *gorm.DB, catalog *model.TDataCatalog, apiParams []*model.TApi, dataResource []*model.TDataResource, category []*model.TDataCatalogCategory, columns []*model.TDataCatalogColumn) error {
	var err error
	// 更新挂载数据
	for _, dr := range dataResource {
		if err = tx.Select("catalog_id", "request_format", "response_format", "scheduling_plan", "interval", "time").Where("resource_id=?", dr.ResourceId).Updates(dr).Error; err != nil {
			return err
		}
	}
	err = d.updateCatalogExDataResourceOthersInfo(tx, catalog, apiParams, category, columns)
	if err != nil {
		return err
	}
	return nil
}
func (d *catalogRepo) updateCatalogOthersInfoDraft(tx *gorm.DB, catalogID uint64, draftCatalog *model.TDataCatalog, apiParams []*model.TApi, dataResource []*model.TDataResource, category []*model.TDataCatalogCategory, columns []*model.TDataCatalogColumn) error {
	var err error

	// 更新新挂的数据资源
	dataResourceIds := make([]string, len(dataResource))
	dataCatalogResource := make([]*model.TDataCatalogResource, len(dataResource))
	for i, resource := range dataResource {
		dataResourceIds[i] = resource.ResourceId
		dataCatalogResource[i] = &model.TDataCatalogResource{
			ResourceID:     resource.ResourceId,
			CatalogID:      draftCatalog.ID,
			RequestFormat:  resource.RequestFormat,
			ResponseFormat: resource.ResponseFormat,
			SchedulingPlan: resource.SchedulingPlan,
			Interval:       resource.Interval,
			Time:           resource.Time,
		}
	}
	var count int64
	if err = tx.Table(model.TableNameTDataResource).Where("catalog_id != ? and catalog_id!=0  and resource_id in ?", catalogID, dataResourceIds).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return data_resource_catalog.DataResourceNotExist //资源被其他目录占用
	}
	if err = tx.Create(&dataCatalogResource).Error; err != nil {
		return err
	}

	//标记数据资源被目录变更占用
	var (
		resources        []*model.TDataResource
		isViewMounted    bool
		mountedViewCount int
	)
	resourceIdMap := make(map[string]bool)
	if err = tx.Where("catalog_id = ?", catalogID).Find(&resources).Error; err != nil {
		return err
	}
	for _, dr := range resources {
		resourceIdMap[dr.ResourceId] = true
		if dr.Type == constant.MountView {
			isViewMounted = true
		}
	}
	for _, dr := range dataResource {
		if dr.Type == constant.MountView {
			mountedViewCount++
			if mountedViewCount > 1 {
				return errors.New("视图只能挂载一个")
			}
		}
		if !resourceIdMap[dr.ResourceId] { //新挂的数据资源
			if isViewMounted && dr.Type == constant.MountView {
				return errors.New("视图不能更换")
			}
			if err = tx.Table(model.TableNameTDataResource).Where("resource_id=?", dr.ResourceId).Update("catalog_id", draftCatalog.ID).Error; err != nil {
				return err
			}
		}
	}

	err = d.updateCatalogExDataResourceOthersInfo(tx, draftCatalog, apiParams, category, columns)
	if err != nil {
		return err
	}
	return nil
}
func (d *catalogRepo) updateCatalogExDataResourceOthersInfo(tx *gorm.DB, catalog *model.TDataCatalog, apiParams []*model.TApi, category []*model.TDataCatalogCategory, columns []*model.TDataCatalogColumn) error {
	var err error
	if err = tx.Where("catalog_id=?", catalog.ID).Delete(&model.TApi{}).Error; err != nil {
		return err
	}
	if len(apiParams) != 0 {
		if err = tx.Create(&apiParams).Error; err != nil {
			return err
		}
	}

	if err = tx.Where("catalog_id=?", catalog.ID).Delete(&model.TDataCatalogCategory{}).Error; err != nil {
		return err
	}
	if len(category) != 0 {
		if err = tx.Create(&category).Error; err != nil {
			return err
		}
	}

	if err = tx.Where("catalog_id=?", catalog.ID).Delete(&model.TDataCatalogColumn{}).Error; err != nil {
		return err
	}
	if len(columns) != 0 {
		if err = tx.Create(&columns).Error; err != nil {
			return err
		}
	}

	return nil
}

func (d *catalogRepo) GetCatalogList(ctx context.Context, req *domain.GetDataCatalogList) (total int64, catalogs []*model.TDataCatalog, err error) { //ComprehensionCatalogListItem
	db := d.db.WithContext(ctx).Table("t_data_catalog")

	var joinCategory bool
	var categoryType int
	switch {
	case req.DepartmentID == constant.UnallocatedId:
		categoryType = constant.CategoryTypeDepartment
		joinCategory = true
	case req.SubjectID == constant.UnallocatedId:
		categoryType = constant.CategoryTypeSubject
		joinCategory = true
	case req.InfoSystemID == constant.UnallocatedId:
		categoryType = constant.CategoryTypeInfoSystem
		joinCategory = true
	case req.CategoryNodeId == constant.UnallocatedId:
		categoryType = constant.CategoryTypeCustom
		joinCategory = true
	}
	if joinCategory {
		db.Joins("left join t_data_catalog_category on t_data_catalog.id = t_data_catalog_category.catalog_id and category_type =?  ", categoryType).Where("category_type is null")
	}
	//如果查询的是数据理解，链接数据理解表
	comprehensionStateSlice := req.ComprehensionStateSlice()
	if len(comprehensionStateSlice) > 0 {
		db.Select("t_data_catalog.*, c.status as comprehension_status, c.updated_at as comprehension_update_time")
		dataComprehensionTableName := new(model.DataComprehensionDetail).TableName()
		db.Joins(" left join " + " (select * from " + dataComprehensionTableName + " where deleted_at=0) " + "  c on t_data_catalog.id = c.catalog_id ")
		if lo.Contains(comprehensionStateSlice, 1) {
			db.Where("c.`status` is null OR c.`status` in  ?", comprehensionStateSlice)
		} else {
			db.Where("c.`status` in  ?", comprehensionStateSlice)
		}
		db.Where("t_data_catalog.view_count > 0")
	}

	if len(req.SubSubjectIDs) != 0 ||
		(req.InfoSystemID != "" && req.InfoSystemID != constant.UnallocatedId) ||
		len(req.CategoryNodeIDs) != 0 {
		if !joinCategory {
			// 自定义类目节点查询需要指定 category_type = CategoryTypeCustom
			hasCustomCategory := len(req.CategoryNodeIDs) != 0
			if hasCustomCategory {
				db.Joins("left join t_data_catalog_category on t_data_catalog.id = t_data_catalog_category.catalog_id and t_data_catalog_category.category_type = ?", constant.CategoryTypeCustom)
			} else {
				db.Joins("left join t_data_catalog_category on t_data_catalog.id = t_data_catalog_category.catalog_id")
			}
		}
		categoryID := make([]string, 0)
		//d.sliceMuAdd(&categoryID, req.SubDepartmentIDs)
		d.sliceMuAdd(&categoryID, req.SubSubjectIDs)
		d.sliceAdd(&categoryID, req.InfoSystemID)
		d.sliceMuAdd(&categoryID, req.CategoryNodeIDs)
		if len(categoryID) == 1 {
			db.Where("category_id = ?", categoryID[0])
		} else if len(categoryID) > 1 {
			categoryID = util.DuplicateStringRemoval(categoryID)
			db.Where("category_id in ?", categoryID)
		}
	}
	if len(req.SubDepartmentIDs) > 0 {
		db.Where("department_id in ? ", req.SubDepartmentIDs)
	}
	if len(req.SubDepartmentIDs2) > 0 {
		db.Where("department_id in ? ", req.SubDepartmentIDs2)
	}
	keyword := req.Keyword
	if keyword != "" {
		if strings.Contains(keyword, "_") {
			keyword = strings.Replace(keyword, "_", "\\_", -1)
		}
		keyword = "%" + keyword + "%"
		db.Where("t_data_catalog.title like ? or t_data_catalog.code like ? ", keyword, keyword)
	}
	//if req.ResourceType != nil {
	//	db.Where("type =?", *req.ResourceType)
	//}
	if len(req.OnlineStatus) == 1 {
		db.Where("online_status = ?", req.OnlineStatus[0])
	} else if len(req.OnlineStatus) > 1 {
		db.Where("online_status in ?", req.OnlineStatus)
	}

	if len(req.PublishStatus) == 1 {
		db.Where("publish_status = ?", req.PublishStatus[0])
	} else if len(req.PublishStatus) > 1 {
		db.Where("publish_status in ?", req.PublishStatus)
	}

	if req.UpdatedAtStart != 0 {
		db.Where("UNIX_TIMESTAMP(t_data_catalog.updated_at)*1000 >= ?", req.UpdatedAtStart)
	}
	if req.UpdatedAtEnd != 0 {
		db.Where("UNIX_TIMESTAMP(t_data_catalog.updated_at)*1000 <= ?", req.UpdatedAtEnd)
	}
	if len(req.MountType) != 0 {
		var condition string
		for _, mt := range req.MountType {
			condition += mt + ">0 or "
		}
		condition = strings.TrimSuffix(condition, "or ")
		db.Where(condition)
	}
	if req.SharedType != 0 {
		db.Where("shared_type = ?", req.SharedType)
	}
	if req.UpdateCycle != nil {
		if *req.UpdateCycle == 0 {
			// 未分类：值为 0 或 NULL
			db.Where("update_cycle = 0 or update_cycle is null")
		} else {
			db.Where("update_cycle = ?", *req.UpdateCycle)
		}
	}
	if req.OpenType != nil {
		db.Where("open_type = ?", *req.OpenType)
	}
	if req.ColumnUnshared == true {
		db.Where("column_unshared = 1")
	}

	// 处理资源负面清单查询条件
	if req.ResourceNegativeList {
		// 复合条件：(ColumnUnshared=1 AND SharedType=2) OR (ColumnUnshared=0 AND SharedType=3)
		db.Where("(column_unshared = ? AND shared_type = ?) OR (column_unshared = ? AND shared_type = ?)",
			1, 2, 1, 3)
	}
	if req.SourceDepartmentID != "" {
		db.Where("source_department_id = ?", req.SourceDepartmentID)
	}
	db.Where("draft_id!=?", constant.DraftFlag)
	db = db.Distinct("t_data_catalog.id")

	total, err = gormx.RawCount(db)
	if err != nil {
		return
	}
	limit := *req.Limit
	offset := limit * (*req.Offset - 1)
	if limit > 0 {
		db.Limit(limit).Offset(offset)
	}
	if *req.Sort == "name" {
		db.Order(fmt.Sprintf(" title %s", *req.Direction))
	} else {
		// 需要为 updated_at 添加表前缀，避免与 JOIN 的数据理解表字段冲突
		sortField := *req.Sort
		if sortField == "updated_at" {
			sortField = "t_data_catalog." + sortField
		}
		db.Order(fmt.Sprintf("%s %s", sortField, *req.Direction))
	}
	db = db.Select("t_data_catalog.id", "t_data_catalog.*")
	catalogs, err = gormx.RawScan[*model.TDataCatalog](db)
	return
}
func (d *catalogRepo) sliceAdd(slice *[]string, s string) {
	if s != "" {
		*slice = append(*slice, s)
	}
	return
}
func (d *catalogRepo) sliceMuAdd(slice *[]string, s []string) {
	if len(s) != 0 {
		*slice = append(*slice, s...)
	}
	return
}
func (d *catalogRepo) Get(ctx context.Context, id uint64, tx ...*gorm.DB) (catalog *model.TDataCatalog, err error) {
	err = d.do(tx).WithContext(ctx).Where("id = ?", id).Take(&catalog).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return catalog, errorcode.Desc(errorcode.DataCatalogNotFound)
		}
		return catalog, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return catalog, nil
}

func (d *catalogRepo) GetByDraftId(ctx context.Context, draftId uint64, tx ...*gorm.DB) (catalog *model.TDataCatalog, err error) {
	err = d.do(tx).WithContext(ctx).Where("draft_id = ?", draftId).Take(&catalog).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return catalog, errorcode.Desc(errorcode.DataCatalogNotFound)
		}
		return catalog, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return catalog, nil
}

func (d *catalogRepo) GetCategoryByCatalogId(ctx context.Context, catalogId uint64) (category []*model.TDataCatalogCategory, err error) {
	err = d.db.WithContext(ctx).Where("catalog_id = ?", catalogId).Find(&category).Error
	return
}

func (d *catalogRepo) GetCategoriesByCatalogIds(ctx context.Context, catalogIds []uint64) (categories []*model.TDataCatalogCategory, err error) {
	err = d.db.WithContext(ctx).Where("catalog_id in ?", catalogIds).Find(&categories).Error
	return
}
func (d *catalogRepo) DeleteTransaction(ctx context.Context, catalogId uint64) error {
	if tErr := d.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var err error
		catalog, err := d.Get(ctx, catalogId, tx)
		if err != nil {
			return err
		}
		if err = d.DeleteDC(ctx, catalogId, tx); err != nil {
			return err
		}
		if catalog.DraftID > 0 && catalog.DraftID != constant.DraftFlag { //如果存在草稿副本，一起删除草稿副本
			if err = d.DeleteDC(ctx, catalog.DraftID, tx); err != nil {
				return err
			}
		}
		if catalog.DraftID == constant.DraftFlag { //草稿删除修改目录状态
			if err = tx.Select("publish_status", "draft_id").Where("draft_id=?", catalogId).Updates(&model.TDataCatalog{PublishStatus: constant.PublishStatusPublished, DraftID: 0}).Error; err != nil {
				return err
			}
		}
		return nil
	}); tErr != nil {
		log.WithContext(ctx).Error("【catalogRepo】DeleteTransaction ", zap.Error(tErr))
		return tErr
	}
	return nil

}
func (d *catalogRepo) DeleteDC(ctx context.Context, catalogId uint64, tx *gorm.DB) error {
	var err error
	//delete TDataCatalog
	catalog := &model.TDataCatalog{}
	if err = tx.Where("id=?", catalogId).Take(catalog).Error; err != nil {
		return err
	}
	if err = tx.Delete(catalog).Error; err != nil {
		return err
	}
	if err = tx.Table("t_data_catalog_history").Where("id=?", catalogId).Delete(&model.TDataCatalog{}).Error; err != nil {
		return err
	}
	if err = tx.Table("t_data_catalog_history").Create(catalog).Error; err != nil {
		return err
	}

	//delete TDataCatalogColumn
	column := make([]*model.TDataCatalogColumn, 0)
	if err = tx.Where("catalog_id=?", catalogId).Find(&column).Error; err != nil {
		return err
	}
	if len(column) != 0 {
		if err = tx.Where("catalog_id=?", catalogId).Delete(&model.TDataCatalogColumn{}).Error; err != nil {
			return err
		}
		if err = tx.Table("t_data_catalog_column_history").Where("catalog_id=?", catalogId).Delete(&model.TDataCatalogColumn{}).Error; err != nil {
			return err
		}
		if err = tx.Table("t_data_catalog_column_history").Create(column).Error; err != nil {
			return err
		}
	}

	//delete TDataResource
	resource := make([]*model.TDataResource, 0)
	if err = tx.Where("catalog_id=?", catalogId).Find(&resource).Error; err != nil {
		return err
	}
	for _, r := range resource {
		if r.Status == constant.ReSourceTypeNormal {
			if err = tx.Model(&model.TDataResource{}).Where("catalog_id=?", catalogId).UpdateColumn("catalog_id", 0).Error; err != nil {
				return err
			}
		}
		if r.Status == constant.ReSourceTypeDelete {
			if err = tx.Where("catalog_id=?", catalogId).Delete(&model.TDataResource{}).Error; err != nil {
				return err
			}
			if err = tx.Table("t_data_resource_history").Where("catalog_id=?", catalogId).Delete(&model.TDataResource{}).Error; err != nil {
				return err
			}
			if err = tx.Table("t_data_resource_history").Create(resource).Error; err != nil {
				return err
			}
		}
	}

	//delete TDataCatalogCategory
	category := make([]*model.TDataCatalogCategory, 0)
	if err = tx.Where("catalog_id=?", catalogId).Find(&category).Error; err != nil {
		return err
	}
	if len(category) != 0 {
		if err = tx.Where("catalog_id=?", catalogId).Delete(&model.TDataCatalogCategory{}).Error; err != nil {
			return err
		}
		if err = tx.Table("t_data_catalog_category_history").Where("catalog_id=?", catalogId).Delete(&model.TDataCatalogCategory{}).Error; err != nil {
			return err
		}
		if err = tx.Table("t_data_catalog_category_history").Create(category).Error; err != nil {
			return err
		}
	}

	api := make([]*model.TApi, 0)
	if err = tx.Where("catalog_id=?", catalogId).Find(&api).Error; err != nil {
		return err
	}
	if len(api) != 0 {
		if err = tx.Where("catalog_id=?", catalogId).Delete(&model.TApi{}).Error; err != nil {
			return err
		}
		if err = tx.Table("t_api_history").Where("catalog_id=?", catalogId).Delete(&model.TApi{}).Error; err != nil {
			return err
		}
		if err = tx.Table("t_api_history").Create(api).Error; err != nil {
			return err
		}
	}

	//delete TOpenCatalog
	var openCatalog *model.TOpenCatalog
	if err = tx.Where("catalog_id = ? and deleted_at is null", catalogId).Find(&openCatalog).Error; err != nil {
		return err
	}
	if openCatalog.ID > 0 {
		userInfo := request.GetUserInfo(ctx)
		deletedAt := time.Now()
		if err = tx.Model(&model.TOpenCatalog{}).Where("id = ?", openCatalog.ID).Updates(&model.TOpenCatalog{DeletedAt: &deletedAt, DeleteUID: userInfo.ID}).Error; err != nil {
			return err
		}
	}
	return nil
}
func (d *catalogRepo) CheckRepeat(ctx context.Context, catalogID uint64, name string) (bool, error) {
	var err error
	var catalog1 model.TDataCatalog

	if catalogID != 0 {
		if err = d.db.WithContext(ctx).Where("id=?", catalogID).Take(&catalog1).Error; err != nil {
			return false, err
		}
	}

	var catalog *model.TDataCatalog
	db := d.db.WithContext(ctx).Where("title=? and id<>?", name, catalogID)
	if catalog1.DraftID > 0 {
		db.Where("id<>?", catalog1.DraftID)
	}
	if err = db.Take(&catalog).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return true, err
	}
	return true, nil
}

func (d *catalogRepo) AuditApplyUpdate(ctx context.Context, catalog *model.TDataCatalog, tx ...*gorm.DB) error {
	return d.do(tx).WithContext(ctx).Where("id = ? and current_version = 1", catalog.ID).Omit("title").Updates(catalog).Error
}

func (d *catalogRepo) GetAllCatalog(ctx context.Context, req *domain.PushCatalogToEsReq) (catalogs []*model.TDataCatalog, err error) {
	db := d.db.WithContext(ctx)
	if len(req.PublishStatus) != 0 {
		db.Where("publish_status in ?", req.PublishStatus)
	}
	err = db.Find(&catalogs).Error
	return
}

func (d *catalogRepo) ListCatalogsByIDs(ctx context.Context, ids []uint64) (records []*model.TDataCatalog, err error) {
	err = d.db.WithContext(ctx).Where("id in ?", ids).Find(&records).Error
	return
}
func (d *catalogRepo) CreateAuditLog(ctx context.Context, auditLog []*model.AuditLog, tx ...*gorm.DB) error {
	return d.do(tx).WithContext(ctx).Create(auditLog).Error
}

func (d *catalogRepo) Count(ctx context.Context) (res *data_resource_catalog.CatalogCountRes, err error) {
	res = &data_resource_catalog.CatalogCountRes{}
	err = d.db.WithContext(ctx).Table("t_data_catalog").Count(&res.CatalogCount).Error //数据目录数量
	if err != nil {
		return
	}
	err = d.db.WithContext(ctx).Table("t_data_catalog").Where("publish_status in ?", constant.PublishedSlice).Count(&res.PublishedCatalogCount).Error
	if err != nil {
		return
	}
	err = d.db.WithContext(ctx).Table("t_data_catalog").Where("online_status in ?", []string{constant.LineStatusNotLine, constant.LineStatusUpAuditing, constant.LineStatusUpReject, constant.LineStatusOffLine}).Count(&res.NotLineCatalogCount).Error
	if err != nil {
		return
	}
	err = d.db.WithContext(ctx).Table("t_data_catalog").Where("online_status in ?", []string{constant.LineStatusOnLine, constant.LineStatusDownAuditing, constant.LineStatusDownReject}).Count(&res.OnLineCatalogCount).Error
	if err != nil {
		return
	}
	err = d.db.WithContext(ctx).Table("t_data_catalog").Where("online_status = ?", constant.LineStatusOffLine).Count(&res.OffLineCatalogCount).Error
	if err != nil {
		return
	}

	err = d.db.WithContext(ctx).Table("t_data_catalog").Where("publish_status = ?", constant.PublishStatusPubAuditing).Count(&res.PublishAuditingCatalogCount).Error
	if err != nil {
		return
	}
	err = d.db.WithContext(ctx).Table("t_data_catalog").Where("audit_type = ? and audit_state=2", constant.AuditTypePublish).Count(&res.PublishPassCatalogCount).Error
	if err != nil {
		return
	}
	err = d.db.WithContext(ctx).Table("t_data_catalog").Where("publish_status = ? ", constant.PublishStatusPubReject).Count(&res.PublishRejectCatalogCount).Error
	if err != nil {
		return
	}

	err = d.db.WithContext(ctx).Table("t_data_catalog").Where("online_status = ?", constant.LineStatusUpAuditing).Count(&res.OnlineAuditingCatalogCount).Error
	if err != nil {
		return
	}
	err = d.db.WithContext(ctx).Table("t_data_catalog").Where("audit_type = ? and audit_state=2", constant.AuditTypeOnline).Count(&res.OnlinePassCatalogCount).Error
	if err != nil {
		return
	}
	err = d.db.WithContext(ctx).Table("t_data_catalog").Where("online_status = ? ", constant.LineStatusUpReject).Count(&res.OnlineRejectCatalogCount).Error
	if err != nil {
		return
	}

	err = d.db.WithContext(ctx).Table("t_data_catalog").Where("online_status = ?", constant.LineStatusDownAuditing).Count(&res.OfflineAuditingCatalogCount).Error
	if err != nil {
		return
	}
	err = d.db.WithContext(ctx).Table("t_data_catalog").Where("audit_type = ? and audit_state=2", constant.AuditTypeOffline).Count(&res.OfflinePassCatalogCount).Error
	if err != nil {
		return
	}
	err = d.db.WithContext(ctx).Table("t_data_catalog").Where("online_status = ? ", constant.LineStatusDownReject).Count(&res.OfflineRejectCatalogCount).Error
	if err != nil {
		return
	}

	//目录共享统计
	err = d.db.WithContext(ctx).Table("t_data_catalog").Where("shared_type = ?", 1).Count(&res.UnconditionalShared).Error
	if err != nil {
		return
	}
	err = d.db.WithContext(ctx).Table("t_data_catalog").Where("shared_type = ? ", 2).Count(&res.ConditionalShared).Error
	if err != nil {
		return
	}
	err = d.db.WithContext(ctx).Table("t_data_catalog").Where("shared_type = ? ", 3).Count(&res.NotShared).Error
	if err != nil {
		return
	}
	return
}
func (d *catalogRepo) DepartmentCount(ctx context.Context) (res []*data_resource_catalog.DepartmentCount, err error) {
	//部门提供目录统计
	err = d.db.WithContext(ctx).Select("department_id", "count(department_id) count").Table("t_data_catalog").Group("department_id").Order("count DESC").Find(&res).Error
	return
}
func (d *catalogRepo) AuditLogCount(ctx context.Context, req *data_resource_catalog.AuditLogCountReq) (res []*data_resource_catalog.AuditLogCountRes, err error) {
	err = d.db.WithContext(ctx).Table("audit_log").
		Select(fmt.Sprintf("audit_type,audit_state,%s dive,count(catalog_id) count , audit_resource_type", req.Time)).
		Where(" audit_time > ? and audit_time < ?", req.Start, req.End).
		Group(fmt.Sprintf("audit_type,audit_state,audit_resource_type,%s", req.Time)).
		Find(&res).Error
	if err != nil {
		return
	}
	return
}
func (d *catalogRepo) ModifyTransaction(ctx context.Context, catalog *model.TDataCatalog) error {
	if tErr := d.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		return d.ModifyDC(ctx, catalog, tx)
	}); tErr != nil {
		log.WithContext(ctx).Error("【catalogRepo】ModifyTransaction ", zap.Error(tErr))
		return tErr
	}
	return nil
}
func (d *catalogRepo) ModifyDC(ctx context.Context, catalog *model.TDataCatalog, tx *gorm.DB) error { //变更目录
	oldCatalog, err := d.Get(ctx, catalog.ID, tx)
	if err != nil {
		return err
	}

	if err = d.DeleteDC(ctx, catalog.ID, tx); err != nil { //变更目录
		return err
	}
	if err = tx.Select("code", "created_at", "creator_uid", "proc_def_key", "flow_apply_id", "audit_type",
		"audit_state", "publish_status", "published_at", "online_status", "online_time", "draft_id").
		Where("id=?", oldCatalog.DraftID).
		Updates(&model.TDataCatalog{
			Code:          oldCatalog.Code,
			CreatedAt:     oldCatalog.CreatedAt,
			CreatorUID:    oldCatalog.CreatorUID,
			ProcDefKey:    oldCatalog.ProcDefKey,
			FlowApplyId:   oldCatalog.FlowApplyId,
			AuditType:     oldCatalog.AuditType,
			AuditState:    oldCatalog.AuditState,
			PublishStatus: catalog.PublishStatus,
			PublishedAt:   catalog.PublishedAt,
			OnlineStatus:  oldCatalog.OnlineStatus,
			OnlineTime:    oldCatalog.OnlineTime,
			DraftID:       0,
		}).Error; err != nil {
		return err
	}
	if err = tx.Exec("UPDATE t_data_catalog SET id=? WHERE id=?", catalog.ID, oldCatalog.DraftID).Error; err != nil { //变更草稿副本id为发布目录id
		return err
	}
	//根据草稿副本id拿取数据资源id
	draftResource := make([]*model.TDataCatalogResource, 0)
	if err = tx.Select("resource_id", "request_format", "response_format", "scheduling_plan", "interval", "time").Where("catalog_id=?", oldCatalog.DraftID).Find(&draftResource).Error; err != nil {
		return err
	}
	//清理草稿副本数据资源
	if err = tx.Where("catalog_id = ?", oldCatalog.DraftID).Delete(&model.TDataCatalogResource{}).Error; err != nil {
		return err
	}
	//清理原来的数据资源id
	if err = tx.Model(&model.TDataResource{}).Where("catalog_id = ?", oldCatalog.ID).Update("catalog_id", 0).Error; err != nil {
		return err
	}
	//设置数据资源id
	for _, dr := range draftResource {
		if err = tx.Select("catalog_id", "request_format", "response_format", "scheduling_plan", "interval", "time").Where("resource_id=?", dr.ResourceID).Updates(&model.TDataResource{
			RequestFormat:  dr.RequestFormat,
			ResponseFormat: dr.ResponseFormat,
			CatalogID:      oldCatalog.ID,
			SchedulingPlan: dr.SchedulingPlan,
			Interval:       dr.Interval,
			Time:           dr.Time,
		}).Error; err != nil {
			return err
		}
	}

	if err = tx.Where("catalog_id = ?", oldCatalog.DraftID).Updates(&model.TDataCatalogColumn{CatalogID: oldCatalog.ID}).Error; err != nil {
		return err
	}
	if err = tx.Where("catalog_id = ?", oldCatalog.DraftID).Updates(&model.TApi{CatalogID: oldCatalog.ID}).Error; err != nil {
		return err
	}

	if err = tx.Where("catalog_id = ?", oldCatalog.DraftID).Updates(&model.TDataCatalogCategory{CatalogID: oldCatalog.ID}).Error; err != nil {
		return err
	}

	return nil
}

func (d *catalogRepo) CreateDataCatalogApply(ctx context.Context, catalog *model.TDataCatalogApply) error {
	return d.db.WithContext(ctx).Create(catalog).Error
}

func (d *catalogRepo) GetCategoryByCatalogIdAndType(ctx context.Context, catalogId uint64, catalogType int32) (category []*model.TDataCatalogCategory, err error) {
	err = d.db.WithContext(ctx).Model(&model.TDataCatalogCategory{}).Where("catalog_id = ? and category_type = ?", catalogId, catalogType).Find(&category).Error
	return
}

func (d *catalogRepo) GetPublishedList(ctx context.Context, publishStatus []string) (catalogs []*model.TDataCatalog, err error) {
	err = d.db.WithContext(ctx).Model(&model.TDataCatalog{}).Where("view_count = 1 and publish_status in ?", publishStatus).Find(&catalogs).Error
	return
}

func (d *catalogRepo) DataGetOverview(ctx context.Context, req *domain.DataGetOverviewReq) *domain.DataGetOverviewRes {
	res := &domain.DataGetOverviewRes{
		Errors: make([]string, 0),
	}
	var err error
	if err = d.db.WithContext(ctx).Raw(`
		select count(distinct  department_id) from (
		select distinct department_id from af_data_catalog.t_data_catalog tdc  where draft_id !=9527
		union
		select  distinct f_related_item_id from af_data_catalog.t_info_resource_catalog_related_item tircri where f_relation_type=0
		union
		select distinct department_id  from af_data_catalog.t_data_resource tdr  where department_id !=""
		union
		select distinct department_id from af_configuration.front_end_processors fep
		) as ud;
	`).Scan(&res.DepartmentCount).Error; err != nil { //todo
		res.Errors = append(res.Errors, "catalogRepo DataGetOverview DepartmentCount: "+err.Error())
	}

	if len(req.SubDepartmentIDs) > 0 {
		if err = d.db.WithContext(ctx).Raw(`
		select count(1) from af_data_catalog.t_info_resource_catalog tirc  INNER JOIN af_data_catalog.t_info_resource_catalog_category_node b ON tirc.f_id = b.f_info_resource_catalog_id  where f_online_status in (2,4,6) and b.f_category_node_id  in (?)  ; 
		`, req.SubDepartmentIDs).Scan(&res.InfoCatalogCount).Error; err != nil {
			res.Errors = append(res.Errors, "catalogRepo DataGetOverview InfoCatalogCount: "+err.Error())
		}
	} else {
		if err = d.db.WithContext(ctx).Raw(`
		select count(1) from af_data_catalog.t_info_resource_catalog tirc    where f_online_status   in (2,4,6); 
		`).Scan(&res.InfoCatalogCount).Error; err != nil {
			res.Errors = append(res.Errors, "catalogRepo DataGetOverview InfoCatalogCount: "+err.Error())
		}
	}
	if len(req.SubDepartmentIDs) > 0 {
		if err = d.db.WithContext(ctx).Raw(`	
			select count(1) from af_data_catalog.t_info_resource_catalog_column tircc where tircc.f_info_resource_catalog_id  in(
				select tirc.f_id  from af_data_catalog.t_info_resource_catalog tirc  INNER JOIN af_data_catalog.t_info_resource_catalog_category_node b ON tirc.f_id = b.f_info_resource_catalog_id  where  b.f_category_node_id  in ?    and   f_online_status	    in (2,4,6)
			); 
		`, req.SubDepartmentIDs).Scan(&res.InfoCatalogColumnCount).Error; err != nil {
			res.Errors = append(res.Errors, "catalogRepo DataGetOverview InfoCatalogColumnCount: "+err.Error())
		}
	} else {
		if err = d.db.WithContext(ctx).Raw(`
		select count(1) from af_data_catalog.t_info_resource_catalog_column tircc ; 
	`).Scan(&res.InfoCatalogColumnCount).Error; err != nil {
			res.Errors = append(res.Errors, "catalogRepo DataGetOverview InfoCatalogColumnCount: "+err.Error())
		}
	}

	sql := `
		select count(1) from af_data_catalog.t_data_catalog tdc  where draft_id !=9527  and online_status  in ('online','down-auditing','down-reject') %s;  
	`
	myDepartment := "and department_id in  ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "DataCatalogCount ", &res.DataCatalogCount)

	if len(req.SubDepartmentIDs) > 0 {
		if err = d.db.WithContext(ctx).Raw(`
			select count(1) from af_data_catalog.t_data_catalog_column tdcc where catalog_id in (
			select
			id
			from
			af_data_catalog.t_data_catalog
			where
			online_status in ('online', 'down-reject', 'down-auditing')
			and department_id in  ?
			); 
		`, req.SubDepartmentIDs).Scan(&res.DataCatalogColumnCount).Error; err != nil {
			res.Errors = append(res.Errors, "catalogRepo DataGetOverview DataCatalogColumnCount: "+err.Error())
		}
	} else {
		if err = d.db.WithContext(ctx).Raw(`
		select count(1) from af_data_catalog.t_data_catalog_column tdcc; 
			`).Scan(&res.DataCatalogColumnCount).Error; err != nil {
			res.Errors = append(res.Errors, "catalogRepo DataGetOverview DataCatalogColumnCount: "+err.Error())
		}
	}
	res.DataResourceCount = make([]*domain.DRCount, 0)

	sql = `
		select count(1) count , type from af_data_catalog.t_data_resource tdr %s group by type; 
	`
	myDepartment = "where department_id in ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "DataResourceCount ", &res.DataResourceCount)
	// 使用中（已分配未回收）
	sql1 := `
		select count(1)  from af_configuration.front_end_processors  fep 
		inner join af_configuration.front_end_library fel on fep.id=fel.front_end_id 
		where receipt_timestamp is not null and reclaim_timestamp is null and  apply_type=
	`
	myDepartment = "and department_id in  ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql1+"1 %s", myDepartment, "FrontEndProcessorUsing ", &res.FrontEndProcessorUsing)
	d.RawScan(ctx, &res.Errors, req.MD, sql1+"2 %s", myDepartment, "FrontEndLibraryUsing ", &res.FrontEndLibraryUsing)
	// 已回收（已回收未删除）
	sql2 := `
		select count(1)  from af_configuration.front_end_processors  fep 
		inner join af_configuration.front_end_library fel on fep.id=fel.front_end_id  
		where  reclaim_timestamp is not null and deletion_timestamp  is null and apply_type=
	`
	myDepartment = "and department_id in  ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql2+"1 %s", myDepartment, "FrontEndProcessorReclaim ", &res.FrontEndProcessorReclaim)
	d.RawScan(ctx, &res.Errors, req.MD, sql2+"2 %s", myDepartment, "FrontEndLibraryReclaim ", &res.FrontEndLibraryReclaim)
	res.FrontEndProcessor = res.FrontEndProcessorUsing + res.FrontEndProcessorReclaim
	res.FrontEndLibrary = res.FrontEndLibraryUsing + res.FrontEndLibraryReclaim

	// 归集任务
	res.Aggregation = make([]*domain.WorkOrderTask, 0)
	sql = `
	select wot.status,count(1) count  from af_tasks.work_order_tasks wot 
		right join af_tasks.work_order_data_aggregation_details wodad on wot.id=wodad.id  %s
		group by wot.status ;  
	`
	myDepartment = "where department_id in  ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "WorkOrderTask ", &res.Aggregation)

	res.SyncMechanism = make([]*domain.SyncMechanism, 0)
	sql = `
		select sync_mechanism,count(1) count from af_data_catalog.t_data_catalog tdc  where draft_id !=9527 %s  group by sync_mechanism;
	`
	myDepartment = "and department_id in  ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "SyncMechanism ", &res.SyncMechanism)
	res.UpdateCycle = make([]*domain.UpdateCycle, 0)
	sql = `
		select update_cycle,count(1) count from af_data_catalog.t_data_catalog tdc  where draft_id !=9527  %s group by update_cycle;
	`
	myDepartment = "and department_id in  ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "UpdateCycle ", &res.UpdateCycle)

	res.CatalogSubjectGroup = make([]*domain.SubjectGroup, 0)
	sql = `
		select  category_id subject_id,IFNULL(sd.name, '其他')subject_name,count(1) count 
		from af_data_catalog.t_data_catalog_category tdcc 
		inner join af_data_catalog.t_data_catalog tdc on tdcc.catalog_id =tdc.id 
		left join af_main.subject_domain sd  on tdcc.category_id =sd.id   
		where  draft_id !=9527 and category_type =3 %s  group  by tdcc.category_id order by sd.id desc ;
	`
	myDepartment = "and department_id in  ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "CatalogSubjectGroup ", &res.CatalogSubjectGroup)

	res.ViewSubjectGroup = make([]*domain.SubjectGroup, 0)
	sql = `
		select COALESCE(NULLIF(subject_id , ''), '00000000-0000-0000-0000-000000000001')subject_id, IFNULL(sd.name, '其他') subject_name,count(1) count  from af_main.form_view fv left join af_main.subject_domain sd  on fv.subject_id  =sd.id %s  group by COALESCE(subject_id , '');
	`
	myDepartment = "and fv.department_id in  ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "ViewSubjectGroup ", &res.ViewSubjectGroup)

	res.CatalogDepartSubjectGroup = make([]*domain.SubjectGroup, 0)
	sql = `
		select  category_id subject_id,IFNULL(sd.name, '其他')subject_name,count(1) count from af_data_catalog.t_data_catalog_category tdcc inner join af_data_catalog.t_data_catalog tdc on tdcc.catalog_id =tdc.id  left join af_main.subject_domain sd  on tdcc.category_id =sd.id   where  tdc.draft_id !=9527 and tdc.department_id !=''and  category_type =3  %s  group  by tdcc.category_id ;
	`
	myDepartment = "and tdc.department_id in  ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "CatalogDepartSubjectGroup ", &res.CatalogDepartSubjectGroup)

	if len(req.SubDepartmentIDs) > 0 {
		if err = d.db.WithContext(ctx).Raw(`
			select count(1)  from af_data_catalog.t_open_catalog toc inner join af_data_catalog.t_data_catalog tdc on toc.catalog_id=tdc.id   where deleted_at is null and department_id in  ? ;
		`, req.SubDepartmentIDs).Scan(&res.OpenCount).Error; err != nil {
			res.Errors = append(res.Errors, "catalogRepo DataGetOverview OpenCount"+err.Error())
		}
	} else {
		if err = d.db.WithContext(ctx).Raw(`
			select count(1)  from af_data_catalog.t_open_catalog toc  where deleted_at is null;
		`).Scan(&res.OpenCount).Error; err != nil {
			res.Errors = append(res.Errors, "catalogRepo DataGetOverview OpenCount"+err.Error())
		}
	}

	sql = `
		select count(1)  from af_data_catalog.t_open_catalog toc inner join af_data_catalog.t_data_catalog tdc on toc.catalog_id=tdc.id where tdc.department_id !='' %s ;
	`
	myDepartment = "and department_id in  ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "OpenDepartmentCount ", &res.OpenDepartmentCount)

	res.DataRange = make([]*domain.DataRange, 0)
	sql = `
		select data_range,count(1) count  from af_data_catalog.t_data_catalog tdc where draft_id !=9527  and tdc.online_status in ('online', 'down-reject', 'down-auditing') %s  group by  data_range  ;
	`
	myDepartment = "and department_id in  ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "DataRange ", &res.DataRange)
	sql = `
		select count(distinct department_id) from af_main.form_view fv where fv.deleted_at=0 %s ;
	`
	myDepartment = "and department_id in  ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "ViewDepartmentCount ", &res.ViewDepartmentCount)

	sql = `
		select count(fv.id) from af_main.form_view fv where fv.deleted_at=0 %s ;
	`
	myDepartment = "and department_id in  ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "ViewCount ", &res.ViewCount)
	sql = `
		select count(1) from af_tasks.work_order_tasks wot right join af_tasks.work_order_data_aggregation_details wodad on wot.id=wodad.id  left join af_main.form_view fv  on wodad.source_table_name =fv.technical_name  and wodad.source_datasource_id =fv.datasource_id  where wot.status ='Completed'  and fv.deleted_at=0  and fv.publish_at >0 %s ;
	`
	myDepartment = "and fv.department_id in  ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "ViewAggregationCount ", &res.ViewAggregationCount)
	sql = `
		select count(distinct department_id) from data_application_service.service s where delete_time =0 %s ;
	`
	myDepartment = "and department_id in  ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "APIDepartmentCount ", &res.APIDepartmentCount)
	sql = `
		select count(1) from data_application_service.service s where delete_time =0 and service_type ='service_generate' and s.status='online' %s ;
	`
	myDepartment = "and department_id in  ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "APIGenerateCount ", &res.APIGenerateCount)
	sql = `
		select count(1) from data_application_service.service s where delete_time =0 and service_type ='service_register' and s.status='online' %s ;
	`
	myDepartment = "and department_id in  ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "APIRegisterCount ", &res.APIRegisterCount)
	sql = `
		select count(distinct department_id) from af_data_catalog.t_file_resource tfr  %s ;
	`
	myDepartment = "where department_id in  ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "FileDepartmentCount ", &res.FileDepartmentCount)
	sql = `
		select count(1) from af_data_catalog.t_file_resource tfr where publish_status='published' %s ;
	`
	myDepartment = "and department_id in  ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "FileCount ", &res.FileCount)

	res.ViewOverview = &domain.ViewOverview{
		SubjectGroup: make([]*domain.SubjectGroup, 0),
		DataRange:    make([]*domain.DataRange, 0),
	}
	sql = `
		SELECT a.data_range data_range, COUNT(1) count
		FROM 
			(SELECT id, data_range FROM af_data_catalog.t_data_catalog WHERE draft_id != 9527 AND online_status in ('online','down-auditing','down-reject') %s) a
			INNER JOIN
			(SELECT catalog_id FROM af_data_catalog.t_data_resource WHERE type = 1 AND catalog_id > 0) b ON a.id = b.catalog_id
		GROUP BY a.data_range;
	`
	myDepartment = "and department_id in  ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "ViewOverview.DataRange ", &res.ViewOverview.DataRange)

	sql = `
		SELECT tdcc.category_id subject_id, IFNULL(sd.name, '其他') subject_name,count(1) count 
		FROM 
			(SELECT category_id, catalog_id
				FROM af_data_catalog.t_data_catalog_category 
				WHERE category_type = 3 AND catalog_id IN (
					SELECT DISTINCT a.id
					FROM 
						(SELECT id FROM af_data_catalog.t_data_catalog WHERE draft_id != 9527 AND online_status in ('online','down-auditing','down-reject') %s) a
						INNER JOIN
						(SELECT catalog_id FROM af_data_catalog.t_data_resource WHERE type = 1 AND catalog_id > 0) b ON a.id = b.catalog_id
				)) tdcc
			LEFT JOIN 
			af_main.subject_domain sd  on tdcc.category_id =sd.id
		GROUP BY subject_id;
	`
	myDepartment = "and department_id in  ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "ViewOverview.SubjectGroup ", &res.ViewOverview.SubjectGroup)

	return res
}

// RawScan executes a raw SQL query and scans the result into the provided destination.
// It conditionally modifies the SQL query based on whether the request is for the user's department only.
//
// Parameters:
//   - ctx: Context for the database operation
//   - res: Pointer to DataGetDepartmentDetailRes to store any errors that occur during execution
//   - myDepartment: Boolean flag indicating whether to filter by the user's department
//   - sql: The SQL query string with a placeholder for the department filter
//   - department: The department identifier to filter by when myDepartment is true
//   - msg: Error message prefix to use when appending errors to res.Errors
//   - dest: Destination interface{} where the query results will be scanned into
func (d *catalogRepo) RawScan(ctx context.Context, errs *[]string, md domain.MD, sql string, myDepartmentWhere string, msg string, dest interface{}) {
	if len(md.SubDepartmentIDs) > 0 {
		sql = fmt.Sprintf(sql, myDepartmentWhere)
	} else {
		sql = fmt.Sprintf(sql, "")
	}
	var err error
	if len(md.SubDepartmentIDs) > 0 {
		if err = d.db.WithContext(ctx).Raw(sql, md.SubDepartmentIDs).Scan(dest).Error; err != nil {
			*errs = append(*errs, msg+err.Error())
		}
	} else {
		if err = d.db.WithContext(ctx).Raw(sql).Scan(dest).Error; err != nil {
			*errs = append(*errs, msg+err.Error())
		}
	}
}
func (d *catalogRepo) RawScanReturnError(ctx context.Context, md domain.MD, sql string, myDepartmentWhere string, dest interface{}) error {
	if len(md.SubDepartmentIDs) > 0 {
		sql = fmt.Sprintf(sql, myDepartmentWhere)
	} else {
		sql = fmt.Sprintf(sql, "")
	}
	var err error
	if len(md.SubDepartmentIDs) > 0 {
		if err = d.db.WithContext(ctx).Raw(sql, md.SubDepartmentIDs).Scan(dest).Error; err != nil {
			return err
		}
	} else {
		if err = d.db.WithContext(ctx).Raw(sql).Scan(dest).Error; err != nil {
			return err
		}
	}
	return nil
}
func (d *catalogRepo) RawScanReturnErr(ctx context.Context, md domain.MD, sql string, myDepartmentWhere string, dest interface{}, keyword string) error {
	if len(md.SubDepartmentIDs) > 0 {
		sql = fmt.Sprintf(sql, myDepartmentWhere)
	} else {
		sql = fmt.Sprintf(sql, "")
	}
	var err error
	if len(md.SubDepartmentIDs) > 0 {
		if err = d.db.WithContext(ctx).Raw(sql, keyword, md.SubDepartmentIDs).Scan(dest).Error; err != nil {
			return err
		}
	} else {
		if err = d.db.WithContext(ctx).Raw(sql, keyword).Scan(dest).Error; err != nil {
			return err
		}
	}
	return nil
}
func (d *catalogRepo) DataGetDepartmentDetail(ctx context.Context, req *domain.DataGetDepartmentDetailReq) (*domain.DataGetDepartmentDetailRes, []string) {
	res := &domain.DataGetDepartmentDetailRes{
		Entries: make([]*domain.DataGetDepartmentDetail, 0),
		Errors:  make([]string, 0),
	}
	tmp := make(map[string]*domain.DataGetDepartmentDetail, 0)

	sql := `
		select f_related_item_id department_id,count(f_related_item_id) count from af_data_catalog.t_info_resource_catalog tirc 
	inner join af_data_catalog.t_info_resource_catalog_related_item tircri   on tirc.f_id =tircri.f_info_resource_catalog_id  and tircri.f_relation_type = 0
   where tirc.f_delete_at=0 and  tirc.f_current_version = true %s group by f_related_item_id;
	`
	myDepartment := `and f_related_item_id  in ?`
	infoCatalog := make([]*domain.DCount, 0)
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "infoCatalog ", &infoCatalog)
	for _, t := range infoCatalog {
		if _, exist := tmp[t.DepartmentID]; !exist {
			tmp[t.DepartmentID] = &domain.DataGetDepartmentDetail{}
		}
		tmp[t.DepartmentID].InfoCatalogCount = t.Count
	}

	dataCatalog := make([]*domain.DCount, 0)
	sql = `
		select department_id,count(department_id) count from af_data_catalog.t_data_catalog tdc where draft_id !=9527 %s group by department_id;
	`
	myDepartment = `and department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "dataCatalog ", &dataCatalog)
	for _, t := range dataCatalog {
		if _, exist := tmp[t.DepartmentID]; !exist {
			tmp[t.DepartmentID] = &domain.DataGetDepartmentDetail{}
		}
		tmp[t.DepartmentID].DataCatalogCount = t.Count
	}

	dataResource := make([]*domain.DCount, 0)
	sql = `
		select department_id,count(department_id) count from af_data_catalog.t_data_resource tdr where status =1 %s group by department_id;
	`
	myDepartment = `and  department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "dataResource ", &dataResource)
	for _, t := range dataResource {
		if _, exist := tmp[t.DepartmentID]; !exist {
			tmp[t.DepartmentID] = &domain.DataGetDepartmentDetail{}
		}
		tmp[t.DepartmentID].DataResourceCount = t.Count
	}

	view := make([]*domain.DCount, 0)
	sql = `
		select department_id,count(department_id) count from af_main.form_view fv where deleted_at =0 and department_id !='' %s group by department_id;
	`
	myDepartment = `and  department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "view ", &view)
	for _, t := range view {
		if _, exist := tmp[t.DepartmentID]; !exist {
			tmp[t.DepartmentID] = &domain.DataGetDepartmentDetail{}
		}
		tmp[t.DepartmentID].ViewCount = t.Count
	}

	api := make([]*domain.DCount, 0)
	sql = `
		select department_id,count(department_id) count from data_application_service.service s where delete_time  =0 %s  group by department_id;
	`
	myDepartment = `and department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "api ", &api)
	for _, t := range api {
		if _, exist := tmp[t.DepartmentID]; !exist {
			tmp[t.DepartmentID] = &domain.DataGetDepartmentDetail{}
		}
		tmp[t.DepartmentID].APICount = t.Count
	}

	file := make([]*domain.DCount, 0)
	sql = `
		select department_id,count(department_id) count from af_data_catalog.t_file_resource tfr where deleted_at is null %s   group by department_id;
	`
	myDepartment = `  and department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "file ", &file)
	for _, t := range file {
		if _, exist := tmp[t.DepartmentID]; !exist {
			tmp[t.DepartmentID] = &domain.DataGetDepartmentDetail{}
		}
		tmp[t.DepartmentID].FileCount = t.Count
	}

	sql = `
	select fep.department_id ,count(fep.department_id) count from af_configuration.front_end_processors  fep 
	inner join af_configuration.front_end_library fel on fep.id=fel.front_end_id 
	where apply_type=
	`
	myDepartment = `  and department_id in ?`
	frontEndProcessor := make([]*domain.DCount, 0)
	d.RawScan(ctx, &res.Errors, req.MD, sql+"1 %s", myDepartment, "frontEndProcessor ", &frontEndProcessor)
	for _, t := range frontEndProcessor {
		if _, exist := tmp[t.DepartmentID]; !exist {
			tmp[t.DepartmentID] = &domain.DataGetDepartmentDetail{}
		}
		tmp[t.DepartmentID].FrontEndProcessorCount = t.Count
	}

	frontEndLibrary := make([]*domain.DCount, 0)
	d.RawScan(ctx, &res.Errors, req.MD, sql+"2 %s", myDepartment, "frontEndLibrary ", &frontEndLibrary)
	for _, t := range frontEndLibrary {
		if _, exist := tmp[t.DepartmentID]; !exist {
			tmp[t.DepartmentID] = &domain.DataGetDepartmentDetail{}
		}
		tmp[t.DepartmentID].FrontEndLibraryCount = t.Count
	}

	for depID, _ := range tmp {
		res.Entries = append(res.Entries, &domain.DataGetDepartmentDetail{
			DepartmentID:      depID,
			DepartmentName:    tmp[depID].DepartmentName,
			InfoCatalogCount:  tmp[depID].InfoCatalogCount,
			DataCatalogCount:  tmp[depID].DataCatalogCount,
			DataResourceCount: tmp[depID].DataResourceCount,
			ViewCount:         tmp[depID].ViewCount,
			APICount:          tmp[depID].APICount,
			FileCount:         tmp[depID].FileCount,
		})
	}

	return res, mapKeys(tmp)
}
func mapKeys[K comparable, V any](m map[K]V) []K {
	keys := make([]K, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

func (d *catalogRepo) DataGetAggregationOverview(ctx context.Context, req *domain.DataGetDepartmentDetailReq) (res *domain.DataGetAggregationOverviewRes, err error) {
	res = &domain.DataGetAggregationOverviewRes{
		Entries: make([]*domain.DataGetAggregationOverviewEntries, 0),
	}
	limit := req.Limit
	offset := limit * (req.Offset - 1)
	if strings.Contains(req.Keyword, "_") {
		req.Keyword = strings.Replace(req.Keyword, "_", "\\_", -1)
	}
	req.Keyword = "%" + req.Keyword + "%"
	sql := `
		select  count(1) from 
		(
		select department_id,c_count,nc_count from(
		
		select c.department_id,c.c_count,nc.nc_count from(
		(select wodad.department_id,count(1) c_count  from af_tasks.work_order_tasks wot 
		inner join af_tasks.work_order_data_aggregation_details wodad on wot.id=wodad.id 
		where wot.status ='Completed'
		group by wodad.department_id  ) c
		left  join 
		(select wodad.department_id,count(1) nc_count from af_tasks.work_order_tasks wot 
		inner join af_tasks.work_order_data_aggregation_details wodad on wot.id=wodad.id 
		where (wot.status ='Running') or (wot.status ='Failed')
		group by wodad.department_id  ) nc 
		on c.department_id= nc.department_id
		)
		
		union 
		
		select c.department_id,c.c_count,nc.nc_count from(
		(select wodad.department_id,count(1) c_count  from af_tasks.work_order_tasks wot 
		inner join af_tasks.work_order_data_aggregation_details wodad on wot.id=wodad.id 
		where wot.status ='Completed'
		group by wodad.department_id  ) c
		right  join 
		(select wodad.department_id,count(1) nc_count from af_tasks.work_order_tasks wot 
		inner join af_tasks.work_order_data_aggregation_details wodad on wot.id=wodad.id 
		where (wot.status ='Running') or (wot.status ='Failed')
		group by wodad.department_id  ) nc 
		on c.department_id= nc.department_id
		)
		)as full_join_res
		)as full_join_res
		
		inner join af_configuration.object o on full_join_res.department_id =o.id  where o.name like ? %s 

	`
	myDepartment := " and o.id in ?"
	if err = d.RawScanReturnErr(ctx, req.MD, sql, myDepartment, &res.TotalCount, req.Keyword); err != nil {
		return nil, err
	}

	sql = `
		select  o.name department_name,full_join_res.c_count completed_count ,full_join_res.nc_count not_completed_count from 
		(
		select department_id,c_count,nc_count from(
		
		select c.department_id,c.c_count,nc.nc_count from(
		(select wodad.department_id,count(1) c_count  from af_tasks.work_order_tasks wot 
		inner join af_tasks.work_order_data_aggregation_details wodad on wot.id=wodad.id 
		where wot.status ='Completed'
		group by wodad.department_id  ) c
		left  join 
		(select wodad.department_id,count(1) nc_count from af_tasks.work_order_tasks wot 
		inner join af_tasks.work_order_data_aggregation_details wodad on wot.id=wodad.id 
		where (wot.status ='Running') or (wot.status ='Failed')
		group by wodad.department_id  ) nc 
		on c.department_id= nc.department_id
		)
		
		union 
		
		select c.department_id,c.c_count,nc.nc_count from(
		(select wodad.department_id,count(1) c_count  from af_tasks.work_order_tasks wot 
		inner join af_tasks.work_order_data_aggregation_details wodad on wot.id=wodad.id 
		where wot.status ='Completed'
		group by wodad.department_id  ) c
		right  join 
		(select wodad.department_id,count(1) nc_count from af_tasks.work_order_tasks wot 
		inner join af_tasks.work_order_data_aggregation_details wodad on wot.id=wodad.id 
		where (wot.status ='Running') or (wot.status ='Failed')
		group by wodad.department_id  ) nc 
		on c.department_id= nc.department_id
		)
		)as full_join_res
		)as full_join_res
		
		inner join af_configuration.object o on full_join_res.department_id =o.id  where  o.name like ? %s 

	`
	if err = d.RawScanReturnErr(ctx, req.MD, sql+fmt.Sprintf(" limit %d offset %d ", limit, offset), myDepartment, &res.Entries, req.Keyword); err != nil {
		return nil, err
	}
	return

}

// DataAssetsOverview 数据资产概览统计
func (d *catalogRepo) DataAssetsOverview(ctx context.Context, req *domain.DataAssetsOverviewReq) (res *domain.DataAssetsOverviewRes, err error) {
	res = &domain.DataAssetsOverviewRes{
		Entries: make([]*domain.DataAssetsOverviewEntry, 0),
	}

	// 1. 资源部门数：统计数据资源目录与信息资源目录的部门名称数量（去重）
	var resourceDepartmentCount int
	err = d.db.WithContext(ctx).Raw(`
		SELECT COUNT(*) FROM (
			SELECT name 
			FROM af_configuration.object o 
			WHERE id IN (
				SELECT department_id 
				FROM af_data_catalog.t_data_catalog tdc 
				WHERE tdc.department_id IS NOT NULL 
				  AND tdc.department_id != '' 
				  AND tdc.draft_id != 9527
			)
			UNION
			SELECT b.f_related_item_name 
			FROM af_data_catalog.t_info_resource_catalog a 
			LEFT JOIN af_data_catalog.t_info_resource_catalog_related_item b 
			  ON a.f_id = b.f_info_resource_catalog_id
			WHERE b.f_related_item_name IS NOT NULL 
			  AND b.f_related_item_name != ''
		) AS combined_departments
	`).Scan(&resourceDepartmentCount).Error
	if err != nil {
		return nil, err
	}
	res.Entries = append(res.Entries, &domain.DataAssetsOverviewEntry{
		Category: "resource_department",
		Total:    resourceDepartmentCount,
	})

	// 2. 信息资源目录统计 - 与 /api/data-catalog/v1/info-resource-catalog/catalog-statistic 对齐
	var infoResourceStats struct {
		Total     int `gorm:"column:total"`
		Published int `gorm:"column:published"`
		Online    int `gorm:"column:online"`
	}
	err = d.db.WithContext(ctx).Raw(`
		SELECT 
			COALESCE(SUM(1),0) AS total,
			COALESCE(SUM(CASE WHEN f_publish_status IN (2,4,5) THEN 1 ELSE 0 END),0) AS published,
			COALESCE(SUM(CASE WHEN f_publish_status IN (2,4,5) AND f_online_status IN (2,4,6) THEN 1 ELSE 0 END),0) AS online
		FROM af_data_catalog.t_info_resource_catalog 
		WHERE f_current_version = TRUE AND f_delete_at = 0
	`).Scan(&infoResourceStats).Error
	if err != nil {
		return nil, err
	}
	res.Entries = append(res.Entries, &domain.DataAssetsOverviewEntry{
		Category:  "info_resource",
		Total:     infoResourceStats.Total,
		Published: &infoResourceStats.Published,
		Online:    &infoResourceStats.Online,
	})

	// 3. 数据资源目录统计 - 与 /api/data-catalog/v1/data-catalog/overview/total 对齐
	// 注意：已发布 = published + change-auditing + change-reject（不含pub-auditing发布审核中）
	var dataResourceStats struct {
		Total     int `gorm:"column:total"`
		Published int `gorm:"column:published"`
		Online    int `gorm:"column:online"`
	}
	err = d.db.WithContext(ctx).Raw(`
		SELECT 
			COUNT(*) as total,
			COUNT(CASE WHEN publish_status IN ('published', 'change-auditing', 'change-reject') THEN 1 END) as published,
			COUNT(CASE WHEN online_status IN ('online', 'down-auditing', 'down-reject') THEN 1 END) as online
		FROM af_data_catalog.t_data_catalog
	`).Scan(&dataResourceStats).Error
	if err != nil {
		return nil, err
	}
	res.Entries = append(res.Entries, &domain.DataAssetsOverviewEntry{
		Category:  "data_resource",
		Total:     dataResourceStats.Total,
		Published: &dataResourceStats.Published,
		Online:    &dataResourceStats.Online,
	})

	// 4. 库表统计（挂载了库表的数据目录数量）- 参考/api/data-catalog/v1/data-catalog接口逻辑
	var databaseStats struct {
		Total     int `gorm:"column:total"`
		Published int `gorm:"column:published"`
	}
	err = d.db.WithContext(ctx).Raw(`
		SELECT 
			COUNT(*) as total,
			COUNT(CASE WHEN publish_status IN ('published', 'change-auditing', 'change-reject') THEN 1 END) as published
		FROM af_data_catalog.t_data_catalog
		WHERE draft_id != 9527 
		  AND view_count > 0
		  AND online_status IN ('online', 'down-auditing', 'down-reject')
	`).Scan(&databaseStats).Error
	if err != nil {
		return nil, err
	}
	res.Entries = append(res.Entries, &domain.DataAssetsOverviewEntry{
		Category:  "database",
		Total:     databaseStats.Total,
		Published: &databaseStats.Published,
	})

	// 5. 接口统计（挂载了接口的数据目录数量）- 参考/api/data-catalog/v1/data-catalog接口逻辑
	var apiStats struct {
		Total     int `gorm:"column:total"`
		Published int `gorm:"column:published"`
		Online    int `gorm:"column:online"`
	}
	err = d.db.WithContext(ctx).Raw(`
		SELECT 
			COUNT(*) as total,
			COUNT(CASE WHEN publish_status IN ('published', 'change-auditing', 'change-reject') THEN 1 END) as published,
			COUNT(CASE WHEN publish_status IN ('published', 'change-auditing', 'change-reject') AND online_status IN ('online', 'down-auditing', 'down-reject') THEN 1 END) as online
		FROM af_data_catalog.t_data_catalog
		WHERE draft_id != 9527 
		  AND api_count > 0
		  AND online_status IN ('online', 'down-auditing', 'down-reject')
	`).Scan(&apiStats).Error
	if err != nil {
		return nil, err
	}
	res.Entries = append(res.Entries, &domain.DataAssetsOverviewEntry{
		Category:  "api",
		Total:     apiStats.Total,
		Published: &apiStats.Published,
		Online:    &apiStats.Online,
	})

	// 6. 文件统计（挂载了文件的数据目录数量）- 参考/api/data-catalog/v1/data-catalog接口逻辑
	var fileStats struct {
		Total     int `gorm:"column:total"`
		Published int `gorm:"column:published"`
	}
	err = d.db.WithContext(ctx).Raw(`
		SELECT 
			COUNT(*) as total,
			COUNT(CASE WHEN publish_status IN ('published', 'change-auditing', 'change-reject') THEN 1 END) as published
		FROM af_data_catalog.t_data_catalog
		WHERE draft_id != 9527 
		  AND file_count > 0
		  AND online_status IN ('online', 'down-auditing', 'down-reject')
	`).Scan(&fileStats).Error
	if err != nil {
		return nil, err
	}
	res.Entries = append(res.Entries, &domain.DataAssetsOverviewEntry{
		Category:  "file",
		Total:     fileStats.Total,
		Published: &fileStats.Published,
	})

	return res, nil
}

// DataAssetsDetail 数据资产部门详情统计
func (d *catalogRepo) DataAssetsDetail(ctx context.Context, req *domain.DataAssetsDetailReq) (res *domain.DataAssetsDetailRes, err error) {
	res = &domain.DataAssetsDetailRes{
		Entries: make([]*domain.DataAssetsDetailEntry, 0),
	}

	// 获取所有部门的统计数据
	departmentStats := make(map[string]*domain.DataAssetsDetailEntry)

	// 构建部门过滤条件
	var _ string
	var departmentArgs []interface{}
	if req.DepartmentID != "" {
		_ = "AND department_id = ?"
		departmentArgs = append(departmentArgs, req.DepartmentID)
	}

	// 1. 信息资源目录统计 - 只查询部门ID，名称由Domain层通过配置中心统一查询
	var infoResourceStats []struct {
		DepartmentID string `gorm:"column:department_id"`
		Count        int    `gorm:"column:count"`
	}
	infoResourceSQL := `
		SELECT 
			b.f_related_item_id AS department_id,
			COUNT(*) as count
		FROM af_data_catalog.t_info_resource_catalog a 
		LEFT JOIN af_data_catalog.t_info_resource_catalog_related_item b ON a.f_id = b.f_info_resource_catalog_id 
		WHERE b.f_related_item_id IS NOT NULL 
		  AND b.f_related_item_id != ''`

	if req.DepartmentID != "" {
		infoResourceSQL += " AND b.f_related_item_id = ?"
	}
	infoResourceSQL += " GROUP BY b.f_related_item_id"

	err = d.db.WithContext(ctx).Raw(infoResourceSQL, departmentArgs...).Scan(&infoResourceStats).Error
	if err != nil {
		return nil, err
	}
	for _, stat := range infoResourceStats {
		// 跳过空的部门ID
		if stat.DepartmentID == "" {
			continue
		}
		if departmentStats[stat.DepartmentID] == nil {
			departmentStats[stat.DepartmentID] = &domain.DataAssetsDetailEntry{
				DepartmentID:   stat.DepartmentID,
				DepartmentName: stat.DepartmentID, // 先设置为ID，Domain层会覆盖为真实名称
			}
		}
		departmentStats[stat.DepartmentID].InfoResourceCount = stat.Count
	}

	// 2. 数据资源目录统计 - 不添加online_status过滤，与概览接口的资源部门数统计保持一致
	var dataResourceStats []struct {
		DepartmentID string `gorm:"column:department_id"`
		Count        int    `gorm:"column:count"`
	}
	dataResourceSQL := `
		SELECT department_id, COUNT(*) as count
		FROM af_data_catalog.t_data_catalog 
		WHERE draft_id != 9527 
		  AND department_id IS NOT NULL 
		  AND department_id != ''`

	if req.DepartmentID != "" {
		dataResourceSQL += " AND department_id = ?"
	}
	dataResourceSQL += " GROUP BY department_id"

	err = d.db.WithContext(ctx).Raw(dataResourceSQL, departmentArgs...).Scan(&dataResourceStats).Error
	if err != nil {
		return nil, err
	}
	for _, stat := range dataResourceStats {
		// 跳过空的部门ID
		if stat.DepartmentID == "" {
			continue
		}
		if departmentStats[stat.DepartmentID] == nil {
			departmentStats[stat.DepartmentID] = &domain.DataAssetsDetailEntry{
				DepartmentID:   stat.DepartmentID,
				DepartmentName: stat.DepartmentID, // 先设置为ID，Domain层会覆盖为真实名称
			}
		}
		departmentStats[stat.DepartmentID].DataResourceCount = stat.Count
	}

	// 3. 库表统计（挂载了库表的数据目录数量，按部门分组）- 与DataAssetsOverview逻辑一致
	var databaseStats []struct {
		DepartmentID string `gorm:"column:department_id"`
		Count        int    `gorm:"column:count"`
	}
	databaseSQL := `
		SELECT department_id, COUNT(*) as count
		FROM af_data_catalog.t_data_catalog
		WHERE draft_id != 9527 
		  AND view_count > 0
		  AND online_status IN ('online', 'down-auditing', 'down-reject')
		  AND department_id IS NOT NULL 
		  AND department_id != ''`

	if req.DepartmentID != "" {
		databaseSQL += " AND department_id = ?"
	}
	databaseSQL += " GROUP BY department_id"

	err = d.db.WithContext(ctx).Raw(databaseSQL, departmentArgs...).Scan(&databaseStats).Error
	if err != nil {
		return nil, err
	}
	for _, stat := range databaseStats {
		// 跳过空的部门ID
		if stat.DepartmentID == "" {
			continue
		}
		if departmentStats[stat.DepartmentID] == nil {
			// 为库表数据创建新的部门条目
			departmentStats[stat.DepartmentID] = &domain.DataAssetsDetailEntry{
				DepartmentID:   stat.DepartmentID,
				DepartmentName: stat.DepartmentID, // 先设置为ID，Domain层会覆盖为真实名称
			}
		}
		departmentStats[stat.DepartmentID].DatabaseTableCount = stat.Count
	}

	// 4. 接口统计（挂载了接口的数据目录数量，按部门分组）- 与DataAssetsOverview逻辑一致
	var apiStats []struct {
		DepartmentID string `gorm:"column:department_id"`
		Count        int    `gorm:"column:count"`
	}
	apiSQL := `
		SELECT department_id, COUNT(*) as count
		FROM af_data_catalog.t_data_catalog
		WHERE draft_id != 9527 
		  AND api_count > 0
		  AND online_status IN ('online', 'down-auditing', 'down-reject')
		  AND department_id IS NOT NULL 
		  AND department_id != ''`

	if req.DepartmentID != "" {
		apiSQL += " AND department_id = ?"
	}
	apiSQL += " GROUP BY department_id"

	err = d.db.WithContext(ctx).Raw(apiSQL, departmentArgs...).Scan(&apiStats).Error
	if err != nil {
		return nil, err
	}
	for _, stat := range apiStats {
		// 跳过空的部门ID
		if stat.DepartmentID == "" {
			continue
		}
		if departmentStats[stat.DepartmentID] == nil {
			// 为接口数据创建新的部门条目
			departmentStats[stat.DepartmentID] = &domain.DataAssetsDetailEntry{
				DepartmentID:   stat.DepartmentID,
				DepartmentName: stat.DepartmentID, // 先设置为ID，Domain层会覆盖为真实名称
			}
		}
		departmentStats[stat.DepartmentID].APICount = stat.Count
	}

	// 5. 文件统计（挂载了文件的数据目录数量，按部门分组）- 与DataAssetsOverview逻辑一致
	var fileStats []struct {
		DepartmentID string `gorm:"column:department_id"`
		Count        int    `gorm:"column:count"`
	}
	fileSQL := `
		SELECT department_id, COUNT(*) as count
		FROM af_data_catalog.t_data_catalog
		WHERE draft_id != 9527 
		  AND file_count > 0
		  AND online_status IN ('online', 'down-auditing', 'down-reject')
		  AND department_id IS NOT NULL 
		  AND department_id != ''`

	if req.DepartmentID != "" {
		fileSQL += " AND department_id = ?"
	}
	fileSQL += " GROUP BY department_id"

	err = d.db.WithContext(ctx).Raw(fileSQL, departmentArgs...).Scan(&fileStats).Error
	if err != nil {
		return nil, err
	}
	for _, stat := range fileStats {
		// 跳过空的部门ID
		if stat.DepartmentID == "" {
			continue
		}
		if departmentStats[stat.DepartmentID] == nil {
			// 为文件数据创建新的部门条目
			departmentStats[stat.DepartmentID] = &domain.DataAssetsDetailEntry{
				DepartmentID:   stat.DepartmentID,
				DepartmentName: stat.DepartmentID, // 先设置为ID，Domain层会覆盖为真实名称
			}
		}
		departmentStats[stat.DepartmentID].FileCount = stat.Count
	}

	// 转换为切片（过滤掉空的部门ID）
	allEntries := make([]*domain.DataAssetsDetailEntry, 0)
	for departmentID, entry := range departmentStats {
		// 过滤掉部门ID为空的数据
		if departmentID == "" {
			continue
		}
		allEntries = append(allEntries, entry)
	}

	// 不在Repository层分页，返回所有数据，由Domain层去重后再分页
	res.Entries = allEntries
	res.TotalCount = int64(len(allEntries))

	return res, nil
}

func (d *catalogRepo) DataUnderstandOverview(ctx context.Context, req *domain.DataUnderstandOverviewReq) *domain.DataUnderstandOverviewRes {
	res := &domain.DataUnderstandOverviewRes{
		Errors: make([]string, 0),
	}

	sql := `
		select count(distinct  department_id)   from t_data_comprehension_details tdcd  inner join  t_data_catalog tdc  on tdcd.catalog_id =tdc.id  where view_count >0  %s
	`
	myDepartment := "and department_id in  ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "DepartmentCount ", &res.DepartmentCount)

	sql = `
		select count(1)   from   t_data_catalog tdc  where view_count >0 and pu %s
	`
	myDepartment = "and department_id in ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "ViewCatalogCount ", &res.ViewCatalogCount)

	sql = `
		select count(1)   from   af_data_catalog.t_data_resource r inner join af_main.form_view v   on r.resource_id =v.id  where r.type=1 and  r.catalog_id>0  and v.online_status in ('online','down-auditing','down-reject')
	`
	if len(req.SubDepartmentIDs) > 0 {
		sql = `
			select count(1)   from   af_data_catalog.t_data_catalog c inner join  af_data_catalog.t_data_resource r on c.id=r.catalog_id  inner join af_main.form_view v   on r.resource_id =v.id  where r.type=1 and  r.catalog_id>0  and v.online_status in ('online','down-auditing','down-reject') and c.department_id in ?
		`
	}
	if len(req.SubDepartmentIDs) > 0 {
		if err := d.db.WithContext(ctx).Raw(sql, req.SubDepartmentIDs).Scan(&res.ViewCatalogCount).Error; err != nil {
			res.Errors = append(res.Errors, "ViewCatalogCount "+err.Error())
		}
	} else {
		if err := d.db.WithContext(ctx).Raw(sql).Scan(&res.ViewCatalogCount).Error; err != nil {
			res.Errors = append(res.Errors, "ViewCatalogCount "+err.Error())
		}
	}

	sql = `
		select count(1)   from t_data_comprehension_details tdcd  inner join  t_data_catalog tdc  on tdcd.catalog_id =tdc.id where view_count >0 %s
	`
	myDepartment = "and department_id in ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "ViewCatalogCount ", &res.ViewCatalogUnderstandCount)
	res.ViewCatalogNotUnderstandCount = res.ViewCatalogCount - res.ViewCatalogUnderstandCount

	res.UnderstandTask = make([]*domain.Task, 0)
	sql = `
		select  tt.status,count(tt.status) count  from  af_tasks.tc_task tt  left join  af_tasks.work_order wo on wo.work_order_id =tt.work_order_id  where  wo.type =1 %s
	`
	myDepartment = "and department_id in ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "UnderstandTask ", &res.UnderstandTask)
	if len(res.UnderstandTask) > 0 {
		for _, task := range res.UnderstandTask {
			res.UnderstandTaskCount += task.Count
		}
	}
	domainDetails := make([]string, 0)
	sql = `
		select details  from t_data_comprehension_details tdcd inner join  t_data_catalog tdc  on tdcd.catalog_id =tdc.id where view_count >0 %s
	`
	myDepartment = "and department_id in ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "domin ", &domainDetails)
	res.CatalogDomainGroup = make(map[string]int)
	for _, detail := range domainDetails {
		if detail != "" {
			var comprehensionDetail data_comprehension.ComprehensionDetail
			if err := json.Unmarshal([]byte(detail), &comprehensionDetail); err != nil {
				continue
			}
			for _, dimension := range comprehensionDetail.ComprehensionDimensions[1].Children {
				if dimension.Id == "28" {
					res.CatalogDomainGroup[ToDomain(dimension.Detail.Content)]++
				}
			}
		}
	}
	res.ViewDomainGroup = res.CatalogDomainGroup

	subjectDomainDetails := make([]string, 0)
	sql = `
		select details  from t_data_comprehension_details tdcd inner join  t_data_catalog tdc  on tdcd.catalog_id =tdc.id right join t_data_catalog_category tdcc on tdcc.catalog_id =tdc.id  and tdcc.category_type =3 where view_count >0  %s
	`
	myDepartment = "and department_id in ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "SubjectDomainGroup ", &subjectDomainDetails)
	res.SubjectDomainGroup = make(map[string]int)
	for _, detail := range subjectDomainDetails {
		if detail != "" {
			var comprehensionDetail data_comprehension.ComprehensionDetail
			if err := json.Unmarshal([]byte(detail), &comprehensionDetail); err != nil {
				continue
			}
			for _, dimension := range comprehensionDetail.ComprehensionDimensions[1].Children {
				if dimension.Id == "28" {
					res.SubjectDomainGroup[ToDomain(dimension.Detail.Content)]++
				}
			}
		}
	}

	res.DepartmentUnderstand = make([]*domain.SubjectGroup, 0)
	sql = `
		select tdcc.category_id subject_id,sd.name  subject_name  ,count(distinct department_id) count  from t_data_comprehension_details tdcd inner join  t_data_catalog tdc  on tdcd.catalog_id =tdc.id right join t_data_catalog_category tdcc on tdcc.catalog_id =tdc.id inner join  af_main.subject_domain sd  on tdcc.category_id =sd.id    and tdcc.category_type =3 where view_count >0 %s group  by tdcc.category_id 
	`
	myDepartment = "and department_id in ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "DepartmentUnderstand ", &res.DepartmentUnderstand)
	res.CompletedUnderstand = make([]*domain.SubjectGroup, 0)
	sql = `
		select tdcc.category_id subject_id,sd.name  subject_name  ,count(1)  count  from t_data_comprehension_details tdcd inner join  t_data_catalog tdc  on tdcd.catalog_id =tdc.id right join t_data_catalog_category tdcc on tdcc.catalog_id =tdc.id inner join  af_main.subject_domain sd  on tdcc.category_id =sd.id    and tdcc.category_type =3 where view_count >0 %s group  by tdcc.category_id  
	`
	myDepartment = "and department_id in ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "CompletedUnderstand ", &res.CompletedUnderstand)
	allCatalogSubjectGroup := make([]*domain.SubjectGroup, 0)
	sql = `
		  select tdcc.category_id subject_id,sd.name  subject_name  ,count(1)  count  from   t_data_catalog tdc   right join t_data_catalog_category tdcc on tdcc.catalog_id =tdc.id inner join  af_main.subject_domain sd  on tdcc.category_id =sd.id    and tdcc.category_type =3 where view_count >0  %s group  by tdcc.category_id 
	`
	myDepartment = "and department_id in ?"
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "UnderstandNotCompletedSubjectGroup ", &allCatalogSubjectGroup)
	for _, subject := range allCatalogSubjectGroup {
		notCompletedCount := subject.Count
		for _, completedSubject := range res.CompletedUnderstand {
			if subject.SubjectID == completedSubject.SubjectID {
				notCompletedCount -= completedSubject.Count
			}
		}
		if subject.Count > 0 {
			res.NotCompletedUnderstand = append(res.NotCompletedUnderstand, &domain.SubjectGroup{
				Count:       notCompletedCount,
				SubjectID:   subject.SubjectID,
				SubjectName: subject.SubjectName,
			})
			res.CompletedRate = append(res.CompletedRate, &domain.CompletedRate{
				Count:       float64(subject.Count-notCompletedCount) * 100 / float64(subject.Count),
				SubjectID:   subject.SubjectID,
				SubjectName: subject.SubjectName,
			})
		}
	}

	return res
}

// CategoryData 表示分类数据结构
type CategoryData struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

func ToDomain(content any) string {
	jsonData, err := json.Marshal(content)
	if err != nil {
		return ""
	}

	var result [][]CategoryData
	err = json.Unmarshal(jsonData, &result)
	if err != nil {
		return ""
	}

	if len(result) > 0 && len(result[0]) > 0 {
		return result[0][0].Name
	}
	return ""
}

func (d *catalogRepo) DataUnderstandDepartTopOverview(ctx context.Context, req *domain.DataUnderstandDepartTopOverviewReq) (res []*domain.DataUnderstandDepartTopOverview, totalCount int64, err error) {
	sql := `
		SELECT 
			final_stats.department_id,
			final_stats.name,
			final_stats.completed_count,
			final_stats.uncompleted_count,
			final_stats.total_count,
			CASE 
				WHEN final_stats.total_count > 0 THEN 
					ROUND((final_stats.completed_count * 100.0 / final_stats.total_count), 2)
				ELSE 0 
			END AS completion_rate
		FROM (
			SELECT 
				dept_data.department_id,
				MAX(dept_data.name) AS name,
				MAX(dept_data.completed_count) AS completed_count,
				MAX(dept_data.uncompleted_count) AS uncompleted_count,
				(MAX(dept_data.completed_count) + MAX(dept_data.uncompleted_count)) AS total_count
			FROM (
				-- 已完成的部门数据
				SELECT 
					tdc.department_id,
					o.name,
					COUNT(1) AS completed_count,
					0 AS uncompleted_count
				FROM t_data_comprehension_details tdcd 
				INNER JOIN t_data_catalog tdc ON tdcd.catalog_id = tdc.id 
				INNER JOIN af_configuration.object o ON tdc.department_id = o.id 
				WHERE tdc.view_count > 0 %s
				GROUP BY tdc.department_id, o.name
				
				UNION ALL
				
				-- 未完成的部门数据
				SELECT 
					tdc.department_id,
					o.name,
					0 AS completed_count,
					COUNT(1) AS uncompleted_count
				FROM t_data_comprehension_details tdcd 
				RIGHT JOIN t_data_catalog tdc ON tdcd.catalog_id = tdc.id    
				LEFT JOIN af_configuration.object o ON tdc.department_id = o.id
				WHERE tdc.view_count > 0 AND tdcd.catalog_id IS NULL  %s
				GROUP BY tdc.department_id, o.name
			) dept_data
			GROUP BY dept_data.department_id
			HAVING (MAX(dept_data.completed_count) + MAX(dept_data.uncompleted_count)) > 0
		) final_stats
		ORDER BY %s %s
		LIMIT %d OFFSET %d;
    `
	countSql := `
		SELECT 
			count(1)
		FROM (
			SELECT 
				dept_data.department_id,
				MAX(dept_data.name) AS name,
				MAX(dept_data.completed_count) AS completed_count,
				MAX(dept_data.uncompleted_count) AS uncompleted_count,
				(MAX(dept_data.completed_count) + MAX(dept_data.uncompleted_count)) AS total_count
			FROM (
				-- 已完成的部门数据
				SELECT 
					tdc.department_id,
					o.name,
					COUNT(1) AS completed_count,
					0 AS uncompleted_count
				FROM t_data_comprehension_details tdcd 
				INNER JOIN t_data_catalog tdc ON tdcd.catalog_id = tdc.id 
				INNER JOIN af_configuration.object o ON tdc.department_id = o.id 
				WHERE tdc.view_count > 0 %s
				GROUP BY tdc.department_id, o.name
				
				UNION ALL
				
				-- 未完成的部门数据
				SELECT 
					tdc.department_id,
					o.name,
					0 AS completed_count,
					COUNT(1) AS uncompleted_count
				FROM t_data_comprehension_details tdcd 
				RIGHT JOIN t_data_catalog tdc ON tdcd.catalog_id = tdc.id    
				LEFT JOIN af_configuration.object o ON tdc.department_id = o.id
				WHERE tdc.view_count > 0 AND tdcd.catalog_id IS NULL  %s
				GROUP BY tdc.department_id, o.name
			) dept_data
			GROUP BY dept_data.department_id
			HAVING (MAX(dept_data.completed_count) + MAX(dept_data.uncompleted_count)) > 0
		) final_stats
   `

	s := ""
	if len(req.SubDepartmentIDs) > 0 {
		s = "and tdc.department_id in (?)"
	}
	sql = fmt.Sprintf(sql, s, s, req.Sort, req.Direction, req.Limit, req.Limit*(req.Offset-1))
	countSql = fmt.Sprintf(countSql, s, s)
	if len(req.SubDepartmentIDs) > 0 {
		if err = d.db.WithContext(ctx).Raw(sql, req.SubDepartmentIDs, req.SubDepartmentIDs).Scan(&res).Error; err != nil {
			return
		}
		if err = d.db.WithContext(ctx).Raw(countSql, req.SubDepartmentIDs, req.SubDepartmentIDs).Scan(&totalCount).Error; err != nil {
			return
		}
	} else {
		if err = d.db.WithContext(ctx).Raw(sql).Scan(&res).Error; err != nil {
			return
		}
		if err = d.db.WithContext(ctx).Raw(countSql).Scan(&totalCount).Error; err != nil {
			return
		}
	}

	return
}
func (d *catalogRepo) DataUnderstandDomainOverview(ctx context.Context, req *domain.DataUnderstandDomainOverviewReq) (res *domain.DataUnderstandDomainOverviewRes, err error) {
	domainDetails := make([]string, 0)
	sql := `
		select details  from t_data_comprehension_details tdcd inner join  t_data_catalog tdc  on tdcd.catalog_id =tdc.id where view_count >0 %s
	`
	myDepartmentWhere := ""
	if len(req.SubDepartmentIDs) > 0 {
		myDepartmentWhere = "and tdc.department_id in (?)"
	}
	sql = fmt.Sprintf(sql, myDepartmentWhere)
	if len(req.SubDepartmentIDs) > 0 {
		if err = d.db.WithContext(ctx).Raw(sql, req.SubDepartmentIDs).Scan(&domainDetails).Error; err != nil {
			return
		}
	} else {
		if err = d.db.WithContext(ctx).Raw(sql).Scan(&domainDetails).Error; err != nil {
			return
		}
	}

	catalogIdMap := make(map[string][]uint64, 0)
	for _, detail := range domainDetails {
		if detail != "" {
			var comprehensionDetail data_comprehension.ComprehensionDetail
			if err := json.Unmarshal([]byte(detail), &comprehensionDetail); err != nil {
				continue
			}
			for _, dimension := range comprehensionDetail.ComprehensionDimensions[1].Children {
				if dimension.Id == "28" {
					domainName := ToDomain(dimension.Detail.Content)
					if _, exist := catalogIdMap[domainName]; !exist {
						catalogIdMap[domainName] = []uint64{comprehensionDetail.CatalogID.Uint64()}
					} else {
						catalogIdMap[domainName] = append(catalogIdMap[domainName], comprehensionDetail.CatalogID.Uint64())
					}
				}
			}
		}
	}
	res = &domain.DataUnderstandDomainOverviewRes{
		CatalogInfo: make(map[string][]*domain.DomainCatalogInfo, 0),
	}
	for domainName, catalogIds := range catalogIdMap {
		infos := make([]*domain.DomainCatalogInfo, 0)
		if err = d.db.WithContext(ctx).Table("t_data_catalog").Where("id in (?)", catalogIds).Find(&infos).Error; err != nil {
			return
		}
		res.CatalogInfo[domainName] = infos
	}
	return
}
func (d *catalogRepo) DataUnderstandTaskDetailOverview(ctx context.Context, req *domain.DataUnderstandTaskDetailOverviewReq) (res *domain.DataUnderstandTaskDetailOverviewRes, err error) {

	task := make([]*domain.Task, 0)
	sql := `
		select tt.status,count(tt.status) count from  af_tasks.tc_task tt left join af_tasks.work_order wo on wo.work_order_id =tt.work_order_id  where  wo.type =1 and tt.created_at >? and  tt.created_at<?  %s  group  by  tt.status 
	`
	myDepartmentWhere := ""
	if len(req.SubDepartmentIDs) > 0 {
		myDepartmentWhere = "and wo.department_id in (?)"
	}
	sql = fmt.Sprintf(sql, myDepartmentWhere)
	if len(req.SubDepartmentIDs) > 0 {
		if err = d.db.WithContext(ctx).Raw(sql, req.StartTime, req.EndTime, req.SubDepartmentIDs).Scan(&task).Error; err != nil {
			return
		}
	} else {
		if err = d.db.WithContext(ctx).Raw(sql, req.StartTime, req.EndTime).Scan(&task).Error; err != nil {
			return
		}
	}
	if len(task) > 0 {
		var totalCount int
		for _, t := range task {
			totalCount += t.Count
		}
		task = append(task, &domain.Task{Status: 999, Count: totalCount})
	} else {
		task = append(task, &domain.Task{Status: 1, Count: 0})
		task = append(task, &domain.Task{Status: 2, Count: 0})
		task = append(task, &domain.Task{Status: 3, Count: 0})
		task = append(task, &domain.Task{Status: 999, Count: 0})
	}

	res = &domain.DataUnderstandTaskDetailOverviewRes{
		Task: task,
	}
	return
}
func (d *catalogRepo) DataUnderstandDepartDetailOverview(ctx context.Context, req *domain.DataUnderstandDepartDetailOverviewReq) (res []*domain.DataUnderstandDepartDetail, totalCount int64, err error) {
	res = make([]*domain.DataUnderstandDepartDetail, 0)
	sql := `
		SELECT tdc.id,tdc.sync_mechanism, title, view_count,file_count,api_count,department_id, o.name department_name, update_cycle,tdc.updated_at  from t_data_comprehension_details tdcd inner join  t_data_catalog tdc  on tdcd.catalog_id =tdc.id inner join af_configuration.object o on tdc.department_id =o.id where view_count >0  %s LIMIT %d OFFSET %d
	`
	countSql := `
		SELECT count(1)  from t_data_comprehension_details tdcd inner join  t_data_catalog tdc  on tdcd.catalog_id =tdc.id inner join af_configuration.object o on tdc.department_id =o.id where view_count >0  %s
	`
	if !req.Understand {
		sql = `
			SELECT tdc.id,tdc.sync_mechanism, title, view_count,file_count,api_count,department_id, o.name department_name, update_cycle,tdc.updated_at  from t_data_comprehension_details tdcd right join  t_data_catalog tdc  on tdcd.catalog_id =tdc.id  inner join af_configuration.object o on tdc.department_id =o.id  where view_count >0 and tdcd.catalog_id is null %s LIMIT %d OFFSET %d
		`
		countSql = `
			SELECT  count(1) from t_data_comprehension_details tdcd right join  t_data_catalog tdc  on tdcd.catalog_id =tdc.id  inner join af_configuration.object o on tdc.department_id =o.id  where view_count >0 and tdcd.catalog_id is null %s
		`
	}
	myDepartmentWhere := ""
	if len(req.SubDepartmentIDs) > 0 {
		myDepartmentWhere = "and tdc.department_id in (?)"
	}
	sql = fmt.Sprintf(sql, myDepartmentWhere, req.Limit, req.Limit*(req.Offset-1))
	countSql = fmt.Sprintf(countSql, myDepartmentWhere)

	if len(req.SubDepartmentIDs) > 0 {
		if err = d.db.WithContext(ctx).Raw(sql, req.SubDepartmentIDs).Scan(&res).Error; err != nil {
			return
		}
		if err = d.db.WithContext(ctx).Raw(countSql, req.SubDepartmentIDs).Scan(&totalCount).Error; err != nil {
			return
		}
	} else {
		if err = d.db.WithContext(ctx).Raw(sql).Scan(&res).Error; err != nil {
			return
		}
		if err = d.db.WithContext(ctx).Raw(countSql).Scan(&totalCount).Error; err != nil {
			return
		}
	}
	return

}
func (d *catalogRepo) GetReportByViewIds(ctx context.Context, viewId ...string) (report []*data_resource_catalog.Report, err error) {
	err = d.db.WithContext(ctx).Table("af_data_exploration.t_report").Where("f_table_id in ? and f_latest =1 and f_status = 3", viewId).Find(&report).Error
	return
}
func (d *catalogRepo) GetApplyDepartmentNum(ctx context.Context, catalogIDS []uint64) (count []*data_resource_catalog.GetApplyDepartmentNumRes, err error) {
	sql := `
		SELECT i.res_id id ,count(distinct apply_org_code) count from af_demand_management.t_share_apply_res_item  i inner join af_demand_management.t_share_apply a on i.share_apply_id =a.id where i.res_type=1 and a.status =12 and analysed_flag =true and implemented_flag =true and i.analysis_id is null and i.res_id in ? group by i.res_id  
	`
	if err = d.db.WithContext(ctx).Raw(sql, catalogIDS).Scan(&count).Error; err != nil {
		return
	}
	return
}
