package tc_member

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type Repo interface {
	Query(ctx context.Context, obj int8, objId string) (ms []*model.TcMember, err error)
	QueryProjectMembers(ctx context.Context, objId string) (ms []*model.TcMember, err error)
	QueryUserProject(ctx context.Context, userID string) (ps []string, err error)
}
