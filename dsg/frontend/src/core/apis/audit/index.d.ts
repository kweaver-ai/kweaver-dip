/**
 * 审计日志请求条件
 */
export interface IAuditEventFilter {
    type: string // 指定类型 'Management'-管理 'Operation'-操作 'Login'-登录
    levels: string[] // 指定日志级别
    operations?: string[] // 指定操作
    time_range: {
        // 指定时间段
        start: number // 开始时间
        end: number // 结束时间
    }
    operator_names?: string[] // 指定操作者
    operator_departments?: string[] // 指定操作者所属部门
    operator_agent_ips?: string[] // 指定操作者代理IP
    descriptions?: string[] // 指定描述
    details?: string[] // 指定详情
}

/**
 * 审计日志数据
 */
export interface IAuditEventItem {
    timestamp: string // 审计日志发生的时间，格式：RFC3339
    level: string // 日志级别
    description: string // 描述
    operator: {
        type: string // 操作者类型
        id: string // 操作者的 ID
        name: string // 操作者的显示名称
        departments: {
            id: string // 部门 ID
            name: string // 部门名称
        }[]
        agent: {
            ip: string // 操作者代理的 IP
            type: string // 操作者代理的类型
        }
    }
    operation: string // 操作类型
    detail: any // 详情，具体定义，每种资源不同
}
