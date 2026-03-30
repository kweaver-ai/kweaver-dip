/**
 *  ExternalPluginFramework 插件框架
 */
import { combineToKV } from './helper'

const publicErrorCode = {
    InternalServerError: 'ExternalPluginFramework.Public.InternalServerError',
    InvalidParameter: 'ExternalPluginFramework.Public.InvalidParameter',
    ConfigurationCenterInternetError:
        'ExternalPluginFramework.ConfigurationCenter.InternetError',
    PluginExist: 'ExternalPluginFramework.Plugin.Exist',
    PublicNotExist: 'ExternalPluginFramework.Plugin.NotExist',
    PublicDatabaseError: 'ExternalPluginFramework.Public.DatabaseError',
    PluginNotExist: 'ExternalPluginFramework.Plugin.NotExist',
    StandardizationInternetError:
        'ExternalPluginFramework.Standardization.InternetError',
}

const publicErrorMap = {
    [publicErrorCode.InternalServerError]: {
        description: '服务器内部错误, 请联系管理员',
    },
    [publicErrorCode.InvalidParameter]: {
        description: '参数值校验不通过',
    },
    [publicErrorCode.ConfigurationCenterInternetError]: {
        description: '配置中心访问失败',
    },
    [publicErrorCode.PluginExist]: {
        description: '资源已存在',
    },
    [publicErrorCode.PublicNotExist]: {
        description: '资源不存在',
    },
    [publicErrorCode.PublicDatabaseError]: {
        description: '数据库错误,请联系管理员',
    },
    [publicErrorCode.PluginExist]: {
        description: '标准化平台插件不存在',
    },
    [publicErrorCode.StandardizationInternetError]: {
        description: '标准化平台请求响应异常',
    },
}

export const ExternalPluginFrameworkCodeMessage = combineToKV(publicErrorMap)
