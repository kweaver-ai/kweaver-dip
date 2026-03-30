package user_mgm

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
