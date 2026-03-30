package tc_oss

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type Repo interface {
	Insert(ctx context.Context, obj *model.TcOss) error
	Get(ctx context.Context, uuid string) (*model.TcOss, error)
}
