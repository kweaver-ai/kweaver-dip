/**
 * 根据数据量大小格式化比率，控制精度
 * @param numerator 分子
 * @param denominator 分母
 * @returns 格式化后的比率字符串
 */
export const formatRateByDataSize = (
    numerator: number,
    denominator: number,
): string | undefined => {
    if (
        denominator === 0 ||
        denominator === null ||
        denominator === undefined
    ) {
        return undefined
    }
    if (numerator === null || numerator === undefined) {
        return undefined
    }
    const rate = (numerator / denominator) * 100
    // 根据数据量大小确定精度
    let precision: number
    if (denominator <= 10000) {
        precision = 2 // 10000以内 最多2位
    } else if (denominator <= 1000000) {
        precision = 4 // 1w-100w 最多4位
    } else {
        precision = 6 // 100w+ 最多6位
    }
    // 先多保留一位进行四舍五入，然后再按保留位数截取
    const tempPrecision = precision + 1
    const tempRoundedRate =
        Math.round(rate * 10 ** tempPrecision) / 10 ** tempPrecision
    const roundedRate =
        Math.round(tempRoundedRate * 10 ** precision) / 10 ** precision
    // 如果是整数，直接返回整数
    if (roundedRate % 1 === 0) {
        return `${Math.floor(roundedRate)}%`
    }
    return `${roundedRate}%`
}

/**
 * 千分位格式化
 * @param value 需要格式化的数字或字符串
 * @returns 千分位格式化后的字符串
 */
export const formatThousand = (
    value?: number | string,
    defaultValue = '--',
): string => {
    // 处理 null/undefined
    if (value == null) {
        return defaultValue
    }
    // 转换为字符串
    const str = String(value)
    // 处理空字符串
    if (str === '') {
        return defaultValue
    }
    // 处理非数字字符串
    if (!/^-?\d+(\.\d+)?$/.test(str)) {
        return str
    }
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, `,`)
}
