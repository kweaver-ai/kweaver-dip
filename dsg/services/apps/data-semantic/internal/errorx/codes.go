// Package errorx 数据理解模块错误码定义
package errorx

// 数据理解模块错误码范围: 600101-600130
const (
	// ErrDataUnderstandingUnknown 未知错误
	ErrDataUnderstandingUnknown = 600101

	// ErrDataUnderstandingStatusInvalid 状态不允许操作
	ErrDataUnderstandingStatusInvalid = 600102

	// ErrDataUnderstandingNotFound 库表未找到
	ErrDataUnderstandingNotFound = 600103

	// ErrDataUnderstandingAlreadyInProgress 理解正在进行中
	ErrDataUnderstandingAlreadyInProgress = 600104

	// ErrDataUnderstandingAIAPIFailed AI服务API调用失败
	ErrDataUnderstandingAIAPIFailed = 600105

	// ErrDataUnderstandingRateLimitExceeded 超过限流阈值
	ErrDataUnderstandingRateLimitExceeded = 600106

	// ErrDataUnderstandingFieldNotFound 字段未找到
	ErrDataUnderstandingFieldNotFound = 600107

	// ErrDataUnderstandingBusinessObjectNotFound 业务对象未找到
	ErrDataUnderstandingBusinessObjectNotFound = 600108

	// ErrDataUnderstandingBusinessObjectNameDuplicate 业务对象名称重复
	ErrDataUnderstandingBusinessObjectNameDuplicate = 600109

	// ErrDataUnderstandingAttributeNameDuplicate 属性名称重复
	ErrDataUnderstandingAttributeNameDuplicate = 600110

	// ErrDataUnderstandingTargetBusinessObjectNotExist 目标业务对象不存在
	ErrDataUnderstandingTargetBusinessObjectNotExist = 600111

	// ErrDataUnderstandingVersionConflict 版本冲突
	ErrDataUnderstandingVersionConflict = 600112

	// ErrDataUnderstandingTemporaryDataNotFound 临时数据未找到
	ErrDataUnderstandingTemporaryDataNotFound = 600113

	// ErrDataUnderstandingInvalidFieldType 字段类型无效
	ErrDataUnderstandingInvalidFieldType = 600114

	// ErrDataUnderstandingInvalidFieldRole 字段角色无效
	ErrDataUnderstandingInvalidFieldRole = 600115

	// ErrDataUnderstandingNoDataToSave 无数据可保存
	ErrDataUnderstandingNoDataToSave = 600116

	// ErrDataUnderstandingSubmitFailed 提交失败
	ErrDataUnderstandingSubmitFailed = 600117

	// ErrDataUnderstandingDeleteFailed 删除失败
	ErrDataUnderstandingDeleteFailed = 600118

	// ErrDataUnderstandingRegenerateFailed 重新识别失败
	ErrDataUnderstandingRegenerateFailed = 600119

	// ErrDataUnderstandingInvalidParameter 参数无效
	ErrDataUnderstandingInvalidParameter = 600120

	// ErrDataUnderstandingAIServiceUnavailable AI服务不可用
	ErrDataUnderstandingAIServiceUnavailable = 600121

	// ErrDataUnderstandingKafkaMessageDuplicate Kafka消息重复
	ErrDataUnderstandingKafkaMessageDuplicate = 600122

	// ErrDataUnderstandingKafkaMessageProcessFailed Kafka消息处理失败
	ErrDataUnderstandingKafkaMessageProcessFailed = 600123

	// ErrDataUnderstandingMigrationFailed 数据迁移失败
	ErrDataUnderstandingMigrationFailed = 600124

	// ErrDataUnderstandingTableNotExists 表不存在
	ErrDataUnderstandingTableNotExists = 600125

	// ErrDataUnderstandingDatabaseOperationFailed 数据库操作失败
	ErrDataUnderstandingDatabaseOperationFailed = 600126

	// ErrDataUnderstandingValidationFailed 数据校验失败
	ErrDataUnderstandingValidationFailed = 600127

	// ErrDataUnderstandingUnauthorized 未授权
	ErrDataUnderstandingUnauthorized = 600128

	// ErrDataUnderstandingTimeout 操作超时
	ErrDataUnderstandingTimeout = 600129

	// ErrDataUnderstandingConfigurationError 配置错误
	ErrDataUnderstandingConfigurationError = 600130
)
