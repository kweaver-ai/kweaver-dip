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
    InfoCircleOutlined,
    ExclamationCircleFilled,
} from '@ant-design/icons'
import { noop } from 'lodash'
import { Background } from '@antv/x6/lib/registry'
import { formatError } from '@/core'
import { IAssemblyLineEditParams } from '@/core/apis/assemblyLine/index.d'
import styles from './styles.module.less'
import {
    InfotipOutlined,
    LargeOutlined,
    LocationOutlined,
    NarrowOutlined,
} from '@/icons'
import { getActualUrl, useQuery } from '@/utils'
import __ from './locale'
import EditFormInfo from './EditFormInfo'
import { combQuery, combUrl } from './helper'
import FlowchartIconOutlined from '@/icons/FlowchartOutlined'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import GlobalMenu from '../GlobalMenu'
import { useBusinessModelContext } from '@/components/BusinessModeling/BusinessModelProvider'

const { Header: AntdHeader } = Layout

interface GraphToolBarType {
    onChangeGraphSize: (multiple: number) => void
    onShowAllGraphSize: () => void
    onSaveGraph: () => void
    graphSize: number
    mid: string
    targetFormInfo: any
    onUpdateFormInfo: (data) => void
    model: string
    onSwitchModel: () => void
    queryData: any
    onMovedToCenter: () => void
    isShowEdit: boolean
    saveDisabled: boolean
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
    graphSize = 100,
    mid,
    targetFormInfo,
    onUpdateFormInfo,
    model,
    onSwitchModel,
    queryData,
    onMovedToCenter,
    isShowEdit,
    saveDisabled,
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
    const query = useQuery()
    const { isButtonDisabled } = useBusinessModelContext()

    useEffect(() => {
        setFormInfo(targetFormInfo)
    }, [targetFormInfo])

    /**
     * 进入编辑
     */
    // const handleCenterEdit = () => {
    //     window.location.replace(
    //         getActualUrl(
    //             `/graph/resumedraft?id=${graphId}&state=${publishStatus}`,
    //         ),
    //     )
    // }

    /**
     * 返回事件
     */
    const handleReturnBack = () => {
        if (query.get('jumpMode') === 'win') {
            window.open(getActualUrl(combUrl(queryData)), '_self')
        } else {
            navigator(combUrl(queryData))
        }
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
            setFormInfo({
                ...formInfo,
                ...data,
            })
            onUpdateFormInfo({
                ...formInfo,
                ...data,
            })
            message.success(__('编辑成功'))
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
                    <Col span={6}>
                        <div className={styles.returnBox}>
                            <GlobalMenu />
                            <div
                                aria-hidden
                                className={styles.returnWrapper}
                                onClick={() => {
                                    if (model === 'view') {
                                        handleReturnBack()
                                    } else {
                                        ReturnConfirmModal({
                                            onCancel: handleReturnBack,
                                        })
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
                                {/* <Tooltip
                                    placement="top"
                                    title={__('业务表信息')}
                                >
                                    <InfotipOutlined
                                        style={{
                                            color: 'rgba(0,0,0,0.65)',
                                        }}
                                        onClick={(event) => {
                                            setFormInfoModalLeft(event.screenX)
                                            setformInfoOpenStatus(true)
                                        }}
                                    />
                                </Tooltip> */}
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
                    {model === 'view' ? (
                        <Col span={6}>
                            {isShowEdit ? (
                                <div className={styles.toolSaveWrapper}>
                                    <Tooltip
                                        title={
                                            isButtonDisabled
                                                ? __('审核中，无法操作')
                                                : ''
                                        }
                                    >
                                        <Button
                                            type="primary"
                                            className={styles.toolSaveButton}
                                            onClick={() => onSwitchModel()}
                                            disabled={isButtonDisabled}
                                        >
                                            编辑
                                        </Button>
                                    </Tooltip>
                                </div>
                            ) : null}
                        </Col>
                    ) : (
                        <Col span={6}>
                            <div className={styles.toolSaveWrapper}>
                                <Tooltip
                                    title={
                                        isButtonDisabled
                                            ? __('审核中，无法操作')
                                            : saveDisabled
                                            ? __('正在编辑中，无法操作')
                                            : ''
                                    }
                                >
                                    <Button
                                        className={styles.toolSaveButton}
                                        type="primary"
                                        icon={
                                            loadingSave ? (
                                                <LoadingOutlined
                                                    style={{
                                                        marginRight: '5px',
                                                    }}
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
                                        disabled={
                                            saveDisabled || isButtonDisabled
                                        }
                                    >
                                        保存
                                    </Button>
                                </Tooltip>
                            </div>
                        </Col>
                    )}
                </Row>
            </AntdHeader>
            <EditFormInfo
                open={formInfoOpenStatus}
                onClose={() => {
                    setformInfoOpenStatus(false)
                }}
                data={formInfo}
                left={formInfoModalleft}
                onUpdateData={(data) => {
                    onUpdateDomainData(data)
                }}
                graphModel={graphModel}
                mid={mid}
            />

            {confirmBack && (
                <Modal
                    open
                    width={480}
                    title={null}
                    closable={false}
                    maskClosable={false}
                    getContainer={false}
                    zIndex={1001}
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
                                onClick={() => {
                                    handleReturnBack()
                                }}
                            >
                                {__('放弃保存')}
                            </Button>
                            <Button
                                type="primary"
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
                                {__('保存并关闭')}
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
                                {__('确认要退出该业务表画布吗？')}
                            </div>
                            <div className={styles.deleteInfo}>
                                {__(
                                    '当前画布中创建的字段及信息可能未保存，若放弃保存将无法恢复画布中内容，请谨慎操作！',
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
