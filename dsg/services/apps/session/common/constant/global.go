package constant

import "time"

const (
	ServiceName = "session"

	DefaultHttpRequestTimeout = 60 * time.Second
)

var (
	StaticPath string
	AccessIP   string
	AccessPort string
)
var SSOLogin int32 = 1
