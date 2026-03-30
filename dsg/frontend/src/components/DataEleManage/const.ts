import {
    CatalogType,
    IStdDetailConfig,
    SortDirection,
} from '@/core/apis/common.d'
import { stardOrignizeTypeAll, stardOrignizeTypeList } from '@/utils'
import { IformItem, SearchType } from '@/ui/LightweightSearch/const'
import __ from './locale'
import { ValueRangeType } from '@/core'

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

// 数据类型
export enum DataType {
    TNUMBER = 0,
    TINT = 10,
    TCHAR = 1,
    TDATE = 2,
    TDATETIME = 3,
    TTIMESTAMP = 4,
    TBOOLEAN = 5,
    TBINARY = 6,
    TDECIMAL = 7,
    TDOUBLE = 8,
    TTIME = 9,
    TOTHER = 99,
}

export const dataTypeList = [
    // 数字型“拆分为“整数型”、“小数型”和“高精度型”
    // {
    //     value: DataType.TINT,
    //     label: '数字型',
    // },
    {
        value: DataType.TCHAR,
        label: '字符型',
    },
    {
        value: DataType.TINT,
        label: '整数型',
    },
    {
        value: DataType.TDOUBLE,
        label: '小数型',
    },
    {
        value: DataType.TDECIMAL,
        label: '高精度型',
    },
    {
        value: DataType.TDATE,
        label: '日期型',
    },
    {
        value: DataType.TDATETIME,
        label: '日期时间型',
    },
    {
        value: DataType.TTIME,
        label: '时间型',
    },
    // {
    //     value: DataType.TTIMESTAMP,
    //     label: '时间戳型',
    // },
    {
        value: DataType.TBOOLEAN,
        label: '布尔型',
    },

    // {
    //     value: DataType.TBINARY,
    //     label: '二进制型',
    // },
]

export const allDataTypeOptions = [
    ...dataTypeList,
    {
        value: DataType.TOTHER,
        label: '其他',
    },
]

// 数据元关联类型
export const dataEleAssociateType = [
    {
        label: __('无限制'),
        value: ValueRangeType.None,
    },
    {
        label: __('码表'),
        value: ValueRangeType.CodeTable,
    },
    {
        label: __('编码规则'),
        value: ValueRangeType.CodeRule,
    },
]

// 数据元详情
// 数据元
export interface dataEleAttrEnumType {
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
    version_out: string
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
    empty_flag: string
}
export const dataEleAttrEnum: dataEleAttrEnumType = {
    // ruleList: '编码规则',
    rule_list: '编码规则',
    name_en: '英文名称',
    name_cn: '数据元名称',
    synonym: '同义词',
    std_type: '标准分类',
    empty_flag: '是否为空字段',
    data_type: '数据类型',
    data_length: '数据长度',
    data_precision: '数据精度',
    // dict_id: 'id',
    // dict_code: '数据元code',
    ch_name: '数据元',
    dict_name: '码表名称',
    description: '说明',
    version_out: '当前版本号',
    status: '状态',
    create_user: '创建人',
    create_time: '创建时间',
    update_user: '修改人',
    update_time: '修改时间',
    // std_file_code: '关联文件',
    // alpha3版本再进行显示
    file_name: '关联文件',
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
        label: '数据元名称：',
        name: 'name_cn',
        col: 24,
    },
    {
        label: '英文名称：',
        name: 'name_en',
        col: 24,
    },
    {
        label: '同义词：',
        name: 'synonym',
        col: 24,
    },
    {
        label: '标准分类：',
        name: 'std_type',
        col: 24,
    },
    {
        label: '所属组织结构：',
        name: 'department_name',
        col: 24,
    },
    {
        label: '是否为空字段',
        name: 'empty_flag',
        col: 24,
    },
    // {
    //     label: '关联标准文件：',
    //     name: 'file_name',
    //     col: 24,
    // },
]

// 属性信息
export const attrConfig: (IStdDetailConfig | IStdDetailConfig[])[] = [
    {
        label: '数据类型：',
        name: 'data_type',
        col: 24,
    },
    // 数据长度与精度根据数据类型不同显示不同，如为字符型，数据精度显示：[空]
    {
        label: '数据长度：',
        name: 'data_length',
        col: 24,
    },
    {
        label: '数据精度：',
        name: 'data_precision',
        col: 24,
    },
]

// 数据元信息
export const dictConfig: (IStdDetailConfig | IStdDetailConfig[])[] = [
    {
        label: '',
        name: 'dict_name',
        col: 24,
    },
]

// 编码规则
export const codeRuleConfig: (IStdDetailConfig | IStdDetailConfig[])[] = [
    {
        label: '',
        name: 'rule_list',
        col: 24,
    },
]

// 附加信息
export const additAttrConfig: (IStdDetailConfig | IStdDetailConfig[])[] = [
    {
        label: '说明：',
        name: 'description',
        col: 24,
    },
]

// 附加信息
export const versionConfig: (IStdDetailConfig | IStdDetailConfig[])[] = [
    {
        label: '当前版本号：',
        name: 'version_out',
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
    // {
    //     label: '历史版本',
    //     name: 'history_vo_list',
    //     col: 24,
    // },
]

// 数据元信息(组合前六种信息)
// export const allAttrConfig: (IStdDetailConfig | IStdDetailConfig[])[] =
//     basicConfig.concat(
//         attrConfig,
//         dictConfig,
//         codeRuleConfig,
//         additAttrConfig,
//         versionConfig,
//     )

export const allAttrConfig: (IStdDetailConfig | IStdDetailConfig[])[] =
    basicConfig.concat(
        attrConfig,
        dictConfig,
        codeRuleConfig,
        additAttrConfig,
        versionConfig,
    )

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

// 数据元详情模块分类
export enum DEDetailBasicModType {
    BasicInfo = 'basicInfo',
    AssociatedFile = 'associatedFile',
    TechAttr = 'techAttr',
    CodeTable = 'codeValue',
    CodeRule = 'codeRule',
    Version = 'version',
    MoreInfo = 'moreInfo',
}

// 数据元详情显示内容config
export const dataEleDetailConfig = {
    [DEDetailBasicModType.BasicInfo]: [
        {
            key: 'name_cn',
            label: __('数据元名称'),
        },
        {
            key: 'name_en',
            label: __('英文名称'),
        },
        {
            key: 'synonym',
            label: __('同义词'),
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
            key: 'std_type',
            label: __('标准分类'),
        },
        {
            key: 'empty_flag',
            label: '是否为空字段',
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
    [DEDetailBasicModType.AssociatedFile]: [
        {
            key: 'std_files',
            label: __('关联标准文件'),
        },
    ],
    [DEDetailBasicModType.TechAttr]: [
        {
            key: 'data_type',
            label: __('数据类型'),
        },
        {
            key: 'data_length',
            label: __('数据长度'),
        },
        {
            key: 'data_precision',
            label: __('数据精度'),
        },
    ],
    [DEDetailBasicModType.CodeTable]: [
        {
            key: 'dict_name_cn',
            label: __('码值名称'),
        },
        {
            key: 'dict_name_en',
            label: __('英文名称'),
        },
        {
            key: 'codeValueList',
            label: __('码值'),
        },
    ],
    [DEDetailBasicModType.CodeRule]: [
        {
            key: 'rule_name',
            label: __('编码规则名称'),
        },
    ],
    [DEDetailBasicModType.Version]: [
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
    [DEDetailBasicModType.MoreInfo]: [
        {
            key: 'label_name',
            label: __('数据分级'),
        },
    ],
}

export const dataEleDetailMods = [
    {
        modKey: DEDetailBasicModType.BasicInfo,
        title: __('基本属性'),
        config: dataEleDetailConfig[DEDetailBasicModType.BasicInfo],
    },
    {
        modKey: DEDetailBasicModType.AssociatedFile,
        title: __('关联标准文件'),
        config: dataEleDetailConfig[DEDetailBasicModType.AssociatedFile],
        // 表格展示数据为单独使用接口获取的数组
        type: 'list',
    },
    {
        modKey: DEDetailBasicModType.TechAttr,
        title: __('技术属性'),
        config: dataEleDetailConfig[DEDetailBasicModType.TechAttr],
        // 表格展示数据为单独使用接口获取的数组
        type: 'list',
    },
    {
        modKey: DEDetailBasicModType.CodeTable,
        title: __('码表'),
        config: dataEleDetailConfig[DEDetailBasicModType.CodeTable],
        // 表格展示数据为单独使用接口获取的数组
        type: 'table',
    },
    {
        modKey: DEDetailBasicModType.CodeRule,
        title: __('编码规则'),
        config: dataEleDetailConfig[DEDetailBasicModType.CodeRule],
        // 表格展示数据为单独使用接口获取的数组
        type: 'table',
    },
    {
        modKey: DEDetailBasicModType.MoreInfo,
        title: __('更多信息'),
        config: dataEleDetailConfig[DEDetailBasicModType.MoreInfo],
    },
    {
        modKey: DEDetailBasicModType.Version,
        title: __('版本信息'),
        config: dataEleDetailConfig[DEDetailBasicModType.Version],
    },
]
