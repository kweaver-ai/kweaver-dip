package code_generation_rule

import (
	"errors"
	"fmt"
)

// 未改变
// TODO: 应该移动到 repository 层
var ErrUnchanged = errors.New("编码生成规则未改变")

// 已经存在
// TODO: 应该移动到 repository 层
var ErrAlreadyExists = errors.New("already exists")

// 指定的 CodeGenerationRule 未找到
var ErrNotFound = errors.New("not found")

// 期望生成的编码超过终止值
var ErrExceedEnding = errors.New("exceed ending")

type UnmarshalPatchError struct {
	// underlying json error
	Err error
}

func (e *UnmarshalPatchError) Error() string {
	return fmt.Sprintf("unmarshal patch error: %v", e.Err)
}

func (_ *UnmarshalPatchError) Is(target error) bool {
	_, ok := target.(*UnmarshalPatchError)
	return ok
}
