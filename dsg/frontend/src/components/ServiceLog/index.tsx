import React, { memo } from 'react'
import LogTable from './LogTable'
import __ from './locale'
import styles from './styles.module.less'

/**
 * 服务日志
 */
const ServiceLog = (): React.ReactElement => {
    return (
        <div className={styles.serviceLog}>
            <LogTable />
        </div>
    )
}

export default memo(ServiceLog)
