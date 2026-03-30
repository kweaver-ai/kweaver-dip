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
    Steps,
} from 'antd'
import {
    LeftOutlined,
    DownOutlined,
    LoadingOutlined,
    InfoCircleOutlined,
    ExclamationCircleFilled,
    DashboardOutlined,
} from '@ant-design/icons'
import { noop } from 'lodash'
import classnames from 'classnames'
import { Background } from '@antv/x6/lib/registry'
import { formatError, getConfigPaths } from '@/core'
import { IAssemblyLineEditParams } from '@/core/apis/assemblyLine/index.d'
import styles from './styles.module.less'
import {
    IndicatorDataOutlined,
    IndicatorModelOutlined,
    IndicatorThinColored,
    InfotipOutlined,
    LargeOutlined,
    LocationOutlined,
    NarrowOutlined,
} from '@/icons'
import { getActualUrl } from '@/utils'
import __ from './locale'
import { combQuery, combUrl } from '../FormGraph/helper'
import FlowchartIconOutlined from '@/icons/FlowchartOutlined'
import { OptionModel, ViewModel } from './const'
import EditMetricInfo from './EditMetricInfo'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'

const { Header: AntdHeader } = Layout

interface GraphToolBarType {
    onSaveModel: (acting) => void
    onPublishGraph: () => void
    targetMetricInfo: any
    onUpdateMetricInfo: (data) => void
    onFinish: (data) => void
    model: string
    queryData: any
    stage: number
    checkNameRepeat: (value) => Promise<void>
    onUpdateStage: (value) => void
    hasSelectedFormId: Array<string>
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
    onSaveModel = noop,
    onPublishGraph = noop,
    targetMetricInfo,
    onUpdateMetricInfo,
    model,
    queryData,
    stage,
    checkNameRepeat,
    onUpdateStage,
    hasSelectedFormId,
    onFinish,
}: GraphToolBarType) => {
    const [metricInfoModalleft, setMetricInfoModalLeft] = useState('100px')
    // const [graphSize, setGraphSize] = useState(100)
    const navigator = useNavigate()
    const { pathname } = useLocation()
    const [searchParams, setSearchParams] = useSearchParams()
    const graphModel = pathname.split('/')[2]
    const publishStatus = searchParams.get('state')
    const [loadingSave, setLoadingSave] = useState(false)
    const [metricInfo, setMetricInfo] = useState(targetMetricInfo)
    const [metricInfoOpenStatus, setmetricInfoOpenStatus] = useState(false)
    const [confirmBack, setConfirmBack] = useState<boolean>(false)
    // const redirect = searchParams.get('redirect')

    useEffect(() => {
        setMetricInfo(targetMetricInfo)
    }, [targetMetricInfo])

    /**
     * 返回事件
     */
    const handleReturnBack = () => {
        ReturnConfirmModal({
            onCancel: () => {
                if (searchParams.get('jumpMode') === 'win') {
                    window.open(getActualUrl(combUrl(queryData)), '_self')
                    return
                }
                navigator(combUrl(queryData))
            },
        })
    }

    const getGroupButton = () => {
        switch (model) {
            case OptionModel.CreateModel:
                return stage === 0 ? (
                    <div className={styles.toolSaveWrapper}>
                        <Button
                            className={styles.toolSaveButton}
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
                                          backgroundColor: 'rab(127.182.246)',
                                          cursor: 'default',
                                      }
                                    : {}
                            }
                            onClick={async (e) => {
                                if (loadingSave) {
                                    e.preventDefault()
                                }
                                await setLoadingSave(true)
                                await onSaveModel('onlySave')
                                await setLoadingSave(false)
                            }}
                        >
                            {__('保存')}
                        </Button>
                        <Tooltip title={__('配置指标规则')} placement="bottom">
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
                                    onSaveModel('step')
                                }}
                                disabled={!hasSelectedFormId.length}
                            >
                                {__('下一步')}
                            </Button>
                        </Tooltip>
                    </div>
                ) : (
                    <div className={styles.toolSaveWrapper}>
                        <Button
                            className={styles.toolSaveButton}
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
                                          backgroundColor: 'rab(127.182.246)',
                                          cursor: 'default',
                                      }
                                    : {}
                            }
                            onClick={async (e) => {
                                onUpdateStage(0)
                            }}
                        >
                            {__('上一步')}
                        </Button>
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
                                          backgroundColor: 'rab(127.182.246)',
                                          cursor: 'default',
                                      }
                                    : {}
                            }
                            onClick={onFinish}
                        >
                            {__('完成')}
                        </Button>
                    </div>
                )
            case OptionModel.EditModel:
                return (
                    <div className={styles.toolSaveWrapper}>
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
                                          backgroundColor: 'rab(127.182.246)',
                                          cursor: 'default',
                                      }
                                    : {}
                            }
                            onClick={async (e) => {
                                if (loadingSave) {
                                    e.preventDefault()
                                }
                                await setLoadingSave(true)
                                await onSaveModel('leave')
                                await setLoadingSave(false)
                            }}
                            disabled={!hasSelectedFormId.length}
                        >
                            {__('完成')}
                        </Button>
                    </div>
                )
            case OptionModel.EditMetric:
            case OptionModel.CreateMetric:
                return (
                    <div className={styles.toolSaveWrapper}>
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
                                          backgroundColor: 'rab(127.182.246)',
                                          cursor: 'default',
                                      }
                                    : {}
                            }
                            onClick={onFinish}
                        >
                            {__('完成')}
                        </Button>
                    </div>
                )
            case OptionModel.MetricDetail:
            default:
                return <div />
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
                            {model !== OptionModel.MetricDetail && (
                                <div
                                    aria-hidden
                                    className={styles.returnWrapper}
                                    onClick={() => {
                                        handleReturnBack()
                                    }}
                                >
                                    <LeftOutlined
                                        className={styles.returnIcon}
                                    />
                                    <div className={styles.return}>
                                        {__('返回')}
                                    </div>
                                    <div>
                                        {queryData.flowchart_id && (
                                            <FlowchartIconOutlined
                                                className={styles.pi_icon}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className={styles.nameWrapper}>
                                <div className={styles.preIconContent}>
                                    <IndicatorModelOutlined
                                        className={styles.icon}
                                    />
                                </div>
                                <div
                                    className={styles.domainName}
                                    title={metricInfo?.name}
                                >
                                    {metricInfo?.name}
                                </div>
                                {model !== OptionModel.MetricDetail && (
                                    <Tooltip
                                        placement="bottom"
                                        title={__('业务指标模型信息')}
                                    >
                                        <InfotipOutlined
                                            style={{
                                                color: 'rgba(0,0,0,0.65)',
                                            }}
                                            onClick={(event) => {
                                                setMetricInfoModalLeft(
                                                    event.screenX,
                                                )
                                                setmetricInfoOpenStatus(true)
                                            }}
                                        />
                                    </Tooltip>
                                )}
                            </div>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div className={styles.stepContent}>
                            {model === OptionModel.CreateModel ? (
                                <Steps
                                    items={[
                                        {
                                            title: __('绘制指标模型'),
                                            icon: (
                                                <div
                                                    className={classnames(
                                                        styles.stepIcon,
                                                        stage === 0
                                                            ? styles.stepCurrrent
                                                            : styles.stepFinish,
                                                    )}
                                                >
                                                    <IndicatorModelOutlined />
                                                </div>
                                            ),
                                        },
                                        {
                                            title: __('配置指标规则'),
                                            icon: (
                                                <div
                                                    className={classnames(
                                                        styles.stepIcon,
                                                        stage === 1
                                                            ? styles.stepCurrrent
                                                            : styles.stepFinish,
                                                    )}
                                                >
                                                    <IndicatorThinColored />
                                                </div>
                                            ),
                                        },
                                    ]}
                                    current={stage}
                                />
                            ) : null}
                        </div>
                    </Col>
                    <Col span={6}>{getGroupButton()}</Col>
                </Row>
            </AntdHeader>

            {metricInfoOpenStatus && (
                <EditMetricInfo
                    open={metricInfoOpenStatus}
                    onClose={() => {
                        setmetricInfoOpenStatus(false)
                    }}
                    checkNameRepeat={checkNameRepeat}
                    data={metricInfo}
                    left={metricInfoModalleft}
                    onUpdateData={async (data) => {
                        onUpdateMetricInfo(data)
                        setmetricInfoOpenStatus(false)
                    }}
                    graphModel={
                        (model === OptionModel.CreateModel && stage === 0) ||
                        model === OptionModel.EditModel
                            ? ViewModel.ModelEdit
                            : ViewModel.ModelView
                    }
                />
            )}
        </div>
    )
}

export default GraphToolBar
