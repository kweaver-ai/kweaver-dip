package impl

import (
	"context"
	"errors"
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/data_classify_attribute_blacklist"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"gorm.io/gorm"
)

func NewDataClassifyAttrBlacklistRepo(db *gorm.DB) data_classify_attribute_blacklist.DataClassifyAttrBlacklistRepo {
	return &dataClassifyAttrBlacklistRepo{db: db}
}

type dataClassifyAttrBlacklistRepo struct {
	db *gorm.DB
}

func (r *dataClassifyAttrBlacklistRepo) Create(ctx context.Context, m *model.DataClassifyAttrBlacklist) error {
	resErr := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {

		var blacklist *model.DataClassifyAttrBlacklist
		err := tx.Table(model.TableNameDataClassifyAttrBlacklist).Where("form_view_id =? and field_id = ? and subject_id = ? ", m.FormViewID, m.FieldID, m.SubjectID).Unscoped().Take(&blacklist).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				if err := tx.Table(model.TableNameDataClassifyAttrBlacklist).Create(m).Error; err != nil {
					return err
				}
			} else {
				return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
			}

		}

		sql := fmt.Sprintf("UPDATE form_view_field SET subject_id=? ,classify_type=? ,match_score=?  WHERE id ='%s' and deleted_at=0", m.FieldID)
		err = tx.Debug().Exec(sql, "", nil, nil).Error
		if err != nil {
			return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
		}
		return nil
	})
	return resErr
}
func ClearAttribute(tx *gorm.DB, m *model.DataClassifyAttrBlacklist) error {
	var blacklist *model.DataClassifyAttrBlacklist
	err := tx.Table(model.TableNameDataClassifyAttrBlacklist).Where("form_view_id =? and field_id = ? and subject_id = ? ", m.FormViewID, m.FieldID, m.SubjectID).Unscoped().Take(&blacklist).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			if err = tx.Table(model.TableNameDataClassifyAttrBlacklist).Create(m).Error; err != nil {
				return err
			}
		} else {
			return err
		}
	}
	err = tx.Debug().Exec(fmt.Sprintf("UPDATE form_view_field SET subject_id=? ,classify_type=? ,match_score=?  WHERE id ='%s' and deleted_at=0", m.FieldID), "", nil, nil).Error
	if err != nil {
		return err
	}
	return nil
}

func (r *dataClassifyAttrBlacklistRepo) GetByID(ctx context.Context, formViewID, fieldID string) ([]*model.DataClassifyAttrBlacklist, error) {
	var l []*model.DataClassifyAttrBlacklist
	d := r.db.WithContext(ctx).Model(&model.DataClassifyAttrBlacklist{})
	if len(formViewID) > 0 {
		d = d.Where("form_view_id = ?", formViewID)
	}
	if len(fieldID) > 0 {
		d = d.Where("field_id = ?", fieldID)
	}
	err := d.Order("field_id asc, created_at asc").Find(&l).Error
	return l, err
}
