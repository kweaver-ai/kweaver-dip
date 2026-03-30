import { SortDirection } from '@/core'
import __ from '../locale'

export enum ViewSortType {
    NAME = 'name',
    PUBLISH = 'publish_at',
    ONLINE = 'online_time',
    UPDATETIME = 'update_time',
    UPDATEDAT = 'updated_at',
}

export enum ApiSortType {
    NAME = 'name',
    UPDATE = 'update_time',
    PUBLISH = 'publish_time',
    ONLINE = 'online_time',
    CREATE = 'create_time',
}

export enum indicatorSortType {
    NAME = 'name',
    UPDATE = 'updated_at',
}

export const indicatorSortMenus = [
    // 根据using启用状态确定时间排序
    {
        key: ApiSortType.NAME,
        label: __('按资源名称排序'),
        ort: SortDirection.ASC,
    },
    {
        key: indicatorSortType.UPDATE,
        label: __('按发布时间排序'),
        sort: SortDirection.DESC,
    },
]

export interface IAvailableAssetsQueryList {
    keyword?: string
    offset: number
    limit: number
    orgcode?: string
    org_code?: string
    direction?: string
    sort?: string
    owner_id?: string
}
export interface IApplicationAssetQueryList {
    keyword?: string
    offset: number
    limit: number
    end_time?: number
    start_time?: number
    state?: string
    audit_status?: string
    direction?: string
    sort?: string
}

/** 默认查询参数 */
export const InitCondition: IAvailableAssetsQueryList = {
    offset: 1,
    limit: 10,
    org_code: undefined,
}

// 定义访问者类型的枚举
// 枚举包含两种访问者类型：用户和应用
export enum AssetVisitorTypes {
    USER = 'user', // 用户类型访问者
    APPLICATION = 'application', // 应用程序类型访问者
    None = 'none', // 未定义类型访问者
}
