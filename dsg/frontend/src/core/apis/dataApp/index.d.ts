import { StringArraySupportOption } from 'prettier'

/**
 * 数据产品
 * @id 数据产品ID
 * @name 数据产品名称
 * @desc 数据产品描述
 * @canvas 数据产品画布信息
 * @config 画布节点配置
 * @updated_at 更新时间
 * @updated_by 更新人
 */
export interface IDataAppItem {
    id: string
    name: string
    desc: string
    image?: string
    config?: any
    updated_at?: number
    updated_by?: string
}

/**
 * 权限类别
 */
export enum DataAppAuthSource {
    /** 编辑 */
    Edit = 1,
    /** 读取 */
    Run = 2,
}

/**
 * 授权用户列表和权限
 * @id 数据应用ID
 * @auth_list 授权用户列表和权限
 */
export interface IDataAppAuthSubItem {
    user_id: string
    source: DataAppAuthSource
    expiry_date: string
}

/**
 * 数据应用授权请求参数
 * @id 数据应用ID
 * @auth_list 授权用户列表和权限
 */
export interface IDataAppAuthItem {
    id: string
    auth_list: IDataAppAuthSubItem[]
}

/**
 * agentQA请求参数
 * @id 数据产品id
 * @stream 流式为True，非流式为False
 * @session_id 当前会话id
 * @config 数据产品配置
 * @que 问题内容
 * @chat_history 历史问题列表
 * @is_debug 当前模式 （true:调试模式，false:正常使用模式）
 * @user_name 当前用户名
 * @user_id 当前用户id
 */
export interface IAgentQAParams {
    id: string
    stream: boolean
    session_id: string
    config: Record<string, any>
    que: string
    chat_history: any[]
    is_debug: boolean
    user_name: string
    user_id: string
}
