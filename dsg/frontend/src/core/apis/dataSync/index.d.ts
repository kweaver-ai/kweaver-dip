export interface SyncSearchParams {
    // 当前页码，默认1，大于等于1
    offset?: number

    // 每页条数，默认10，大于等于1
    limit?: number

    // 排序类型，默认按created_at排序，可选updated_at
    sort?: string

    // 排序方向，默认desc降序，可选asc升序
    direction?: string

    step?: string

    // 模型id
    model_uuid: string

    // 是否调度执行
    scheduleExecute?: string

    // 状态 RUNNING_EXECUTION(进行中)/ FAILURE（失败）/SUCCESS（成功）
    status?: string
}

export interface logsReturnData {
    //
    code: string

    // 描述信息
    description: string

    //
    solution: string
    // 数据
    data: LogsListData
}

export interface LogsListData {
    // 当前页码
    current_page: number
    // 名称
    name: string

    // 总数
    total: number

    // 列表数据
    total_list: Array<LogsData>

    // 总页数
    total_page: number

    // 唯一标识
    uuid: string
}

export interface LogsData {
    // 模型标识
    model_uuid: string

    // 模型名称
    model_name: string

    // 开始时间
    start_time: string

    // 结束时间
    end_time: string

    // 模型名称
    sync_count: number

    // 同步时间
    sync_time: string

    // 同步方式
    sync_method: string

    // 运行状态
    status: string
}
