package dameng

import (
	"database/sql"
	"database/sql/driver"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"gorm.io/gorm/migrator"
	"gorm.io/gorm/schema"
)

// Dummy driver to satisfy sql.Open("dm", ...)
type noopDriver struct{}

func (d *noopDriver) Open(name string) (driver.Conn, error) {
	return nil, nil
}

func init() {
	sql.Register("dm", &noopDriver{})
}

type Config struct {
	DriverName        string
	DSN               string
	Conn              gorm.ConnPool
	DefaultStringSize uint
}

type Dialector struct {
	*Config
}

func Open(dsn string) gorm.Dialector {
	return &Dialector{Config: &Config{DSN: dsn}}
}

func New(config Config) gorm.Dialector {
	return &Dialector{Config: &config}
}

func (d Dialector) Name() string {
	return "dm"
}

func (d Dialector) Initialize(db *gorm.DB) (err error) {
	if d.DriverName == "" {
		d.DriverName = "dm"
	}
	if d.Conn != nil {
		db.ConnPool = d.Conn
	} else {
		// We don't actually open it, or if we do, it uses our dummy driver
		// ensuring no CGO linkage
		db.ConnPool, err = sql.Open(d.DriverName, d.DSN)
	}
	return
}

func (d Dialector) Migrator(db *gorm.DB) gorm.Migrator {
	return migrator.Migrator{Config: migrator.Config{DB: db, Dialector: d}}
}

func (d Dialector) DataTypeOf(field *schema.Field) string { return "" }
func (d Dialector) DefaultValueOf(field *schema.Field) clause.Expression {
	return clause.Expr{SQL: "NULL"}
}
func (d Dialector) BindVarTo(writer clause.Writer, stmt *gorm.Statement, v interface{}) {
	writer.WriteByte('?')
}
func (d Dialector) QuoteTo(writer clause.Writer, str string) {
	writer.WriteByte('"')
	writer.WriteString(str)
	writer.WriteByte('"')
}
func (d Dialector) Explain(sql string, vars ...interface{}) string {
	return sql
}
