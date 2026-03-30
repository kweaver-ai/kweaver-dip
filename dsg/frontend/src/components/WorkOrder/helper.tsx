import { WorkOrderStatus } from '@/core'
import { PolicyType } from '../AuditPolicy/const'
import __ from './locale'

/** 工单类型 */
export enum OrderType {
    /** 理解工单 */
    COMPREHENSION = 'data_comprehension',
    /** 归集工单 */
    AGGREGATION = 'data_aggregation',
    /** 标准化工单 */
    STANDARD = 'data_standardization',
    /** 质量整改 */
    QUALITY = 'data_quality',
    /** 质量检测工单 */
    QUALITY_EXAMINE = 'data_quality_audit',
    /** 数据融合工单 */
    FUNSION = 'data_fusion',
    /** 调研工单 */
    RESEARCH_REPORT = 'research_report',
    /** 资源编目工单 */
    DATA_CATALOG = 'data_catalog',
    /** 前置机申请工单 */
    FRONT_PROCESSORS = 'front_end_processors',
}

/** 所有展示的工单类型 */
export const AllShowOrderType = [
    OrderType.COMPREHENSION,
    OrderType.AGGREGATION,
    OrderType.STANDARD,
    // OrderType.QUALITY, // 质量整改不展示
    OrderType.QUALITY_EXAMINE,
    OrderType.FUNSION,
    OrderType.RESEARCH_REPORT,
    OrderType.DATA_CATALOG,
    OrderType.FRONT_PROCESSORS,
]

// 工单-策略映射
export const OrderPolicyMap = {
    [OrderType.COMPREHENSION]: PolicyType.WorkOrderUnderstanding,
    [OrderType.AGGREGATION]: PolicyType.WorkOrderCollection,
    [OrderType.STANDARD]: PolicyType.WorkOrderStandard,
    [OrderType.QUALITY]: PolicyType.WorkOrderQuality,
    [OrderType.QUALITY_EXAMINE]: PolicyType.WorkOrderQualityExamine,
    [OrderType.FUNSION]: PolicyType.WorkOrderFusion,
    [OrderType.RESEARCH_REPORT]: PolicyType.WorkOrderResearch,
    [OrderType.DATA_CATALOG]: PolicyType.WorkOrderDataCatalog,
    [OrderType.FRONT_PROCESSORS]: PolicyType.WorkOrderFrontProcessors,
}

/** 工单类型 */
export const OrderTypeOptions = [
    {
        key: OrderType.AGGREGATION,
        label: __('数据归集'),
        value: OrderType.AGGREGATION,
    },
    {
        key: OrderType.STANDARD,
        label: __('标准化'),
        value: OrderType.STANDARD,
    },
    {
        key: OrderType.QUALITY,
        label: __('数据质量'),
        value: OrderType.QUALITY,
    },
    {
        key: OrderType.QUALITY_EXAMINE,
        label: __('质量检测'),
        value: OrderType.QUALITY_EXAMINE,
    },
    {
        key: OrderType.FUNSION,
        label: __('数据融合'),
        value: OrderType.FUNSION,
    },
    {
        key: OrderType.COMPREHENSION,
        label: __('数据理解'),
        value: OrderType.COMPREHENSION,
    },
    {
        key: OrderType.RESEARCH_REPORT,
        label: __('调研'),
        value: OrderType.RESEARCH_REPORT,
    },
    {
        key: OrderType.DATA_CATALOG,
        label: __('资源编目'),
        value: OrderType.DATA_CATALOG,
    },
    {
        key: OrderType.FRONT_PROCESSORS,
        label: __('前置机申请'),
        value: OrderType.FRONT_PROCESSORS,
    },
]

/** 数据状态类型 */
export enum StatusType {
    /** 未派发 */
    UNASSIGENED = 'Unassigned',
    /** 进行中 */
    ONGOING = 'Ongoing',
    /** 已完成 */
    COMPLETED = 'Completed',
}

/** 未开始 工单状态 */
export const CommonOrderStatusOptions = [
    {
        key: StatusType.UNASSIGENED,
        label: __('未开始'),
        value: StatusType.UNASSIGENED,
        color: 'rgba(0, 0, 0, 0.30)',
        isCircle: true,
    },
    {
        key: StatusType.ONGOING,
        label: __('进行中'),
        value: StatusType.ONGOING,
        color: 'rgba(47, 155, 255, 1)',
        isCircle: true,
    },
    {
        key: StatusType.COMPLETED,
        label: __('已完成'),
        value: StatusType.COMPLETED,
        color: 'rgba(82, 196, 27, 1)',
        isCircle: true,
    },
]

/** 未派发 工单状态 */
export const OrderStatusOptions = [
    {
        key: StatusType.UNASSIGENED,
        label: __('未派发'),
        value: StatusType.UNASSIGENED,
        color: 'rgba(0, 0, 0, 0.30)',
        isCircle: true,
    },
    {
        key: StatusType.ONGOING,
        label: __('进行中'),
        value: StatusType.ONGOING,
        color: 'rgba(47, 155, 255, 1)',
        isCircle: true,
    },
    {
        key: StatusType.COMPLETED,
        label: __('已完成'),
        value: StatusType.COMPLETED,
        color: 'rgba(82, 196, 27, 1)',
        isCircle: true,
    },
]

/** 审核状态类型 */
export enum AuditType {
    /** 审核中 */
    AUDITING = 'auditing',
    /** 已撤回 */
    UNDONE = 'undone',
    /** 未通过 */
    REJECT = 'reject',
    /** 已通过 */
    PASS = 'pass',
}

/** 工单审核状态 */
export const OrderAuditOptions = [
    {
        key: AuditType.AUDITING,
        label: __('审核中'),
        value: AuditType.AUDITING,
    },
    {
        key: AuditType.UNDONE,
        label: __('已撤回'),
        value: AuditType.UNDONE,
    },
    {
        key: AuditType.REJECT,
        label: __('未通过'),
        value: AuditType.REJECT,
    },
    {
        key: AuditType.PASS,
        label: __('已通过'),
        value: AuditType.PASS,
    },
]

export const OrderAuditOptionsLabel = [
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
        dotStyle = {},
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
                    ...dotStyle,
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

export const InitPriorityOption = {
    label: getOptionState(PriorityType.COMMON, PriorityOptions),
    value: PriorityType.COMMON,
}

/**
 * 任务状态信息
 */
export const orderTaskStatusList = [
    {
        value: WorkOrderStatus.Running,
        label: __('进行中'),
        color: '#2F9BFF',
        isCircle: true,
        dotStyle: {
            width: '8px',
            height: '8px',
        },
    },
    {
        value: WorkOrderStatus.Failed,
        label: __('异常'),
        color: '#F5222D',
        isCircle: true,
        dotStyle: {
            width: '8px',
            height: '8px',
        },
    },
    {
        value: WorkOrderStatus.Completed,
        label: __('已完成'),
        color: '#52C41B',
        isCircle: true,
        dotStyle: {
            width: '8px',
            height: '8px',
        },
    },
]

export const sourceTypeMap = {}
