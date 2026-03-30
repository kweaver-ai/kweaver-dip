import {
    ReactNode,
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { useUnmount } from 'ahooks'
import { message } from 'antd'
import {
    ISSZDSyncTask,
    SSZDSyncTaskEnum,
    formatError,
    getSSZDSyncTask,
    createSSZDSyncTask,
} from '@/core'
import __ from './locale'

type IResourceShareContext = {
    [key: string]: any
}

const ResourceShareContext = createContext<IResourceShareContext>({})

/**
 * 资源共享 Provider
 */
export const useResourceShareContext = () =>
    useContext<IResourceShareContext>(ResourceShareContext)

export const ResourceShareProvider = ({
    children,
}: {
    children: ReactNode
}) => {
    // 同步 load
    const [syncLoading, setSyncLoading] = useState<boolean>(false)
    // 同步数据
    const [syncData, setSyncData] = useState<ISSZDSyncTask>()
    // 同步定时器
    const [syncTimer, setSyncTimer] = useState<any>()

    useEffect(() => {
        getSyncData()
    }, [])

    useUnmount(() => {
        // 清除定时器
        clearTimeout(syncTimer)
    })

    // 查询共享同步任务
    const getSyncData = async () => {
        try {
            const res = await getSSZDSyncTask(SSZDSyncTaskEnum.ShareApply)
            setSyncData(res)
            if (!res?.id) {
                setSyncLoading(false)
                message.success(__('数据同步成功'))
            } else {
                setSyncLoading(true)
                installSyncTimer()
            }
        } catch (err) {
            formatError(err)
            setSyncLoading(false)
        }
    }

    // 设置定时器，5秒轮询获取同步结果
    const installSyncTimer = () => {
        const t = setTimeout(getSyncData, 5000)
        setSyncTimer(t)
    }

    // 发起同步任务
    const onToSyncData = async () => {
        try {
            setSyncLoading(true)
            await createSSZDSyncTask(SSZDSyncTaskEnum.ShareApply)
            getSyncData()
        } catch (err) {
            formatError(err)
            setSyncLoading(false)
        }
    }

    const values = useMemo(
        () => ({ syncLoading, syncData, onToSyncData }),
        [syncLoading, syncData, onToSyncData],
    )
    return (
        <ResourceShareContext.Provider value={values}>
            {children}
        </ResourceShareContext.Provider>
    )
}
