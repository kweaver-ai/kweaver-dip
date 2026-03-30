import { SortDirection, TaskPriority, TaskStatus, TaskType } from '@/core'
import __ from './locale'

/**
 * 我的任务分类
 * @param PROCESSED 我执行的
 * @param CREATED 我创建的
 */
export enum MyTaskType {
    PROCESSED = 'processed',
    CREATED = 'created',
}

/**
 * 是否逾期
 * @param OVERDUE 是
 * @param DUE 否
 */
export enum Overdue {
    OVERDUE = 'overdue',
    DUE = 'due',
}

/**
 * 排序方式
 * @param CREATED 'created_at' 按创建时间排序
 * @param UPDATED 'updated_at' 按更新时间排序
 * @param DEFAULT 'default' 按默认排序
 */
export enum SortType {
    // CREATED = 'created_at',
    UPDATED = 'updated_at',
    DEFAULT = 'default',
}

/**
 * 默认排序表单
 */
export const defaultMenu = {
    key: SortType.DEFAULT,
}

/**
 * 排序菜单
 */
export const menus = [
    // { key: SortType.CREATED, label: __('按创建时间') },
    { key: SortType.DEFAULT, label: __('默认排序'), sort: SortDirection.NONE },
    {
        key: SortType.UPDATED,
        label: __('按更新时间排序'),
    },
]

/**
 * 默认任务状态筛选项
 */
export const defaultStatusList = [
    TaskStatus.READY,
    TaskStatus.ONGOING,
    TaskStatus.COMPLETED,
]

/**
 * 任务状态信息
 */
export const statusInfos = [
    {
        value: TaskStatus.READY,
        label: __('未开始'),
        color: 'rgba(0, 0, 0, 0.85)',
        backgroundColor: 'rgba(0,0,0,0.04)',
        num: 0,
    },
    {
        value: TaskStatus.ONGOING,
        label: __('进行中'),
        color: 'rgba(18, 110, 227, 1)',
        backgroundColor: 'rgba(18, 110, 227, 0.06)',
        num: 1,
    },
    {
        value: TaskStatus.COMPLETED,
        label: __('已完成'),
        color: 'rgba(82, 196, 26, 1)',
        backgroundColor: 'rgba(82, 196, 26, 0.06)',
        num: 2,
    },
]

/**
 * 默认任务优先级筛选项
 */
export const defaultPriorityList = [
    TaskPriority.URGENT,
    TaskPriority.EMERGENT,
    TaskPriority.COMMON,
]

/**
 * 默认任务逾期筛选项
 */
export const defaultDeadlineList = [Overdue.OVERDUE, Overdue.DUE]

/**
 * 任务逾期信息
 */
export const deadlineInfos = [
    { value: Overdue.OVERDUE, label: __('是') },
    { value: Overdue.DUE, label: __('否') },
]

/** 工单任务相关 */
export const WorkOrderTypes = [
    TaskType.DATACOMPREHENSIONWWORKORDER, // 理解工单任务
    TaskType.RESEARCHREPORTWWORKORDER, // 调研工单任务
    TaskType.DATACATALOGWWORKORDER, // 资源编目工单任务
    TaskType.FRONTPROCESSORSWWORKORDER, // 前置机申请工单任务
]
