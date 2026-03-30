package constant

import "github.com/kweaver-ai/idrm-go-frame/core/enum"

type FormViewType enum.Object

var (
	FormViewTypeDatasource  = enum.New[FormViewType](1, "datasource")   //元数据视图
	FormViewTypeCustom      = enum.New[FormViewType](2, "custom")       //自定义视图
	FormViewTypeLogicEntity = enum.New[FormViewType](3, "logic_entity") //逻辑实体视图
)

// 库表发布状态
type FormViewReleaseStatus enum.Object

var (
	FormViewReleased   = enum.New[FormViewReleaseStatus](1, "publish")     //发布
	FormViewUnreleased = enum.New[FormViewReleaseStatus](2, "unpublished") //未发布
)

// 库表采集状态
type FormViewScanStatus enum.Object

var (
	FormViewUniformity = enum.New[FormViewScanStatus](1, "uniformity") //无变化
	FormViewNew        = enum.New[FormViewScanStatus](2, "new")        //新增
	FormViewModify     = enum.New[FormViewScanStatus](3, "modify")     //变更
	FormViewDelete     = enum.New[FormViewScanStatus](4, "delete")     //删除
)

// 库表编辑状态
type FormViewEditStatus enum.Object

var (
	FormViewDraft  = enum.New[FormViewEditStatus](1, "draft")  //草稿
	FormViewLatest = enum.New[FormViewEditStatus](2, "latest") //最新
)

type FormViewFieldScanStatus enum.Object

var (
	FormViewFieldUniformity = enum.New[FormViewFieldScanStatus](1, "uniformity")  //无变化
	FormViewFieldNew        = enum.New[FormViewFieldScanStatus](2, "new")         //新增
	FormViewFieldModify     = enum.New[FormViewFieldScanStatus](3, "modify")      //变更
	FormViewFieldDelete     = enum.New[FormViewFieldScanStatus](4, "delete")      //删除
	FormViewFieldNotSupport = enum.New[FormViewFieldScanStatus](5, "not_support") //不支持类型
)

type FormViewSaveType enum.Object

var (
	FormViewSaveTypeTemp  = enum.New[FormViewSaveType](1, "temp")
	FormViewSaveTypeFinal = enum.New[FormViewSaveType](2, "final")
)
var ConcurrentCount = 10
var GoroutineMinTableCount = 100

var DataAccuracyNULL int32 = -1
