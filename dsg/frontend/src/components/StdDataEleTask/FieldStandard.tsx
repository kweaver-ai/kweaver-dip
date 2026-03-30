import React from 'react'
import __ from './locale'
import StdTaskToBeExec from './StdTaskToBeExec'
import styles from './styles.module.less'

interface IFieldStandard {
    taskId: string
    tabKey: string
}

// 执行新建标准任务页面

const FieldStandard: React.FC<IFieldStandard> = ({ taskId, tabKey }) => {
    return (
        <div className={styles.fieldStandardWrapper}>
            <div className={styles.tabContent}>
                <StdTaskToBeExec taskId={taskId} />
            </div>
        </div>
    )
}

export default FieldStandard
