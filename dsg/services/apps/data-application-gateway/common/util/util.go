package util

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"math"
	"math/rand"
	"net/http"
	"os"
	"regexp"
	"runtime"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jinzhu/copier"
	"github.com/spf13/cast"
	"gorm.io/gorm"

	"github.com/kweaver-ai/idrm-go-common/interception"
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
	projectPath := "data-application-gateway"
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

func GetBody(req *http.Request) (body []byte, err error) {
	if req.Body == nil {
		return nil, nil
	}

	body, err = ioutil.ReadAll(req.Body)
	if err != nil {
		return nil, err
	}
	req.Body = ioutil.NopCloser(bytes.NewBuffer(body))

	return body, nil
}

func IsInt32(val float64) bool {
	f := float64(int32(val))
	return val == f
}

func IsInt64(val float64) bool {
	f := float64(int64(val))
	return val == f
}

func ToTime(value interface{}) time.Time {
	return cast.ToTimeInDefaultLocation(value, time.FixedZone("UTC+8", 8*60*60))
}

func InArrayString(array []string, target string) bool {
	for _, item := range array {
		if item == target {
			return true
		}
	}
	return false
}

func InArrayInt(array []int64, target int64) bool {
	for _, item := range array {
		if item == target {
			return true
		}
	}
	return false
}

func InArrayFloat(array []float64, target float64) bool {
	for _, item := range array {
		if item == target {
			return true
		}
	}
	return false
}

func InArrayTime(array []time.Time, target time.Time) bool {
	for _, item := range array {
		if item.Equal(target) {
			return true
		}
	}
	return false
}

func InArrayBool(array []bool, target bool) bool {
	for _, item := range array {
		if item == target {
			return true
		}
	}
	return false
}

func Quote(tx *gorm.DB, s string) string {
	buf := &bytes.Buffer{}
	tx.QuoteTo(buf, s)
	return buf.String()
}

func SetToken(c *gin.Context, token string) {
	c.Set(interception.Token, token)
}

func GetToken(ctx context.Context) (token string) {
	token, _ = interception.BearerTokenFromContextCompatible(ctx)
	return token
}
