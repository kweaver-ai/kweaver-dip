import __ from '../locale'
import { SortDirection } from '@/core'

export const menus = [
    { key: 'scored_at', label: __('按评分时间排序') },
    { key: 'name', label: __('按数据资源目录名称排序') },
]

export const defaultMenu = {
    key: 'scored_at',
    sort: SortDirection.DESC,
}

export const scoreDesc = ['1分', '2分', '3分', '4分', '5分']
