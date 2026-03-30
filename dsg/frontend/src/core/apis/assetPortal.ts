import request from '@/utils'

export const enum AssetType {
    // 数据目录
    DataCatalog = 'data_catalog',

    // 接口服务
    InterfaceSvc = 'interface_svc',

    // 库表
    DataView = 'data_view',

    // 指标
    Indicator = 'indicator',
}

export interface IGetRecords {
    // 获取申请记录条数。默认5条
    nums?: number

    // 申请记录类型
    type: AssetType
}

// 获取申请记录列表
export const getApplicationRecords = ({ nums = 5, type }: IGetRecords) =>
    request.get(`/api/asset-portal/v1/assets/application-records`, {
        nums,
        type,
    })

// 获取最新上线的资源列表
export const getLatestOnline = ({ nums = 12, type }: IGetRecords) =>
    request.get(`/api/asset-portal/v1/assets/latest-online`, { nums, type })

// 获取最受欢迎的资源列表
export const getMostPopular = ({ nums = 5, type }: IGetRecords) =>
    request.get(`/api/asset-portal/v1/assets/most-popular`, { nums, type })

// 获取我的资源统计信息
export const getUserAssets = ({ nums, type }: IGetRecords) =>
    request.get(`/api/asset-portal/v1/assets/user-assets`, { nums, type })

// 获取资源访问量
export const getVisited = ({ nums = 5, type }: IGetRecords) =>
    request.get(`/api/asset-portal/v1/assets/visited`, { nums, type })

// 获取当前用户使用中页面布局信息及所有组件
export const getHomepage = (page_id?: string) =>
    request.get(`/api/asset-portal/v1/homepage`, { page_id })

// 更新当前用户使用中页面布局信息及所有组件
export const updateHomepage = (
    components?: {
        component_id: string
        component_type: string
        layout: string
    }[],
    page_id?: string,
) => request.put(`/api/asset-portal/v1/homepage`, { page_id, components })

/**
 * 获取我的资产的统计
 * @returns
 */
export const getMyAssetsCount = (): Promise<{
    data_view: {
        authorized: number
        owner: number
    }
    interface_svc: {
        authorized: number
        owner: number
    }
    indicator: {
        authorized: number
        owner: number
    }
}> => {
    return request.get(`/api/asset-portal/v1/assets/my-assets/count`)
}

/**
 * 获取被授权资源
 * @param params
 * @returns
 */
export const getMyAuthorizedAssets = (params: {
    resource_type:
        | AssetType.DataView
        | AssetType.InterfaceSvc
        | AssetType.Indicator
}): Promise<
    Array<{
        id: string
        name: string
        authorized_at: number
        indicator_type?: string
    }>
> => {
    return request.get(`/api/asset-portal/v1/assets/my-assets`, params)
}

/**
 * 获取最近发布的资产
 * @param params
 * @returns
 */
export const getDataSouceLatestPublish = (params: {
    resource_type:
        | AssetType.DataView
        | AssetType.InterfaceSvc
        | AssetType.Indicator
}): Promise<
    Array<{
        id: string
        name: string
        online_at: number
        publish_at?: number
        indicator_type?: string
    }>
> => {
    return request.get(
        `/api/asset-portal/v1/assets/data-resource/latest-publish`,
        params,
    )
}

/**
 * 获取最近上线的资源目录
 * @returns
 */
export const getDataCatalogLatestOnline = (): Promise<
    Array<{
        id: string
        name: string
        online_at: number
    }>
> => {
    return request.get(`/api/asset-portal/v1/assets/data-catalog/latest-online`)
}

/**
 * 获取最近下载的库表
 * @returns
 */
export const getAssetLatestDownload = (): Promise<
    Array<{
        id: string
        name: string
        download_at: number
    }>
> => {
    return request.get(`/api/asset-portal/v1/assets/latest-visited`)
}

// 数据统计---start

export interface IStaticsAmount {
    // 非必须 数据总量
    total_data_count?: number
    // 非必须 库表总量
    total_table_count?: number
    // 非必须 服务使用次数
    service_usage_count?: number
    // 非必须 共享数据量
    shared_data_count?: number
    // 非必须 服务总数
    services_data_count?: number
}

export interface IRankingStatics {
    latestCatalogs: {
        // 非必须 最新目录
        items?: Array<{
            id: string
            // 目录/接口名称
            name: string
            // 上线日期
            onlineTime: string
        }>
        // 最近四周的数量
        weeks?: Array<{
            // 年月份-必须
            yearMonth: string
            // 周数-必须
            weekNumber: number
            // 数量-必须
            quantity: number
        }>
    }
    popularCatalogs: {
        // 非必须 最新接口
        items?: Array<{
            id: string
            // 目录/接口名
            name: string
            // 申请量
            applyCount?: number
        }>
        // 最近四周的明细数量
        weeks?: Array<{
            // 年月份-必须
            yearMonth: string
            // 周数-必须
            weekNumber: number
            // 数量-必须
            applyCount: number
        }>
    }
}

/**
 * 首页数量统计
 * @returns
 */
export const reqHomeStaticsAmount = (): Promise<{
    data: IStaticsAmount
}> => request.get(`/api/asset-portal/v1/assets/data-catalog/show-count`)

/**
 * 数据榜单统计
 * @param resource_type 分类
 * @returns
 */
export const reqRankingStatics = (
    resource_type: AssetType.DataCatalog | AssetType.InterfaceSvc,
): Promise<{
    data?: IRankingStatics
}> =>
    request.get(`/api/asset-portal/v1/assets/data-catalog/top-aggregation`, {
        resource_type,
    })
// 数据统计---end
