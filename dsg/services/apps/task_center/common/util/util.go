package util

import (
	"encoding/json"
	"math/rand"
	"os"
	"strconv"
	"strings"
	"time"
	"unsafe"

	"github.com/google/uuid"
	"gorm.io/gorm/clause"

	"github.com/jinzhu/copier"
)

func Copy(source, dest interface{}) error {
	return copier.Copy(dest, source)
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

func NewUUID() string {
	return uuid.NewString()
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

// GormColumnContainKeyword 返回 gorm 过滤条件，字段 column 包括关键字 keyword
func GormColumnContainKeyword[Column ~string](column Column, keyword string) clause.Expression {
	return clause.Like{
		Column: column,
		Value:  "%" + KeywordEscape(keyword) + "%",
	}
}

// GormAnyColumnsContainKeyword 返回 gorm 过滤条件，字段 columns 中的任意一个包括关键字 keyword
func GormAnyColumnsContainKeyword[Column ~string](columns []Column, keyword string) clause.Expression {
	var expressions []clause.Expression
	for _, c := range columns {
		expressions = append(expressions, GormColumnContainKeyword(c, keyword))
	}
	return clause.Or(expressions...)
}

// GormColumnContainAnyKeywords 返回 gorm 过滤条件，字段 column 包括关键字 keywords 中的任意一个
func GormColumnContainAnyKeywords[Column ~string](column Column, keywords []string) clause.Expression {
	var expressions []clause.Expression
	for _, k := range keywords {
		expressions = append(expressions, GormColumnContainKeyword(column, k))
	}
	return clause.Or(expressions...)
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

// CE Conditional expression 条件表达式
func CE(condition bool, res1 any, res2 any) any {
	if condition {
		return res1
	}
	return res2
}

// StringToBytes converts string to byte slice without a memory allocation.
func StringToBytes(s string) []byte {
	return *(*[]byte)(unsafe.Pointer(
		&struct {
			string
			Cap int
		}{s, len(s)},
	))
}

// BytesToString converts byte slice to string without a memory allocation.
func BytesToString(b []byte) string {
	return *(*string)(unsafe.Pointer(&b))
}
