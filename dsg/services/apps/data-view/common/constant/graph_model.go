package constant

import "github.com/kweaver-ai/idrm-go-frame/core/enum"

type GraphModelType enum.Object

var (
	GraphModelTypeMeta     = enum.New[GraphModelType](1, "meta", "元模型")
	GraphModelTypeTopic    = enum.New[GraphModelType](2, "topic", "专题模型")
	GraphModelTypeThematic = enum.New[GraphModelType](3, "thematic", "主题模型")
)
