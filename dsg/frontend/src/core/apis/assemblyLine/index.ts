import requests from '@/utils/request'
import {
    IAssemblyLineGetRolesModel,
    IAssemblyLineEditParams,
    IAssemblyLineItem,
    IAssemblyLineModel,
    IAssemblyLineQueryParams,
    IAssemblyLineGetContentModel,
    IAssemblyLineSaveContentModel,
} from './index.d'

const { get, post, put, delete: del } = requests

/**
 * 查看工作流程列表(不包含正在创建中的工作流程)
 * @param params
 */
export const assemblyLineQueryList = (
    params: IAssemblyLineQueryParams,
): Promise<IAssemblyLineModel> => {
    return get(`/api/configuration-center/v1/flowchart-configurations`, params)
}

/**
 * 查看指定工作流程基本信息
 * @param fid string 工作流程ID
 */
export const assemblyLineQueryItem = (
    fid: string,
): Promise<IAssemblyLineItem> => {
    return get(`/api/configuration-center/v1/flowchart-configurations/${fid}`)
}

/**
 * 删除指定工作流程
 * @param fid string 工作流程ID
 * @returns
 */
export const assemblyLineDelete = (
    fid: string,
): Promise<{ id: string; name: string }> => {
    return del(`/api/configuration-center/v1/flowchart-configurations/${fid}`)
}

/**
 * 预新建工作流程
 * @param params
 * @returns
 */
export const assemblyLineCreate = (
    params: IAssemblyLineEditParams,
): Promise<{ id: string; name: string }> => {
    return post(`/api/configuration-center/v1/flowchart-configurations`, params)
}

/**
 * 编辑指定工作流程基本信息
 * @param fid string 工作流程ID
 * @param params
 * @returns
 */
export const assemblyLineEdit = (
    fid: string,
    params: IAssemblyLineEditParams,
): Promise<{ id: string; name: string }> => {
    return put(
        `/api/configuration-center/v1/flowchart-configurations/${fid}`,
        params,
    )
}

/**
 * 获取指定工作流程内容
 * @param fid string 工作流程ID
 * @param version_id string? 工作流程版本ID，如果指定，则返回指定版本ID的工作流程内容；如果不指定，则返回最新的版本内容--发布存在变更的内容>>发布未变更的内容>>未发布的内容
 */
export const assemblyLineGetContent = (
    fid: string,
    params: { version_id?: string },
): Promise<IAssemblyLineGetContentModel> => {
    return get(
        `/api/configuration-center/v1/flowchart-configurations/${fid}/content`,
        params,
    )
}

/**
 * 保存工作流程内容
 * @param fid string 工作流程ID
 * @param version_id string? 工作流程版本ID，如果指定，则返回指定版本ID的工作流程内容；如果不指定，则返回最新的版本内容--发布存在变更的内容>>发布未变更的内容>>未发布的内容
 */
export const assemblyLineSaveContent = (
    fid: string,
    params: IAssemblyLineSaveContentModel,
): Promise<{ id: string; name: string }> => {
    return post(
        `/api/configuration-center/v1/flowchart-configurations/${fid}/content`,
        params,
    )
}

/**
 * 工作流程名称唯一性校验
 * @param name string 工作流程名称
 * @param flowchart_id string? 工作流程ID，可以为空，不为空表示排除该ID所对应的工作流程
 * @returns
 */
export const assemblyLineCheckUniqueness = (params: {
    flowchart_id?: string
    name: string
}): Promise<{
    repeat: boolean
    name: string
}> => {
    return get(
        `/api/configuration-center/v1/flowchart-configurations/check`,
        params,
    )
}

/**
 * 获取角色列表
 * @returns
 */
export const assemblyLineGetRoles = (): Promise<IAssemblyLineGetRolesModel> => {
    return get(`/api/configuration-center/v1/roles`)
}
