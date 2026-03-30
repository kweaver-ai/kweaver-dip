package code_generation_rule

import (
	"context"

	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type Repo interface {
	// 创建编码生成规则
	Create(ctx context.Context, rule *model.CodeGenerationRule) (*model.CodeGenerationRule, error)
	// 更新指定 ID 的编码生成规则
	//
	// 为保证数据一致性更新操作在 updateFunc 中实现，返回 domain.ErrUnchanged 代
	// 表不需要更新
	Update(ctx context.Context, rule *model.CodeGenerationRule) (*model.CodeGenerationRule, error)
	// 获取指定 ID 的编码生成规则
	Get(ctx context.Context, id uuid.UUID) (*model.CodeGenerationRule, error)
	// 获取符合条件的编码生成规则的数量
	Count(ctx context.Context, opts ListOptions) (int, error)
	// 获取所有的编码生成规则列表
	List(ctx context.Context) ([]model.CodeGenerationRule, error)

	// 根据指定的编码生成规则生成编码
	Generate(ctx context.Context, id uuid.UUID, count int) ([]string, error)
}

// ListOptions 定义过滤条件
type ListOptions struct {
	// 如果不为空，精确匹配编码生成规则的前缀
	Prefix string
}
