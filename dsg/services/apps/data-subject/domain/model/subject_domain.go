package model

/////////////////// Get ///////////////////

type UpdateAttributesFormAndFieldIdReq struct {
	UpdateAttributesFormAndFieldIdQueryParam `param_type:"body"`
}
type UpdateAttributesFormAndFieldIdQueryParam struct {
	AssociatedAttribute []*UpdateAttributes `json:"logical_entity"`                     // 关联属性
	ObjectId            string              `json:"object_id" binding:"omitempty,uuid"` // 业务对象/业务活动 id
	FormId              string              `json:"form_id" binding:"required,uuid"`
}
type UpdateAttributes struct {
	Id      string `json:"id" binding:"required,uuid"`       // 属性id
	FieldId string `json:"field_id" binding:"required,uuid"` // 关联字段id
}

/////////////////// Get ///////////////////

type UpdateFormFiledRelevanceObjectAndActivityReq struct {
	UpdateFormFiledRelevanceObjectAndActivityParam `param_type:"body"`
}

type UpdateFormFiledRelevanceObjectAndActivityParam struct {
	AssociatedAttribute []*UpdateAttributes `json:"logical_entity"`                     // 关联属性
	ObjectId            string              `json:"object_id" binding:"omitempty,uuid"` // 业务对象/业务活动 id
	FormId              string              `json:"form_id" binding:"required,uuid"`
}
