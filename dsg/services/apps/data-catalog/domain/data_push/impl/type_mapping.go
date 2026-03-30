package impl

import (
	"fmt"
	"strings"
)

var dbMapping = map[string]map[string]string{
	"mysql-postgresql": {
		"TINYINT":  "INT2",
		"INT":      "INT4",
		"BIGINT":   "INT8",
		"DOUBLE":   "FLOAT8",
		"DATETIME": "TIMESTAMP",
	},
	"postgresql-mysql": {
		"INT2":      "TINYINT",
		"INT4":      "INT",
		"INT8":      "BIGINT",
		"FLOAT8":    "DOUBLE",
		"TIMESTAMP": "DATETIME",
	},
	"dameng-postgresql": {
		"INTEGER": "INT4",
		"CHAR":    "BPCHAR",
		"INT":     "INT4",
	},
	"postgresql-dameng": {
		"INT4":   "INTEGER",
		"BPCHAR": "CHAR",
	},
	"dameng-mysql": {
		"INTEGER": "INT",
	},
	"mysql-dameng": {
		"INT": "INTEGER",
	},
}

func dbTypeMapping(source, target string, sourceType string) string {
	key := fmt.Sprintf("%v-%v", source, target)
	key = strings.ReplaceAll(key, "maria", "mysql")
	typeDict, ok := dbMapping[key]
	if ok {
		return typeDict[sourceType]
	}
	return ""
}
