package service

type MsgEntity[T any] struct {
	Header  any `json:"header"`
	Payload T   `json:"payload"`
}

const (
	AuthChangeMethodDelete = "delete"
)

type UpdateAuthedUsersMsgBody struct {
	ServiceID   string   `json:"service_id"`
	AuthedUsers []string `json:"authed_users"`
	Method      string   `json:"method"`
}
