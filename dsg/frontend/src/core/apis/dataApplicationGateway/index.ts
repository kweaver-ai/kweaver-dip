import requests from '@/utils/request'

const { get, post, put, delete: del } = requests

/**
 * 测试接口
 */
export const queryTestAPI = (
    params: any,
): Promise<{
    request: string
    response: string
}> => {
    return post('/api/data-application-gateway/v1/query-test', params)
}
