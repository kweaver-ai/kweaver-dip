import { DataSourceFromType, SortDirection } from '@/core'
import __ from './locale'

export const VIRTUALENGINTYPE = 'olk'
/**
 * 排序方式
 */
export enum SortType {
    CREATED = 'created_at',
    UPDATED = 'updated_at',
    NAME = 'name',
}
/*
 * 排序菜单 标准
 */
export const menus = [
    { key: SortType.NAME, label: __('按名称排序') },
    { key: SortType.CREATED, label: __('按创建时间排序') },
    { key: SortType.UPDATED, label: __('按更新时间排序') },
]

/**
 * 默认排序表单
 */
export const defaultMenu = {
    key: SortType.UPDATED,
    sort: SortDirection.DESC,
}

/**
 * 操作类型
 */
export enum OptionType {
    // 编辑
    EDIT = 'edit',
    // 详情
    DETAIL = 'detail',

    // 同步日志
    SYNCLOGS = 'synclogs',

    // 删除
    DELETE = 'delete',
}

/**
 * 配置数据信息状态
 */

export enum EditStatus {
    // 无操作
    NONE = '',
    // 创建
    CREATE = 'create',

    // 编辑
    EDIT = 'edit',
}

// tab页面的key
export enum tabsKey {
    // 模型
    MODEL = 'model',

    // 日志
    LOGS = 'logs',

    // 加工逻辑
    PROCESSLOGIC = 'processLogic',
}

// 表类型
export enum FormType {
    // 数据来源表
    SOURCESFORM = 'sourceForm',

    // 数据目标表
    TARGETFORM = 'targetForm',

    // 业务表
    BUSSINESSFORM = 'bussinessForm',
}

// 默认桩
const defaultPorts = {
    groups: {
        leftPorts: {
            markup: [
                {
                    tagName: 'circle',
                    selector: 'portBody',
                },
            ],
            attrs: {
                portBody: {
                    r: 4,
                    strokeWidth: 1,
                    stroke: '#D5D5D5',
                    fill: '#D5D5D5',
                    magnet: true,
                    zIndex: 10,
                },
            },
            position: 'freePort',
            zIndex: 10,
        },
        rightPorts: {
            markup: [
                {
                    tagName: 'circle',
                    selector: 'portBody',
                },
            ],
            attrs: {
                portBody: {
                    r: 4,
                    strokeWidth: 1,
                    stroke: '#D5D5D5',
                    fill: '#D5D5D5',
                    magnet: true,
                    zIndex: 10,
                },
            },
            position: 'freePort',
            zIndex: 10,
        },
    },
}

// 表格默认模板
export const dataSourceFormTemplate = {
    shape: 'data-source-form',
    width: 284,
    height: 362,
    ports: defaultPorts,
    position: {
        x: 100,
        y: 100,
    },
    data: {
        items: [],
        type: FormType.SOURCESFORM,
        offset: 0,
        infoId: '',
        singleSelectedId: '',
        fid: '',
        editStatus: false,
        keyWord: '',
        formInfo: null,
        errorStatus: false,
        formErrorStatus: false,
        relatedSelected: '',
        descriptionField: '',
    },
    zIndex: 9999,
}

// 模型类型
export enum ModelType {
    // 创建
    CREATE = 'create',

    // 发布
    PUBLISH = 'publish',
}

// hive 无法映射的类型
export const NotChangedToHive = [
    'numeric',
    'time',
    'enum',
    'set',
    'tinyblob',
    'blob',
    'mediumblob',
    'longblob',
    'geometry',
    'point',
    'linestring',
    'ploygon',
    'multipiont',
    'multilinestring',
    'multipolygon',
    'geometrytrycollection',
]

// 公共类型
const baseDataType = [
    'tinyint',
    'smallint',
    'int',
    'bigint',
    'float',
    'double',
    'decimal',
    'boolean',
    'date',
    'varchar',
    'char',
]

// hive 类型
export const hiveDataType = [...baseDataType, 'binary', 'string', 'timestamp']

// mysql 类型
export const mysqlDataType = [...baseDataType, 'datetime', 'mediumblob', 'time']

// postgresSql 类型
export const postgresSqlType = [
    'int4',
    'int8',
    'float8',
    'numeric',
    'bool',
    'date',
    'timestamp',
    'varchar',
    'text',
    'bytea',
]

/**
 * hive有长度类型长度限制
 */
export const hiveDataConfig = {
    varchar: [65535],
    decimal: [38, 38],
    char: [255],
}

export const hiveOnlyHasLength = ['varchar', 'char']

export const hiveOnlyhasLengthAndPrecision = ['decimal']

export const postgresSqlHasLength = ['varchar']
export const postgresSqlOnlyhasLengthAndPrecision = ['numeric']

/**
 * mysql 有长度类型长度限制
 */
export const mysqlDataConfig = {
    varchar: [16777215],
    decimal: [38, 38],
    char: [255],
}

export const postgresSqlDataConfig = {
    varchar: [
        {
            min: 0,
            max: 16777215,
        },
    ],
    numeric: [
        {
            min: 1,
            max: 38,
        },
        {
            min: 0,
            max: 38,
        },
    ],
}

/**
 *
 */
// 错误类型
export enum FieldErrorType {
    // 正常
    NORMAL = 'normal',

    // 非法字符
    EXISTUNALLOW = 'existUnAllow',

    // 重名
    NAMEREPEAT = 'nameRepeat',
}

// 数据源来源选择下拉
export const DataSourceFromOptions = [
    {
        value: DataSourceFromType.Analytical,
        label: __('数据仓库'),
    },
    {
        value: DataSourceFromType.Records,
        label: __('信息系统'),
    },
]
