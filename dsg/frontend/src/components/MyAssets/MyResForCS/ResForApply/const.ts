import { SortDirection } from '@/core'
import __ from '../locale'
import { ResTypeEnum } from '../const'

export const dataSortViewMenus = [
    {
        key: 'name',
        label: __('按表技术名称排序'),
    },
]

export const dataViewDefaultSort = {
    key: 'name',
    sort: SortDirection.DESC,
}

export const TabList = [
    {
        key: ResTypeEnum.View,
        label: __('库表'),
    },
    {
        key: ResTypeEnum.Api,
        label: __('接口服务'),
    },
]
