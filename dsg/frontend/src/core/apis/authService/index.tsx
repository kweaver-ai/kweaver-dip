/*
 * @Author: Jeffrey.Zhang
 * @Date: 2024-01-11 14:56:20
 * @LastEditors: Jeffrey.Zhang
 * @LastEditTime: 2024-01-16 18:16:43
 * @Description:
 */
import { pseudoRandomBytes } from 'crypto'
import {
    AssetTypeEnum,
    IAuthRequest,
    IAuthRequestData,
    ICommonRes,
    IDwhDataAuthRequest,
    IDwhDataAuthRequestApplyListResponse,
    IDwhDataAuthRequestData,
    IDwhDataAuthRequestDetail,
    IDwhDataAuthRequestListResponse,
    IDwhDataAuthRequestUpdate,
    IErrorResponse,
    ILogicViewAuth,
    IPolicyInfo,
    IValidatePolicy,
} from '@/core'
import requests from '@/utils/request'

const { get, post, put, delete: del } = requests

/**
 * 策略验证
 */
export const policyValidate = (
    params: Partial<IValidatePolicy>[],
    skipRoleCheck?: boolean, // 是否跳过角色检查，仅查询实际策略权限
): Promise<IValidatePolicy[]> => {
    const queryParams = skipRoleCheck ? `?skip_role_check=true` : ''
    return post(`/api/auth-service/v1/enforce${queryParams}`, params)
}

/**
 * 策略创建
 */
export const policyCreate = (
    params: Partial<IPolicyInfo>,
): Promise<IErrorResponse> => {
    return post(`/api/auth-service/v1/policy`, params)
}

/**
 * 策略详情
 * @param id 资源ID
 */
export const policyDetail = (
    id: string,
    type: AssetTypeEnum,
): Promise<IPolicyInfo> => {
    return get(
        `/api/auth-service/v1/policy?object_id=${id}&object_type=${type}`,
    )
}

/**
 * 策略更新
 */
export const policyUpdate = (
    params: Partial<IPolicyInfo>,
): Promise<IErrorResponse> => {
    return put(`/api/auth-service/v1/policy`, params)
}

/**
 * 策略删除
 */
export const policyRemove = (params: {
    object_id: string
    object_type: AssetTypeEnum
    subject_id?: string
}): Promise<IErrorResponse> => {
    return del(`/api/auth-service/v1/policy`, params)
}

/**
 * 获取库表授权申请
 * @param id 库表授权申请的 ID
 */
export const getLogicViewAuth = (
    id: string,
    params: {
        reference?: boolean
        preview?: boolean
    },
): Promise<ILogicViewAuth> => {
    return get(
        `/api/auth-service/v1/logic-view-authorizing-requests/${id}`,
        params,
    )
}

/**
 * 访问者拥有的资源
 */
export const getVisitorAuth = (params: {
    object_type: string // AssetTypeEnum ， AssetTypeEnum
    subject_id: string
    subject_type: string
}): Promise<any> => {
    return get(`/api/auth-service/v1/subject/objects`, params)
}

/*
 * 创建授权申请
 */
export const createAuthRequest = (
    params: IAuthRequest,
): Promise<IAuthRequestData> => {
    return post(`/api/auth-service/v1/logic-view-authorizing-requests`, params)
}

/** 查询授权申请 */
export const getAuthRequest = (params: {
    id: string
    reference?: boolean
    preview?: boolean
}) => {
    return get(
        `/api/auth-service/v1/logic-view-authorizing-requests/${params.id}`,
        params,
    )
}

/**
 * 创建指标授权请求
 *
 * 该函数用于通过API服务端点发起指标授权请求它使用提供的参数来构造请求体，
 * 并通过HTTP POST方法向指定的API端点发送请求返回的Promise解析为IAuthRequestData类型的对象，
 * 该对象包含授权请求的相关数据
 *
 * @param params IAuthRequest类型的参数对象，用于指定授权请求的具体参数
 * @returns 返回一个Promise，解析为包含授权请求数据的IAuthRequestData对象
 */
export const createIndicatorAuthRequest = (
    params: IAuthRequest,
): Promise<IAuthRequestData> => {
    return post(`/api/auth-service/v1/indicator-authorizing-requests`, params)
}
/**
 * 发起获取指标授权请求的异步操作
 *
 * 该函数用于根据指标ID获取授权请求的详细信息可以通过指定参数来请求特定的处理方式，
 * 如引用返回或预览模式这对于动态调整请求的行为非常有用
 *
 * @param params 包含指标ID及其他可选参数的对象
 * @param params.id 指标授权请求的唯一标识符
 * @param params.reference 可选参数，指示是否返回引用默认为undefined
 * @param params.preview 可选参数，指示是否以预览模式获取请求默认为undefined
 * @returns 返回一个Promise，解析为包含指标授权请求详细信息的对象
 */
export const getIndicatorAuthRequest = (params: {
    id: string
    reference?: boolean
    preview?: boolean
}) => {
    return get(
        `/api/auth-service/v1/indicator-authorizing-requests/${params.id}`,
        params,
    )
}

/**
 * 创建API认证请求
 *
 * 本函数用于生成API认证请求，通过将认证请求参数传递到后端服务以获取认证数据
 *
 * @param params 认证请求参数，包含所需的认证信息
 * @returns 返回一个Promise对象，解析为IAuthRequestData类型的认证请求数据
 */
export const createApiAuthRequest = (
    params: IAuthRequest,
): Promise<IAuthRequestData> => {
    return post(`/api/auth-service/v1/api-authorizing-requests`, params)
}

/**
 * 获取API授权请求
 *
 * 该函数用于根据ID获取API授权请求信息，可以根据参数选择是否包含引用信息
 *
 * @param id - 授权请求的唯一标识符
 * @param params - 请求参数，可选
 *        reference - 是否包含引用信息，默认为false
 * @returns 返回获取到的API授权请求信息
 */
export const getApiAuthRequest = (
    id,
    params: {
        reference?: boolean
    },
) => {
    return get(`/api/auth-service/v1/api-authorizing-requests/${id}`, params)
}

/**
 * 创建数据仓库权限申请
 *
 * 该函数用于创建数据仓库权限申请请求，通过POST方法向指定的API端点发送请求
 *
 * @param params 数据仓库权限申请参数，包含申请单名称、数据ID、申请类型和子视图配置
 * @returns 返回一个Promise，解析为包含申请请求数据的IDwhDataAuthRequestData对象
 */
export const createDwhDataAuthRequest = (
    params: IDwhDataAuthRequest,
): Promise<IDwhDataAuthRequestData> => {
    return post(`/api/auth-service/v1/dwh-data-auth-request`, params)
}

/**
 * 获取数据仓库权限申请审核列表
 *
 * 该函数用于获取数据仓库权限申请的审核列表，通过GET方法向指定的API端点发送请求
 *
 * @param params 查询参数，包含target等筛选条件
 * @param params.target 目标类型，如 'tasks' 表示待审核任务
 * @returns 返回一个Promise，解析为包含列表数据的IDwhDataAuthRequestListResponse对象
 */
export const getDwhDataAuthRequestAuditList = (params: {
    target?: string
    [key: string]: any
}): Promise<IDwhDataAuthRequestListResponse> => {
    return get(`/api/auth-service/v1/dwh-data-auth-request/audit`, params)
}

/**
 * 获取数据仓库权限申请列表
 *
 * 该函数用于获取数据仓库权限申请的列表，通过GET方法向指定的API端点发送请求
 *
 * @param params 查询参数，包含name等筛选条件
 * @param params.name 申请单名称（可选）
 * @returns 返回一个Promise，解析为包含列表数据的IDwhDataAuthRequestApplyListResponse对象
 */
export const getDwhDataAuthRequestList = (params?: {
    name?: string
    [key: string]: any
}): Promise<IDwhDataAuthRequestApplyListResponse> => {
    return get(`/api/auth-service/v1/dwh-data-auth-request`, params)
}

/**
 * 获取数据仓库权限申请详情
 *
 * 该函数用于获取数据仓库权限申请的详细信息，通过GET方法向指定的API端点发送请求
 *
 * @param id 申请ID
 * @returns 返回一个Promise，解析为包含申请详情的IDwhDataAuthRequestDetail对象
 */
export const getDwhDataAuthRequestDetail = (
    id: string,
): Promise<IDwhDataAuthRequestDetail> => {
    return get(`/api/auth-service/v1/dwh-data-auth-request/${id}`)
}

/**
 * 更新数据仓库权限申请
 *
 * 该函数用于更新数据仓库权限申请，通过PUT方法向指定的API端点发送请求
 *
 * @param id 申请ID
 * @param params 更新参数，包含申请单名称、数据ID、申请类型、过期时间和规格配置
 * @returns 返回一个Promise，解析为包含更新后数据的IDwhDataAuthRequestData对象
 */
export const updateDwhDataAuthRequest = (
    id: string,
    params: IDwhDataAuthRequest,
): Promise<IDwhDataAuthRequestData> => {
    return put(`/api/auth-service/v1/dwh-data-auth-request/${id}`, params)
}

/**
 * 撤回数据仓库权限申请
 *
 * 该函数用于撤回数据仓库权限申请，通过PUT方法向指定的API端点发送请求
 *
 * @param id 申请ID
 * @returns 返回一个Promise，解析为包含撤回后数据的IDwhDataAuthRequestData对象
 */
export const revokeDwhDataAuthRequest = (
    id: string,
): Promise<IDwhDataAuthRequestData> => {
    return put(`/api/auth-service/v1/dwh-data-auth-request/audit/${id}`)
}

/**
 * 删除数据仓库权限申请
 *
 * 该函数用于删除数据仓库权限申请，通过DELETE方法向指定的API端点发送请求
 *
 * @param id 申请ID
 * @returns 返回一个Promise，解析为IErrorResponse对象
 */
export const deleteDwhDataAuthRequest = (
    id: string,
): Promise<IErrorResponse> => {
    return del(`/api/auth-service/v1/dwh-data-auth-request/${id}`)
}

// 获取接口列表
export const getMenuResourceActions = (params: {
    resource_id: string
    resource_type: string
}) => {
    return get(`/api/auth-service/v1/menu-resource/actions`, params)
}
