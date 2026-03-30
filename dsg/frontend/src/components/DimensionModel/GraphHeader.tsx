import { DownOutlined, LeftOutlined } from '@ant-design/icons'
import { Button, Col, Divider, Dropdown, Layout, Row, Tooltip } from 'antd'
import { noop } from 'lodash'
import { ClassAttributes, memo, useEffect, useState } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { IDimModelItem } from '@/core/apis/indicatorManagement/index.d'
import {
    InfotipOutlined,
    LargeOutlined,
    LocationOutlined,
    NarrowOutlined,
} from '@/icons'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import { getInnerUrl } from '@/utils'
import EditDimensionModel from './EditDimensionModel'
import { ViewMode } from './const'
import __ from './locale'
import styles from './styles.module.less'
import GlobalMenu from '../GlobalMenu'
import { useGraphContext } from '@/context'

const { Header: AntdHeader } = Layout

interface IGraphHeader extends ClassAttributes<HTMLDivElement> {
    onEdit: () => void
    onSaveGraph: () => void
    data?: IDimModelItem
    viewMode?: ViewMode
    onChangeGraphSize: (multiple: number) => void
    onShowAllGraphSize: () => void
    onMovedToCenter: () => void
    onChangeInfo: (info: any) => void
    graphSize: number
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
    onChangeGraphSize = noop,
    onShowAllGraphSize = noop,
    onMovedToCenter = noop,
    graphSize = 100,
    onSaveGraph = noop,
    onChangeInfo = noop,
    onEdit = noop,
    data,
    viewMode,
}: IGraphHeader) => {
    const [searchParams] = useSearchParams()
    const fromLink = searchParams.get('from') || ''
    const navigator = useNavigate()
    const location = useLocation()
    const { expand, isChanged, isPanelChanged, hasErrorSure } =
        useGraphContext()
    // 场景信息
    const [dimModelData, setDimModelData] = useState<IDimModelItem>()
    // 信息弹窗左侧偏移量
    const [modalLeft, setModalLeft] = useState(100)
    // 弹窗显示/隐藏
    const [editVisible, setEditVisible] = useState(false)
    // 保存load
    const [loadingSave, setLoadingSave] = useState(false)

    useEffect(() => {
        setDimModelData(data)
    }, [data])

    useEffect(() => {
        if (dimModelData && !dimModelData.id) {
            // 新建模型
            onChangeInfo?.(dimModelData)
        }
    }, [dimModelData])

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

    const handleBackWay = () => {
        if (fromLink) {
            navigator(getInnerUrl(fromLink))
        } else {
            navigator('/dataService/dimensionModel')
        }
    }

    // 返回
    const handleReturnBack = () => {
        if (viewMode === ViewMode.VIEW || (!isChanged && !isPanelChanged)) {
            // navigator('/dataService/dimensionModel')
            handleBackWay()
        } else {
            ReturnConfirmModal({
                onCancel: () => {
                    // navigator('/dataService/dimensionModel')
                    handleBackWay()
                },
            })
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
                            aria-hidden
                            className={styles.returnWrapper}
                            onClick={() => {
                                handleReturnBack()
                            }}
                        >
                            <LeftOutlined />
                            <div className={styles.return}>{__('返回')}</div>
                        </div>
                        <div className={styles.nameWrapper}>
                            <div
                                className={styles.domainName}
                                title={dimModelData?.name}
                            >
                                {dimModelData?.name}
                            </div>
                            <Tooltip placement="top" title={__('维度模型信息')}>
                                <div
                                    className={styles.iconWrapper}
                                    onClick={(event) => {
                                        if (!expand) {
                                            setModalLeft(event.clientX)
                                            setEditVisible(true)
                                        }
                                    }}
                                >
                                    <InfotipOutlined
                                        style={{
                                            color: `rgba(0,0,0,${
                                                expand ? 0.25 : 0.65
                                            })`,
                                        }}
                                    />
                                </div>
                            </Tooltip>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div className={styles.toolWrapper}>
                            <div className={styles.toolbarContent}>
                                <div className={styles.toolIcon}>
                                    <Tooltip placement="top" title={__('缩小')}>
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
                                    <Tooltip placement="top" title={__('放大')}>
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
                                    <Tooltip placement="top" title={__('定位')}>
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
                    <Col span={6}>
                        <div className={styles.toolSaveWrapper}>
                            <Button
                                type="primary"
                                onClick={onEdit}
                                hidden={
                                    viewMode === ViewMode.EDIT ||
                                    viewMode === ViewMode.ONLY_VIEW
                                }
                            >
                                {__('编辑')}
                            </Button>
                            <Button
                                type="primary"
                                loading={loadingSave}
                                hidden={
                                    viewMode === ViewMode.VIEW ||
                                    viewMode === ViewMode.ONLY_VIEW
                                }
                                onClick={async (e) => {
                                    await setLoadingSave(true)
                                    await onSaveGraph()
                                    await setLoadingSave(false)
                                }}
                                disabled={expand || !isChanged || hasErrorSure}
                            >
                                {__('保存')}
                            </Button>
                        </div>
                    </Col>
                </Row>
            </AntdHeader>
            <EditDimensionModel
                open={editVisible}
                data={dimModelData}
                left={modalLeft}
                onClose={() => {
                    setEditVisible(false)
                }}
                onSure={(info) => {
                    setDimModelData(info)
                    setEditVisible(false)
                }}
                viewMode={viewMode}
            />
        </div>
    )
}

export default memo(GraphHeader)
