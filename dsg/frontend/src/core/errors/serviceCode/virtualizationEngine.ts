/**
 *  VirtualizationEngine
 */
import { combineToKV } from './helper'

const publicErrorCode = {
    InvalidParameter: 'VirtualizationEngine.InvalidParameter',
    CatalogInvalidParameter: 'VirtualizationEngine.CatalogInvalidParameter',
    TableQueryInvalidParameter:
        'VirtualizationEngine.TableQueryInvalidParameter',
    ImportErrorPartailFailure:
        'VirtualizationEngine.ImportError.PartailFailure',
    RequestErrorFormatIncorrect:
        'VirtualizationEngine.RequestError.FormatIncorrect',
    MethodArgumentTypeMismatchException:
        'VirtualizationEngine.RequestError.MethodArgumentTypeMismatchException',
    HttpRequestMethodNotSupportedException:
        'VirtualizationEngine.RequestError.HttpRequestMethodNotSupportedException',
    SystemBusy: 'VirtualizationEngine.SystemBusy',
    UnKnowException: 'VirtualizationEngine.UnKnowException',
    DeadlockError: 'VirtualizationEngine.DeadlockError',
    CatalogPasswordError: 'VirtualizationEngine.CatalogPasswordError',
    DataDuplicated: 'VirtualizationEngine.DataDuplicated',
    DateFormatFailed: 'VirtualizationEngine.DateFormatFailed',
    MissingParameter: 'VirtualizationEngine.MissingParameter',
    SqlSyntaxError: 'VirtualizationEngine.SqlSyntaxError',
    SystemError: 'VirtualizationEngine.SystemError',
    FieldTypeError: 'VirtualizationEngine.FieldTypeError',
    InternalError: 'VirtualizationEngine.InternalError',
    DefaultViewCreateError: 'VirtualizationEngine.DefaultViewCreateError',
    DefaultCatalogDeleteError: 'VirtualizationEngine.DefaultCatalogDeleteError',
    ImageIoError: 'VirtualizationEngine.ImageIoError',
    NotFound: 'VirtualizationEngine.NotFound',
    TypeSyntaxError: 'VirtualizationEngine.TypeSyntaxError',
    CatalogNotExist: 'VirtualizationEngine.CatalogNotExist.',
    TableNotExist: 'VirtualizationEngine.TableNotExist.',
    SchemaNotExist: 'VirtualizationEngine.SchemaNotExist.',
    TableFieldError: 'VirtualizationEngine.TableFieldError.',
}

const publicErrorMap = {
    [publicErrorCode.InvalidParameter]: {
        description: '参数错误',
    },
    [publicErrorCode.CatalogInvalidParameter]: {
        description: '数据源配置参数错误',
    },
    [publicErrorCode.TableQueryInvalidParameter]: {
        description: '表DDL、DML配置错误',
    },
    [publicErrorCode.ImportErrorPartailFailure]: {
        description: '导入失败',
    },
    [publicErrorCode.RequestErrorFormatIncorrect]: {
        description: '参数格式不正确',
    },
    [publicErrorCode.MethodArgumentTypeMismatchException]: {
        description: '参数值校验不通过',
    },
    [publicErrorCode.HttpRequestMethodNotSupportedException]: {
        description: '接口请求方式不支持',
    },
    [publicErrorCode.SystemBusy]: {
        description: '系统繁忙,请稍后重试',
    },
    [publicErrorCode.UnKnowException]: {
        description: '系统内部错误',
    },
    [publicErrorCode.DeadlockError]: {
        description: '数据表死锁异常',
    },
    [publicErrorCode.CatalogPasswordError]: {
        description: '密码解密错误',
    },
    [publicErrorCode.DataDuplicated]: {
        description: '数据冲突',
    },
    [publicErrorCode.DateFormatFailed]: {
        description: '时间格式化失败',
    },
    [publicErrorCode.MissingParameter]: {
        description: '参数不能为空',
    },
    [publicErrorCode.SqlSyntaxError]: {
        description: '请检查sql语句',
    },
    [publicErrorCode.SystemError]: {
        description: '数据库异常',
    },
    [publicErrorCode.FieldTypeError]: {
        description: '类型异常',
    },
    [publicErrorCode.InternalError]: {
        description: '系统内部错误',
    },
    [publicErrorCode.DefaultViewCreateError]: {
        description: '内置库表创建失败',
    },
    [publicErrorCode.DefaultCatalogDeleteError]: {
        description: '内置Catalog删除失败',
    },
    [publicErrorCode.ImageIoError]: {
        description: '传输失败',
    },
    [publicErrorCode.NotFound]: {
        description: '主信息:访问的资源不存在',
    },
    [publicErrorCode.TypeSyntaxError]: {
        description: '类型异常',
    },
    [publicErrorCode.CatalogNotExist]: {
        description: '数据源出错，请联系管理员',
    },
    [publicErrorCode.TableNotExist]: {
        description: '库表出错，请检查库表配置或更换库表',
    },
    [publicErrorCode.SchemaNotExist]: {
        description: '数据库出错，请联系管理员',
    },
    [publicErrorCode.TableFieldError]: {
        description: '库表与源表的字段不一致',
    },
}

export const VirtualizationEngineCodeMessage = combineToKV(publicErrorMap)
