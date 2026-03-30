import { IformItem, SearchType } from '@/ui/LightweightSearch/const'
import __ from './locale'

export enum OperateType {
    CANCEL = 'cancle',
    DOWNLOAD = 'download',
    DELETE = 'delete',
}

export enum stateType {
    queuing = 'queuing',
    executing = 'executing',
    finished = 'finished',
    failed = 'failed',
}
export const statusList = [
    {
        label: __('排队中'),
        value: stateType.queuing,
        bgColor: '#FAAD14',
    },
    {
        label: __('数据准备中'),
        value: stateType.executing,
        bgColor: '#3A8FF0',
    },
    {
        label: __('可下载'),
        value: stateType.finished,
        bgColor: '#52C41B',
    },
    {
        label: __('异常'),
        value: stateType.failed,
        bgColor: '#E60012',
    },
]
export const searchData: IformItem[] = [
    {
        label: __('状态'),
        key: 'status',
        options: [{ value: '', label: __('不限') }, ...statusList],
        type: SearchType.Radio,
    },
]
export const errorStatusDesc = {
    'VirtualizationEngine.TableFieldError.': __(
        '库表字段信息变更，请联系管理员重新发布',
    ),
    'VirtualizationEngine.TableNotExist.':
        __('库表源表变更，请联系管理员重新扫描'),
    'VirtualizationEngine.SchemaNotExist.': __(
        '库表源表的数据库变更，请联系管理员重新扫描',
    ),
    other: __('系统内部错误，请联系管理员'),
}

export const isJsonString = (str) => {
    try {
        // 尝试解析字符串
        JSON.parse(str)
        return true // 解析成功，返回true
    } catch (e) {
        // 如果解析失败，返回false
        return false
    }
}
