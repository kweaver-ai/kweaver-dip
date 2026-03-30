package sub_view

import (
	"context"

	"github.com/google/uuid"
)

type SubViewUseCase interface {
	// 创建子视图
	Create(ctx context.Context, subView *SubView, isInternal bool) (*SubView, error)
	// 更新指定子视图
	Update(ctx context.Context, subView *SubView, isInternal bool) (*SubView, error)
	// 删除指定子视图
	Delete(ctx context.Context, id uuid.UUID) error
	// 获取指定子视图
	Get(ctx context.Context, id uuid.UUID) (*SubView, error)
	// 获取指定子视图所属逻辑视图的 ID
	GetLogicViewID(ctx context.Context, id uuid.UUID) (uuid.UUID, error)
	// 获取子视图列表
	List(ctx context.Context, opts ListOptions) (*List[SubView], error)
	// 获取指定逻辑视图的子视图（行列规则） ID 列表，如果未指定逻辑视图则返回所
	// 有子视图（行列规则）ID 列表
	ListID(ctx context.Context, dataViewID uuid.UUID) ([]uuid.UUID, error)
	ListSubViews(ctx context.Context, dataViewID ...string) (map[string][]string, error)
}
