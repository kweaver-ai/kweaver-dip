package util

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"math"
	"math/rand"
	"os"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"github.com/samber/lo"
	"golang.org/x/text/encoding/simplifiedchinese"
	"golang.org/x/text/transform"

	"github.com/jinzhu/copier"
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

// UTF82GBK : transform UTF8 rune into GBK byte array
func UTF82GBK(src string) ([]byte, error) {
	GB18030 := simplifiedchinese.All[0]
	return ioutil.ReadAll(transform.NewReader(bytes.NewReader([]byte(src)), GB18030.NewEncoder()))
}

// GBK2UTF8 : transform  GBK byte array into UTF8 string
func GBK2UTF8(src []byte) (string, error) {
	GB18030 := simplifiedchinese.All[0]
	bytes, err := ioutil.ReadAll(transform.NewReader(bytes.NewReader(src), GB18030.NewDecoder()))
	return string(bytes), err
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
	projectPath := "data-exploration-service"
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

func Transfer[T any](d any) (*T, error) {
	result := new(T)
	bts, err := json.Marshal(d)
	if err != nil {
		return result, err
	}
	if err := json.Unmarshal(bts, result); err != nil {
		return result, err
	}
	return result, nil
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

func NewModelID() (uint64, error) {
	id, err := utils.GetUniqueID()
	if err != nil {
		log.Errorf("failed to general unique id, err: %v", err)
		return 0, errorcode.Desc(errorcode.PublicUniqueIDError)
	}

	return id, nil
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

func CopyUseJson(dest any, src any) error {
	strSrc, ok := src.(string)
	if ok {
		return json.Unmarshal([]byte(strSrc), dest)
	}
	pSrc, pok := src.(*any)
	if pok {
		pStrSrc, sok := (*pSrc).(string)
		if sok {
			return json.Unmarshal([]byte(pStrSrc), dest)
		}
	}
	return json.Unmarshal(lo.T2(json.Marshal(src)).A, dest)
}

func GetJsonInAnswer[T any](answer string) (*T, error) {
	first := strings.Index(answer, "{")
	last := strings.LastIndex(answer, "}")
	if first < 0 || last < 0 {
		return nil, fmt.Errorf("invalid  answer  %v", answer)
	}
	answer = answer[first : last+1]

	result := new(T)
	if err := json.Unmarshal([]byte(answer), result); err != nil {
		return nil, err
	}
	return result, nil
}

func Strval(value interface{}) string {
	var str string
	if value == nil {
		return str
	}
	// vt := value.(type)
	switch value.(type) {
	case float64:
		ft := value.(float64)
		str = strconv.FormatFloat(ft, 'f', -1, 64)
	case float32:
		ft := value.(float32)
		str = strconv.FormatFloat(float64(ft), 'f', -1, 64)
	case int:
		it := value.(int)
		str = strconv.Itoa(it)
	case uint:
		it := value.(uint)
		str = strconv.Itoa(int(it))
	case int8:
		it := value.(int8)
		str = strconv.Itoa(int(it))
	case uint8:
		it := value.(uint8)
		str = strconv.Itoa(int(it))
	case int16:
		it := value.(int16)
		str = strconv.Itoa(int(it))
	case uint16:
		it := value.(uint16)
		str = strconv.Itoa(int(it))
	case int32:
		it := value.(int32)
		str = strconv.Itoa(int(it))
	case uint32:
		it := value.(uint32)
		str = strconv.Itoa(int(it))
	case int64:
		it := value.(int64)
		str = strconv.FormatInt(it, 10)
	case uint64:
		it := value.(uint64)
		str = strconv.FormatUint(it, 10)
	case string:
		str = value.(string)
	case []byte:
		str = string(value.([]byte))
	default:
		newValue, _ := json.Marshal(value)
		str = string(newValue)
	}

	return str
}

func KeywordEscape(keyword string) string {
	special := strings.NewReplacer(`\`, `\\`, `_`, `\_`, `%`, `\%`, `'`, `\'`)
	return special.Replace(keyword)
}
