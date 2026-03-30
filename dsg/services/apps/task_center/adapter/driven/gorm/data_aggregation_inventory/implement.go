package data_aggregation_inventory

import (
	"context"
	"log"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	task_center_v1 "github.com/kweaver-ai/idrm-go-common/api/task_center/v1"
	"github.com/kweaver-ai/idrm-go-common/util/sets"
)

type repository struct {
	db *gorm.DB
}

// Ensure repository implements the Repository interface.
var _ Repository = (*repository)(nil)

func New(data *db.Data) Repository {
	return &repository{
		db: data.DB,
	}
}

// Create implements Repository.
func (r *repository) Create(ctx context.Context, inventory *task_center_v1.DataAggregationInventory) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		record := convertDataAggregationInventory_V1ToModel(inventory)
		if err := tx.Create(record).Error; err != nil {
			// TODO: 区分错误
			return err
		}
		if err := reconcileDataAggregationResources(tx, inventory.ID, record.Resources); err != nil {
			return err
		}
		return nil
	})
}

// Delete implements Repository.
func (r *repository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 删除 DataAggregationInventory
		if err := tx.Delete(&model.DataAggregationInventory{ID: id}).Error; err != nil {
			// TODO: 区分错误
			return err
		}

		// 级联删除 DataAggregationResource
		resource := &model.DataAggregationResource{DataAggregationInventoryID: id}
		if err := tx.Where(resource).Delete(resource).Error; err != nil {
			// TODO: 区分错误
			return err
		}
		return nil
	})
}

// Update implements Repository.
func (r *repository) Update(ctx context.Context, id string, tryUpdate UpdateFunc) (*task_center_v1.DataAggregationInventory, error) {
	inventory := &task_center_v1.DataAggregationInventory{}

	if err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		record := &model.DataAggregationInventory{}

		// 获取已经存在的 DataAggregationInventory
		if err := tx.Where(&model.DataAggregationInventory{ID: id}).Take(record).Error; err != nil {
			// TODO: 区分错误
			return err
		}
		// 获取已经存在的 DataAggregationResource
		if err := tx.Where(&model.DataAggregationResource{DataAggregationInventoryID: id}).Find(&record.Resources).Error; err != nil {
			// TODO: 区分错误
			return err
		}

		convertDataAggregationInventory_ModelIntoV1(record, inventory)
		if err := tryUpdate(inventory); err != nil {
			return err
		}
		record = convertDataAggregationInventory_V1ToModel(inventory)
		if err := tx.Save(record).Error; err != nil {
			// TODO: 区分错误
			return err
		}
		if err := reconcileDataAggregationResources(tx, inventory.ID, record.Resources); err != nil {
			return err
		}

		return nil
	}); err != nil {
		return nil, err
	}

	return inventory, nil
}

// UpdateByApplyID implements Repository.
func (r *repository) UpdateByApplyID(ctx context.Context, id string, tryUpdate UpdateFunc) (*task_center_v1.DataAggregationInventory, error) {
	inventory := &task_center_v1.DataAggregationInventory{}

	if err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		record := &model.DataAggregationInventory{}

		// 获取已经存在的 DataAggregationInventory
		if err := tx.Where(&model.DataAggregationInventory{ApplyID: id}).Take(record).Error; err != nil {
			// TODO: 区分错误
			return err
		}
		// 获取已经存在的 DataAggregationResource
		if err := tx.Where(&model.DataAggregationResource{DataAggregationInventoryID: id}).Find(&record.Resources).Error; err != nil {
			// TODO: 区分错误
			return err
		}

		convertDataAggregationInventory_ModelIntoV1(record, inventory)
		if err := tryUpdate(inventory); err != nil {
			return err
		}
		record = convertDataAggregationInventory_V1ToModel(inventory)
		if err := tx.Save(record).Error; err != nil {
			// TODO: 区分错误
			return err
		}
		if err := reconcileDataAggregationResources(tx, inventory.ID, record.Resources); err != nil {
			return err
		}

		return nil
	}); err != nil {
		return nil, err
	}

	return inventory, nil
}

// UpdateByStatus implements Repository.
func (r *repository) UpdateByStatus(ctx context.Context, status task_center_v1.DataAggregationInventoryStatus, tryUpdate UpdateFunc) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var records []model.DataAggregationInventory

		// 获取已经存在的 DataAggregationInventory
		if err := tx.Where(&model.DataAggregationInventory{Status: convertDataAggregationInventoryStatus_V1ToModel(status)}).Find(&records).Error; err != nil {
			// TODO: 区分错误
			return err
		}

		for _, r := range records {
			// 获取已经存在的 DataAggregationResource
			if err := tx.Where(&model.DataAggregationResource{DataAggregationInventoryID: r.ID}).Find(&r.Resources).Error; err != nil {
				// TODO: 区分错误
				return err
			}

			inventory := convertDataAggregationInventory_ModelToV1(&r)
			if err := tryUpdate(inventory); err != nil {
				return err
			}

			r := convertDataAggregationInventory_V1ToModel(inventory)
			if err := tx.Save(r).Error; err != nil {
				// TODO: 区分错误
				return err
			}

			if err := reconcileDataAggregationResources(tx, inventory.ID, r.Resources); err != nil {
				return err
			}
		}
		return nil
	})
}

// 更新状态
func (r *repository) UpdateStatus(ctx context.Context, id string, s task_center_v1.DataAggregationInventoryStatus) error {
	return r.db.WithContext(ctx).
		Model(&model.DataAggregationInventory{ID: id}).
		Where(&model.DataAggregationInventory{ID: id}).
		Update("status", convertDataAggregationInventoryStatus_V1ToModel(s)).
		Error
}

// 更新审核状态，根据 ApplyID
func (r *repository) UpdateStatusByApplyID(ctx context.Context, applyID string, s task_center_v1.DataAggregationInventoryStatus) error {
	return r.db.WithContext(ctx).
		Model(&model.DataAggregationInventory{}).
		Where(&model.DataAggregationInventory{ApplyID: applyID}).
		Update("status", convertDataAggregationInventoryStatus_V1ToModel(s)).
		Error
}

// Get implements Repository.
func (r *repository) Get(ctx context.Context, id string) (*task_center_v1.DataAggregationInventory, error) {
	record := &model.DataAggregationInventory{ID: id}

	if err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where(record).Take(record).Error; err != nil {
			// TODO: 区分错误
			return err
		}

		if err := tx.Where(&model.DataAggregationResource{DataAggregationInventoryID: id}).Find(&record.Resources).Error; err != nil {
			// TODO: 区分错误
			return err
		}

		return nil
	}); err != nil {
		return nil, err
	}

	return convertDataAggregationInventory_ModelToV1(record), nil
}

// List implements Repository.
func (r *repository) List(ctx context.Context, opts *task_center_v1.DataAggregationInventoryListOptions) (*task_center_v1.DataAggregationInventoryList, error) {
	tx := r.db.WithContext(ctx).Model(&model.DataAggregationInventory{})

	if opts.Keyword != "" && len(opts.Fields) != 0 {
		log.Printf("DEBUG.repository.List")
		tx = tx.Where(util.GormAnyColumnsContainKeyword(opts.Fields, opts.Keyword))
	}
	if len(opts.Statuses) != 0 {
		expr := clause.IN{Column: tx.Statement.Quote("status")}
		for _, s := range opts.Statuses {
			expr.Values = append(expr.Values, convertDataAggregationInventoryStatus_V1ToModel(s))
		}
		tx.Statement.AddClause(&clause.Where{
			Exprs: []clause.Expression{
				expr,
			},
		})
	}
	if len(opts.DepartmentIDs) != 0 {
		tx = tx.Where("department_id IN ?", opts.DepartmentIDs)
	}

	var count int64
	if tx = tx.Count(&count); tx.Error != nil {
		return nil, tx.Error
	}

	if opts.Limit != 0 {
		tx = tx.Limit(opts.Limit)
	}
	if opts.Offset > 0 {
		tx = tx.Offset((opts.Offset - 1) * opts.Limit)
	}
	if opts.Sort != "" {
		tx = tx.Order(clause.OrderByColumn{Column: clause.Column{Name: opts.Sort}, Desc: opts.Direction == meta_v1.Descending})
	}

	var records []model.DataAggregationInventory
	tx = tx.Find(&records)
	if tx.Error != nil {
		return nil, tx.Error
	}
	// TODO: 合并为一次查询
	for i, inventory := range records {
		err := r.db.WithContext(ctx).
			Where(&model.DataAggregationResource{DataAggregationInventoryID: inventory.ID}).
			Find(&records[i].Resources).
			Error
		if err != nil {
			return nil, err
		}
	}

	return &task_center_v1.DataAggregationInventoryList{
		Entries:    convertDataAggregationInventories_ModelToV1(records),
		TotalCount: int(count),
	}, nil
}

// 更新 DataAggregationInventory 的 Resources，使数据库记录与期望相同
func reconcileDataAggregationResources(tx *gorm.DB, inventoryID string, resources []model.DataAggregationResource) error {
	tx = tx.Model(&model.DataAggregationResource{})

	// 期望的逻辑视图 ID 集合
	var expectDataViewIDS = sets.New[string]()
	for _, r := range resources {
		expectDataViewIDS.Insert(r.DataViewID)
	}

	// 实际的资源列表
	var actual []model.DataAggregationResource
	if err := tx.Where(&model.DataAggregationResource{DataAggregationInventoryID: inventoryID}).Find(&actual).Error; err != nil {
		// TODO: 区分错误
		return err
	}

	// 实际的 DataAggregationResource 的 DataViewID 和 ID 的映射关系
	var actualDataViewIDToID = make(map[string]string)
	for _, r := range actual {
		actualDataViewIDToID[r.DataViewID] = r.ID
	}

	// 需要 Create 或 Update 的 DataAggregationResource 列表
	var resourcesToCreateOrUpdate []model.DataAggregationResource
	for _, r := range resources {
		r.ID = actualDataViewIDToID[r.DataViewID]
		resourcesToCreateOrUpdate = append(resourcesToCreateOrUpdate, r)
	}

	// 创建 OR 更新
	if len(resourcesToCreateOrUpdate) != 0 {
		if err := tx.Save(resourcesToCreateOrUpdate).Error; err != nil {
			// TODO: 区分错误
			return err
		}
	}

	// 需要删除的 DataAggregationResource ID 列表
	var resourceIDsToDelete []string
	for _, r := range actual {
		if expectDataViewIDS.Has(r.DataViewID) {
			continue
		}
		resourceIDsToDelete = append(resourceIDsToDelete, r.ID)
	}
	if len(resourceIDsToDelete) == 0 {
		// 没有需要删除的 DataAggregationResource
		return nil
	}

	// 删除
	if err := tx.Delete(&model.DataAggregationResource{}, resourceIDsToDelete).Error; err != nil {
		// TODO: 区分错误
		return err
	}

	return nil
}

func (r *repository) QueryDataTable(ctx context.Context, ids []string) (rs []*model.DataAggregationResource, err error) {
	err = r.db.WithContext(ctx).Where("business_form_id in ?", ids).Order("updated_at desc").Find(&rs).Error
	return rs, err
}

// 检查归集清单名称是否存在
func (r *repository) CheckName(ctx context.Context, name, id string) (ok bool, err error) {
	var count int64
	if id == "" {
		if err = r.db.WithContext(ctx).
			Model(&model.DataAggregationInventory{}).
			Where(&model.DataAggregationInventory{Name: name}).
			Count(&count).Error; err != nil {
			return
		}
	} else {
		if err = r.db.WithContext(ctx).
			Model(&model.DataAggregationInventory{}).
			Where("name = ? and id != ?", name, id).
			Count(&count).Error; err != nil {
			return
		}
	}
	ok = count > 0
	return
}
