package v1

import (
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/code_generation_rule"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

var _ = domain.CodeGenerationRule{
	CodeGenerationRule: model.CodeGenerationRule{
		SnowflakeID: 0,
		ID:          [16]byte{},
		Name:        "",
		CodeGenerationRuleSpec: model.CodeGenerationRuleSpec{
			Type:                 "",
			Prefix:               "",
			PrefixEnabled:        false,
			RuleCode:             "",
			RuleCodeEnabled:      false,
			CodeSeparator:        "",
			CodeSeparatorEnabled: false,
			DigitalCodeType:      "",
			DigitalCodeWidth:     0,
			DigitalCodeStarting:  0,
			DigitalCodeEnding:    0,
		},
		CodeGenerationRuleStatus: model.CodeGenerationRuleStatus{},
	},
	UpdaterName: "",
}
