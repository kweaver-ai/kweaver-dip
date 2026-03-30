package role2

import (
	"context"
	"net/url"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type Repo interface {
	Update(ctx context.Context, role *model.SystemRole) error
	QueryList(ctx context.Context, param *url.Values) ([]*model.SystemRole, int64, error)
	//检查用户是否关联角色和关联的角色是否为自定义角色
	IsUserAssociated(ctx context.Context, uid string) (bool, error)
}
