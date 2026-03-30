import { SortDirection, SortType } from '@/core'
import __ from './locale'

/*
 * 排序菜单 标准
 */
export const menus = [
    { key: SortType.NAME, label: __('按名称排序') },
    // { key: SortType.CREATED, label: __('按创建时间排序') },
    // { key: SortType.UPDATED, label: __('按更新时间排序') },
]
export const defaultMenu = {
    key: SortType.NAME,
    sort: SortDirection.ASC,
}

export enum VIEWMODE {
    DOMAIN = 'domain',
    BARCHITECURE = 'business-architecture',
}

export enum DataBaseType {
    MYSQL = 'mysql',
    MariaDB = 'maria',
    PostgreSQL = 'postgresql',
    SQLServer = 'sqlserver',
    Oracle = 'oracle',
    Hive = 'hive-hadoop2',
}

export const DataBaseArray = [
    'postgresql',
    'oracle',
    'sqlserver',
    'hologres',
    'opengauss',
    'gaussdb',
]

// 支持双模式认证
export const DoubleAuthModel = ['inceptor-jdbc']

// 认证模式
export enum AuthModel {
    // 用户名密码
    PASSWORD = 'password',

    // Token 模式
    TOKEN = 'token',
}
/**
 * 数据库表单配置
 *
 * @description
 * 这个常量对象定义了不同类型数据源的表单字段配置。
 * 它用于动态生成或验证数据源连接表单。
 *
 * @property {string[]} excel - Excel 数据源的表单字段列表
 *   - 'path': 可能表示 Excel 文件的路径
 *   - 'host': 可能用于网络位置的 Excel 文件
 *   - 'port': 如果 Excel 文件通过特定端口访问
 *   - 'authModel': 认证模式，可能用于访问受保护的 Excel 文件
 *
 * @property {string[]} default - 默认数据源（可能是关系型数据库）的表单字段列表
 *   - 'schema': 数据库 schema
 *   - 'host': 数据库主机地址
 *   - 'port': 数据库端口
 *   - 'authModel': 数据库认证模式
 */
export const DataBaseFormConfig = {
    excel: ['excel_protocol', 'host', 'port', 'authModel', 'excel_base'],
    default: ['database_name', 'schema', 'host', 'port', 'authModel'],
}

export const changeTestData = (values) => {
    return {
        catalogName: values.name,
        connectorName: values.type,
        properties: {
            'excel.protocol': values.excel_protocol,
            'excel.host': values.host,
            'excel.port': values.port,
            'excel.username': values.username,
            'excel.password': values.password,
            'excel.base': values.excel_base,
        },
    }
}

// 数据源详情配置
export const DataDetailConfig = {
    excel: [
        'name',
        'source_type',
        'info_system_name',
        'excel_protocol',
        'host',
        'port',
        'username',
        'password',
        'excel_base',
        'updated_by_uid',
        'updated_at',
    ],
    default: [
        'name',
        'source_type',
        'info_system_name',
        'database_name',
        'connect_status',
        'schema',
        'host',
        'port',
        'guardian-token',
        'username',
        'password',
        'updated_by_uid',
        'updated_at',
    ],
}

/**
 * 根据数据源类型获取对应的连接协议
 * @param type 数据源类型
 * @returns 连接协议字符串
 * @description
 * - hive-hadoop2: 返回 'thrift'
 * - hive-jdbc: 返回 'jdbc'
 * - excel: 返回 'https'
 * - 其他数据源: 返回 'jdbc'
 */
export const getConnectProtocol = (type: string): string => {
    if (!type) {
        return 'jdbc'
    }

    // hive-hadoop2 类型返回 thrift
    if (type === 'hive-hadoop2') {
        return 'thrift'
    }

    // hive-jdbc 类型返回 jdbc
    if (type === 'hive-jdbc') {
        return 'jdbc'
    }

    // excel 类型返回 https
    if (type === 'excel') {
        return 'https'
    }

    // 其他数据源默认返回 jdbc
    return 'jdbc'
}
