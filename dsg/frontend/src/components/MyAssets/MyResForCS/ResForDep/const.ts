import { SortDirection } from '@/core'
import __ from '../locale'
import { ResTypeEnum } from '../const'

export const TabList = [
    {
        key: ResTypeEnum.Catalog,
        label: __('数据资源目录'),
    },
    {
        key: ResTypeEnum.View,
        label: __('库表'),
    },
    {
        key: ResTypeEnum.Api,
        label: __('接口服务'),
    },
    {
        key: ResTypeEnum.File,
        label: __('文件'),
    },
]

export const placeHolderMap = {
    [ResTypeEnum.Catalog]: __('搜索目录名称、编码'),
    [ResTypeEnum.View]: __('搜索表技术名称、表业务名称、编码'),
    [ResTypeEnum.Api]: __('搜索接口名称、编码'),
    [ResTypeEnum.File]: __('搜索文件名称、编码'),
}

export const InitSearchCondition = {
    [ResTypeEnum.Catalog]: {
        keyword: '',
        offset: 1,
        limit: 10,
        sort: 'online_time',
        direction: SortDirection.DESC,
        online_status: 'online,down-auditing,down-reject',
        my_department_resource: true,
    },
    [ResTypeEnum.View]: {
        keyword: '',
        offset: 1,
        limit: 10,
        sort: 'publish_at',
        direction: SortDirection.DESC,
        publish_status: 'publish',
        my_department_resource: true,
    },
    [ResTypeEnum.Api]: {
        keyword: '',
        offset: 1,
        limit: 10,
        sort: 'online_time',
        direction: SortDirection.DESC,
        online_statuses: 'online,down-auditing,down-reject',
        my_department_resource: true,
    },
    [ResTypeEnum.File]: {
        keyword: '',
        offset: 1,
        limit: 10,
        sort: 'published_at',
        direction: SortDirection.DESC,
        publish_status: 'published',
        my_department_resource: true,
    },
}
