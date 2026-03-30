import requests from '@/utils/request'
import {
    IGetConfigRule,
    IExecuteProjectsConfigRule,
    IGetDatasourceExplorationStatus,
} from './index.d'

const { get, post, put, delete: del } = requests

/**
 * 探查项目配置获取
 * @param params
 */
export const getProjectsConfigRule = (
    params?: IGetConfigRule,
): Promise<any> => {
    return get(`/api/data-exploration-service/v1/projects`, params)
}
/**
 * 执行探查项目
 * @param params
 */
export const executeProjectsConfigRule = (
    params: IExecuteProjectsConfigRule,
): Promise<any> => {
    return post(`/api/data-exploration-service/v1/reports`, params)
}
/**
 * 删除探查报告
 * @param params
 */
export const delExplorationReport = (id: string, params: any): Promise<any> => {
    return del(`/api/data-exploration-service/v1/report/${id}`, params)
}

// /**
//  * 删除探查任务
//  * @param params
//  */
// export const delExplorationTask = (id: string): Promise<any> => {
//     return del(`/api/data-exploration-service/v1/explore-task/${id}`)
// }
