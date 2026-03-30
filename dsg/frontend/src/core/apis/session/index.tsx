import requests from '@/utils/request'

const { get, post } = requests

export interface IUserInfo {
    Account: string
    Authenticated: boolean
    CsfLevel: number
    Email: boolean
    Frozen: boolean
    ID: string
    Roles: any
    Telephone: string
    ThirdAttr: string
    ThirdID: string
    VisionName: string
}

export interface IRole {
    id: string
    name: string
    color?: string
    icon?: string
    status?: number
    system?: number
    created_at?: string
    updated_at?: string
}

/**
 * 刷新令牌
 */
export const refreshToken = () => {
    return get(`/af/api/session/v1/refresh-token`)
}

// 获取用户信息
export const getUserInfo = () => {
    return get(`/af/api/session/v1/userinfo`)
}

/*
 * 单点登录
 * @code AS TOKEN
 */
export const sso = (parms: { code: string }) => {
    return post(`/af/api/session/v1/sso`, parms)
}

/**
 * 单点登录 -- get请求
 * @param url参数或者对象参数
 */
export const ssoGet = (parms: any) => {
    if (typeof parms === 'string') {
        return get(`/af/api/session/v1/sso${parms}`)
    }
    return get(`/af/api/session/v1/sso`, parms)
}
/**
 * 获取登录配置
 * @param
 */
export const loginConfigs = () => {
    return get(`/api/eacp/v1/auth1/login-configs`)
}

/**
 * 登出
 * @returns
 */
export const logout = () => {
    return get('/af/api/session/v1/logout')
}
