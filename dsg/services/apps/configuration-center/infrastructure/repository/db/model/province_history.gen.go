package model

import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"

	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
)

const TableNameProvinceHistory = "province_history"

// ProvinceHistory mapped from table <province_history>
type ProvinceHistory struct {
	ID           uint64 `gorm:"column:id;primaryKey" json:"id"`                     // 雪花id
	ProvinceIP   string `gorm:"column:province_ip;not null" json:"province_ip"`     // 对外提供ip地址
	ProvinceURL  string `gorm:"column:province_url;not null" json:"province_url"`   // 对外提供url地址
	ContactName  string `gorm:"column:contact_name;not null" json:"contact_name"`   // 联系人姓名
	ContactPhone string `gorm:"column:contact_phone;not null" json:"contact_phone"` // 联系人联系方式
	AreaID       int32  `gorm:"column:area_id;not null" json:"area_id"`             // 应用领域Id
	RangeID      int32  `gorm:"column:range_id;not null" json:"range_id"`           // 应用范围
	DepartmentID string `gorm:"column:department_id;not null" json:"department_id"` // 所属部门
	OrgCode      string `gorm:"column:org_code;not null" json:"org_code"`           // 应用系统所属组织机构编码
	DeployPlace  string `gorm:"column:deploy_place" json:"deploy_place"`            // 部署地点
	DeletedAt    int64  `gorm:"column:deleted_at" json:"deleted_at"`                // 删除时间(逻辑删除)
}

func (m *ProvinceHistory) BeforeCreate(_ *gorm.DB) (err error) {
	if m == nil {
		return nil
	}

	if m.ID == 0 {
		if m.ID, err = utils.GetUniqueID(); err != nil {
			log.Errorf("failed to general unique id, err: %v", err)
			err = errorcode.Desc(errorcode.PublicUniqueIDError)
			return err
		}

	}

	return nil
}

// TableName ProvinceHistory's table name
func (*ProvinceHistory) TableName() string {
	return TableNameProvinceHistory
}
