import { SortDirection } from '@/core'
import __ from './locale'
import { OrderType } from '../helper'
import { IformItem, SearchType as ST } from '@/ui/LightweightSearch/const'

// 工单类型选项
export const TicketTypeOptions = [
    {
        key: OrderType.AGGREGATION,
        label: __('数据归集工单'),
        value: OrderType.AGGREGATION,
    },
    {
        key: OrderType.STANDARD,
        label: __('标准化工单'),
        value: OrderType.STANDARD,
    },
    {
        key: OrderType.QUALITY_EXAMINE,
        label: __('质量检测工单'),
        value: OrderType.QUALITY_EXAMINE,
    },
    {
        key: OrderType.FUNSION,
        label: __('数据融合工单'),
        value: OrderType.FUNSION,
    },
]

export const StatusOptions = [
    {
        label: __('启用中'),
        value: true,
    },
    {
        label: __('未启用'),
        value: false,
    },
]

/** 不限 */
const NotLimit = {
    label: __('不限'),
    value: undefined,
}

/** 搜索筛选项 */
export const SearchFilter: IformItem[] = [
    {
        label: __('类型'),
        key: 'ticket_type',
        type: ST.MultipleSelect,
        options: TicketTypeOptions,
    },
    {
        label: __('状态'),
        key: 'status',
        type: ST.Radio,
        options: [NotLimit, ...StatusOptions],
    },
]
