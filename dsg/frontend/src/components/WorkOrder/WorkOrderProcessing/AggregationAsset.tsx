import { Button, message, Space, Table, Tooltip } from 'antd'
import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'
import moment from 'moment'
import { FixedType } from '@/components/CommonTable/const'
import CollectionTable from '@/components/DataPlanManage/ListCollection/CollectionTable'
import __ from './locale'
import styles from './styles.module.less'
import ViewChoose from '@/components/DataPlanManage/ListCollection/ViewChoose'
import { getDepartName } from './helper'
import { formatError, updateWorkOrder, updateWorkOrderStatus } from '@/core'
import { StatusType } from '../helper'
import { useProcessContext } from './ProcessProvider'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { Empty } from '@/ui'
import EmptyAdd from '@/assets/emptyAdd.svg'
import { DataViewProvider } from '@/components/DatasheetView/DataViewProvider'
import SelectFormModal from '../WorkOrderType/AggregationOrder/SelectBusinessForm/SelectFormModal'
import { OperateType } from '@/utils'
import BatchConfig from '@/components/DataPlanManage/ListCollection/BatchConfig'

const ModalEmpty = ({ onAdd }: any) => {
    return (
        <div>
            <Empty
                iconSrc={EmptyAdd}
                desc={
                    <div>
                        点击<a onClick={onAdd}>【+添加】</a>
                        按钮,可添加业务表
                    </div>
                }
            />
        </div>
    )
}
const AggregationAsset = forwardRef(({ readOnly, data, onClose }: any, ref) => {
    const { setProcessInfo } = useProcessContext()
    const [dataSource, setDataSource] = useState<any[]>()
    const [current, setCurrent] = useState<any>()
    const [optOpen, setOptOpen] = useState<boolean>(false)
    const [bizOpen, setBizOpen] = useState<boolean>(false)
    const [expandedRowKeys, setExpandedRowKeys] = useState<any>([])
    const [keysMap, setKeysMap] = useState<any>({})
    const mapRef = useRef<any>({})
    useEffect(() => {
        const hasResources = dataSource?.some((o) => o?.children?.length > 0)
        setProcessInfo((prev) => ({
            ...prev,
            canSubmit: hasResources,
        }))
    }, [dataSource])
    // 子集勾选Keys
    const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([])
    const [batchConfigOpen, setBatchConfigOpen] = useState<boolean>(false)
    const [collectionTableRefs, setCollectionTableRefs] = useState<
        Record<string, any>
    >({})
    const setInfos = () => {
        const { business_forms, resources } =
            data?.data_aggregation_inventory || {}

        const curData = (business_forms || []).map((o) => {
            const bizRes = (resources || [])
                .filter((it) => o?.id === it?.business_form_id)
                ?.map((it) => ({
                    ...it,
                    // collected_at: it?.collected_at
                    //     ? moment(it?.collected_at)
                    //     : undefined,
                    id: it?.data_view_id,
                }))

            return {
                ...o,
                children: bizRes,
                children_count: bizRes?.length || 0,
            }
        })
        setDataSource(curData)
    }

    useEffect(() => {
        setInfos()
    }, [data])

    const handleFinish = async () => {
        if (!readOnly) {
            const business_forms = dataSource?.map((o: any) => {
                const {
                    children,
                    children_count,
                    updated_at,
                    update_at,
                    ...rest
                } = o
                const it = {
                    ...rest,
                    updated_at: rest?.updated_at
                        ? moment(updated_at).format('YYYY-MM-DDTHH:mm:ssZ')
                        : undefined,
                    update_at: update_at
                        ? moment(update_at).format('YYYY-MM-DDTHH:mm:ssZ')
                        : undefined,
                }
                return it
            })

            const resources = dataSource?.reduce((prev, cur) => {
                const business_form_id = cur?.id
                const curItems = cur?.children?.map((it) => ({
                    business_form_id,
                    data_view_id: it?.id,
                    // collected_at: it?.collected_at
                    //     ? moment(it?.collected_at).format(
                    //           'YYYY-MM-DDTHH:mm:ssZ',
                    //       )
                    //     : undefined,
                    collection_method: it?.collection_method,
                    sync_frequency: it?.sync_frequency,
                    target_datasource_id: it?.target_datasource_id,
                    datasource_type: it?.datasource_type,
                    datasource_id: it?.datasource_id,
                }))
                return [...prev, ...(curItems || [])]
            }, [])

            if (
                resources.some((it) => Object.keys(it).some((key) => !it[key]))
            ) {
                message.warn('归集资源配置项缺失')
                return
            }

            const params = {
                data_aggregation_inventory: {
                    business_forms,
                    resources,
                },
                status: StatusType.ONGOING,
            }
            try {
                await updateWorkOrderStatus(data?.work_order_id, params)
                message.success('提交成功')
                onClose?.(true)
            } catch (error) {
                formatError(error)
            }
        }
    }

    const validate = () => {
        // 检查是否有业务表资源
        const hasResources = dataSource?.some((o) => o?.children?.length > 0)
        if (!hasResources) {
            return { valid: false, message: __('请添加业务表归集资源') }
        }

        // 检查资源配置是否完整
        const resources = dataSource?.reduce((prev, cur) => {
            const business_form_id = cur?.id
            const curItems = cur?.children?.map((it) => ({
                business_form_id,
                data_view_id: it?.id,
                // collected_at: it?.collected_at,
                collection_method: it?.collection_method,
                sync_frequency: it?.sync_frequency,
                target_datasource_id: it?.target_datasource_id,
                datasource_type: it?.datasource_type,
                datasource_id: it?.datasource_id,
            }))
            return [...prev, ...(curItems || [])]
        }, [])

        const invalidResource = resources.some((it) =>
            Object.keys(it).some((key) => !it[key]),
        )

        if (invalidResource) {
            return { valid: false, message: __('归集资源配置项缺失') }
        }

        return { valid: true }
    }

    const getFormData = () => {
        const business_forms = dataSource?.map((o: any) => {
            const { children, children_count, updated_at, update_at, ...rest } =
                o
            const it = {
                ...rest,
                updated_at: rest?.updated_at
                    ? moment(updated_at).format('YYYY-MM-DDTHH:mm:ssZ')
                    : undefined,
                update_at: update_at
                    ? moment(update_at).format('YYYY-MM-DDTHH:mm:ssZ')
                    : undefined,
            }
            return it
        })

        const resources = dataSource?.reduce((prev, cur) => {
            const business_form_id = cur?.id
            const curItems = cur?.children?.map((it) => ({
                business_form_id,
                data_view_id: it?.id,
                collection_method: it?.collection_method,
                sync_frequency: it?.sync_frequency,
                target_datasource_id: it?.target_datasource_id,
                datasource_type: it?.datasource_type,
                datasource_id: it?.datasource_id,
            }))
            return [...prev, ...(curItems || [])]
        }, [])

        return {
            data_aggregation_inventory: {
                business_forms,
                resources,
            },
        }
    }

    useImperativeHandle(ref, () => ({
        handleFinish,
        validate,
        getFormData,
    }))

    const handleAddChild = (parentId: string, newChilds: any[]) => {
        const transChilds = newChilds?.map((o) => ({
            ...o,
            datasource_name: o?.datasource,
            datasource_type: o?.datasource_type,
            datasource_id: o?.datasource_id,
            collection_method: 'Full',
            sync_frequency: 'PerDay',
        }))
        setDataSource((prev) =>
            (prev || []).map((o) => {
                if (o.id === parentId) {
                    const bizRes = [
                        ...(o?.children || []),
                        ...(transChilds || []),
                    ]
                    return {
                        ...o,
                        children: bizRes,
                        children_count: bizRes?.length || 0,
                    }
                }
                return o
            }),
        )
        setExpandedRowKeys([...expandedRowKeys, parentId])
    }

    const columns = [
        {
            title: (
                <div>
                    <span>业务表名称</span>
                    <span
                        style={{
                            color: 'rgba(0,0,0,0.45)',
                            fontWeight: 'normal',
                        }}
                    >
                        （描述）
                    </span>
                </div>
            ),
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            width: 160,
            fixed: FixedType.LEFT,
            render: (text, record) => (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        columnGap: 8,
                    }}
                >
                    <div>
                        <FontIcon
                            name="icon-yewubiao1"
                            type={IconType.COLOREDICON}
                            style={{ fontSize: 24 }}
                        />
                    </div>
                    <div
                        className={styles.titleBox}
                        style={{ width: 'calc(100% - 22px)' }}
                    >
                        <div className={styles.sourceTitle}>
                            <div title={text}>{text || '--'}</div>
                        </div>
                        <div
                            className={styles.sourceContent}
                            title={record?.description}
                        >
                            {record?.description || '--'}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: '关联资源数',
            dataIndex: 'children_count',
            key: 'children_count',
            width: 120,
            render: (text) => (
                <div className={styles.ellipsisTitle}>{text || 0}</div>
            ),
        },
        {
            title: '所属业务模型',
            dataIndex: 'business_model_name',
            key: 'business_model_name',
            width: 150,
            render: (text) => (
                <div className={styles.ellipsisTitle} title={text}>
                    {text || '--'}
                </div>
            ),
        },
        {
            title: '所属部门',
            dataIndex: 'department_name',
            key: 'department_name',
            width: 140,
            render: (text) => (
                <div className={styles.ellipsisTitle} title={text}>
                    {text || '--'}
                </div>
            ),
        },
        {
            title: '关联信息系统',
            dataIndex: 'related_info_systems',
            key: 'related_info_systems',
            width: 150,
            render: (arr) => {
                const text = arr?.map((o) => o?.name)?.join('、')
                return (
                    <div className={styles.ellipsisTitle} title={text}>
                        {text || '--'}
                    </div>
                )
            },
        },
        {
            title: '更新人',
            dataIndex: 'updater_name',
            key: 'updater_name',
            width: 100,
            render: (text) => (
                <div className={styles.ellipsisTitle} title={text}>
                    {text || '--'}
                </div>
            ),
        },
        {
            title: '更新时间',
            dataIndex: 'updated_at',
            key: 'updated_at',
            width: 180,
            render: (text) => (
                <div className={styles.ellipsisTitle} title={text}>
                    {text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '--'}
                </div>
            ),
        },
        {
            title: '操作',
            key: 'action',
            width: 170,
            fixed: FixedType.RIGHT,
            render: (text, record) => (
                <Space>
                    <Button
                        type="link"
                        onClick={() => {
                            handleOperate(OperateType.ADD, record)
                        }}
                    >
                        添加库表
                    </Button>
                    <Button
                        type="link"
                        onClick={() =>
                            handleOperate(OperateType.DELETE, record)
                        }
                    >
                        移除
                    </Button>
                </Space>
            ),
        },
    ]

    const handleDelete = async (id: string) => {
        setDataSource((prev) => prev?.filter((o) => o?.id !== id))
    }

    const handleOperate = async (op: OperateType, item: any) => {
        switch (op) {
            case OperateType.ADD:
                setCurrent(item)
                setOptOpen(true)
                break
            case OperateType.DELETE:
                // 删除
                handleDelete(item?.id)
                break
            default:
                break
        }
    }

    const handleResourcesChange = (parentId, vals) => {
        setDataSource((prev) =>
            (prev || []).map((o) => {
                if (o.id === parentId) {
                    return {
                        ...o,
                        children: vals,
                        children_count: vals?.length || 0,
                    }
                }
                return o
            }),
        )
    }

    useEffect(() => {
        setSelectedRowKeys(Object.values(keysMap).flat())
    }, [keysMap])

    const checkedRowItems = useMemo(() => {
        if (!dataSource || !keysMap) return []
        let result: any[] = []
        dataSource.forEach((item) => {
            const childKeys = keysMap[item.id] || []
            if (Array.isArray(item.children) && childKeys.length > 0) {
                const selectedChildren = item.children.filter((child) =>
                    childKeys.includes(child.id),
                )
                result = result.concat(selectedChildren)
            }
        })
        return result
    }, [dataSource, keysMap])

    const handleRowCheck = (parentId, keys) => {
        setKeysMap((prev) => ({
            ...prev,
            [parentId]: keys || [],
        }))
    }

    const expandedRowRender = (record) => {
        if (!collectionTableRefs[record?.id]) {
            const curRef = React.createRef()
            setCollectionTableRefs((prev) => ({
                ...prev,
                [record?.id]: curRef,
            }))
        }
        return (
            <DataViewProvider>
                <CollectionTable
                    ref={collectionTableRefs[record?.id]}
                    value={record.children}
                    onChange={(vals) => handleResourcesChange(record?.id, vals)}
                    readOnly={readOnly}
                    isChild
                    isAsset
                    onCheckChange={(keys) => {
                        handleRowCheck(record?.id, keys)
                    }}
                />
            </DataViewProvider>
        )
    }

    const handleUpdateCheckedRowItems = (config) => {
        setDataSource((prev) => {
            return (prev || []).map((item) => {
                if (!item?.children?.length) {
                    return item
                }
                return {
                    ...item,
                    children: item.children?.map((o) => {
                        if (keysMap[item.id]?.includes(o.id)) {
                            return {
                                ...o,
                                ...config,
                            }
                        }
                        return o
                    }),
                }
            })
        })
        message.success(__('批量配置成功'))
        // 清空选中项
        setSelectedRowKeys([])
        setKeysMap({})
        Object.values(collectionTableRefs).forEach((curRef) => {
            if (curRef?.current?.clearSelection) {
                curRef?.current?.clearSelection()
            }
        })
    }

    const currentColumns = useMemo(() => {
        return readOnly ? columns?.filter((o) => o.key !== 'action') : columns
    }, [readOnly])

    // 同一视图在一个工单下只能添加一次
    const bindItemsArr = useMemo(() => {
        return dataSource?.reduce((prev, cur) => {
            const { children, ...rest } = cur
            return [...prev, ...(children || [])]
        }, [])
    }, [dataSource])

    return (
        <div className={styles.table}>
            {!dataSource?.length && !readOnly ? (
                <ModalEmpty onAdd={() => setBizOpen(true)} />
            ) : (
                <>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '16px',
                        }}
                    >
                        <span style={{ color: 'rgba(0,0,0,0.85)' }}>
                            <span
                                style={{ color: '#ff4d4f', marginRight: '4px' }}
                            >
                                *
                            </span>
                            {__('归集资源')}:
                        </span>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                columnGap: '16px',
                            }}
                        >
                            <Tooltip
                                title={
                                    selectedRowKeys?.length === 0
                                        ? __('请勾选逻辑视图')
                                        : undefined
                                }
                            >
                                <Button
                                    type="link"
                                    icon={
                                        <FontIcon
                                            name="icon-shezhi"
                                            style={{ marginRight: 6 }}
                                        />
                                    }
                                    className={styles.batchConfigButton}
                                    hidden={readOnly}
                                    disabled={selectedRowKeys?.length === 0}
                                    onClick={() => {
                                        setBatchConfigOpen(true)
                                    }}
                                >
                                    {__('批量配置')}
                                </Button>
                            </Tooltip>
                            <a
                                onClick={() => setBizOpen(true)}
                                hidden={dataSource?.length === 0 || readOnly}
                            >
                                + 添加业务表
                            </a>
                        </div>
                    </div>

                    <Table
                        columns={currentColumns}
                        dataSource={dataSource}
                        expandable={{
                            expandedRowRender,
                            rowExpandable: (record) =>
                                record?.children?.length > 0,
                            childrenColumnName: '__children__',
                            expandedRowKeys,
                            onExpand: (expanded, record: any) => {
                                if (expanded) {
                                    setExpandedRowKeys([
                                        ...expandedRowKeys,
                                        record.id,
                                    ])
                                } else {
                                    setExpandedRowKeys(
                                        expandedRowKeys.filter(
                                            (key) => key !== record.id,
                                        ),
                                    )
                                }
                            },
                        }}
                        rowKey={(record) => record?.id}
                        scroll={{ x: 900, y: 500 }}
                        pagination={
                            !readOnly
                                ? false
                                : {
                                      pageSize: 5,
                                      showSizeChanger: false,
                                      hideOnSinglePage: true,
                                  }
                        }
                    />
                </>
            )}

            {bizOpen && (
                <SelectFormModal
                    open={bizOpen}
                    bindItems={dataSource}
                    onClose={() => {
                        setBizOpen(false)
                    }}
                    onSure={(items) => {
                        const transData = items?.map((o) => ({
                            ...o,
                            info_system_name: o?.related_info_systems?.map(
                                (i) => i?.name,
                            ),
                            updater_name: o?.update_by_name,
                            updated_at: o?.update_at,
                        }))
                        // 设置选中view
                        setDataSource((prev) => [...(prev ?? []), ...transData])
                        setBizOpen(false)
                    }}
                />
            )}

            {batchConfigOpen && (
                <BatchConfig
                    open={batchConfigOpen}
                    data={checkedRowItems}
                    onClose={() => {
                        setBatchConfigOpen(false)
                    }}
                    onSure={(config) => {
                        if (config) {
                            handleUpdateCheckedRowItems(config)
                        }
                        setBatchConfigOpen(false)
                    }}
                />
            )}

            {optOpen && (
                <ViewChoose
                    open={optOpen}
                    bindItems={bindItemsArr}
                    onClose={() => {
                        setOptOpen(false)
                        setCurrent(undefined)
                    }}
                    onSure={(items) => {
                        handleAddChild(current?.id, items)
                        setOptOpen(false)
                        setCurrent(undefined)
                    }}
                />
            )}
        </div>
    )
})

export default AggregationAsset
