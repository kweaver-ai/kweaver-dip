import { Button, Checkbox, Drawer, Radio, Space, Table } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import { CaretRightOutlined, PlusOutlined } from '@ant-design/icons'
import classNames from 'classnames'
import __ from '../locale'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import styles from './styles.module.less'
import { SearchInput } from '@/ui'
import { ApplyResource, SharingTab } from '../const'
import ResourceDetails from '../Details/ResourceDetails'
import AddResourceDrawer from '../component/AddResourceDrawer'
import CompareRes from './CompareRes'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { getDataRangeOptions } from '@/components/ResourcesDir/helper'
import { updateCycleOptions } from '@/components/ResourcesDir/const'
import { ResTypeEnum } from '../helper'
import { IShareApplyResource } from '@/core'
import ApiImp from '../Implement/ApiImp'
import ViewResult from '../Implement/ViewResult'
import Implement from '../Implement'
import ViewFields from '../Details/ViewFields'
import ViewApiInfo from '../Details/ViewApiInfo'

interface CatalogTableProps {
    items?: any[] // 目录列表
    handleAddResource?: () => void
    handleAnalysis?: (resId: string, isSingle?: boolean) => void
    isView?: boolean
    getExtraOptions?: (record: any) => any
    isImplement?: boolean
    applyId?: string
    handleResUnreasonable?: (isAll: boolean) => void
    tab?: SharingTab
    isShowOperate?: boolean
}

const ResourceTable = ({
    items = [],
    handleAddResource,
    handleAnalysis,
    isView = false,
    getExtraOptions,
    isImplement = false,
    applyId,
    handleResUnreasonable = () => {},
    tab,
    isShowOperate = true,
}: CatalogTableProps) => {
    const [unreasonableChecked, setUnreasonableChecked] = useState(false)
    const [diffOpen, setDiffOpen] = useState(false)
    const [showItems, setShowItems] = useState<any[]>([])
    const [viewInfo, setViewInfo] = useState<any>()
    const [isShowAnalysisResult, setIsShowAnalysisResult] = useState(false)
    const [isShowApiImp, setIsShowApiImp] = useState(false)
    const [operateItem, setOperateItem] = useState<any>()
    const [showImplement, setShowImplement] = useState(false)
    const [showViewResult, setShowViewResult] = useState(false)
    const [catalogId, setCatalogId] = useState('')
    const [viewFieldsOpen, setViewFieldsOpen] = useState(false)
    const [viewFieldsId, setViewFieldsId] = useState('')
    const [viewApiOpen, setViewApiOpen] = useState(false)
    const [viewApiId, setViewApiId] = useState('')
    const [{ using, governmentSwitch }] = useGeneralConfig()

    const governmentStatus = useMemo(() => {
        return governmentSwitch.on
    }, [governmentSwitch])

    useEffect(() => {
        setShowItems(items)
    }, [items])

    const getCatalogItem = (
        name: string,
        record: any,
        isReplace: boolean = false,
    ) => {
        return (
            <div
                className={classNames(
                    styles['catalog-info-container'],
                    styles['origin-container'],
                    isReplace && styles['replace-container'],
                )}
            >
                <FontIcon
                    name={
                        record.res_type === ResTypeEnum.Catalog
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
                {record.replace_res && (
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
                )}
            </div>
        )
    }

    const getResInfoItem = (record) => {
        const isApi = record.apply_conf?.supply_type === ApplyResource.Interface
        const name = isApi
            ? record.apply_conf?.api_apply_conf?.data_res_name
            : record.apply_conf?.view_apply_conf?.data_res_name
        const code = isApi
            ? record.apply_conf?.api_apply_conf?.data_res_code
            : record.apply_conf?.view_apply_conf?.data_res_code
        return name ? (
            <div
                className={classNames(
                    styles['catalog-info-container'],
                    styles['origin-container'],
                )}
            >
                <FontIcon
                    name={isApi ? 'icon-jiekoufuwuguanli' : 'icon-shitusuanzi'}
                    type={IconType.COLOREDICON}
                    className={styles['catalog-icon']}
                />
                <div className={styles['catalog-info']}>
                    <div className={styles['catalog-name']} title={name}>
                        {name}
                    </div>
                    <div className={styles['catalog-code']} title={code}>
                        {code}
                    </div>
                </div>
            </div>
        ) : null
    }

    const getInfoColumns = (
        record: IShareApplyResource & any,
        isReplace: boolean = false,
    ) => {
        const names = JSON.parse(
            record.apply_conf?.view_apply_conf?.column_names || '[]',
        )
        const len = names.length
        return (
            <div
                className={classNames(
                    styles['catalog-columns-container'],
                    styles['origin-container'],
                    isReplace && styles['replace-container'],
                )}
            >
                {len > 0 ? (
                    <>
                        <div
                            className={styles['catalog-columns-item']}
                            title={names[0]}
                        >
                            {names[0]}
                        </div>
                        {len > 1 && (
                            <div className={styles['catalog-columns-more']}>
                                +{len - 1}
                            </div>
                        )}
                    </>
                ) : (
                    '--'
                )}
            </div>
        )
    }

    const implementPlan = (record) => {
        if (record.apply_conf.supply_type === ApplyResource.Interface) {
            setIsShowApiImp(true)
            setOperateItem(record)
        } else {
            setShowImplement(true)
            setOperateItem(record)
            setCatalogId(record.apply_conf.view_apply_conf.data_res_id)
        }
    }

    const handViewFields = (id: string) => {
        setViewFieldsOpen(true)
        setViewFieldsId(id)
    }

    const handViewApi = (id: string) => {
        setViewApiOpen(true)
        setViewApiId(id)
    }

    const columns = useMemo(() => {
        const cols = [
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
                    return (
                        <>
                            {getCatalogItem(name, record)}
                            {record.replace_res &&
                                getCatalogItem(
                                    record.replace_res.res_name,
                                    record.replace_res,
                                    true,
                                )}
                        </>
                    )
                },
            },
            {
                title: __('数据提供方'),
                dataIndex: 'org_path',
                key: 'org_path',
                render: (text: string, record: any) => (
                    <div>
                        <div
                            title={text || record.department_path}
                            className={styles['origin-container']}
                        >
                            {text}
                        </div>
                        {record.replace_res && (
                            <div
                                title={
                                    record.replace_res.org_path ||
                                    record.replace_res.department_path
                                }
                                className={styles['replace-container']}
                            >
                                {text}
                            </div>
                        )}
                    </div>
                ),
                ellipsis: true,
            },
            {
                title: __('数据范围'),
                dataIndex: 'data_range',
                key: 'data_range',
                render: (text: number, record: any) => (
                    <div>
                        <div
                            title={record.data_range}
                            className={styles['origin-container']}
                        >
                            {[...getDataRangeOptions(governmentStatus)].find(
                                (item) => item.value === text,
                            )?.label || '--'}
                        </div>
                        {record.replace_res && (
                            <div
                                title={record.replace_res.data_range}
                                className={styles['replace-container']}
                            >
                                {[
                                    ...getDataRangeOptions(governmentStatus),
                                ].find(
                                    (item) =>
                                        item.value ===
                                        record.replace_res.data_range,
                                )?.label || '--'}
                            </div>
                        )}
                    </div>
                ),
            },
            {
                title: __('更新周期'),
                dataIndex: 'update_cycle',
                key: 'update_cycle',
                render: (text: number, record: any) => (
                    <div>
                        <div
                            title={record.update_cycle}
                            className={styles['origin-container']}
                        >
                            {updateCycleOptions.find(
                                (item) => item.value === text,
                            )?.label || '--'}
                        </div>
                        {record.replace_res && (
                            <div
                                title={record.replace_res.update_cycle}
                                className={styles['replace-container']}
                            >
                                {updateCycleOptions.find(
                                    (item) =>
                                        item.value ===
                                        record.replace_res.update_cycle,
                                )?.label || '--'}
                            </div>
                        )}
                    </div>
                ),
            },
            {
                title: __('提供方式'),
                dataIndex: 'supply_type',
                key: 'supply_type',
                render: (text: string, record: any) => {
                    return (
                        <>
                            <div className={styles['origin-container']}>
                                {record.apply_conf?.supply_type ===
                                ApplyResource.Database
                                    ? __('库表交换')
                                    : record.apply_conf?.supply_type ===
                                      ApplyResource.Interface
                                    ? __('接口')
                                    : '--'}
                            </div>
                            {record.replace_res && (
                                <div className={styles['replace-container']}>
                                    {__('库表交换')}
                                </div>
                            )}
                        </>
                    )
                },
            },
            {
                title: __('提供数据资源'),
                dataIndex: 'supply_res',
                key: 'supply_res',
                width: 300,
                render: (text: string, record: any) => {
                    return (
                        <>
                            {record.replace_res ? '--' : getResInfoItem(record)}
                            {record.replace_res &&
                                getResInfoItem(record.replace_res)}
                        </>
                    )
                },
            },
            {
                title: __('字段/参数详情'),
                dataIndex: 'supply_type',
                key: 'supply_type',
                render: (text: string, record: any) => {
                    return (
                        <>
                            <div className={styles['origin-container']}>
                                {record.replace_res ? (
                                    '--'
                                ) : record.apply_conf?.supply_type ===
                                  ApplyResource.Database ? (
                                    <Button
                                        type="link"
                                        onClick={() =>
                                            handViewFields(
                                                record.apply_conf
                                                    .view_apply_conf
                                                    .data_res_id,
                                            )
                                        }
                                    >
                                        {__('表字段')}
                                    </Button>
                                ) : (
                                    <Button
                                        type="link"
                                        onClick={() =>
                                            handViewApi(
                                                record.apply_conf.api_apply_conf
                                                    .data_res_id,
                                            )
                                        }
                                    >
                                        {__('接口参数')}
                                    </Button>
                                )}
                            </div>
                            {record.replace_res && (
                                <div className={styles['replace-container']}>
                                    {record.replace_res.apply_conf
                                        ?.supply_type ===
                                    ApplyResource.Database ? (
                                        <Button
                                            type="link"
                                            onClick={() =>
                                                handViewFields(
                                                    record.replace_res
                                                        .apply_conf
                                                        .view_apply_conf
                                                        .data_res_id,
                                                )
                                            }
                                        >
                                            {__('表字段')}
                                        </Button>
                                    ) : (
                                        <Button
                                            type="link"
                                            onClick={() =>
                                                handViewApi(
                                                    record.apply_conf
                                                        .api_apply_conf
                                                        .data_res_id,
                                                )
                                            }
                                        >
                                            {__('接口参数')}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </>
                    )
                },
            },
            // 接口交换不展示申请信息项
            // {
            //     title: __('申请信息项'),
            //     dataIndex: 'columns',
            //     key: 'columns',
            //     width: 206,
            //     render: (_, record) => (
            //         <>
            //             {getInfoColumns(record)}
            //             {record.replace_res &&
            //                 getInfoColumns(record.replace_res, true)}
            //         </>
            //     ),
            // },
            {
                title: __('分析结果'),
                dataIndex: 'is_reasonable',
                key: 'is_reasonable',
                render: (isReasonable: boolean, record) => (
                    <>
                        <div className={styles['origin-container']}>
                            {record.replace_res
                                ? __('不合理')
                                : typeof record.is_reasonable === 'boolean'
                                ? record.is_reasonable
                                    ? __('合理')
                                    : __('不合理')
                                : '--'}
                        </div>
                        {record.replace_res && (
                            <div className={styles['replace-container']}>
                                {__('合理')}
                            </div>
                        )}
                    </>
                ),
            },
            {
                title: __('操作'),
                dataIndex: 'action',
                key: 'action',
                width: 220,
                render: (_, record) => {
                    return (
                        <>
                            {isView && !isImplement && (
                                <div>
                                    <div className={styles['origin-container']}>
                                        <Space>
                                            <Button
                                                type="link"
                                                onClick={() => {
                                                    setViewInfo(record)
                                                    setIsShowAnalysisResult(
                                                        false,
                                                    )
                                                }}
                                            >
                                                {__('查看')}
                                            </Button>
                                            {getExtraOptions?.(record)}
                                        </Space>
                                    </div>
                                    {record.replace_res && (
                                        <div
                                            className={
                                                styles['replace-container']
                                            }
                                        >
                                            <Button
                                                type="link"
                                                onClick={() => {
                                                    setViewInfo(
                                                        record.replace_res,
                                                    )
                                                    setIsShowAnalysisResult(
                                                        true,
                                                    )
                                                }}
                                            >
                                                {__('查看')}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                            {!isView && !isImplement && (
                                <div>
                                    <div className={styles['origin-container']}>
                                        <Button
                                            type="link"
                                            onClick={() =>
                                                handleAnalysis?.(
                                                    record.res_id,
                                                    true,
                                                )
                                            }
                                            disabled={unreasonableChecked}
                                        >
                                            {__('分析资源')}
                                        </Button>
                                    </div>
                                    {record.replace_res && (
                                        <div
                                            className={
                                                styles['replace-container']
                                            }
                                        >
                                            <Button
                                                type="link"
                                                onClick={() =>
                                                    handleAnalysis?.(
                                                        record.replace_res
                                                            .res_id,
                                                        true,
                                                    )
                                                }
                                                disabled={unreasonableChecked}
                                            >
                                                {__('分析资源')}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                            {isImplement && (
                                <div>
                                    <div className={styles['origin-container']}>
                                        <Space>
                                            <Button
                                                type="link"
                                                onClick={() => {
                                                    setViewInfo(record)
                                                    setIsShowAnalysisResult(
                                                        false,
                                                    )
                                                }}
                                            >
                                                {__('分析方案')}
                                            </Button>
                                            {!record.replace_res && (
                                                <>
                                                    {![
                                                        SharingTab.AnalysisImprove,
                                                        SharingTab.AnalysisConfirm,
                                                    ].includes(
                                                        tab as SharingTab,
                                                    ) ? (
                                                        [
                                                            SharingTab.Apply,
                                                            SharingTab.ImplementResult,
                                                        ].includes(
                                                            tab as SharingTab,
                                                        ) &&
                                                        record.res_type ===
                                                            ResTypeEnum.Api ? null : (
                                                            <Button
                                                                type="link"
                                                                onClick={() =>
                                                                    implementPlan(
                                                                        record,
                                                                    )
                                                                }
                                                            >
                                                                {__('实施方案')}
                                                            </Button>
                                                        )
                                                    ) : null}

                                                    {![
                                                        SharingTab.ImplementPlan,
                                                        SharingTab.AnalysisImprove,
                                                        SharingTab.AnalysisConfirm,
                                                    ].includes(
                                                        tab as SharingTab,
                                                    ) && (
                                                        <Button
                                                            type="link"
                                                            onClick={() => {
                                                                setShowViewResult(
                                                                    true,
                                                                )
                                                                setOperateItem(
                                                                    record,
                                                                )
                                                            }}
                                                        >
                                                            {__('实施成果')}
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </Space>
                                    </div>
                                    {record.replace_res && (
                                        <div
                                            className={
                                                styles['replace-container']
                                            }
                                        >
                                            <Space>
                                                <Button
                                                    type="link"
                                                    onClick={() => {
                                                        setViewInfo(record)
                                                        setIsShowAnalysisResult(
                                                            false,
                                                        )
                                                    }}
                                                >
                                                    {__('分析方案')}
                                                </Button>
                                                {/* 分析完善 分析确认 详情没有实施方案 */}
                                                {![
                                                    SharingTab.AnalysisImprove,
                                                    SharingTab.AnalysisConfirm,
                                                ].includes(
                                                    tab as SharingTab,
                                                ) ? (
                                                    // 752595:共享申请清单和实施成果确认：详情页中针对“接口注册”资源的操作中，需屏蔽“实施方案”按钮
                                                    [
                                                        SharingTab.Apply,
                                                        SharingTab.ImplementResult,
                                                    ].includes(
                                                        tab as SharingTab,
                                                    ) &&
                                                    record.replace_res
                                                        .res_type ===
                                                        ResTypeEnum.Api ? null : (
                                                        <Button
                                                            type="link"
                                                            onClick={() =>
                                                                implementPlan(
                                                                    record.replace_res,
                                                                )
                                                            }
                                                        >
                                                            {__('实施方案')}
                                                        </Button>
                                                    )
                                                ) : null}

                                                {/* 实施方案确认 分析完善,分析确认没有实施成果 */}
                                                {![
                                                    SharingTab.ImplementPlan,
                                                    SharingTab.AnalysisImprove,
                                                    SharingTab.AnalysisConfirm,
                                                ].includes(
                                                    tab as SharingTab,
                                                ) && (
                                                    <Button
                                                        type="link"
                                                        onClick={() => {
                                                            setShowViewResult(
                                                                true,
                                                            )
                                                            setOperateItem(
                                                                record.replace_res,
                                                            )
                                                        }}
                                                    >
                                                        {__('实施成果')}
                                                    </Button>
                                                )}
                                            </Space>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )
                },
            },
        ]
        return isShowOperate
            ? cols
            : cols.filter((col) => col.key !== 'is_reasonable')
    }, [unreasonableChecked, isShowOperate])

    const handleKeyChange = (key: string) => {
        setShowItems(
            items.filter(
                (item) =>
                    item.res_name.includes(key) ||
                    item.res_code.includes(key) ||
                    item.replace_res?.res_name.includes(key) ||
                    item.replace_res?.res_code.includes(key),
            ),
        )
    }

    return (
        <div
            className={classNames(
                styles['catalog-table-wrapper'],
                styles['resource-table-wrapper'],
            )}
        >
            <div className={styles['operate-content']}>
                <Space size={20}>
                    {!isView && (
                        <>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleAddResource}
                                disabled={unreasonableChecked}
                            >
                                {__('添加资源')}
                            </Button>
                            <Button
                                disabled={unreasonableChecked}
                                onClick={() =>
                                    handleAnalysis?.(items?.[0]?.res_id, false)
                                }
                            >
                                {__('分析资源')}
                            </Button>
                        </>
                    )}
                    {isShowOperate && (
                        <Button
                            disabled={unreasonableChecked}
                            onClick={() => setDiffOpen(true)}
                        >
                            {__('资源分析前后差异')}
                        </Button>
                    )}

                    {!isView && (
                        <Checkbox
                            checked={unreasonableChecked}
                            onChange={(e) => {
                                setUnreasonableChecked(e.target.checked)
                                handleResUnreasonable(e.target.checked)
                            }}
                        >
                            {__('全部资源不合理')}
                        </Checkbox>
                    )}
                </Space>
                {isShowOperate && (
                    <SearchInput
                        placeholder={__('搜索资源名称、资源编码')}
                        style={{ width: 280 }}
                        onKeyChange={handleKeyChange}
                    />
                )}
            </div>
            <Table
                columns={columns}
                dataSource={showItems}
                pagination={{ hideOnSinglePage: true }}
                rowKey="id"
            />
            {diffOpen && (
                <CompareRes
                    open={diffOpen}
                    items={items}
                    onClose={() => setDiffOpen(false)}
                />
            )}
            {viewInfo && (
                <Drawer
                    title={__('查看资源')}
                    open={!!viewInfo}
                    onClose={() => {
                        setViewInfo(undefined)
                    }}
                    bodyStyle={{ padding: 0 }}
                    width={837}
                    push={false}
                >
                    <div className={styles['view-resource-wrapper']}>
                        <div className={styles['resource-details-container']}>
                            <ResourceDetails data={viewInfo || {}} />
                        </div>
                        {!isShowAnalysisResult && (
                            <div
                                className={styles['analysis-result-container']}
                            >
                                <div className={styles['basic-item']}>
                                    <div className={styles.label}>
                                        {__('分析结果')}：
                                    </div>
                                    <div className={styles.value}>
                                        {viewInfo.is_reasonable
                                            ? __('合理')
                                            : __('不合理')}
                                    </div>
                                </div>
                                <div
                                    className={classNames(
                                        styles['basic-item'],
                                        styles['basic-item-noflex'],
                                    )}
                                >
                                    <div className={styles.label}>
                                        {__('需要申请方补充的内容')}：
                                    </div>
                                    <Checkbox.Group
                                        value={viewInfo.additional_info_types?.split(
                                            ',',
                                        )}
                                        disabled
                                    >
                                        {viewInfo.apply_conf.supply_type ===
                                            ApplyResource.Database && (
                                            <Checkbox value="data-source">
                                                {__('数据源信息')}
                                            </Checkbox>
                                        )}
                                        <Checkbox value="usage">
                                            {__('数据用途')}
                                        </Checkbox>
                                        <Checkbox value="attachment">
                                            {__(
                                                '申请材料（如勾选，请补充说明）',
                                            )}
                                        </Checkbox>
                                    </Checkbox.Group>
                                </div>
                                <div className={styles['basic-item']}>
                                    <div className={styles.label}>
                                        {__('申请材料补充说明')}：
                                    </div>
                                    <div className={styles.value}>
                                        {viewInfo.attach_add_remark || '--'}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Drawer>
            )}

            {isShowApiImp && operateItem && (
                <ApiImp
                    open={isShowApiImp}
                    onClose={() => {
                        setIsShowApiImp(false)
                        setOperateItem(undefined)
                    }}
                    applyId={applyId || ''}
                    analysisId={operateItem.analysis_item_id}
                />
            )}
            {showImplement && applyId && (
                <Implement
                    open={showImplement}
                    applyId={applyId}
                    onClose={() => {
                        setShowImplement(false)
                        setOperateItem('')
                        setCatalogId('')
                    }}
                    analysisId={operateItem.analysis_item_id}
                    catalogId={catalogId}
                />
            )}
            {showViewResult && applyId && (
                <ViewResult
                    open={showViewResult}
                    onClose={() => {
                        setShowViewResult(false)
                    }}
                    id={operateItem.analysis_item_id}
                    applyId={applyId}
                />
            )}
            {viewFieldsOpen && viewFieldsId && (
                <ViewFields
                    open={viewFieldsOpen}
                    onCancel={() => {
                        setViewFieldsOpen(false)
                        setViewFieldsId('')
                    }}
                    id={viewFieldsId}
                />
            )}
            {viewApiOpen && viewApiId && (
                <ViewApiInfo
                    open={viewApiOpen}
                    onCancel={() => {
                        setViewApiOpen(false)
                        setViewApiId('')
                    }}
                    id={viewApiId}
                />
            )}
        </div>
    )
}

export default ResourceTable
