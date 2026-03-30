package v1

import (
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/sub_view"
)

type SubViewService struct {
	uc sub_view.SubViewUseCase
}

func NewSubViewService(uc sub_view.SubViewUseCase) *SubViewService {
	return &SubViewService{uc: uc}
}
