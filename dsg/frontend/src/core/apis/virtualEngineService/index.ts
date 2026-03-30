import JSONBig from 'json-bigint'
import BigNumber from 'bignumber.js'
import requests from '@/utils/request'
import {
    IConnectorConfig,
    IConnectorMapParams,
    IConnectorTargetMap,
    IVirtualEngineExample,
    IDataBaseType,
    ITestDataBaseConnect,
    ISheetFieldsParams,
    IDatabaseConnectParams,
    IDatabaseConnectResponse,
} from './index.d'

// 获取所有支持的数据源
export const getConnectors = (): Promise<{
    connectors: Array<IDataBaseType>
}> => {
    return requests.get(`/api/data-connection/v1/datasource/connectors`)
}

// 获取数据源图标
export const getConnectorIcon = (connectorName: string): Promise<string> => {
    return requests.get(
        `/api/virtual_engine_service/v1/connectors/images/${connectorName}`,
    )
}

// 查询对应数据源配置项
export const getConnectorConfig = (
    connectorName: string,
): Promise<IConnectorConfig> => {
    return requests.get(
        `/api/virtual_engine_service/v1/connectors/config/${connectorName}`,
    )
}

/**
 * 获取样例数据
 * @param params
 * @returns
 */
export const getVirtualEngineExample = (params: IVirtualEngineExample) => {
    const { user, catalog, schema, table, ...rest } = params || {}
    const headers: Record<string, string> = {
        'X-Presto-User': `${user}`,
    }

    return requests.get(
        `/api/virtual_engine_service/v1/preview/${catalog}/${schema}/${table}`,
        {
            action: 'read', //     // 样例数据目前均走 action: read
            ...rest, // TODO: 还原至2.0.0.3版本:样例数据支持通过传入user_id获取对应权限的数据
        },
        {
            headers,
            transformResponse: [
                (data) => {
                    try {
                        // 解决 BigInt 或 Long数据精度丢失问题
                        const ret = JSONBig.parse(data)

                        if (ret?.data) {
                            const filterData = ret.data.map((item) => {
                                return (item || []).map((o) =>
                                    BigNumber.isBigNumber(o) ? `${o}` : o,
                                )
                            })
                            ret.data = filterData
                        }
                        return ret
                    } catch (e) {
                        return { data: [] }
                    }
                },
            ],
        },
    )
}

// 根据数据源获取对应数据源和虚拟化引擎类型映射关系
export const getConnectorTypeMap = (
    params: IConnectorMapParams,
): Promise<IConnectorTargetMap> => {
    return requests.post(
        `/api/virtual_engine_service/v1/connectors/type/mapping`,
        params,
    )
}

// 验证SQL语法
export const validateSqlSyntax = (sql: string, user?: string) => {
    const sqlStr = `Explain ${sql}`
    return requests.post(`/api/virtual_engine_service/v1/fetch`, sqlStr, {
        headers: {
            'Content-Type': 'text/plain',
            'X-Presto-User': `${user}`,
        },
    })
}

/**
 *  测试数据源是否可连接
 * @param params
 * @returns status: 'true'/'false'
 */
export const testDataBaseConnect = (
    params: ITestDataBaseConnect,
): Promise<{ status: boolean }> => {
    return requests.post(
        `/api/virtual_engine_service/v1/catalog/connect`,
        params,
    )
}

/**
 * 获取Excel文件列表
 * @param catalog
 * @returns
 */
export const getExcelList = (
    catalog: string,
): Promise<{ data: Array<string>; total: number }> => {
    return requests.get(`/api/virtual_engine_service/v1/excel/files/${catalog}`)
}

/**
 * 获取sheets列表
 * @param params
 * @returns
 */
export const getExcelSheetList = (params: {
    catalog: string
    file_name: string
}): Promise<{ data: Array<string>; total: number }> => {
    return requests.get(`/api/virtual_engine_service/v1/excel/sheet`, params)
}

/**
 * 获取Excel表单字段
 * @param params
 * @returns
 */
export const getExcelSheetsFields = (
    params: ISheetFieldsParams,
): Promise<{
    data: Array<{ column: string; type: string }>
    total: number
}> => {
    return requests.post(`/api/virtual_engine_service/v1/excel/columns`, params)
}

/**
 * 连接数据库
 * @param params 数据库连接参数
 * @returns 连接状态
 */
export const testConnectDatabase = (
    params: IDatabaseConnectParams,
): Promise<IDatabaseConnectResponse> => {
    return requests.post(`/api/virtual_engine_service/v1/connect`, params)
}
