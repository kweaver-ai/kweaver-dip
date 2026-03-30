package model

import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"gorm.io/gorm"
)

const TableNameLiyueRegistration = "liyue_registrations"

type LiyueRegistration struct {
	ID      string `gorm:"column:id" json:"id"`
	LiyueID string `gorm:"column:liyue_id" json:"liyue_id"`
	UserID  string `gorm:"column:user_id" json:"user_id"`
	Type    int32  `gorm:"column:type" json:"type"`
}

func (m *LiyueRegistration) BeforeCreate(_ *gorm.DB) error {
	// var err error
	if m == nil {
		return nil
	}
	// if m.ID == 0 {
	// 	if m.ID, err = utilities.GetUniqueID(); err != nil {
	// 		log.Errorf("failed to general unique id, err: %v", err)
	// 		err = errorcode.Desc(errorcode.PublicUniqueIDError)
	// 		return err
	// 	}
	// }

	if len(m.ID) == 0 {
		m.ID = util.NewUUID()
	}

	return nil
}

// TableName LiyueRegistration's table name
func (*LiyueRegistration) TableName() string {
	return TableNameLiyueRegistration
}

type LiyueRegistrationUser struct {
	ID       string `gorm:"column:id" json:"id"`
	LiyueID  string `gorm:"column:liyue_id" json:"liyue_id"`
	UserID   string `gorm:"column:user_id" json:"user_id"`
	Type     int32  `gorm:"column:type" json:"type"`
	UserName string `gorm:"column:user_name" json:"user_name"`
}
