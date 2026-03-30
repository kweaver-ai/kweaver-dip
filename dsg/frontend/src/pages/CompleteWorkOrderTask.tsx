import { memo, useContext } from 'react'
import DataUndsListContent from '@/components/DataComprehension/DataUndsListContent'
import { RescCatlgType } from '@/components/ResourcesDir/const'
import { TaskInfoContext } from '@/context'
import { TaskType } from '@/core'
import styles from './styles.module.less'

import ExecuteWorkOrderTask from '@/components/WorkOrder/WorkOrderTask/ExecuteWorkOrderTask'
import { Loader } from '@/ui'

function CompleteWorkOrderTask() {
    const { taskInfo } = useContext(TaskInfoContext)

    const getComponent = () => {
        switch (taskInfo?.taskType) {
            case TaskType.DATACOMPREHENSIONWWORKORDER:
                // 数据资源目录理解工单任务
                return (
                    <div
                        style={{
                            height: '100%',
                            overflow: 'auto',
                            background: '#f0f2f5',
                        }}
                    >
                        <div
                            style={{
                                background: '#fff',
                                width: 'calc(100% - 48px)',
                                height: 'calc(100% - 48px)',
                                margin: '24px',
                                padding: '22px 24px',
                            }}
                        >
                            <DataUndsListContent
                                selectedNode={{
                                    name: '全部',
                                    id: '',
                                    path: '',
                                    type: 'all',
                                }}
                                activeTabKey={RescCatlgType.ORGSTRUC}
                            />
                        </div>
                    </div>
                )
            default:
                return <ExecuteWorkOrderTask />
        }
    }

    return (
        <div className={styles.completeTaskWrpper}>
            {taskInfo.taskLoading ? <Loader /> : getComponent()}
        </div>
    )
}

export default memo(CompleteWorkOrderTask)
