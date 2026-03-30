/**
 * dataApplicationService 数据应用服务
 */
import { combineToKV } from './helper'

const publicErrorCode = {
    PublicInternalError: 'DataApplicationService.Public.InternalError',
    PublicInvalidParameter: 'DataApplicationService.Public.InvalidParameter',
    PublicInvalidParameterJson:
        'DataApplicationService.Public.InvalidParameterJson',
    PublicInvalidParameterValue:
        'DataApplicationService.Public.InvalidParameterValue',
    PublicDatabaseError: 'DataApplicationService.Public.DatabaseError',
    PublicRequestParameterError:
        'DataApplicationService.Public.RequestParameterError',
    ServiceDeleteStatusError:
        'DataApplicationService.Service.ServiceDeleteStatusError',
    VirtualEngineError:
        'DataApplicationService.MicroService.VirtualEngineError',
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
    [publicErrorCode.ServiceDeleteStatusError]: {
        description: '只有处于[草稿]状态，且未在审核中的接口才能进行删除操作',
    },
    [publicErrorCode.VirtualEngineError]: {
        description: '虚拟化引擎服务请求错误',
    },
}

export const DataApplicationServiceMessage = combineToKV(publicErrorMap)
