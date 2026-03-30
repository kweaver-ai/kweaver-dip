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
}

// 编码规则/码表的类型
export enum ValueRangeType {
    // 无
    None = 'no',

    // 数据元
    DataElement = 'dataElement',

    // 码表
    CodeTable = 'codeTable',

    // 编码规则
    CodeRule = 'codeRule',

    // 自定义
    Custom = 'custom',

    // 值域
    ValueRange = 'valueRange',
}

// 数据类型映射
export const dataTypeKeyMapping = {
    [DataType.TNUMBER]: 'number',
    [DataType.TINT]: 'int',
    [DataType.TDOUBLE]: 'float',
    [DataType.TDECIMAL]: 'decimal',
    [DataType.TCHAR]: 'char',
    [DataType.TDATE]: 'date',
    [DataType.TDATETIME]: 'datetime',
    [DataType.TBOOLEAN]: 'bool',
    [DataType.TTIME]: 'time',
}

/**
 * 标准数据替换
 * @param data 数据
 * @returns 替换后的数据
 */
export const standardDataReplace = (data) => {
    const {
        data_type,
        data_length,
        data_precision,
        dict_id,
        dict_name_cn,
        rule_id,
        rule_name,
        id,
        name_en,
        relation_type,
    } = data
    return {
        data_type: dataTypeKeyMapping[data_type],
        data_length,
        data_accuracy: data_precision,
        value_range_type: relation_type,
        value_range: dict_id
            ? `${dict_id}>><<${dict_name_cn}`
            : rule_id
            ? `${rule_id}>><<${rule_name}`
            : null,
        standard_status: 'normal',
        standard_id: id,
        name_en,
    }
}

/**
 * 标准数据替换
 * @param data 数据
 * @returns 替换后的数据
 */
export const DataFormStandardReplace = (data) => {
    const {
        data_type,
        data_length,
        data_precision,
        dict_id,
        dict_name_cn,
        rule_id,
        rule_name,
        id,
        name_en,
        relation_type,
    } = data
    return {
        data_type: dataTypeKeyMapping[data_type],
        data_length,
        data_accuracy: data_precision,
        code_table: dict_id,
        encoding_rule: rule_id,
        standard_status: 'normal',
        standard_id: id,
        name_en,
    }
}
