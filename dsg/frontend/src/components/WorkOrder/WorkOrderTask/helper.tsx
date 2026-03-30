import {
    FileDoneOutlined,
    QuestionCircleOutlined,
    SolutionOutlined,
} from '@ant-design/icons'
import { Tooltip } from 'antd'
import { TaskExecutableStatus } from '@/core'
import { TaskExecutableStatusText } from './components/helper'
import { MyTaskType } from './const'
import __ from './locale'
import styles from './styles.module.less'

/**
 * 左侧区类型
 */
export const taskClassification = [
    {
        type: MyTaskType.PROCESSED,
        text: __('我执行的'),
        icon: <FileDoneOutlined />,
        isRoot: true,
        access: 'manageDataUnderstandingWorkOrderAndTask',
    },
    {
        type: TaskExecutableStatus.EXECUTABLE,
        text: TaskExecutableStatusText[TaskExecutableStatus.EXECUTABLE],
        access: 'manageDataUnderstandingWorkOrderAndTask',
    },
    {
        type: TaskExecutableStatus.BLOCKED,
        text: TaskExecutableStatusText[TaskExecutableStatus.BLOCKED],
        access: 'manageDataUnderstandingWorkOrderAndTask',
    },
    {
        type: TaskExecutableStatus.COMPLETED,
        text: TaskExecutableStatusText[TaskExecutableStatus.COMPLETED],
        access: 'manageDataUnderstandingWorkOrderAndTask',
    },
    {
        type: TaskExecutableStatus.INVALID,
        text: TaskExecutableStatusText[TaskExecutableStatus.INVALID],
        access: 'manageDataUnderstandingWorkOrderAndTask',
    },
    {
        type: MyTaskType.CREATED,
        text: __('我创建的'),
        icon: <SolutionOutlined />,
        isRoot: true,
        access: 'manageDataUnderstandingWorkOrderAndTask',
    },
]

export const getTaskSortHelpComponent = (label: string) => {
    return (
        <div className={styles.sortSelectItem}>
            <span>{label}</span>
            <Tooltip
                color="#fff"
                placement="bottomRight"
                overlayStyle={{
                    maxWidth: 'fit-content',
                }}
                title={
                    <div
                        className={styles.sortDefaultItemTip}
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                        }}
                    >
                        <div className={styles.title}>
                            {__('默认排序规则：逾期程度 >任务优先级>更新时间')}
                        </div>
                        <div className={styles.content}>
                            {__(
                                '逾期程度：是指任务截止时间与当前日期的差值，逾期天数多就排在前面；还未逾期但即将逾期的任务，剩下的时间越短则排在越前面。',
                            )}
                        </div>

                        <div className={styles.content}>
                            {__(
                                '任务优先级：若任务没有截止时间，则以任务优先级排序（非常紧急>紧急>普通）；若任务有截止时间，则这部分任务先以逾期程度排序。',
                            )}
                        </div>
                        <div className={styles.content}>
                            {__(
                                '更新时间：若任务没有截止时间且优先级相同，则以更新时间排序。',
                            )}
                        </div>
                    </div>
                }
            >
                <QuestionCircleOutlined style={{ color: 'rgba(0,0,0,0.45)' }} />
            </Tooltip>
        </div>
    )
}
