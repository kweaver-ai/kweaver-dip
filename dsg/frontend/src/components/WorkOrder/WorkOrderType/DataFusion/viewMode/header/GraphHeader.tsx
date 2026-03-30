import React, { useState, useEffect, ClassAttributes } from 'react'
import {
    Layout,
    Row,
    Col,
    Button,
    Dropdown,
    Divider,
    Tooltip,
    Space,
    message,
    Popover,
} from 'antd'
import { LeftOutlined, DownOutlined } from '@ant-design/icons'
import __ from '../locale'
import {
    LargeOutlined,
    NarrowOutlined,
    LocationOutlined,
    FontIcon,
} from '@/icons'
import GlobalMenu from '@/components/GlobalMenu'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import styles from './styles.module.less'
import { useViewGraphContext } from '../ViewGraphProvider'
import AddMenu from './AddMenu'
import { formulaInfo, FormulaType } from '../const'

const { Header: AntdHeader } = Layout
message.config({
    top: 100,
})

interface IGraphHeader extends ClassAttributes<HTMLDivElement> {
    graphSize: number
    canSave?: boolean
    onClose: () => void
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
    graphSize = 100,
    canSave = true,
    onClose,
}: IGraphHeader) => {
    const {
        viewMode,
        modelInfo,
        onShowAll,
        onChangeSize,
        onMovedToCenter,
        onSave: onSaveGraph,
    } = useViewGraphContext()
    // 保存load
    const [loadingSave, setLoadingSave] = useState(false)
    // 添加节点弹窗
    const [open, setOpen] = useState(false)

    // 返回
    const handleReturnBack = () => {
        if (viewMode === 'edit') {
            ReturnConfirmModal({
                onCancel: () => {
                    onClose()
                },
            })
        } else {
            onClose()
        }
    }

    const handleSave = async () => {
        if (canSave) {
            try {
                setLoadingSave(true)
                await onSaveGraph()
            } catch (error) {
                // message.error(error.message)
            } finally {
                setLoadingSave(false)
            }
        }
    }
    // 选择画布大小
    const selectGraphSize = (key: string) => {
        switch (true) {
            case key === 'all':
                onShowAll()
                break
            case key === 'divider':
                break
            default:
                onChangeSize(Number(key) / 100)
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
                        {modelInfo?.table_name && (
                            <div className={styles.nameWrapper}>
                                <div className={styles.nameborder} />
                                <div
                                    className={styles.domainName}
                                    title={modelInfo?.table_name}
                                >
                                    {modelInfo?.table_name}
                                </div>
                            </div>
                        )}
                    </Col>
                    <Col span={12}>
                        <div className={styles.toolWrapper}>
                            {
                                <>
                                    <div
                                        style={{
                                            display: 'inline-flex',
                                        }}
                                    >
                                        <div className={styles.toolbarContent}>
                                            {viewMode === 'edit' && (
                                                <div
                                                    className={`${styles.toolIcon} ${styles.toolButtonSpace}`}
                                                >
                                                    <Popover
                                                        placement="bottom"
                                                        title=""
                                                        // disabled
                                                        trigger={['click']}
                                                        open={open}
                                                        onOpenChange={(
                                                            newOpen: boolean,
                                                        ) => {
                                                            setOpen(newOpen)
                                                        }}
                                                        getPopupContainer={(
                                                            n,
                                                        ) =>
                                                            n.parentElement || n
                                                        }
                                                        content={
                                                            <AddMenu
                                                                items={[
                                                                    {
                                                                        title: __(
                                                                            '添加算子',
                                                                        ),
                                                                        menus: [
                                                                            FormulaType.FORM,
                                                                            FormulaType.JOIN,
                                                                            FormulaType.MERGE,
                                                                            FormulaType.WHERE,
                                                                            FormulaType.SELECT,
                                                                            FormulaType.DISTINCT,
                                                                            FormulaType.SQL,
                                                                        ].map(
                                                                            (
                                                                                item,
                                                                            ) => ({
                                                                                key: item,
                                                                                label: formulaInfo[
                                                                                    item
                                                                                ]
                                                                                    .name,
                                                                                desc: formulaInfo[
                                                                                    item
                                                                                ]
                                                                                    .featureTip,
                                                                            }),
                                                                        ),
                                                                    },
                                                                ]}
                                                                handleOperate={(
                                                                    item,
                                                                ) => {
                                                                    setOpen(
                                                                        false,
                                                                    )
                                                                }}
                                                            />
                                                        }
                                                    >
                                                        <Tooltip
                                                            placement="top"
                                                            title={__(
                                                                '添加节点',
                                                            )}
                                                        >
                                                            <Button
                                                                type="text"
                                                                icon={
                                                                    <FontIcon
                                                                        name="icon-xinjianjiedian"
                                                                        style={{
                                                                            fontSize: 14,
                                                                        }}
                                                                    />
                                                                }
                                                                className={
                                                                    styles.toolButton
                                                                }
                                                            />
                                                        </Tooltip>
                                                    </Popover>
                                                </div>
                                            )}
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
                                                        onChangeSize(
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
                                                            onChangeSize(1)
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
                                                        onChangeSize(
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
                                    </div>
                                </>
                            }
                        </div>
                    </Col>
                    <Col span={6}>
                        {viewMode === 'edit' && (
                            <div className={styles.toolSaveWrapper}>
                                <Space size={12}>
                                    <Tooltip
                                        placement="bottomRight"
                                        title={
                                            canSave
                                                ? ''
                                                : __(
                                                      '「输出融合表」算子配置不完整，请先完善',
                                                  )
                                        }
                                        overlayStyle={{ minWidth: 268 }}
                                    >
                                        <Button
                                            style={{
                                                minWidth: 80,
                                            }}
                                            type="primary"
                                            loading={loadingSave}
                                            disabled={!canSave}
                                            onClick={async (e) => handleSave()}
                                        >
                                            {__('保存')}
                                        </Button>
                                    </Tooltip>
                                </Space>
                            </div>
                        )}
                    </Col>
                </Row>
            </AntdHeader>
        </div>
    )
}

export default GraphHeader
