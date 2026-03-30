package sub_service

import (
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/domain/sub_service"
)

type SubServiceService struct {
	uc sub_service.UseCase
}

func NewSubServiceService(uc sub_service.UseCase) *SubServiceService {
	return &SubServiceService{uc: uc}
}
