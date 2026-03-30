import { useEffect, useState } from 'react'
import { BackTop, Button, Col, Divider, Row, Tabs, Tooltip } from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import { Graph } from '@antv/x6'
import { useNavigate } from 'react-router-dom'
import { useQuery, getActualUrl } from '@/utils'
import {
    formatError,
    formsEnumConfig,
    getDataComprehensionDetails,
    IdimensionModel,
    IFormEnumConfigModel,
    TaskExecutableStatus,
    updateComprehensionMark,
} from '@/core'
import styles from './styles.module.less'
import __ from './locale'
import { SaveType, TabKey, UndsStatus, ViewMode } from './const'
import GraphToolBar from '../TaskCenterGraph/GraphToolBar'
import { Empty, Loader } from '@/ui'
import dataEmpty from '../../assets/dataEmpty.svg'
import Report from './Report'
import ReportAnchor from './ReportAnchor'
import DataUndsGraph from './DataUndsGraph'
import { ReturnTopOutlined } from '@/icons'
import GlobalMenu from '../GlobalMenu'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import { useUndsGraphContext } from '@/context/UndsGraphProvider'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

const DataUndsContent = () => {
    const { viewMode, setViewMode } = useUndsGraphContext()
    const { checkPermission } = useUserPermCtx()
    const query = useQuery()
    const navigate = useNavigate()
    const backUrl = query.get('backUrl') || ''
    const projectId = query.get('projectId')
    const taskId = query.get('taskId') || ''
    const taskExecutableStatus = query.get('taskExecutableStatus')
    const catalogId = query.get('cid') || ''
    const [loading, setLoading] = useState(false)
    // 返回显示/隐藏
    const [backVisible, setBackVisible] = useState(false)
    // 当前模块
    const [activeKey, setActiveKey] = useState<TabKey>(TabKey.REPORT)
    // 画布实例
    const [grapInstance, setGrapInstance] = useState<Graph>()
    // 画布比例
    const [graphSizeValue, setGraphSizeValue] = useState<number>(100)
    // 详情信息
    const [details, setDetails] = useState<IdimensionModel>()
    // 当前显示模式
    // const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.VIEW)
    // 当前保存模式
    const [saveType, setSaveType] = useState<SaveType | undefined>(undefined)
    // 配置信息枚举
    const [enumConfigs, setEnumConfigs] = useState<IFormEnumConfigModel>()

    // 显示模块集
    const tabItems = [
        {
            key: TabKey.REPORT,
            label: __('报告'),
        },
        {
            key: TabKey.CANVAS,
            label: __('理解画布'),
        },
    ]

    useEffect(() => {
        const tab = query.get('tab') || TabKey.CANVAS
        const mode = query.get('mode') || ViewMode.VIEW
        setActiveKey(tab as TabKey)
        setViewMode(mode as ViewMode)
        getEnumConfig()
        getDetails()
    }, [])

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

    // 更改保存类型
    const changeSaveType = (type) => {
        setSaveType(type)
        setBackVisible(false)
    }

    // 获取枚举值
    const getEnumConfig = async () => {
        const res = await formsEnumConfig()
        setEnumConfigs(res)
    }

    // 理解详情
    const getDetails = async () => {
        if (!catalogId) return
        try {
            setLoading(true)
            const res = await getDataComprehensionDetails(catalogId)
            setDetails(res)
        } catch (err) {
            formatError(err)
            setDetails(undefined)
        } finally {
            setLoading(false)
        }
    }

    // tab更换
    const handleChangeTab = (e) => {
        if (e === TabKey.CANVAS) {
            updateComprehensionMark(catalogId, taskId)
        }
        setActiveKey(e as TabKey)
    }

    // 返回路径拼接
    const back = () => {
        // 任务下
        if (backUrl) {
            window.location.replace(
                getActualUrl(
                    `/complete-work-order-task?projectId=${projectId}&taskId=${taskId}&backUrl=${backUrl}`,
                ),
            )
        } else {
            navigate('/dataService/dataCatalogUnderstanding')
        }
    }

    // 返回
    const handleReturn = () => {
        if (saveType === SaveType.BAN) {
            return
        }
        if (viewMode === ViewMode.EDIT) {
            ReturnConfirmModal({
                onCancel: back,
            })
        } else {
            back()
        }
    }

    // 保存 true-发布/更新 false-保存
    const handleSave = (bo: boolean) => {
        setSaveType(bo ? SaveType.PUBLISH : SaveType.SAVE)
    }

    return (
        <div className={styles.dataUndsContentWrap}>
            <Row className={styles.duc_top}>
                <Col className={styles.topLeft} span={8}>
                    <GlobalMenu />
                    <div
                        onClick={() => handleReturn()}
                        className={styles.returnInfo}
                        style={{
                            color:
                                saveType === SaveType.BAN
                                    ? 'rgb(0 0 0 / 45%)'
                                    : 'rgb(0 0 0 / 85%)',
                            cursor:
                                saveType === SaveType.BAN
                                    ? 'not-allowed'
                                    : 'pointer',
                        }}
                    >
                        <LeftOutlined className={styles.returnArrow} />
                        <span className={styles.returnText}>{__('返回')}</span>
                    </div>
                    <Divider className={styles.divider} type="vertical" />
                    <div
                        className={styles.nameWrap}
                        title={details?.catalog_info.name}
                    >
                        {details?.catalog_info.name}
                    </div>
                    <Tabs
                        className={styles.tabs}
                        activeKey={activeKey}
                        onChange={handleChangeTab}
                        getPopupContainer={(node) => node}
                        tabBarGutter={32}
                        items={tabItems}
                        hidden={
                            viewMode === ViewMode.EDIT ||
                            details?.status !== UndsStatus.Understood
                        }
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
                    <Button
                        onClick={() => {
                            setActiveKey(TabKey.CANVAS)
                            setViewMode(ViewMode.EDIT)
                        }}
                        hidden={
                            viewMode === ViewMode.EDIT ||
                            taskExecutableStatus ===
                                TaskExecutableStatus.COMPLETED ||
                            !checkPermission('manageResourceCatalog')
                        }
                    >
                        {__('编辑')}
                    </Button>
                    <div
                        hidden={
                            viewMode === ViewMode.VIEW ||
                            details?.status !== UndsStatus.NotUnderstood
                        }
                    >
                        <Button
                            onClick={() => handleSave(false)}
                            style={{ marginRight: 12 }}
                            loading={saveType === SaveType.SAVE}
                            disabled={
                                saveType === SaveType.PUBLISH ||
                                saveType === SaveType.BAN
                            }
                        >
                            {__('保存')}
                        </Button>
                        <Button
                            type="primary"
                            onClick={() => handleSave(true)}
                            loading={saveType === SaveType.PUBLISH}
                            disabled={
                                saveType === SaveType.SAVE ||
                                saveType === SaveType.BAN
                            }
                        >
                            {__('发布')}
                        </Button>
                    </div>
                    <div
                        hidden={
                            viewMode === ViewMode.VIEW ||
                            details?.status !== UndsStatus.Understood
                        }
                    >
                        <Button
                            type="primary"
                            onClick={() => handleSave(true)}
                            loading={saveType === SaveType.PUBLISH}
                            disabled={
                                saveType === SaveType.SAVE ||
                                saveType === SaveType.BAN
                            }
                        >
                            {__('重新发布')}
                        </Button>
                    </div>
                </Col>
            </Row>
            <div className={styles.duc_bottom}>
                {loading ? (
                    <Loader />
                ) : details ? (
                    activeKey === TabKey.REPORT ? (
                        <>
                            <Report
                                details={details}
                                enumConfigs={enumConfigs}
                            />
                            <ReportAnchor
                                details={details}
                                targetOffset={24}
                                style={{
                                    position: 'absolute',
                                    top: 76,
                                    right: 24,
                                    zIndex: 1000,
                                }}
                            />
                            <Tooltip title={__('回到顶部')}>
                                <BackTop
                                    visibilityHeight={100}
                                    className={styles.backTop}
                                    target={() =>
                                        document.getElementById('reportWrap')!
                                    }
                                >
                                    <ReturnTopOutlined
                                        style={{ fontSize: 40 }}
                                    />
                                </BackTop>
                            </Tooltip>
                        </>
                    ) : (
                        <DataUndsGraph
                            catalogId={catalogId}
                            taskId={taskId}
                            details={details}
                            // viewMode={viewMode}
                            saveType={saveType}
                            enumConfigs={enumConfigs}
                            onSetGraphCase={setGraphCase}
                            onGetGraphSize={handleChangeGraphSize}
                            onReturn={() => back()}
                            onSave={changeSaveType}
                        />
                    )
                ) : (
                    <div className={styles.empty}>
                        <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                    </div>
                )}
            </div>
        </div>
    )
}

export default DataUndsContent
