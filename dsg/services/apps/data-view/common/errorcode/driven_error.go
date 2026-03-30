package errorcode

import (
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
)

func init() {
	errorcode.RegisterErrorCode(drivenErrorMap)
}

const (
	drivenPreCoder = constant.ServiceName + ".Driven."

	VirtualizationEngineError            = drivenPreCoder + "VirtualizationEngineError"
	GetViewError                         = drivenPreCoder + "GetViewError"
	CreateViewError                      = drivenPreCoder + "CreateViewError"
	DeleteViewError                      = drivenPreCoder + "DeleteViewError"
	ModifyViewError                      = drivenPreCoder + "ModifyViewError"
	CreateViewSourceError                = drivenPreCoder + "CreateViewSourceError"
	DeleteDataSourceError                = drivenPreCoder + "DeleteDataSourceError"
	DrivenMetadataError                  = drivenPreCoder + "DrivenMetadataError"
	GetDataTablesError                   = drivenPreCoder + "GetDataTablesError"
	GetDataTableDetailError              = drivenPreCoder + "GetDataTableDetailError"
	GetDataTableDetailBatchError         = drivenPreCoder + "GetDataTableDetailBatchError"
	FetchDataError                       = drivenPreCoder + "FetchDataError"
	DownloadDataError                    = drivenPreCoder + "DownloadDataError"
	UserMgrBatchGetUserInfoByIDFailure   = drivenPreCoder + "UserMgrBatchGetUserInfoByIDFailure"
	DoCollectFailure                     = drivenPreCoder + "DoCollectFailure"
	MetaGetTaskIdFailure                 = drivenPreCoder + "MetaGetTaskIdFailure"
	CodeGenerationFailure                = drivenPreCoder + "CodeGenerationFailure" // 生成编码失败，且 configuration-center 未返回预定义的错误码时使用此错误
	DrivenGetConnectorsFailed            = constant.ServiceName + "." + "DrivenGetConnectorsFailed"
	AuthServiceGetUsersObjectsFailed     = constant.ServiceName + "." + "AuthServiceGetUsersObjectsFailed"
	GetsObjectByIdError                  = constant.ServiceName + "." + "GetsObjectByIdError"
	GetObjectPrecisionError              = constant.ServiceName + "." + "GetObjectPrecisionError"
	GetStandardDataElementError          = constant.ServiceName + "." + "GetStandardDataElementError"
	GetStandardDictError                 = constant.ServiceName + "." + "GetStandardDictError"
	DataSourceNotFound                   = drivenPreCoder + "DataSourceNotFound"
	DrivenDataExploration                = drivenPreCoder + "DrivenDataExploration"
	DataExplorationCreateTaskError       = drivenPreCoder + "DataExplorationCreateTaskError"
	DataExplorationUpdateTaskError       = drivenPreCoder + "DataExplorationUpdateTaskError"
	DataExplorationGetTaskError          = drivenPreCoder + "DataExplorationGetTaskError"
	DataExplorationGetReportError        = drivenPreCoder + "DataExplorationGetReportError"
	DataExplorationGetRuleListError      = drivenPreCoder + "DataExplorationGetRuleListError"
	DataExplorationGetScoreError         = drivenPreCoder + "DataExplorationGetScoreError"
	GetSubjectListError                  = constant.ServiceName + "." + "GetSubjectListError"
	SceneAnalysisDrivenGetSceneError     = constant.ServiceName + "." + "SceneAnalysisDrivenGetSceneError"
	PublicInternalServerError            = constant.ServiceName + "." + "PublicInternalServerError"
	AuthServiceCheckUsersAuthorityFailed = constant.ServiceName + "." + "AuthServiceCheckUsersAuthorityFailed"
	UserDoNotHaveDownloadAuthority       = constant.ServiceName + "." + "UserDoNotHaveDownloadAuthority"
	DataExplorationGetStatusError        = drivenPreCoder + "DataExplorationGetStatusError"
	DataExplorationStartExploreError     = drivenPreCoder + "DataExplorationStartExploreError"
	DataExplorationDeleteTaskError       = drivenPreCoder + "DataExplorationDeleteTaskError"
	GetTimestampBlacklistError           = drivenPreCoder + "GetTimestampBlacklistError"
	WorkflowGETProcessError              = drivenPreCoder + "WorkflowGETProcessError"
	SailorGenerateFakeSamplesError       = drivenPreCoder + "SailorGenerateFakeSamplesError"
	GetUserRolesError                    = drivenPreCoder + "GetUserRolesError"
	UserNotHavePermission                = constant.ServiceName + "." + "UserNotHavePermission"
	GetStandardRuleError                 = drivenPreCoder + "GetStandardRuleError"
	CreateExcelViewError                 = drivenPreCoder + "." + "CreateExcelViewError"
	DeleteExcelViewError                 = drivenPreCoder + "." + "DeleteExcelViewError"
	GetPreviewError                      = drivenPreCoder + "." + "GetPreviewError"
	MdlGetViewsError                     = drivenPreCoder + "MdlGetViewsError"
	MdlGetViewError                      = drivenPreCoder + "MdlGetViewError"
	MdlUpdateViewError                   = drivenPreCoder + "MdlUpdateViewError"
	MdlDeleteViewError                   = drivenPreCoder + "MdlDeleteViewError"
	DrivenMdlError                       = drivenPreCoder + "DrivenMdlError"
)

var drivenErrorMap = errorcode.ErrorCode{
	VirtualizationEngineError: {
		Description: "虚拟化引擎异常",
		Cause:       "",
		Solution:    "请重试",
	},
	GetViewError: {
		Description: "虚拟化引擎获取物理视图失败",
		Cause:       "",
		Solution:    "请重试",
	},
	CreateViewError: {
		Description: "虚拟化引擎创建物理视图失败",
		Cause:       "",
		Solution:    "请重试",
	},
	DeleteViewError: {
		Description: "虚拟化引擎删除物理视图失败",
		Cause:       "",
		Solution:    "请重试",
	},
	ModifyViewError: {
		Description: "虚拟化引擎修改物理视图失败",
		Cause:       "",
		Solution:    "请重试",
	},
	CreateViewSourceError: {
		Description: "虚拟化引擎修创建视图源失败",
		Cause:       "",
		Solution:    "请重试",
	},
	DeleteDataSourceError: {
		Description: "删除数据源失败,具体错误信息查看详情",
		Cause:       "",
		Solution:    "请重试",
	},
	DrivenMetadataError: {
		Description: "元数据平台异常",
		Cause:       "",
		Solution:    "请重试",
	},
	GetDataTablesError: {
		Description: "元数据平台获取表列表失败",
		Cause:       "",
		Solution:    "请重试",
	},
	GetDataTableDetailError: {
		Description: "元数据平台获取表详情失败",
		Cause:       "",
		Solution:    "请重试",
	},
	GetDataTableDetailBatchError: {
		Description: "元数据平台批量获取表详情失败",
		Cause:       "",
		Solution:    "请重试",
	},
	FetchDataError: {
		Description: "虚拟化引擎查询数据失败",
		Cause:       "",
		Solution:    "请重试",
	},
	DownloadDataError: {
		Description: "虚拟化引擎下载数据失败",
		Cause:       "",
		Solution:    "请重试",
	},
	UserMgrBatchGetUserInfoByIDFailure: {
		Description: "获取用户信息失败",
		Cause:       "",
		Solution:    "",
	},
	DoCollectFailure: {
		Description: "元数据平台开启数据采集任务失败",
		Cause:       "",
		Solution:    "",
	},
	MetaGetTaskIdFailure: {
		Description: "元数据平台获取集任务id失败",
		Cause:       "",
		Solution:    "",
	},
	CodeGenerationFailure: {
		Description: "编码生成失败",
		Solution:    "请重试",
	},
	DrivenGetConnectorsFailed: {
		Description: "获取所有支持的数据源类型失败",
		Cause:       "",
		Solution:    "获取所有支持的数据源类型失败",
	},
	AuthServiceGetUsersObjectsFailed: {
		Description: "权限服务获取权限失败",
		Cause:       "",
		Solution:    "检查权限服务",
	},
	GetsObjectByIdError: {
		Description: "获取data-subject数据失败",
		Cause:       "",
		Solution:    "检查data-subject服务",
	},
	GetObjectPrecisionError: {
		Description: "获取data-subject批量数据失败",
		Cause:       "",
		Solution:    "检查data-subject服务",
	},
	GetSubjectListError: {
		Description: "获取data-subject列表数据失败",
		Cause:       "",
		Solution:    "检查data-subject服务",
	},
	GetStandardDataElementError: {
		Description: "获取数据标准元数据失败",
		Cause:       "",
		Solution:    "检查standardization-backend服务",
	},
	GetStandardDictError: {
		Description: "获取数据标准码表失败",
		Cause:       "",
		Solution:    "检查standardization-backend服务",
	},
	DataSourceNotFound: {
		Description: "数据源不存在",
		Cause:       "",
		Solution:    "请联系系统维护者",
	},
	DrivenDataExploration: {
		Description: "数据探查服务异常",
		Cause:       "",
		Solution:    "请重试",
	},
	DataExplorationCreateTaskError: {
		Description: "数据探查服务添加探查任务配置失败",
		Cause:       "",
		Solution:    "请重试",
	},
	DataExplorationUpdateTaskError: {
		Description: "数据探查服务更新探查任务配置失败",
		Cause:       "",
		Solution:    "请重试",
	},
	DataExplorationGetTaskError: {
		Description: "数据探查服务获取探查任务配置失败",
		Cause:       "",
		Solution:    "请重试",
	},
	DataExplorationGetReportError: {
		Description: "数据探查服务获取探查报告失败",
		Cause:       "",
		Solution:    "请重试",
	},
	DataExplorationGetRuleListError: {
		Description: "数据探查服务获取质量检测规则列表失败",
		Cause:       "",
		Solution:    "请重试",
	},
	DataExplorationGetScoreError: {
		Description: "数据探查服务获取质量检测总评分数据失败",
		Cause:       "",
		Solution:    "请重试",
	},
	SceneAnalysisDrivenGetSceneError: {
		Description: "场景分析获取详情失败",
		Cause:       "",
		Solution:    "请重试",
	},
	PublicInternalServerError: {
		Description: "内部服务错误",
		Cause:       "",
		Solution:    "请重试",
	},
	AuthServiceCheckUsersAuthorityFailed: {
		Description: "权限服务验证用户权限失败",
		Cause:       "",
		Solution:    "检查权限服务",
	},
	UserDoNotHaveDownloadAuthority: {
		Description: "用户暂无当前逻辑视图下载权限",
		Cause:       "",
		Solution:    "请先申请下载权限",
	},
	DataExplorationGetStatusError: {
		Description: "数据探查服务获取探查状态失败",
		Cause:       "",
		Solution:    "请重试",
	},
	DataExplorationStartExploreError: {
		Description: "数据探查服务执行探查失败",
		Cause:       "",
		Solution:    "请重试",
	},
	DataExplorationDeleteTaskError: {
		Description: "数据探查服务删除探查任务失败",
		Cause:       "",
		Solution:    "请重试",
	},
	GetTimestampBlacklistError: {
		Description: "配置中心获取业务更新时间黑名单失败",
		Cause:       "",
		Solution:    "请重试",
	},
	WorkflowGETProcessError: {
		Description: "workflow获取工作流失败",
		Cause:       "",
		Solution:    "请重试",
	},
	SailorGenerateFakeSamplesError: {
		Description: "生成合成数据失败",
	},
	GetUserRolesError: {
		Description: "获取用户角色失败",
		Cause:       "",
		Solution:    "请重试",
	},
	UserNotHavePermission: {
		Description: "暂无权限，您可联系系统管理员配置",
		Cause:       "",
		Solution:    "请重试",
	},
	CreateExcelViewError: {
		Description: "创建excel视图失败",
		Cause:       "",
		Solution:    "请重试",
	},
	DeleteExcelViewError: {
		Description: "编辑excel视图失败",
		Cause:       "",
		Solution:    "请重试",
	},
	GetStandardRuleError: {
		Description: "获取数据标准编码规则失败",
		Cause:       "",
		Solution:    "检查standardization-backend服务",
	},
	GetPreviewError: {
		Description: "引擎获取样例数据失败",
		Cause:       "",
		Solution:    "检查引擎服务",
	},
	MdlGetViewsError: {
		Description: "统一视图服务获取视图列表失败",
		Cause:       "",
		Solution:    "请重试",
	},
	MdlGetViewError: {
		Description: "统一视图服务获取视图详情失败",
		Cause:       "",
		Solution:    "请重试",
	},
	MdlUpdateViewError: {
		Description: "统一视图服务更新视图失败",
		Cause:       "",
		Solution:    "请重试",
	},
	MdlDeleteViewError: {
		Description: "统一视图服务更新视图失败",
		Cause:       "",
		Solution:    "请重试",
	},
	DrivenMdlError: {
		Description: "统一视图服务服务异常",
		Cause:       "",
		Solution:    "请重试",
	},
}
