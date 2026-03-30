package db

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/util"
	"gorm.io/gorm"
)

// ReplaceAll 支持删除，新增，修改，未经测试，但是不想写第二次，就留下来了
func ReplaceAll[S, F any](ctx context.Context, db *gorm.DB, sd []S, sk func(S) string, fd []F, fk func(F) string, keys ...string) error {
	addEntity, updateEntity, delEntity := util.CUDString[S, F](sd, fd, sk, fk)
	delEntityID := util.Gen[string](delEntity, sk)
	if err := db.WithContext(ctx).Transaction(func(tx *gorm.DB) (err error) {
		//删除
		if len(delEntityID) > 0 {
			if err = tx.WithContext(ctx).Where("id in ?", delEntityID).Unscoped().Delete(new(S)).Error; err != nil {
				return err
			}
		}
		//更新
		if len(updateEntity) > 0 {
			for _, entity := range updateEntity {
				if err := tx.Model(new(S)).Select(keys).Where("id = ?", sk(entity)).Updates(&entity).Error; err != nil {
					return err
				}
			}
		}
		//新增
		if len(addEntity) > 0 {
			if err = tx.Model(new(S)).CreateInBatches(addEntity, 100).Error; err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		return err
	}
	return nil
}
