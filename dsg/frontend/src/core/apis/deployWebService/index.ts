import requests from '@/utils/request'

const { get, post, put, delete: del } = requests

/** 获取部署个性化配置 */
export const deployWebService = (params: { section: string }) => {
    return get('/api/deploy-web-service/v1/oemconfig', params)
}
