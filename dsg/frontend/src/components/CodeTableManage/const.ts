import { IStdDetailConfig, SortDirection } from '@/core/apis/common.d'
import {
    stardOrignizeTypeAll,
    stardOrignizeTypeList,
    StateType,
    StdStatus,
} from '@/utils'
import { IformItem, SearchType } from '@/ui/LightweightSearch/const'
import __ from './locale'

/**
 * 排序方式
 */
export enum SortType {
    CREATED = 'create_time',
    UPDATED = 'update_time',
    STATE = 'state',
}

export const menus = [
    { key: SortType.CREATED, label: __('按创建时间排序') },
    { key: SortType.UPDATED, label: __('按最终修改时间排序') },
    { key: SortType.STATE, label: __('按状态排序') },
]

export const defaultMenu = {
    key: SortType.UPDATED,
    sort: SortDirection.DESC,
}

/**
 * 排序菜单 标准
 */
export const menusStd = [
    { key: SortType.CREATED, label: '按创建时间' },
    { key: SortType.UPDATED, label: '按最终修改时间' },
]

// 标准状态
export const stateList = [
    {
        key: 0,
        label: '草稿',
    },
    {
        key: 1,
        label: '审核中',
    },
    {
        key: 2,
        label: '现行',
    },
    {
        key: 3,
        label: '退回',
    },
    {
        key: 4,
        label: '被替代',
    },
    {
        key: 5,
        label: '废止',
    },
]

// 码表详情
// 基本信息
// export const basicConfig: (IStdDetailConfig | IStdDetailConfig[])[] = [
//     {
//         label: '所属目录：',
//         name: 'id',
//         col: 24,
//     },
//     {
//         label: '中文名称：',
//         name: 'name_cn',
//         col: 24,
//     },
//     {
//         label: '英文名称：',
//         name: 'name_en',
//         col: 24,
//     },
//     {
//         label: '同义词：',
//         name: 'synonym',
//         col: 24,
//     },
//     {
//         label: '标准分类：',
//         name: 'description',
//         col: 24,
//     },
//     {
//         label: '关联标准文件',
//         name: 'description',
//         col: 24,
//     },
// ]

// 码表详情
// 码表
export interface dictAttrEnumType {
    // ruleList: string
    rule_list: string
    name_en: string
    name_cn: string
    synonym: string
    std_type: string
    data_type: string
    data_length: string
    data_precision: string
    // dict_id: string
    // dict_code: string
    ch_name: string
    dict_name: string
    description: string
    version: string
    status: string
    create_user: string
    create_time: string
    update_user: string
    update_time: string
    // std_file_code: string
    file_name: string
    // catalog_id: string
    catalog_name: string
    history_vo_list: string
}

export const dictAttrEnum: dictAttrEnumType = {
    // ruleList: '编码规则',
    rule_list: '编码规则',
    name_en: '英文名称',
    name_cn: '中文名称',
    synonym: '同义词',
    std_type: '标准分类',
    data_type: '数据类型',
    data_length: '数据长度',
    data_precision: '数据精度',
    // dict_id: 'id',
    // dict_code: '码表code',
    ch_name: '码表',
    dict_name: '码表',
    description: '说明',
    version: '当前版本号',
    status: '状态',
    create_user: '创建人',
    create_time: '创建时间',
    update_user: '修改人',
    update_time: '修改时间',
    // std_file_code: '关联标准文件',
    file_name: '关联标准文件',
    // catalog_id: '目录',
    catalog_name: '所属目录',
    history_vo_list: '历史版本',
}

// 基本信息
export const basicConfig: (IStdDetailConfig | IStdDetailConfig[])[] = [
    {
        label: '所属目录：',
        name: 'catalog_name',
        col: 24,
    },
    {
        label: '中文名称：',
        name: 'ch_name',
        col: 24,
    },
    {
        label: '英文名称：',
        name: 'en_name',
        col: 24,
    },

    {
        label: '标准分类：',
        name: 'org_type',
        col: 24,
    },
    // {
    //     label: '关联标准文件：',
    //     name: 'std_file_name',
    //     col: 24,
    // },
    {
        label: '说明：',
        name: 'description',
        col: 24,
    },
]

// 引用信息
export const quoteConfig: (IStdDetailConfig | IStdDetailConfig[])[] = [
    {
        label: '',
        name: 'quote_dataEle_list',
        col: 24,
    },
]

// 码值信息
export const dictValuesConfig: (IStdDetailConfig | IStdDetailConfig[])[] = [
    {
        label: '',
        name: 'enums',
        col: 24,
    },
]

// 版本信息
export const versionConfig: (IStdDetailConfig | IStdDetailConfig[])[] = [
    {
        label: '当前版本号：',
        name: 'version',
        col: 24,
    },
    {
        label: '最终修改人/时间：',
        name: 'update_user',
        col: 24,
    },
    {
        label: '创建人/时间：',
        name: 'create_user',
        col: 24,
    },
    {
        label: '历史版本',
        name: 'change_info_list',
        col: 24,
    },
]

// 码表信息(组合前六种信息)
export const allDictAttrConfig: (IStdDetailConfig | IStdDetailConfig[])[] =
    basicConfig.concat(quoteConfig, dictValuesConfig, versionConfig)

export const searchData: IformItem[] = [
    {
        label: '标准分类',
        key: 'org_type',
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

// 码表详情模块分类
export enum CTDetailBasicModType {
    BasicInfo = 'basicInfo',
    AssociatedFile = 'associatedFile',
    AssociatedDataEle = 'associatedDataEle',
    CodeValue = 'associatedCodeTable',
    Version = 'version',
}

// 码表详情显示内容config
export const codeTableDetailConfig = {
    [CTDetailBasicModType.BasicInfo]: [
        {
            key: 'ch_name',
            label: __('码表名称'),
        },
        {
            key: 'en_name',
            label: __('英文名称'),
        },
        {
            key: 'catalog_name',
            label: __('所属自定义目录'),
        },
        {
            key: 'org_type',
            label: __('标准分类'),
        },
        {
            key: 'department_name',
            label: __('所属组织结构'),
        },
        // {
        //     key: 'disable_date',
        //     label: __('停用日期'),
        // },
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
    [CTDetailBasicModType.AssociatedFile]: [
        {
            key: 'fileList',
            label: __('关联标准文件'),
        },
    ],
    [CTDetailBasicModType.AssociatedDataEle]: [
        {
            key: 'dataEleList',
            label: __('数据元'),
        },
    ],
    [CTDetailBasicModType.CodeValue]: [
        {
            key: 'codeValueList',
            label: __('码值'),
        },
    ],
    [CTDetailBasicModType.Version]: [
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

export const codeTableDetailMods = [
    {
        modKey: CTDetailBasicModType.BasicInfo,
        title: __('基本属性'),
        config: codeTableDetailConfig[CTDetailBasicModType.BasicInfo],
    },
    {
        modKey: CTDetailBasicModType.AssociatedFile,
        title: __('关联标准文件'),
        config: codeTableDetailConfig[CTDetailBasicModType.AssociatedFile],
        // 表格展示数据为单独使用接口获取的数组
        type: 'list',
    },
    {
        modKey: CTDetailBasicModType.AssociatedDataEle,
        title: __('引用信息'),
        config: codeTableDetailConfig[CTDetailBasicModType.AssociatedDataEle],
        // 表格展示数据为单独使用接口获取的数组
        type: 'list',
    },

    {
        modKey: CTDetailBasicModType.CodeValue,
        title: __('码值信息'),
        config: codeTableDetailConfig[CTDetailBasicModType.CodeValue],
        // 表格展示数据为单独使用接口获取的数组
        type: 'table',
    },
    {
        modKey: CTDetailBasicModType.Version,
        title: __('版本信息'),
        config: codeTableDetailConfig[CTDetailBasicModType.Version],
    },
]
