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
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"

	"github.com/google/uuid"
	"golang.org/x/text/encoding/simplifiedchinese"
	"golang.org/x/text/transform"

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
	projectPath := "configuration-center"
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

func NewUniqueID() (uint64, error) {
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

func PackedSlice[T int | int32 | string](slice []T) []T {
	var res []T
	for i, s := range slice {
		if i == 0 {
			res = append(res, s)
			continue
		}
		if res[len(res)-1] == s {
			continue
		}
		res = append(res, s)
	}
	return res
}
func PackedSliceWithoutFirst[T int | int32 | string](slice []T) []T {
	var res []T
	var first T
	for i, s := range slice {
		if i == 0 {
			res = append(res, s)
			first = s
			continue
		}
		if res[len(res)-1] == s && s != first {
			continue
		}
		res = append(res, s)
	}
	return res
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

// 设配ipv6的函数
func ParseHost(host string) string {
	if strings.Contains(host, ":") {
		return fmt.Sprintf("[%s]", host)
	}
	return host
}

func RandomLowLetterAndNumber(length int) string {
	b := make([]byte, length)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}
	return string(b)
}

func KeywordEscape(keyword string) string {
	special := strings.NewReplacer(`\`, `\\`, `_`, `\_`, `%`, `\%`, `'`, `\'`)
	return special.Replace(keyword)
}

func XssEscape(values string) string {
	if values == "" {
		return values
	}
	special := strings.NewReplacer(`<`, `&lt;`, `>`, `&gt;`, `select`, `查询`, `drop`, `删除表`, `delete`, `删除数据`, `update`, `更新`, `insert`,
		`插入`, `SELECT`, `查询`, `DROP`, `删除表`, `DELETE`, `删除数据`, `UPDATE`, `更新`, `INSERT`, `插入`, `script`, `脚本`, `SCRIPT`, `脚本`, `ALTER`,
		`修改结构`, `alter`, `修改结构`, `create`, `创建`, `CREATE`, `创建`)
	return special.Replace(values)
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

// CE Conditional expression 条件表达式
func CE(condition bool, res1 any, res2 any) any {
	if condition {
		return res1
	}
	return res2
}

// FindTargetInSourceOrder 找出target在source中存在的元素，按source中的位置顺序返回
func FindTargetInSourceOrder(source []string, target []string) []int {
	// 创建target集合用于存在性检查
	targetSet := make(map[string]bool)
	for _, t := range target {
		targetSet[t] = true
	}

	// 按source顺序遍历，收集在target中存在的元素位置
	positions := make([]int, 0)
	for i, s := range source {
		if targetSet[s] {
			positions = append(positions, i)
		}
	}
	return positions
}

// 移除空值和重复的字符串
func RemoveEmptyAndDuplicates(list []string) []string {
	seen := make(map[string]bool)
	var result []string

	for _, item := range list {
		// 跳过空字符串
		if item == "" {
			continue
		}
		// 检查是否已存在
		if !seen[item] {
			seen[item] = true
			result = append(result, item)
		}
	}
	return result
}

// 按指定字符串截取后再分割
func SplitAfterDelimiter(text, delimiter, splitChar string) []string {
	index := strings.Index(text, delimiter)
	result := make([]string, 0)
	if index == -1 {
		return result
	}
	// 截取指定字符串之后的内容
	substring := text[index+len(delimiter):]
	parts := strings.Split(substring, splitChar)
	// 过滤空字符串
	for _, part := range parts {
		if part != "" {
			result = append(result, part)
		}
	}
	return result
}
