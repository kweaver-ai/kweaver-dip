package impl

import (
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	"time"
)

func zeroTime() *meta_v1.Time {
	nt := meta_v1.NewTime(time.Unix(0, 0))
	return &nt
}

func formatExpireTime(exp *meta_v1.Time) string {
	if exp == nil {
		return zeroTime().Format(time.RFC3339)
	}
	return exp.Format(time.RFC3339)
}

func convertExpireTime(t time.Time) *meta_v1.Time {
	if t.Unix() <= 0 {
		return nil
	}
	return &meta_v1.Time{Time: t}
}

func isExpire(t time.Time) bool {
	return t.Unix() <= time.Now().Unix()
}
