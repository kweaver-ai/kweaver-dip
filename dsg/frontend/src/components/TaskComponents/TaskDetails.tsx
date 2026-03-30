import React, { useMemo, useState } from 'react'
import { Modal } from 'antd'
import Details from './Details'
import __ from './locale'
import { TaskType } from '@/core'

interface IDetails {
    visible: boolean
    taskId: string
    projectId?: string
    onClose: () => void
}
const TaskDetails: React.FC<IDetails> = ({
    visible,
    onClose,
    taskId,
    projectId,
}) => {
    const [taskType, setTaskType] = useState<TaskType>()
    const modalWidth = useMemo(() => {
        return [
            TaskType.DATACOLLECTING,
            TaskType.DATAPROCESSING,
            TaskType.INDICATORPROCESSING,
            TaskType.MODELINGDIAGNOSIS,
            TaskType.STANDARDNEW,
        ].includes(taskType as TaskType)
            ? 900
            : 640
    }, [taskType])
    return (
        <Modal
            title={__('任务详情')}
            open={visible}
            onCancel={onClose}
            footer={null}
            width={modalWidth}
            bodyStyle={{ height: 545, padding: 0, paddingLeft: 24 }}
            destroyOnClose
        >
            <Details
                taskId={taskId}
                projectId={projectId}
                getTaskType={setTaskType}
            />
        </Modal>
    )
}

export default TaskDetails
