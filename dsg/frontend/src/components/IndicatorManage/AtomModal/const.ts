import { SortDirection } from '@/core'
import __ from './locale'

export const defaultMenu = {
    key: 'updated_at',
    sort: SortDirection.DESC,
}

export const menus = [
    { key: 'name', label: __('按原子指标业务名称排序') },
    { key: 'created_at', label: __('按原子指标创建时间排序') },
    { key: 'updated_at', label: __('按原子指标更新时间排序') },
]
