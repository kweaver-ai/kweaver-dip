/**
 * session 认证
 */
import { combineToKV } from './helper'

const PublicErrorCode = {
    PublicInternalError: 'Session.Public.InternalError',
    PublicInvalidParameter: 'Session.Public.InvalidParameter',
    PublicInvalidParameterValue: 'Session.Public.InvalidParameterValue',
    PublicDatabaseError: 'Session.Public.DatabaseError',
    PublicRequestParameterError: 'Session.Public.RequestParameterError',
}

const PublicErrorMap = {
    [PublicErrorCode.PublicInternalError]: {
        description: '内部错误',
    },
    [PublicErrorCode.PublicInvalidParameter]: {
        description: '参数值校验不通过',
    },
    [PublicErrorCode.PublicInvalidParameterValue]: {
        description: '参数值${param}校验不通过',
    },
    [PublicErrorCode.PublicDatabaseError]: {
        description: '数据库异常',
    },
    [PublicErrorCode.PublicRequestParameterError]: {
        description: '请求参数格式错误',
    },
}

const LoginErrorCode = {
    GetCodeFailed: 'Session.Login.GetCodeFailed',
    LoginCallbackFailed: 'Session.Login.LoginCallbackFailed',
    SaveSessionFailed: 'Session.Login.SaveSessionFailed',
    TokenNotExist: 'Session.Login.TokenNotExist',
    StateError: 'Session.Login.StateError',
    GetHostError: 'Session.Login.GetHostError',
    RefreshTokenError: 'Session.Login.RefreshTokenError',
    GetUserInfoError: 'Session.Login.GetUserInfoError',
    GetUserNameError: 'Session.Login.GetUserNameError',
    GetAccessPermissionError: 'Session.Login.GetAccessPermissionError',
    GetUserRolesError: 'Session.Login.GetUserRolesError',
    UserHasNoRolesError: 'Session.Login.UserHasNoRolesError',
}

const LoginErrorMap = {
    [LoginErrorCode.GetCodeFailed]: {
        description: '获取授权码失败',
    },
    [LoginErrorCode.LoginCallbackFailed]: {
        description: '登录回调失败',
    },
    [LoginErrorCode.SaveSessionFailed]: {
        description: '保存会话失败',
    },
    [LoginErrorCode.GetHostError]: {
        description: 'deploy_management 服务异常',
    },
    [LoginErrorCode.RefreshTokenError]: {
        description: '刷新令牌失败',
    },
    [LoginErrorCode.GetUserInfoError]: {
        description: '获取用户信息失败',
    },
    [LoginErrorCode.GetUserNameError]: {
        description: '获取用户名失败',
    },
    [LoginErrorCode.GetAccessPermissionError]: {
        description: '获取访问权限失败',
    },
    [LoginErrorCode.GetUserRolesError]: {
        description: '获取用户下的角色失败',
    },
    [LoginErrorCode.UserHasNoRolesError]: {
        description: '用户没有配置角色，不能登录',
    },
}

const LogoutErrorCode = {
    GetCookieValueNotExist: 'Session.Logout.GetCookieValueNotExist',
    DoLogOutCallBackFailed: 'Session.Logout.DoLogOutCallBackFailed',
}

const LogoutErrorMap = {
    [LogoutErrorCode.GetCookieValueNotExist]: {
        description: '获取cookie值失败',
    },
    [LogoutErrorCode.DoLogOutCallBackFailed]: {
        description: '登出错误',
    },
}

export const SessionCodeMessage = combineToKV(
    PublicErrorMap,
    LoginErrorMap,
    LogoutErrorMap,
)
