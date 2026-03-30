import { SortDirection } from '@/core'
import __ from './locale'

export const initSearchCondition: any = {
    offset: 1,
    limit: 10,
    keyword: '',
    direction: SortDirection.DESC,
    sort: 'created_at',
}

export const DefaultMenu = {
    key: 'created_at',
    sort: SortDirection.DESC,
    label: __('按创建时间排序'),
}
