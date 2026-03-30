import React, { ReactNode } from 'react'
import {
    MysqlColored,
    MariadbColored,
    PostgreColored,
    SQLServerColored,
    OracleColored,
    HiveColored,
    MysqlOutlined,
    MariaDBOutlined,
    PostgresqlOutlined,
    SqlServerOutlined,
    OracleOutlined,
    HiveOutlined,
} from '@/icons'
import { DataBaseType } from './const'

interface IGetIcon {
    type: DataBaseType | string
    className?: string
    color?: boolean
    fontSize?: number
    iconType?: 'outlined' | 'colored'
}

const Icons: React.FC<IGetIcon> = ({
    type,
    color,
    fontSize = 52,
    iconType = 'colored',
}) => {
    const getIcon = (t: DataBaseType | string) => {
        switch (t) {
            case DataBaseType.MYSQL:
                return iconType === 'colored' ? (
                    <MysqlColored style={{ fontSize }} />
                ) : (
                    <MysqlOutlined
                        style={{ color: color || 'inherit', fontSize }}
                    />
                )
            case DataBaseType.MariaDB:
                return iconType === 'colored' ? (
                    <MariadbColored style={{ fontSize }} />
                ) : (
                    <MariaDBOutlined
                        style={{ color: color || 'inherit', fontSize }}
                    />
                )
            case DataBaseType.PostgreSQL:
                return iconType === 'colored' ? (
                    <PostgreColored style={{ fontSize }} />
                ) : (
                    <PostgresqlOutlined
                        style={{ color: color || 'inherit', fontSize }}
                    />
                )
            case DataBaseType.SQLServer:
                return iconType === 'colored' ? (
                    <SQLServerColored style={{ fontSize }} />
                ) : (
                    <SqlServerOutlined
                        style={{ color: color || 'inherit', fontSize }}
                    />
                )
            case DataBaseType.Oracle:
                return iconType === 'colored' ? (
                    <OracleColored style={{ fontSize }} />
                ) : (
                    <OracleOutlined
                        style={{ color: color || 'inherit', fontSize }}
                    />
                )
            case DataBaseType.Hive:
                return iconType === 'colored' ? (
                    <HiveColored style={{ fontSize }} />
                ) : (
                    <HiveOutlined
                        style={{ color: color || 'inherit', fontSize }}
                    />
                )
            default:
                return <div />
        }
    }
    return getIcon(type)
}
export default Icons
