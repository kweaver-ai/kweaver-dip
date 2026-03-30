import { SortDirection } from '@/core'
import { IformItem, SearchType } from '@/ui/LightweightSearch/const'

import { stardOrignizeTypeAll, stardOrignizeTypeList } from '@/utils'
import { FileSorterType } from './helper'
import __ from './locale'

// 文件详情模块分类
export enum FileDetailBasicModType {
    StandardFile = 'standardFile',
    BasicInfo = 'basicInfo',
    AssociatedDataEle = 'associatedDataEle',
    AssociatedCodeTable = 'associatedCodeTable',
    AssociatedCodeRule = 'associatedCodeRule',
    Version = 'version',
}

export const defaultMenu = {
    key: FileSorterType.UPDATED,
    sort: SortDirection.DESC,
}

export const menus = [
    { key: FileSorterType.CREATED, label: '按创建时间排序' },
    { key: FileSorterType.UPDATED, label: '按最终修改时间排序' },
    { key: FileSorterType.ACTDATE, label: '按实施日期排序' },
    { key: FileSorterType.DISABLEDATE, label: '按停用日期排序' },
    { key: FileSorterType.STATE, label: '按状态排序' },
]

export const getShowContent = (val: any) => {
    if (typeof val === 'string') {
        return val || '--'
    }
    return val
}

export const searchData: IformItem[] = [
    {
        label: '标准分类',
        key: 'state',
        options: stardOrignizeTypeList.map((item) => {
            return {
                ...item,
                label:
                    item.value === stardOrignizeTypeAll ? '不限' : item.label,
                isInit: item.value === stardOrignizeTypeAll,
            }
        }),
        type: SearchType.Radio,
    },
]

// 文件详情显示内容config
export const fileDetailConfig = {
    [FileDetailBasicModType.StandardFile]: [
        {
            key: 'attachment_type',
            label: __('文件类型'),
        },
        {
            key: 'file_name',
            label: __('文件'),
        },
        {
            key: 'attachment_url',
            label: __('链接地址'),
        },
    ],
    [FileDetailBasicModType.BasicInfo]: [
        {
            key: 'catalog_name',
            label: __('所属目录'),
        },
        {
            key: 'department_name',
            label: __('所属组织结构'),
        },
        {
            key: 'name',
            label: __('标准文件名称'),
        },
        {
            key: 'number',
            label: __('标准编号'),
        },
        {
            key: 'org_type',
            label: __('标准分类'),
        },
        {
            key: 'act_date',
            label: __('实施日期'),
        },
        {
            key: 'disable_date',
            label: __('停用日期'),
        },
        {
            key: 'state',
            label: __('状态'),
        },
        {
            key: 'disable_reason',
            label: __('停用原因'),
        },
        {
            key: 'description',
            label: __('说明'),
        },
    ],
    [FileDetailBasicModType.AssociatedDataEle]: [
        {
            key: 'dataEleList',
            label: __('数据元'),
        },
    ],
    [FileDetailBasicModType.AssociatedCodeTable]: [
        {
            key: 'codeTableList',
            label: __('码表'),
        },
    ],
    [FileDetailBasicModType.AssociatedCodeRule]: [
        {
            key: 'codeRuleList',
            label: __('编码规则'),
        },
    ],
    [FileDetailBasicModType.Version]: [
        {
            key: 'version',
            label: __('当前版本号'),
        },
        {
            key: 'update_user',
            label: __('最终修改人'),
        },
        {
            key: 'update_time',
            label: __('最终修改时间'),
        },
        {
            key: 'create_user',
            label: __('创建人'),
        },
        {
            key: 'create_time',
            label: __('创建时间'),
        },
    ],
}

export const fileDetailMods = [
    {
        modKey: FileDetailBasicModType.StandardFile,
        title: __('文件信息'),
        config: fileDetailConfig[FileDetailBasicModType.StandardFile],
    },
    {
        modKey: FileDetailBasicModType.BasicInfo,
        title: __('基本属性'),
        config: fileDetailConfig[FileDetailBasicModType.BasicInfo],
    },
    {
        modKey: FileDetailBasicModType.AssociatedDataEle,
        title: __('关联数据元'),
        config: fileDetailConfig[FileDetailBasicModType.AssociatedDataEle],
        // 表格展示数据为单独使用接口获取的数组
        type: 'list',
    },
    {
        modKey: FileDetailBasicModType.AssociatedCodeTable,
        title: __('关联码表'),
        config: fileDetailConfig[FileDetailBasicModType.AssociatedCodeTable],
        // 表格展示数据为单独使用接口获取的数组
        type: 'list',
    },
    {
        modKey: FileDetailBasicModType.AssociatedCodeRule,
        title: __('关联编码规则'),
        config: fileDetailConfig[FileDetailBasicModType.AssociatedCodeRule],
        // 表格展示数据为单独使用接口获取的数组
        type: 'list',
    },
    {
        modKey: FileDetailBasicModType.Version,
        title: __('版本信息'),
        config: fileDetailConfig[FileDetailBasicModType.Version],
    },
]
