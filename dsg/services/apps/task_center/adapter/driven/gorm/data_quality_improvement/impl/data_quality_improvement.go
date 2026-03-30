package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_quality_improvement"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"gorm.io/gorm"
)

type DataQualityImprovementRepo struct {
	data *db.Data
}

func NewDataQualityImprovementRepo(data *db.Data) data_quality_improvement.Repo {
	return &DataQualityImprovementRepo{data: data}
}

func (r *DataQualityImprovementRepo) BatchCreate(ctx context.Context, improvements []*model.DataQualityImprovement) error {
	return r.data.DB.WithContext(ctx).Model(&model.DataQualityImprovement{}).CreateInBatches(improvements, 1000).Error
}

func (r *DataQualityImprovementRepo) Update(ctx context.Context, workOrderId string, newImprovements []*model.DataQualityImprovement) error {
	err := r.data.DB.Transaction(func(tx *gorm.DB) error {
		// 查询数据库中已有的数据
		var oldDatas []*model.DataQualityImprovement
		if err := tx.Where("work_order_id = ?", workOrderId).Find(&oldDatas).Error; err != nil {
			return err
		}

		// 将旧数据的 ID 存入 map，方便快速查找
		oldImprovementMap := make(map[string]*model.DataQualityImprovement)
		for _, improvement := range oldImprovementMap {
			oldImprovementMap[improvement.RuleID] = improvement
		}

		// 将新数据的 ID 存入 map，方便快速查找
		newImprovementMap := make(map[string]*model.DataQualityImprovement)
		for _, improvement := range newImprovements {
			newImprovementMap[improvement.RuleID] = improvement
		}

		// 插入新增的数据
		for _, improvement := range newImprovements {
			if _, exists := oldImprovementMap[improvement.RuleID]; !exists {
				if err := tx.Create(&improvement).Error; err != nil {
					return err
				}
			}
		}

		// 删除旧数据中不存在于新数据中的记录
		for _, improvement := range oldImprovementMap {
			if _, exists := newImprovementMap[improvement.RuleID]; !exists {
				if err := tx.Delete(&improvement).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	return nil
}

func (r *DataQualityImprovementRepo) GetByWorkOrderId(ctx context.Context, workOrderId string) ([]*model.DataQualityImprovement, error) {
	var datas []*model.DataQualityImprovement
	err := r.data.DB.WithContext(ctx).Model(&model.DataQualityImprovement{}).Where("work_order_id = ?", workOrderId).Find(&datas).Error
	return datas, err
}
