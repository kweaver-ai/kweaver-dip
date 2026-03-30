import React, {
    ReactNode,
    useState,
    useMemo,
    Dispatch,
    SetStateAction,
} from 'react'
import { noop } from 'lodash'
import { TaskStatus, TaskType } from '@/core'

interface ITaskInfoContext {
    taskInfo: ITaskInfo
    setTaskInfo: Dispatch<SetStateAction<ITaskInfo>>
}

interface ITaskInfoProvider {
    initTaskInfo: ITaskInfo
    children: ReactNode
}

interface ITaskInfo {
    [key: string]: any
}

export const initTaskInfoData = {
    taskType: TaskType.NORMAL,
    taskStatus: TaskStatus.ONGOING,
}

export const TaskInfoContext = React.createContext<ITaskInfoContext>({
    taskInfo: {},
    setTaskInfo: noop,
})

export const TaskInfoProvider: React.FC<ITaskInfoProvider> = ({
    initTaskInfo = initTaskInfoData,
    children,
}) => {
    const [taskInfo, setTaskInfo] = useState(initTaskInfo)
    const values = useMemo(
        () => ({ taskInfo, setTaskInfo }),
        [taskInfo, setTaskInfo],
    )

    return (
        <TaskInfoContext.Provider value={values}>
            {children}
        </TaskInfoContext.Provider>
    )
}
