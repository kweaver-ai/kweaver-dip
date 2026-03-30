package data_catalog

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// PreviewHook 摘要信息预览量埋点
func (d *DataCatalogDomain) PreviewHook(ctx context.Context, catalogID models.ModelID) error {
	uInfo := request.GetUserInfo(ctx)
	userID := uInfo.ID

	dataCatalogModel, err := d.cataRepo.GetDetail(nil, ctx, catalogID.Uint64(), nil)
	if err != nil {
		log.WithContext(ctx).Errorf("get catalog: %v failed, err: %v", catalogID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errorcode.Detail(errorcode.PublicResourceNotExisted, "资源不存在")
		} else {
			return errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
	}

	if err = common.CatalogPropertyCheckV1(dataCatalogModel); err != nil {
		log.WithContext(ctx).Errorf("check catalog (id: %v code: %v user: %v) preview access apply forbidden, err: %v", dataCatalogModel.ID, dataCatalogModel.Code, uInfo.ID, err)
		return err
	}

	// 通过目录编码和用户ID查找有无记录
	statsModel, err := d.userCataRepo.GetOneByCodeAndUserID(nil, ctx, dataCatalogModel.Code, userID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to GetOneByCodeAndUserID (uid: %v catalog_id: %v code: %v), err: %v",
			userID, catalogID, dataCatalogModel.Code, err)
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	} else {
		if statsModel == nil {
			// 开启事务
			tx := d.data.DB.WithContext(ctx).Begin()
			defer func(err *error) {
				if e := recover(); e != nil {
					*err = e.(error)
					tx.Rollback()
				} else if e = tx.Commit().Error; e != nil {
					*err = errorcode.Detail(errorcode.PublicDatabaseError, e)
					tx.Rollback()
				}
			}(&err)

			// 找不到记录，则为首次新建
			err = d.userCataRepo.Insert(tx, ctx, dataCatalogModel.Code, userID)
			if err != nil {
				log.WithContext(ctx).Errorf("failed to insert t_user_data_catalog_stats_info (uid: %v catalog_id: %v code: %v), err: %v",
					userID, catalogID, dataCatalogModel.Code, err)
				panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
			}

			var stats []*model.TDataCatalogStatsInfo
			stats, err = d.siRepo.Get(tx, ctx, dataCatalogModel.Code)
			if err != nil {
				log.WithContext(ctx).Errorf("failed to get preview num (uid: %v catalog_id: %v code: %v) update, err: %v",
					userID, catalogID, dataCatalogModel.Code, err)
				panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
			}

			// 预览量一个用户浏览这个目录多次也只能算一次，故放在首次插入t_user_data_catalog_stats_info表记录时进行如下增1操作
			if len(stats) > 0 {
				err = d.siRepo.Update(tx, ctx, dataCatalogModel.Code, 0, 1)
			} else {
				err = d.siRepo.Insert(tx, ctx, dataCatalogModel.Code, 0, 1)
			}
			if err != nil {
				log.WithContext(ctx).Errorf("failed to record preview num (uid: %v catalog_id: %v code: %v) update, err: %v",
					userID, catalogID, dataCatalogModel.Code, err)
				panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
			}

		} else {
			// 找到记录，则在上一次的基础上加1
			_, err = d.userCataRepo.UpdatePreViewNum(nil, ctx, statsModel.ID, statsModel.PreviewNum+1)
			if err != nil {
				return errorcode.Detail(errorcode.PublicDatabaseError, err)
			}
		}

	}

	return nil
}
