package model

type SubjectDomainWithRelation struct {
	SubjectDomain
	RelatedObjectID string `gorm:"column:related_object_id" json:"related_object_id"` //业务对象关联的业务对象ID
	RelatedFieldID  string `gorm:"column:related_field_id" json:"related_field_id"`   // 业务表字段id
	RelatedFormID   string `gorm:"column:related_form_id" json:"related_form_id"`     // 业务表id
}

type SubjectDomainCount struct {
	LevelBusinessDomain int64 `gorm:"level_business_domain" json:"level_business_domain"` // 第1级对象个数，即 业务域 //todo
	LevelSubjectDomain  int64 `gorm:"level_subject_domain" json:"level_subject_domain"`   // 第2级对象个数，即 业务对象
	LevelBusinessObject int64 `gorm:"level_business_object" json:"level_business_object"` // 第3级对象个数，即 业务对象/业务活动
	LevelBusinessObj    int64 `gorm:"level_business_obj" json:"level_business_obj"`       // 第3级对象个数，即 业务对象
	LevelBusinessAct    int64 `gorm:"level_business_act" json:"level_business_act"`       // 第4级对象个数，即 业务活动
	LevelLogicEntities  int64 `gorm:"level_logic_entities" json:"level_logic_entities"`   // 第4级对象个数，即 逻辑实体
	LevelLogicalView    int64 `gorm:"level_logical_view" json:"level_logical_view"`       // 业务对象关联的
	LevelAttributes     int64 `gorm:"level_attributes" json:"level_attributes"`           // 第5级对象个数，即 属性
}

type SubjectDomainSimple struct {
	ID     string `gorm:"id" json:"id" `          // 对象id，uuid
	RootID string `gorm:"root_id" json:"root_id"` // 对象root_id，uuid
}

type HasChildModel struct {
	RootID string `json:"root_id"`
	Plen   int    `json:"plen"`
}
