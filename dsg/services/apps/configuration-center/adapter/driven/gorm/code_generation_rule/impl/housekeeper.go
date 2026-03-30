package impl

import (
	"sync"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

var housekeeperOnce sync.Once

func StartHousekeeper(db *gorm.DB) {
	housekeeperOnce.Do(func() {
		log.Info("start housekeeper", zap.String("func", "SoftDeleteOutdatedSequenceCodeGenerationStatusesPeriodically"), zap.Stringer("period", time.Hour))
		go SoftDeleteOutdatedSequenceCodeGenerationStatusesPeriodically(db, time.Hour)

		log.Info("start housekeeper", zap.String("func", "DeleteAlreadySoftDeletedSequenceCodeGenerationStatusesPeriodically"), zap.Stringer("period", time.Hour*24))
		go DeleteAlreadySoftDeletedSequenceCodeGenerationStatusesPeriodically(db, time.Hour*24)
	})
}

// SoftDeleteOutdatedSequenceCodeGenerationStatusesPeriodically 周期地标记删除过期的（规则码不是当天的）顺序码生成状态
func SoftDeleteOutdatedSequenceCodeGenerationStatusesPeriodically(db *gorm.DB, period time.Duration) {
	// 限制每次删除 10 个
	const limit = 10
	for range time.Tick(period) {
		log.Info("soft delete outdated sequence code generation statuses", zap.Int("limit", limit))
		count, err := SoftDeleteOutdatedSequenceCodeGenerationStatuses(db, limit)
		if err != nil {
			log.Warn("soft delete outdated sequence code generation statuses fail", zap.Error(err))
			continue
		}
		log.Info("soft delete outdated sequence code generation statuses success", zap.Int("count", count))
	}
}

// SoftDeleteOutdatedSequenceCodeGenerationStatuses 标记删除指定数量的过期的（规则码不是当天的）顺序码生成状态
func SoftDeleteOutdatedSequenceCodeGenerationStatuses(db *gorm.DB, limit int) (int, error) {
	tx := db.Debug()
	// 生成当前日期的规则码
	ruleCode := generateRuleCode()
	// 标记删除规则码不为空且不是当前日期的规则码的生成状态
	result := tx.Limit(limit).Delete(&model.SequenceCodeGenerationStatus{}, "rule_code <> ? AND rule_code <> ?", ruleCode, "")
	if result.Error != nil {
		return 0, result.Error
	}
	return int(result.RowsAffected), nil
}

// SoftDeleteOutdatedSequenceCodeGenerationStatusesPeriodically 周期地永久删除已经被标记删除的顺序码生成状态
func DeleteAlreadySoftDeletedSequenceCodeGenerationStatusesPeriodically(db *gorm.DB, period time.Duration) {
	// 限制每次删除 100 个
	const limit = 100
	for range time.Tick(period) {
		log.Info("delete already soft deleted sequnece code generation statuses", zap.Int("limit", limit))
		count, err := DeleteAlreadySoftDeletedSequenceCodeGenerationStatuses(db, limit)
		if err != nil {
			log.Warn("delete already soft deleted sequnece code generation statuses fail", zap.Error(err))
			continue
		}
		log.Info("delete already soft deleted sequnece code generation statuses success", zap.Int("count", count))
	}
}

// DeleteAlreadySoftDeletedSequenceCodeGenerationStatuses 永久删除指定数量的已经被标记删除的顺序码生成状态
func DeleteAlreadySoftDeletedSequenceCodeGenerationStatuses(db *gorm.DB, limit int) (int, error) {
	tx := db.Debug()
	// 删除 deleted_at 字段不为 0 的记录
	result := tx.Unscoped().Limit(limit).Delete(&model.SequenceCodeGenerationStatus{}, "deleted_at <> ?", 0)
	if result.Error != nil {
		return 0, result.Error
	}
	return int(result.RowsAffected), nil
}
