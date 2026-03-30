import React, { useState, useEffect, ClassAttributes } from 'react'
import {
    Layout,
    Row,
    Col,
    Button,
    Dropdown,
    Divider,
    Tooltip,
    Badge,
    Space,
    message,
} from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { LeftOutlined, DownOutlined } from '@ant-design/icons'
import { noop } from 'lodash'
import classNames from 'classnames'
import { ISceneItem, LogicViewType } from '@/core'
import __ from './locale'
import {
    InfotipOutlined,
    LargeOutlined,
    NarrowOutlined,
    LocationOutlined,
} from '@/icons'
import { OperateType, useQuery } from '@/utils'
import EditGraphScene from './EditGraphScene'
import { ReactComponent as createNode } from '@/icons/svg/outlined/createNode.svg'
import CommonIcon from '../CommonIcon'
import GlobalMenu from '../GlobalMenu'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import { ModuleType, ModeType } from './const'
import styles from './styles.module.less'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { useDataViewContext } from '../DatasheetView/DataViewProvider'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const { Header: AntdHeader } = Layout
message.config({
    top: 100,
})

interface IGraphHeader extends ClassAttributes<HTMLDivElement> {
    setAiOpen: (isOpen: boolean) => void
    setIsDialogClick: (isClick: boolean) => void
    onStartDrag: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
    onChangeGraphSize: (multiple: number) => void
    onShowAllGraphSize: () => void
    onMovedToCenter: () => void
    onSaveGraph: () => void
    addStageDisabled?: boolean
    graphSize: number
    data?: ISceneItem
    canSave?: boolean
    mode?: ModeType
    setMode?: (mode: ModeType) => void
    loading?: boolean
}

const graphSizeItems = [
    {
        key: 'all',
        label: __('总览全部'),
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

const GraphHeader = ({
    setAiOpen,
    setIsDialogClick,
    onStartDrag = noop,
    onChangeGraphSize = noop,
    onShowAllGraphSize = noop,
    onMovedToCenter = noop,
    onSaveGraph = noop,
    addStageDisabled = false,
    graphSize = 100,
    data,
    canSave = true,
    mode = ModeType.Model,
    setMode,
    loading,
}: IGraphHeader) => {
    const [{ using }, updateUsing] = useGeneralConfig()
    const { pathname } = useLocation()
    const query = useQuery()
    const sceneId = query.get('sceneId') || ''
    const viewId = query.get('viewId') || ''
    const operate = query.get('operate') || ''
    const module = query.get('module') || ModuleType.SceneAnalysis
    const from = query.get('from') || ''
    // 场景信息
    const navigator = useNavigate()
    const [sceneData, setSceneData] = useState<ISceneItem>()
    // 信息弹窗左侧偏移量
    const [modalLeft, setModalLeft] = useState(100)
    // 弹窗显示/隐藏
    const [editVisible, setEditVisible] = useState(false)
    const [backVisible, setBackVisible] = useState(false)
    // 是否有ai入口
    const [isHasEntrance, setEntrance] = useState(false)
    // 保存load
    const [loadingSave, setLoadingSave] = useState(false)

    const [guideVisible, setGuideVisible] = useState(false)
    const { datasheetInfo } = useDataViewContext()
    const [userInfo] = useCurrentUser()

    const steps: any = [
        {
            placement: 'bottom-start',
            disableBeacon: true,
            target: document.getElementById('graphAIIcon'),
            spotlightPadding: 0,
            spotlightRadius: 4,
            content: __(
                '可输入数据关键字或您的分析意图，让AI小助手来尝试帮您找到数据。',
            ),
            title: __('不知道使用什么数据进行分析'),
            styles: {
                tooltip: {
                    width: '320px',
                    height: '151px',
                    padding: '16px',
                    background:
                        'linear-gradient( 315deg, #BCD2FE 0%, #CDD9FF 31%, #DDE8FE 52%, #E0EDFF 67%, #E2E9FF 100%)',
                    borderRadius: '4px',
                    top: '0px',
                },
                tooltipContent: {
                    fontSize: '14px',
                    color: '#126ee3',
                    padding: '12px 0 0',
                    textAlign: 'left',
                },
                tooltipTitle: {
                    fontSize: '14px',
                    color: '#126ee3',
                    fontWeight: '550',
                    textAlign: 'left',
                },
                tooltipFooter: { marginTop: '16px' },
                buttonNext: {
                    background: '#fff',
                    color: '#126ee3',
                    fontSize: '13px',
                    padding: '0px',
                    outline: 'none',
                },
                options: {
                    arrowColor: 'rgb(197, 214, 255)',
                    arrowSize: 4,
                },
            },
        },
    ]

    useEffect(() => {
        setSceneData(data)
    }, [data])

    useEffect(() => {
        if (pathname.includes('sceneGraph')) {
            setEntrance(true)
        }
    }, [pathname])

    // 返回
    const handleReturnBack = () => {
        ReturnConfirmModal({
            onCancel: () => {
                if (module === ModuleType.SceneAnalysis) {
                    navigator(`/dataProduct/sceneAnalysis`)
                } else if (operate === OperateType.CREATE) {
                    navigator(`/datasheet-view?tab=${module}`)
                } else if (from === 'detail') {
                    navigator(
                        `/datasheet-view/detail?id=${viewId}&model=view&isCompleted=true&logic=${
                            module === ModuleType.CustomView
                                ? LogicViewType.Custom
                                : LogicViewType.LogicEntity
                        }`,
                    )
                } else {
                    navigator(`/datasheet-view?tab=${module}`)
                }
            },
        })
    }

    // 选择画布大小
    const selectGraphSize = (key: string) => {
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

    return (
        <div className={styles.graphHeaderWrapper}>
            <AntdHeader className={styles.gh_header}>
                <Row
                    style={{
                        width: '100%',
                    }}
                >
                    <Col span={6} className={styles.gh_topLeftWrap}>
                        <GlobalMenu />
                        <div
                            // aria-hidden
                            className={styles.returnWrapper}
                            onClick={() => {
                                handleReturnBack()
                            }}
                        >
                            <LeftOutlined />
                            <div className={styles.return}>{__('返回')}</div>
                        </div>
                        {sceneData?.name && (
                            <div className={styles.nameWrapper}>
                                <div className={styles.nameborder} />
                                <div
                                    className={styles.domainName}
                                    title={sceneData?.name}
                                >
                                    {sceneData?.name}
                                </div>
                                {module === ModuleType.SceneAnalysis && (
                                    <Tooltip
                                        placement="top"
                                        title={__('场景分析信息')}
                                    >
                                        <div
                                            className={styles.iconWrapper}
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
                                )}
                            </div>
                        )}
                    </Col>
                    <Col span={12}>
                        <div className={styles.toolWrapper}>
                            {module !== ModuleType.SceneAnalysis &&
                                !loading && (
                                    <div className={styles.modeContainer}>
                                        <Badge
                                            color={
                                                mode === ModeType.Model &&
                                                styles.selectedText
                                                    ? '#126EE3'
                                                    : '#999999'
                                            }
                                            className={styles.dot}
                                        />
                                        <Tooltip
                                            overlayInnerStyle={{
                                                width: 286,
                                            }}
                                            title={__(
                                                '用于调整库表字段产生“输出数据”的过程',
                                            )}
                                        >
                                            <div
                                                className={classNames(
                                                    styles.text,
                                                    mode === ModeType.Model &&
                                                        styles.selectedText,
                                                )}
                                                onClick={() =>
                                                    setMode?.(ModeType.Model)
                                                }
                                            >
                                                {__('模型')}
                                                {mode === ModeType.Model && (
                                                    <div
                                                        className={
                                                            styles.bottomLine
                                                        }
                                                    />
                                                )}
                                            </div>
                                        </Tooltip>
                                        <div className={styles.line} />
                                        <Badge
                                            color={
                                                mode === ModeType.More &&
                                                styles.selectedText
                                                    ? '#126EE3'
                                                    : '#999999'
                                            }
                                            className={styles.dot}
                                        />
                                        <Tooltip
                                            title={__(
                                                '用于查看和调整库表所有的属性信息',
                                            )}
                                        >
                                            <div
                                                className={classNames(
                                                    styles.text,
                                                    mode === ModeType.More &&
                                                        styles.selectedText,
                                                )}
                                                onClick={() => {
                                                    if (canSave) {
                                                        setMode?.(ModeType.More)
                                                    } else {
                                                        message.info(
                                                            __(
                                                                '请先在【模型】下构建完可用的输出库表',
                                                            ),
                                                        )
                                                    }
                                                }}
                                            >
                                                {__('更多属性')}
                                                {mode === ModeType.More && (
                                                    <div
                                                        className={
                                                            styles.bottomLine
                                                        }
                                                    />
                                                )}
                                            </div>
                                        </Tooltip>
                                    </div>
                                )}
                            {mode === ModeType.Model && !loading && (
                                <>
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
                                                    placement="top"
                                                    title={__('拖拽添加节点')}
                                                >
                                                    <Button
                                                        type="text"
                                                        icon={
                                                            <CommonIcon
                                                                icon={
                                                                    createNode
                                                                }
                                                            />
                                                        }
                                                        onMouseDown={(e) => {
                                                            onStartDrag(e)
                                                        }}
                                                        disabled={
                                                            addStageDisabled
                                                        }
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
                                            <div className={styles.toolSplit}>
                                                <div
                                                    className={
                                                        styles.toolSplitLine
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.toolbarContent}>
                                        <div className={styles.toolIcon}>
                                            <Tooltip
                                                placement="top"
                                                title={__('缩小')}
                                            >
                                                <Button
                                                    type="text"
                                                    icon={
                                                        <NarrowOutlined
                                                            style={{
                                                                fontSize:
                                                                    '14px',
                                                            }}
                                                            // disabled={graphSize <= 20}
                                                        />
                                                    }
                                                    onClick={() => {
                                                        onChangeGraphSize(
                                                            Math.round(
                                                                graphSize - 5,
                                                            ) / 100,
                                                        )
                                                    }}
                                                    disabled={graphSize <= 20}
                                                    className={`${
                                                        styles.toolButton
                                                    } ${
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
                                                        {`${Math.round(
                                                            graphSize,
                                                        )}%`}
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
                                                placement="top"
                                                title={__('放大')}
                                            >
                                                <Button
                                                    type="text"
                                                    icon={
                                                        <LargeOutlined
                                                            style={{
                                                                fontSize:
                                                                    '14px',
                                                            }}
                                                        />
                                                    }
                                                    onClick={() => {
                                                        onChangeGraphSize(
                                                            Math.round(
                                                                graphSize + 5,
                                                            ) / 100,
                                                        )
                                                    }}
                                                    disabled={graphSize >= 400}
                                                    className={`${
                                                        styles.toolButton
                                                    } ${
                                                        graphSize >= 400
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
                                        <div className={styles.toolIcon}>
                                            <Tooltip
                                                placement="top"
                                                title={__('定位')}
                                            >
                                                <Button
                                                    type="text"
                                                    icon={
                                                        <LocationOutlined
                                                            style={{
                                                                fontSize:
                                                                    '16px',
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
                                        {isHasEntrance && (
                                            <div className={styles.toolSplit}>
                                                <div
                                                    className={
                                                        styles.toolSplitLine
                                                    }
                                                />
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </Col>
                    <Col span={6}>
                        <div className={styles.toolSaveWrapper}>
                            <Space size={12}>
                                {(from === 'detail' ||
                                    operate === OperateType.EDIT) &&
                                    module !== ModuleType.SceneAnalysis && (
                                        <Button
                                            onClick={() => {
                                                navigator(
                                                    `/datasheet-view/detail?id=${viewId}&model=view&isCompleted=true&logic=${
                                                        module ===
                                                        ModuleType.CustomView
                                                            ? LogicViewType.Custom
                                                            : LogicViewType.LogicEntity
                                                    }`,
                                                )
                                            }}
                                        >
                                            {__('取消')}
                                        </Button>
                                    )}
                                <Tooltip
                                    placement="bottomRight"
                                    title={
                                        canSave
                                            ? ''
                                            : __(
                                                  '“输出库表”算子配置不完整，请先完善',
                                              )
                                    }
                                    overlayStyle={{ minWidth: 268 }}
                                >
                                    <Button
                                        style={{
                                            width:
                                                module !==
                                                    ModuleType.SceneAnalysis &&
                                                operate === OperateType.EDIT
                                                    ? 'auto'
                                                    : 80,
                                        }}
                                        type="primary"
                                        loading={loadingSave}
                                        disabled={
                                            !canSave ||
                                            (operate === OperateType.EDIT &&
                                                !datasheetInfo?.id)
                                        }
                                        onClick={async (e) => {
                                            if (canSave) {
                                                await setLoadingSave(true)
                                                await onSaveGraph()
                                                await setLoadingSave(false)
                                            }
                                        }}
                                    >
                                        {module === ModuleType.SceneAnalysis
                                            ? __('保存')
                                            : operate === OperateType.CREATE
                                            ? __('发布')
                                            : __('更新库表')}
                                    </Button>
                                </Tooltip>
                            </Space>
                        </div>
                    </Col>
                </Row>
            </AntdHeader>
            <EditGraphScene
                open={editVisible}
                data={sceneData}
                left={modalLeft}
                onClose={() => {
                    setEditVisible(false)
                }}
                onSure={(info) => {
                    setSceneData(info)
                    setEditVisible(false)
                }}
            />
        </div>
    )
}

export default GraphHeader
