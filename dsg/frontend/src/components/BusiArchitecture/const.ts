import { IformItem, SearchType } from '@/ui/LightweightSearch/const'
import __ from './locale'
import { BusinessDomainLevelTypes } from '@/core'

export enum ViewMode {
    // 业务域
    Domain = 'domain',
    // 部门/组织架构
    Department = 'department',
    // 信息系统
    InfoSystem = 'infoSystem',
}

export const viewModeItems = [
    { label: __('业务领域'), value: ViewMode.Domain },
    { label: __('组织架构'), value: ViewMode.Department },
    { label: __('信息系统'), value: ViewMode.InfoSystem },
]

export const filters = [
    {
        label: __('不限'),
        value: 0,
    },
    {
        label: __('已关联'),
        value: 1,
    },
    {
        label: __('未关联'),
        value: 2,
    },
]

export const searchData: IformItem[] = [
    {
        label: __('是否关联业务模型'),
        key: 'model_related',
        options: filters,
        type: SearchType.Radio,
    },
    {
        label: __('是否关联数据模型'),
        key: 'data_model_related',
        options: filters,
        type: SearchType.Radio,
    },
    {
        label: __('是否关联信息系统'),
        key: 'info_related',
        options: filters,
        type: SearchType.Radio,
    },
]

export const defaultSearchData = {
    model_related: 0,
    data_model_related: 0,
    info_related: 0,
}

export const BusinessDomainLevelLabelName = {
    [BusinessDomainLevelTypes.DomainGrouping]: __('业务领域分组名称'),
    [BusinessDomainLevelTypes.Domain]: __('业务领域名称'),
    [BusinessDomainLevelTypes.Process]: __('主干业务名称'),
}

export const UNGROUPED = 'ungrouped'
