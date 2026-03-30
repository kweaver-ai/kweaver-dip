package custom_method

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"gorm.io/gorm"
)

type GenIDMethod struct {
	ID uint64
}

func (m *GenIDMethod) BeforeCreate(_ *gorm.DB) error {
	var err error
	if m == nil {
		return nil
	}

	if m.ID == 0 {
		m.ID, err = util.NewUniqueID()
	}

	return err
}

type GenIDMethod2 struct {
	ID models.ModelID
}

func (m *GenIDMethod2) BeforeCreate(_ *gorm.DB) error {
	if m == nil {
		return nil
	}

	if m.ID.Uint64() > 0 {
		return nil
	}

	id, err := util.NewUniqueID()
	if err != nil {
		return err
	}

	m.ID = models.NewModelID(id)

	return nil
}
