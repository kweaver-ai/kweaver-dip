import moment from 'moment'
import { OrderType } from '../helper'
import __ from './locale'

export const textRender = (text: string) => {
    return <div>{text ?? '--'}</div>
}

export const DateRender = (time: number | string, showTime = false) => {
    const formatStr = showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD'
    let date
    switch (typeof time) {
        case 'number':
            date = time * 1000
            break
        case 'string':
            date = time
            break
        default:
            break
    }
    return date ? moment(date).format(formatStr) : '--'
}

export const OptionRender = (
    value: any,
    arr: { label: string; value: any; key?: string }[],
    callFunc?: any,
) => {
    if (callFunc) {
        return callFunc(value, arr)
    }
    return arr?.find((o) => o?.value === value)?.label ?? '--'
}

export const LinkRender = (text: string, onClick?: any) => {
    return text ? (
        <a
            onClick={(e) => {
                e.preventDefault()
                onClick?.()
            }}
        >
            {text}
        </a>
    ) : (
        '--'
    )
}

/** 工单属性合集 */
export const WorkOrderAttrs = [
    {
        key: 'name',
        label: __('工单名称'),
        value: 'name',
        render: textRender,
    },
    {
        key: 'type',
        label: __('工单类型'),
        value: 'type',
        render: OptionRender,
    },
    {
        key: 'responsible_uname',
        label: __('责任人'),
        value: 'responsible_uname',
        render: textRender,
    },
    {
        key: 'priority',
        label: __('优先级'),
        value: 'priority',
        render: OptionRender,
    },
    {
        key: 'finished_at',
        label: __('截止日期'),
        value: 'finished_at',
        render: DateRender,
    },
    {
        key: 'source_name',
        label: __('来源计划'),
        value: 'source_name',
        render: LinkRender,
    },
    {
        key: 'aggregation_source_name',
        label: __('来源计划'),
        value: 'source_name',
        render: LinkRender,
    },
    {
        key: 'comprehension_source_name',
        label: __('来源计划'),
        value: 'source_name',
        render: LinkRender,
    },
    {
        key: 'status',
        label: __('工单状态'),
        value: 'status',
        render: OptionRender,
    },
    {
        key: 'updated_at',
        label: __('完成时间'),
        value: 'updated_at',
        render: DateRender,
    },
    {
        key: 'description',
        label: __('工单说明'),
        value: 'description',
        render: textRender,
    },
    {
        key: 'remark',
        label: __('备注'),
        value: 'remark',
        render: textRender,
    },
    {
        key: 'processing_instructions',
        label: __('处理说明'),
        value: 'processing_instructions',
        render: textRender,
    },
    {
        key: 'created_by',
        label: __('创建人'),
        value: 'created_by',
        render: textRender,
    },
    {
        key: 'created_at',
        label: __('创建时间'),
        value: 'created_at',
        render: DateRender,
    },
    {
        key: 'updated_by',
        label: __('更新人'),
        value: 'updated_by',
        render: textRender,
    },
    {
        key: 'updated_at',
        label: __('更新时间'),
        value: 'updated_at',
        render: DateRender,
    },
]

export type IRenderKeys = { key: string; label: string; childKeys: string[] }

// 理解属性
const ComprehensionKeys: IRenderKeys[] = [
    {
        key: 'baseInfo',
        label: __('基本信息'),
        childKeys: [
            'name',
            'type',
            'responsible_uname',
            'priority',
            'finished_at',
            'comprehension_source_name',
            'status',
            'updated_at',
            'description',
            'remark',
        ],
    },
    {
        key: 'moreInfo',
        label: __('更多信息'),
        childKeys: ['created_by', 'created_at', 'updated_by', 'updated_at'],
    },
]

// 归集属性
const AggregationKeys: IRenderKeys[] = [
    {
        key: 'baseInfo',
        label: __('基本信息'),
        childKeys: [
            'name',
            'type',
            'responsible_uname',
            'priority',
            'finished_at',
            'aggregation_source_name',
            'status',
            'updated_at',
            'description',
            'remark',
        ],
    },
    {
        key: 'moreInfo',
        label: __('更多信息'),
        childKeys: ['created_by', 'created_at', 'updated_by', 'updated_at'],
    },
]

/** 属性映射 */
export const TypeAttrsMap = {
    /** 理解工单 */
    [OrderType.COMPREHENSION]: ComprehensionKeys,
    /** 归集工单 */
    [OrderType.AGGREGATION]: AggregationKeys,
}

/** 工单内容渲染 */
export const ContentRender = (data: any, keys: string[]) => {
    const attrs = WorkOrderAttrs.filter((o) => keys?.includes(o?.key))

    return attrs.map((o) => ({
        ...o,
        content: o?.render(data?.[o?.value], data),
    }))
}
