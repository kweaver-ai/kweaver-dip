/**
 * 状态
 * @param {ACTIVE} 启用
 * @param {DEACTIVE} 停用
 */
export const enum StdStatus {
    ACTIVE = 1,
    DEACTIVE = 0,
}

/**
 * 规则来源
 * @param {SYSTEM} 系统内置
 * @param {CUSTOM} 用户自定义
 */
export const enum Source {
    ALL = '',
    SYSTEM = 0,
    CUSTOM = 1,
}

export interface ISearchCondition {
    catalog_id: number
    status?: StdStatus
    source?: Source
    keyword?: string
    offset?: number
    limit?: number
    sort?: string
    direction?: string
}
