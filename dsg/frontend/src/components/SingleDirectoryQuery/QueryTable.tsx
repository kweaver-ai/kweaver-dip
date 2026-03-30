import { Table, TableProps, Tooltip } from 'antd'
import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'
import classnames from 'classnames'
import { isNil } from 'lodash'
import { ColumnType } from 'antd/lib/table'
import { useSetState } from 'ahooks'
import { SorterResult } from 'antd/es/table/interface'
import styles from './styles.module.less'
import { Empty, Loader } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import dataPermisEmpty from '@/assets/dataPermisEmpty.svg'
import __ from './locale'
import { getFieldTypeEelment } from '../DatasheetView/helper'
import {
    formatError,
    SortDirection,
    getSingleCatalogResult,
    HasAccess,
} from '@/core'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface Props extends TableProps<any> {
    fields: any[]
    config: any
    hasPerm: boolean
}

const renderItem = (text: any) => {
    const isInvalidValue = text === '' || isNil(text)

    const name = isInvalidValue
        ? '--'
        : text === false || text === true || text === 0
        ? `${text}`
        : text
    return (
        <div
            className={classnames(styles.tableTDContnet)}
            style={{
                padding: '4px 12px',
            }}
        >
            <Tooltip title={isInvalidValue && __('暂无数据')}>
                <span
                    title={!isInvalidValue ? `${name}` : ''}
                    className={classnames(
                        styles.businessTitle,
                        isInvalidValue && styles.emptyTitle,
                    )}
                >
                    {name}
                </span>
            </Tooltip>
        </div>
    )
}

const defaultLimit = 20

const QueryTable = (props: Props, ref) => {
    const { fields, config, hasPerm } = props
    const [pagination, setPagination] = useSetState<{
        total: number
        current: number
        pageSize: number
        sorter: {
            sort_field_id: string
            direction: SortDirection | undefined
        }
    }>({
        total: 1,
        current: 1,
        pageSize: defaultLimit,
        sorter: {
            sort_field_id: '',
            direction: undefined,
        },
    })
    const { total, current, pageSize, sorter } = pagination
    const [dataSource, setDataSource] = useState<any[]>([])
    const [originData, setOriginData] = useState<any>({})
    const queryRef = useRef<any>(null)
    const [showField, setShowField] = useState<any[]>([])
    const curOffset = useRef<number>(1)
    const [loading, setLoading] = useState(false)

    // 字段变更更新显示字段
    useEffect(() => {
        const { fields: cFields, filters: cFilters } = config || {}

        // filter显示与排序
        // const checkedFields = fields.filter((item) => cFields.includes(item.id))
        // const curFields = checkedFields?.length > 0 ? checkedFields : fields
        const currentFields = (cFields || [])
            .map((o) => {
                const it = fields?.find((k) => k?.id === o)
                return it
            })
            ?.filter(
                (o) =>
                    o !== undefined &&
                    o.status !== 'delete' &&
                    o.status !== 'not_support',
            )
        // const checkedIds = currentFields.map((o) => o?.id)
        // filter转换
        // const curFilter = (cFilters || [])
        //     .map((o) => {
        //         const val = Array.isArray(o?.value)
        //             ? o?.value?.join(',')
        //             : o?.value
        //         return {
        //             ...o,
        //             value: val,
        //         }
        //     })
        //     .filter((o) => {
        //         const it = fields?.find((k) => k?.id === o?.id)
        //         const isTypeChange =
        //             o?.data_type &&
        //             o?.data_type !== changeFormatToType(it?.data_type)
        //         return !isTypeChange && checkedIds?.includes(o?.id)
        //     }) // 过滤掉类型变更的字段和未勾选字段

        // setFilters(curFilter)
        setShowField(currentFields)
    }, [fields, config])

    const { checkPermissions } = useUserPermCtx()

    // 是否拥有数据运营工程师
    const hasDataOperRole = useMemo(() => {
        return checkPermissions(HasAccess.isGovernOrOperation) ?? false
    }, [checkPermissions])

    useEffect(() => {
        const list: any[] = []
        const { columns, data = [] } = originData
        const fieldNames = (columns || []).map((item) => item.name)
        data.forEach((item) => {
            const obj: any = {}
            fieldNames.forEach((it, idx) => {
                // 二进制大对象不显示
                obj[it] = it === 'long_blob_data' ? '[Record]' : item[idx]
            })
            list.push(obj)
        })
        setDataSource(curOffset.current === 1 ? list : [...dataSource, ...list])
    }, [originData])

    const columns: ColumnType<any>[] = useMemo(() => {
        return (
            showField?.map((cItem) => {
                return {
                    title: (
                        <div
                            style={{
                                padding: '6px 12px',
                            }}
                        >
                            <div className={styles.tableTDContnet}>
                                <span className={styles.nameIcon}>
                                    {getFieldTypeEelment(
                                        { ...cItem, type: cItem?.data_type },
                                        20,
                                        'top',
                                        hasDataOperRole,
                                    )}
                                </span>
                                <span
                                    title={`${cItem.business_name}`}
                                    className={styles.businessTitle}
                                >
                                    {cItem.business_name}
                                </span>
                            </div>
                            <div
                                className={classnames(
                                    styles.tableTDContnet,
                                    styles.subTableTDContnet,
                                )}
                                title={`${cItem.technical_name}`}
                            >
                                {cItem.technical_name}
                            </div>
                        </div>
                    ),
                    dataIndex: cItem.technical_name,
                    key: cItem.technical_name,
                    sorter: true,
                    showSorterTooltip: false,
                    sortOrder:
                        sorter.sort_field_id === cItem.id
                            ? sorter.direction === SortDirection.ASC
                                ? 'ascend'
                                : 'descend'
                            : null,
                    ellipsis: true,
                    render: renderItem,
                }
            }) || []
        )
    }, [showField, sorter])

    const getInnerData = async (params: any) => {
        setLoading(true)
        try {
            const data = await getSingleCatalogResult(params)
            setOriginData(data)
            setPagination({ total: data.total_count })
        } catch (err) {
            formatError(err)
        } finally {
            setLoading(false)
        }
    }

    const getChangeData = () => {
        if (queryRef.current) {
            const { sort_field_id, direction } = sorter
            getInnerData({
                offset: current,
                limit: pageSize,
                sort_field_id,
                direction,
                search_type: 'auto',
                ...queryRef.current,
            })
        }
    }

    useEffect(getChangeData, [current, pageSize, sorter])

    useImperativeHandle(ref, () => ({
        getData(params: any) {
            queryRef.current = params
            setPagination({
                current: 1,
                pageSize: defaultLimit,
                sorter: { sort_field_id: '', direction: undefined },
            })
        },
    }))

    useEffect(() => {
        // 切换回单目录页面，清空表格
        setPagination({ total: 0 })
        setDataSource([])
    }, [columns])

    if (!hasPerm) {
        return (
            <div className={styles.emptyWrapper}>
                <Empty
                    desc={__('权限不足，无法查看全量数据')}
                    iconSrc={dataPermisEmpty}
                />
            </div>
        )
    }

    if (columns.length === 0 && dataSource.length === 0 && !loading) {
        return (
            <div className={styles.emptyWrapper}>
                <Empty
                    desc={
                        <div>
                            <div>{__('选择左侧一个数据目录')}</div>
                            <div>
                                {__('配置查询条件后点击【查询】可查看查询结果')}
                            </div>
                        </div>
                    }
                    iconSrc={dataEmpty}
                />
            </div>
        )
    }

    return loading ? (
        <Loader />
    ) : (
        <Table
            columns={columns}
            rowKey="id"
            className={styles.sampleTable}
            dataSource={dataSource}
            loading={loading}
            onChange={(currentPagination, filters, _sorter) => {
                const { field: sort_field, order: sort_direction } =
                    (_sorter as SorterResult<any>) || {}

                if (sort_direction) {
                    const curDirection =
                        sort_direction === 'ascend'
                            ? SortDirection.ASC
                            : SortDirection.DESC
                    const sortFieldId = fields?.find(
                        (o) => o?.technical_name === sort_field,
                    )?.id
                    setPagination({
                        sorter: {
                            sort_field_id: sortFieldId,
                            direction: sortFieldId ? curDirection : undefined,
                        },
                    })
                }
                setPagination({
                    current: currentPagination.current ?? 1,
                    pageSize: currentPagination.pageSize ?? defaultLimit,
                })
            }}
            scroll={{
                x: columns.length * 200,
                y:
                    dataSource?.length === 0
                        ? undefined
                        : total > defaultLimit
                        ? 'calc(100vh - 270px)'
                        : 'calc(100vh - 270px)',
            }}
            pagination={{
                ...pagination,
                hideOnSinglePage: total <= defaultLimit,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal(all, range) {
                    return `共 ${all} 条`
                },
            }}
            bordered={false}
            locale={{
                emptyText: loading ? (
                    <div style={{ height: 300 }} />
                ) : (
                    <Empty />
                ),
            }}
            // rowClassName={(record) =>
            //     record.id === selectedRow
            //         ? 'any-fabric-ant-table-row-selected'
            //         : ''
            // }
        />
    )
}

export default forwardRef(QueryTable)
