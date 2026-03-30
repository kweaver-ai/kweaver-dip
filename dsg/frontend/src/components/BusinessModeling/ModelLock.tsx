import React, { useEffect, useState } from 'react'
import classnames from 'classnames'
import { LockColored } from '@/icons'
import __ from './locale'
import styles from './styles.module.less'
import { formatError, getTaskDetailByProcessId } from '@/core'

interface IModelLock {
    processId: string
}
const ModelLock: React.FC<IModelLock> = ({ processId }) => {
    const [proName, setProName] = useState('')
    const getTaskInfo = async () => {
        try {
            if (!processId) return
            const res = await getTaskDetailByProcessId(processId)
            setProName(res.project_name)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        getTaskInfo()
    }, [processId])

    return (
        <div className={styles['lock-card']}>
            <LockColored className={styles['lock-icon']} />
            <div className={styles['lock-desc']}>
                {__('模型已在项目中创建')}
            </div>
            <div className={styles['lock-desc']}>
                {__('项目结束后可查看或编辑')}
            </div>
            <div className={styles['project-name']}>
                {__('项目：${projectName}', { projectName: proName || '--' })}
            </div>
        </div>
    )
}

export default ModelLock
