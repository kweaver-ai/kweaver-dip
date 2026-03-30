import __ from './locale'
import { IformItem, SearchType } from '@/ui/LightweightSearch/const'
import { SortDirection } from '@/core'

/**
 * 排序方式
 * @param CODE 'code' 编码
 * @param NAME 'name' 按名称排序
 */
export enum CaseSortType {
    NAME = 'name',
}
// 排序menu
export const menus = [
    // { key: CaseSortType.CODE, label: '按机构编码排序' },
    { key: CaseSortType.NAME, label: '按名称排序' },
]

export const defaultMenu = {
    key: CaseSortType.NAME,
    sort: SortDirection.DESC,
}

export const searchData: IformItem[] = [
    {
        label: '事项类型',
        key: 'type_key',
        options: [],
        type: SearchType.Radio,
    },
]
