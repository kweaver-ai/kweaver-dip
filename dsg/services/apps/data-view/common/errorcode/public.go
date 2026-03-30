package errorcode

import "github.com/kweaver-ai/idrm-go-common/errorcode"

const (
	PublicInvalidParameter = errorcode.PublicInvalidParameter
)

func Desc(errCode string, args ...any) error {
	return errorcode.Desc(errCode, args...)
}

func Detail(errCode string, err any, args ...any) error {
	return errorcode.Detail(errCode, err, args...)
}
