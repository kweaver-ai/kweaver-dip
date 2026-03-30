import { SortDirection, SortType, TaskType } from '@/core'
import __ from './locale'

const menus = [
    { key: 'name', label: __('按名称排序') },
    { key: SortType.CREATED, label: __('按创建时间排序') },
    { key: SortType.UPDATED, label: __('按更新时间排序') },
]

/**
 * 内容显示模式
 * @VIEW 查看
 * @EDIT 编辑
 */
enum ViewMode {
    // 存在编辑按钮
    VIEW = 'view',
    EDIT = 'edit',
    // 无编辑按钮预览
    ONLY_VIEW = 'only_view',
}

const DimensionModule = [
    {
        label: __('星型模式'),
        value: 0,
        key: 0,
    },
]

const defaultMenu = {
    key: SortType.UPDATED,
    sort: SortDirection.DESC,
}

// 0:数字型 1:字符型 2:日期型 3:日期时间型 4:时间戳型 5:布尔型 6:二进制
const FormatType = {
    '0': 'number',
    '1': 'string',
    '2': 'date',
    '3': 'datetime',
    '4': 'timestamp',
    '5': 'boolean',
    '6': 'binary',
}
const FormatTypeTXT = {
    '0': '数字型',
    '1': '字符型',
    '2': '日期型',
    '3': '日期时间型',
    '4': '时间戳型',
    '5': '布尔型',
    '6': '二进制',
}

export {
    menus,
    ViewMode,
    defaultMenu,
    FormatType,
    FormatTypeTXT,
    DimensionModule,
}
