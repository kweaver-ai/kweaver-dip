package sub_view

import (
	"context"

	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
)

type SubViewRepo interface {
	// 创建子视图
	Create(ctx context.Context, subView *model.SubView) (*model.SubView, error)
	// 删除子视图
	Delete(ctx context.Context, id uuid.UUID) error
	// 更新子视图
	Update(ctx context.Context, subView *model.SubView) (*model.SubView, error)
	// 获取子视图
	Get(ctx context.Context, id uuid.UUID) (*model.SubView, error)
	// 获取指定子视图所属逻辑视图的 ID
	GetLogicViewID(ctx context.Context, id uuid.UUID) (uuid.UUID, error)
	// 获取子视图列表
	List(ctx context.Context, opts ListOptions) ([]model.SubView, int, error)
	// 获取指定逻辑视图的子视图（行列规则） ID 列表，如果未指定逻辑视图则返回所
	// 有子视图（行列规则）ID 列表
	ListID(ctx context.Context, dataViewID uuid.UUID) ([]uuid.UUID, error)
	//检查同一个逻辑视图下行列规则名称是否重复
	CheckRepeat(ctx context.Context, subView *model.SubView) (bool, error)
	IsRepeat(ctx context.Context, subView *model.SubView) error
	ListSubViews(ctx context.Context, logicViewID ...string) (map[string][]string, error)
}

type ListOptions struct {
	LogicViewID uuid.UUID `json:"logic_view_id,omitempty"`
	// 页码
	Offset int `form:"offset,default=1" json:"offset,omitempty"`
	// 每页数量
	Limit int `form:"limit,default=10" json:"limit,omitempty"`
}
