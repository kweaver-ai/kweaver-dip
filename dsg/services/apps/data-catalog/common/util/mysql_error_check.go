package util

import (
	"errors"
	"regexp"

	"github.com/go-sql-driver/mysql"
)

func IsMysqlDuplicatedErr(err error) bool {
	var mysqlErr *mysql.MySQLError
	if errors.As(err, &mysqlErr) && mysqlErr.Number == 1062 {
		return true
	}
	return false
}

// IsMysqlDataTooLongErr 判断是否为字段长度超出（MySQL 错误码 1406）
func IsMysqlDataTooLongErr(err error) bool {
	var mysqlErr *mysql.MySQLError
	if errors.As(err, &mysqlErr) && mysqlErr.Number == 1406 {
		return true
	}
	return false
}

// ExtractTooLongColumn 从错误信息中提取超长字段名（若存在）
// 典型错误信息："Error 1406: Data too long for column 'target_name' at row 1"
func ExtractTooLongColumn(err error) string {
	if err == nil {
		return ""
	}
	re := regexp.MustCompile(`(?i)column\s+'([^']+)'`)
	matches := re.FindStringSubmatch(err.Error())
	if len(matches) >= 2 {
		return matches[1]
	}
	return ""
}
