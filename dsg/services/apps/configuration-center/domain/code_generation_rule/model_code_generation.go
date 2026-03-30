package code_generation_rule

import (
	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type GenerateOptions struct {
	Count int
}

// 预定义的编码规则
var (
	// 预定义的编码规则列表
	PredefinedCodeGenerationRules = []CodeGenerationRule{
		PredefinedCodeGenerationRuleApi,
		PredefinedCodeGenerationRuleDataView,
		// PredefinedCodeGenerationRuleDemand,
		PredefinedCodeGenerationRuleDataCatalog,
		// PredefinedCodeGenerationRuleApplication,
		// PredefinedCodeGenerationRuleInfoCatalog,
		// PredefinedCodeGenerationRuleFileResource,
		// PredefinedCodeGenerationTenantApplication,
	}

	// 预定义的编码规则：接口服务
	PredefinedCodeGenerationRuleApi = CodeGenerationRule{
		CodeGenerationRule: model.CodeGenerationRule{
			ID:   uuid.MustParse("15d8b9f8-f87b-11ee-aeae-005056b4b3fc"),
			Name: "接口服务",
			CodeGenerationRuleSpec: model.CodeGenerationRuleSpec{
				Type:                 model.CodeGenerationRuleTypeApi,
				Prefix:               "JK",
				PrefixEnabled:        true,
				RuleCode:             model.CodeGenerationRuleRuleCodeYYYYMMDD,
				RuleCodeEnabled:      true,
				CodeSeparator:        model.CodeGenerationRuleCodeSeparatorSlash,
				CodeSeparatorEnabled: true,
				DigitalCodeType:      model.CodeGenerationRuleDigitalCodeTypeSequence,
				DigitalCodeWidth:     6,
				DigitalCodeStarting:  1,
				DigitalCodeEnding:    999999,
			},
		},
	}
	// 预定义的编码规则：逻辑视图
	PredefinedCodeGenerationRuleDataView = CodeGenerationRule{
		CodeGenerationRule: model.CodeGenerationRule{
			ID:   uuid.MustParse("13daf448-d9c4-11ee-81aa-005056b4b3fc"),
			Name: "库表",
			CodeGenerationRuleSpec: model.CodeGenerationRuleSpec{
				Type:                 model.CodeGenerationRuleTypeDataView,
				Prefix:               "SJKB",
				PrefixEnabled:        true,
				RuleCode:             model.CodeGenerationRuleRuleCodeYYYYMMDD,
				RuleCodeEnabled:      true,
				CodeSeparator:        model.CodeGenerationRuleCodeSeparatorSlash,
				CodeSeparatorEnabled: true,
				DigitalCodeType:      model.CodeGenerationRuleDigitalCodeTypeSequence,
				DigitalCodeWidth:     6,
				DigitalCodeStarting:  1,
				DigitalCodeEnding:    999999,
			},
		},
	}
	// // 预定义的编码规则：需求
	// PredefinedCodeGenerationRuleDemand = CodeGenerationRule{
	// 	CodeGenerationRule: model.CodeGenerationRule{
	// 		ID:   uuid.MustParse("cef39a5e-dc4f-11ee-b798-005056b4b3fc"),
	// 		Name: "需求",
	// 		CodeGenerationRuleSpec: model.CodeGenerationRuleSpec{
	// 			Type:                 model.CodeGenerationRuleTypeDataView,
	// 			Prefix:               "XQ",
	// 			PrefixEnabled:        true,
	// 			RuleCode:             model.CodeGenerationRuleRuleCodeYYYYMMDD,
	// 			RuleCodeEnabled:      true,
	// 			CodeSeparator:        model.CodeGenerationRuleCodeSeparatorSlash,
	// 			CodeSeparatorEnabled: true,
	// 			DigitalCodeType:      model.CodeGenerationRuleDigitalCodeTypeSequence,
	// 			DigitalCodeWidth:     6,
	// 			DigitalCodeStarting:  1,
	// 			DigitalCodeEnding:    999999,
	// 		},
	// 	},
	// }
	// 预定义的编码规则：数据资源目录
	PredefinedCodeGenerationRuleDataCatalog = CodeGenerationRule{
		CodeGenerationRule: model.CodeGenerationRule{
			ID:   uuid.MustParse("28fa2073-2b5f-4ab5-9630-c73800fed3e5"),
			Name: "数据资源目录",
			CodeGenerationRuleSpec: model.CodeGenerationRuleSpec{
				Type:                 model.CodeGenerationRuleTypeDataCatalog,
				Prefix:               "SJZYML",
				PrefixEnabled:        true,
				RuleCode:             model.CodeGenerationRuleRuleCodeYYYYMMDD,
				RuleCodeEnabled:      true,
				CodeSeparator:        model.CodeGenerationRuleCodeSeparatorSlash,
				CodeSeparatorEnabled: true,
				DigitalCodeType:      model.CodeGenerationRuleDigitalCodeTypeSequence,
				DigitalCodeWidth:     6,
				DigitalCodeStarting:  1,
				DigitalCodeEnding:    999999,
			},
		},
	}
	// // 预定义的编码规则：共享申请
	// PredefinedCodeGenerationRuleApplication = CodeGenerationRule{
	// 	CodeGenerationRule: model.CodeGenerationRule{
	// 		ID:   uuid.MustParse("3dc44373-2d88-4990-9edf-133025e6e812"),
	// 		Name: "共享申请",
	// 		CodeGenerationRuleSpec: model.CodeGenerationRuleSpec{
	// 			Type:                 model.CodeGenerationRuleTypeApplication,
	// 			Prefix:               "GXSQ",
	// 			PrefixEnabled:        true,
	// 			RuleCode:             model.CodeGenerationRuleRuleCodeYYYYMMDD,
	// 			RuleCodeEnabled:      true,
	// 			CodeSeparator:        model.CodeGenerationRuleCodeSeparatorSlash,
	// 			CodeSeparatorEnabled: true,
	// 			DigitalCodeType:      model.CodeGenerationRuleDigitalCodeTypeSequence,
	// 			DigitalCodeWidth:     6,
	// 			DigitalCodeStarting:  1,
	// 			DigitalCodeEnding:    999999,
	// 		},
	// 	},
	// }
	// // 预定义的编码规则：信息资源目录
	// PredefinedCodeGenerationRuleInfoCatalog = CodeGenerationRule{
	// 	CodeGenerationRule: model.CodeGenerationRule{
	// 		ID:   uuid.MustParse("d6aaf704-91e5-438a-bb6b-c1e1b83d50c9"),
	// 		Name: "信息资源目录",
	// 		CodeGenerationRuleSpec: model.CodeGenerationRuleSpec{
	// 			Type:                 model.CodeGenerationRuleTypeInfoCatalog,
	// 			Prefix:               "XXZYML",
	// 			PrefixEnabled:        true,
	// 			RuleCode:             model.CodeGenerationRuleRuleCodeYYYYMMDD,
	// 			RuleCodeEnabled:      true,
	// 			CodeSeparator:        model.CodeGenerationRuleCodeSeparatorSlash,
	// 			CodeSeparatorEnabled: true,
	// 			DigitalCodeType:      model.CodeGenerationRuleDigitalCodeTypeSequence,
	// 			DigitalCodeWidth:     6,
	// 			DigitalCodeStarting:  1,
	// 			DigitalCodeEnding:    999999,
	// 		},
	// 	},
	// }
	// // 预定义的编码规则：文件资源
	// PredefinedCodeGenerationRuleFileResource = CodeGenerationRule{
	// 	CodeGenerationRule: model.CodeGenerationRule{
	// 		ID:   uuid.MustParse("7b83283c-ecff-11ef-a99d-cad97a383659"),
	// 		Name: "文件资源",
	// 		CodeGenerationRuleSpec: model.CodeGenerationRuleSpec{
	// 			Type:                 model.CodeGenerationRuleTypeFileResource,
	// 			Prefix:               "WJZY",
	// 			PrefixEnabled:        true,
	// 			RuleCode:             model.CodeGenerationRuleRuleCodeYYYYMMDD,
	// 			RuleCodeEnabled:      true,
	// 			CodeSeparator:        model.CodeGenerationRuleCodeSeparatorSlash,
	// 			CodeSeparatorEnabled: true,
	// 			DigitalCodeType:      model.CodeGenerationRuleDigitalCodeTypeSequence,
	// 			DigitalCodeWidth:     6,
	// 			DigitalCodeStarting:  1,
	// 			DigitalCodeEnding:    999999,
	// 		},
	// 	},
	// }
	// // 预定义的编码规则：租户申请
	// PredefinedCodeGenerationTenantApplication = CodeGenerationRule{
	// 	CodeGenerationRule: model.CodeGenerationRule{
	// 		ID:   uuid.MustParse("bed2d4ac-24b9-499f-8195-614e78215895"),
	// 		Name: "租户申请",
	// 		CodeGenerationRuleSpec: model.CodeGenerationRuleSpec{
	// 			Type:                 model.CodeGenerationRuleTypeTenantApplication,
	// 			Prefix:               "ZHSQ",
	// 			PrefixEnabled:        true,
	// 			RuleCode:             model.CodeGenerationRuleRuleCodeYYYYMMDD,
	// 			RuleCodeEnabled:      true,
	// 			CodeSeparator:        model.CodeGenerationRuleCodeSeparatorSlash,
	// 			CodeSeparatorEnabled: true,
	// 			DigitalCodeType:      model.CodeGenerationRuleDigitalCodeTypeSequence,
	// 			DigitalCodeWidth:     6,
	// 			DigitalCodeStarting:  1,
	// 			DigitalCodeEnding:    999999,
	// 		},
	// 	},
	// }
)
