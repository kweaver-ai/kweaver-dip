import moment from 'moment'
import __ from './locale'
import {
    serviceTypeList,
    protocolList,
    httpMethodList,
} from '../ApiServices/const'
import { updateCycleOptions } from '../ResourcesDir/const'
import { SortDirection } from '@/core'

export interface ITabsList {
    label: string
    key: string
    hasTopLine?: boolean
    icon?: any
}

export interface IAvailableAssetsQueryList {
    keyword?: string
    offset: number
    limit: number
    orgcode?: string
    org_code?: string
    direction?: string
    sort?: string
    owner_id?: string
    data_owner?: string
    indicator_type?: string
    policy_status?: string
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

/**
 * 排序方式
 * @param CREATED 'created_at' 按创建时间排序
 * @param UPDATED 'updated_at' 按更新时间排序
 */
export enum SortType {
    CREATED = 'created_at',
    UPDATED = 'updated_at',
    PUBLISH = 'published_at',
    ONLINE = 'online_time',
    APPLY = 'create_time',
}

export const menus = [
    {
        key: SortType.CREATED,
        label: __('按申请时间排序'),
        sort: SortDirection.DESC,
    },
    // { key: SortType.UPDATED, label: __('按最终修改时间') },
]
export const apiMenus = [
    {
        key: SortType.APPLY,
        label: __('按申请时间排序'),
        sort: SortDirection.DESC,
    },
    // { key: SortType.UPDATED, label: __('按最终修改时间') },
]

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

export const apiSortMenus = [
    // 根据using启用状态确定时间排序
    {
        key: ApiSortType.PUBLISH,
        label: __('按发布时间排序'),
        sort: SortDirection.DESC,
    },
    {
        key: ApiSortType.ONLINE,
        label: __('按上线时间排序'),
        sort: SortDirection.DESC,
    },
]

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

export enum ViewSortType {
    NAME = 'name',
    PUBLISH = 'publish_at',
    ONLINE = 'online_time',
    UPDATETIME = 'update_time',
    UPDATEDAT = 'updated_at',
}

export const avalidableSortMenus = [
    // 根据using启用状态确定时间排序
    {
        key: ViewSortType.PUBLISH,
        label: __('按发布时间排序'),
        sort: SortDirection.DESC,
    },
    {
        key: ViewSortType.ONLINE,
        label: __('按上线时间排序'),
        sort: SortDirection.DESC,
    },
]

export const auditType = [
    { key: 'af-data-catalog-download', label: __('数据下载') },
]

// 资源目录详情
export const appAssetCatlgDetails = [
    {
        key: 'apllyInfo',
        label: __('申请信息'),
        list: [
            { label: __('申请编号'), value: '', key: 'apply_sn' },
            { label: __('申请状态'), value: '', key: 'apply_state' },
            {
                label: __('申请时长'),
                value: '',
                key: 'apply_days',
                unit: '天',
            },
            { label: __('申请时间'), value: '', key: 'apply_created_at' },
            { label: __('申请部门'), value: '', key: 'apply_orgs', span: 24 },
            { label: __('申请理由'), value: '', key: 'apply_reason', span: 24 },
        ],
    },
    {
        key: 'assetInfo',
        label: __('资源信息'),
        list: [
            { label: __('资源编号'), value: '', key: 'asset_code' },
            { label: __('资源名称'), value: '', key: 'asset_name' },
            { label: __('所属部门'), value: '', key: 'asset_orgname' },
            {
                label: __('服务类型'),
                value: '',
                key: 'audit_type',
                options: auditType,
            },
            {
                label: __('更新周期'),
                value: '',
                key: 'update_cycle',
                options: updateCycleOptions,
            },
            { label: __('资源状态'), value: '', key: 'asset_state' },
            { label: __('信息系统'), value: '', key: 'asset_infos' },
        ],
    },
]
// 接口服务详情
export const appAssetApiDetails = [
    {
        key: 'apllyInfo',
        label: __('申请信息'),
        list: [
            { label: __('申请编号'), value: '', key: 'apply_id' },
            { label: __('申请状态'), value: '', key: 'audit_status' },
            {
                label: __('申请时长'),
                value: '',
                key: 'apply_days',
                unit: '天',
            },
            { label: __('申请时间'), value: '', key: 'create_time' },
            { label: __('申请部门'), value: '', key: 'org_name', span: 24 },
            { label: __('申请理由'), value: '', key: 'apply_reason', span: 24 },
        ],
    },
    {
        key: 'assetInfo',
        label: __('接口信息'),
        list: [
            {
                label: __('接口编号'),
                value: '',
                key: 'service_code',
                type: 'basic',
            },
            {
                label: __('接口名称'),
                value: '',
                key: 'service_name',
                type: 'basic',
            },
            {
                label: __('所属部门'),
                value: '',
                key: 'department',
                type: 'basic',
            },
            {
                label: __('接口地址'),
                value: '',
                key: 'service_address',
                span: 24,
            },
            {
                label: __('AppId'),
                value: '',
                key: 'app_id',
            },
            {
                label: __('密钥'),
                value: '',
                key: 'app_secret',
            },
            {
                label: __('接口类型'),
                value: '',
                key: 'service_type',
                options: serviceTypeList,
            },
            {
                label: __('接口协议'),
                value: '',
                key: 'protocol',
                options: protocolList,
            },
            {
                label: __('请求方式'),
                value: '',
                key: 'http_method',
                options: httpMethodList,
            },
        ],
    },
]

export const authInfoDetails = [
    { label: __('接口地址'), value: '', key: 'service_address', span: 24 },
    {
        label: __('AppId'),
        value: '',
        key: 'app_id',
        span: 24,
    },
    {
        label: __('密钥'),
        value: '',
        key: 'app_secret',
        span: 24,
    },
    {
        label: __('服务到期时间'),
        value: '',
        key: 'expired_time',
        span: 24,
    },
]

// 审核状态转字符串
export const auditStateToString = {
    1: 'auditing',
    2: 'pass',
    3: 'reject',
}
// 审核状态转数字类型
export const auditStateToNum = {
    auditing: 1,
    pass: 2,
    reject: 3,
}

/** 默认查询参数 */
export const InitCondition: IAvailableAssetsQueryList = {
    offset: 1,
    limit: 10,
    org_code: undefined,
    policy_status: undefined,
    keyword: undefined,
    data_owner: undefined,
    indicator_type: undefined,
}

// 定义访问者类型的枚举
// 枚举包含两种访问者类型：用户和应用
export enum AssetVisitorTypes {
    USER = 'user', // 用户类型访问者
    APPLICATION = 'application', // 应用程序类型访问者
    None = 'none', // 未定义类型访问者
}

/**
 * 检查资产是否过期
 * @param policy 资产策略
 * @returns 是否过期
 */
export const checkoutAssetHasExpired = (policy: Array<any>) => {
    let expired = false
    policy.forEach((item) => {
        if (item?.expired_at && moment(item.expired_at).isBefore(moment())) {
            expired = true
        }
    })
    return expired
}
