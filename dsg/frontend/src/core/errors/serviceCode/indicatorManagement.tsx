/**
 *  IndicatorManagement 指标管理
 */
import { combineToKV } from './helper'

const PublicErrorCode = {
    PublicInternalError: 'IndicatorManagement.public.InternalError',
    PublicInvalidParameter: 'IndicatorManagement.public.InvalidParameter',
    PublicInvalidParameterJson:
        'IndicatorManagement.public.InvalidParameterJson',
    PublicInvalidParameterValue:
        'IndicatorManagement.public.InvalidParameterValue',
    PublicDatabaseError: 'IndicatorManagement.public.DatabaseError',
    PublicESError: 'IndicatorManagement.public.ESError',
    PublicRequestParameterError:
        'IndicatorManagement.public.RequestParameterError',
    PublicUniqueIDError: 'IndicatorManagement.public.PublicUniqueIDError',
    PublicResourceNotExisted: 'IndicatorManagement.public.ResourceNotExisted',
    PublicNoAuthorization: 'IndicatorManagement.public.NoAuthorization',
    TokenAuditFailed: 'IndicatorManagement.public.TokenAuditFailed',
    UserNotActive: 'IndicatorManagement.public.UserNotActive',
    GetUserInfoFailed: 'IndicatorManagement.public.GetUserInfoFailed',
    GetUserInfoFailedInterior:
        'IndicatorManagement.public.GetUserInfoFailedInterior',

    UserNotHavePermission:
        'IndicatorManagement.public.GetAccessPermissionError',
    AccessTypeNotSupport: 'IndicatorManagement.public.AccessTypeNotSupport',
    GetAccessPermissionError:
        'IndicatorManagement.public.UserNotHavePermission',

    DataCatalogSvcRequestErr:
        'IndicatorManagement.public.DataCatalogSvcRequestErr',

    BusinessSvcRequestErr: 'IndicatorManagement.public.BusinessSvcRequestErr',

    DataSubjectSvcRequestErr:
        'IndicatorManagement.public.DataSubjectSvcRequestErr',

    DimModelReferenced: 'IndicatorManagement.DimensionModel.DimModelReferenced',
    VirtualEngineRequestErr:
        'IndicatorManagement.public.VirtualEngineRequestErr',
    DimModelNameRepeatErr:
        'IndicatorManagement.DimensionModel.DimModelNameRepeatErr',
    IndicatorNameRepeatErr:
        'IndicatorManagement.Indicator.IndicatorNameRepeatErr',
    IndicatorCodeRepeatErr:
        'IndicatorManagement.Indicator.IndicatorCodeRepeatErr',
    IndicatorReferenced: 'IndicatorManagement.Indicator.IndicatorReferenced',
    IndicatorWhereOpNotAllowed:
        'IndicatorManagement.Indicator.IndicatorWhereOpNotAllowed',
    AtomicIndicatorExpressionErr:
        'IndicatorManagement.Indicator.AtomicIndicatorExpressionErr',
    CompositeIndicatorExpressionErr:
        'IndicatorManagement.Indicator.CompositeIndicatorExpressionErr',
}

const PublicErrorMap = {
    [PublicErrorCode.PublicInternalError]: {
        description: '内部错误',
    },
    [PublicErrorCode.PublicInvalidParameter]: {
        description: '参数值校验不通过',
    },
    [PublicErrorCode.PublicInvalidParameterJson]: {
        description: '参数值校验不通过：json格式错误',
    },
    [PublicErrorCode.PublicInvalidParameterValue]: {
        description: '参数值${param}校验不通过',
    },
    [PublicErrorCode.PublicDatabaseError]: {
        description: '数据库异常',
    },
    [PublicErrorCode.PublicESError]: {
        description: '搜索服务异常',
    },
    [PublicErrorCode.PublicRequestParameterError]: {
        description: '请求参数格式错误',
    },
    [PublicErrorCode.PublicUniqueIDError]: {
        description: '模型ID生成失败',
    },
    [PublicErrorCode.PublicResourceNotExisted]: {
        description: '资源不存在',
    },
    [PublicErrorCode.PublicNoAuthorization]: {
        description: '无当前操作权限',
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

    [PublicErrorCode.UserNotHavePermission]: {
        description: '暂无权限，您可联系系统管理员配置',
    },
    [PublicErrorCode.AccessTypeNotSupport]: {
        description: '暂不支持的访问类型',
    },
    [PublicErrorCode.GetAccessPermissionError]: {
        description: '获取访问权限失败',
    },

    [PublicErrorCode.DataCatalogSvcRequestErr]: {
        description: '数据目录服务请求失败',
    },

    [PublicErrorCode.BusinessSvcRequestErr]: {
        description: '业务治理服务请求失败',
    },

    [PublicErrorCode.DataSubjectSvcRequestErr]: {
        description: '主题域管理服务请求失败',
    },

    [PublicErrorCode.DimModelReferenced]: {
        description: '模型被指标引用，暂不可删除',
    },
    [PublicErrorCode.VirtualEngineRequestErr]: {
        description: '虚拟化引擎数据请求失败',
    },
    [PublicErrorCode.DimModelNameRepeatErr]: {
        description: '该维度模型名称已存在，请重新输入',
    },
    [PublicErrorCode.IndicatorNameRepeatErr]: {
        description: '该指标名称已存在，请重新输入',
    },
    [PublicErrorCode.IndicatorCodeRepeatErr]: {
        description: '该指标编号已存在，请重新输入',
    },
    [PublicErrorCode.IndicatorReferenced]: {
        description: '指标被引用，暂不可删除',
    },
    [PublicErrorCode.IndicatorWhereOpNotAllowed]: {
        description: '非法指标限定选项',
    },
    [PublicErrorCode.AtomicIndicatorExpressionErr]: {
        description:
            '表达式不合法,至少请选择一个度量字段并且度量字段来源于事实表',
    },
    [PublicErrorCode.CompositeIndicatorExpressionErr]: {
        description: '表达式不合法, 至少请选择一个已创建的指标',
    },
}

export const IndicatorManagementCodeMessage = combineToKV(PublicErrorMap)
