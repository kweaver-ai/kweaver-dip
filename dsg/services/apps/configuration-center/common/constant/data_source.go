package constant

import "github.com/kweaver-ai/idrm-go-frame/core/enum"

type SourceType enum.Object

var (
	Records    = enum.New[SourceType](1, "records")    //信息系统
	Analytical = enum.New[SourceType](2, "analytical") //数据仓库
	Sandbox    = enum.New[SourceType](3, "sandbox")    //数据沙箱
)

func SourceTypeStringToInt(sourceType string) int32 {
	return enum.ToInteger[SourceType](sourceType).Int32()
}

const (
	Connected    = 1 //已连接
	NotConnected = 2 //未连接
)
