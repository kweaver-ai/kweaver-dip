import { useMemo } from 'react'
import { getRuntimeBasename } from './runtimeConfig'

export const getLanguage = () => {
    const lang = navigator.language
    switch (lang) {
        case 'zh-cn':
            return 'zh-cn'

        case 'zh-TW':
            return 'zh-tw'

        case 'en':
            return 'en-us'

        default:
            return 'zh-cn'
    }
}

/**
 * 获取url中的参数信息
 */
export const useQuery = () => {
    const { href } = window.location
    const search = href.slice(href.indexOf('?'))
    return useMemo(() => new URLSearchParams(search), [search])
}

/**
 * 根据当前路径获取平台前缀
 * @returns 平台前缀
 */
export const getPlatformPrefix = () => {
    // const { pathname } = window.location
    // if (pathname.startsWith('/anyfabric/drmb/')) {
    //     return '/drmb'
    // }
    // if (pathname.startsWith('/anyfabric/drmp/')) {
    //     return '/drmp'
    // }
    // if (pathname.startsWith('/anyfabric/ca/')) {
    //     return '/ca'
    // }
    // if (pathname.startsWith('/anyfabric/cd/')) {
    //     return '/cd'
    // }
    return ''
}

/**
 * 根据当前路径获取平台类型
 * @returns 平台类型
 */
export const getPlatformNumber = () => {
    // const { pathname } = window.location
    // let platform = 1
    // if (pathname.startsWith('/anyfabric/drmb/')) {
    //     platform = 2
    // }
    // if (pathname.startsWith('/anyfabric/drmp/')) {
    //     platform = 4
    // }
    // if (pathname.startsWith('/anyfabric/ca/')) {
    //     platform = 8
    // }
    // if (pathname.startsWith('/anyfabric/cd/')) {
    //     platform = 16
    // }
    return 1
}

/**
 * 根据平台类型获取平台前缀
 * @param platform 平台类型
 * @returns 平台前缀
 */
export const getPlatformPrefixByNumber = (platform?: number) => {
    // switch (platform) {
    //     case 2:
    //         return '/drmb'
    //     case 4:
    //         return '/drmp'
    //     case 8:
    //         return '/ca'
    //     case 16:
    //         return '/cd'
    //     default:
    //         return ''
    // }
    return ''
}

const ensureLeadingSlash = (value: string) =>
    value.startsWith('/') ? value : `/${value}`

const normalizeBase = (base: string) => {
    if (!base || base === '/') {
        return ''
    }
    return base.endsWith('/') ? base.slice(0, -1) : base
}

const appendRuntimeBasename = (targetPath: string) => {
    const base = normalizeBase(getRuntimeBasename())
    const normalizedPath = ensureLeadingSlash(targetPath)
    if (!base) {
        return normalizedPath
    }
    return `${base}${normalizedPath}`
}

const stripRuntimeBasename = (targetPath: string) => {
    const base = normalizeBase(getRuntimeBasename())
    if (!base) {
        return targetPath
    }
    if (targetPath.startsWith(base)) {
        const sliced = targetPath.slice(base.length)
        return sliced ? ensureLeadingSlash(sliced) : '/'
    }
    return targetPath
}

const applyPlatformPrefix = (
    path: string,
    needPlatform: boolean,
    platform: number,
) => {
    if (!needPlatform) {
        return ensureLeadingSlash(path)
    }
    const platformPrefix =
        getPlatformPrefixByNumber(platform) || getPlatformPrefix()
    if (!platformPrefix) {
        return ensureLeadingSlash(path)
    }
    const normalizedPlatform = normalizeBase(platformPrefix) || platformPrefix
    const normalizedPath = ensureLeadingSlash(path)
    return `${normalizedPlatform}${normalizedPath}`
}

/**
 * 检查是否在qiankun微应用环境中
 * @returns 是否为微应用模式
 */
export const isInQiankun = () => {
    // eslint-disable-next-line no-underscore-dangle
    return window.__POWERED_BY_QIANKUN__ || false
}

/**
 * url地址根据浏览器地址拼接
 * @param path 路径
 * @param needPlatform 是否需要平台前缀, 默认需要true
 * @param platform 指定平台类型, 默认当前平台
 * @returns 拼接后的url
 */
export const getActualUrl = (
    path: string,
    needPlatform: boolean = true,
    platform: number = 0,
): string => {
    const pathWithPlatform = applyPlatformPrefix(path, needPlatform, platform)
    return appendRuntimeBasename(pathWithPlatform)
}

/**
 * 不同平台跳转
 * @param path 路径
 * @param platform 指定平台类型, 默认当前平台
 * @returns 拼接后的url
 */
export const getPlatformActualUrl = (
    path: string,
    platform: number = 0,
): string => {
    const withPlatform = applyPlatformPrefix(path, true, platform)
    return appendRuntimeBasename(withPlatform)
}

/**
 * 获取去除 /anyfabric 前缀的url
 * @param path
 * @returns
 */
export const getInnerUrl = (path: string, needPlatform: boolean = true) => {
    const result = stripRuntimeBasename(path)
    if (!needPlatform) {
        return result
    }
    const platformPrefix = normalizeBase(getPlatformPrefix())
    if (platformPrefix && result.startsWith(platformPrefix)) {
        const sliced = result.slice(platformPrefix.length)
        return sliced ? ensureLeadingSlash(sliced) : '/'
    }
    return result
}

// 修改页面路径参数，但不刷新页面
export const rewriteUrl = (path: string) => {
    window.history.replaceState({}, '', path)
}

// 删除页面路径参数，但不刷新页面
export const deletePathParam = (query: URLSearchParams, param: string) => {
    query.delete(param)
    let newUrl = `${window.location.pathname}?`
    // query.forEach((val, key, parent) => {
    //     newUrl += `${key}=${val || ''}&`
    // })

    // if (newUrl[newUrl.length - 1] === '&') {
    //     newUrl = newUrl.slice(0, newUrl.length - 2)
    // }
    newUrl += decodeURIComponent(query.toString() || '')
    return newUrl
}

// 处理get请求方式中传数组参数
export const getRequestArryParams = (key: string, list: string[]) => {
    let params = ''
    list.forEach((id) => {
        // eslint-disable-next-line
        params = `${key}=${id}${params ? '&' : ''}` + params
    })
    return params
}
