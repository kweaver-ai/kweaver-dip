package util

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
	"net/url"
	"os"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/biocrosscoder/flex/typed/functools"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jinzhu/copier"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"github.com/xuri/excelize/v2"
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
	projectPath := "data-catalog"
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

func KeywordEscape(keyword string) string {
	special := strings.NewReplacer(`\`, `\\`, `_`, `\_`, `%`, `\%`, `'`, `\'`)
	return special.Replace(keyword)
}

type IntUintFloat interface {
	~int | ~int8 | ~int16 | ~int32 | ~int64 | ~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 | ~float32 | ~float64
}

func CombineToString[T IntUintFloat | ~string](in []T, sep string) string {
	if in == nil {
		return ""
	}

	ret := ""
	for i := range in {
		if i == 0 {
			ret = fmt.Sprintf("%v", in[i])
			continue
		}

		ret = fmt.Sprintf("%s%s%v", ret, sep, in[i])
	}
	return ret
}

func ToStrings[T any](in []T) []string {
	if in == nil {
		return nil
	}

	ret := make([]string, len(in))
	for i := range in {
		ret[i] = fmt.Sprintf("%v", in[i])
	}
	return ret
}

// Write return file stream
func Write(ctx *gin.Context, fileName string, file *excelize.File) {
	ctx.Writer.Header().Set("Content-Type", "application/octet-stream")
	fileName = url.QueryEscape(fileName)
	disposition := fmt.Sprintf("attachment; filename*=utf-8''%s", fileName)
	ctx.Writer.Header().Set("Content-disposition", disposition)
	ctx.Writer.Header().Set("Content-Transfer-Encoding", "binary")
	_ = file.Write(ctx.Writer)

}

const alphabetSize = 26

func GenExcelCellCols(size int) []string {
	retArr := make([]string, size)
	baseChar := 'A'
	var curChar uint8
	for i := 0; i < size; i++ {
		baseIndex := i / alphabetSize
		curChar = uint8(baseChar) + uint8(i%alphabetSize)
		if baseIndex == 0 {
			retArr[i] = fmt.Sprintf("%c", curChar)
		} else {
			retArr[i] = fmt.Sprintf("%s%c", retArr[baseIndex-1], curChar)
		}
	}
	return retArr
}

func Delete[T any](s []T, i int) []T {
	if i == len(s)-1 {
		return s[:i-1]
	}
	return append(s[:i], s[i+1:]...)
}

func CopyUseJson(dest any, src any) error {
	b, err := json.Marshal(src)
	if err != nil {
		return err
	}

	return json.Unmarshal(b, dest)
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

// CE Conditional expression 条件表达式
func CE(condition bool, res1 any, res2 any) any {
	if condition {
		return res1
	}
	return res2
}
func TimeFormat(t *time.Time) string {
	if t == nil {
		return ""
	}

	return t.Format("2006-01-02 15:04:05")
}
func TimeParse(t string) *time.Time {
	if t == "" {
		return nil
	}
	parse, err := time.ParseInLocation("2006-01-02 15:04:05", t, time.Local)
	if err != nil {
		return nil
	}
	return &parse
}
func TimeParseReliable(t string) (*time.Time, error) {
	if t == "" {
		return nil, nil
	}
	parse, err := time.ParseInLocation("2006-01-02 15:04:05", t, time.Local)
	if err != nil {
		return nil, err
	}
	return &parse, nil
}

func MilliToTime(milli int64) *time.Time {
	t := time.Unix(0, milli*int64(time.Millisecond))
	return &t
}
func SliceAdd(slice *[]string, s string) {
	if s != "" {
		*slice = append(*slice, s)
	}
	return
}
func SliceMuAdd(slice *[]string, s []string) {
	if len(s) != 0 {
		*slice = append(*slice, s...)
	}
	return
}

func Contains(slice []string, element string) bool {
	for _, v := range slice {
		if v == element {
			return true
		}
	}
	return false
}

// 带类型的列表转换为any列表
func TypedListToAnyList[T any](entry []T) []any {
	return functools.Map(func(x T) any {
		return x
	}, entry)
}

// 深拷贝切片
func DeepCopySlice[T any](entry []T) (copy []T) {
	data, _ := json.Marshal(entry)
	json.Unmarshal(data, &copy)
	return
}

// 自动恢复panic并记录错误日志
func SafeRun(ctx context.Context, task func(context.Context) error) (err error) {
	if ctx == nil {
		ctx = context.TODO()
	}
	defer func() {
		util.RecordErrLog(ctx, recover())
		util.RecordErrLog(ctx, err)
	}()
	err = task(ctx)
	return
}

func UniqueID() uint64 {
	id, _ := utils.GetUniqueID()
	return id
}

func CalculateOffset(pageNumber, recordNumber int) int {
	return (pageNumber - 1) * recordNumber
}

func BoolToInt(b bool) int {
	if strconv.FormatBool(b) == "true" {
		return 1
	}
	return 0
}
