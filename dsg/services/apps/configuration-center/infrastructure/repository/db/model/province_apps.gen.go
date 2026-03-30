package model

import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
	"gorm.io/plugin/soft_delete"
)

const TableNameProvinceApps = "province"

// Apps mapped from table <aApps>
type ProvinceApps struct {
	ID           uint64                `gorm:"column:id;primaryKey" json:"id"`                                // 雪花id
	AppId        string                `gorm:"column:app_id;not null" json:"app_id"`                          // 省平台注册ID
	AccessKey    string                `gorm:"column:access_key;not null" json:"access_key"`                  // 省平台应用key
	AccessSecret string                `gorm:"column:access_secret;not null" json:"access_secret"`            // 省平台应用secret
	ProvinceIp   string                `gorm:"column:province_ip;not null" json:"province_ip"`                // 对外提供ip地址
	ProvinceUrl  string                `gorm:"column:province_url;not null" json:"province_url"`              // 对外提供url地址
	ContactName  string                `gorm:"column:contact_name;not null" json:"contact_name"`              // 联系人姓名
	ContactPhone string                `gorm:"column:contact_phone;not null" json:"contact_phone"`            // 联系人联系方式
	AreaId       uint32                `gorm:"column:area_id;not null" json:"area_id"`                        // 应用领域
	RangeId      uint32                `gorm:"column:range_id;not null" json:"range_id"`                      // 应用范围
	OrgId        string                `gorm:"column:org_id;not null" json:"org_name"`                        // 应用系统所属组织机构名称
	OrgCode      string                `gorm:"column:org_code;not null" json:"org_code"`                      // 应用系统所属组织机构编码
	DeployPlace  string                `gorm:"column:deploy_place" json:"deploy_place"`                       // 部署地点
	DeletedAt    soft_delete.DeletedAt `gorm:"column:deleted_at;not null;softDelete:milli" json:"deleted_at"` // 删除时间(逻辑删除)
}

func (m *ProvinceApps) BeforeCreate(_ *gorm.DB) (err error) {
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

// TableName Apps's table name
func (*ProvinceApps) TableName() string {
	return TableNameProvinceApps
}
