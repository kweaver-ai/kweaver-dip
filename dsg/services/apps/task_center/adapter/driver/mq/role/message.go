package role

//删除角色消息

type DeleteRoleMessage struct {
	Payload DeleteRolePayload `json:"payload"`
	Header  DeleteRoleHeader  `json:"header"`
}
type DeleteRolePayload struct {
	RoleId string `json:"roleId"`
}
type DeleteRoleHeader struct {
}

//删除用户角色关系

type DeleteUserRoleRelationMessage struct {
	Payload DeleteUserRoleRelationPayload `json:"payload"`
	Header  DeleteUserRoleRelationHeader  `json:"header"`
}
type DeleteUserRoleRelationPayload struct {
	RoleId string `json:"roleId"`
	UserId string `json:"userId"`
}
type DeleteUserRoleRelationHeader struct {
}

// DeleteMainBusinessMessage 删除主干业务消息体
type DeleteMainBusinessMessage struct {
	Payload DeleteMainBusinessPayload `json:"payload"`
	Header  DeleteMainBusinessHeader  `json:"header"`
}
type DeleteMainBusinessPayload struct {
	BusinessModelID string `json:"model_id"`
	MainBusinessID  string `json:"id"`
	SubjectDomainId string `json:"subject_domain_id"`
	ExecutorID      string `json:"executor_id"`
}
type DeleteMainBusinessHeader struct {
}

// DeleteBusinessDomainMessage 删除业务域消息体
type DeleteBusinessDomainMessage struct {
	Payload DeleteBusinessDomainPayload `json:"payload"`
	Header  DeleteBusinessDomainHeader  `json:"header"`
}
type DeleteBusinessDomainPayload struct {
	SubjectDomainId string `json:"id"`
	ExecutorID      string `json:"executor_id"`
}
type DeleteBusinessDomainHeader struct {
}

//DeleteBusinessFormMessage 删除主干业务消息体
type DeleteBusinessFormMessage struct {
	Payload DeleteBusinessFormPayload `json:"payload"`
	Header  DeleteBusinessFormHeader  `json:"header"`
}
type DeleteBusinessFormHeader struct {
}

type DeleteBusinessFormPayload struct {
	Id              string `json:"id"` // 表单ID
	MainBusinessId  string `json:"main_business_id"`
	BusinessModelId string `json:"business_model_id"`
}
