package notification

import (
	"errors"
	"regexp"

	"github.com/go-sql-driver/mysql"
)

// 用于匹配 idx_work_order 冲突
var mysqlErrorMessageDuplicateEntryForIDXWorkOrder = regexp.MustCompile(`Duplicate entry '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-\d+' for key 'idx_work_order'`)

// 判断 err 是否是"工单告警对应的用户通知已经存在"
func IsAlreadyExistsForWorkOrderAlarm(err error) bool {
	myErr := new(mysql.MySQLError)
	if !errors.As(err, &myErr) {
		return false
	}

	if myErr.Number != 1062 {
		return false
	}

	return mysqlErrorMessageDuplicateEntryForIDXWorkOrder.MatchString(myErr.Message)
}
