import { HTMLProps } from 'react'
import { BinaryTypeOutlined, FontIcon, UnkownTypeOutlined } from '@/icons'
import { IFontIcon } from '@/icons/FontIcon'

export const enum ViewModel {
    // 建模人员编辑
    ModelEdit = 'edit',

    // 建模人员预览
    ModelView = 'view',

    // 加工人员
    Processing = 'Processing',
}

export const dataTypeMapping = {
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
        'int1',
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
        'money',
        'smallmoney',
        'oid',
        'smallserial',
        'serial4',
        'bigserial',
        'serial',
        'binary_double',
        'binary_float',
    ],
    bool: ['boolean', 'bool'],
    date: ['date', 'year'],
    datetime: [
        'datetime',
        'datetime2',
        'smalldatetime',
        'timestamp',
        'timestamptz',
        'timestamp with time zone',
    ],
    // timestamp: ['timestamp', 'timestamptz', 'timestamp with time zone'],
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
        'bit',
    ],
}

export const getCommonDataType = (type: string) => {
    switch (true) {
        case dataTypeMapping.char.includes(type):
            return 'char'
        case dataTypeMapping.int.includes(type):
            return 'int'
        case dataTypeMapping.float.includes(type):
            return 'float'
        case dataTypeMapping.decimal.includes(type):
            return 'decimal'
        case dataTypeMapping.number.includes(type):
            return 'number'
        case dataTypeMapping.bool.includes(type):
            return 'bool'
        case dataTypeMapping.date.includes(type):
            return 'date'
        case dataTypeMapping.datetime.includes(type):
            return 'datetime'
        case dataTypeMapping.time.includes(type):
            return 'time'
        case dataTypeMapping.binary.includes(type):
            return 'binary'

        default:
            return ''
    }
}
export const minDataLengthCommon = 1
export const maxDataLengthString = 65535
export const maxDataLengthDecimal = 38

/**
 * 字段类型图标
 */
interface FieldTypeIconProps extends HTMLProps<HTMLSpanElement> {
    dataType: string
}

/**
 * 字段类型图标
 * @param param0
 * @returns
 */
export const FieldTypeIcon = ({ dataType, ...props }: FieldTypeIconProps) => {
    switch (true) {
        case dataTypeMapping.char.includes(dataType):
            return <FontIcon {...(props as any)} name="icon-wenbenxing" />
        case dataTypeMapping.int.includes(dataType):
            return <FontIcon {...(props as any)} name="icon-zhengshuxing" />
        case dataTypeMapping.float.includes(dataType):
            return <FontIcon {...(props as any)} name="icon-xiaoshuxing" />
        case dataTypeMapping.decimal.includes(dataType):
            return <FontIcon {...(props as any)} name="icon-gaojingduxing" />
        case dataTypeMapping.datetime.includes(dataType):
            return <FontIcon {...(props as any)} name="icon-riqishijianxing" />
        case dataTypeMapping.date.includes(dataType):
            return <FontIcon {...(props as any)} name="icon-riqixing" />
        case dataTypeMapping.time.includes(dataType):
            return <FontIcon {...(props as any)} name="icon-shijianchuoxing" />
        case dataTypeMapping.interval.includes(dataType):
            return <FontIcon {...(props as any)} name="icon-shijianduan11" />
        case dataTypeMapping.bool.includes(dataType):
            return <FontIcon {...(props as any)} name="icon-buerxing" />
        case dataTypeMapping.binary.includes(dataType):
            return <BinaryTypeOutlined {...(props as any)} />
        default:
            return <UnkownTypeOutlined {...(props as any)} />
    }
}
