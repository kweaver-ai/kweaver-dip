/**
 *  MetadataManager 数据元
 */
import { combineToKV } from './helper'

const PublicErrorCode = {
    PartailImportSucess: 'MetadataManage.PartailImportSucess',
    ImportErrorPartailFailure: 'MetadataManage.ImportError.PartailFailure',
    RequestErrorEmpty: 'MetadataManage.RequestError.Empty',
    RequestErrorFormatIncorrect: 'MetadataManage.RequestError.FormatIncorrect',
    RequestErrorDataNotExist: 'MetadataManage.RequestError.DataNotExist',
    RequestErrorDataExist: 'MetadataManage.RequestError.DataExist',
    AuthenticationError: 'MetadataManage.AuthenticationError',
    DependencyViolation: 'MetadataManage.DependencyViolation',
    Duplicated: 'MetadataManage.Duplicated',
    Empty: 'MetadataManage.Empty',
    Incorrect: 'MetadataManage.Incorrect',
    InternalError: 'MetadataManage.InternalError',
    Insufficient: 'MetadataManage.Insufficient',
    Invalid: 'MetadataManage.Invalid',
    InvalidAccountStatus: 'MetadataManage.InvalidAccountStatus',
    InvalidParameter: 'MetadataManage.InvalidParameter',
    MissingParameter: 'MetadataManage.MissingParameter',
    NoPermission: 'MetadataManage.NoPermission',
    NotFound: 'MetadataManage.NotFound',
    NotReady: 'MetadataManage.NotReady',
    OperationConflict: 'MetadataManage.OperationConflict',
    OperationDenied: 'MetadataManage.OperationDenied',
    OutOfRange: 'MetadataManage.OutOfRange',
    QuotaExceed: 'MetadataManage.QuotaExceed',
    UpgradeError: 'MetadataManage.UpgradeError',
    InternalErrorUnKnowException:
        'MetadataManage.InternalError.UnKnowException',
    InternalErrorRuntimeException:
        'MetadataManage.InternalError.RuntimeException',
    RequestErrorNoHandlerFoundException:
        'MetadataManage.RequestError.NoHandlerFoundException',
    RequestErrorHttpRequestMethodNotSupportedException:
        'MetadataManage.RequestError.HttpRequestMethodNotSupportedException',
    RequestErrorMethodArgumentTypeMismatchException:
        'MetadataManage.RequestError.MethodArgumentTypeMismatchException',
    CatalogServiceError: 'MetadataManage.CatalogServiceError',
    DataElementServiceError: 'MetadataManage.DataElementServiceError',
    RuleServiceError: 'MetadataManage.RuleServiceError',
    DictServiceError: 'MetadataManage.DictServiceError',
    ExcelExportError: 'MetadataManage.ExcelExportError',
    ExcelImportError: 'MetadataManage.ExcelImportError',
    AnyShareError: 'MetadataManage.AnyShareError',
    DeadlockError: 'MetadataManage.DeadlockError',
    DataDuplicated: 'MetadataManage.DataDuplicated',
    SystemBusy: 'MetadataManage.SystemBusy',
    DataDuplicatedResourceNameConflicted:
        'MetadataManage.DataDuplicated.ResourceNameConflicted',
    ResourceNotExisted: 'MetadataManage.ResourceNotExisted',
    ResourceNotExistedParentResourceNotExisted:
        'MetadataManage.ResourceNotExisted.ParentResourceNotExisted',
    ResourceNotExistedTargetParentResourceNotExisted:
        'MetadataManage.ResourceNotExisted.TargetParentResourceNotExisted',
    PartialFailure: 'MetadataManage.PartialFailure',
    DeleteNotAllowed: 'MetadataManage.DeleteNotAllowed',
    DeleteFailed: 'MetadataManage.DeleteFailed',
    DateFormatFailed: 'MetadataManage.DateFormatFailed',
}

const PublicErrorMap = {
    [PublicErrorCode.PartailImportSucess]: {
        description: '部分导入成功',
    },
    [PublicErrorCode.ImportErrorPartailFailure]: {
        description: '导入失败',
    },
    [PublicErrorCode.RequestErrorEmpty]: {
        description: '参数不能为空',
    },
    [PublicErrorCode.RequestErrorFormatIncorrect]: {
        description: '参数格式不正确',
    },
    [PublicErrorCode.RequestErrorDataNotExist]: {
        description: '数据不存在',
    },
    [PublicErrorCode.RequestErrorDataExist]: {
        description: '数据已存在',
    },
    [PublicErrorCode.AuthenticationError]: {
        description: '您的帐户尚未通过实名认证，请先实名认证后再进行操作',
    },
    [PublicErrorCode.DependencyViolation]: {
        description: '主信息:资源依赖而导致操作失败',
    },
    [PublicErrorCode.Duplicated]: {
        description: '唯一索引引发异常',
    },
    [PublicErrorCode.Empty]: {
        description: '不能为空',
    },
    [PublicErrorCode.Incorrect]: {
        description: '主信息:无法执行该操作',
    },
    [PublicErrorCode.InternalError]: {
        description: '系统内部错误',
    },
    [PublicErrorCode.Insufficient]: {
        description: '主信息:资源不足',
    },
    [PublicErrorCode.Invalid]: {
        description: '主信息:无效访问',
    },
    [PublicErrorCode.InvalidAccountStatus]: {
        description: '主信息:账户鉴权错误',
    },
    [PublicErrorCode.InvalidParameter]: {
        description: '参数校验失败',
    },
    [PublicErrorCode.MissingParameter]: {
        description: '主信息:必填参数丢失',
    },
    [PublicErrorCode.NoPermission]: {
        description: '主信息:没有权限访问',
    },
    [PublicErrorCode.NotFound]: {
        description: '主信息:访问的资源不存在',
    },
    [PublicErrorCode.NotReady]: {
        description: '主信息:访问的服务不存在',
    },
    [PublicErrorCode.OperationConflict]: {
        description: '主信息:冲突的操作',
    },
    [PublicErrorCode.OperationDenied]: {
        description: '主信息:被拒绝的操作',
    },
    [PublicErrorCode.OutOfRange]: {
        description: '主信息:超出范围',
    },
    [PublicErrorCode.QuotaExceed]: {
        description: '主信息:租户资源配额不足',
    },
    [PublicErrorCode.UpgradeError]: {
        description: '升级相关错误',
    },
    [PublicErrorCode.InternalErrorUnKnowException]: {
        description: '系统内部错误',
    },
    [PublicErrorCode.InternalErrorRuntimeException]: {
        description: '系统内部错误',
    },
    [PublicErrorCode.RequestErrorNoHandlerFoundException]: {
        description: '接口未找到',
    },
    [PublicErrorCode.RequestErrorHttpRequestMethodNotSupportedException]: {
        description: '接口请求方式不支持',
    },
    [PublicErrorCode.RequestErrorMethodArgumentTypeMismatchException]: {
        description: '参数值校验不通过',
    },
    [PublicErrorCode.CatalogServiceError]: {
        description: '目录模块服务异常',
    },
    [PublicErrorCode.DataElementServiceError]: {
        description: '数据元模块服务异常',
    },
    [PublicErrorCode.RuleServiceError]: {
        description: '编码规则模块服务异常',
    },
    [PublicErrorCode.DictServiceError]: {
        description: '码表模块服务异常',
    },
    [PublicErrorCode.ExcelExportError]: {
        description: 'excel导出失败',
    },
    [PublicErrorCode.ExcelImportError]: {
        description: 'excel导入失败',
    },
    [PublicErrorCode.AnyShareError]: {
        description: 'anyshare文件服务异常',
    },
    [PublicErrorCode.DeadlockError]: {
        description: '数据表死锁异常',
    },
    [PublicErrorCode.DataDuplicated]: {
        description: '数据重复',
    },
    [PublicErrorCode.SystemBusy]: {
        description: '系统繁忙,请稍后重试',
    },
    [PublicErrorCode.DataDuplicatedResourceNameConflicted]: {
        description: '资源名称冲突',
    },
    [PublicErrorCode.ResourceNotExisted]: {
        description: '资源不存在',
    },
    [PublicErrorCode.ResourceNotExistedParentResourceNotExisted]: {
        description: '父级资源不存在',
    },
    [PublicErrorCode.ResourceNotExistedTargetParentResourceNotExisted]: {
        description: '目标父级资源不存在',
    },
    [PublicErrorCode.PartialFailure]: {
        description: '成功%d条失败%d条',
    },
    [PublicErrorCode.DeleteNotAllowed]: {
        description: '资源不可删除',
    },
    [PublicErrorCode.DeleteFailed]: {
        description: '资源删除失败',
    },
    [PublicErrorCode.DateFormatFailed]: {
        description: '时间格式化失败',
    },
}

export const metadataManagerCodeMessage = combineToKV(PublicErrorMap)
