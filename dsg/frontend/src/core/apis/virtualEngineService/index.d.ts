export interface IGetConnectorIcon {
    image: string
}

export interface IConnectorConfigType {
    sourceType: string
    olkSearchType: string
    olkWriteType: string
    // 0 不存在精度和长度 1 存在长度 2 存在长度和精度
    precisionFlag: number

    // 最小长度
    minTypeLength?: number

    // 最大长度
    maxTypeLength?: number
}
export interface IConnectorConfig {
    connectorName: string
    schemaExist: string
    url: string
    type: IConnectorConfigType[]
}

/**
 * @param index 类型索引
 * @param sourceTypeName 原始数据类型名称
 * @param precision 类型长度
 * @param decimalDigits 类型精度
 */
export interface IConnectorMapSourceType {
    index: number
    sourceTypeName: string
    precision?: number
    decimalDigits?: number
}

/**
 * @param sourceConnectorName 原始数据源标识
 * @param targetConnectorName 目标数据源标识
 * @param type 数据类型集合
 */
export interface IConnectorMapParams {
    sourceConnectorName: string
    targetConnectorName: string
    type: IConnectorMapSourceType[]
}

/**
 * @param index 类型索引
 * @param targetTypeName 目标数据类型名称
 * @param precision 类型长度
 * @param decimalDigits 类型精度
 */
export interface IConnectorMapTargetType {
    index: number
    targetTypeName: string
    precision?: number
    decimalDigits?: number
}

/**
 * @param targetConnectorName 目标数据源标识
 * @param type 数据类型集合
 */
export interface IConnectorTargetMap {
    targetConnectorName: string
    type: IConnectorMapTargetType[]
}

export interface IVirtualEngineExample {
    catalog: string
    schema: string
    table: string
    user?: string
    limit?: number
    type?: number
    user_id?: string
    // a,b,c
    columns?: string
    // read,download
    action?: string
}

export interface IDataBaseType {
    olkConnectorName: string
    showConnectorName: string
    olk_connector_name?: string
    show_connector_name?: string
}

export interface ITestDataBaseConnect {
    //
    catalogName: string
    connectorName: string
    properties: {
        'excel.protocol': string
        'excel.host': string
        'excel.port': string
        'excel.username': string
        'excel.password': string
        'excel.base': string
    }
}

/**
 * @param catalog 目录
 */
export interface ISheetFieldsParams {
    // 目录
    catalog: string
    // 文件名
    file_name: string
    // 表单
    sheet: string
    // 所有表单
    all_sheet: boolean
    // 表单作为新列
    sheet_as_new_column: boolean
    // 开始单元格
    start_cell: string
    // 结束单元格
    end_cell: string
    // 是否有表头
    has_headers: boolean
}

/**
 * 数据库连接参数
 */
export interface IDatabaseConnectParams {
    // 数据库类型
    type: string
    // 连接基础数据
    bin_data: {
        // 数据库名称
        database_name: string
        // 连接协议
        connect_protocol: string
        // 主机地址
        host: string
        // 端口号
        port: number
        // 账户名
        account: string
        // 密码
        password: string
        // 数据库模式
        schema?: string
    }
}

/**
 * 数据库连接响应
 */
export interface IDatabaseConnectResponse {
    // 连接状态
    status: boolean
}
