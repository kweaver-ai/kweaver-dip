package data_aggregation_resource

import (
	"context"

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/util/sets"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type Client struct {
	DB *gorm.DB
}

var _ Interface = &Client{}

func New(data *db.Data) Interface { return &Client{DB: data.DB} }

// 更新归集清单相关的资源（逻辑视图），使数据库记录与期望相同
func (c *Client) ReconcileByDataInventoryID(ctx context.Context, dataInventoryID string, resources []model.DataAggregationResource) error {
	return c.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		tx = tx.Model(&model.DataAggregationResource{})

		// 期望的逻辑视图 ID 集合
		var expectDataViewIDS = sets.New[string]()
		for _, r := range resources {
			expectDataViewIDS.Insert(r.DataViewID)
		}

		// 实际的资源列表
		var actual []model.DataAggregationResource
		if err := tx.Where(&model.DataAggregationResource{DataAggregationInventoryID: dataInventoryID}).Find(&actual).Error; err != nil {
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
	})
}

// 更新归集工单相关的资源（逻辑视图），使数据库记录与期望相同
func (c *Client) ReconcileByWorkOrderID(ctx context.Context, workOrderID string, resources []model.DataAggregationResource) error {
	return c.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		tx = tx.Model(&model.DataAggregationResource{})

		// 期望的逻辑视图 ID 集合
		var expectDataViewIDS = sets.New[string]()
		for _, r := range resources {
			expectDataViewIDS.Insert(r.DataViewID)
		}

		// 实际的资源列表
		var actual []model.DataAggregationResource
		if err := tx.Where(&model.DataAggregationResource{WorkOrderID: workOrderID}).Find(&actual).Error; err != nil {
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
		for _, r := range resourcesToCreateOrUpdate {
			log.Info("create or update", zap.String("dataViewID", r.DataViewID), zap.String("id", r.ID))
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
		for _, id := range resourceIDsToDelete {
			log.Info("delete", zap.String("id", id))
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
	})
}

// ListByDataAggregationInventoryID 获取列表，根据数据归集清单 ID
func (c *Client) ListByDataAggregationInventoryID(ctx context.Context, id string) ([]model.DataAggregationResource, error) {
	return ListByDataAggregationInventoryID(c.DB.WithContext(ctx), id)
}

// ListByWorkOrderID 获取列表，根据工单 ID
func (c *Client) ListByWorkOrderID(ctx context.Context, id string) ([]model.DataAggregationResource, error) {
	return ListByWorkOrderID(c.DB.WithContext(ctx), id)
}
