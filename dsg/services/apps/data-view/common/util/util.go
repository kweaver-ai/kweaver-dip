package util

import (
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
	"os"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/jinzhu/copier"
)

func init() {
	rand.Seed(time.Now().UnixNano())
}

const letters = "abcdefghijklmnopqrstuvwxyz0123456789"

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
	_, err := os.Stat(path)
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
	projectPath := "business-grooming"
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

// IsDuplicate 切片是否重复
func IsDuplicate(tmpArr []interface{}) bool {
	var set = map[interface{}]bool{}
	for _, v := range tmpArr {
		if set[v] {
			return true
		}
		set[v] = true
	}
	return false
}

// IsDuplicate 切片是否重复
func IsDuplicateString(tmpArr []string) bool {
	var set = map[string]bool{}
	for _, v := range tmpArr {
		if set[v] {
			return true
		}
		set[v] = true
	}
	return false
}
func ReNameOld(name string) string {
	if len(name) > 1 && string(name[len(name)-2]) == "-" && (name[len(name)-1] > 64 || name[len(name)-1] < 73) {
		atoi, _ := strconv.Atoi(string(name[len(name)-1]))
		return name[:len(name)-1] + strconv.Itoa(atoi+1)
	} else if len(name) > 2 && string(name[len(name)-3]) == "-" && (name[len(name)-1] > 64 || name[len(name)-1] < 73) && (name[len(name)-2] > 64 || name[len(name)-2] < 73) {
		atoi, _ := strconv.Atoi(name[len(name)-2:])
		return name[:len(name)-2] + strconv.Itoa(atoi+1)
	} else {
		return name + "-1"
	}
}

// ReName add -number to string .ex  abc -> abc-1;   abc-6-> abc-7
func ReName(name string) string {
	split := strings.Split(name, "-")
	if len(split) > 1 && IsNumber(split[len(split)-1]) {
		atoi, _ := strconv.Atoi(split[len(split)-1])
		return strings.Join(split[:len(split)-1], "-") + "-" + strconv.Itoa(atoi+1)
	} else {
		return name + "-1"
	}
}
func IsNumber(s string) bool {
	if len(s) == 0 {
		return false
	}
	for _, v := range []rune(s) {
		if !unicode.IsNumber(v) {
			return false
		}
	}
	return true
}

// AsInt returns the parameter as a int64
// or panics if it can't convert
func AsInt(param string) int64 {
	i, err := strconv.ParseInt(param, 0, 64)
	if err != nil {
		panic(err.Error())
	}
	return i
}

func KeywordEscape(keyword string) string {
	special := strings.NewReplacer(`\`, `\\`, `_`, `\_`, `%`, `\%`, `'`, `\'`)
	return special.Replace(keyword)
}

func CopyUseJson(dest any, src any) error {
	b, err := json.Marshal(src)
	if err != nil {
		return err
	}

	return json.Unmarshal(b, dest)
}

// DuplicateRemoval 切片去重
func DuplicateRemoval[T string | int | int32 | int64 | int8 | int16](tmpArr []T) []T {
	var set = map[T]bool{}
	var res = make([]T, 0, len(tmpArr))
	for _, v := range tmpArr {
		if !set[v] {
			res = append(res, v)
			set[v] = true
		}
	}
	return res
}

// DuplicateStringRemoval String切片去重
func DuplicateStringRemoval(tmpArr []string) []string {
	var set = map[string]bool{}
	var res = make([]string, 0, len(tmpArr))
	for _, v := range tmpArr {
		if !set[v] && v != "" {
			res = append(res, v)
			set[v] = true
		}
	}
	return res
}

func CutStringByCharCount(s string, count int) string {
	if len([]rune(s)) < count {
		return s
	}
	return string([]rune(s)[:count])
}

func RandomLowLetterAndNumber(length int) string {
	b := make([]byte, length)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}
	return string(b)
}

func IsEmpty[R any](r R) bool {
	var empty R
	return fmt.Sprintf("%v", r) == fmt.Sprintf("%v", empty)
}

// Combination  少量数据的简单拼接逻辑，分页情况下，每页20条数据，性能几乎没什么差距
func Combination[R any, S any, D any](ss []S, ds []D, fz func(S, D) R) []R {
	rs := make([]R, 0)

	for _, s := range ss {
		for _, d := range ds {
			if r := fz(s, d); !IsEmpty(r) {
				rs = append(rs, fz(s, d))
				break
			}
		}
	}
	return rs
}

func Gen[R any, D any](ds []D, f func(D) R) []R {
	rs := make([]R, 0)
	for _, d := range ds {
		if r := f(d); !IsEmpty(r) {
			rs = append(rs, r)
		}
	}
	return rs
}

// CE Conditional expression 条件表达式
func CE(condition bool, res1 any, res2 any) any {
	if condition {
		return res1
	}
	return res2
}

func QuotationMark(s string) string {
	if strings.HasPrefix(s, "\"") || strings.HasSuffix(s, "\"") { //防止拼接过情况
		return s
	}
	return "\"" + s + "\""
}

func ChQuotationMark(s string) string {
	if strings.HasPrefix(s, "\"") || strings.HasSuffix(s, "\"") { //防止拼接过情况
		return s
	}
	if regexp.MustCompile("[\u4e00-\u9fa5]+").Match([]byte(s)) {
		return "\"" + s + "\""
	}
	return s
}

func ChQuotationMarkFast(s string) string {
	if s[0] == 34 || s[len(s)-1] == 34 { //防止拼接过情况
		return s
	}
	for _, v := range s {
		if unicode.Is(unicode.Han, v) {
			return "\"" + s + "\""
		}
	}
	return s
}

func BoolToInt8(t bool) int8 {
	if t {
		return 1
	}
	return 0
}

//PreSubString 返回字符串的前n个字符
func PreSubString(s string, n int) string {
	cmts := []rune(s)
	if len(cmts) <= n {
		return s
	}
	return string(cmts[:128])
}
