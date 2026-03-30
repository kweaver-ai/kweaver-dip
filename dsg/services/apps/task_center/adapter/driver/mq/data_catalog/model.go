package data_catalog

type DataPushMsg[T any] struct {
	Header any `json:"header"`
	Body   T   `json:"payload"`
}
