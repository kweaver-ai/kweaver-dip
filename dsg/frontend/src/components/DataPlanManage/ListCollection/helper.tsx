import { SearchType } from '@/components/SearchLayout/const'
import { SortDirection } from '@/core'
import { IformItem, SearchType as ST } from '@/ui/LightweightSearch/const'
import __ from './locale'

export const initSearchCondition: any = {
    offset: 1,
    limit: 10,
    keyword: '',
    direction: SortDirection.DESC,
    sort: 'created_at',
}

export const DefaultMenu = {
    key: 'created_at',
    sort: SortDirection.DESC,
    label: __('按创建时间排序'),
}

export const StatusOptions = [
    {
        key: 'Draft',
        label: __('待提交'),
        value: 'Draft',
    },
    {
        key: 'Auditing',
        label: __('审核中'),
        value: 'Auditing',
    },
    {
        key: 'Reject',
        label: __('审核未通过'),
        value: 'Reject',
    },
    {
        key: 'Completed',
        label: __('已通过'),
        value: 'Completed',
    },
]

const NotLimit = {
    key: '',
    label: __('不限'),
    value: undefined,
}

/** 搜索筛选项 */
export const SearchFilter: IformItem[] = [
    {
        label: __('状态'),
        key: 'status',
        type: ST.Radio,
        options: [NotLimit, ...StatusOptions],
    },
]

export const getDepartName = (name: string) => {
    return name?.slice((name?.lastIndexOf('/') ?? 0) + 1)
}

/** 归集清单创建方式 */
export enum CreateMethod {
    Raw = 'Raw', // 表单创建
    WorkOrder = 'WorkOrder', // 工单创建
    BusinessForm = 'BusinessForm', // 通过业务表添加
}

/** 归集方式 */
export const CollectionMethod = [
    {
        key: 'Full',
        label: __('全量'),
        value: 'Full',
    },
    {
        key: 'Increment',
        label: __('增量'),
        value: 'Increment',
    },
]
/** 同步频率 */
export const SyncFrequency = [
    {
        key: 'PerMinute',
        label: __('每分钟'),
        value: 'PerMinute',
    },
    {
        key: 'PerHour',
        label: __('每小时'),
        value: 'PerHour',
    },
    {
        key: 'PerDay',
        label: __('每天'),
        value: 'PerDay',
    },
    {
        key: 'PerWeek',
        label: __('每周'),
        value: 'PerWeek',
    },
    {
        key: 'PerMonth',
        label: __('每月'),
        value: 'PerMonth',
    },
    {
        key: 'PerYear',
        label: __('每年'),
        value: 'PerYear',
    },
]
