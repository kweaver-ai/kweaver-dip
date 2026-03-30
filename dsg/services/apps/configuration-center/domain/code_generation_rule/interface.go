package code_generation_rule

import (
	"context"

	"github.com/google/uuid"
)

type UseCase interface {
	// 服务升级版本时更新已存在的数据
	Upgrade(ctx context.Context) error

	// 更新指定的编码生成规则
	Patch(ctx context.Context, rule *CodeGenerationRule) (*CodeGenerationRule, error)
	// 获取指定的编码生成规则
	Get(ctx context.Context, id uuid.UUID) (*CodeGenerationRule, error)
	// 获取编码生成规则列表
	List(ctx context.Context) (*CodeGenerationRuleList, error)
	// 根据编码生成规则生成编码
	Generate(ctx context.Context, id uuid.UUID, opts GenerateOptions) (*CodeList, error)

	// 检查前缀是否存在
	ExistenceCheckPrefix(ctx context.Context, prefix string) (bool, error)
}
