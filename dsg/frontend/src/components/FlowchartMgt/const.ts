import __ from './locale'

/**
 * 排序方式
 */
export enum SortType {
    CREATED = 'created_at',
    UPDATED = 'updated_at',
}

/**
 * 排序菜单
 */
export const menus = [
    { key: SortType.CREATED, label: __('按创建时间排序') },
    { key: SortType.UPDATED, label: __('按更新时间排序') },
]
