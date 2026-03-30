import { SortDirection } from '@/core'
import { IformItem, SearchType } from '@/ui/LightweightSearch/const'
import {
    StdStatus,
    Source,
    StateType,
    stardOrignizeTypeAll,
    stardOrignizeTypeList,
} from '@/utils'

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
    { key: SortType.CREATED, label: __('按创建时间') },
    { key: SortType.UPDATED, label: __('按最终修改时间') },
    { key: SortType.STATE, label: __('按状态排序') },
]

export const defaultMenu = {
    key: SortType.UPDATED,
    sort: SortDirection.DESC,
}

export const stateList = [
    {
        key: '',
        value: __('全部'),
    },
    {
        key: StateType.ENABLE,
        value: __('启用'),
    },
    {
        key: StateType.DISABLE,
        value: __('停用'),
    },
]

export const sourceList = [
    {
        key: Source.ALL,
        value: __('全部'),
    },
    {
        key: Source.SYSTEM,
        value: __('系统预置'),
    },
    {
        key: Source.CUSTOM,
        value: __('用户自定义'),
    },
]
export const searchData: IformItem[] = [
    {
        label: __('标准分类'),
        key: 'org_type',
        options: stardOrignizeTypeList.map((item) => {
            return {
                ...item,
                label:
                    item.value === stardOrignizeTypeAll
                        ? __('不限')
                        : item.label,
                isInit: item.value === stardOrignizeTypeAll,
            }
        }),
        type: SearchType.Radio,
    },
]
// 规则方式
export enum RuleMethod {
    // 自定义
    Customer = 'CUSTOM',

    // 正则
    Regular = 'REGEX',
}

export const RuleTypeOptions = [
    {
        label: __('码表'),
        value: 1,
    },
    {
        label: __('数字'),
        value: 2,
    },
    {
        label: __('英文字母'),
        value: 3,
    },
    {
        label: __('汉字'),
        value: 4,
    },
    {
        label: __('任意字符'),
        value: 5,
    },
    {
        label: __('日期'),
        value: 6,
    },
    {
        label: __('分割字符串'),
        value: 7,
    },
]

export const StandardSort = [
    {
        label: __('团体标准'),
        value: 0,
    },
    {
        label: __('企业标准'),
        value: 1,
    },
    {
        label: __('行业标准'),
        value: 2,
    },
    {
        label: __('地方标准'),
        value: 3,
    },
    {
        label: __('国家标准'),
        value: 4,
    },
    {
        label: __('国际标准'),
        value: 5,
    },
    {
        label: __('国外标准'),
        value: 6,
    },
    {
        label: __('其他标准'),
        value: 99,
    },
]

export enum RuleCustomType {
    CodeTable = 1,
    Number = 2,
    Letter = 3,
    ChineseCharacter = 4,
    Any = 5,
    Date = 6,
    Separators = 7,
}

// 文件详情模块分类
export enum CTDetailBasicModType {
    BasicInfo = 'basicInfo',
    AssociatedFile = 'associatedFile',
    RuleCodeInfo = 'ruleCodeInfo',
    AssociatedDataEle = 'associatedDataEle',
    Version = 'version',
}

// 文件详情显示内容config
export const codeTableDetailConfig = {
    [CTDetailBasicModType.BasicInfo]: [
        {
            key: 'name',
            label: __('编码规则名称'),
        },
        {
            key: 'catalog_name',
            label: __('所属自定义目录'),
        },
        {
            key: 'department_name',
            label: __('所属组织结构'),
        },
        {
            key: 'org_type',
            label: __('标准分类'),
        },
        // {
        //     key: 'disable_date',
        //     label: __('停用日期'),
        // },
        {
            key: 'state',
            label: __('状态'),
        },
        // {
        //     key: 'disable_reason',
        //     label: __('停用原因'),
        // },
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
    // [CTDetailBasicModType.CodeValue]: [
    //     {
    //         key: 'codeValueList',
    //         label: __('码值'),
    //     },
    // ],
    [CTDetailBasicModType.RuleCodeInfo]: [
        {
            key: 'ruglarInfos',
            label: __('编码规则信息'),
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

    // {
    //     modKey: CTDetailBasicModType.CodeValue,
    //     title: __('码值信息'),
    //     config: codeTableDetailConfig[CTDetailBasicModType.CodeValue],
    //     // 表格展示数据为单独使用接口获取的数组
    //     type: 'table',
    // },
    {
        modKey: CTDetailBasicModType.RuleCodeInfo,
        title: __('编码规则信息'),
        config: codeTableDetailConfig[CTDetailBasicModType.RuleCodeInfo],
        type: 'list',
    },
    {
        modKey: CTDetailBasicModType.Version,
        title: __('版本信息'),
        config: codeTableDetailConfig[CTDetailBasicModType.Version],
    },
]

export enum OptionType {
    // 启用状态
    STATE = 'state',

    // 编辑
    EDIT = 'edit',

    // 引用
    USED = 'used',

    // 删除
    DELETE = 'delete',
}
