import React from 'react'
import classnames from 'classnames'
import { requireStatus } from './const'
import styles from './styles.module.less'

interface IStatus {
    status: string
}
const Status: React.FC<IStatus> = ({ status }) => {
    return (
        <div
            className={classnames(
                styles[requireStatus[status]?.class],
                styles.requireStatus,
            )}
        >
            {requireStatus[status]?.name}
        </div>
    )
}
export default Status
