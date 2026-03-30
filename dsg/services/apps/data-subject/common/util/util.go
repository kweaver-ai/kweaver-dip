package util

import (
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
	"net/url"
	"os"
	"runtime"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/gin-gonic/gin"
	"github.com/jinzhu/copier"
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
func XssEscape(values string) string {
	if values == "" {
		return values
	}
	special := strings.NewReplacer(`<`, `&lt;`, `>`, `&gt;`, `select`, `查询`, `drop`, `删除表`, `delete`, `删除数据`, `update`, `更新`, `insert`,
		`插入`, `SELECT`, `查询`, `DROP`, `删除表`, `DELETE`, `删除数据`, `UPDATE`, `更新`, `INSERT`, `插入`, `script`, `脚本`, `SCRIPT`, `脚本`, `ALTER`,
		`修改结构`, `alter`, `修改结构`, `create`, `创建`, `CREATE`, `创建`)
	return special.Replace(values)
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

func StringMap[T any](ts []T, key func(T) string) map[string]T {
	r := make(map[string]T)
	for i := range ts {
		if k := key(ts[i]); k != "" {
			r[k] = ts[i]
		}
	}
	return r
}

func IsEmpty[R any](r R) bool {
	var empty R
	return fmt.Sprintf("%v", r) == fmt.Sprintf("%v", empty)
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

func GetParentID(path string) string {
	paths := strings.Split(path, "/")
	length := len(paths)
	if length <= 1 {
		return ""
	}
	return paths[length-2]
}

func GetParentByID(path, cid string) string {
	index := strings.Index(path, cid)
	if index < 36 {
		return ""
	}
	end := index - 1
	start := end - 36
	return path[start:end]
}

// CUDString   从ss中，选出来新增的，更新的，删除的
func CUDString[S any, F any](ss []S, fs []F, sk func(S) string, tk func(F) string) (cs, us, ds []S) {
	add := make([]S, 0)
	update := make([]S, 0)
	del := make([]S, 0)

	idSet := make(map[string]S)

	for _, s := range ss {
		if key := sk(s); !IsEmpty(key) {
			idSet[key] = s
		}
	}
	for _, t := range fs {
		key := tk(t)
		if IsEmpty(key) {
			continue
		}
		s, ok := idSet[key]
		if ok {
			update = append(update, s)
			delete(idSet, key)
		} else {
			add = append(add, s)
		}
	}
	for _, s := range ss {
		del = append(del, s)
	}
	return add, update, del
}

// CE Conditional expression 条件表达式
func CE(condition bool, res1 any, res2 any) any {
	if condition {
		return res1
	}
	return res2
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
