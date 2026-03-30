import __ from './locale'

export enum OperateType {
    EDIT = 'edit',
    DETAIL = 'detail',
}

export interface IDetailConfig {
    label: string
    name: string
    col?: number
}

// 任务详情-基本信息
export const taskBasicInfo: IDetailConfig[] = [
    {
        label: __('业务表名称：'),
        name: 'table',
        col: 24,
    },
    {
        label: __('任务编号：'),
        name: 'task_no',
        col: 12,
    },
    {
        label: __('创建用户：'),
        name: 'create_user',
        col: 12,
    },
    {
        label: __('创建时间：'),
        name: 'create_time',
        col: 12,
    },
    {
        label: __('操作用户：'),
        name: 'update_user',
        col: 12,
    },
    {
        label: __('更新时间：'),
        name: 'update_time',
        col: 12,
    },
    {
        label: __('业务表描述：'),
        name: 'table_description',
        col: 24,
    },
]
export const isBlankList = (list: any) => {
    if (!list || (list && list.length === 0)) {
        return true
    }
    return false
}

// 处理任务-基本信息
export const handleTaskBasicInfo: IDetailConfig[] = [
    {
        label: __('业务表名称：'),
        name: 'table',
        col: 24,
    },
    {
        label: __('任务编号：'),
        name: 'task_no',
        col: 12,
    },
    {
        label: __('创建用户：'),
        name: 'create_user',
        col: 12,
    },

    {
        label: __('创建时间：'),
        name: 'create_time',
        col: 12,
    },
    {
        label: __('完成度：'),
        name: 'progress',
        col: 12,
    },
    {
        label: __('业务表描述：'),
        name: 'table_description',
        col: 24,
    },
]

export enum BusinessFieldStatus {
    ALL = 0, // 全部
    FINISH = 1, // 已完成
    UNFINISH = 2, // 未完成
}
