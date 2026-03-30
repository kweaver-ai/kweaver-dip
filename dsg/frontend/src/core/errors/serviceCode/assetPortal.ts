/**
 *  AssetPortal 首页
 */
import { combineToKV } from './helper'

const publicErrorCode = {
    PublicInternalError: 'AssetPortal.Public.InternalError',
    PublicInvalidParameter: 'AssetPortal.Public.InvalidParameter',
    PublicInvalidParameterJson: 'AssetPortal.Public.InvalidParameterJson',
    PublicInvalidParameterValue: 'AssetPortal.Public.InvalidParameterValue',
    PublicDatabaseError: 'AssetPortal.Public.DatabaseError',
    PublicESError: 'AssetPortal.Public.ESError',
    PublicRequestParameterError: 'AssetPortal.Public.RequestParameterError',
    PublicUniqueIDError: 'AssetPortal.Public.PublicUniqueIDError',
    PublicResourceNotExisted: 'AssetPortal.Public.ResourceNotExisted',
    PublicNoAuthorization: 'AssetPortal.Public.NoAuthorization',
    TokenAuditFailed: 'AssetPortal.Public.TokenAuditFailed',
    UserNotActive: 'AssetPortal.Public.UserNotActive',
    GetUserInfoFailed: 'AssetPortal.Public.GetUserInfoFailed',
    GetUserInfoFailedInterior: 'AssetPortal.Public.GetUserInfoFailedInterior',
    UserNotHavePermission: 'AssetPortal.Public.UserNotHavePermission',
    AccessTypeNotSupport: 'AssetPortal.Public.AccessTypeNotSupport',
    GetAccessPermissionError: 'AssetPortal.Public.GetAccessPermissionError',
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
    [publicErrorCode.PublicESError]: {
        description: '搜索服务异常',
    },
    [publicErrorCode.PublicRequestParameterError]: {
        description: '请求参数格式错误',
    },
    [publicErrorCode.PublicUniqueIDError]: {
        description: '模型ID生成失败',
    },
    [publicErrorCode.PublicResourceNotExisted]: {
        description: '资源不存在',
    },
    [publicErrorCode.PublicNoAuthorization]: {
        description: '无当前操作权限',
    },
    [publicErrorCode.TokenAuditFailed]: {
        description: '用户信息验证失败',
    },
    [publicErrorCode.UserNotActive]: {
        description: '用户登录已过期',
    },
    [publicErrorCode.GetUserInfoFailed]: {
        description: '获取用户信息失败',
    },
    [publicErrorCode.GetUserInfoFailedInterior]: {
        description: '获取用户信息失败',
    },

    [publicErrorCode.UserNotHavePermission]: {
        description: '暂无权限，您可联系系统管理员配置',
    },
    [publicErrorCode.AccessTypeNotSupport]: {
        description: '暂不支持的访问类型',
    },
    [publicErrorCode.PublicInternalError]: {
        description: '获取访问权限失败',
    },
}

export const AssetPortalCodeMessage = combineToKV(publicErrorMap)
