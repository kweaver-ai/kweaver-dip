import { SearchType } from '@/components/SearchLayout/const'
import { SortDirection } from '@/core'
import { IformItem, SearchType as ST } from '@/ui/LightweightSearch/const'
import __ from './locale'

export const initSearchCondition: any = {
    offset: 1,
    limit: 10,
    keyword: '',
    direction: SortDirection.DESC,
    updated_at_end: 'created_at',
}

export const DefaultMenu = {
    key: 'created_at',
    sort: SortDirection.DESC,
    label: __('按创建时间排序'),
}

export const AuditOptions = [
    {
        key: 'auditing',
        label: __('审核中'),
        value: 'auditing',
    },
    {
        key: 'undo',
        label: __('已撤回'),
        value: 'undo',
    },
    {
        key: 'reject',
        label: __('未通过'),
        value: 'reject',
    },
    {
        key: 'pass',
        label: __('已通过'),
        value: 'pass',
    },
]

export const StatusOptions = [
    {
        key: 'not_started',
        label: __('未开始'),
        value: 'not_started',
        color: 'rgba(0, 0, 0, 0.30)',
        isCircle: true,
        relative: 'not_started',
    },
    {
        key: 'ongoing',
        label: __('进行中'),
        value: 'ongoing',
        color: 'rgba(47, 155, 255, 1)',
        isCircle: true,
        relative: 'not_started,ongoing',
    },
    {
        key: 'finished',
        label: __('已完成'),
        value: 'finished',
        color: 'rgba(82, 196, 27, 1)',
        isCircle: true,
        relative: 'ongoing',
    },
]

/** 优先级类型 */
export enum PriorityType {
    /** 普通 */
    COMMON = 'common',
    /** 紧急 */
    EMERGENT = 'emergent',
    /** 非常紧急 */
    URGENT = 'urgent',
}

export const PriorityOptions = [
    {
        key: PriorityType.COMMON,
        label: __('普通'),
        value: PriorityType.COMMON,
        color: 'rgba(52, 97, 236, 0.75)',
    },
    {
        key: PriorityType.EMERGENT,
        label: __('紧急'),
        value: PriorityType.EMERGENT,
        color: 'rgba(250, 173, 20, 1)',
    },
    {
        key: PriorityType.URGENT,
        label: __('非常紧急'),
        value: PriorityType.URGENT,
        color: 'rgba(245, 34, 45, 1)',
    },
]

export const getOptionState = (key: string, data?: any[]) => {
    const list = data || []
    const {
        label,
        color = '#d8d8d8',
        isCircle,
    } = list.find((item) => item.value === key) || {}
    return label ? (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                columnGap: '8px',
            }}
        >
            <span
                style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    borderRadius: isCircle ? '50%' : '2px',
                    background: color,
                }}
            />
            {label}
        </span>
    ) : (
        '--'
    )
}

export const SelectPriorityOptions = PriorityOptions.map((o) => ({
    key: o.key,
    label: getOptionState(o.value, PriorityOptions),
    value: o.value,
}))

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
    {
        label: __('优先级'),
        key: 'priority',
        type: ST.Radio,
        options: [NotLimit, ...PriorityOptions],
    },
    {
        label: __('计划日期'),
        key: 'date_range',
        type: ST.RangePicker,
        options: [],
    },
]
