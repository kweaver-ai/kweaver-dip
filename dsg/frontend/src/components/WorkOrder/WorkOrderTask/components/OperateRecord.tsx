import React, { useEffect, useState } from 'react'
import { Timeline } from 'antd'
import { getOperateLog } from '@/core/apis/taskCenter'
import { IOperateLog } from '@/core/apis/taskCenter/index.d'
import { formatTime } from '@/utils'
import __ from './locale'
import { formatError } from '@/core'
import Loader from '@/ui/Loader'
import styles from './styles.module.less'

interface IOperateRecord {
    taskId: string
}

const OperateRecord: React.FC<IOperateRecord> = ({ taskId }) => {
    const [loading, setLoading] = useState(false)
    const [operateList, setOperateList] = useState<IOperateLog[]>([])

    const getOperateLogs = async () => {
        try {
            setLoading(true)
            const res = await getOperateLog({
                obj: 'task',
                obj_id: taskId,
                limit: 1000,
            })
            setOperateList(res.entries)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getOperateLogs()
    }, [taskId])

    return (
        <div className={styles.timelineWrapper}>
            {loading ? (
                <div className={styles.loading}>
                    <Loader />
                </div>
            ) : (
                <Timeline>
                    <Timeline.Item>
                        <div className={styles.name}>{__('当前')}</div>
                    </Timeline.Item>
                    {operateList.map((item) => (
                        <Timeline.Item key={item.id}>
                            <div className={styles.name}>
                                {item.created_by_name} {item.name}
                            </div>
                            <div className={styles.result}>{item.result}</div>
                            <div className={styles.time}>
                                {item.created_at.toString().length === 10
                                    ? formatTime(item.created_at * 1000)
                                    : formatTime(item.created_at)}
                            </div>
                        </Timeline.Item>
                    ))}
                </Timeline>
            )}
        </div>
    )
}
export default OperateRecord
