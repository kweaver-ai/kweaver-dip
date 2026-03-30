import { Button, Col, Drawer, message, Row, Space, Table } from 'antd'
import { CaretRightOutlined, InfoCircleFilled } from '@ant-design/icons'
import moment from 'moment'
import { FC, useEffect, useState } from 'react'
import classnames from 'classnames'
import DrawerHeader from '../component/DrawerHeader'

import __ from '../locale'
import styles from './styles.module.less'
import { CommonTitle, SearchInput } from '@/ui'
import { ApplyResource, ConfirmTableType } from '../const'
import { IconType } from '@/icons/const'
import { FontIcon } from '@/icons'
import Implement from '.'
import ViewResult from './ViewResult'
import {
    formatError,
    getImplementCityShareApplyDetail,
    ImplementCatalogStatus,
    putCityShareApplyImplementAchivementConfirm,
    putCityShareApplyImplementSolutionConfirm,
    ShareApplyConfirmResult,
    ShareApplySubmitType,
} from '@/core'
import { applyFieldsConfig } from '../Details/helper'
import ApplyDetails from '../Details/CommonDetails'
import { ResTypeEnum } from '../helper'

interface ConfirmPlanProps {
    applyId: string
    open: boolean
    onClose: () => void
    isResult?: boolean
}
const ConfirmPlan: FC<ConfirmPlanProps> = ({
    applyId,
    open,
    onClose,
    isResult = false,
}) => {
    const [showTip, setShowTip] = useState<boolean>(true)
    const [hasConfirmData, setConfirmData] = useState<Array<any>>([])
    const [undoConfirmData, setUndoConfirmData] = useState<Array<any>>([])
    const [activeTable, setActiveTable] = useState<ConfirmTableType>(
        ConfirmTableType.UNDO_CONFIRM_TABLE,
    )
    const [confirmPlanShow, setConfirmPlanShow] = useState<boolean>(false)

    const [viewPlanShow, setViewPlanShow] = useState<boolean>(false)

    const [operationId, setOperationId] = useState<string>('')

    const [operateItem, setOperateItem] = useState<any>({})

    const [viewResultShow, setViewResultShow] = useState<boolean>(false)

    const [baseInfo, setBaseInfo] = useState<any>({})

    const [allListData, setAllListData] = useState<Array<any>>([])

    const [searchValue, setSearchValue] = useState<string>('')

    const [confirmingData, setConfirmingData] = useState<Array<any>>([])

    const [resultData, setResultData] = useState<Array<any>>([])

    useEffect(() => {
        if (applyId) {
            getCatalogData(applyId)
        }
    }, [applyId, isResult])

    useEffect(() => {
        if (allListData.length > 0 && !isResult) {
            setUndoConfirmData(
                allListData
                    .filter((item) => !item.solution_confirm_result)
                    .filter((item) => {
                        if (searchValue) {
                            return (
                                item.res_name
                                    .toLowerCase()
                                    .includes(searchValue.toLowerCase()) ||
                                item.res_code
                                    .toLowerCase()
                                    .includes(searchValue.toLowerCase())
                            )
                        }
                        return true
                    }),
            )
            setConfirmData(
                allListData
                    .filter((item) => item.solution_confirm_result)
                    .filter((item) => {
                        if (searchValue) {
                            return (
                                item.res_name
                                    .toLowerCase()
                                    .includes(searchValue.toLowerCase()) ||
                                item.res_code
                                    .toLowerCase()
                                    .includes(searchValue.toLowerCase())
                            )
                        }
                        return true
                    }),
            )
        } else {
            setResultData(
                allListData.filter((item) => {
                    if (searchValue) {
                        return (
                            item.res_name
                                .toLowerCase()
                                .includes(searchValue.toLowerCase()) ||
                            item.res_code
                                .toLowerCase()
                                .includes(searchValue.toLowerCase())
                        )
                    }
                    return true
                }),
            )
        }
    }, [allListData, searchValue, isResult])

    useEffect(() => {
        if (hasConfirmData.length > 0) {
            setConfirmingData(
                hasConfirmData.map((item) => ({
                    analysis_item_id: item?.id,
                    solution_confirm_result: item?.solution_confirm_result,
                    solution_confirm_remark:
                        item?.solution_confirm_reject_reason,
                })),
            )
        }
    }, [hasConfirmData])

    const getCatalogItem = (
        name: string,
        record: any,
        isReplace: boolean = false,
    ) => {
        return (
            <div
                className={classnames(
                    styles['catalog-info-container'],
                    styles['origin-container'],
                    isReplace && styles['replace-container'],
                )}
            >
                <FontIcon
                    name={
                        record?.res_type === ResTypeEnum.Catalog
                            ? 'icon-shujumuluguanli1'
                            : 'icon-jiekoufuwuguanli'
                    }
                    type={IconType.COLOREDICON}
                    className={styles['catalog-icon']}
                />
                <div className={styles['catalog-info']}>
                    <div className={styles['catalog-name']} title={name}>
                        {name}
                    </div>
                    <div
                        className={styles['catalog-code']}
                        title={record.res_code}
                    >
                        {record.res_code}
                    </div>
                </div>
                {/* {record.replace_res && (
                    <FontIcon
                        name="icon-yuan"
                        type={IconType.COLOREDICON}
                        className={styles['origin-icon']}
                    />
                )}
                {isReplace && (
                    <FontIcon
                        name="icon-ti"
                        type={IconType.COLOREDICON}
                        className={styles['replace-icon']}
                    />
                )}
                {record.new_res_id && !record.replace_res && (
                    <FontIcon
                        name="icon-new"
                        type={IconType.COLOREDICON}
                        className={styles['new-catalog-icon']}
                    />
                )}
                {isReplace && (
                    <div className={styles['replace-flag']}>
                        <div className={styles['replace-text']}>
                            {__('替换')}
                        </div>
                        <CaretRightOutlined
                            className={styles['replace-arrow']}
                        />
                    </div>
                )} */}
            </div>
        )
    }

    const getInfoColumns = (record, isReplace: boolean = false) => {
        const columnNames = JSON.parse(record?.column_names || '[]')
        const len = columnNames.length || 0
        return (
            <div
                className={classnames(
                    styles['catalog-columns-container'],
                    styles['origin-container'],
                    isReplace && styles['replace-container'],
                )}
            >
                {len > 0 ? (
                    <>
                        <div
                            className={styles['catalog-columns-item']}
                            title={columnNames[0]}
                        >
                            {columnNames[0]}
                        </div>
                        {len > 1 && (
                            <div className={styles['catalog-columns-more']}>
                                +{(columnNames.length || 0) - 1}
                            </div>
                        )}
                    </>
                ) : (
                    '--'
                )}
            </div>
        )
    }

    /**
     * 获取资源清单
     * @param id
     */
    const getCatalogData = async (id: string) => {
        try {
            const res = await getImplementCityShareApplyDetail(id, {
                view: isResult
                    ? ImplementCatalogStatus.IMPL_ACHV_CONFIRM
                    : ImplementCatalogStatus.IMPL_SOLU_CONFIRM,
            })
            const { resources, ...rest } = res || {}
            setBaseInfo(rest)
            if (isResult) {
                setResultData(resources)
            } else {
                setAllListData(
                    resources.filter((item) => item.supply_type === 'view'),
                )
            }
        } catch (err) {
            formatError(err)
        }
    }

    const operationData = (id) => {
        setOperationId(id)
        if (isResult) {
            setViewResultShow(true)
        } else if (activeTable === ConfirmTableType.UNDO_CONFIRM_TABLE) {
            setConfirmPlanShow(true)
        } else {
            setViewPlanShow(true)
        }
    }
    const columns = [
        {
            title: (
                <div className={styles['column-title-res']}>
                    {__('资源名称（编码）')}
                </div>
            ),
            dataIndex: 'res_name',
            key: 'res_name',
            width: 300,
            render: (name: string, record: any) => {
                return <>{getCatalogItem(name, record)}</>
            },
        },
        {
            title: __('数据提供部门'),
            dataIndex: 'org_path',
            key: 'org_path',
            render: (text: string, record: any) => (
                <div>
                    <div
                        title={record.org_path}
                        className={styles['origin-container']}
                    >
                        {text}
                    </div>
                </div>
            ),
            ellipsis: true,
        },
        {
            title: __('数据范围'),
            dataIndex: 'data_range',
            key: 'data_range',
            render: (text: string, record: any) => (
                <div>
                    <div
                        title={record.data_range}
                        className={styles['origin-container']}
                    >
                        {text}
                    </div>
                </div>
            ),
        },
        {
            title: __('更新周期'),
            dataIndex: 'update_cycle',
            key: 'update_cycle',
            render: (text: string, record: any) => (
                <div>
                    <div
                        title={record.update_cycle}
                        className={styles['origin-container']}
                    >
                        {text}
                    </div>
                </div>
            ),
        },
        {
            title: __('提供方式'),
            dataIndex: 'supply_type',
            key: 'supply_type',
            render: (text: string, record: any) => {
                return (
                    <div className={styles['origin-container']}>
                        {record.supply_type === ApplyResource.Database
                            ? __('库表交换')
                            : record.supply_type === ApplyResource.Interface
                            ? __('接口')
                            : '--'}
                    </div>
                )
            },
        },
        // 库表不展示申请信息项
        {
            title: __('申请信息项'),
            dataIndex: 'column_ids',
            key: 'column_ids',
            width: 206,
            render: (_, record) => <>{getInfoColumns(record)}</>,
        },
        {
            title: __('是否通过'),
            dataIndex: 'solution_confirm_result',
            key: 'solution_confirm_result',
            width: 206,
            render: (text: string, record: any) =>
                text === ShareApplyConfirmResult.Pass ? (
                    <div className={styles['origin-container']}>
                        {__('通过')}
                    </div>
                ) : text === ShareApplyConfirmResult.Reject ? (
                    <div className={styles['origin-container']}>
                        {__('驳回')}
                    </div>
                ) : (
                    <div className={styles['origin-container']}>--</div>
                ),
        },
        {
            title: __('操作'),
            dataIndex: 'action',
            key: 'action',
            render: (_, record) =>
                isResult ? (
                    <Button
                        type="link"
                        onClick={() => {
                            setOperateItem(record)
                            operationData(record.id)
                        }}
                    >
                        {__('查看成果')}
                    </Button>
                ) : activeTable === ConfirmTableType.UNDO_CONFIRM_TABLE ? (
                    <Button
                        type="link"
                        onClick={() => {
                            setOperateItem(record)
                            operationData(record.id)
                        }}
                    >
                        {__('确认方案')}
                    </Button>
                ) : (
                    <Button
                        type="link"
                        onClick={() => {
                            setOperateItem(record)
                            operationData(record.id)
                        }}
                    >
                        {__('查看')}
                    </Button>
                ),
        },
    ]

    const handleSave = async (submitType: ShareApplySubmitType) => {
        try {
            if (isResult) {
                await putCityShareApplyImplementAchivementConfirm(applyId)
                message.success(__('确认成功'))
                onClose?.()
            } else {
                await putCityShareApplyImplementSolutionConfirm(applyId, {
                    submit_type: submitType,
                    confirm_infos: confirmingData,
                })
                if (submitType === ShareApplySubmitType.Submit) {
                    message.success(__('提交成功'))
                    onClose?.()
                } else {
                    message.success(__('暂存成功'))
                    onClose?.()
                }
            }
        } catch (error) {
            formatError(error)
        }
    }
    return (
        <Drawer
            open={open}
            width="100%"
            placement="right"
            closable={false}
            bodyStyle={{
                padding: '0',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 1080,
            }}
            contentWrapperStyle={{ minWidth: 800 }}
            destroyOnClose
            maskClosable={false}
            mask={false}
            push={false}
        >
            <div
                className={classnames(
                    styles.details,
                    styles['analysis-details-wrapper'],
                )}
            >
                {/* 导航头部 */}
                <DrawerHeader
                    title={__('数据资源实施')}
                    fullScreen
                    onClose={onClose}
                />

                {/* 内容 */}
                <div className={styles.bottom}>
                    <div className={styles.content}>
                        <div className={styles['content-body']}>
                            <div className={styles['content-body']}>
                                <div className={styles['common-title']}>
                                    <CommonTitle title={__('申请信息')} />
                                </div>
                                <Row className={styles['apply-info-row']}>
                                    <ApplyDetails
                                        data={baseInfo}
                                        configData={applyFieldsConfig}
                                    />
                                </Row>
                                <div className={styles['common-title']}>
                                    <CommonTitle title={__('资源清单')} />
                                </div>
                                <div className={styles.groupContainer}>
                                    {showTip && !isResult && (
                                        <div
                                            className={styles.tipMessageWrapper}
                                        >
                                            <div className={styles.message}>
                                                <InfoCircleFilled
                                                    className={styles.icon}
                                                />
                                                <span>
                                                    {__(
                                                        '请确认资源的实施方案是否合理，如果不通过，可以退回给实施人员修改',
                                                    )}
                                                </span>
                                            </div>
                                            <Button
                                                type="link"
                                                onClick={() => {
                                                    setShowTip(false)
                                                }}
                                            >
                                                {__('不再提醒')}
                                            </Button>
                                        </div>
                                    )}
                                    <div
                                        className={classnames(
                                            styles['resource-table-wrapper'],
                                            styles['catalog-table-wrapper'],
                                            styles.tableContainer,
                                        )}
                                    >
                                        <div className={styles.tableTitleBar}>
                                            {isResult ? (
                                                <div />
                                            ) : (
                                                <div
                                                    className={styles.tableTab}
                                                >
                                                    <div
                                                        onClick={() => {
                                                            setActiveTable(
                                                                ConfirmTableType.UNDO_CONFIRM_TABLE,
                                                            )
                                                        }}
                                                        className={
                                                            activeTable ===
                                                            ConfirmTableType.UNDO_CONFIRM_TABLE
                                                                ? styles.selected
                                                                : styles.unselected
                                                        }
                                                    >
                                                        {__(
                                                            '待确认资源（${count}）',
                                                            {
                                                                count: undoConfirmData.length.toString(),
                                                            },
                                                        )}
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.splitLine
                                                        }
                                                    />
                                                    <div
                                                        onClick={() => {
                                                            setActiveTable(
                                                                ConfirmTableType.HAS_CONFIRM_TABLE,
                                                            )
                                                        }}
                                                        className={
                                                            activeTable ===
                                                            ConfirmTableType.HAS_CONFIRM_TABLE
                                                                ? styles.selected
                                                                : styles.unselected
                                                        }
                                                    >
                                                        {__(
                                                            '已确认资源（${count}）',
                                                            {
                                                                count: hasConfirmData.length.toString(),
                                                            },
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <SearchInput
                                                placeholder={__(
                                                    '搜索资源名称、资源编码',
                                                )}
                                                style={{ width: 280 }}
                                                onKeyChange={(e) => {
                                                    setSearchValue(e)
                                                }}
                                            />
                                        </div>

                                        <Table
                                            columns={columns.filter(
                                                (item) =>
                                                    item.key !==
                                                        'solution_confirm_result' ||
                                                    !isResult,
                                            )}
                                            dataSource={
                                                isResult
                                                    ? resultData
                                                    : activeTable ===
                                                      ConfirmTableType.UNDO_CONFIRM_TABLE
                                                    ? undoConfirmData
                                                    : hasConfirmData
                                            }
                                            pagination={{
                                                hideOnSinglePage: true,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 底部栏 */}
                        <div className={styles.footer}>
                            <Space>
                                <Button
                                    className={styles.btn}
                                    onClick={() => {
                                        onClose?.()
                                    }}
                                >
                                    {__('取消')}
                                </Button>
                                {!isResult && (
                                    <Button
                                        className={styles.btn}
                                        onClick={() => {
                                            handleSave(
                                                ShareApplySubmitType.Draft,
                                            )
                                        }}
                                    >
                                        {__('暂存')}
                                    </Button>
                                )}
                                <Button
                                    type="primary"
                                    className={styles.btn}
                                    // loading={saveLoading}
                                    onClick={() => {
                                        handleSave(ShareApplySubmitType.Submit)
                                    }}
                                >
                                    {__('提交')}
                                </Button>
                            </Space>
                        </div>
                    </div>
                </div>
                {confirmPlanShow && (
                    <Implement
                        open={confirmPlanShow}
                        applyId={applyId}
                        onClose={() => {
                            setConfirmPlanShow(false)
                            setOperationId('')
                        }}
                        isConfirmPlan
                        analysisId={operateItem?.id}
                        onConfirm={(values) => {
                            // setConfirmingData([
                            //     ...confirmingData,
                            //     {
                            //         ...values,
                            //         analysis_item_id: operateItem?.id,
                            //     },
                            // ])
                            setAllListData(
                                allListData.map((item) =>
                                    item.id === operateItem?.id
                                        ? {
                                              ...item,
                                              solution_confirm_result:
                                                  values.solution_confirm_result,
                                              solution_confirm_reject_reason:
                                                  values?.solution_confirm_remark,
                                          }
                                        : item,
                                ),
                            )
                            setConfirmPlanShow(false)
                            setOperationId('')
                        }}
                        catalogId={operateItem?.data_res_id || ''}
                    />
                )}
                {viewPlanShow && (
                    <Implement
                        open={viewPlanShow}
                        applyId={applyId}
                        onClose={() => {
                            setViewPlanShow(false)
                            setOperationId('')
                        }}
                        isConfirmPlan
                        isViewPlan
                        analysisId={operateItem?.id}
                        catalogId={operateItem?.data_res_id}
                    />
                )}
                {viewResultShow && (
                    <ViewResult
                        open={viewResultShow}
                        onClose={() => {
                            setViewResultShow(false)
                        }}
                        id={operationId}
                        applyId={applyId}
                    />
                )}
            </div>
        </Drawer>
    )
}

export default ConfirmPlan
