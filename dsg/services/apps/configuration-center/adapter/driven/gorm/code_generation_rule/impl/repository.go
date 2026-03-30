package impl

import (
	"gorm.io/gorm"

	repository "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/code_generation_rule"
)

type CodeGenerationRuleRepo struct {
	db *gorm.DB
}

var _ repository.Repo = &CodeGenerationRuleRepo{}

func NewCodeGenerationRuleRepo(db *gorm.DB) repository.Repo {
	StartHousekeeper(db)
	return &CodeGenerationRuleRepo{db: db}
}
