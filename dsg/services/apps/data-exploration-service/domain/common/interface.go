package common

import (
	"context"
)

type Dict struct {
	Code        string `json:"code"`        // 返回代码
	Description string `json:"description"` //返回消息
	Data        *Data  `json:"data"`        // 返回数据对象
}

type Data struct {
	Id    string `json:"id"` // 唯一标识，dictid
	Enums []struct {
		Id          string `json:"id"`          //码值id
		Code        string `json:"code"`        // 码值code
		Value       string `json:"value"`       // 码值描述
		Description string `json:"description"` // 码值说明
	} `json:"enums"` // 字段信息
	State string `json:"state"` // 是否停用，disable停用,enable启用
}

type Domain interface {
	GetToken(ctx context.Context) (string, error)
	GetDictList(ctx context.Context, dictId string) (dictList *Dict, err error)
}
