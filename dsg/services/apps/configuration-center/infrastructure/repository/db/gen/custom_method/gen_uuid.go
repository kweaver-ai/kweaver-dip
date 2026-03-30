package custom_method

import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"gorm.io/gorm"
)

type GenIDMethod struct {
	ID string
}

func (m *GenIDMethod) BeforeCreate(_ *gorm.DB) error {
	if m == nil {
		return nil
	}

	if len(m.ID) == 0 {
		m.ID = util.NewUUID()
	}

	return nil
}
