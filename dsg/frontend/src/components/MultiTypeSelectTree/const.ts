import __ from './locale'

export enum TreeType {
    // 部门
    Department = 'department',
    // 业务架构
    BArchitecture = 'business-architecture',
    // 系统
    InformationSystem = 'information_system',

    // 数据源树
    DataSource = 'data_source',
}

// 树类型列表
export const TreeTypeList = [
    {
        value: TreeType.Department,
        label: __('组织架构'),
    },
    {
        value: TreeType.BArchitecture,
        label: __('主干业务'),
    },
    {
        value: TreeType.InformationSystem,
        label: __('信息系统'),
    },
    {
        value: TreeType.DataSource,
        label: __('数据源'),
    },
]

export const UNGROUPED = 'uncategory'

// 数据源树类型
export enum DataSourceRadioType {
    // 按来源
    BySource = 'by_source',
    // 按类型
    ByType = 'by_type',
}

// 数据源树类型列表
export const DataSourceRadioTypeList = [
    {
        value: DataSourceRadioType.BySource,
        label: __('按来源'),
    },
    {
        value: DataSourceRadioType.ByType,
        label: __('按类型'),
    },
]
