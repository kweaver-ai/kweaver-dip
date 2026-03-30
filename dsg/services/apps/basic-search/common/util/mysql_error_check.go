package util

import (
	"errors"

	"github.com/go-sql-driver/mysql"
)

func IsMysqlDuplicatedErr(err error) bool {
	var mysqlErr *mysql.MySQLError
	if errors.As(err, &mysqlErr) && mysqlErr.Number == 1062 {
		return true
	}
	return false
}
