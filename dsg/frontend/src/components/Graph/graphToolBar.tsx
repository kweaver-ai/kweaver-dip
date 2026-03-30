import * as React from 'react'
import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import {
    Layout,
    Row,
    Col,
    Button,
    Dropdown,
    Divider,
    message,
    Tooltip,
    Modal,
} from 'antd'
import {
    LeftOutlined,
    DownOutlined,
    LoadingOutlined,
    ExclamationCircleFilled,
} from '@ant-design/icons'
import { noop } from 'lodash'
import {
    assemblyLineQueryItem,
    assemblyLineEdit,
} from '@/core/apis/assemblyLine'
import { formatError } from '@/core'
import { IAssemblyLineEditParams } from '@/core/apis/assemblyLine/index.d'
import styles from './styles.module.less'

import EditGraphInfo from './editGraphInfo'
import {
    LineOutlined,
    InfotipOutlined,
    BackOutlined,
    NextstepOutlined,
    ConnectionlineOutlined,
    NodeOutlined,
    StageOutlined,
    PolylineOutlined,
    LargeOutlined,
    NarrowOutlined,
    LocationOutlined,
} from '@/icons'
import { LineType } from '@/core/graph/graph-config'
import { SaveStatus, SaveStatusMassage } from '@/core/graph/helper'
import { getActualUrl, rewriteUrl, useQuery } from '@/utils'
import __ from './locale'
import GlobalMenu from '../GlobalMenu'
import { getRouteByModule } from '@/hooks/useMenus'

const { Header: AntdHeader } = Layout

interface GraphToolBarType {
    gid?: string
    model: string
    undoDisabled: boolean
    redoDisabled: boolean
    onAddStage: () => void
    onAddNode: () => void
    onUndoGraph: () => void
    onRedoGraph: () => void
    onChangeGraphSize: (multiple: number) => void
    onShowAllGraphSize: () => void
    onMovedToCenter: () => void
    onPublish: () => void
    onLineTypeChange: (lineType: LineType) => void
    onSaveGraph: () => void
    onClose: () => void
    onGraphModelChange: (model: string) => void
    addStageDisabled: boolean
    addInputNodeDisabled: boolean
    saveStatus: SaveStatus
    graphSize: number
}

const graphSizeItems = [
    {
        key: 'all',
        label: '总览全部',
    },
    {
        key: 'divider',
        label: (
            <Divider
                style={{
                    margin: 0,
                }}
            />
        ),
        disabled: true,
    },
    {
        key: '400',
        label: '400%',
    },
    {
        key: '200',
        label: '200%',
    },
    {
        key: '100',
        label: '100%',
    },
    {
        key: '50',
        label: '50%',
    },
]

const GraphToolBar = ({
    gid = '',
    model,
    onAddStage = noop,
    onAddNode = noop,
    onUndoGraph = noop,
    onRedoGraph = noop,
    onChangeGraphSize = noop,
    onShowAllGraphSize = noop,
    onMovedToCenter = noop,
    onPublish,
    onLineTypeChange = noop,
    onSaveGraph = noop,
    onClose,
    onGraphModelChange,
    undoDisabled = false,
    redoDisabled = false,
    addStageDisabled = false,
    addInputNodeDisabled = false,
    saveStatus = SaveStatus.Normal,
    graphSize = 100,
}: GraphToolBarType) => {
    const [graphInfoIsEdit, setGrafoInfoIsEdit] = useState(true)
    const [domainOpenStatus, setDomainOpenStatus] = useState(false)
    const [domainData, setDomainData] = useState<IAssemblyLineEditParams>({
        name: '',
        description: '',
    })
    const [domainModalleft, setDomainModalLeft] = useState<number>(100)
    // const [graphSize, setGraphSize] = useState(100)
    const query = useQuery()
    const graphId = query.get('id') || gid
    // viewKey为view时,查看当前流程图,顶部右侧为编辑按钮
    const [graphModel, setGraphModel] = useState(model)
    const publishStatus = query.get('state')
    const [loadingPublish, setLoadingPublish] = useState(false)
    const [loadingSave, setLoadingSave] = useState(false)
    const [connectLineTipable, setConnectLineTipable] = useState(false)
    const [isOnlyConfigCenter, setIsOnlyConfigCenter] = useState(false)

    useEffect(() => {
        setGraphModel(model)
    }, [model])

    useEffect(() => {
        initGraphInfo()
        // 判断是否只有配置中心权限
        getAccessesRoutes()
    }, [])

    const getAccessesRoutes = () => {
        const homeAccessesRoutes = getRouteByModule('config-center')
        // 只有配置中心权限不显示全局菜单
        setIsOnlyConfigCenter(!(homeAccessesRoutes.length > 0))
    }

    const initGraphInfo = async () => {
        if (graphId) {
            const { name, description } = await assemblyLineQueryItem(graphId)
            setDomainData({
                name,
                description,
            })
        }
    }

    const linesItems = [
        {
            key: 'line',
            label: (
                <Button
                    type="text"
                    style={{
                        padding: 0,
                    }}
                    className={styles.dropLineButton}
                    icon={
                        <LineOutlined
                            style={{
                                fontSize: '20px',
                                marginRight: '15px',
                            }}
                        />
                    }
                    onClick={() => {
                        onLineTypeChange(LineType.STRAIGHT)
                    }}
                >
                    {__('直线')}
                </Button>
            ),
        },
        {
            key: 'plolyline',
            label: (
                <Button
                    type="text"
                    className={styles.dropLineButton}
                    icon={
                        <PolylineOutlined
                            style={{
                                fontSize: '20px',
                                marginRight: '15px',
                            }}
                        />
                    }
                    onClick={() => {
                        onLineTypeChange(LineType.POLY)
                    }}
                >
                    {__('折线')}
                </Button>
            ),
        },
        // {
        //     key: 'arcline',
        //     label: (
        //         <Button
        //             type="text"
        //             className={styles.dropLineButton}
        //             icon={
        //                 <ArcLineOutlined
        //                     style={{
        //                         fontSize: '20px',
        //                         marginRight: '15px',
        //                     }}
        //                 />
        //             }
        //             onClick={() => {
        //                 onLineTypeChange(LineType.ARC)
        //             }}
        //         >
        //             弧线
        //         </Button>
        //     ),
        // },
    ]

    /**
     * 进入编辑
     */
    const handleCenterEdit = () => {
        rewriteUrl(
            `${window.location.pathname}?id=${graphId}&state=${publishStatus}&viewKey=resumedraft`,
        )
        setGraphModel('resumedraft')
        onGraphModelChange('resumedraft')
    }

    const handleSave = async () => {
        setLoadingSave(true)
        await onSaveGraph()
        setLoadingSave(false)
    }
    /**
     * 返回事件
     */
    const handleReturnBack = () => {
        // navigator(
        //     getActualUrl(
        //         `/systemConfig/assemblyLineConfig?state=${publishStatus}`,
        //     ),
        // )
        rewriteUrl(`${window.location.pathname}?state=${publishStatus}`)
        onClose()
    }

    /**
     * 选择画布大小
     * @param key 选择项
     */
    const selectGraphSize = (key: string) => {
        const showSize: number = 100
        switch (true) {
            case key === 'all':
                onShowAllGraphSize()
                break
            case key === 'divider':
                break
            default:
                onChangeGraphSize(Number(key) / 100)
                break
        }
    }

    /**
     * 更新工作流程
     * @param data  工作流程信息
     */
    const onUpdateDomainData = async (data: IAssemblyLineEditParams) => {
        try {
            if (graphId) {
                await assemblyLineEdit(graphId, data)
                setDomainData(data)
                message.success(__('编辑成功'))
            }
        } catch (e) {
            formatError(e)
        }
    }
    return (
        <div className={styles.headerWrapper}>
            <AntdHeader className={styles.header}>
                <Row
                    style={{
                        width: '100%',
                    }}
                >
                    <Col span={6} className={styles.headerCol}>
                        {!isOnlyConfigCenter && <GlobalMenu />}
                        <div
                            aria-hidden
                            className={styles.returnWrapper}
                            onClick={() => {
                                handleReturnBack()
                            }}
                        >
                            <LeftOutlined className={styles.returnIcon} />
                            <div className={styles.return}>{__('返回')}</div>
                        </div>
                        <div className={styles.nameWrapper}>
                            <div
                                className={styles.domainName}
                                title={domainData.name}
                            >
                                {domainData.name}
                            </div>
                            <Tooltip
                                placement="bottom"
                                title={__('工作流程信息')}
                            >
                                <div
                                    className={styles.iconWrapper}
                                    onClick={(event) => {
                                        setDomainModalLeft(event.clientX)
                                        setDomainOpenStatus(true)
                                    }}
                                >
                                    <InfotipOutlined
                                        style={{
                                            color: 'rgba(0,0,0,0.65)',
                                        }}
                                    />
                                </div>
                            </Tooltip>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div className={styles.toolWrapper}>
                            {graphModel === 'view' ? null : (
                                <div
                                    style={{
                                        display: 'inline-flex',
                                    }}
                                >
                                    <div className={styles.toolbarContent}>
                                        <div
                                            className={`${styles.toolIcon} ${styles.toolButtonSpace}`}
                                        >
                                            <Tooltip
                                                placement="bottom"
                                                title={__('上一步')}
                                            >
                                                <Button
                                                    type="text"
                                                    icon={
                                                        <BackOutlined
                                                            style={{
                                                                fontSize:
                                                                    '16px',
                                                            }}
                                                        />
                                                    }
                                                    onClick={() => {
                                                        onUndoGraph()
                                                    }}
                                                    disabled={undoDisabled}
                                                    className={`${
                                                        styles.toolButton
                                                    } ${
                                                        undoDisabled
                                                            ? styles.iconDisabled
                                                            : styles.iconEnabled
                                                    }`}
                                                />
                                            </Tooltip>
                                        </div>
                                        <div className={styles.toolIcon}>
                                            <Tooltip
                                                placement="bottom"
                                                title={__('下一步')}
                                            >
                                                <Button
                                                    type="text"
                                                    icon={
                                                        <NextstepOutlined
                                                            style={{
                                                                fontSize:
                                                                    '16px',
                                                            }}
                                                        />
                                                    }
                                                    onClick={() => {
                                                        onRedoGraph()
                                                    }}
                                                    disabled={redoDisabled}
                                                    className={`${
                                                        styles.toolButton
                                                    } ${
                                                        redoDisabled
                                                            ? styles.iconDisabled
                                                            : styles.iconEnabled
                                                    }`}
                                                />
                                            </Tooltip>
                                        </div>
                                        <div className={styles.toolSplit}>
                                            <div
                                                className={styles.toolSplitLine}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.toolbarContent}>
                                        <div
                                            className={`${styles.toolIcon} ${styles.toolButtonSpace}`}
                                        >
                                            <Tooltip
                                                placement="bottom"
                                                title={__('阶段')}
                                            >
                                                <Button
                                                    type="text"
                                                    icon={
                                                        <StageOutlined
                                                            style={{
                                                                fontSize:
                                                                    '20px',
                                                            }}
                                                        />
                                                    }
                                                    onClick={() => {
                                                        onAddStage()
                                                    }}
                                                    disabled={addStageDisabled}
                                                    className={`${
                                                        styles.toolButton
                                                    } ${
                                                        addStageDisabled
                                                            ? styles.iconDisabled
                                                            : styles.iconEnabled
                                                    }`}
                                                />
                                            </Tooltip>
                                        </div>
                                        <div
                                            className={`${styles.toolIcon} ${styles.toolButtonSpace}`}
                                        >
                                            <Tooltip
                                                placement="bottom"
                                                title={__('节点')}
                                            >
                                                <Button
                                                    type="text"
                                                    icon={
                                                        <NodeOutlined
                                                            style={{
                                                                fontSize:
                                                                    '18px',
                                                            }}
                                                        />
                                                    }
                                                    onClick={() => onAddNode()}
                                                    disabled={
                                                        addInputNodeDisabled
                                                    }
                                                    className={`${
                                                        styles.toolButton
                                                    } ${
                                                        addInputNodeDisabled
                                                            ? styles.iconDisabled
                                                            : styles.iconEnabled
                                                    }`}
                                                />
                                            </Tooltip>
                                        </div>
                                        <div className={styles.toolIcon}>
                                            <Dropdown
                                                menu={{ items: linesItems }}
                                                trigger={['click']}
                                                onOpenChange={(open) => {
                                                    if (open) {
                                                        setConnectLineTipable(
                                                            false,
                                                        )
                                                    }
                                                }}
                                            >
                                                <Tooltip
                                                    placement="bottom"
                                                    open={connectLineTipable}
                                                    title={__('连接线')}
                                                >
                                                    <div
                                                        className={`${styles.iconEnabled} ${styles.toolSelectLines}`}
                                                        onFocus={() => 0}
                                                        onBlur={() => 0}
                                                        onMouseOver={() => {
                                                            setConnectLineTipable(
                                                                true,
                                                            )
                                                        }}
                                                        onMouseLeave={() => {
                                                            setConnectLineTipable(
                                                                false,
                                                            )
                                                        }}
                                                    >
                                                        <ConnectionlineOutlined
                                                            style={{
                                                                fontSize:
                                                                    '18px',
                                                                display:
                                                                    'block',
                                                                margin: '8px 0 8px 0',
                                                                color: 'rgba(0,0,0,0.85)',
                                                            }}
                                                        />
                                                        <DownOutlined
                                                            style={{
                                                                fontSize:
                                                                    '10px',
                                                                display:
                                                                    'block',
                                                                margin: '11px 0 11px 5px',
                                                            }}
                                                        />
                                                    </div>
                                                </Tooltip>
                                            </Dropdown>
                                        </div>
                                        <div className={styles.toolSplit}>
                                            <div
                                                className={styles.toolSplitLine}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className={styles.toolbarContent}>
                                <div className={styles.toolIcon}>
                                    <Tooltip
                                        placement="bottom"
                                        title={__('缩小')}
                                    >
                                        <Button
                                            type="text"
                                            icon={
                                                <NarrowOutlined
                                                    style={{
                                                        fontSize: '14px',
                                                    }}
                                                    // disabled={graphSize <= 20}
                                                />
                                            }
                                            onClick={() => {
                                                onChangeGraphSize(
                                                    Math.round(graphSize - 5) /
                                                        100,
                                                )
                                            }}
                                            disabled={graphSize <= 20}
                                            className={`${styles.toolButton} ${
                                                graphSize <= 20
                                                    ? styles.iconDisabled
                                                    : styles.iconEnabled
                                            }`}
                                        />
                                    </Tooltip>
                                </div>
                                <div className={styles.toolIcon}>
                                    <Dropdown
                                        menu={{
                                            items: graphSizeItems,
                                            onClick: ({ key }) => {
                                                selectGraphSize(key)
                                            },
                                        }}
                                    >
                                        <div
                                            className={`${styles.toolSelectSize} ${styles.iconEnabled}`}
                                        >
                                            <div
                                                style={{
                                                    fontSize: '12px',
                                                    userSelect: 'none',
                                                }}
                                                onDoubleClick={() => {
                                                    onChangeGraphSize(1)
                                                }}
                                            >
                                                {`${Math.round(graphSize)}%`}
                                            </div>
                                            <DownOutlined
                                                style={{
                                                    fontSize: '10px',
                                                    margin: '0 0 0 5px',
                                                }}
                                            />
                                        </div>
                                    </Dropdown>
                                </div>
                                <div className={styles.toolIcon}>
                                    <Tooltip
                                        placement="bottom"
                                        title={__('放大')}
                                    >
                                        <Button
                                            type="text"
                                            icon={
                                                <LargeOutlined
                                                    style={{
                                                        fontSize: '14px',
                                                    }}
                                                />
                                            }
                                            onClick={() => {
                                                onChangeGraphSize(
                                                    Math.round(graphSize + 5) /
                                                        100,
                                                )
                                            }}
                                            disabled={graphSize >= 400}
                                            className={`${styles.toolButton} ${
                                                graphSize >= 400
                                                    ? styles.iconDisabled
                                                    : styles.iconEnabled
                                            }`}
                                        />
                                    </Tooltip>
                                </div>
                                <div className={styles.toolSplit}>
                                    <div className={styles.toolSplitLine} />
                                </div>
                            </div>
                            <div className={styles.toolbarContent}>
                                <div className={styles.toolIcon}>
                                    <Tooltip
                                        placement="bottom"
                                        title={__('定位')}
                                    >
                                        <Button
                                            type="text"
                                            icon={
                                                <LocationOutlined
                                                    style={{
                                                        fontSize: '16px',
                                                    }}
                                                />
                                            }
                                            onClick={() => {
                                                onMovedToCenter()
                                            }}
                                            className={`${styles.toolButton} ${styles.iconEnabled}`}
                                        />
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    </Col>
                    {graphModel === 'view' ? (
                        <Col span={6}>
                            <div className={styles.toolSaveWrapper}>
                                <Button
                                    type="primary"
                                    onClick={() => handleCenterEdit()}
                                    // hidden={
                                    //     !checkPermission(
                                    //         'manageDataOperationProcess',
                                    //     )
                                    // }
                                >
                                    {__('编辑')}
                                </Button>
                            </div>
                        </Col>
                    ) : (
                        <Col span={6}>
                            <div className={styles.toolSaveWrapper}>
                                <div className={styles.toolSaveTip}>
                                    {SaveStatusMassage[saveStatus]}
                                </div>
                                <Button
                                    className={styles.toolSaveButton}
                                    icon={
                                        loadingSave ? (
                                            <LoadingOutlined
                                                style={{ marginRight: '5px' }}
                                            />
                                        ) : null
                                    }
                                    style={
                                        loadingSave
                                            ? {
                                                  backgroundColor:
                                                      'rab(127.182.246)',
                                                  cursor: 'default',
                                              }
                                            : {}
                                    }
                                    onClick={async (e) => {
                                        if (loadingSave) {
                                            e.preventDefault()
                                        }
                                        await setLoadingSave(true)
                                        await onSaveGraph()
                                        await setLoadingSave(false)
                                    }}
                                >
                                    {__('保存草稿')}
                                </Button>
                                <Button
                                    type="primary"
                                    className={styles.toolSaveButton}
                                    icon={
                                        loadingPublish ? (
                                            <LoadingOutlined
                                                style={{ marginRight: '5px' }}
                                            />
                                        ) : null
                                    }
                                    style={
                                        loadingPublish
                                            ? {
                                                  backgroundColor:
                                                      'rab(127.182.246)',
                                                  cursor: 'default',
                                              }
                                            : {}
                                    }
                                    onClick={async (e) => {
                                        if (loadingPublish) {
                                            e.preventDefault()
                                        }
                                        setLoadingPublish(true)
                                        await onPublish()
                                        setLoadingPublish(false)
                                    }}
                                >
                                    {publishStatus === 'released'
                                        ? __('重新发布')
                                        : __('发布')}
                                </Button>
                            </div>
                        </Col>
                    )}
                </Row>
            </AntdHeader>
            {graphInfoIsEdit ? (
                <EditGraphInfo
                    open={domainOpenStatus}
                    onClose={() => {
                        setDomainOpenStatus(false)
                    }}
                    data={domainData}
                    left={domainModalleft}
                    onUpdateData={(data) => {
                        onUpdateDomainData(data)
                    }}
                    graphModel={graphModel}
                    graphId={graphId}
                />
            ) : null}
        </div>
    )
}

export default GraphToolBar
