import { SearchType } from '@/components/SearchLayout/const'
import { SortDirection } from '@/core'
import { IformItem, SearchType as ST } from '@/ui/LightweightSearch/const'
import __ from './locale'

export const initSearchCondition: any = {
    offset: 1,
    limit: 10,
    keyword: '',
    direction: SortDirection.DESC,
    sort: 'updated_at',
}

export const DefaultMenu = {
    key: 'updated_at',
    sort: SortDirection.DESC,
    label: __('按更新时间排序'),
}

export const AuditOptions = [
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
        label: __('未通过'),
        value: 'reject',
    },
    {
        key: 'pass',
        label: __('已通过'),
        value: 'pass',
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

/** 搜索筛选项 */
export const SearchFilter: IformItem[] = [
    {
        label: __('更新时间'),
        key: 'date_range',
        type: ST.RangePicker,
        options: [],
    },
]
