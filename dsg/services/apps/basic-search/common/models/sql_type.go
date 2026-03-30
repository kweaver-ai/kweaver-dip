package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
)

type ModelID string

func NewModelID(id uint64) ModelID {
	return ModelID(strconv.FormatUint(id, 10))
}

func (m *ModelID) String() string {
	return string(*m)
}

func (m *ModelID) Uint64() uint64 {
	if len(*m) == 0 {
		return 0
	}

	uintId, err := strconv.ParseUint(string(*m), 10, 64)
	if err != nil {
		panic(err)
	}

	return uintId
}

// Value 实现数据库驱动所支持的值
// 没有该方法会将ModelID在驱动层转换后string，导致与数据库定义类型不匹配
func (m ModelID) Value() (driver.Value, error) {
	return m.Uint64(), nil
}

func (m *ModelID) Scan(src any) error {
	if src == nil {
		return nil
	}

	switch v := src.(type) {
	case int64:
		*m = ModelID(strconv.FormatUint(uint64(v), 10))

	case uint64:
		*m = ModelID(strconv.FormatUint(v, 10))

	case []byte:
		*m = ModelID(v)

	default:
		return errors.New("invalid type")
	}

	return nil
}

func (m *ModelID) IsInvalid() bool {
	return len(*m) < 1 || m.Uint64() < 1
}

type SQLSlice[T any] []T

func (s *SQLSlice[T]) Scan(src any) error {
	var bytes []byte
	switch v := src.(type) {
	case []byte:
		bytes = v

	case string:
		bytes = []byte(v)

	default:
		return errors.New(fmt.Sprint("Failed to unmarshal JSON value:", src))
	}

	return json.Unmarshal(bytes, &s)
}

func (s SQLSlice[T]) Value() (driver.Value, error) {
	return json.Marshal(s)
}

func (SQLSlice[T]) GormDataType() string {
	return "string"
}

type UserID string

func NewUserID[T ~string](userId T) UserID {
	return UserID(userId)
}

func (u UserID) Value() (driver.Value, error) {
	return u.String(), nil
}

func (u UserID) String() string {
	return string(u)
}
