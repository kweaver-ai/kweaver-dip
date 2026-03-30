import { SortDirection } from '@/core'
import __ from './locale'

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

// 接口用这个值，视图指标依靠这个值判断传对应后端未分类的id
export const unCategorizedKey = 'uncategory'

// 视角
export const viewOptionList = [
    {
        label: __('主题域'),
        value: ViewType.SubjectDomain,
    },
    {
        label: __('组织架构'),
        value: ViewType.Organization,
    },
    // {
    //     label: __('数据源分类'),
    //     value: ViewType.DataSource,
    // },
]
