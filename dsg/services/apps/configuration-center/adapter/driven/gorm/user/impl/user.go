package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/common"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/user"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model/query"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type userRepo struct {
	q *query.Query
}

func NewUserRepo(db *gorm.DB) user.Repo {
	return &userRepo{q: common.GetQuery(db)}
}

func (u *userRepo) ListUserByIDs(ctx context.Context, uIds ...string) ([]*model.User, error) {
	if len(uIds) < 1 {
		log.Warn("user ids is empty")
		return nil, nil
	}

	userDo := u.q.User

	users, err := userDo.WithContext(ctx).Where(userDo.ID.In(uIds...)).Find()
	if err != nil {
		log.WithContext(ctx).Error("failed to get user record from db", zap.Strings("user ids", uIds), zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return users, nil
}

func (u *userRepo) GetUIDsByLikeName(ctx context.Context, names ...string) ([]string, error) {
	if len(names) < 1 {
		return nil, nil
	}

	userDo := u.q.User

	do := userDo.WithContext(ctx)
	for i := range names {
		if len(names[i]) < 1 {
			continue
		}

		do = do.Where(userDo.Name.Like(common.KeywordEscape(names[i]) + "%"))
	}

	models, err := do.Select(userDo.ID).Find()
	if err != nil {
		log.WithContext(ctx).Error("failed to get users from db", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	res := make([]string, len(models))
	for i := range models {
		res[i] = models[i].ID
	}

	return res, nil
}
