import { InfoCircleOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import { SortDirection } from '@/core'
import { SearchType } from '@/components/SearchLayout/const'
import { IformItem, SearchType as ST } from '@/ui/LightweightSearch/const'
import __ from './locale'
import {
    AllShowOrderType,
    AuditType,
    CommonOrderStatusOptions,
    OrderStatusOptions,
    OrderTypeOptions,
    PriorityOptions,
} from '../helper'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'

export const initSearchCondition: any = {
    offset: 1,
    limit: 10,
    keyword: '',
    direction: SortDirection.DESC,
    sort: 'created_at',
}

export const DefaultMenu: any = {
    key: 'created_at',
    sort: SortDirection.DESC,
    label: __('按创建时间排序'),
}

export const getOptionState = (key: string, data?: any[], tip?: string) => {
    const {
        label,
        color = '#d8d8d8',
        isCircle,
    } = (data || []).find((item) => item.value === key) || {}
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
            {tip && (
                <Tooltip title={tip}>
                    <FontIcon
                        name="icon-xinxitishi"
                        type={IconType.FONTICON}
                        style={{
                            fontSize: '12px',
                            cursor: 'pointer',
                            color: '#1890ff',
                        }}
                    />
                </Tooltip>
            )}
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
        label: __('状态'),
        key: 'status',
        type: ST.Radio,
        options: [NotLimit, ...OrderStatusOptions],
    },
    {
        label: __('创建时间'),
        key: 'created_at',
        type: ST.RangePicker,
        options: [],
    },
]

/** 质量报告搜索筛选项 */
export const QualitySearchFilter: IformItem[] = [
    {
        label: __('状态'),
        key: 'status',
        type: ST.Radio,
        options: [NotLimit, ...CommonOrderStatusOptions],
    },

    {
        label: __('优先级'),
        key: 'priority',
        type: ST.Radio,
        options: [NotLimit, ...PriorityOptions],
    },
]

export const AuditOptions = [
    {
        key: AuditType.AUDITING,
        label: __('审核中'),
        value: AuditType.AUDITING,
    },
    {
        key: AuditType.UNDONE,
        label: __('待提交'),
        value: AuditType.UNDONE,
    },
    {
        key: AuditType.REJECT,
        label: __('审核未通过'),
        value: AuditType.REJECT,
    },
    {
        key: AuditType.PASS,
        label: __('已通过'),
        value: AuditType.PASS,
    },
]

export const SourceTypeEnum = {
    /** 计划 */
    PLAN: 'plan',
    /** 业务表单 */
    BUSINESS_FORM: 'business_form',
    /** 无,独立 */
    STANDALONE: 'standalone',
    /** 数据分析 */
    DATA_ANALYSIS: 'data_analysis',
    /** 库表 */
    FORM_VIEW: 'form_view',
    /** 归集工单 */
    AGGREGATION_WORK_ORDER: 'aggregation_work_order',
    /** 供需申请 */
    SUPPLY_AND_DEMAND: 'supply_and_demand',
    /** 项目 */
    PROJECT: 'project',
}

export const SourceTypeMap = {
    [SourceTypeEnum.PLAN]: {
        icon: 'icon-jihua',
        label: __('来源计划'),
    },
    [SourceTypeEnum.BUSINESS_FORM]: {
        icon: 'icon-yewubiao1',
        label: __('来源业务单'),
    },
    [SourceTypeEnum.STANDALONE]: {
        icon: undefined,
        label: undefined,
    },
    [SourceTypeEnum.DATA_ANALYSIS]: {
        icon: 'icon-shujufenxixuqiu',
        label: __('来源数据分析'),
    },
    [SourceTypeEnum.FORM_VIEW]: {
        icon: 'icon-shujubiaoshitu',
        label: __('来源库表'),
    },
    [SourceTypeEnum.AGGREGATION_WORK_ORDER]: {
        icon: 'icon-gongdan',
        label: __('来源归集工单'),
    },
    [SourceTypeEnum.SUPPLY_AND_DEMAND]: {
        icon: 'icon-gongxuduijie',
        label: __('来源供需申请'),
    },
    [SourceTypeEnum.PROJECT]: {
        icon: 'icon-xiangmu',
        label: __('来源项目'),
    },
}
