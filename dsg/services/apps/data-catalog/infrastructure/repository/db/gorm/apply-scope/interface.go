package apply_scope

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

type Repo interface {
	// 根据 apply_scope_id 查询单条记录
	Get(ctx context.Context, applyScopeID uint64) (*model.ApplyScope, error)
	// 根据 id(uuid) 查询单条记录
	GetByUUID(ctx context.Context, id string) (*model.ApplyScope, error)
	// 查询全部未删除的应用范围
	List(ctx context.Context) ([]*model.ApplyScope, error)
	// 根据 apply_scope_uuids 查询多条记录
	ListByUUIDs(ctx context.Context, applyScopeUUIDs []string) ([]*model.ApplyScope, error)
}
