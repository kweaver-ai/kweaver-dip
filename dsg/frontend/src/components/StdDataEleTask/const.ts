import { TaskStatus } from '@/core'
import { IformItem, SearchType } from '@/ui/LightweightSearch/const'
import __ from './locale'

/**
 * 标准任务类型
 * @param TOBEEXECUTE 待执行
 * @param FINISHED 已完成
 */
export const enum StdTaskType {
    TOBEEXECUTE = 'toBeExecute',
    COMPLETED = 'completed',
}

// 标准数据元-数据类型
export enum DataType {
    TNUMBER = 'number',
    TCHAR = 'char',
    TDATE = 'date',
    TDATETIME = 'datetime',
    TTIMESTAMP = 'timestamp',
    TBOOLEAN = 'bool',
    TBINARY = 'binary',
}

export const stdDataTypeList = [
    {
        value: DataType.TNUMBER,
        label: '数字型',
    },
    {
        value: DataType.TCHAR,
        label: '字符型',
    },
    {
        value: DataType.TDATE,
        label: '日期型',
    },
    {
        value: DataType.TDATETIME,
        label: '日期时间型',
    },
    {
        value: DataType.TTIMESTAMP,
        label: '时间戳型',
    },
    {
        value: DataType.TBOOLEAN,
        label: '布尔型',
    },
    {
        value: DataType.TBINARY,
        label: '二进制型',
    },
]

// 新建标准任务，字段状态
export enum FieldState {
    NOLIMIT = 0,
    DONE = 1,
    UNDONE = 2,
}

export const stdTaskStatusList = [
    {
        label: __('不限'),
        value: FieldState.NOLIMIT,
    },
    {
        value: FieldState.DONE,
        label: __('已完成'),
    },
    {
        value: FieldState.UNDONE,
        label: __('未完成'),
    },
]

// 待新建标准过滤项
export const stdTaskSearchData: IformItem[] = [
    {
        label: __('状态'),
        key: 'state',
        options: stdTaskStatusList,
        type: SearchType.Radio,
    },
]
