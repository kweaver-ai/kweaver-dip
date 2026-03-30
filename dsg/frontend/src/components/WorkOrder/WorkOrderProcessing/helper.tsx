import { SortDirection } from '@/core'
import { IformItem, SearchType as ST } from '@/ui/LightweightSearch/const'
import {
    AllShowOrderType,
    CommonOrderStatusOptions,
    OrderStatusOptions,
    OrderTypeOptions,
    PriorityOptions,
    StatusType,
} from '../helper'
import __ from './locale'

export const TodoSearchCondition: any = {
    offset: 1,
    limit: 10,
    keyword: '',
    direction: SortDirection.DESC,
    sort: 'acceptance_at',
    status: 'Unassigned,Ongoing',
}
export const CompleteSearchCondition: any = {
    offset: 1,
    limit: 10,
    keyword: '',
    direction: SortDirection.DESC,
    sort: 'updated_at',
    status: 'Completed',
}

export const TodoMenu = [
    {
        key: 'created_at',
        sort: SortDirection.DESC,
        label: __('按创建时间排序'),
    },
]

export const CompleteMenu = [
    {
        key: 'updated_at',
        sort: SortDirection.DESC,
        label: __('按处理完成时间排序'),
    },
    {
        key: 'created_at',
        sort: SortDirection.DESC,
        label: __('按创建时间排序'),
    },
]

export const QualityTodoMenu = [
    {
        key: 'process_at',
        sort: SortDirection.DESC,
        label: __('按开始处理时间排序'),
    },
]
export const QualityCompleteMenu = [
    {
        key: 'updated_at',
        sort: SortDirection.DESC,
        label: __('按处理完成时间排序'),
    },
    {
        key: 'process_at',
        sort: SortDirection.DESC,
        label: __('按开始处理时间排序'),
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
        label: __('类型'),
        key: 'type',
        type: ST.Radio,
        options: [
            NotLimit,
            ...OrderTypeOptions.filter((o) =>
                AllShowOrderType.includes(o?.value),
            ),
        ],
    },
    {
        label: __('工单状态'),
        key: 'status',
        type: ST.Radio,
        options: [
            { ...NotLimit, value: 'Unassigned,Ongoing' },
            ...OrderStatusOptions.filter((o) =>
                [StatusType.UNASSIGENED, StatusType.ONGOING].includes(o.key),
            ),
        ],
    },
]

/** 质量报告搜索筛选项 */
export const QualitySearchFilter: IformItem[] = [
    {
        label: __('工单状态'),
        key: 'status',
        type: ST.Radio,
        options: [
            { ...NotLimit, value: 'Unassigned,Ongoing' },
            ...CommonOrderStatusOptions.filter((o) =>
                [StatusType.UNASSIGENED, StatusType.ONGOING].includes(o.key),
            ),
        ],
    },
    {
        label: __('优先级'),
        key: 'priority',
        type: ST.Radio,
        options: [NotLimit, ...PriorityOptions],
    },
]

export const getDepartName = (name: string) => {
    let path = name
    if (path?.endsWith('/')) {
        path = path?.slice(0, -1)
    }
    return path?.slice((path?.lastIndexOf('/') ?? 0) + 1)
}
