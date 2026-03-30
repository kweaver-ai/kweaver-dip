package impl

import (
	"context"
	"errors"

	"github.com/kweaver-ai/idrm-go-frame/core/store/gormx"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/liyue_registrations"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type liyueRegistrationsRepo struct {
	db *gorm.DB
}

func NewLiyueRegistrationsRepo(db *gorm.DB) liyue_registrations.LiyueRegistrationsRepo {
	return &liyueRegistrationsRepo{db: db}
}

func (r *liyueRegistrationsRepo) GetLiyueRegistrations(ctx context.Context, id string) ([]*model.LiyueRegistrationUser, error) {
	tx := r.db.WithContext(ctx).Table("liyue_registrations as a").Select("a.*, h.name as user_name").Debug().
		Joins("left join `user` as h on a.user_id = h.id").
		Where(" a.liyue_id = ?", id)
	return gormx.RawScan[*model.LiyueRegistrationUser](tx)

}

func (r *liyueRegistrationsRepo) GetLiyueRegistration(ctx context.Context, id string) (*model.LiyueRegistration, error) {
	liyueRegistration := &model.LiyueRegistration{}
	result := r.db.WithContext(ctx).Debug().First(liyueRegistration, "liyue_id=?", id)
	if result.Error != nil {
		if is := errors.Is(result.Error, gorm.ErrRecordNotFound); is {
			return nil, result.Error
		}
		return nil, errorcode.Detail(errorcode.UserDataBaseError, result.Error.Error())
	}
	return liyueRegistration, nil

}
