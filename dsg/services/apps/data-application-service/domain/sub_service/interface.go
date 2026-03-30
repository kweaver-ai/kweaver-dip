package sub_service

import (
	"context"

	"github.com/google/uuid"
)

type UseCase interface {
	Create(ctx context.Context, subService *SubService, isInternal bool) (*SubService, error)  // 创建子视图
	Update(ctx context.Context, subService *SubService) (*SubService, error)                   // 更新指定子视图
	Delete(ctx context.Context, id uuid.UUID) error                                            // 删除指定子视图
	Get(ctx context.Context, id uuid.UUID) (*SubService, error)                                // 获取指定子视图
	GetServiceID(ctx context.Context, id uuid.UUID) (uuid.UUID, error)                         // 获取指定子视图所属逻辑视图的 ID
	List(ctx context.Context, opts ListOptions) (*List[SubService], error)                     // 获取子视图列表
	ListID(ctx context.Context, dataViewID uuid.UUID) ([]uuid.UUID, error)                     // 获取指定逻辑视图的子视图（行列规则） ID 列表，参数为空则返回所有
	ListSubServices(ctx context.Context, req *ListSubServicesReq) (map[string][]string, error) // 通过接口服务ID查询子接口服务
}
