import { SortDirection } from '@/core'
import __ from './locale'
import { resourceTypeList, ResourceType } from '../const'
import { IformItem, SearchType } from '@/ui/LightweightSearch/const'

/**
 * @BUSINESS 主题域
 * @ORGNIZATION 组织架构
 * @DATASOURCE 数据源分类
 */
export enum ViewType {
    SubjectDomain = 'subject_domain',
    Organization = 'orgcode',
    DataSource = 'data_source',
}

// 视角
export const viewOptionList = [
    {
        label: __('所属业务对象'),
        value: ViewType.SubjectDomain,
    },
    {
        label: __('组织架构'),
        value: ViewType.Organization,
    },
    {
        label: __('数据源分类'),
        value: ViewType.DataSource,
    },
]

export const searchData: any[] = [
    {
        label: __('资源类型'),
        key: 'resource_type',
        options: [
            { label: __('不限'), value: undefined },
            ...resourceTypeList.filter(
                (item) => item.value !== ResourceType.File,
            ),
        ],
        type: SearchType.Radio,
    },
]
export const defaultSearchData = {
    resource_type: undefined,
}
