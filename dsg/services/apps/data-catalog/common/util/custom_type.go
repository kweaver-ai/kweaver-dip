package util

import (
	"database/sql/driver"
	"fmt"
	"strconv"
	"time"
)

type Time struct {
	time.Time
}

func (t Time) MarshalJSON() ([]byte, error) {
	if t.IsZero() {
		return []byte{}, nil
	}

	// return StringToBytes(fmt.Sprintf("\"%s\"", t.Format(constant.LOCAL_TIME_FORMAT))), nil
	return StringToBytes(fmt.Sprintf("%d", t.UnixMilli())), nil
}

func (t *Time) UnmarshalJSON(data []byte) error {
	str := string(data)
	if str == "null" {
		return nil
	}

	// str = strings.Trim(str, "\"")
	// val, err := time.Parse(constant.LOCAL_TIME_FORMAT, str)
	// *t = Time{val}
	ts, err := strconv.ParseInt(str, 10, 64)
	*t = Time{time.UnixMilli(ts)}
	return err
}

func (t *Time) Scan(value interface{}) error {
	val, ok := value.(time.Time)
	if ok {
		*t = Time{val}
		return nil
	}
	return fmt.Errorf("can not convert %v to timestamp", value)
}

func (t Time) Value() (driver.Value, error) {
	if t.IsZero() {
		return nil, nil
	}
	return t.Time, nil
}
