/**
 * 模块： 场景分析  sceneAnalysis
 */
import { combineToKV } from './helper'

// Public Error
const PublicErrorCode = {
    InternalError: `SceneAnalysis.InternalError`,
    TokenAuditFailed: 'SceneAnalysis.TokenAuditFailed',
    UserNotActive: 'SceneAnalysis.UserNotActive',
    GetUserInfoFailed: 'SceneAnalysis.GetUserInfoFailed',
    GetUserInfoFailedInterior: 'SceneAnalysis.GetUserInfoFailedInterior',
    GetTokenEmpty: 'SceneAnalysis.GetTokenEmpty',
    PublicDatabaseError: 'SceneAnalysis.DatabaseError',
    PublicInvalidParameter: 'SceneAnalysis.InvalidParameter',
    PublicRequestParameterError: 'SceneAnalysis.RequestParameterError',
}

const PublicErrorMap = {
    [PublicErrorCode.InternalError]: {
        description: '内部错误',
    },
    [PublicErrorCode.TokenAuditFailed]: {
        description: '用户信息验证失败',
    },
    [PublicErrorCode.UserNotActive]: {
        description: '用户登录已过期',
    },
    [PublicErrorCode.GetUserInfoFailed]: {
        description: '获取用户信息失败',
    },
    [PublicErrorCode.GetUserInfoFailedInterior]: {
        description: '获取用户信息失败',
    },
    [PublicErrorCode.GetTokenEmpty]: {
        description: '获取用户信息失败',
    },
    [PublicErrorCode.PublicDatabaseError]: {
        description: '数据库连接错误或者SQL语句错误',
    },
    [PublicErrorCode.PublicInvalidParameter]: {
        description: '参数值校验不通过',
    },
    [PublicErrorCode.PublicRequestParameterError]: {
        description: '请求参数格式错误',
    },
}

// User Error
const UserErrorCode = {
    UserDataBaseError: 'SceneAnalysis.User.UserDataBaseError',
    UserIdNotExistError: 'SceneAnalysis.User.UserIdNotExistError',
    UIdNotExistError: 'SceneAnalysis.User.UIdNotExistError',
    UserMgmCallError: 'SceneAnalysis.User.UserMgmCallError',
    AccessTypeNotSupport: 'SceneAnalysis.User.AccessTypeNotSupport',
    UserNotHavePermission: 'SceneAnalysis.User.UserNotHavePermission',
    GetAccessPermissionError: 'SceneAnalysis.User.GetAccessPermissionError',
}

const UserErrorMap = {
    [UserErrorCode.UserDataBaseError]: {
        description: '数据库错误',
    },
    [UserErrorCode.UserIdNotExistError]: {
        description: '用户不存在',
    },
    [UserErrorCode.UIdNotExistError]: {
        description: '用户不存在',
    },
    [UserErrorCode.UserMgmCallError]: {
        description: '用户管理获取用户失败',
    },
    [UserErrorCode.AccessTypeNotSupport]: {
        description: '暂不支持的访问类型',
    },
    [UserErrorCode.UserNotHavePermission]: {
        description: '您的用户角色已被移除，请联系系统管理员',
    },
    [UserErrorCode.GetAccessPermissionError]: {
        description: '获取访问权限失败',
    },
}

// SceneAnalysis Error
export const SceneAnalysisErrorCode = {
    NodeRepeatError: 'SceneAnalysis.Scene.NodeRepeatError',
    InvalidConfig: 'SceneAnalysis.Scene.InvalidConfig',
    InvalidParameter: 'SceneAnalysis.Scene.InvalidParameter',
    FormNotExist: 'SceneAnalysis.Scene.FormNotExist',
    SceneDatabaseError: 'SceneAnalysis.Scene.SceneDatabaseError',

    SceneNameRepeatError: 'SceneAnalysis.Scene.SceneNameRepeatError',
    SceneNotExist: 'SceneAnalysis.Scene.SceneNotExist',
    MetaDataNotFound: 'SceneAnalysis.Scene.MetaDataNotFound',
    FormNotProcess: 'SceneAnalysis.Scene.FormNotProcess',
    ProcessingTableFieldsNotExists:
        'SceneAnalysis.Scene.ProcessingTableFieldsNotExists',
    WhereOpNotAllowed: 'SceneAnalysis.Scene.WhereOpNotAllowed',
    SceneComponentNotExist: 'SceneAnalysis.Scene.SceneComponentNotExist',
    JsonUnMarshalError: 'SceneAnalysis.Scene.JsonUnMarshalError',
    NodeNotExist: 'SceneAnalysis.Scene.NodeNotExist',
    UnsupportedRequest: 'SceneAnalysis.Scene.UnsupportedRequest',
    SceneComponentInvalidConfig:
        'SceneAnalysis.Scene.SceneComponentInvalidConfig',
    FieldNotExist: 'SceneAnalysis.Scene.FieldNotExist',
    DataCatalogNotExist: 'SceneAnalysis.Scene.DataCatalogNotExist',
}

const SceneAnalysisErrorCodeMap = {
    [SceneAnalysisErrorCode.NodeRepeatError]: {
        description: '该节点名称已存在，请重新输入',
    },
    [SceneAnalysisErrorCode.InvalidConfig]: {
        description: '无效配置',
    },
    [SceneAnalysisErrorCode.InvalidParameter]: {
        description: '参数值校验不通过',
    },
    [SceneAnalysisErrorCode.FormNotExist]: {
        description: '当前业务表不存在',
    },
    [SceneAnalysisErrorCode.SceneDatabaseError]: {
        description: '数据库错误',
    },
    [SceneAnalysisErrorCode.SceneNameRepeatError]: {
        description: '该场景分析名称已存在，请重新输入',
    },
    [SceneAnalysisErrorCode.SceneNotExist]: {
        description: '该场景分析不存在',
    },
    [SceneAnalysisErrorCode.MetaDataNotFound]: {
        description: '元数据平台未获取到数据源',
    },
    [SceneAnalysisErrorCode.FormNotProcess]: {
        description: '当前业务表未加工',
    },
    [SceneAnalysisErrorCode.ProcessingTableFieldsNotExists]: {
        description: '加工表字段[field_name]不存在',
    },
    [SceneAnalysisErrorCode.WhereOpNotAllowed]: {
        description: '非法指标限定选项',
    },
    [SceneAnalysisErrorCode.SceneComponentNotExist]: {
        description: '场景分析组件配詈不存在',
    },
    [SceneAnalysisErrorCode.JsonUnMarshalError]: {
        description: 'json.UnMarshal转化失败',
    },
    [SceneAnalysisErrorCode.NodeNotExist]: {
        description: '场景分析节点不存在',
    },
    [SceneAnalysisErrorCode.UnsupportedRequest]: {
        description: '不支持的请求',
    },
    [SceneAnalysisErrorCode.SceneComponentInvalidConfig]: {
        description: '场景分析组件配置错误',
    },
    [SceneAnalysisErrorCode.FieldNotExist]: {
        description: '场景分析组件配置字段不存在',
    },
}

// Driven Error
export const DrivenErrorCode = {
    OpenLookEngTimeout: 'SceneAnalysis.Driven.OpenLookEngTimeout',
    DataViewIdNotExist: 'SceneAnalysis.Driven.DataViewIdNotExist',
}

const DrivenErrorMap = {
    [DrivenErrorCode.OpenLookEngTimeout]: {
        description: '请求超时，请重试',
    },
    [DrivenErrorCode.DataViewIdNotExist]: {
        description: '引用库表不存在',
    },
}

export const SceneAnalysisCodeMessage = combineToKV(
    PublicErrorMap,
    UserErrorMap,
    SceneAnalysisErrorCodeMap,
    DrivenErrorMap,
)
