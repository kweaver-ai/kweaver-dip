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
import { Node } from '@antv/x6'
import { getConfigPaths } from '@/core'
import styles from './styles.module.less'
import { LargeOutlined, LocationOutlined, NarrowOutlined } from '@/icons'
import __ from './locale'
import { combUrl } from '../FormGraph/helper'
import FlowchartIconOutlined from '@/icons/FlowchartOutlined'
import { ViewModel } from './const'

const { Header: AntdHeader } = Layout

interface GraphToolBarType {
    onChangeGraphSize: (multiple: number) => void
    onShowAllGraphSize: () => void
    onSaveGraph: () => void
    onPublishGraph: () => void
    graphSize: number
    targetFormInfo: any
    onUpdateFormInfo: (data) => void
    model: ViewModel
    onSwitchModel: () => void
    queryData: any
    onMovedToCenter: () => void
    isShowEdit: boolean
    infoStatus: boolean
    onComplete: () => void
    isComplete: boolean
    originNode: Node | null
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
    onChangeGraphSize = noop,
    onShowAllGraphSize = noop,
    onSaveGraph = noop,
    onPublishGraph = noop,
    graphSize = 100,
    targetFormInfo,
    onUpdateFormInfo,
    model,
    onSwitchModel,
    queryData,
    onMovedToCenter,
    isShowEdit,
    infoStatus,
    onComplete,
    isComplete,
    originNode,
}: GraphToolBarType) => {
    const [formInfoModalleft, setFormInfoModalLeft] = useState('100px')
    // const [graphSize, setGraphSize] = useState(100)
    const navigator = useNavigate()
    const { pathname } = useLocation()
    const [searchParams, setSearchParams] = useSearchParams()
    const graphModel = pathname.split('/')[2]
    const publishStatus = searchParams.get('state')
    const [loadingSave, setLoadingSave] = useState(false)
    const [formInfo, setFormInfo] = useState(targetFormInfo)
    const [formInfoOpenStatus, setformInfoOpenStatus] = useState(false)
    const [confirmBack, setConfirmBack] = useState<boolean>(false)
    // const redirect = searchParams.get('redirect')

    useEffect(() => {
        setFormInfo(targetFormInfo)
    }, [targetFormInfo])

    /**
     * 返回事件
     */
    const handleReturnBack = () => {
        navigator(combUrl(queryData))
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
    return (
        <div className={styles.headerWrapper}>
            <AntdHeader className={styles.header}>
                <Row
                    style={{
                        width: '100%',
                    }}
                >
                    <Col span={6}>
                        <div className={styles.returnBox}>
                            <div
                                aria-hidden
                                className={styles.returnWrapper}
                                onClick={() => {
                                    if (model === ViewModel.ModelEdit) {
                                        if (!originNode?.data?.items.length) {
                                            handleReturnBack()
                                        } else {
                                            setConfirmBack(true)
                                        }
                                    } else {
                                        handleReturnBack()
                                    }
                                }}
                            >
                                <LeftOutlined className={styles.returnIcon} />
                                <div className={styles.return}>返回</div>
                                <div>
                                    {queryData.flowchart_id && (
                                        <FlowchartIconOutlined
                                            className={styles.pi_icon}
                                        />
                                    )}
                                </div>
                            </div>
                            <div className={styles.nameWrapper}>
                                <div
                                    className={styles.domainName}
                                    title={formInfo?.name}
                                >
                                    {formInfo?.name}
                                </div>
                            </div>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div className={styles.toolWrapper}>
                            <div className={styles.toolbarContent}>
                                <div className={styles.toolIcon}>
                                    <Tooltip placement="top" title="缩小">
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
                                    <Tooltip placement="top" title="放大">
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
                            </div>
                            <div className={styles.toolbarContent}>
                                <div className={styles.toolIcon}>
                                    <Tooltip placement="top" title="定位">
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
                    {model === ViewModel.Collect ? (
                        isComplete ? (
                            <div />
                        ) : (
                            <Col span={6}>
                                <div className={styles.toolSaveWrapper}>
                                    <Button
                                        type="link"
                                        onClick={async () => {
                                            const pathData = (
                                                await getConfigPaths()
                                            ).find(
                                                (pathInfo) =>
                                                    pathInfo.name === 'Dolphin',
                                            )
                                            if (pathData) {
                                                window.open(
                                                    `${pathData.addr}/dolphinscheduler/ui/projects/list`,
                                                )
                                            }
                                        }}
                                        style={{
                                            marginRight: '8px',
                                        }}
                                    >
                                        {__('前往采集平台')}
                                    </Button>
                                    <Button
                                        type="primary"
                                        className={styles.toolSaveButton}
                                        onClick={() => {
                                            onComplete()
                                        }}
                                    >
                                        {__('完成')}
                                    </Button>
                                </div>
                            </Col>
                        )
                    ) : model === ViewModel.ModelEdit ? (
                        <Col span={6}>
                            <div className={styles.toolSaveWrapper}>
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
                                    disabled={!originNode?.data?.items.length}
                                >
                                    {__('保存')}
                                </Button>
                                <Button
                                    className={styles.toolSaveButton}
                                    type="primary"
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
                                        await onPublishGraph()
                                        await setLoadingSave(false)
                                    }}
                                    disabled={!originNode?.data?.items.length}
                                >
                                    {infoStatus ? __('更新') : __('发布')}
                                </Button>
                            </div>
                        </Col>
                    ) : null}
                </Row>
            </AntdHeader>

            {confirmBack && (
                <Modal
                    open
                    width={480}
                    title={null}
                    closable={false}
                    maskClosable={false}
                    getContainer={false}
                    className={styles.tipMessage}
                    footer={
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                justifyContent: 'flex-end',
                            }}
                        >
                            <Button
                                style={{
                                    width: '80px',
                                }}
                                onClick={() => {
                                    handleReturnBack()
                                }}
                            >
                                {__('放弃保存')}
                            </Button>
                            <Button
                                type="primary"
                                style={{
                                    width: '94px',
                                }}
                                loading={loadingSave}
                                onClick={async (e) => {
                                    if (loadingSave) {
                                        e.preventDefault()
                                    }
                                    await setLoadingSave(true)
                                    await onSaveGraph()
                                    await setLoadingSave(false)
                                }}
                            >
                                {__('保存并退出')}
                            </Button>
                        </div>
                    }
                >
                    <div className={styles.dupBody}>
                        <div>
                            <span className={styles.deleteInfoIcon}>
                                <ExclamationCircleFilled />
                            </span>
                        </div>
                        <div className={styles.dupContent}>
                            <div className={styles.dupTitle}>
                                {__('确认要退出该采集画布吗？')}
                            </div>
                            <div className={styles.deleteInfo}>
                                {__(
                                    '当前画布中数据表、信息系统等信息可能未保存，若放弃保存将无法恢复画布中内容，请谨慎操作！',
                                )}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}

export default GraphToolBar
