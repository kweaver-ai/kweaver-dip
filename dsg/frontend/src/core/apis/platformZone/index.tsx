import { DisplayModeType } from '@/core'
import requests from '@/utils/request'

const { get, post, put, delete: del } = requests
// 工作专区

// 更新工作专区显示设置接口
export const updatePlatformDisplayConfig = (mode: DisplayModeType) => {
    return post(`/api/configuration-center/v1/platform-zone/display-config`, {
        mode,
    })
}
// 查看工作专区显示设置接口
export const getPlatformDisplayConfig = () => {
    return get(`/api/configuration-center/v1/platform-zone/display-config`)
}

// 功能入口创建
export const createPlatform = (data) => {
    return post(`/api/configuration-center/v1/platform-zone`, data)
}

// 功能入口编辑
export const editPlatform = (data) => {
    const { id, ...otherData } = data
    return put(`/api/configuration-center/v1/platform-zone/${id}`, otherData)
}

// 功能入口详情
export const detailsPlatform = (id) => {
    return get(`/api/configuration-center/v1/platform-zone/${id}`)
}

// 功能入口删除
export const deletePlatform = (id) => {
    return del(`/api/configuration-center/v1/platform-zone/${id}`)
}

// 功能入口列表(管理页面)
export const getPlatformManageList = (params) => {
    return get(`/api/configuration-center/v1/platform-zone`, params)
}

// 功能入口列表(首页)
export const getPlatformHomeList = () => {
    return get(`/api/configuration-center/v1/platform-zone/home-page`)
}

// 功能入口排序
export const platformSort = (data) => {
    return put(`/api/configuration-center/v1/platform-zone/sort`, data)
}

// 功能入口启停
export const setPlatformStatus = (data) => {
    return put(`/api/configuration-center/v1/platform-zone/status`, data)
}

// 功能入口埋点记录
export const setPlatformRecentlyused = (data) => {
    return post(
        `/api/configuration-center/v1/platform-zone/recently-used`,
        data,
    )
}

// 功能入口最近使用列表
export const getPlatformRecentlyused = () => {
    return get(`/api/configuration-center/v1/platform-zone/recently-used`)
}

// 以下是平台服务相关接口
// 功能入口创建
export const createPlatformServices = (data) => {
    return post(`/api/configuration-center/v1/platform-services`, data)
}

// 功能入口编辑
export const editPlatformServices = (data) => {
    const { id, ...otherData } = data
    return put(
        `/api/configuration-center/v1/platform-services/${id}`,
        otherData,
    )
}

// 功能入口详情
export const detailsPlatformServices = (id) => {
    return get(`/api/configuration-center/v1/platform-services/${id}`)
}

// 功能入口删除
export const deletePlatformServices = (id) => {
    return del(`/api/configuration-center/v1/platform-services/${id}`)
}

// 功能入口列表(管理页面)
export const getPlatformServicesManageList = (parmas) => {
    return get(`/api/configuration-center/v1/platform-services`, parmas)
}

// 功能入口列表(首页)
export const getPlatformServicesHomeList = () => {
    return get(`/api/configuration-center/v1/platform-services/home-page`)
}

// 功能入口排序
export const platformServicesSort = (data) => {
    return put(`/api/configuration-center/v1/platform-services/sort`, data)
}

// 功能入口启停
export const setPlatformServicesStatus = (data) => {
    return put(`/api/configuration-center/v1/platform-services/status`, data)
}

// 功能入口埋点记录
export const setPlatformServicesRecentlyused = (data) => {
    return post(
        `/api/configuration-center/v1/platform-zone/recently-used`,
        data,
    )
}
