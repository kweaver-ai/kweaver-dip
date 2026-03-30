package gorm

import (
	"fmt"
	"regexp"

	"github.com/go-sql-driver/mysql"

	"errors"

	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
)

// newErrSubServiceAlreadyExists 返回错误码 DataView.SubService.AlreadyExists
func newErrSubServiceAlreadyExists(name string) error {
	return errorcode.SubServiceAlreadyExists.Desc(name)
}

// newErrSubServiceNotFound 返回错误码 DataView.SubService.NotFound
func newErrSubServiceNotFound(id uuid.UUID) error {
	return errorcode.SubServiceNotFound.Desc(id)
}

// newErrSubServiceDatabaseError 返回错误码 DataView.SubService.DatabaseError
func newErrSubServiceDatabaseError(err error) error {
	return errorcode.SubServiceDatabaseError.Detail(err.Error())
}

const (
	// ref: https://dev.mysql.com/doc/mysql-errors/5.7/en/server-error-reference.html#error_er_dup_entry
	MySQLErrorNumber_ER_DUP_ENTRY = 1062
)

// isDuplicatedOnKey 判断 err 是否是指定 key 冲突
func isDuplicatedOnKey(err error, key string) (ok bool) {
	if err == nil {
		return
	}

	me := new(mysql.MySQLError)
	if !errors.As(err, &me) {
		return
	}

	if me.Number != MySQLErrorNumber_ER_DUP_ENTRY {
		return
	}

	_, gotKey, _ := parseMySQLErrorMessage_ER_DUP_ENTRY(me.Message)
	return gotKey == key
}

// reg_ER_DUP_ENTRY 匹配 ER_DUP_ENTRY 的 message 的 entry 和 key
//
// ref: https://dev.mysql.com/doc/mysql-errors/5.7/en/server-error-reference.html#error_er_dup_entry
var reg_ER_DUP_ENTRY = regexp.MustCompile(`Duplicate entry '(.*)' for key '(.*)'`)

// parseMySQLErrorMessage_ER_DUP_ENTRY parse the message of ER_DUP_ENTRY
func parseMySQLErrorMessage_ER_DUP_ENTRY(msg string) (entry, key string, err error) {
	result := reg_ER_DUP_ENTRY.FindStringSubmatch(msg)
	if len(result) != 3 {
		err = fmt.Errorf("unable to parse message of ER_DUP_ENTRY: %q", msg)
		return
	}

	entry, key = result[1], result[2]
	return
}
