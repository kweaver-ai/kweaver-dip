package models

import (
	"database/sql/driver"
	"fmt"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
)

type CommonTime struct {
	time.Time
}

func (t *CommonTime) UnmarshalJSON(data []byte) (err error) {
	if len(data) == 2 || string(data) == "null" {
		*t = CommonTime{Time: time.Time{}}
		return
	}
	loc, _ := time.LoadLocation("Asia/Shanghai")
	now, err := time.ParseInLocation(`"`+constant.CommonTimeFormat+`"`, string(data), loc)
	*t = CommonTime{Time: now}
	return
}

// MarshalJSON on JSONTime format Time field with Y-m-d H:i:s
func (t CommonTime) MarshalJSON() ([]byte, error) {
	if t.Time.IsZero() {
		return []byte("null"), nil
	}
	formatted := fmt.Sprintf("\"%s\"", t.Format(constant.CommonTimeFormat))
	return []byte(formatted), nil
}

// Value insert timestamp into mysql need this function.
func (t CommonTime) Value() (driver.Value, error) {
	var zeroTime time.Time
	if t.Time.UnixNano() == zeroTime.UnixNano() {
		return nil, nil
	}
	return t.Time, nil
}

// Scan value of time.Time
func (t *CommonTime) Scan(v interface{}) error {
	value, ok := v.(time.Time)
	if ok {
		*t = CommonTime{Time: value}
		return nil
	}
	return fmt.Errorf("can not convert %v to timestamp", v)
}
