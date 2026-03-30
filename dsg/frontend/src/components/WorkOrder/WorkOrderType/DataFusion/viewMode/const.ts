import { SortDirection, SortType } from '@/core'
import __ from './locale'

const menus = [
    { key: 'name', label: __('按名称排序') },
    { key: SortType.CREATED, label: __('按创建时间排序') },
    { key: SortType.UPDATED, label: __('按修改时间排序') },
]

const defaultMenu = {
    key: SortType.UPDATED,
    sort: SortDirection.DESC,
}

/**
 * 算子错误类型
 */
enum FormulaError {
    MissingLine = 'missingLine',
    MoreLine = 'moreLine',
    IndexError = 'indexError',
    MissingData = 'missingData',
    ConfigError = 'configError',
    NodeChange = 'nodeChange',
}

/**
 * 桩配置
 */
const portconfig = {
    groups: {
        in: {
            position: 'left',
            markup: [
                {
                    tagName: 'rect',
                    selector: 'wrap',
                },
                {
                    tagName: 'circle',
                    selector: 'point',
                },
            ],
            attrs: {
                wrap: {
                    width: 24,
                    height: 24,
                    x: -12,
                    y: -12,
                    magnet: true,
                    fill: 'transparent',
                },
                point: {
                    r: 4,
                    fill: '#fff',
                    stroke: '#BFBFBF',
                    strokeWidth: 1,
                    magnet: true,
                },
            },
        },
        out: {
            position: 'right',
            markup: [
                {
                    tagName: 'rect',
                    selector: 'wrap',
                },
                {
                    tagName: 'circle',
                    selector: 'point',
                },
            ],
            attrs: {
                wrap: {
                    width: 24,
                    height: 24,
                    x: -12,
                    y: -12,
                    magnet: true,
                    fill: 'transparent',
                },
                point: {
                    r: 4,
                    fill: '#fff',
                    stroke: '#BFBFBF',
                    strokeWidth: 1,
                    magnet: true,
                },
            },
        },
    },
}

/**
 * 场景分析节点配置
 */
const sceneNodeTemplate = {
    shape: 'scene-analysis-node',
    width: 140,
    height: 130,
    position: {
        x: 600,
        y: 100,
    },
    data: {
        name: '',
        formula: [],
        src: [],
        output_fields: [],
        // 展开状态 true-展开
        expand: true,
        // 可执行状态 true-可执行
        executable: false,
        // 选中状态
        selected: false,
    },
    zIndex: 9999,
}

/**
 * 算子类型
 */
enum FormulaType {
    // 无操作
    NONE = 'none',

    // 库表
    FORM = 'form',

    // 关联
    JOIN = 'join',

    // 过滤
    WHERE = 'where',

    // 选择列
    SELECT = 'select',

    // 指标-场景分析模块独有
    INDICATOR = 'indicator',

    // 数据合并
    MERGE = 'merge',

    // 数据去重
    DISTINCT = 'distinct',

    // 输出库表-库表模块独有
    OUTPUTVIEW = 'output_view',

    // sql算子
    SQL = 'sql',
}

/**
 * 算子相关信息
 */
const formulaInfo = {
    [FormulaType.FORM]: {
        name: __('引用库表'),
        featureTip: __('引用已发布的库表'),
        fieldsTip: __('（被勾选的字段会作为下一个节点/算子的输入字段）'),
    },

    [FormulaType.JOIN]: {
        name: __('数据关联'),
        featureTip: __('将多个数据源进行多列合并'),
        fieldsTip: __('（被勾选的字段会作为下一个节点/算子的输入字段）'),
    },
    [FormulaType.WHERE]: {
        name: __('数据过滤'),
        featureTip: __('筛选出符合条件的数据'),
    },
    [FormulaType.SELECT]: {
        name: __('选择列'),
        featureTip: __('筛选出部分列'),
        fieldsTip: __('（被勾选的字段会作为下一个节点/算子的输入字段）'),
    },
    [FormulaType.INDICATOR]: {
        name: __('指标计算'),
        featureTip: __('进行指标聚合运算'),
    },
    [FormulaType.MERGE]: {
        name: __('数据合并'),
        featureTip: __('将多个数据源进行数据合并'),
    },
    [FormulaType.DISTINCT]: {
        name: __('数据去重'),
        featureTip: __('去除重复行'),
        fieldsTip: __(
            '（被勾选字段将会数据去重，且作为下一个节点/算子的输入字段）',
        ),
    },
    [FormulaType.OUTPUTVIEW]: {
        name: __('输出融合表'),
        featureTip: __('输出融合表'),
    },
    [FormulaType.SQL]: {
        name: __('SQL'),
        featureTip: __('专业的SQL语句查询，实现复杂运算逻辑'),
    },
}

/**
 * 节点数据类型
 */
enum NodeDataType {
    // 输入
    INPUT = 'INPUT',
    // 连接
    JOIN = 'JOIN',
    // 输出
    OUTPUT = 'OUTPUT',
}

/**
 * 关联方式
 */
enum JoinType {
    // 左联接
    LEFT = 'left',

    // 右联接
    RIGHT = 'right',

    // 内联接
    INNER = 'inner',

    // 全外联接
    FULLOUT = 'full out',
}

/**
 * 字段类型
 */
enum FieldTypes {
    INT = 'int',
    FLOAT = 'float',
    DECIMAL = 'decimal',
    NUMBER = 'number',
    CHAR = 'char',
    DATE = 'date',
    DATETIME = 'datetime',
    TIMESTAMP = 'timestamp',
    BOOL = 'bool',
    BINARY = 'binary',
    TIME = 'time',
}

const groupDate = [FieldTypes.DATE, FieldTypes.DATETIME, FieldTypes.TIMESTAMP]

const polymerizationTypeInfo = {
    COUNT: { text: __('计数') },
    'COUNT(DISTINCT)': { text: __('去重计数') },
    SUM: { text: __('求和') },
    MAX: { text: __('最大值') },
    MIN: { text: __('最小值') },
    AVG: { text: __('平均值') },
}

/**
 * 字段类型对应能选择的度量规则和限定条件
 * polymerizationOptions-度量规则
 * limitListOptions-限定条件
 */
const fieldInfos = {
    [FieldTypes.INT]: {
        name: __('整数型'),
        polymerizationOptions: [
            {
                label: __('计数'),
                value: 'COUNT',
            },
            {
                label: __('去重计数'),
                value: 'COUNT(DISTINCT)',
            },
            {
                label: __('求和'),
                value: 'SUM',
                default: true,
            },
            {
                label: __('最大值'),
                value: 'MAX',
            },
            {
                label: __('最小值'),
                value: 'MIN',
            },
            {
                label: __('平均值'),
                value: 'AVG',
            },
        ],
        limitListOptions: [
            {
                label: __('小于'),
                value: '<',
            },
            {
                label: __('小于或等于'),
                value: '<=',
            },
            {
                label: __('大于'),
                value: '>',
            },
            {
                label: __('大于或等于'),
                value: '>=',
            },
            {
                label: __('等于'),
                value: '=',
            },
            {
                label: __('不等于'),
                value: '<>',
            },
            // {
            //     label: __('属于码值'),
            //     value: 'in list',
            // },
            {
                label: __('属于'),
                value: 'belong',
            },
            {
                label: __('为空'),
                value: 'null',
            },
            {
                label: __('不为空'),
                value: 'not null',
            },
        ],
    },
    [FieldTypes.FLOAT]: {
        name: __('小数型'),
        polymerizationOptions: [
            {
                label: __('计数'),
                value: 'COUNT',
            },
            {
                label: __('去重计数'),
                value: 'COUNT(DISTINCT)',
            },
            {
                label: __('求和'),
                value: 'SUM',
                default: true,
            },
            {
                label: __('最大值'),
                value: 'MAX',
            },
            {
                label: __('最小值'),
                value: 'MIN',
            },
            {
                label: __('平均值'),
                value: 'AVG',
            },
        ],
        limitListOptions: [
            {
                label: __('小于'),
                value: '<',
            },
            {
                label: __('小于或等于'),
                value: '<=',
            },
            {
                label: __('大于'),
                value: '>',
            },
            {
                label: __('大于或等于'),
                value: '>=',
            },
            {
                label: __('等于'),
                value: '=',
            },
            {
                label: __('不等于'),
                value: '<>',
            },
            // {
            //     label: __('属于码值'),
            //     value: 'in list',
            // },
            {
                label: __('属于'),
                value: 'belong',
            },
            {
                label: __('为空'),
                value: 'null',
            },
            {
                label: __('不为空'),
                value: 'not null',
            },
        ],
    },
    [FieldTypes.DECIMAL]: {
        name: __('高精度型'),
        polymerizationOptions: [
            {
                label: __('计数'),
                value: 'COUNT',
            },
            {
                label: __('去重计数'),
                value: 'COUNT(DISTINCT)',
            },
            {
                label: __('求和'),
                value: 'SUM',
                default: true,
            },
            {
                label: __('最大值'),
                value: 'MAX',
            },
            {
                label: __('最小值'),
                value: 'MIN',
            },
            {
                label: __('平均值'),
                value: 'AVG',
            },
        ],
        limitListOptions: [
            {
                label: __('小于'),
                value: '<',
            },
            {
                label: __('小于或等于'),
                value: '<=',
            },
            {
                label: __('大于'),
                value: '>',
            },
            {
                label: __('大于或等于'),
                value: '>=',
            },
            {
                label: __('等于'),
                value: '=',
            },
            {
                label: __('不等于'),
                value: '<>',
            },
            // {
            //     label: __('属于码值'),
            //     value: 'in list',
            // },
            {
                label: __('属于'),
                value: 'belong',
            },
            {
                label: __('为空'),
                value: 'null',
            },
            {
                label: __('不为空'),
                value: 'not null',
            },
        ],
    },
    [FieldTypes.NUMBER]: {
        name: __('数字型'),
        polymerizationOptions: [
            {
                label: __('计数'),
                value: 'COUNT',
            },
            {
                label: __('去重计数'),
                value: 'COUNT(DISTINCT)',
            },
            {
                label: __('求和'),
                value: 'SUM',
                default: true,
            },
            {
                label: __('最大值'),
                value: 'MAX',
            },
            {
                label: __('最小值'),
                value: 'MIN',
            },
            {
                label: __('平均值'),
                value: 'AVG',
            },
        ],
        limitListOptions: [
            {
                label: __('小于'),
                value: '<',
            },
            {
                label: __('小于或等于'),
                value: '<=',
            },
            {
                label: __('大于'),
                value: '>',
            },
            {
                label: __('大于或等于'),
                value: '>=',
            },
            {
                label: __('等于'),
                value: '=',
            },
            {
                label: __('不等于'),
                value: '<>',
            },
            // {
            //     label: __('属于码值'),
            //     value: 'in list',
            // },
            {
                label: __('属于'),
                value: 'belong',
            },
            {
                label: __('为空'),
                value: 'null',
            },
            {
                label: __('不为空'),
                value: 'not null',
            },
        ],
    },
    [FieldTypes.CHAR]: {
        name: __('字符型'),
        polymerizationOptions: [
            {
                label: __('计数'),
                value: 'COUNT',
            },
            {
                label: __('去重计数'),
                value: 'COUNT(DISTINCT)',
                default: true,
            },
        ],
        limitListOptions: [
            {
                label: __('包含'),
                value: 'include',
            },
            {
                label: __('不包含'),
                value: 'not include',
            },
            {
                label: __('开头是'),
                value: 'prefix',
            },
            {
                label: __('开头不是'),
                value: 'not prefix',
            },
            {
                label: __('等于'),
                value: '=',
            },
            {
                label: __('不等于'),
                value: '<>',
            },
            // {
            //     label: __('属于码值'),
            //     value: 'in list',
            // },
            {
                label: __('属于'),
                value: 'belong',
            },
            {
                label: __('为空'),
                value: 'null',
            },
            {
                label: __('不为空'),
                value: 'not null',
            },
        ],
    },
    [FieldTypes.BOOL]: {
        name: __('布尔型'),
        polymerizationOptions: [
            {
                label: __('计数'),
                value: 'COUNT',
                default: true,
            },
        ],
        limitListOptions: [
            {
                label: __('为是'),
                value: 'true',
            },
            {
                label: __('为否'),
                value: 'false',
            },
            {
                label: __('为空'),
                value: 'null',
            },
            {
                label: __('不为空'),
                value: 'not null',
            },
        ],
    },
    [FieldTypes.DATE]: {
        name: __('日期型'),
        polymerizationOptions: [
            {
                label: __('计数'),
                value: 'COUNT',
            },
            {
                label: __('去重计数'),
                value: 'COUNT(DISTINCT)',
                default: true,
            },
        ],
        limitListOptions: [
            {
                label: __('过去'),
                value: `before`,
            },
            {
                label: __('当前'),
                value: `current`,
            },
            {
                label: __('介于'),
                value: `between`,
            },
        ],
    },
    [FieldTypes.DATETIME]: {
        name: __('日期时间型'),
        polymerizationOptions: [
            {
                label: __('计数'),
                value: 'COUNT',
                default: true,
            },
        ],
        limitListOptions: [
            {
                label: __('过去'),
                value: `before`,
            },
            {
                label: __('当前'),
                value: `current`,
            },
            {
                label: __('介于'),
                value: `between`,
            },
        ],
    },
    [FieldTypes.TIMESTAMP]: {
        name: __('时间戳型'),
        polymerizationOptions: [
            {
                label: __('计数'),
                value: 'COUNT',
                default: true,
            },
        ],
        limitListOptions: [
            {
                label: __('过去'),
                value: `before`,
            },
            {
                label: __('当前'),
                value: `current`,
            },
            {
                label: __('介于'),
                value: `between`,
            },
        ],
    },
    [FieldTypes.BINARY]: {
        name: __('二进制'),
        polymerizationOptions: [
            {
                label: __('计数'),
                value: 'COUNT',
                default: true,
            },
        ],
        // 无法识别内容，故不支持限定
        limitListOptions: [],
    },
    [FieldTypes.TIME]: {
        name: __('时间型'),
        polymerizationOptions: [],
        // 无法识别内容，故不支持限定
        limitListOptions: [],
    },
}

/**
 * 无内容限制条件
 */
const noContentLimit = ['true', 'false', 'null', 'not null']

/**
 * 字段错误类型
 */
enum FieldErrorType {
    Empty = 'empty',
    EnEmpty = 'enEmpty',
    Repeat = 'Repeat',
    EnRepeat = 'enRepeat',
    Inconformity = 'inconformity',
    OverLength = 'overlength',
    IllegalCharacter = 'illegalCharacter',
    EnIllegalCharacter = 'enIllegalCharacter',
    LengthAccuracyEmpty = 'lengthAccuracyEmpty',
}

/**
 * 场景分析对应模块类型
 */
enum ModuleType {
    // 场景分析
    SceneAnalysis = 'sceneAnalysis',
    // 库表
    LogicEntityView = 'logic_entity',
    // 自定义库表
    CustomView = 'custom',
}

/**
 * 库表模式
 * @param Model 模式
 * @param More 更多信息
 */
enum ModeType {
    Model = 'model',
    More = 'more',
}

enum ExecError {
    EMPTY = 'empty',

    SERVER = 'server',
}

export {
    menus,
    defaultMenu,
    FormulaError,
    portconfig,
    sceneNodeTemplate,
    FormulaType,
    formulaInfo,
    NodeDataType,
    JoinType,
    fieldInfos,
    FieldTypes,
    groupDate,
    noContentLimit,
    FieldErrorType,
    polymerizationTypeInfo,
    ModuleType,
    ModeType,
    ExecError,
}
