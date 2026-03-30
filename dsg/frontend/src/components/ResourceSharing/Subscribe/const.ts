import { ApplyResource } from '../const'
import __ from '../locale'

/**
 * 同步记录表头排序项
 */
export enum SortType {
    Start = 'Start',
    End = 'End',
}

/**
 * 排序默认值
 */
export const defaultSort = {
    [SortType.Start]: 'descend',
    [SortType.End]: null,
}

/**
 * 资源信息
 */
export const resourceInfo = [
    {
        key: 'catalog_title',
        label: __('数据目录名称'),
        value: '',
        span: 24,
    },
    {
        key: 'catalog_code',
        label: __('数据目录编码'),
        value: '',
        span: 24,
    },
    {
        key: 'resource_name',
        label: __('资源名称'),
        value: '',
        span: 24,
    },
    {
        key: 'resource_type',
        label: __('资源类型'),
        value: '',
        span: 24,
    },
]

/**
 * 数据库信息
 */
export const databaseInfo = [
    {
        key: 'data_source_name',
        label: __('数据源'),
        value: '',
        span: 24,
    },
    {
        key: 'accept_table',
        label: __('数据表名称'),
        value: '',
        span: 24,
    },
]

/**
 * 接口信息
 */
export const interfaceInfo = [
    {
        key: 'auth_type',
        label: __('授权方式'),
        value: '',
        span: 24,
    },
    {
        key: 'service_url',
        label: __('接口请求地址'),
        value: '',
        span: 24,
        view_type: 'copy',
    },
    {
        key: 'token_url',
        label: __('token请求地址'),
        value: '',
        span: 24,
        view_type: 'copy',
    },
]

/**
 * 文件信息
 */
export const fileInfo = [
    {
        key: 'accept_path',
        label: __('文件存储路径'),
        value: '',
        span: 24,
        view_type: 'copy',
    },
]

export const subscribeDetailMap = {
    [ApplyResource.Database]: [
        {
            title: __('资源信息'),
            content: resourceInfo,
        },
        {
            title: __('数据库信息'),
            content: databaseInfo,
        },
    ],
    [ApplyResource.Interface]: [
        {
            title: __('资源信息'),
            content: resourceInfo,
        },
        {
            title: __('订阅信息'),
            content: interfaceInfo,
        },
    ],
    [ApplyResource.File]: [
        {
            title: __('资源信息'),
            content: resourceInfo,
        },
        {
            title: __('文件存储路径'),
            content: fileInfo,
        },
    ],
}
