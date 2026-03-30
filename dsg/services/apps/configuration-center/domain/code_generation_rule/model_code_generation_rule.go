package code_generation_rule

import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

// 编码生成规则的列表
type CodeGenerationRuleList EntryList[CodeGenerationRule]

// 编码生成规则
type CodeGenerationRule struct {
	model.CodeGenerationRule `json:",inline"`

	// 更新编码生成规则的用户的名字
	UpdaterName string `json:"updater_name"`
}
