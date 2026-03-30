import { OrderType } from '../WorkOrder/helper'
import styles from './styles.module.less'
import __ from './locale'

const StatusDom = {
    ready: <div className={styles.taskStartStatus}>未开启</div>,
    ongoing: (
        <div
            className={styles.taskStartStatus}
            style={{
                color: '#126EE3',
                background: 'rgba(18,110,227,0.06)',
            }}
        >
            进行中
        </div>
    ),
    completed: (
        <div
            className={styles.taskStartStatus}
            style={{
                color: 'rgba(82,196,26,0.5)',
                background: 'rgba(82,196,26,0.06)',
            }}
        >
            已完成
        </div>
    ),
    overdue: (
        <div
            className={styles.taskStartStatus}
            style={{
                color: 'rgba(245,34,45,0.5)',
                background: 'rgba(245,34,45,0.06)',
            }}
        >
            已逾期
        </div>
    ),
}
const StatusItems = [
    {
        key: 'ready',
        label: StatusDom.ready,
    },
    {
        key: 'ongoing',
        label: StatusDom.ongoing,
    },
    {
        key: 'completed',
        label: StatusDom.completed,
    },
    {
        key: 'overdue',
        label: StatusDom.overdue,
    },
]

const PriorityDom = {
    common: (
        <div
            className={styles.taskPriority}
            style={{
                color: '#126EE3',
                border: '1px solid rgba(18,110,227,0.8)',
            }}
        >
            普通
        </div>
    ),
    emergent: (
        <div
            className={styles.taskPriority}
            style={{
                color: '#FAAD14',
                border: '1px solid rgba(250,173,20,0.8)',
            }}
        >
            紧急
        </div>
    ),
    urgent: (
        <div
            className={styles.taskPriority}
            style={{
                color: '#F5222D',
                border: '1px solid rgba(245,34,45,0.8)',
            }}
        >
            非常紧急
        </div>
    ),
}
const PriorityItems = [
    {
        key: 'common',
        label: PriorityDom.common,
    },
    {
        key: 'emergent',
        label: PriorityDom.emergent,
    },
    {
        key: 'urgent',
        label: PriorityDom.urgent,
    },
]

/**
 * 获取下拉框状态
 * @status 当前状态
 * @return 下拉列表内容
 */
const getStatusItems = (status: string) => {
    switch (true) {
        case status === 'ready':
            return [
                { key: 'ready', label: StatusDom.ready },
                { key: 'ongoing', label: StatusDom.ongoing },
            ]
        case status === 'ongoing':
            return [
                { key: 'ongoing', label: StatusDom.ongoing },
                { key: 'completed', label: StatusDom.completed },
            ]
        default:
            return [{ key: 'completed', label: StatusDom.completed }]
    }
}

/** 项目管理工单类型 */
export const OrderTypeOptions = [
    {
        key: OrderType.AGGREGATION,
        label: __('数据归集'),
        value: OrderType.AGGREGATION,
        isWorkOrder: true,
    },
    {
        key: OrderType.COMPREHENSION,
        label: __('数据理解'),
        value: OrderType.COMPREHENSION,
        isWorkOrder: true,
    },
    {
        key: OrderType.STANDARD,
        label: __('数据标准化'),
        value: OrderType.STANDARD,
        isWorkOrder: true,
    },
    {
        key: OrderType.QUALITY_EXAMINE,
        label: __('数据质量检测'),
        value: OrderType.QUALITY_EXAMINE,
        isWorkOrder: true,
    },
    {
        key: OrderType.FUNSION,
        label: __('数据融合'),
        value: OrderType.FUNSION,
        isWorkOrder: true,
    },
]

export enum WorkOrderStatusEnum {
    READY = 'ready',
    ONGOING = 'ongoing',
    COMPLETED = 'completed',
}

export const WorkOrderStatus = {
    [WorkOrderStatusEnum.READY]: (
        <div className={styles.taskStartStatus}>未派发</div>
    ),
    [WorkOrderStatusEnum.ONGOING]: (
        <div
            className={styles.taskStartStatus}
            style={{
                color: '#126EE3',
                background: 'rgba(18,110,227,0.06)',
            }}
        >
            进行中
        </div>
    ),
    [WorkOrderStatusEnum.COMPLETED]: (
        <div
            className={styles.taskStartStatus}
            style={{
                color: 'rgba(82,196,26,0.5)',
                background: 'hsla(100, 76.60%, 43.50%, 0.06)',
            }}
        >
            已完成
        </div>
    ),
}

export { StatusItems, StatusDom, PriorityDom, PriorityItems, getStatusItems }
