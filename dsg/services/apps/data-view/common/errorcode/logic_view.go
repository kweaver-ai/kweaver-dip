package errorcode

import (
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
)

func init() {
	errorcode.RegisterErrorCode(logicViewErrorMap)
}

const (
	logicViewPreCoder = constant.ServiceName + ".LogicView."

	LogicDatabaseError                  = logicViewPreCoder + "LogicDatabaseError"
	NotOwnerError                       = logicViewPreCoder + "NotOwnerError"
	AuthorizableViewListError           = logicViewPreCoder + "AuthorizableViewListError"
	CreateCustomViewSubjectIdError      = logicViewPreCoder + "CreateCustomViewSubjectIdError"
	CreateLogicEntityViewSubjectIdError = logicViewPreCoder + "CreateLogicEntityViewSubjectIdError"
	LogicEntityOnlyHaveOneViewError     = logicViewPreCoder + "LogicEntityOnlyHaveOneViewError"
	GenerateCodeError                   = logicViewPreCoder + "GenerateCodeError"
	DatasourceViewCannotCreate          = logicViewPreCoder + "DatasourceViewCannotCreate"
	DatasourceViewCannotUpdate          = logicViewPreCoder + "DatasourceViewCannotUpdate"
	StructChangeNeedUpdate              = logicViewPreCoder + "StructChangeNeedUpdate"
	DateTimeFormatError                 = logicViewPreCoder + "DateTimeFormatError"
	DepartmentIDNotExist                = logicViewPreCoder + "DepartmentIDNotExist"
	CodeTableIDNotExist                 = logicViewPreCoder + "CodeTableIDNotExist"
	LogicViewNotFound                   = logicViewPreCoder + "NotFound"
	GenerateFakeSamplesError            = logicViewPreCoder + "GenerateFakeSamplesError"
	SyntheticDataGetRedisKeyError       = logicViewPreCoder + "SyntheticDataGetRedisKeyError"
	SyntheticDataSetRedisKeyError       = logicViewPreCoder + "SyntheticDataSetRedisKeyError"
	ADGenerating                        = logicViewPreCoder + "ADGenerating"
	ViewDataEntriesEmpty                = logicViewPreCoder + "ViewDataEntriesEmpty"
	SampleDataTypeError                 = logicViewPreCoder + "SampleDataTypeError"
)

var logicViewErrorMap = errorcode.ErrorCode{
	LogicDatabaseError: {
		Description: "数据库异常",
		Cause:       "",
		Solution:    "",
	},
	NotOwnerError: {
		Description: "数据库异常",
		Cause:       "",
		Solution:    "",
	},
	AuthorizableViewListError: {
		Description: "获取可授权列表异常",
		Cause:       "",
		Solution:    "",
	},
	CreateCustomViewSubjectIdError: {
		Description: "创建自定义视图只能绑定主题域、业务活动及业务对象",
		Cause:       "",
		Solution:    "",
	},
	CreateLogicEntityViewSubjectIdError: {
		Description: "创建逻辑实体视图需在逻辑实体下",
		Cause:       "",
		Solution:    "",
	},
	LogicEntityOnlyHaveOneViewError: {
		Description: "逻辑实体只能有一个逻辑实体视图",
		Cause:       "",
		Solution:    "",
	},
	GenerateCodeError: {
		Description: "配置中心生成编码规则失败",
		Cause:       "",
		Solution:    "",
	},
	DatasourceViewCannotCreate: {
		Description: "元数据视图不能创建",
		Cause:       "",
		Solution:    "",
	},
	DatasourceViewCannotUpdate: {
		Description: "元数据视图不能修改",
		Cause:       "",
		Solution:    "",
	},
	StructChangeNeedUpdate: {
		Description: "表结构变更，需要更新视图",
		Cause:       "",
		Solution:    "",
	},
	DateTimeFormatError: {
		Description: "日期时间格式化失败",
		Cause:       "",
		Solution:    "",
	},
	DepartmentIDNotExist: {
		Description: "部门不存在或者已经删除",
		Cause:       "",
		Solution:    "",
	},
	CodeTableIDNotExist: {
		Description: "码表不存在",
		Cause:       "",
		Solution:    "",
	},
	SampleDataTypeError: {
		Description: "样例数据类型不存在",
		Cause:       "",
		Solution:    "",
	},
	LogicViewNotFound: {
		Description: "逻辑视图[%s]未找到",
	},
	GenerateFakeSamplesError: {
		Description: "生成样例数据失败",
		Cause:       "",
		Solution:    "",
	},
	SyntheticDataGetRedisKeyError: {
		Description: "获取缓存失败",
		Cause:       "",
		Solution:    "",
	},
	SyntheticDataSetRedisKeyError: {
		Description: "设置缓存失败",
		Cause:       "",
		Solution:    "",
	},
	ADGenerating: {
		Description: "合成数据生成中",
		Cause:       "",
		Solution:    "",
	},
	ViewDataEntriesEmpty: {
		Description: "数据条目数为0,不生成合成数据",
		Cause:       "",
		Solution:    "",
	},
}
