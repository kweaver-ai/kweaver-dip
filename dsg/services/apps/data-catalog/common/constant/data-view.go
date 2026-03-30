package constant

import "github.com/kweaver-ai/idrm-go-frame/core/enum"

type FormViewType enum.Object

var (
	FormViewTypeDatasource  = enum.New[FormViewType](1, "datasource")   //元数据视图
	FormViewTypeCustom      = enum.New[FormViewType](2, "custom")       //自定义视图
	FormViewTypeLogicEntity = enum.New[FormViewType](3, "logic_entity") //逻辑实体视图
)

var CustomViewSource = "custom_view_source"
var LogicEntityViewSource = "logic_entity_view_source"
var DefaultViewSourceSchema = ".default"

var ViewSourceSchema = "default"

var SampleDataCount = "sample_data_count"
var SampleDataType = "sample_data_type"
var Synthetic = "synthetic"
var Real = "real"
