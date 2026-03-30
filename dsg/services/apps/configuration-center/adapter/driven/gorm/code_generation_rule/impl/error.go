package impl

import (
	"github.com/go-sql-driver/mysql"
)

var ErrMySQLDuplicatedKey = &mysql.MySQLError{Number: 1062}
