package impl

import (
	"gorm.io/gorm/clause"

	driven "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/code_generation_rule"
)

func ConvertListOptionsToExpressions(opts driven.ListOptions) (expressions []clause.Expression) {
	if opts.Prefix != "" {
		expressions = append(expressions, clause.Eq{Column: "prefix", Value: opts.Prefix})
	}

	return
}
