import React, { useContext, useEffect, useState } from 'react'
import { Button, Col, Divider, Row, Space, Tabs, Tooltip } from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import { Graph } from '@antv/x6'
import { useDebounceFn } from 'ahooks'
import { formatError, getWorkFlowDetails } from '@/core'
import styles from './styles.module.less'
import __ from './locale'
import { OperateType, TabKey, products, totalOperates } from './const'
import GraphToolBar from '../TaskCenterGraph/GraphToolBar'
import Empty from '@/ui/Empty'
import dataEmpty from '../../assets/dataEmpty.svg'
import Loader from '@/ui/Loader'
import PageDrawer from '@/ui/PageDrawer'
import LogsList from './LogsList'
import WorkflowGraph from './WorkflowGraph'
import EditGraphWorkflow from './EditGraphWorkflow'
import { InfotipOutlined } from '@/icons'
import { handleExecuteWf, updateExecStatus } from './helper'
import { TaskInfoContext } from '@/context'
import { useTaskCheck } from '@/hooks/useTaskCheck'
import SaveSuccess from './SaveSuccess'
import EditTimePlan from './EditTimePlan'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'

interface IWorkflowContent {
    visible: boolean
    id?: string
    operateType?: OperateType
    data?: any
    onClose: () => void
}

/**
 * 工作流内容区
 * @param visible 显示/隐藏
 * @param operateType 操作类型
 * @param id 工作流id
 * @param data 工作流数据
 * @param onClose 关闭
 */
const WorkflowContent: React.FC<IWorkflowContent> = ({
    visible,
    operateType,
    id,
    data,
    onClose,
}) => {
    const { taskInfo } = useContext(TaskInfoContext)
    const { checkTask } = useTaskCheck(totalOperates, products, taskInfo)

    const [loading, setLoading] = useState<boolean>(false)
    const [executing, setExecuting] = useState<boolean>(true)
    const [editVisible, setEditVisible] = useState<boolean>(false)
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false)
    const [timeVisible, setTimeVisible] = useState<boolean>(false)

    // 操作类型
    const [operate, setOperate] = useState<OperateType>()
    // 当前模块
    const [activeKey, setActiveKey] = useState<TabKey>()
    // 画布实例
    const [grapInstance, setGrapInstance] = useState<Graph>()
    // 画布比例
    const [graphSizeValue, setGraphSizeValue] = useState<number>(100)
    // 详情信息
    const [details, setDetails] = useState<any>()
    // 保存
    const [needSave, setNeedSave] = useState(false)
    // 信息弹窗左侧偏移量
    const [modalLeft, setModalLeft] = useState(100)
    // 展示日志列表
    const [logsItems, setLogsItems] = useState<any[]>([])

    // 显示模块集
    const tabItems = [
        {
            key: TabKey.CANVAS,
            label: __('工作流'),
        },
        {
            key: TabKey.LOGS,
            label: __('日志'),
            disabled: operate !== OperateType.PREVIEW,
        },
    ]

    useEffect(() => {
        if (visible) {
            setActiveKey(TabKey.CANVAS)
            setOperate(operateType)
            if (id) {
                getDetails()
            } else {
                setDetails(data)
            }
            // if (operate === OperateType.PREVIEW && id) {
            //     setExecuting(true)
            //     updateExecStatus(id, 'wf', () => {
            //         setExecuting(false)
            //     })
            // }
        } else {
            setDetails(undefined)
            setLogsItems([])
        }
    }, [visible])

    // 设置画布实例
    const setGraphCase = (graphCase: Graph) => {
        setGrapInstance(graphCase)
    }

    // 获取画布实例
    const getGraphCase = () => {
        return grapInstance
    }

    // 画布大小变更
    const handleChangeGraphSize = (graphSize: number) => {
        setGraphSizeValue(graphSize)
    }
    const { run: debouncedGraphSize } = useDebounceFn(handleChangeGraphSize, {
        wait: 400,
    })

    // 获取详情
    const getDetails = async (wid?: string) => {
        try {
            setLoading(true)
            const res = await getWorkFlowDetails(wid || id!)
            setDetails({ ...data, ...res })
        } catch (err) {
            formatError(err)
        } finally {
            setLoading(false)
        }
    }

    // tab更换
    const handleChangeTab = (e) => {
        setActiveKey(e as TabKey)
    }

    // 返回
    const handleReturn = () => {
        if (operate === OperateType.PREVIEW) {
            onClose()
        } else {
            ReturnConfirmModal({
                onCancel: onClose,
            })
        }
    }

    // 保存
    const handleSave = () => {
        setNeedSave(true)
    }

    // 执行工作流
    const handleExecute = async () => {
        if (details?.id) {
            setExecuting(false)
            await handleExecuteWf(details.id, 'wf')
            updateExecStatus(details.id, 'wf', () => {
                setTimeout(() => {
                    setExecuting(true)
                }, 1000)
            })
        }
    }
    const { run: debounceExecute } = useDebounceFn(handleExecute, {
        wait: 2000,
        leading: true,
        trailing: false,
    })

    return (
        <PageDrawer open={visible} headerConfig={null} onClose={onClose}>
            <div className={styles.wfContentWrap}>
                <Row className={styles.wfc_top}>
                    <Col className={styles.topLeft} span={8}>
                        <div
                            onClick={() => handleReturn()}
                            className={styles.returnInfo}
                        >
                            <LeftOutlined className={styles.returnArrow} />
                            <span className={styles.returnText}>
                                {__('返回')}
                            </span>
                        </div>
                        <Divider className={styles.divider} type="vertical" />
                        <div className={styles.nameWrap} title={details?.name}>
                            {details?.name}
                        </div>
                        <Tooltip placement="top" title={__('工作流信息')}>
                            <div
                                className={styles.iconWrap}
                                onClick={(event) => {
                                    setModalLeft(event.clientX)
                                    setEditVisible(true)
                                }}
                            >
                                <InfotipOutlined
                                    style={{
                                        color: 'rgba(0,0,0,0.65)',
                                    }}
                                />
                            </div>
                        </Tooltip>
                        <Tabs
                            className={styles.tabs}
                            activeKey={activeKey}
                            onChange={handleChangeTab}
                            getPopupContainer={(node) => node}
                            tabBarGutter={32}
                            items={tabItems}
                            destroyInactiveTabPane
                        />
                    </Col>
                    {activeKey === TabKey.CANVAS && (
                        <Col className={styles.graphBar} span={8}>
                            <GraphToolBar
                                getGrapInstance={getGraphCase}
                                graphSizeValue={graphSizeValue}
                            />
                        </Col>
                    )}
                    <Col className={styles.topRight} span={8}>
                        <Space size={12}>
                            {operate === OperateType.PREVIEW &&
                                checkTask(OperateType.EDIT) && (
                                    <Button
                                        style={{ width: 88 }}
                                        onClick={() => {
                                            setLogsItems([])
                                            setActiveKey(TabKey.CANVAS)
                                            setOperate(OperateType.EDIT)
                                        }}
                                    >
                                        {__('编辑')}
                                    </Button>
                                )}
                            {operate === OperateType.PREVIEW && (
                                <Button
                                    type="primary"
                                    onClick={() => {
                                        setActiveKey(TabKey.LOGS)
                                        debounceExecute()
                                    }}
                                    loading={!executing}
                                    disabled={details?.nodes?.length === 0}
                                >
                                    {__('立即执行')}
                                </Button>
                            )}
                            {operate === OperateType.CREATE && (
                                <Button
                                    className={styles.btnWrap}
                                    type="primary"
                                    onClick={() => handleSave()}
                                    loading={needSave}
                                >
                                    {__('发布')}
                                </Button>
                            )}
                            {operate === OperateType.EDIT && (
                                <Button
                                    className={styles.btnWrap}
                                    type="primary"
                                    onClick={() => handleSave()}
                                    loading={needSave}
                                >
                                    {__('重新发布')}
                                </Button>
                            )}
                        </Space>
                    </Col>
                </Row>
                <div className={styles.wfc_bottom}>
                    {loading ? (
                        <Loader />
                    ) : details ? (
                        activeKey === TabKey.LOGS ? (
                            <div className={styles.wfc_logsWrap}>
                                <LogsList
                                    pageType="whole"
                                    model="wf"
                                    id={details?.id}
                                    hi={234}
                                    isNeedUpdate={executing}
                                />
                            </div>
                        ) : (
                            <WorkflowGraph
                                data={details}
                                operate={operate}
                                needSave={needSave}
                                taskId={taskInfo?.taskId}
                                logsItems={logsItems}
                                onSetLogsList={(info) => {
                                    setLogsItems(info)
                                }}
                                onSetGraphCase={setGraphCase}
                                onGetGraphSize={debouncedGraphSize}
                                onReturn={onClose}
                                onSave={(info) => {
                                    setNeedSave(false)
                                    if (info) {
                                        getDetails(info?.[0]?.id || id)
                                        setOperate(OperateType.PREVIEW)
                                        setSaveSuccess(true)
                                    }
                                }}
                                // onExecute={async () => {
                                //     setOperate(OperateType.PREVIEW)
                                //     setActiveKey(TabKey.LOGS)
                                //     await debounceExecute()
                                // }}
                            />
                        )
                    ) : (
                        <div className={styles.empty}>
                            <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                        </div>
                    )}
                </div>
                <EditGraphWorkflow
                    open={editVisible}
                    data={details}
                    left={modalLeft}
                    taskId={taskInfo?.taskId}
                    onClose={() => {
                        setEditVisible(false)
                    }}
                    onSure={(info) => {
                        setDetails(info)
                        setEditVisible(false)
                    }}
                />
                <SaveSuccess
                    visible={saveSuccess}
                    operate={operate}
                    onExecute={() => {
                        setActiveKey(TabKey.LOGS)
                        debounceExecute()
                    }}
                    onConfigTimePlan={() => setTimeVisible(true)}
                    onBackList={onClose}
                    onClose={() => setSaveSuccess(false)}
                />
                <EditTimePlan
                    visible={timeVisible}
                    data={details}
                    taskId={taskInfo?.taskId}
                    onClose={() => setTimeVisible(false)}
                    onSure={(info) => {
                        getDetails(info?.[0]?.id || id)
                    }}
                />
            </div>
        </PageDrawer>
    )
}

export default WorkflowContent
