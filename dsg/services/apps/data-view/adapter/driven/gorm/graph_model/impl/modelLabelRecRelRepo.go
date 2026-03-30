package impl

import (
	"context"
	"errors"

	errorcode2 "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"gorm.io/gorm"
)

func (r *repo) ListTopicModelLabelRec(ctx context.Context, req *request.PageSortKeyword3) (models []*model.TModelLabelRecRel, total int64, err error) {
	db := r.DB(ctx).Model(new(model.TModelLabelRecRel))
	if req.Keyword != "" {
		keyword := "%" + req.Keyword + "%"
		db = db.Where(" name like ? ", keyword)
	}
	//总数
	if err = db.Count(&total).Error; err != nil {
		return
	}
	limit := *req.PageInfo.Limit
	offset := limit * (*req.PageInfo.Offset - 1)
	db = db.Offset(offset).Limit(limit)
	if err = db.Order(req.Sort + " " + req.Direction).Find(&models).Error; err != nil {
		return nil, 0, errorcode2.PublicDatabaseErr.Detail(err.Error())
	}
	return
}

func (r *repo) GetTopicModelLabelRec(ctx context.Context, id uint64) (obj *model.TModelLabelRecRel, err error) {
	err = r.DB(ctx).Where("id=?", id).First(&obj).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode2.PublicResourceNotFoundError.Err()
		}
		return nil, errorcode2.PublicDatabaseErr.Detail(err.Error())
	}
	return obj, err
}

func (r *repo) UpdateTopicModelLabelRec(ctx context.Context, obj *model.TModelLabelRecRel) (err error) {
	return r.DB(ctx).Where("id = ?", obj.ID).Updates(obj).Error
}

func (r *repo) CreateTopicModelLabelRec(ctx context.Context, obj *model.TModelLabelRecRel) error {
	return r.DB(ctx).Transaction(func(tx *gorm.DB) error {
		return tx.Create(obj).Error
	})
}

func (r *repo) DeleteTopicModelLabelRec(ctx context.Context, id uint64) (err error) {
	err = r.DB(ctx).Transaction(func(tx *gorm.DB) error {
		return tx.Where("id=?", id).Delete(&model.TModelLabelRecRel{}).Error
	})
	if err != nil {
		return errorcode2.PublicDatabaseErr.Detail(err.Error())
	}
	return nil
}
