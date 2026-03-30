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

export const AuditOptionsLabel = [
    {
        key: 'auditing',
        label: __('审核中'),
        value: 'auditing',
    },
    {
        key: 'undo',
        label: __('待提交'),
        value: 'undo',
    },
    {
        key: 'reject',
        label: __('审核未通过'),
        value: 'reject',
    },
]

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

export const getStateSelect = (state: string) => {
    return StatusOptions.filter((o) => o.relative.includes(state)).map((o) => ({
        ...o,
        label: getOptionState(o.value, StatusOptions),
    }))
}

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
        label: __('计划日期'),
        key: 'date_range',
        type: ST.RangePicker,
        options: [],
    },
]

export const convertToPlain = (html) => {
    const divElement = document.createElement('div')
    divElement.innerHTML = html
    return divElement.textContent || divElement.innerText || ''
}
