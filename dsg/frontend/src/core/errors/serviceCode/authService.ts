/**
 *  AuthService 权限
 */
import { combineToKV } from './helper'

const publicErrorCode = {
    PublicInternalError: 'AuthService.Public.InternalError',
    PublicInvalidParameter: 'AuthService.Public.InvalidParameter',
    PublicInvalidParameterJson: 'AuthService.Public.InvalidParameterJson',
    PublicDatabaseError: 'AuthService.Public.DatabaseError',
    PublicRequestParameterError: 'AuthService.Public.RequestParameterError',
}

const authErrorCode = {
    InternalError: 'AuthService.Auth.InternalError',
    TokenAuditFailed: 'AuthService.Auth.TokenAuditFailed',
    UserNotActive: 'AuthService.Auth.UserNotActive',
    GetUserInfoFailed: 'AuthService.Auth.GetUserInfoFailed',
    GetUserInfoFailedInterior: 'AuthService.Auth.GetUserInfoFailedInterior',
    GetTokenEmpty: 'AuthService.Auth.GetTokenEmpty',
}

const policyErrorCode = {
    ObjectIdNotExist: 'AuthService.Policy.ObjectIdNotExist',
    SubjectIdNotExist: 'AuthService.Policy.SubjectIdNotExist',
    OwnerIdError: 'AuthService.Policy.OwnerIdError',
    EnforceError: 'AuthService.Policy.EnforceError',
    SubjectInfoGetError: 'AuthService.Policy.SubjectInfoGetError',
    OwnerInfoGetError: 'AuthService.Policy.OwnerInfoGetError',
}

const userErrorCode = {
    UserDataBaseError: 'AuthService.User.UserDataBaseError',
    UserIdNotExistError: 'AuthService.User.UserIdNotExistError',
    UIdNotExistError: 'AuthService.User.UIdNotExistError',
    UserMgmCallError: 'AuthService.User.UserMgmCallError',
    AccessTypeNotSupport: 'AuthService.User.AccessTypeNotSupport',
    UserNotHavePermission: 'AuthService.User.UserNotHavePermission',
    GetAccessPermissionError: 'AuthService.User.GetAccessPermissionError',
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
    [publicErrorCode.PublicDatabaseError]: {
        description: '数据库异常',
    },
    [publicErrorCode.PublicRequestParameterError]: {
        description: '请求参数格式错误',
    },
}

const AuthErrorMap = {
    [authErrorCode.InternalError]: {
        description: '内部错误',
    },
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

const PolicyErrorMap = {
    [policyErrorCode.ObjectIdNotExist]: {
        description: '资源不存在',
    },
    [policyErrorCode.SubjectIdNotExist]: {
        description: '部分访问者被移除，显示为未知用户',
    },
    [policyErrorCode.OwnerIdError]: {
        description: '资源 Owner 检查不匹配, 无操作权限',
    },
    [policyErrorCode.EnforceError]: {
        description: '策略验证错误',
    },
    [policyErrorCode.SubjectInfoGetError]: {
        description: '获取 Subject 信息失败',
    },
    [policyErrorCode.OwnerInfoGetError]: {
        description: '获取 Owner 信息失败',
    },
}

const UserErrorMap = {
    [userErrorCode.UserDataBaseError]: {
        description: '数据库错误',
    },
    [userErrorCode.UserIdNotExistError]: {
        description: '用户不存在',
    },
    [userErrorCode.UIdNotExistError]: {
        description: '用户不存在',
    },
    [userErrorCode.UserMgmCallError]: {
        description: '用户管理获取用户失败',
    },
    [userErrorCode.AccessTypeNotSupport]: {
        description: '暂不支持的访问类型',
    },
    [userErrorCode.UserNotHavePermission]: {
        description: '暂无权限，您可联系系统管理员配置',
    },
    [userErrorCode.GetAccessPermissionError]: {
        description: '获取访问权限失败',
    },
}

export const AuthServiceCodeMessage = combineToKV(
    publicErrorMap,
    AuthErrorMap,
    PolicyErrorMap,
    UserErrorMap,
)
