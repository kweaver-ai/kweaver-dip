package v1

import (
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/code_generation_rule"
)

type Service struct {
	uc domain.UseCase
}

func NewService(uc domain.UseCase) *Service { return &Service{uc: uc} }
