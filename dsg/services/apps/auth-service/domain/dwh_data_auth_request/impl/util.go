package impl

import (
	"fmt"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	"github.com/samber/lo"
	"strings"
	"time"
)

func genApplyID(id string) string {
	return fmt.Sprintf("%s-%d", id, time.Now().Unix())
}
func parseApplyID(id string) string {
	ps := strings.Split(id, "-")
	return strings.Join(ps[:len(ps)-1], "-")
}
func genSubViewName(viewBusinessName, userName string) string {
	s := []rune(fmt.Sprintf("%s-%s", viewBusinessName, userName))
	if len(s) <= 255 {
		return string(s)
	}
	viewBusinessNameRunes := []rune(viewBusinessName)
	if len(viewBusinessNameRunes) > 127 {
		viewBusinessNameRunes = viewBusinessNameRunes[:127]
	}
	userNameRunes := []rune(userName)
	if len(userNameRunes) > 127 {
		userNameRunes = userNameRunes[:127]
	}
	return fmt.Sprintf("%s-%s", string(viewBusinessNameRunes), string(userNameRunes))
}

func genUniqueSubViewName(name string) string {
	nameRunes := []rune(fmt.Sprintf("%s-%v", name, time.Now().Unix()))
	if len(nameRunes) <= 255 {
		return string(nameRunes)
	}
	return string(nameRunes[len(nameRunes)-255:])
}

// timestampToExpiredAt 毫秒时间戳转时间
func timestampToExpiredAt(s int64) *meta_v1.Time {
	if s == 0 {
		return nil
	}
	return lo.ToPtr(meta_v1.NewTime(time.UnixMilli(s)))
}

func expiredAtToTimestamp(s *meta_v1.Time) int64 {
	if s == nil {
		return 0
	}
	return s.UnixMilli()
}

func expiredAtStrToTimestamp(s string) int64 {
	return expiredAtToTimestamp(convertExpiredAt(s))
}

func convertExpiredAt(s string) *meta_v1.Time {
	if s == "nil" || s == "" {
		return nil
	}
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		return nil
	}
	return lo.ToPtr(meta_v1.NewTime(t))
}
func formatExpiredAt(s *meta_v1.Time) string {
	if s == nil {
		return "nil"
	}
	return s.Format(time.RFC3339)
}
