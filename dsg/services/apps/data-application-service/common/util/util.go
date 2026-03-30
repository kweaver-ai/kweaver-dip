package util

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
	"os"
	"regexp"
	"runtime"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jinzhu/copier"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/middleware"
)

func Copy(source, dest interface{}) error {
	return copier.Copy(dest, source)
}

func ParseTimeToUnixMilli(dbTime time.Time) (int64, error) {

	timeTemplate := "2006-01-02 15:04:05"
	timeStr := dbTime.String()
	cstLocal, _ := time.LoadLocation("Asia/Shanghai")
	x, err := time.ParseInLocation(timeTemplate, timeStr, cstLocal)
	if err != nil {
		return -1, err
	}
	return x.UnixMilli(), nil
}

func PathExists(path string) bool {
	_, err := os.Lstat(path)
	return !os.IsNotExist(err)
}

func IsContain(items []string, item string) bool {
	for _, eachItem := range items {
		if eachItem == item {
			return true
		}
	}
	return false
}

func GetCallerPosition(skip int) string {
	if skip <= 0 {
		skip = 1
	}
	_, filename, line, _ := runtime.Caller(skip)
	projectPath := "data-application-service"
	ps := strings.Split(filename, projectPath)
	pl := len(ps)
	return fmt.Sprintf("%s %d", ps[pl-1], line)
}

func RandomInt(max int) int {
	source := rand.NewSource(time.Now().UnixNano())
	r := rand.New(source)
	return r.Intn(max)
}

func SliceUnique(s []string) []string {
	m := make(map[string]uint8)
	result := make([]string, 0)
	for _, i := range s {
		_, ok := m[i]
		if !ok {
			m[i] = 1
			result = append(result, i)
		}
	}
	return result
}

func TransAnyStruct(a any) map[string]any {
	result := make(map[string]any)
	bts, err := json.Marshal(a)
	if err != nil {
		return result
	}
	json.Unmarshal(bts, &result)
	return result
}

// IsLimitExceeded total / limit 向上取整是否大于等于 offset，小于则超出总数
func IsLimitExceeded(limit, offset, total float64) bool {
	return math.Ceil(total/limit) < offset
}

func PtrToValue[T any](ptr *T) (res T) {
	if ptr == nil {
		return
	}

	return *ptr
}

func ValueToPtr[T any](v T) *T {
	return &v
}

func CheckKeyword(keyword *string) bool {
	*keyword = strings.TrimSpace(*keyword)
	if len([]rune(*keyword)) > 128 {
		return false
	}
	return regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5-_]*$").Match([]byte(*keyword))
}

func GenFlowchartVersionName(vid int32) string {
	return fmt.Sprintf("v%d", vid)
}

func NewUUID() string {
	return uuid.NewString()

	// u := uuid.New()
	// buf := make([]byte, 32)
	//
	// hex.Encode(buf[0:8], u[0:4])
	// hex.Encode(buf[8:12], u[4:6])
	// hex.Encode(buf[12:16], u[6:8])
	// hex.Encode(buf[16:20], u[8:10])
	// hex.Encode(buf[20:], u[10:])
	// return string(buf)
}

func CopyMap[K comparable, V any](src map[K]V) map[K]V {
	if src == nil {
		return nil
	}

	dest := make(map[K]V, len(src))
	for k, v := range src {
		dest[k] = v
	}

	return dest
}

func ToInt32s[T ~int32](in []T) []int32 {
	if in == nil {
		return nil
	}

	ret := make([]int32, len(in))
	for i := range in {
		ret[i] = int32(in[i])
	}

	return ret
}

func SetToken(c *gin.Context, token string) {
	c.Set(interception.Token, token)
}

// Deprecated: Use GoCommon/interception.BearerTokenFromContext
func GetToken(ctx context.Context) (token string) {
	token, _ = interception.BearerTokenFromContextCompatible(ctx)
	return
}

func SetUser(c *gin.Context, userInfo *dto.UserInfo) {
	c.Set(interception.InfoName, userInfo)
}

func GetUser(c context.Context) (userInfo *dto.UserInfo) {
	value := c.Value(interception.InfoName)

	if value == nil {
		return &dto.UserInfo{}
	}

	switch v := value.(type) {
	case *dto.UserInfo:
		return v
	case *middleware.User:
		return &dto.UserInfo{Name: v.Name, Id: v.ID}
	default:
		return &dto.UserInfo{}
	}
}

func TimeFormat(t *time.Time) string {
	if t == nil {
		return ""
	}

	return t.Format("2006-01-02 15:04:05")
}

func PointerToString(s *string) string {
	if s == nil {
		return ""
	}

	return *s
}

func ApplyIDEncode(serviceID string) (applyID string) {
	return serviceID + "_" + GetUniqueString()
}

func ApplyIDDecode(applyID string) (serviceID string) {
	split := strings.Split(applyID, "_")
	if len(split) != 2 {
		return ""
	}
	return split[0]
}

func Quote(tx *gorm.DB, s string) string {
	buf := &bytes.Buffer{}
	tx.QuoteTo(buf, s)
	return buf.String()
}
