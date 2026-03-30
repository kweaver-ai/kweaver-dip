package mariadb

import "github.com/go-sql-driver/mysql"

type codeType uint16

const (
	ER_DUP_ENTRY codeType = 1062
)

func Is(err error, code codeType) bool {
	sqlError := mysql.MySQLError{
		Number: uint16(code),
	}
	return sqlError.Is(err)
}
