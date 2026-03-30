import { Timeline } from 'antd'
import moment from 'moment'
import { feedbackOpTypeMap } from '../helper'
import { DCFeedbackProcessLog } from '@/core'
import styles from '../styles.module.less'
import __ from '../locale'

const OperateHistory = ({ log }: { log?: DCFeedbackProcessLog[] }) => {
    return (
        <div className={styles.operateHistory}>
            <div className={styles.recordTitle}>{__('处理记录')}</div>
            <Timeline>
                {log?.map((i, index) => (
                    <Timeline.Item
                        key={index}
                        dot={<div className={styles.dot} />}
                    >
                        <div>
                            <div>{feedbackOpTypeMap[i.op_type]?.text}</div>
                            <div className={styles.op_user_wrapper}>
                                <div
                                    title={i.op_user_name}
                                    className={styles.op_user_name}
                                >
                                    {__('由')}
                                    {i.op_user_name}
                                    {__('提交')}
                                </div>
                                <div className={styles.op_time}>
                                    {moment(i.created_at).format(
                                        'YYYY-MM-DD HH:mm:ss',
                                    )}
                                </div>
                            </div>
                        </div>
                    </Timeline.Item>
                ))}
            </Timeline>
        </div>
    )
}

export default OperateHistory
