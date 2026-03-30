/**
 * dataApplicationGateway 数据应用网关
 */
import { combineToKV } from './helper'

const authErrorCode = {
    TokenAuditFailed: 'DataApplicationGateway.Auth.TokenAuditFailed',
    UserNotActive: 'DataApplicationGateway.Auth.UserNotActive',
    GetUserInfoFailed: 'DataApplicationGateway.Auth.GetUserInfoFailed',
    GetUserInfoFailedInterior:
        'DataApplicationGateway.Auth.GetUserInfoFailedInterior',
    GetTokenEmpty: 'DataApplicationGateway.Auth.GetTokenEmpty',
}

/**
 * 认证
 */
const authErrorMap = {
    [authErrorCode.TokenAuditFailed]: {
        description: '用户信息验证失败',
    },
    [authErrorCode.UserNotActive]: {
        description: '用户登录已过期',
    },
    [authErrorCode.GetUserInfoFailed]: {
        description: '获取用户信息失败',
    },
    [authErrorCode.GetUserInfoFailedInterior]: {
        description: '获取用户信息失败',
    },
    [authErrorCode.GetTokenEmpty]: {
        description: '获取用户信息失败',
    },
}
const publicErrorCode = {
    PublicInternalError: 'DataApplicationGateway.Public.InternalError',
    PublicInvalidParameter: 'DataApplicationGateway.Public.InvalidParameter',
    PublicInvalidParameterJson:
        'DataApplicationGateway.Public.InvalidParameterJson',
    PublicInvalidParameterValue:
        'DataApplicationGateway.Public.InvalidParameterValue',
    PublicDatabaseError: 'DataApplicationGateway.Public.DatabaseError',
    PublicRequestParameterError:
        'DataApplicationGateway.Public.RequestParameterError',
}

const publicErrorMap = {
    [publicErrorCode.PublicInternalError]: {
        description: '内部错误',
    },
    [publicErrorCode.PublicInvalidParameter]: {
        description: '参数值校验不通过',
    },
    [publicErrorCode.PublicInvalidParameterJson]: {
        description: '参数值校验不通过：json格式错误',
    },
    [publicErrorCode.PublicInvalidParameterValue]: {
        description: '参数值${param}校验不通过',
    },
    [publicErrorCode.PublicDatabaseError]: {
        description: '数据库异常',
    },
    [publicErrorCode.PublicRequestParameterError]: {
        description: '请求参数格式错误',
    },
}
const serviceApplyErrorCode = {
    ServiceApplyNotPass:
        'DataApplicationGateway.ServiceApply.ServiceApplyNotPass',
}

// 服务 Error
const serviceApplyErrorMap = {
    [serviceApplyErrorCode.ServiceApplyNotPass]: {
        description: '当前接口暂无调用权限, 请先申请接口授权',
    },
}

const signErrorCode = {
    SignValidateError: 'DataApplicationGateway.Sign.SignValidateError',
    TimestampRequired: 'DataApplicationGateway.Sign.TimestampRequired',
    TimestampError: 'DataApplicationGateway.Sign.TimestampError',
    TimestampExpired: 'DataApplicationGateway.Sign.TimestampExpired',
    AppIdRequired: 'DataApplicationGateway.Sign.AppIdRequired',
    AppIdNotExist: 'DataApplicationGateway.Sign.AppIdNotExist',
}

// sign Error
const signErrorMap = {
    [signErrorCode.SignValidateError]: {
        description: '请求签名验证错误',
    },
    [signErrorCode.TimestampRequired]: {
        description: '请求时间戳不能为空',
    },
    [signErrorCode.TimestampError]: {
        description: '请求时间戳格式错误',
    },
    [signErrorCode.TimestampExpired]: {
        description: '请求时间戳已过期',
    },
    [signErrorCode.AppIdRequired]: {
        description: 'AppId 不能为空',
    },
    [signErrorCode.AppIdNotExist]: {
        description: 'AppId 不存在',
    },
}

const serviceErrorCode = {
    ServiceNameExist: 'DataApplicationGateway.Service.ServiceNameExist',
    ServicePathExist: 'DataApplicationGateway.Service.ServicePathExist',
    ServicePathNotExist: 'DataApplicationGateway.Service.ServicePathNotExist',
    ServiceCodeNotExist: 'DataApplicationGateway.Service.ServiceCodeNotExist',
    ServiceSQLSyntaxError:
        'DataApplicationGateway.Service.ServiceSQLSyntaxError',
    ServiceSQLSchemaError:
        'DataApplicationGateway.Service.ServiceSQLSchemaError',
    ServiceSQLTableError: 'DataApplicationGateway.Service.ServiceSQLTableError',
    ServiceQueryOnlineError:
        'DataApplicationGateway.Service.ServiceQueryOnlineError',
}
// service Error
const serviceErrorMap = {
    [serviceErrorCode.ServiceNameExist]: {
        description: '接口名称已存在',
    },
    [serviceErrorCode.ServicePathExist]: {
        description: '接口路径已存在',
    },
    [serviceErrorCode.ServicePathNotExist]: {
        description: '接口路径不存在',
    },
    [serviceErrorCode.ServiceCodeNotExist]: {
        description: '接口编码不存在',
    },
    [serviceErrorCode.ServiceSQLSyntaxError]: {
        description: '脚本格式错误',
    },
    [serviceErrorCode.ServiceSQLSchemaError]: {
        description: '库名和所选数据源的库名不匹配',
    },
    [serviceErrorCode.ServiceSQLTableError]: {
        description:
            '脚本模式下, 使用资源目录关联数据源, 只支单表查询, 不支持多表关联, 且只能使用资源目录绑定的表',
    },
    [serviceErrorCode.ServiceQueryOnlineError]: {
        description: '接口未上线, 无法调用',
    },
}

export const DataApplicationGatewayMessage = combineToKV(
    authErrorMap,
    publicErrorMap,
    serviceApplyErrorMap,
    signErrorMap,
    serviceErrorMap,
)
