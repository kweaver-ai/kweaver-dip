/* eslint-disable camelcase */
import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios'
import Cookies from 'js-cookie'
import { isFunction } from 'lodash'
import { getActualUrl } from './browser'
import { axiosInstance } from './request'
import { tokenManager } from './tokenManager'

export interface IOAuth2Token {
    access_token: string
    expires_in?: number
    id_token: string
    refresh_token?: string
    scope?: string
    token_type?: string
}

export interface ITokenIntercepterOptions {
    refreshable?: (number | string)[]
    instance?: AxiosInstance
    refreshToken(): Promise<IOAuth2Token | null | undefined>
    onTokenExpired: () => void
    refreshByNewHostToken(): any
    getMicroWidget: () => any
}

let refreshPromise: any

export function createTokenIntercepter({
    // refreshable = [401001001, 401000000, 'Common.UnAuthorization'],
    refreshToken,
    onTokenExpired,
    instance = axios,
    refreshByNewHostToken,
    getMicroWidget,
}: ITokenIntercepterOptions): (
    err: AxiosError<{
        code: number
    }>,
) => Promise<AxiosResponse<any>> {
    return async (err: any) => {
        if (err?.response?.status === 401) {
            const microWidget = getMicroWidget()
            if (microWidget) {
                // AF 集成到AS 插件 401 处理逻辑
                if (!refreshPromise) {
                    refreshPromise = refreshByNewHostToken()
                }
                try {
                    const res = await refreshPromise
                    const token = res?.access_token || ''
                    if (token) {
                        axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`
                        return instance.request({
                            ...err.config,
                            headers: {
                                ...(err.config.headers || {}),
                                Authorization: `Bearer ${token}`,
                            },
                        })
                    }
                } catch (error) {
                    microWidget?.components?.toast?.error('AF登录超时')
                } finally {
                    refreshPromise = null
                }
            }
            // AF 401 处理逻辑
            // if (refreshable.includes(err.response?.data?.code)) {
            if (!refreshPromise) {
                refreshPromise = refreshToken()
            }
            try {
                await refreshPromise
                const token = Cookies.get('af.oauth2_token') || ''
                // const userid = Cookies.get('af.userid') || ''
                sessionStorage.setItem('af.oauth2_token', token)
                // sessionStorage.setItem('af.userid', userid)
                if (token) {
                    axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`
                    return instance.request({
                        ...err.config,
                        headers: {
                            ...(err.config.headers || {}),
                            Authorization: `Bearer ${token}`,
                        },
                    })
                }
            } catch (e) {
                const { hostname } = window.location
                Cookies.remove('af.session_id', {
                    domain: `${hostname}`,
                    path: '/',
                })
                Cookies.remove('af.oauth2_token', {
                    domain: `${hostname}`,
                    path: '/',
                })
                tokenManager.clearAll()
                // TODO:捕获到错误跳出登录
                if (isFunction(onTokenExpired)) {
                    onTokenExpired()
                } else {
                    window.location.href = getActualUrl('/')
                }
                // throw err
            } finally {
                refreshPromise = null
            }
            // }
        }

        throw err
    }
}
