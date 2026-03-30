import requests from '@/utils/request'

const { get, post, put, delete: del } = requests

/**
 * 保存画布右侧选中库表——调用库表保存时触发
 * @param params
 * @returns
 */
export const saveMultiViewRequest = (params: {
    ids: []
    scene_id: string
}): Promise<any> => {
    return post(`/api/scene-analysis/v1/scene/save-multi-view`, params)
}

/**
 * 查询画布右侧选中库表——调用更新库表时展示
 * @param params
 * @returns
 */
export const getMultiViewRequest = (params: {
    scene_id: string
}): Promise<any> => {
    return post(`/api/scene-analysis/v1/scene/query-multi-view`, params)
}

/**
 * 点击sql算子，返回前序节点sql
 * @param params
 * @returns
 */
export const getExecSqlRequest = (params: {
    canvas: any
    id: string
    type: string
}): Promise<any> => {
    return post(`/api/scene-analysis/v1/scene/return-exec-sql`, params)
}

/**
 * 执行sql算子
 */
export const execCustomViewSqlRequest = (
    params: {
        sql_type: string
        exec_sql: string
    },
    queryParams: string,
): Promise<any> => {
    return post(
        `/api/scene-analysis/v1/scene/exec-sql?type=data-view&${queryParams}`,
        params,
    )
}

/**
 * 删除选中的库表
 */
export const deleteSelectViewRequest = (params: {
    view_id: any
}): Promise<any> => {
    return post(`/api/scene-analysis/v1/scene/delete-view`, params)
}
