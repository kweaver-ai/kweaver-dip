package constant

type FlowchartEditStatus int32

const (
	FlowchartEditStatusStart FlowchartEditStatus = iota
	FlowchartEditStatusCreating
	FlowchartEditStatusNormal
	FlowchartEditStatusEditing
	FlowchartEditStatusEnd
)

func (f FlowchartEditStatus) ToInt32() int32 {
	return int32(f)
}

type FlowchartEditStatusString string

const (
	FlowchartEditStatusStringCreating FlowchartEditStatusString = "creating"
	FlowchartEditStatusStringNormal   FlowchartEditStatusString = "released"
	FlowchartEditStatusStringEditing  FlowchartEditStatusString = "editing"
)

var (
	FlowchartEditStatusStringToInt = map[FlowchartEditStatusString]FlowchartEditStatus{
		FlowchartEditStatusStringCreating: FlowchartEditStatusCreating,
		FlowchartEditStatusStringNormal:   FlowchartEditStatusNormal,
		FlowchartEditStatusStringEditing:  FlowchartEditStatusEditing,
	}

	FlowchartEditStatusIntToString = map[FlowchartEditStatus]FlowchartEditStatusString{
		FlowchartEditStatusCreating: FlowchartEditStatusStringCreating,
		FlowchartEditStatusNormal:   FlowchartEditStatusStringNormal,
		FlowchartEditStatusEditing:  FlowchartEditStatusStringEditing,
	}
)

type FlowchartReleaseChangedStatus string

const (
	FlowchartReleaseChangedStatusUnchanged FlowchartReleaseChangedStatus = "unchanged"
	FlowchartReleaseChangedStatusChanged   FlowchartReleaseChangedStatus = "changed"
)

var FlowchartReleaseChangedStatusToInt = map[FlowchartReleaseChangedStatus]FlowchartEditStatus{
	FlowchartReleaseChangedStatusUnchanged: FlowchartEditStatusNormal,
	FlowchartReleaseChangedStatusChanged:   FlowchartEditStatusEditing,
}

type FlowchartReleaseState string

const (
	FlowchartReleaseStateReleased   FlowchartReleaseState = "released"
	FlowchartReleaseStateUnreleased FlowchartReleaseState = "unreleased"
)

var FlowchartReleaseStateToEditStatus = map[FlowchartReleaseState][]FlowchartEditStatus{
	FlowchartReleaseStateReleased:   {FlowchartEditStatusNormal, FlowchartEditStatusEditing},
	FlowchartReleaseStateUnreleased: {FlowchartEditStatusCreating},
}

type FlowchartUnitType int32

const (
	FlowchartUnitTypeUnknown FlowchartUnitType = iota
	FlowchartUnitTypeStage
	FlowchartUnitTypeNode
	FlowchartUnitTypeConnector
)

type FlowchartSaveType = string

const (
	FlowchartSaveTypeTemp  FlowchartSaveType = "temp"
	FlowchartSaveTypeFinal FlowchartSaveType = "final"
)

type FlowchartShape = string

const (
	FlowchartShapeStage FlowchartShape = "stage"
	FlowchartShapeNode  FlowchartShape = "input_node"
	FlowchartShapeLink  FlowchartShape = "edge"
)

type FlowchartNodeStartMode int32

const (
	FlowchartNodeStartModeUnknown FlowchartNodeStartMode = iota
	FlowchartNodeStartModeAnyNodeCompletion
	FlowchartNodeStartModeAllNodeCompletion
	FlowchartNodeStartModeAnyNodeStart
)

func (f FlowchartNodeStartMode) ToInt32() int32 {
	return int32(f)
}

func (f FlowchartNodeStartMode) ToFlowchartNodeStartModeString() FlowchartNodeStartModeString {
	switch f {
	case FlowchartNodeStartModeAnyNodeCompletion:
		return FlowchartNodeStartModeStringAnyNodeCompletion

	case FlowchartNodeStartModeAllNodeCompletion:
		return FlowchartNodeStartModeStringAllNodeCompletion

	case FlowchartNodeStartModeAnyNodeStart:
		return FlowchartNodeStartModeStringAnyNodeStart

	default:
		return ""
	}
}

type FlowchartNodeStartModeString string

const (
	FlowchartNodeStartModeStringAnyNodeCompletion FlowchartNodeStartModeString = "any_node_completion"
	FlowchartNodeStartModeStringAllNodeCompletion FlowchartNodeStartModeString = "all_node_completion"
	FlowchartNodeStartModeStringAnyNodeStart      FlowchartNodeStartModeString = "any_node_start"
)

func (f FlowchartNodeStartModeString) ToFlowchartNodeStartMode() FlowchartNodeStartMode {
	return flowchartNodeStartModeStringToInt[f]
}

func (f FlowchartNodeStartModeString) ToInt32() int32 {
	return f.ToFlowchartNodeStartMode().ToInt32()
}

var flowchartNodeStartModeStringToInt = map[FlowchartNodeStartModeString]FlowchartNodeStartMode{
	FlowchartNodeStartModeStringAnyNodeCompletion: FlowchartNodeStartModeAnyNodeCompletion,
	FlowchartNodeStartModeStringAllNodeCompletion: FlowchartNodeStartModeAllNodeCompletion,
	FlowchartNodeStartModeStringAnyNodeStart:      FlowchartNodeStartModeAnyNodeStart,
}

type FlowchartNodeCompletionMode int32

const (
	FlowchartNodeCompletionModeUnknown FlowchartNodeCompletionMode = iota
	FlowchartNodeCompletionModeManual
	FlowchartNodeCompletionModeAuto
)

func (f FlowchartNodeCompletionMode) ToInt32() int32 {
	return int32(f)
}

func (f FlowchartNodeCompletionMode) ToFlowchartNodeCompletionModeString() FlowchartNodeCompletionModeString {
	switch f {
	case FlowchartNodeCompletionModeManual:
		return FlowchartNodeCompletionModeStringManual

	case FlowchartNodeCompletionModeAuto:
		return FlowchartNodeCompletionModeStringAuto

	default:
		return ""
	}
}

type FlowchartNodeCompletionModeString string

const (
	FlowchartNodeCompletionModeStringManual FlowchartNodeCompletionModeString = "manual"
	FlowchartNodeCompletionModeStringAuto   FlowchartNodeCompletionModeString = "auto"
)

func (f FlowchartNodeCompletionModeString) ToFlowchartNodeCompletionMode() FlowchartNodeCompletionMode {
	return flowchartNodeCompletionModeStringToInt[f]
}

func (f FlowchartNodeCompletionModeString) ToInt32() int32 {
	return f.ToFlowchartNodeCompletionMode().ToInt32()
}

var flowchartNodeCompletionModeStringToInt = map[FlowchartNodeCompletionModeString]FlowchartNodeCompletionMode{
	FlowchartNodeCompletionModeStringManual: FlowchartNodeCompletionModeManual,
	FlowchartNodeCompletionModeStringAuto:   FlowchartNodeCompletionModeAuto,
}

type FlowchartTaskCompletionMode int32

const (
	FlowchartTaskCompletionModeUnknown FlowchartTaskCompletionMode = iota
	FlowchartTaskCompletionModeManual
	FlowchartTaskCompletionModeAuto
)

func (f FlowchartTaskCompletionMode) ToInt32() int32 {
	return int32(f)
}

func (f FlowchartTaskCompletionMode) ToFlowchartTaskCompletionModeString() FlowchartTaskCompletionModeString {
	switch f {
	case FlowchartTaskCompletionModeManual:
		return FlowchartTaskCompletionModeStringManual

	case FlowchartTaskCompletionModeAuto:
		return FlowchartTaskCompletionModeStringAuto

	default:
		return ""
	}
}

type FlowchartTaskCompletionModeString string

const (
	FlowchartTaskCompletionModeStringManual FlowchartTaskCompletionModeString = "manual"
	FlowchartTaskCompletionModeStringAuto   FlowchartTaskCompletionModeString = "auto"
)

func (f FlowchartTaskCompletionModeString) ToFlowchartTaskCompletionMode() FlowchartTaskCompletionMode {
	switch f {
	case FlowchartTaskCompletionModeStringManual:
		return FlowchartTaskCompletionModeManual

	case FlowchartTaskCompletionModeStringAuto:
		return FlowchartTaskCompletionModeAuto

	default:
		return FlowchartTaskCompletionModeUnknown
	}
}

func (f FlowchartTaskCompletionModeString) ToInt32() int32 {
	return f.ToFlowchartTaskCompletionMode().ToInt32()
}

type FlowchartConfigStatusString string

const (
	FlowchartConfigStatusNormal      FlowchartConfigStatusString = "normal"
	FlowchartConfigStatusMissingRole FlowchartConfigStatusString = "missingRole"
)

type FlowchartConfigStatusInt32 int32

const (
	FlowchartConfigStatusInt32Normal      = 1
	FlowchartConfigStatusInt32MissingRole = 2
)

var flowchartConfigStatusKeyMap = map[FlowchartConfigStatusString]FlowchartConfigStatusInt32{
	FlowchartConfigStatusNormal:      FlowchartConfigStatusInt32Normal,
	FlowchartConfigStatusMissingRole: FlowchartConfigStatusInt32MissingRole,
}

var flowchartConfigStatusValueMap = map[FlowchartConfigStatusInt32]FlowchartConfigStatusString{
	FlowchartConfigStatusInt32Normal:      FlowchartConfigStatusNormal,
	FlowchartConfigStatusInt32MissingRole: FlowchartConfigStatusMissingRole,
}

func (s FlowchartConfigStatusString) ToInt32() FlowchartConfigStatusInt32 {
	return flowchartConfigStatusKeyMap[s]
}

func (s FlowchartConfigStatusInt32) ToString() FlowchartConfigStatusString {
	return flowchartConfigStatusValueMap[s]
}

type SystemRoleStatusInt32 int32

const (
	SystemRoleStatusNormalInt32  SystemRoleStatusInt32 = 1 // 角色正常
	SystemRoleStatusDiscardInt32 SystemRoleStatusInt32 = 2 // 角色被删除
)

type SystemRoleStatusString string

const (
	SystemRoleStatusStringNormal  SystemRoleStatusString = "normal"  // 角色正常
	SystemRoleStatusStringDiscard SystemRoleStatusString = "discard" // 角色被删除
)

var systemRoleStatusInt32ValueMap = map[SystemRoleStatusInt32]SystemRoleStatusString{
	SystemRoleStatusNormalInt32:  SystemRoleStatusStringNormal,
	SystemRoleStatusDiscardInt32: SystemRoleStatusStringDiscard,
}

func (s SystemRoleStatusInt32) ToString() SystemRoleStatusString {
	return systemRoleStatusInt32ValueMap[s]
}

const (
	SystemRoleIsPresetInt32 = 1 // 是预置角色
	SystemRoleCustomInt32   = 0 // 用户自定义角色

)

type TaskType int32

const (
	TaskTypeNormal TaskType = 1 << iota
	_                       //TaskTypeModeling
	_                       //TaskTypeStandardization
	_                       //TaskTypeIndicator
	TaskTypeFieldStandard
	TaskTypeDataCollecting
	TaskTypeDataProcessing
	TaskTypeModeling
	// 数据目录理解任务
	_
	// 同步数据表视图任务
	TaskTypeSyncDataView
	// 指标开发任务
	TaskTypeIndicatorProcessing
	//数据模型任务
	TaskTypeDataMainBusiness

	// 主干业务任务
	TaskTypeMainBusiness

	// 业务建模诊断任务
	TaskTypeBusinessDiagnosis
	// 标准新建任务
	TaskTypeStandardization
)

func (t TaskType) ToTaskTypeString() TaskTypeString {
	return taskTypeToTaskTypeString[t]
}

func (t TaskType) ToInt32() int32 {
	return int32(t)
}

type TaskTypes int32

func (t TaskTypes) And(a TaskType) TaskTypes {
	return TaskTypes(t.ToInt32() & a.ToInt32())
}

func (t TaskTypes) Or(a TaskType) TaskTypes {
	return TaskTypes(t.ToInt32() | a.ToInt32())
}

func (t TaskTypes) ToInt32() int32 {
	return int32(t)
}

func (t TaskTypes) ToTaskTypeStrings() (ret TaskTypeStrings) {
	for _, taskType := range [...]TaskType{
		TaskTypeNormal,
		TaskTypeModeling,
		TaskTypeFieldStandard,
		TaskTypeDataCollecting,
		TaskTypeDataProcessing,
		TaskTypeSyncDataView,
		TaskTypeIndicatorProcessing,
		TaskTypeDataMainBusiness,
		TaskTypeMainBusiness,
		TaskTypeBusinessDiagnosis,
		TaskTypeStandardization,
	} {
		if t.And(taskType) > 0 {
			ret = append(ret, taskType.ToTaskTypeString())
		}
	}

	return
}

type TaskTypeString string

const (
	TaskTypeStringNormal              TaskTypeString = "normal"
	TaskTypeStringFieldStandard       TaskTypeString = "fieldStandard"
	TaskTypeStringDataCollecting      TaskTypeString = "dataCollecting"
	TaskTypeStringDataProcessing      TaskTypeString = "dataProcessing"
	TaskTypeStringModeling            TaskTypeString = "modeling"
	TaskTypeStringSyncDataView        TaskTypeString = "syncDataView"
	TaskTypeStringIndicatorProcessing TaskTypeString = "indicatorProcessing"
	TaskTypeStringDataMainBusiness    TaskTypeString = "dataModeling"
	TaskTypeStringMainBusiness        TaskTypeString = "mainBusiness"
	TaskTypeStringBusinessDiagnosis   TaskTypeString = "businessDiagnosis"
	TaskTypeStringStandardization     TaskTypeString = "standardization"
)

func (t TaskTypeString) ToTaskType() TaskType {
	return taskTypeStringToTaskType[t]
}

func (t TaskTypeString) ToInt32() int32 {
	return t.ToTaskType().ToInt32()
}

type TaskTypeStrings []TaskTypeString

func (t TaskTypeStrings) ToTaskTypes() (ret TaskTypes) {
	for _, s := range t {
		ret = ret.Or(s.ToTaskType())
	}

	return
}

func (t TaskTypeStrings) ToInt32() int32 {
	return t.ToTaskTypes().ToInt32()
}

// ValidTaskTypeString 验证是否是合法的任务类型字符串
func ValidTaskTypeString(s string) bool {
	_, ok := taskTypeStringToTaskType[TaskTypeString(s)]
	return ok
}

var (
	taskTypeStringToTaskType = map[TaskTypeString]TaskType{
		TaskTypeStringNormal:              TaskTypeNormal,
		TaskTypeStringModeling:            TaskTypeModeling,
		TaskTypeStringFieldStandard:       TaskTypeFieldStandard,
		TaskTypeStringDataCollecting:      TaskTypeDataCollecting,
		TaskTypeStringDataProcessing:      TaskTypeDataProcessing,
		TaskTypeStringSyncDataView:        TaskTypeSyncDataView,
		TaskTypeStringIndicatorProcessing: TaskTypeIndicatorProcessing,
		TaskTypeStringDataMainBusiness:    TaskTypeDataMainBusiness,
		TaskTypeStringMainBusiness:        TaskTypeMainBusiness,
		TaskTypeStringBusinessDiagnosis:   TaskTypeBusinessDiagnosis,
		TaskTypeStringStandardization:     TaskTypeStandardization,
	}

	taskTypeToTaskTypeString = map[TaskType]TaskTypeString{
		TaskTypeNormal:              TaskTypeStringNormal,
		TaskTypeModeling:            TaskTypeStringModeling,
		TaskTypeFieldStandard:       TaskTypeStringFieldStandard,
		TaskTypeDataCollecting:      TaskTypeStringDataCollecting,
		TaskTypeDataProcessing:      TaskTypeStringDataProcessing,
		TaskTypeSyncDataView:        TaskTypeStringSyncDataView,
		TaskTypeIndicatorProcessing: TaskTypeStringIndicatorProcessing,
		TaskTypeDataMainBusiness:    TaskTypeStringDataMainBusiness,
		TaskTypeMainBusiness:        TaskTypeStringMainBusiness,
		TaskTypeBusinessDiagnosis:   TaskTypeStringBusinessDiagnosis,
		TaskTypeStandardization:     TaskTypeStringStandardization,
	}
)

type WorkOrderType int32

const (
	WorkOrderTypeDataComprehension WorkOrderType = 1 << iota
	WorkOrderTypeDataAggregation
	WorkOrderTypeStandardization
	WorkOrderTypeDataFusion
	WorkOrderTypeDataQuality
	WorkOrderTypeDataQualityAudit
)

func (w WorkOrderType) ToWorkOrderTypeString() WorkOrderString {
	return WorkOrderTypeToTaskTypeString[w]
}

func (w WorkOrderType) ToInt32() int32 {
	return int32(w)
}

type WorkOrderTypes int32

func (w WorkOrderTypes) And(a WorkOrderType) WorkOrderTypes {
	return WorkOrderTypes(w.ToInt32() & a.ToInt32())
}

func (t WorkOrderTypes) Or(a WorkOrderType) WorkOrderTypes {
	return WorkOrderTypes(t.ToInt32() | a.ToInt32())
}

func (w WorkOrderTypes) ToInt32() int32 {
	return int32(w)
}

func (t WorkOrderTypes) ToWorkOrderTypeStrings() (ret WorkOrderTypeStrings) {
	for _, workOrdeType := range [...]WorkOrderType{
		WorkOrderTypeDataComprehension,
		WorkOrderTypeDataAggregation,
		WorkOrderTypeStandardization,
		WorkOrderTypeDataFusion,
		WorkOrderTypeDataQualityAudit,
	} {
		if t.And(workOrdeType) > 0 {
			ret = append(ret, workOrdeType.ToWorkOrderTypeString())
		}
	}

	return
}

type WorkOrderString string

const (
	WorkOrderTypeStringDataComprehension   WorkOrderString = "data_comprehension"
	WorkOrderTypeStringDataAggregation     WorkOrderString = "data_aggregation"
	WorkOrderTypeStringDataStandardization WorkOrderString = "data_standardization"
	WorkOrderTypeStringDataFusion          WorkOrderString = "data_fusion"
	WorkOrderTypeStringDataQalityAudit     WorkOrderString = "data_quality_audit"
)

func (w WorkOrderString) ToTaskType() WorkOrderType {
	return WorkOrderTypeStringToTaskType[w]
}

func (w WorkOrderString) ToInt32() int32 {
	return w.ToTaskType().ToInt32()
}

type WorkOrderTypeStrings []WorkOrderString

func (w WorkOrderTypeStrings) ToTaskTypes() (ret WorkOrderTypes) {
	for _, s := range w {
		ret = ret.Or(s.ToTaskType())
	}

	return
}

func (w WorkOrderTypeStrings) ToInt32() int32 {
	return w.ToTaskTypes().ToInt32()
}

// ValidTaskTypeString 验证是否是合法的任务类型字符串
func ValidWorkOrderTypeString(s string) bool {
	_, ok := WorkOrderTypeStringToTaskType[WorkOrderString(s)]
	return ok
}

var (
	WorkOrderTypeStringToTaskType = map[WorkOrderString]WorkOrderType{
		WorkOrderTypeStringDataComprehension:   WorkOrderTypeDataComprehension,
		WorkOrderTypeStringDataAggregation:     WorkOrderTypeDataAggregation,
		WorkOrderTypeStringDataStandardization: WorkOrderTypeStandardization,
		WorkOrderTypeStringDataFusion:          WorkOrderTypeDataFusion,
		WorkOrderTypeStringDataQalityAudit:     WorkOrderTypeDataQualityAudit,
	}
	WorkOrderTypeToTaskTypeString = map[WorkOrderType]WorkOrderString{
		WorkOrderTypeDataComprehension: WorkOrderTypeStringDataComprehension,
		WorkOrderTypeDataAggregation:   WorkOrderTypeStringDataAggregation,
		WorkOrderTypeStandardization:   WorkOrderTypeStringDataStandardization,
		WorkOrderTypeDataFusion:        WorkOrderTypeStringDataFusion,
		WorkOrderTypeDataQualityAudit:  WorkOrderTypeStringDataQalityAudit,
	}
)
