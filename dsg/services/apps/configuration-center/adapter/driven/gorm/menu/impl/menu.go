package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/menu"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type menuRepo struct {
	db *gorm.DB
}

func NewMenuRepo(db *gorm.DB) menu.MenuRepo {
	return &menuRepo{db: db}
}

func (r menuRepo) GetMenus(ctx context.Context) (res []*model.Menu, err error) {
	err = r.db.WithContext(ctx).Find(&res).Error
	return
}
func (r menuRepo) GetMenusByPlatform(ctx context.Context, belong int32) (res []*model.Menu, err error) {
	err = r.db.WithContext(ctx).Where("platform=?", belong).Find(&res).Error
	return
}
func (r menuRepo) GetMenusByPlatformWithKeyword(ctx context.Context, belong int32, id string, keyword string) (res []*model.Menu, err error) {
	db := r.db.WithContext(ctx).Where("platform=? ", belong)
	if len(id) > 0 {
		db = db.Where("value like ? ", `%"key":"`+id+`"%`)
	}
	if len(keyword) > 0 {
		db = db.Where("value like ? ", "%"+keyword+"%")
	}
	err = db.Find(&res).Error
	return
}
func (r *menuRepo) Create(ctx context.Context, formView *model.Menu) error {
	return r.db.WithContext(ctx).Create(formView).Error
}

func (r *menuRepo) CreateBatch(ctx context.Context, formView []*model.Menu) error {
	return r.db.WithContext(ctx).Create(formView).Error
}

func (r menuRepo) Truncate(ctx context.Context) error {
	return r.db.WithContext(ctx).Exec("TRUNCATE table menu").Error
}
