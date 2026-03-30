import { Space } from 'antd'
import { useState, useEffect } from 'react'
import styles from './styles.module.less'
import __ from '../locale'
import StatusStatistics from './StatusStatistics'
import DepartmentStatistics from './DepartmentStatistics'
import TypeStatistics from './TypeStatistics'
import CallStatistics from './CallStatistics'
import {
    IInterfaceDepartmentStatistics,
    IInterfaceStatusStatistics,
} from '@/core/apis/dataApplicationService/index.d'
import {
    formatError,
    getInterfaceDepartmentStatistics,
    getInterfaceStatusStatistics,
} from '@/core'
import { initInterfaceStatusStatistics } from './const'

const Overview = () => {
    const [interfaceStatusStatistics, setInterfaceStatusStatistics] =
        useState<IInterfaceStatusStatistics>(initInterfaceStatusStatistics)
    const [interfaceDepartmentStatistics, setInterfaceDepartmentStatistics] =
        useState<IInterfaceDepartmentStatistics>()

    const getStatusStatistics = async () => {
        try {
            const res = await getInterfaceStatusStatistics()
            setInterfaceStatusStatistics(res)
        } catch (error) {
            formatError(error)
        }
    }

    const getDepartmentStatistics = async () => {
        try {
            const res = await getInterfaceDepartmentStatistics()
            setInterfaceDepartmentStatistics(res)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        getStatusStatistics()
        getDepartmentStatistics()
    }, [])

    return (
        <div className={styles['interface-service-overview']}>
            <div className={styles['top-container']}>
                <div className={styles['top-left']}>
                    <StatusStatistics
                        totalStatistics={
                            interfaceStatusStatistics?.total_statistics
                        }
                    />
                </div>
                <div className={styles['top-right']}>
                    <DepartmentStatistics
                        data={interfaceDepartmentStatistics}
                    />
                </div>
            </div>
            <div className={styles['mid-container']}>
                <TypeStatistics
                    generateStatistics={
                        interfaceStatusStatistics.generate_statistics
                    }
                    registerStatistics={
                        interfaceStatusStatistics.register_statistics
                    }
                />
            </div>
            <div className={styles['bottom-container']}>
                <CallStatistics />
            </div>
        </div>
    )
}

export default Overview
