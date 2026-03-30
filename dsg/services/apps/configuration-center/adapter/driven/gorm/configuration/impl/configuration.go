package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/common"
	addr "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/configuration"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model/query"
	"gorm.io/gorm"
)

type configurationRepo struct {
	q *query.Query
}

func NewConfigurationRepo(db *gorm.DB) addr.Repo {
	return &configurationRepo{q: common.GetQuery(db)}
}

func (a configurationRepo) GetByName(ctx context.Context, name string) ([]*model.Configuration, error) {
	thirdPartyAddress := a.q.Configuration
	return thirdPartyAddress.WithContext(ctx).Where(thirdPartyAddress.Key.Eq(name)).Find()
}

func (a configurationRepo) GetByNames(ctx context.Context, names []string) ([]*model.Configuration, error) {
	thirdPartyAddress := a.q.Configuration
	if len(names) == 0 {
		return thirdPartyAddress.WithContext(ctx).Find()
	}
	return thirdPartyAddress.WithContext(ctx).Where(thirdPartyAddress.Key.In(names...)).Find()
}

func (a configurationRepo) GetAll(ctx context.Context) ([]*model.Configuration, error) {
	return a.q.Configuration.WithContext(ctx).Find()
}

func (a configurationRepo) GetByType(ctx context.Context, t int32) ([]*model.Configuration, error) {
	thirdPartyAddress := a.q.Configuration
	return thirdPartyAddress.WithContext(ctx).Where(thirdPartyAddress.Type.Eq(t)).Find()
}
func (a configurationRepo) Insert(ctx context.Context, configurationModel *model.Configuration) error {
	if err := a.q.Configuration.WithContext(ctx).Create(configurationModel); err != nil {
		return err
	}
	return nil
}

func (a configurationRepo) Update(ctx context.Context, config *model.Configuration) error {
	db := a.q.Configuration.WithContext(ctx).UnderlyingDB().WithContext(ctx)
	return db.Exec("UPDATE configuration SET `value`=? WHERE `key`=?", config.Value, config.Key).Error
}

func (a configurationRepo) GetByNameAndType(ctx context.Context, name string, t int32) (*model.Configuration, error) {
	thirdPartyAddress := a.q.Configuration
	return thirdPartyAddress.WithContext(ctx).Where(thirdPartyAddress.Key.Eq(name)).Where(thirdPartyAddress.Type.Eq(t)).Take()
}
