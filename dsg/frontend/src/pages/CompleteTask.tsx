import { useContext, memo } from 'react'
import { TaskInfoContext } from '@/context'
import styles from './styles.module.less'
import { TaskType } from '@/core'
import DataUndsListContent from '@/components/DataCatalogUnderstanding/DataUndsListContent'
import ExecuteTask from '@/components/BusinessModeling/ExecuteTask'
import { RescCatlgType } from '@/components/ResourcesDir/const'
import DatasheetTable from '@/components/DatasheetView/DatasheetTable'
import StdTaskToBeExec from '@/components/StdDataEleTask/StdTaskToBeExec'
import { Loader } from '@/ui'
import BusinessModelProvider from '@/components/BusinessModeling/BusinessModelProvider'

function CompleteTask() {
    const { taskInfo } = useContext(TaskInfoContext)
    const getComponent = () => {
        switch (taskInfo?.taskType) {
            // 标准化任务
            case TaskType.FIELDSTANDARD:
                return (
                    // <FieldStandard
                    //     taskId={taskInfo.taskId?.toString()}
                    //     tabKey={taskInfo.tabKey}
                    // />
                    <StdTaskToBeExec taskId={taskInfo.taskId?.toString()} />
                )
            case TaskType.DATACOMPREHENSION:
                // 数据资源目录理解任务
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
            // 库表
            case TaskType.DATASHEETVIEW:
                return (
                    <div
                        style={{
                            height: '100%',
                            overflow: 'auto',
                            background: '#f0f2f5',
                            flex: 'auto',
                        }}
                    >
                        <DatasheetTable type="task" taskInfo={taskInfo} />
                    </div>
                )
            default:
                return (
                    <BusinessModelProvider>
                        <ExecuteTask tabKey={taskInfo.tabKey} />
                    </BusinessModelProvider>
                )
        }
    }

    return (
        <div className={styles.completeTaskWrpper}>
            {taskInfo.taskLoading ? <Loader /> : getComponent()}
        </div>
    )
}

export default memo(CompleteTask)
