import React from 'react'
import __ from './locale'
import {
    BinaryTypeOutlined,
    BooleanTypeOutlined,
    LimitDatellined,
    NumberTypeOutlined,
    StringTypeOutlined,
} from '@/icons'
// import { SortDirection, StateType } from '@/core'

export enum StateType {
    ENABLE = 'enable',
    DISABLE = 'disable',
}

export enum OperateType {
    ADD = 'add',
    EDIT = 'edit',
    CREATE = 'create',
    DELETE = 'delete',
    DETAIL = 'detail',
    IMPORT = 'import',
    PREVIEW = 'preview',
    EXECUTE = 'execute',
    EXPORT = 'export',
    STANDARDING = 'standarding',
    RENAME = 'rename',
    MOVE = 'move',
    OFFLINE = 'offline',
    PUBLISH = 'publish',
    ONLINE = 'online',
    // 变更
    CHANGE = 'change',
    BASEEDIT = 'baseedit',
    // 上报
    REPORT = 'report',
    // 撤销
    CANCEL = 'cancel',
    // 撤回
    REVOCATION = 'revocation',
    // 审核
    AUDIT = 'audit',
    CHECK = 'check',

    // 标准平台-移动列表数据至某目录下（如数据元/码表列表数据移动至某目录）
    MOVEDATATO = 'moveDataTo',
    // 标准平台-移动目录至
    MOVETO = 'moveto',
    // 标准平台-选择目录
    SELECT = 'select',
    // 标准平台-查看引用
    QUOTE = 'quote',
    // 标准平台-修改状态，启用/停用
    CHANGESTATE = 'changeState',
    // 标准平台-文件-标准维护
    FILEMAINTENANCE = 'fileMaintenance',
    // 标准平台-文件-下载/访问链接
    VIEWFILE = 'viewFile',
    // 加法
    PLUS = 'plus',
    // 减法
    MINUS = 'minus',
    // 跳转
    LINK = 'link',

    // 新建任务
    CREATETASK = 'createTask',

    // 运行智能产品
    RUN = 'run',
    PUBLISH_API = 'publishApi',
    PUBLISH_PLATFORM = 'publishPlatform',

    // 应用案例
    // 重新提交（如：案例重新上报）
    RESUBMIT = 'resubmit',
    // 撤销提交（如：案列撤销上报）
    UNDOSUBMIT = 'undoSubmit',
    // 数据同步
    SYNC = 'sync',
    AUTHORIZATION = 'authorization',
    // 提交
    SUBMIT = 'submit',
    // 发起质量检测
    QUALITY_EXAMINE = 'quality_examine',
    // 激活
    ACTIVE = 'active',
    // 禁用
    DISABLE = 'disable',
    // 配置角色
    CONFIG_ROLE = 'config_role',
    // 配置权限
    CONFIG_PERMISSION = 'config_permission',
    // 移除
    REMOVE = 'remove',
    // 资源策略申请
    SETTING = 'setting',

    // 版本管理
    VERSIONs = 'versions',

    // 复制
    COPY = 'copy',

    // 测试连接
    TEST = 'test',
}

// 对话框操作
export enum Operate {
    OK = 'ok',
    // 确定并继续操作
    OK_AND_CONTINUEOPR = 'ok_and_continueOpr',
    CANCEL = 'cancel',
}

export enum ErrorInfo {
    NOTNULL = '输入不能为空',
    ONLYSUP = '仅支持中英文、数字、下划线及中划线',
    INFOITEM = '仅支持中英文、数字、下划线、中划线及分号',
    EXCEPTEMOJI = '仅支持中英文、数字及键盘上的特殊字符',
    ENGNAME = '仅支持英文、数字、下划线及中划线',
    ONLYNUMMORETHAN0 = '仅支持输入数字，且为大于0的整数',
    MAX128 = '最多输入128个字符',
    ONLY0TO30 = '仅支持数字，0～30整数',
    ONLY0TO65 = '仅支持数字，且为0～65整数',
    ONLY0TO65535 = '仅支持数字，且为0～65535整数',
    EXTENDCNNAME = '仅支持中英文、数字、下划线及中划线，且不能以下划线和中划线开头',
    EXTENDENNAME = '仅支持英文、数字、下划线、中划线，且不能以下划线和中划线开头',
    // 用于码表码值校验
    ENUMNAME = '仅支持英文、数字、下划线、中划线，且不能以下划线开头',
    ONLYSUPNUM = '仅支持数字',
    UNIFORMCREDITCODE = '不符合规范',
    PHONENUMBER = '电话号码只能包含数字及+、-，长度范围 3~20 个字符',
    EMAIL = '请输入正确格式的邮箱',
    IDCARD = '身份证不符合规范',
}

export enum StdDirStyle {
    DEFAULTWIDTH = 280,
    MINWIDTH = 280,
    MAXWIDTH = 800,
}

/**
 * 数据标准状态
 * @param {ACTIVE} 启用
 * @param {DEACTIVE} 停用
 */
export enum StdStatus {
    ALL = '',
    ACTIVE = 1,
    DEACTIVE = 0,
}

// 启用状态
export const StdStatusList = [
    {
        key: StdStatus.ACTIVE,
        label: __('启用'),
    },
    {
        key: StdStatus.DEACTIVE,
        label: __('停用'),
    },
]

// 启用状态
export const stateOptionList = [
    {
        key: StateType.ENABLE,
        label: __('启用中'),
    },
    {
        key: StateType.DISABLE,
        label: __('已停用'),
    },
]

/**
 * 规则来源
 * @param {SYSTEM} 系统内置
 * @param {CUSTOM} 用户自定义
 */
export enum Source {
    ALL = '',
    SYSTEM = 0,
    CUSTOM = 1,
}

// 全部类型随便设置为一个key（不会传到后端）
export const stardOrignizeTypeAll = 1000

// 标准分类
export enum StandardizationType {
    All = stardOrignizeTypeAll,
    GroupType = 0,
    EnterpriseType = 1,
    IndustryType = 2,
    LocalType = 3,
    CountryType = 4,
    InternationlType = 5,
    ForeignType = 6,
    OtherType = 99,
}

// 标准组织类型
export const stardOrignizeTypeList = [
    {
        value: StandardizationType.All,
        label: '全部',
    },
    {
        value: StandardizationType.GroupType,
        label: '团体标准',
    },
    {
        value: StandardizationType.EnterpriseType,
        label: '企业标准',
    },
    {
        value: StandardizationType.IndustryType,
        label: '行业标准',
    },
    {
        value: StandardizationType.LocalType,
        label: '地方标准',
    },
    {
        value: StandardizationType.CountryType,
        label: '国家标准',
    },
    {
        value: StandardizationType.InternationlType,
        label: '国际标准',
    },
    {
        value: StandardizationType.ForeignType,
        label: '国外标准',
    },
    {
        value: StandardizationType.OtherType,
        label: '其他标准',
    },
]

/** 数据类型映射表 */
export const DATA_TYPE_MAP = {
    char: [
        'string',
        'char',
        'varchar',
        'json',
        'text',
        'tinytext',
        'mediumtext',
        'longtext',
        'uuid',
        'name',
        'jsonb',
        'bpchar',
        'uniqueidentifier',
        'xml',
        'sysname',
        'nvarchar',
        'enum',
        'set',
        'ntext',
        'nchar',
        'rowid',
        'urowid',
        'varchar2',
        'nvarchar2',
        'fixedstring',
        'nclob',
    ],
    // 整数型
    int: [
        'number',
        'tinyint',
        'smallint',
        'integer',
        'bigint',
        'int',
        'tinyint',
        'mediumint',
        'int unsigned',
        'tinyint unsigned',
        'smallint unsigned',
        'mediumint unsigned',
        'bigint unsigned',
        'int8',
        'int4',
        'int2',
        'int16',
        'int32',
        'int64',
        'int128',
        'int256',
        'integer',
        'long',
    ],
    // 小数型
    float: [
        'real',
        'double',
        'float',
        'double precision',
        'float4',
        'float8',
        'float16',
        'float32',
        'float64',
    ],
    // 高精度型
    decimal: ['decimal', 'numeric', 'dec'],
    number: [
        'tinyint',
        'smallint',
        'int',
        'integer',
        'bigint',
        'float',
        'double',
        'decimal',
        'numeric',
        'mediumint',
        'int unsigned',
        'tinyint unsigned',
        'smallint unsigned',
        'mediumint unsigned',
        'bigint unsigned',
        'money',
        'smallmoney',
        'int8',
        'int4',
        'int2',
        'int16',
        'int32',
        'int64',
        'int128',
        'int256',
        'float4',
        'float8',
        'float16',
        'float32',
        'float64',
        'oid',
        'smallserial',
        'serial4',
        'bigserial',
        'serial',
        'real',
        'binary_double',
        'binary_float',
        'integer',
        'number',
        'long',
    ],
    bool: ['boolean', 'bit', 'bool'],
    date: ['date', 'year'],
    datetime: [
        'datetime',
        'datetime2',
        'smalldatetime',
        'timestamp',
        'timestamptz',
        'timestamp with time zone',
    ],
    time: ['time', 'timetz', 'time with time zone'],
    timestamp: [],
    binary: [
        'binary',
        'blob',
        'tinyblob',
        'mediumblob',
        'longblob',
        'bytea',
        'image',
        'hierarchyid',
        'geography',
        'geometry',
        'varbinary',
        'raw',
        'map',
        'array',
        'struct',
    ],
}

/** 字段类型英文枚举 */
export enum FIELD_TYPE_EN {
    CHAR = 'char',
    TIME = 'time',
    INT = 'int',
    FLOAT = 'float',
    DECIMAL = 'decimal',
    NUMBER = 'number',
    BOOL = 'bool',
    DATE = 'date',
    DATETIME = 'datetime',
    TIMESTAMP = 'timestamp',
    BINARY = 'binary',
}
/** 字段类型中文枚举 */
export enum FIELD_TYPE_CN {
    CHAR = '字符型',
    TIME = '时间型',
    INT = '整数型',
    FLOAT = '小数型',
    DECIMAL = '高精度型',
    NUMBER = '数字型',
    BOOL = '布尔型',
    DATE = '日期型',
    DATETIME = '日期时间型',
    TIMESTAMP = '时间戳型',
    BINARY = '二进制',
}

/** 字段类型中英文映射 */
export const DATA_TYPE_MAP_CN = {
    [FIELD_TYPE_EN.CHAR]: [FIELD_TYPE_CN.CHAR],
    [FIELD_TYPE_EN.TIME]: [FIELD_TYPE_CN.TIME],
    [FIELD_TYPE_EN.INT]: [FIELD_TYPE_CN.INT],
    [FIELD_TYPE_EN.FLOAT]: [FIELD_TYPE_CN.FLOAT],
    [FIELD_TYPE_EN.DECIMAL]: [FIELD_TYPE_CN.DECIMAL],
    [FIELD_TYPE_EN.NUMBER]: [FIELD_TYPE_CN.NUMBER],
    [FIELD_TYPE_EN.BOOL]: [FIELD_TYPE_CN.BOOL],
    [FIELD_TYPE_EN.DATE]: [FIELD_TYPE_CN.DATE],
    [FIELD_TYPE_EN.DATETIME]: [FIELD_TYPE_CN.DATETIME],
    [FIELD_TYPE_EN.TIMESTAMP]: [FIELD_TYPE_CN.TIMESTAMP],
    [FIELD_TYPE_EN.BINARY]: [FIELD_TYPE_CN.BINARY],
}

export const FIELD_TYPE_ICON = {
    [FIELD_TYPE_EN.CHAR]: StringTypeOutlined,
    [FIELD_TYPE_EN.NUMBER]: NumberTypeOutlined,
    [FIELD_TYPE_EN.BOOL]: BooleanTypeOutlined,
    [FIELD_TYPE_EN.DATE]: LimitDatellined,
    [FIELD_TYPE_EN.DATETIME]: LimitDatellined,
    [FIELD_TYPE_EN.TIMESTAMP]: LimitDatellined,
    [FIELD_TYPE_EN.BINARY]: BinaryTypeOutlined,
}

/** 根据type查询数据分属类型 */
const getDataType = (type: string) => {
    const usageType = Object.keys(DATA_TYPE_MAP).filter((key) =>
        DATA_TYPE_MAP[key].includes(type),
    )
    // 假使type不存在重叠情况
    return usageType[0] || ''
}

/**
 * 移除类型中附带的符号
 * @param type 类型
 * @param symbols 符号数组 默认 ['(', '（', '）', ')']
 */
export const filterSymbol = (
    type: string,
    symbols = ['(', '（', '）', ')'],
) => {
    const isContain = symbols.some((s) => type.includes(s))
    if (!isContain) return type

    const regex = new RegExp(`[${symbols.join('')}]`, 'g')
    return type.replace(regex, '')
}

/**
 * 根据type查询数据分属类型
 * @param type 字段type
 * @param isEN 是否英文名称  默认英文
 * @returns
 */
export const getTypeText = (type: string, isEN = true) => {
    const enType = getDataType(type)
    return isEN ? enType : DATA_TYPE_MAP_CN[enType] || '未知'
}

// 转为千位数表示
export const formatNumber = (
    num: string | number,
    isThousand = true,
    nullText = '--',
): string => {
    const val = num?.toString()
    if (val === '0' || !val) return nullText || '0'

    if (isThousand) {
        return val.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
    return val
}

/**
 * 1万以内 直接显示，一万以上到1亿以内，转换到万，四舍五入保留小数点后两位
 * 1亿以上，转换到亿，四舍五入保留小数点后四位
 * @param num
 * @returns
 */
export function formatStaticsNumber(num) {
    if (typeof num !== 'number') return num
    if (num < 10000) {
        return num.toLocaleString()
    }
    if (num < 1e8) {
        return `${(num / 10000)
            .toFixed(2)
            .replace(/\.?0+$/, '')
            .toLocaleString()}万`
    }
    return `${(num / 1e8)
        .toFixed(4)
        .replace(/\.?0+$/, '')
        .toLocaleString()}亿`
}
