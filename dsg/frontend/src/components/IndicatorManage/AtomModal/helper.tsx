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
]
