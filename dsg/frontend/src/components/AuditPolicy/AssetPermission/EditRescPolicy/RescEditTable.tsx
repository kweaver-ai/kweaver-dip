import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useState,
} from 'react'
import {
    Table,
    Button,
    Space,
    FormInstance,
    Input,
    Select,
    Tooltip,
    InputProps,
    Popconfirm,
} from 'antd'
import { useDebounce, useUpdateEffect } from 'ahooks'
import _, { trim } from 'lodash'
import {
    InfoCircleFilled,
    InfoCircleOutlined,
    PlusOutlined,
} from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'
import { Empty, LightweightSearch, Loader, SearchInput } from '@/ui'
import { getActualUrl, getPopupContainer, OperateType } from '@/utils'
import dataEmpty from '@/assets/dataEmpty.svg'
import {
    filterItems,
    policyRescTypeToDataRescType,
    rescTypeList,
} from '../helper'
import { getDataRescTypeIcon } from '@/components/DataAssetsCatlg/DataResc/helper'
import { OnlineStatus, PolicyDataRescType, RescPolicyType } from '@/core'

import SelDataRescModal, { policyRescMaxNum } from '../SelDataRescModal'
import ApplicationServiceDetail from '@/components/DataAssetsCatlg/ApplicationServiceDetail'
import IndicatorViewDetail from '@/components/DataAssetsCatlg/IndicatorViewDetail'
import LogicViewDetail from '@/components/DataAssetsCatlg/LogicViewDetail'

interface EditableTableProps {
    ref?: any

    curForm?: FormInstance
    policyDetail?: any
    value?: any
    // onlyRead?: boolean
    onChange?: (value: any[]) => void
}

const RescEditTable: React.FC<EditableTableProps> = forwardRef(
    (
        {
            curForm,
            // onlyRead = false,
            policyDetail = {},
            value = [],
            onChange,
        }: any,
        ref,
    ) => {
        const rescCatlgKeys = {
            id: 'id',
            name: 'name',
        }

        // const [originDataSource, setOriginDataSource] = useState<any[]>([])
        // const [filterDataSource, setFilterDataSource] = useState<any[]>([])
        // const [checkedList, setCheckedList] = useState<any[]>([])
        // 表格选中项
        const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
        const rowSelection: any = {
            selectedRowKeys,
            onChange: (keys: React.Key[], selectedRows: any[]) => {
                // setCheckedList(selectedRows)
                setSelectedRowKeys(keys)
            },
        }
        const [searchCondition, setSearchCondition] = useState<{
            keyword?: string
            rescType?: PolicyDataRescType
            offset: number
            limit: number
        }>({
            keyword: '',
            rescType: PolicyDataRescType.NOLIMIT,
            offset: 1,
            limit: 10,
        })
        const searchDebounce = useDebounce(searchCondition, { wait: 100 })

        const [tableLoading, setTableLoading] = useState<boolean>(false)

        // 表格操作列对应行
        const [curOprResc, setCurOprResc] = useState<any>()
        // 视图详情
        const [viewDetailOpen, setViewDetailOpen] = useState<boolean>(false)
        // 接口详情
        const [interfaceDetailOpen, setInterfaceDetailOpen] =
            useState<boolean>(false)
        // 指标详情
        const [indicatorDetailOpen, setIndicatorDetailOpen] =
            useState<boolean>(false)

        // 添加资源modal
        const [selRescModalOpen, setSelRescModalOpen] = useState<boolean>(false)
        // 审核资源列表（后端返回策略所有审核的资源）
        const [auditAllRescList, setAuditAllRescList] = useState<any[]>([])
        const [auditRescList, setAuditRescList] = useState<any[]>([])
        // 列表总数
        const [total, setTotal] = useState<number>(0)
        // 点击确定后，校验申请用途
        const [clickSubmit, setClickSubmit] = useState<boolean>(false)
        // 临时移除的资源id
        const [tempRemoveIds, setTempRemoveIds] = useState<string[]>([])

        useImperativeHandle(ref, () => ({
            rescList: auditAllRescList,
            clickSubmit: () => {
                setClickSubmit(true)
            },
        }))

        useEffect(() => {
            if (policyDetail?.resources?.length) {
                setAuditAllRescList(policyDetail?.resources || [])
                curForm?.setFieldsValue({
                    resources: policyDetail?.resources || [],
                })
            }
        }, [policyDetail])

        useEffect(() => {
            const originIds =
                policyDetail?.resources?.map((item) => item?.id) || []
            const newIds = auditAllRescList?.map((item) => item?.id) || []
            const removeIds =
                originIds?.filter((item) => !newIds?.includes(item)) || []
            setTempRemoveIds(removeIds)
        }, [auditAllRescList, policyDetail?.resources])

        const handleDelete = (record: any) => {
            setAuditAllRescList((prev) => {
                return (prev || []).filter((item) => {
                    return item?.id !== record?.id
                })
            })
            const { resources } = curForm?.getFieldsValue() || {}
            const newResources = [...(resources || [])].filter(
                (item, index) => item?.id === record?.id,
            )
            curForm?.setFieldsValue({
                resources: newResources,
            })
            onChange?.(newResources)
        }

        const handleDeleteSelected = () => {
            const newResources = (auditAllRescList || []).filter(
                (item, index) => !selectedRowKeys?.includes(item?.id),
            )

            setAuditAllRescList(newResources)
            curForm?.setFieldsValue({
                resources: newResources,
            })
            onChange?.(newResources)
        }

        useUpdateEffect(() => {
            const {
                keyword,
                rescType,
                offset = 1,
                limit = 10,
            } = searchCondition
            setTableLoading(true)
            const start = (offset - 1) * limit
            const end = offset * limit
            const newFilterDataSource = auditAllRescList?.filter((item) => {
                const { type, name, technical_name, uniform_catalog_code } =
                    item || {}
                const kw = keyword?.toLocaleLowerCase() || ''
                return (
                    (rescType === PolicyDataRescType.NOLIMIT ||
                        type === rescType) &&
                    (name?.toLocaleLowerCase()?.includes(kw) ||
                        technical_name?.toLocaleLowerCase()?.includes(kw) ||
                        uniform_catalog_code?.toLocaleLowerCase()?.includes(kw))
                )
            })

            setAuditRescList(newFilterDataSource?.slice(start, end) || [])
            setTotal(newFilterDataSource?.length || 0)
            setTimeout(() => {
                setTableLoading(false)
            }, 200)
        }, [searchDebounce, auditAllRescList])

        const columns = useMemo(
            () => [
                {
                    title: (
                        <div>
                            <span style={{ color: 'rgba(0,0,0,0.85)' }}>
                                {__('资源名称')}
                            </span>
                            <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                                &nbsp;{__('(编码)')}
                            </span>
                        </div>
                    ),
                    dataIndex: 'name',
                    key: 'name',
                    ellipsis: true,
                    // width: 300,
                    render: (text, record, index) => {
                        const { type, sub_type, status } = record
                        return (
                            <div className={styles.titleBox}>
                                {getDataRescTypeIcon({
                                    type: policyRescTypeToDataRescType[type],
                                    indicator_type: sub_type,
                                })}
                                <div className={styles.itemTitleInfo}>
                                    <div
                                        title={text}
                                        className={text ? styles.name : ''}
                                        onClick={() =>
                                            handleTableOpr(
                                                OperateType.DETAIL,
                                                record,
                                                index,
                                            )
                                        }
                                    >
                                        {text || '--'}
                                    </div>
                                    <div
                                        className={styles.codeInfo}
                                        title={record?.uniform_catalog_code}
                                    >
                                        {record?.uniform_catalog_code || '--'}
                                    </div>
                                </div>

                                {status === OnlineStatus.OFFLINE && (
                                    <Tooltip
                                        color="#fff"
                                        title={__('已下线资源不能进行权限申请')}
                                        overlayInnerStyle={{
                                            color: 'rgba(0, 0, 0, 0.85)',
                                        }}
                                    >
                                        <div className={styles.onlineStatus}>
                                            {__('已下线')}
                                        </div>
                                    </Tooltip>
                                )}
                            </div>
                        )
                    },
                },
                {
                    title: __('资源类型'),
                    dataIndex: 'type',
                    key: 'type',
                    ellipsis: true,
                    // width: 300,
                    render: (type, record) => {
                        return (
                            rescTypeList?.find((tItem) =>
                                [
                                    policyRescTypeToDataRescType[type],
                                    type,
                                ].includes(tItem.value),
                            )?.label || '--'
                        )
                    },
                },
                {
                    title: __('资源技术名称'),
                    dataIndex: 'technical_name',
                    key: 'technical_name',
                    ellipsis: true,
                    render: (text, record) => text || '--',
                },
                {
                    title: __('所属主题'),
                    dataIndex: 'subject',
                    key: 'subject',
                    render: (text, record) => (
                        <span title={record?.subject_path}>{text || '--'}</span>
                    ),
                },
                {
                    title: __('所属部门'),
                    dataIndex: 'department',
                    key: 'department',
                    render: (text, record) => (
                        <span title={record?.department_path}>
                            {text || '--'}
                        </span>
                    ),
                },
                {
                    title: '操作',
                    key: 'action',
                    width: 132,
                    render: (text: any, record: any, index: number) => (
                        <Space size={16}>
                            <Button
                                type="link"
                                onClick={() =>
                                    handleTableOpr(
                                        OperateType.DETAIL,
                                        record,
                                        index,
                                    )
                                }
                            >
                                {__('详情')}
                            </Button>
                            <Button
                                type="link"
                                onClick={() => {
                                    handleTableOpr(
                                        OperateType.DELETE,
                                        record,
                                        index,
                                    )
                                }}
                            >
                                {__('移除')}
                            </Button>
                        </Space>
                    ),
                },
            ],
            [],
        )

        // 分页改变
        const onPaginationChange = (page, pageSize) => {
            setSearchCondition({
                ...searchCondition,
                offset: page || 1,
                limit: pageSize,
            })
        }

        const handleChange = (val: string, record: any) => {
            setAuditAllRescList((prev) =>
                (prev || [])?.map((item) => {
                    return {
                        ...item,
                        apply_permission:
                            item?.data_catalog_id === record?.data_catalog_id
                                ? val?.split('_')
                                : item.apply_permission,
                    }
                }),
            )
        }

        const searchChange = (data, dataKey) => {
            if (!dataKey) {
                // 清空筛选
                setSearchCondition({
                    ...searchCondition,
                    ...data,
                })
            } else {
                const dk = dataKey

                setSearchCondition({
                    ...searchCondition,
                    [dk]: data[dk],
                })
            }
        }

        const handleTableOpr = (
            opr: OperateType,
            record: any,
            index: number,
        ) => {
            const { type } = record
            setCurOprResc(record)
            switch (opr) {
                case OperateType.DETAIL:
                    if (type === PolicyDataRescType.LOGICALVIEW) {
                        setViewDetailOpen(true)
                    } else if (type === PolicyDataRescType.INTERFACE) {
                        setInterfaceDetailOpen(true)
                    } else if (type === PolicyDataRescType.INDICATOR) {
                        setIndicatorDetailOpen(true)
                    }
                    break
                case OperateType.DELETE:
                    handleDelete(record)
                    break
                default:
                    break
            }
        }

        return (
            <div className={styles.auditRescWrapper}>
                <div className={styles.auditListRescTitle}>
                    <span>
                        {__('审核资源 (${text}/${total})', {
                            text: auditAllRescList?.length || '0',
                            total: policyRescMaxNum,
                        })}
                    </span>
                    <Tooltip
                        title={
                            <div>
                                <div style={{ fontWeight: 550 }}>
                                    {__('审核资源')}
                                </div>
                                <div>
                                    {__(
                                        '这些资源在发起权限申请时，将按照对应策略内的审核流程进行审核。',
                                    )}
                                </div>
                            </div>
                        }
                        placement="bottomLeft"
                        color="#fff"
                        overlayStyle={{ maxWidth: 460 }}
                        overlayInnerStyle={{
                            color: 'rgba(0,0,0,0.85)',
                        }}
                    >
                        <InfoCircleOutlined
                            style={{
                                fontSize: '16px',
                                marginLeft: '4px',
                                cursor: 'pointer',
                                color: 'rgba(0,0,0,0.65)',
                            }}
                        />
                    </Tooltip>
                </div>
                <div className={styles.rescTableWrapper}>
                    {!!(auditAllRescList?.length || searchDebounce.keyword) && (
                        <div className={styles.tableOprWrapper}>
                            <Space size={8}>
                                <Tooltip
                                    title={
                                        (auditAllRescList?.length || 0) >
                                        policyRescMaxNum
                                            ? __(
                                                  '单条策略最多可添加1000个审核资源',
                                              )
                                            : ''
                                    }
                                    overlayInnerStyle={{
                                        background: 'rgba(0,0,0,0.85)',
                                    }}
                                >
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={() => {
                                            setSelRescModalOpen(true)
                                        }}
                                        disabled={
                                            (auditAllRescList?.length || 0) >
                                            policyRescMaxNum
                                        }
                                    >
                                        {__('添加资源')}
                                    </Button>
                                </Tooltip>
                                <Tooltip
                                    title={
                                        !selectedRowKeys?.length
                                            ? __('请先选择资源')
                                            : ''
                                    }
                                    overlayInnerStyle={{
                                        background: 'rgba(0,0,0,0.85)',
                                    }}
                                >
                                    <Button
                                        onClick={() => handleDeleteSelected()}
                                        disabled={!selectedRowKeys?.length}
                                    >
                                        {__('移除')}
                                    </Button>
                                </Tooltip>
                            </Space>
                            <div className={styles.filterBox}>
                                <SearchInput
                                    placeholder={__('搜索资源名称、编码')}
                                    value={searchCondition.keyword}
                                    onKeyChange={(key) =>
                                        setSearchCondition({
                                            ...searchCondition,
                                            keyword: trim(key),
                                            offset: 1,
                                        })
                                    }
                                    className={styles.searchInputWrapper}
                                    style={{ width: 280, maxWidth: 280 }}
                                />
                                <LightweightSearch
                                    formData={filterItems}
                                    onChange={(data, key) =>
                                        searchChange(data, key)
                                    }
                                    defaultValue={{
                                        rescType: PolicyDataRescType.NOLIMIT,
                                    }}
                                    filterTopNode={
                                        searchCondition.rescType ===
                                        PolicyDataRescType.NOLIMIT
                                            ? __('全部类型')
                                            : ''
                                    }
                                />
                            </div>
                        </div>
                    )}

                    {tableLoading ? (
                        <div style={{ paddingTop: '56px' }}>
                            <Loader />
                        </div>
                    ) : auditAllRescList?.length ? (
                        <Table
                            columns={columns}
                            rowSelection={{ type: 'checkbox', ...rowSelection }}
                            dataSource={auditRescList}
                            scroll={{
                                y: 300,
                            }}
                            rowKey="id"
                            locale={{
                                emptyText:
                                    searchCondition.keyword ||
                                    searchCondition.rescType ? (
                                        <Empty />
                                    ) : (
                                        <Empty
                                            desc={__('暂无数据')}
                                            iconSrc={dataEmpty}
                                        />
                                    ),
                            }}
                            pagination={{
                                size: 'small',
                                hideOnSinglePage: auditAllRescList?.length < 10,
                                showSizeChanger: false,
                                showQuickJumper: false,
                                current: searchDebounce.offset,
                                pageSize: searchDebounce.limit,
                                total,
                                onChange: onPaginationChange,
                            }}
                        />
                    ) : (
                        <div className={styles.emptyWrapper}>
                            <Empty
                                iconSrc={dataEmpty}
                                desc={__('无可审核的数据资源')}
                            />
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    setSelRescModalOpen(true)
                                }}
                                disabled={
                                    (auditAllRescList?.length || 0) >
                                    policyRescMaxNum
                                }
                                style={{ marginTop: '8px' }}
                            >
                                {__('添加资源')}
                            </Button>
                        </div>
                    )}
                </div>

                {/* 选择审核资源 */}
                {selRescModalOpen && (
                    <SelDataRescModal
                        open={selRescModalOpen}
                        originCheckedList={auditAllRescList || []}
                        removeIds={tempRemoveIds}
                        onClose={() => setSelRescModalOpen(false)}
                        onSure={(items) => {
                            setSelRescModalOpen(false)
                            // const newItems =
                            //     items?.map?.((item) => ({
                            //         ...item,
                            //         type: policyRescTypeToDataRescType[
                            //             item.type
                            //         ],
                            //     })) || []
                            // setAuditRescList((prev) => {
                            //     return _.uniqBy([...prev, ...newItems], 'id')
                            // })
                            setAuditAllRescList(items)
                        }}
                    />
                )}

                {viewDetailOpen && (
                    <LogicViewDetail
                        open={viewDetailOpen}
                        onClose={() => {
                            setViewDetailOpen(false)
                        }}
                        hasPermission={curOprResc?.has_permission}
                        id={curOprResc?.id}
                        getContainer={getPopupContainer()}
                        fullHeight
                        style={{
                            position: 'fixed',
                            width: '100vw',
                            height: '100vh',
                            top: 0,
                        }}
                    />
                )}
                {indicatorDetailOpen && (
                    <IndicatorViewDetail
                        open={indicatorDetailOpen}
                        id={curOprResc?.id}
                        onClose={() => {
                            setIndicatorDetailOpen(false)
                        }}
                        indicatorType={curOprResc?.indicator_type || ''}
                        getContainer={getPopupContainer()}
                        style={{
                            position: 'fixed',
                            width: '100vw',
                            height: '100vh',
                            top: 0,
                        }}
                    />
                )}
                {interfaceDetailOpen && (
                    <div hidden={!interfaceDetailOpen}>
                        <ApplicationServiceDetail
                            open={interfaceDetailOpen}
                            onClose={() => {
                                setInterfaceDetailOpen(false)
                            }}
                            hasPermission={curOprResc?.has_permission}
                            serviceCode={curOprResc?.id}
                            getContainer={getPopupContainer()}
                            style={{
                                position: 'fixed',
                                width: '100vw',
                                height: '100vh',
                                top: 0,
                            }}
                        />
                    </div>
                )}
            </div>
        )
    },
)

export default RescEditTable
