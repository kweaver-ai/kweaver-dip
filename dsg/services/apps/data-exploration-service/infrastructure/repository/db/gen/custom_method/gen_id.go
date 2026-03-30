package custom_method

import (
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/util"
	"gorm.io/gorm"
)

type GenIDMethod struct {
	ID uint64
}

func (m *GenIDMethod) BeforeCreate(_ *gorm.DB) error {
	if m == nil {
		return nil
	}

	if m.ID > 0 {
		return nil
	}

	id, err := util.NewModelID()
	if err != nil {
		return err
	}

	m.ID = id

	return nil
}
