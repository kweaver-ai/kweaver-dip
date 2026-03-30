package model

import (
	"time"

	"github.com/google/uuid"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
)

const TableNameElecLicenceColumn = "elec_licence_column"

type ElecLicenceColumn struct {
	ID                          uint64     `gorm:"primaryKey;column:id;type:bigint(20);not null"`
	ElecLicenceColumnID         string     `gorm:"column:elec_licence_column_id;type:varchar(50);not null"`
	ElecLicenceID               string     `gorm:"column:elec_licence_id;type:varchar(50)"`
	TechnicalName               string     `gorm:"column:technical_name;not null;comment:列技术名称" json:"technical_name"` // 技术名称
	BusinessName                string     `gorm:"column:business_name;comment:列业务名称" json:"business_name"`            // 业务名称
	PhoneticAbbreviation        string     `gorm:"column:phonetic_abbreviation;type:varchar(100)"`
	ControlType                 string     `gorm:"column:control_type;type:varchar(100)"`
	DataType                    string     `gorm:"column:data_type;type:varchar(100)"`
	AfDataType                  string     `gorm:"column:af_data_type;type:varchar(50)"`
	Size                        int32      `gorm:"column:size;type:int"`
	Accuracy                    string     `gorm:"column:accuracy;type:varchar(10)"`
	CorrespondStandardAttribute string     `gorm:"column:correspond_standard_attribute;type:varchar(100)"`
	ExampleData                 string     `gorm:"column:example_data;type:varchar(500)"`
	IsShow                      string     `gorm:"column:is_show;type:varchar(100)"`
	IsControlled                string     `gorm:"column:is_controlled;type:varchar(100)"`
	ValueRange                  string     `gorm:"column:value_range;type:varchar(100)"`
	LicenceBasicCode            string     `gorm:"column:licence_basic_code;type:varchar(255)"`
	ItemID                      string     `gorm:"column:item_id;type:varchar(255)"`
	Index                       string     `gorm:"column:index;type:varchar(255)"`
	Colspan                     string     `gorm:"column:colspan;type:varchar(255)"`
	Placeholder                 string     `gorm:"column:placeholder;type:varchar(255)"`
	Description                 string     `gorm:"column:description;type:varchar(255)"`
	IsAllowNull                 string     `gorm:"column:is_allow_null;type:varchar(255)"`
	FileSuffix                  string     `gorm:"column:file_suffix;type:varchar(255)"`
	FileData                    string     `gorm:"column:file_data;type:varchar(255)"`
	Addon                       string     `gorm:"column:addon;type:varchar(255)"`
	Rows                        string     `gorm:"column:rows;type:varchar(255)"`
	Options                     string     `gorm:"column:options;type:varchar(1000)"`
	Head                        string     `gorm:"column:head;type:varchar(255)"`
	IsInitItem                  string     `gorm:"column:is_init_item;type:varchar(255)"`
	Cols                        string     `gorm:"column:cols;type:varchar(255)"`
	DateViewFormat              string     `gorm:"column:date_view_format;type:varchar(255)"`
	IsSensitive                 string     `gorm:"column:is_sensitive;type:varchar(255)"`
	DataEditType                string     `gorm:"column:data_edit_type;type:varchar(255)"`
	Childrens                   string     `gorm:"column:childrens;type:varchar(255)"`
	Type                        string     `gorm:"column:type;type:varchar(10)"`
	DeleteFlag                  string     `gorm:"column:delete_flag;type:varchar(2)"`
	Creator                     string     `gorm:"column:creator;type:varchar(50)"`
	CreatorName                 string     `gorm:"column:creator_name;type:varchar(50)"`
	CreatorPart                 string     `gorm:"column:creator_part;type:varchar(50)"`
	CreatorPartName             string     `gorm:"column:creator_part_name;type:varchar(50)"`
	CreateTime                  *time.Time `gorm:"column:create_time;type:datetime"`
	Updater                     string     `gorm:"column:updater;type:varchar(50)"`
	UpdaterName                 string     `gorm:"column:updater_name;type:varchar(50)"`
	UpdaterPart                 string     `gorm:"column:updater_part;type:varchar(50)"`
	UpdaterPartName             string     `gorm:"column:updater_part_name;type:varchar(50)"`
	UpdateTime                  *time.Time `gorm:"column:update_time;type:datetime;autoUpdateTime"`
	Deleter                     string     `gorm:"column:deleter;type:varchar(50)"`
	DeleterName                 string     `gorm:"column:deleter_name;type:varchar(50)"`
	DeleterPart                 string     `gorm:"column:deleter_part;type:varchar(50)"`
	DeleterPartName             string     `gorm:"column:deleter_part_name;type:varchar(50)"`
	DeleteTime                  *time.Time `gorm:"column:delete_time;type:datetime"`
	OrgCode                     string     `gorm:"column:orgcode;type:varchar(50)"`
	OrgName                     string     `gorm:"column:orgname;type:varchar(50)"`
}

func (*ElecLicenceColumn) TableName() string {
	return TableNameElecLicenceColumn
}

func (m *ElecLicenceColumn) BeforeCreate(_ *gorm.DB) error {
	var err error
	if m == nil {
		return nil
	}
	if m.ID == 0 {
		if m.ID, err = utils.GetUniqueID(); err != nil {
			return err
		}
	}
	if m.ElecLicenceColumnID == "" {
		m.ElecLicenceColumnID = uuid.New().String()
	}

	return err
}
