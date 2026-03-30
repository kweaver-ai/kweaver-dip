import * as React from 'react'
import { useAntdTable, useDebounce, useDebounceFn } from 'ahooks'
import { Button, Space, Table, message } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { SortOrder } from 'antd/lib/table/interface'
import { debounce, isNumber, noop } from 'lodash'
import { memo, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { formatTime, OperateType } from '@/utils'
import Empty from '@/ui/Empty'
import { LightweightSearch, Loader, SearchInput } from '@/ui'
import { IRescCatlg } from '@/core/apis/dataCatalog/index.d'
import {
    formatError,
    getCatalogComprehensionList,
    getWorkOrder,
    deleteDataComprehension,
    SortDirection,
} from '@/core'
import { RefreshBtn } from '@/components/ToolbarComponents'
import { labelText } from '../ResourcesDir/const'
import { TabKey } from './const'
import { initSearchCondition } from './helper'
import __ from './locale'
import styles from './styles.module.less'
import { SearchType } from '@/ui/LightweightSearch/const'
import dataEmpty from '@/assets/dataEmpty.svg'
import Confirm from '../Confirm'
import OrgAndDepartmentFilterTree from '../MyAssets/OrgAndDepartmentFilterTree'
import { Architecture } from '../BusinessArchitecture/const'

const OriginSelectComponent: React.FC<{
    value?: any
    onChange?: (value: any) => void
}> = ({ onChange = noop, value }) => {
    return (
        <OrgAndDepartmentFilterTree
            getSelectedNode={(sn) => {
                onChange(sn.id)
            }}
            filterType={[
                Architecture.ORGANIZATION,
                Architecture.DEPARTMENT,
            ].join()}
        />
    )
}

const DataUndsFinishContent = ({
    isAll = false,
    onCountChange,
}: {
    isAll?: boolean
    onCountChange: (num: number) => void
}) => {
    const navigator = useNavigate()
    const [searchParams] = useSearchParams()
    const backUrl = searchParams.get('backUrl')

    // 加载
    const [loading, setLoading] = useState(false)
    const [delVisible, setDelVisible] = useState(false)
    const [delBtnLoading, setDelBtnLoading] = useState(false)

    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        updateTime: 'descend',
    })
    // 操作的目录
    const [curCatlg, setCurCatlg] = useState<IRescCatlg>()

    const [searchCondition, setSearchCondition] =
        useState<any>(initSearchCondition)
    const debounceCondition = useDebounce(searchCondition, {
        wait: 300,
    })

    const [tableHeight, setTableHeight] = useState<number>(0)

    const hasSearchCondition = useMemo(() => {
        return !!debounceCondition.keyword
    }, [debounceCondition])

    useEffect(() => {
        // 展开/收起查询条件高度
        const defalutHeight: number = 276
        // 已选搜索条件高度
        const searchConditionHeight: number = hasSearchCondition ? 41 : 0
        const height = defalutHeight + searchConditionHeight

        setTableHeight(height)
    }, [hasSearchCondition])

    // 获取目录列表
    const getReportList = async (params) => {
        try {
            setLoading(true)
            const obj = {
                ...params,
                current_department: isAll ? undefined : true,
            }
            const res = await getCatalogComprehensionList(obj)
            onCountChange(res.total_count)
            return { total: res.total_count, list: res.entries }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        } finally {
            setLoading(false)
        }
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        if (sorter.column) {
            if (sorter.columnKey === 'updated_at') {
                setTableSort({
                    updateTime: sorter.order || 'ascend',
                })
            } else {
                setTableSort({
                    updateTime: null,
                })
            }
            return {
                key: sorter.columnKey,
                sort:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }
        if (searchCondition.sort === 'updated_at') {
            if (searchCondition.direction === SortDirection.ASC) {
                setTableSort({
                    updateTime: 'descend',
                })
            } else {
                setTableSort({
                    updateTime: 'ascend',
                })
            }
        } else if (searchCondition.sort === SortDirection.ASC) {
            setTableSort({
                updateTime: null,
            })
        } else {
            setTableSort({
                updateTime: null,
            })
        }
        return {
            key: searchCondition.sort,
            sort:
                searchCondition.direction === SortDirection.ASC
                    ? SortDirection.DESC
                    : SortDirection.ASC,
        }
    }

    const { tableProps, run, pagination } = useAntdTable(getReportList, {
        defaultPageSize: 10,
        manual: true,
    })

    const { run: debouncedRun } = useDebounceFn((params) => run(params), {
        wait: 300,
    })

    useEffect(() => {
        debouncedRun({
            ...debounceCondition,
            current: debounceCondition.offset,
        })
    }, [debounceCondition, isAll])

    // 进入画布url拼接
    const getUrlQuery = (url: string) => {
        // 任务信息
        // if (taskInfo?.taskId) {
        //     return `${url}&backUrl=${backUrl}&projectId=${taskInfo.projectId}&taskId=${taskInfo.taskId}&taskExecutableStatus=${taskInfo?.taskExecutableStatus}&arch=`
        // }
        return `${url}&arch=`
    }

    // 操作处理
    const handleOperate = async (op: OperateType | string, item: any) => {
        setCurCatlg(item)
        switch (op) {
            case OperateType.PREVIEW:
                // remarkRed(item)
                navigator(
                    getUrlQuery(
                        `/dataComprehensionContent?cid=${item?.catalog_id}&taskId=${item?.task_id}&templateId=${item?.template_id}&tab=${TabKey.CANVAS}`,
                    ),
                )
                break
            case 'report':
                navigator(
                    getUrlQuery(
                        `/dataComprehensionContent?cid=${item?.catalog_id}&taskId=${item?.task_id}&templateId=${item?.template_id}&tab=${TabKey.REPORT}`,
                    ),
                )
                break
            case 'del':
                setDelVisible(true)
                break
            default:
                break
        }
    }

    // 列表项
    const columns = useMemo((): ColumnsType<any> => {
        const AllColumns: ColumnsType<any> = [
            {
                title: __('关联数据资源目录名称'),
                dataIndex: 'catalog_name',
                key: 'catalog_name',
                render: (value, record) => (
                    <div>
                        <div
                            className={styles.catlgName}
                            title={labelText(value)}
                            onClick={() =>
                                handleOperate(OperateType.PREVIEW, record)
                            }
                        >
                            {labelText(value)}
                        </div>
                    </div>
                ),
                ellipsis: true,
            },
            {
                title: __('所属部门'),
                dataIndex: 'department',
                key: 'department',
                ellipsis: true,
                render: (_, record) => (
                    <div title={record?.department_path}>
                        {record?.department || '--'}
                    </div>
                ),
            },
            {
                title: __('理解创建人'),
                dataIndex: 'updated_user',
                key: 'updated_user',
                render: (_, record) => <div>{record.updated_user || '--'}</div>,
            },
            {
                title: __('更新时间'),
                dataIndex: 'updated_at',
                key: 'updated_at',
                ellipsis: true,
                render: (_, record) => {
                    return isNumber(record.updated_at)
                        ? formatTime(record.updated_at)
                        : '--'
                },
            },
            {
                title: __('操作'),
                key: 'action',
                width: isAll ? 100 : 160,
                fixed: 'right',
                render: (_, record) => {
                    const btnList: any[] = [
                        {
                            key: 'report',
                            label: __('查看报告'),
                            show: true,
                        },
                        {
                            key: 'del',
                            label: __('删除'),
                            show: !isAll,
                        },
                    ]
                    return (
                        <Space size={16} className={styles.oprColumn}>
                            {btnList
                                .filter((o) => o.show)
                                .map((item) => {
                                    return (
                                        <Button
                                            type="link"
                                            key={item.key}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (item.disabled) return
                                                handleOperate(item.key, record)
                                            }}
                                            disabled={item.disabled}
                                        >
                                            {item.label}
                                        </Button>
                                    )
                                })}
                        </Space>
                    )
                },
            },
        ]
        return isAll
            ? AllColumns
            : AllColumns.filter((o) => o.key !== 'department')
    }, [isAll])

    const renderEmpty = () => {
        return (
            <Empty
                desc={
                    <div style={{ textAlign: 'center' }}>
                        <div> {__('暂无数据')}</div>
                    </div>
                }
                iconSrc={dataEmpty}
            />
        )
    }

    // 翻页
    const pageChange = async (offset, limit) => {
        setSearchCondition((prev) => ({
            ...prev,
            offset,
            limit,
        }))
    }

    const filterItems = useMemo(() => {
        return [
            {
                label: __('所属部门'),
                initLabel: __('所属部门'),
                key: 'department_id',
                options: [],
                type: SearchType.Customer,
                Component: OriginSelectComponent as React.ComponentType<{
                    value?: any
                    onChange: (value: any) => void
                }>,
            },
        ]
    }, [])
    // 删除
    const handleDelete = async () => {
        try {
            setDelBtnLoading(true)
            if (!curCatlg) return
            await deleteDataComprehension(curCatlg.catalog_id)
            setDelBtnLoading(false)
            message.success(__('删除成功'))
        } catch (e) {
            formatError(e)
        } finally {
            setDelBtnLoading(false)
            setDelVisible(false)
            debouncedRun({
                ...debounceCondition,
                current: 1,
            })
        }
    }

    return (
        <div className={styles.dataUndsFinishContentWrap}>
            <div className={styles.topWrapper}>
                <div className={styles.leftWrapper}>
                    {/* <div className={styles.leftTitle}>{__('数据理解报告')}</div> */}
                </div>
                <div className={styles.dulc_top} hidden={loading}>
                    <div className={styles.topRight}>
                        <Space size={12}>
                            <SearchInput
                                placeholder={__('搜索关联数据资源目录名称')}
                                onKeyChange={(kw: string) =>
                                    setSearchCondition((prev) => ({
                                        ...prev,
                                        keyword: kw,
                                        offset: 1,
                                    }))
                                }
                                style={{ width: 272 }}
                            />
                            {isAll && (
                                <LightweightSearch
                                    formData={filterItems}
                                    onChange={(data, key?: string) => {
                                        if (!key) {
                                            return
                                        }
                                        if (data[key]) {
                                            setSearchCondition((prev) => ({
                                                ...prev,
                                                offset: 1,
                                                [key]: data[key],
                                            }))
                                        } else {
                                            setSearchCondition((prev) => ({
                                                ...prev,
                                                offset: 1,
                                                [key]: undefined,
                                            }))
                                        }
                                    }}
                                    defaultValue={{
                                        department_id: undefined,
                                    }}
                                />
                            )}
                            <RefreshBtn
                                onClick={() =>
                                    setSearchCondition({ ...searchCondition })
                                }
                            />
                        </Space>
                    </div>
                </div>
            </div>
            {loading ? (
                <Loader />
            ) : (
                <div className={styles.dulc_bottom}>
                    {tableProps.dataSource.length === 0 &&
                    !hasSearchCondition ? (
                        <div className={styles.emptyWrapper}>
                            {renderEmpty()}
                        </div>
                    ) : (
                        <Table
                            columns={columns}
                            {...tableProps}
                            pagination={{
                                ...tableProps.pagination,
                                onChange: pageChange,
                                hideOnSinglePage:
                                    (tableProps.pagination.total || 0) <= 10,
                                current: searchCondition.offset,
                                pageSize: searchCondition.limit,
                                pageSizeOptions: [10, 20, 50, 100],
                                showQuickJumper: true,
                                responsive: true,
                                showLessItems: true,
                                showSizeChanger: true,
                                showTotal: (count) => {
                                    return `共 ${count} 条记录 第 ${
                                        searchCondition.offset
                                    }/${Math.ceil(
                                        count / searchCondition.limit,
                                    )} 页`
                                },
                            }}
                            rowClassName={styles.tableRow}
                            scroll={{
                                x: 1340,
                                y:
                                    tableProps.dataSource.length === 0
                                        ? undefined
                                        : `calc(100vh - ${tableHeight}px)`,
                            }}
                            rowKey="id"
                            locale={{
                                emptyText: <Empty />,
                            }}
                            onChange={(newPagination, filters, sorter) => {
                                if (
                                    newPagination.current ===
                                        searchCondition.offset &&
                                    newPagination.pageSize ===
                                        searchCondition.limit
                                ) {
                                    const selectedMenu =
                                        handleTableChange(sorter)
                                    setSearchCondition((prev) => ({
                                        ...prev,
                                        sort: selectedMenu.key,
                                        direction: selectedMenu.sort,
                                        offset: 1,
                                    }))
                                } else {
                                    setSearchCondition((prev) => ({
                                        ...prev,
                                        offset: newPagination?.current || 1,
                                        limit: newPagination?.pageSize || 10,
                                    }))
                                }
                            }}
                        />
                    )}
                </div>
            )}
            <Confirm
                open={delVisible}
                title={__('确定要删除数据理解报告吗？')}
                content={__('删除后该数据理解报告将无法找回，请谨慎操作！')}
                onOk={handleDelete}
                onCancel={() => {
                    setDelVisible(false)
                }}
                okText={__('确定')}
                cancelText={__('取消')}
                okButtonProps={{ loading: delBtnLoading }}
            />
        </div>
    )
}

export default memo(DataUndsFinishContent)
