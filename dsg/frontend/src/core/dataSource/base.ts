import { IDataBaseType } from '../apis'

export class StaticDataType {
    dataTypes: Array<IDataBaseType> = defaultDataBaseType
}

export const defaultDataBaseType: Array<IDataBaseType> = [
    {
        olkConnectorName: 'postgresql',
        showConnectorName: 'PostgreSQL（TBase）',
    },
    {
        olkConnectorName: 'sqlserver',
        showConnectorName: 'SQL Server',
    },
    {
        olkConnectorName: 'mysql',
        showConnectorName: 'MySQL',
    },
    {
        olkConnectorName: 'maria',
        showConnectorName: 'MariaDB',
    },
    {
        olkConnectorName: 'oracle',
        showConnectorName: 'Oracle (TDSQL)',
    },
    {
        olkConnectorName: 'hive-hadoop2',
        showConnectorName: 'Apache Hive(hadoop2)',
    },
    {
        olkConnectorName: 'hive-jdbc',
        showConnectorName: 'Apache Hive',
    },
    {
        olkConnectorName: 'clickhouse',
        showConnectorName: 'ClickHouse',
    },
    {
        olkConnectorName: 'doris',
        showConnectorName: 'Apache Doris',
    },
    {
        olkConnectorName: 'hologres',
        showConnectorName: 'Hologres',
    },
    {
        olkConnectorName: 'inceptor-jdbc',
        showConnectorName: 'TDH inceptor',
    },
    {
        olkConnectorName: 'opengauss',
        showConnectorName: 'OpenGauss',
    },
    {
        olkConnectorName: 'gaussdb',
        showConnectorName: 'GaussDB',
    },
    {
        olkConnectorName: 'dameng',
        showConnectorName: 'DM',
    },
    {
        olkConnectorName: 'excel',
        showConnectorName: 'Excel',
    },
    {
        olkConnectorName: 'gbase',
        showConnectorName: 'GBase',
    },
]

// 数据库图标
export const dataBaseIconsList = {
    mysql: {
        outlinedName: 'icon-MySQL',
        coloredName: 'icon-mysql-wubaisebeijingban',
    },

    maria: {
        outlinedName: 'icon-MariaDB',
        coloredName: 'icon-Mariadb-wubaisebeijingban',
    },
    postgresql: {
        outlinedName: 'icon-PostgreSQL',
        coloredName: 'icon-postgre-wubaisebeijingban',
    },
    sqlserver: {
        outlinedName: 'icon-a-SQLSever',
        coloredName: 'icon-a-sqlserver-wubaisebeijingban',
    },
    oracle: {
        outlinedName: 'icon-Oracle2',
        coloredName: 'icon-oracle-wubaisebeijingban',
    },
    'hive-hadoop2': {
        outlinedName: 'icon-Hive',
        coloredName: 'icon-hive-wubaisebeijingban',
    },
    'hive-jdbc': {
        outlinedName: 'icon-Hive',
        coloredName: 'icon-hive-wubaisebeijingban',
    },
    doris: {
        outlinedName: 'icon-a-DORISheise',
        coloredName: 'icon-DORIS-wubaisebeijingban',
    },
    clickhouse: {
        outlinedName: 'icon-a-ClickHouseheise',
        coloredName: 'icon-ClickHouse-wubaisebeijingban',
    },
    hologres: {
        outlinedName: 'icon-hologres-heise',
        coloredName: 'icon-hologres-caise',
    },
    'inceptor-jdbc': {
        outlinedName: 'icon-inceptor-heise',
        coloredName: 'icon-inceptor-caise',
    },
    opengauss: {
        outlinedName: 'icon-opengauss-heise',
        coloredName: 'icon-opengauss-caise',
    },
    gaussdb: {
        outlinedName: 'icon-gaussdb-heise',
        coloredName: 'icon-gaussdb-caise',
    },
    dameng: {
        outlinedName: 'icon-dameng-heise',
        coloredName: 'icon-dameng-caise',
    },
    excel: {
        outlinedName: 'icon-xls',
        coloredName: 'icon-xls',
    },
    gbase: {
        outlinedName: 'icon-GBase-heise',
        coloredName: 'icon-GBase-caise',
    },
}
