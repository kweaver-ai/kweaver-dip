package form_view

type MsgEntity[T any] struct {
	Header  any `json:"header"`
	Payload T   `json:"payload"`
}

const (
	AuthChangeMethodDelete = "delete"
)

type UpdateAuthedUsersMsgBody struct {
	FormViewID  string   `json:"form_view_id"`
	AuthedUsers []string `json:"authed_users"`
	Method      string   `json:"method"`
}
