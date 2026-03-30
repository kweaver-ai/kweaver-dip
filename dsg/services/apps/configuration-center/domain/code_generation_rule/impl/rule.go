package impl

import (
	driven_code "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/code_generation_rule"
	driver_user "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/user"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/code_generation_rule"
)

type UseCase struct {
	codeRepo driven_code.Repo
	userRepo driver_user.Repo
}

func NewCodeGenerationRuleUseCase(codeRepo driven_code.Repo, userRepo driver_user.Repo) domain.UseCase {
	return &UseCase{
		codeRepo: codeRepo,
		userRepo: userRepo,
	}
}
