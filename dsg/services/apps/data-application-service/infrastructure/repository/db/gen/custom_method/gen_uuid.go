package custom_method

import (
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/util"
	"gorm.io/gorm"
)

type GenIDMethod struct {
	ID uint64
}

func (m *GenIDMethod) BeforeCreate(_ *gorm.DB) error {
	if m == nil {
		return nil
	}

	if m.ID == 0 {
		m.ID = uint64(util.GetUniqueID())
	}

	return nil
}
