const enum ViewModel {
    // 编辑
    ModelEdit = 'ModelEdit',

    // 预览
    ModelView = 'ModelView',
}

// 节点属性
const enum NodeAttribute {
    // 入表
    InForm = 'inForm',

    // 出表
    outForm = 'outForm',
}

/**
 * 操作编辑模式下的显示
 */
const enum OptionModel {
    // 创建模型
    CreateModel = 'createModel',

    // 编辑模型
    EditModel = 'EditModel',

    // 新建指标
    CreateMetric = 'createMetric',

    // 编辑指标
    EditMetric = 'editMetric',

    // 指标详情
    MetricDetail = 'metricDetail',
}

const enum ViewType {
    // 以表查看
    Form = 'form',

    // 以字段查看
    Field = 'field',
}

const enum VisualType {
    // 业务视角
    Business = 'business',

    // 技术视角
    Technology = 'technology',
}

const dataTypeMapping = {
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
    datetime: ['datetime', 'datetime2', 'smalldatetime'],
    timestamp: ['timestamp', 'timestamptz', 'timestamp with time zone'],
    time: ['time', 'timetz', 'time with time zone'],
    interval: ['interval'],
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

export {
    ViewModel,
    NodeAttribute,
    OptionModel,
    ViewType,
    VisualType,
    dataTypeMapping,
}
