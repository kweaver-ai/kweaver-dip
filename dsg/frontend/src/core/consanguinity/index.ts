/**
 * 节点类型
 */
export enum NodeType {
    // 库表
    LOGIC_VIEW = 'logic_view',

    // 数据表
    DATA_TABLE = 'data_table',

    // 表单库表
    FORM_VIEW = 'form_view',

    // 自定义表单
    CUSTOM_VIEW = 'custom_view',

    // 指标
    INDICATOR = 'indicator',
}

/**
 * 将数组转换为对象
 * @param array 数组
 * @returns 对象
 */
export const changeArrayToObject = (
    array: Array<{
        key: string
        value: string
    }>,
): any => {
    return array.reduce((obj, item) => {
        return {
            ...obj,
            [item.key]: item.value,
        }
    }, {})
}

// 指标图标颜色list
export const IndicatorColor = {
    // 原子指标
    atomic: '#0091ff',
    // 衍生指标
    derived: '#ff822f',
    // 复合指标
    recombination: '#3ac4ff',
}
