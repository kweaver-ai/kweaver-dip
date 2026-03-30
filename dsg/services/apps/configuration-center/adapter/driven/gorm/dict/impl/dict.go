package impl

import (
	"context"
	"fmt"
	"strconv"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/common"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/dict"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type dictRepo struct {
	db *gorm.DB
}

func NewDictRepo(db *gorm.DB) dict.Repo {
	return &dictRepo{db: db}
}

func (r *dictRepo) GetDictItemByType(ctx context.Context, dictTypes []string, queryType string) ([]*model.TDictItem, error) {
	var datas []*model.TDictItem
	d := r.db.WithContext(ctx).Select("t_dict_item.*").Table(model.TableNameTDict).Joins("INNER JOIN t_dict_item ON t_dict.id = t_dict_item.dict_id")
	if queryType != "" {
		d.Where("t_dict.sszd_flag=?", queryType)
	}
	if len(dictTypes) > 0 {
		d = d.Where("t_dict.f_type in ?", dictTypes)
	}
	d = d.Order("f_sort asc").Find(&datas)
	return datas, d.Error
}

func (r *dictRepo) ListDictByPaging(ctx context.Context, pageInfo *request.PageInfo, name string, queryType string) (resp []*model.TDict, count int64, err error) {
	do := r.db.WithContext(ctx).Model(&model.TDict{})
	if queryType == "0" {
		do.Where("sszd_flag=?", queryType)
	}
	if name != "" {
		do = do.Where("name like ?", "%"+common.KeywordEscape(name)+"%")
	}

	var total int64
	err = do.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}
	do = do.Offset((pageInfo.Offset - 1) * pageInfo.Limit).Limit(pageInfo.Limit)
	do.Order(fmt.Sprintf("%s %s", pageInfo.Sort, pageInfo.Direction))
	err = do.Find(&resp).Error
	if err != nil {
		return nil, 0, err
	}
	return resp, total, nil
}

func (r *dictRepo) ListDictItemByPaging(ctx context.Context, pageInfo *request.PageInfo, name string, dictId uint64) (resp []*model.TDictItem, count int64, err error) {
	do := r.db.WithContext(ctx).Model(&model.TDictItem{})
	do.Where("dict_id=?", dictId)
	if name != "" {
		name = common.KeywordEscape(name)
		do = do.Where("f_value like ? or f_key like ?", "%"+name+"%", "%"+name+"%")
	}
	var total int64
	err = do.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}
	do = do.Offset((pageInfo.Offset - 1) * pageInfo.Limit).Limit(pageInfo.Limit)
	do = do.Order("f_sort asc")
	err = do.Find(&resp).Error
	if err != nil {
		return nil, 0, err
	}
	return resp, total, nil
}

func (r *dictRepo) GetDictByID(ctx context.Context, id uint64) (resp *model.TDict, err error) {
	do := r.db.WithContext(ctx)
	do = do.Find(&resp, id)
	return resp, do.Error
}

func (r *dictRepo) GetDictItemListByDictID(ctx context.Context, dictId uint64) (resp []*model.TDictItem, err error) {
	do := r.db.WithContext(ctx)
	do = do.Where("dict_id = ?", dictId).Order("f_sort asc").Find(&resp)
	return resp, do.Error
}
func (r *dictRepo) GetDictItemTypeList(ctx context.Context, queryType string) (resp []*model.TDictItem, err error) {
	do := r.db.WithContext(ctx).Select("t_dict_item.*").Table(model.TableNameTDict).Joins("INNER JOIN t_dict_item ON t_dict.id = t_dict_item.dict_id")
	do.Where("t_dict.deleted_at=?", "0")
	if queryType != "" {
		do.Where("t_dict.sszd_flag=?", queryType)
	}
	do = do.Order("f_sort asc").Find(&resp)
	return resp, do.Error
}

func (r *dictRepo) GetDictList(ctx context.Context, queryType string) (resp []*model.TDict, err error) {
	do := r.db.WithContext(ctx)
	if queryType == "0" {
		do.Where("sszd_flag=?", queryType)
	}
	do = do.Find(&resp)
	return resp, do.Error
}

func (r *dictRepo) UpdateDictAndItem(ctx context.Context, tdict *model.TDict, dictItems []*model.TDictItem) (err error) {
	if err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) (err error) {
		if err := tx.Model(&model.TDict{}).Debug().Where(&model.TDict{ID: tdict.ID}).Updates(&tdict).Error; err != nil {
			log.WithContext(ctx).Error("Update Dict", zap.Error(tx.Error))
			return err
		}
		//先删除
		if err := tx.Where("dict_id", tdict.ID).Debug().Delete(&model.TDictItem{}).Error; err != nil {
			log.WithContext(ctx).Error("Delete DictItem DictID"+strconv.FormatUint(tdict.ID, 10), zap.Error(tx.Error))
			return err
		}
		if dictItems != nil && len(dictItems) > 0 {
			if err := tx.Table(model.TableNameTDictItem).Debug().Create(&dictItems).Error; err != nil {
				log.WithContext(ctx).Error("Update==BatchCreate DictItem", zap.Error(tx.Error))
				return err
			}
		}
		return nil
	}); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (r *dictRepo) DeleteDictAndItem(ctx context.Context, id uint64) (err error) {
	if err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) (err error) {
		if err := tx.Model(&model.TDict{}).Debug().Where(&model.TDict{ID: id}).Delete(&model.TDict{}).Error; err != nil {
			log.WithContext(ctx).Error("DeleteDictAndItem Dict", zap.Error(tx.Error))
			return err
		}
		//删除
		if err := tx.Where("dict_id", id).Delete(&model.TDictItem{}).Error; err != nil {
			log.WithContext(ctx).Error("DeleteDictAndItem==Delete DictItem DictID"+strconv.FormatUint(id, 10), zap.Error(tx.Error))
			return err
		}
		return nil
	}); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (r *dictRepo) CreateDictAndItem(ctx context.Context, tdict *model.TDict, dictItems []*model.TDictItem) (err error) {
	if err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) (err error) {
		if err := tx.Model(&model.TDict{}).Debug().Create(&tdict).Error; err != nil {
			log.WithContext(ctx).Error("Create Dict", zap.Error(tx.Error))
			return err
		}

		if dictItems != nil && len(dictItems) > 0 {
			if err := tx.Table(model.TableNameTDictItem).Debug().Create(&dictItems).Error; err != nil {
				log.WithContext(ctx).Error("BatchCreate DictItem", zap.Error(tx.Error))
				return err
			}
		}
		return nil
	}); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (r *dictRepo) GetCheckTypeKeyList(ctx context.Context, dictItems []model.TDictItem) (resp []*model.TDictItem, err error) {
	do := r.db.WithContext(ctx).Model(&model.TDictItem{})
	for _, item := range dictItems {
		do = do.Or("f_type = ? and f_key = ?", item.FType, item.FKey)
	}
	do = do.Find(&resp)
	return resp, do.Error
}

func (r *dictRepo) GetDictItemByKeys(ctx context.Context, dictType string, itemKeys ...string) (resp []*model.TDictItem, err error) {
	do := r.db.WithContext(ctx)
	do = do.Where("f_type = ? and f_key in ?", dictType, itemKeys).Find(&resp)
	return resp, do.Error
}
