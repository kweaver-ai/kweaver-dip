import { FC, useContext, useEffect, useMemo, useState } from 'react'
import { Layout } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { useGetState, useLocalStorageState } from 'ahooks'
import styles from './styles.module.less'
import __ from './locale'
import { DrawioInfoContext } from '@/context/DrawioProvider'
import DrawioHeader from './DrawioHeader'
import FlowchartInfoManager from './helper'
import { TaskExecutableStatus } from '@/core'
import DrawioContent from './DrawioContent'
import GuideFlow from './GuideFlow'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const DrawioMgt: FC = () => {
    // 流程图相关信息
    const { drawioInfo, setDrawioInfo } = useContext(DrawioInfoContext)
    // 流程图存储所有信息
    const [df, setDf, getDf] = useGetState<any>()
    useMemo(() => {
        setDf(drawioInfo)
    }, [drawioInfo])

    // 路径信息
    const [searchParams] = useSearchParams()
    // 业务建模查看视角
    const viewType = searchParams.get('viewType')
    // 整体模式，'0'-编辑,'1'-查看
    let viewmode = searchParams.get('viewmode') || '0'
    // 根流程图id
    const rootFlowId = searchParams.get('rootFlowId') || ''
    // 项目id
    const projectId = searchParams.get('projectId')
    // 任务下返回路径
    const backUrl = searchParams.get('backUrl')
    // 任务id
    const taskId = searchParams.get('taskId') || ''
    // 任务类型
    const taskType = searchParams.get('taskType')
    // 任务状态
    const taskStatus = searchParams.get('taskStatus')
    // 任务执行状态
    const taskExecutableStatus = searchParams.get('taskExecutableStatus')
    // 是否为更新状态
    const saved = searchParams.get('saved') === 'true'
    // 是否是创建进入
    const isCreate = searchParams.get('isCreate') === 'true'

    // 弹框显示,【true】显示,【false】隐藏
    const [guideVisible, setGuideVisible] = useState(false)

    // 存储信息
    const [afFlowchartInfo, setAfFlowchartInfo] = useLocalStorageState<any>(
        `${rootFlowId}`,
    )

    // 用户信息
    const [userInfo] = useCurrentUser()

    const flowInfosMg = useMemo(() => {
        return new FlowchartInfoManager(
            afFlowchartInfo?.flowchartData?.infos || [],
            afFlowchartInfo?.flowchartData?.current,
        )
    }, [afFlowchartInfo])

    // 获取最新数据
    const getLatestData = () => {
        const tempStr = window.localStorage.getItem(`${rootFlowId}`)
        if (tempStr !== null) {
            setAfFlowchartInfo(JSON.parse(tempStr || ''))
            return JSON.parse(tempStr || '')
        }
        return ''
    }

    useMemo(async () => {
        if (drawioInfo?.currentFid) {
            await getLatestData()
        }
    }, [drawioInfo?.currentFid])

    useEffect(() => {
        // 判断引导展示
        if (
            localStorage.getItem('af_flowGuide') === null ||
            !JSON.parse(localStorage.getItem('af_flowGuide') || '')?.[
                userInfo?.ID
            ]
        ) {
            setGuideVisible(true)
        }

        // 任务下非建模任务为查看模式
        if (taskId && taskType !== 'modeling') {
            viewmode = '1'
        }
        // 任务非开启下为查看模式
        if (
            taskId &&
            taskExecutableStatus !== TaskExecutableStatus.EXECUTABLE
        ) {
            viewmode = '1'
        }
        setDrawioInfo({
            ...drawioInfo,
            viewmode,
            iframe: null,
            taskId,
            taskType,
            taskExecutableStatus,
            projectId,
            saved,
            viewType,
            backUrl,
            isCreate,
            rootFlowId,
            currentFid: flowInfosMg?.current?.fid,
        })
    }, [])

    return (
        <Layout className={styles.content}>
            <DrawioHeader flowchartId={rootFlowId} />
            <DrawioContent mode="edit" flowchartId={rootFlowId} />
            <GuideFlow
                visible={guideVisible}
                onClose={() => setGuideVisible(false)}
            />
        </Layout>
    )
}

export default DrawioMgt
