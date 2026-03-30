export type IModuleMap = Record<string, Record<string, string> | string>

/**
 * 按指定属性格式化模块 Map 键值对
 * @param module 模块Map对象
 * @param attrStr 属性名  默认 description
 * @returns
 */
const formatCodeValue = (
    module: IModuleMap,
    attrStr = 'description',
): IModuleMap => {
    return Object.keys(module).reduce(
        (prev, cur) => ({ ...prev, [cur]: module[cur][attrStr] }),
        {},
    )
}

/**
 * 合并服务下所有模块 K:V
 * @param maps 各模块map映射对象数组
 */
export const combineToKV = (...maps: Array<IModuleMap>): IModuleMap => {
    return maps.reduce((prev: IModuleMap, cur: IModuleMap) => {
        const moduleKV = formatCodeValue(cur)
        return { ...prev, ...moduleKV }
    }, {})
}

/**
 * 转换KV对象为LocaleData, 移除重复数据, 若使用ServiceCodeMessage，需临时移除formatCodeValue中的__()
 * @param codeMessage
 * @returns
 */
export const convertLocaleData = (codeMessage: Record<string, string>) => {
    const keys = new Set(Object.values(codeMessage))
    return Array.from(keys).map((k) => [k, k, k])
}
