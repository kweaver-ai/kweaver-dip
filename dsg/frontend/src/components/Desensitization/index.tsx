import { Button, Popover, Space, Table, Tooltip } from 'antd'
import { Key, useEffect, useMemo, useRef, useState } from 'react'

import { useAntdTable, useBoolean } from 'ahooks'
import { ColumnType, SortOrder } from 'antd/lib/table/interface'
import moment from 'moment'
import dataEmpty from '@/assets/dataEmpty.svg'
import DropDownFilter from '@/components/DropDownFilter'
import PrivacyDetails from '@/components/PrivacyDataProtection/Details'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import {
    SortDirection,
    exportDesenRule,
    formatError,
    getDesenRuleList,
} from '@/core'
import { AddOutlined, InfotipOutlined } from '@/icons'
import { ListDefaultPageSize, ListType, SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import { streamToFile } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import Config, { DesensitizationRecord } from './Config'
import DelModal from './DelModal'
import Details from './Details'
import ProgressModal from './ProgressModal'
import { MethodsTips, RulesTips } from './TipsMsg'
import __ from './locale'
import styles from './styles.module.less'
import { useBatchDel } from './useBatchDel'

enum SortType {
    UPDATED = 'updated_at',
    CREATED = 'created_at',
    NAME = 'name',
}

const menus = [
    { key: SortType.UPDATED, label: __('按更新时间排序') },
    { key: SortType.CREATED, label: __('按创建时间排序') },
    { key: SortType.NAME, label: __('按算法名称排序') },
]

const defaultMenu = {
    key: SortType.UPDATED,
    sort: SortDirection.DESC,
}

const defaultLimit = ListDefaultPageSize[ListType.WideList]

export const methodMap = {
    all: __('全部脱敏'),
    middle: __('中间脱敏'),
    'head-tail': __('首尾脱敏'),
}

const Desensitization = () => {
    const [keyword, setKeyword] = useState('')
    const [searchCondition, setSearchCondition] = useState<any>({
        pageSize: defaultLimit,
        current: 1,
        sort: defaultMenu.key,
        direction: defaultMenu.sort,
        keyword,
    })
    const [detail, setDetail] = useState<string>('')
    const [delIds, setDelIds] = useState<string[]>([])
    const [updateRule, setUpdateRule] = useState<
        DesensitizationRecord | undefined
    >()
    const [open, { setTrue, setFalse }] = useBoolean(false)
    const [privacyOpen, { setTrue: openPrivacy, setFalse: closePrivacy }] =
        useBoolean(false)
    const [creationOpen, { setTrue: openCreation, setFalse: closeCreation }] =
        useBoolean(false)
    const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        createAt: null,
        name: null,
        updateAt: 'descend',
    })
    const delModalRef = useRef<{ setTrue: () => void; setFalse: () => void }>()
    const progressModalRef = useRef<{
        setTrue: () => void
        setFalse: () => void
    }>()
    const privacyIdRef = useRef('')
    const { batchDel, ...rest } = useBatchDel({
        onComplete(params, state) {
            if (progressModalRef.current) {
                progressModalRef.current.setFalse()
            }
            if (delModalRef.current) {
                delModalRef.current.setTrue()
            }
            // 部分删除成功，重新获取列表
            run({ ...pagination, ...searchCondition })
        },
    })

    const getRulesList = async (params: any) => {
        const {
            current,
            pageSize = defaultLimit,
            keyword: kd,
            sort,
            direction,
        } = params

        try {
            const res = await getDesenRuleList({
                offset: current,
                limit: pageSize,
                keyword: kd,
                sort,
                direction,
            })
            return { total: res.total_count, list: res.entries }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        } finally {
            setSelectedSort(undefined)
        }
    }

    const { tableProps, run, pagination } = useAntdTable(getRulesList, {
        defaultPageSize: defaultLimit,
        manual: true,
    })

    const delRule = (ids: string[]) => {
        confirm({
            title: '确定要删除脱敏算法吗？',
            onOk() {
                batchDel(
                    ids.map((id) => ({
                        id,
                    })),
                )
                if (ids.length > 1 && progressModalRef.current) {
                    progressModalRef.current.setTrue()
                } else if (delModalRef.current) {
                    delModalRef.current.setTrue()
                }
            },
        })
    }

    const exportRule = async (ids: string[]) => {
        try {
            const res = await exportDesenRule({ ids })
            streamToFile(
                res,
                `脱敏算法_${moment().format('YYYYMMDDhhmmss')}.xlsx`,
            )
        } catch (error) {
            formatError(error)
        }
    }

    const columns: ColumnType<any>[] = [
        {
            title:
                selectedRowKeys.length > 0
                    ? `已选 ${selectedRowKeys.length} 项`
                    : __('算法名称（描述）'),
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.name,
            showSorterTooltip: false,
            render(text: string, record: any) {
                return (
                    <>
                        <div title={text} className={styles.textOverflow}>
                            {text}
                        </div>
                        <div
                            title={record.description}
                            className={`${styles.descText} ${styles.textOverflow}`}
                        >
                            {record.description || __('暂无描述')}
                        </div>
                    </>
                )
            },
        },
        {
            title: __('脱敏算法'),
            dataIndex: 'algorithm',
            key: 'algorithm',
            ellipsis: true,
        },
        // {
        //     title: __('类型'),
        //     dataIndex: 'type',
        //     key: 'type',
        //     ellipsis: true,
        //     width: 80,
        //     render(text: string) {
        //         const map = {
        //             custom: __('自定义'),
        //             'built-in': __('内置'),
        //         }
        //         return map[text]
        //     },
        // },
        {
            title: (
                <>
                    <span className={styles.infoMargin4}>{__('脱敏方式')}</span>
                    <Popover
                        title={__('脱敏方式')}
                        overlayClassName={styles.tipsWrapper}
                        placement="bottom"
                        content={<MethodsTips />}
                    >
                        <InfotipOutlined />
                    </Popover>
                </>
            ),
            dataIndex: 'method',
            key: 'method',
            ellipsis: true,
            width: 120,
            render(text: string) {
                return methodMap[text]
            },
        },
        {
            title: __('创建时间'),
            dataIndex: 'created_at',
            key: 'created_at',
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.createAt,
            showSorterTooltip: false,
            render(text: string) {
                return moment(text).format('YYYY-MM-DD HH:mm:ss')
            },
        },
        {
            title: '更新时间',
            dataIndex: 'updated_at',
            key: 'updated_at',
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.updateAt,
            showSorterTooltip: false,
            render(text: string) {
                return moment(text).format('YYYY-MM-DD HH:mm:ss')
            },
        },
        {
            title: __('操作'),
            dataIndex: 'operation',
            key: 'operation',
            ellipsis: true,
            width: 220,
            render(_, record: any) {
                return (
                    <div className={styles.tableOperation}>
                        <Button
                            type="link"
                            onClick={() => {
                                setDetail(record.id)
                                setTrue()
                            }}
                        >
                            {__('详情')}
                        </Button>
                        <Button
                            type="link"
                            onClick={() => {
                                setUpdateRule(record)
                                openCreation()
                            }}
                        >
                            {__('编辑')}
                        </Button>
                        <Button
                            type="link"
                            onClick={() => exportRule([record.id])}
                        >
                            {__('导出')}
                        </Button>
                        <Button
                            type="link"
                            onClick={() => {
                                setDelIds([record.id])
                                delRule([record.id])
                            }}
                        >
                            {__('删除')}
                        </Button>
                    </div>
                )
            },
        },
    ]

    const onSelectChange = (newSelectedRowKeys: Key[]) => {
        setSelectedRowKeys(newSelectedRowKeys)
    }

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    }

    useEffect(() => {
        run({ ...pagination, ...searchCondition })
    }, [searchCondition])

    const isSearch = useMemo(() => {
        const { keyword: kd } = searchCondition
        return kd !== undefined && kd !== null && kd !== ''
    }, [searchCondition])

    useEffect(() => {
        const ids = tableProps.dataSource.map((item) => item.id)
        setSelectedRowKeys((prevKeys) => {
            return prevKeys.filter((key) => ids.includes(key))
        })
    }, [tableProps.dataSource])

    // 表格排序改变
    const handleTableChange = (sorter) => {
        const sortFieldsMap = {
            updated_at: 'updateAt',
            created_at: 'createAt',
            name: 'name',
        }
        const switchSortColumn = (
            source: { [key: string]: SortOrder },
            selectedKey: string,
            sortValue: SortOrder,
        ) => {
            const newState = { ...source }

            Object.keys(source).forEach((key) => {
                if (sortFieldsMap[selectedKey] === key) {
                    newState[key] = sortValue
                } else {
                    newState[key] = null
                }
            })
            return newState
        }
        if (sorter.column) {
            setTableSort((prevState) =>
                switchSortColumn(
                    prevState,
                    sorter.columnKey,
                    sorter.order || 'ascend',
                ),
            )
            return {
                key: sorter.columnKey,
                sort:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }
        // 当表格排序字段为undefined
        const { sort } = searchCondition
        setTableSort((prevState) => {
            return switchSortColumn(
                prevState,
                sort,
                searchCondition.direction === SortDirection.ASC
                    ? 'descend'
                    : 'ascend',
            )
        })
        return {
            key: searchCondition.sort,
            sort:
                searchCondition.direction === SortDirection.ASC
                    ? SortDirection.DESC
                    : SortDirection.ASC,
        }
    }

    const onChangeMenuToTableSort = (selectedMenu) => {
        switch (selectedMenu.key) {
            case 'name':
                setTableSort({
                    name:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                    updateAt: null,
                    createAt: null,
                })
                break
            case 'updated_at':
                setTableSort({
                    name: null,
                    createAt: null,
                    updateAt:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                })
                break
            case 'created_at':
                setTableSort({
                    name: null,
                    updateAt: null,
                    createAt:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                })
                break
            default:
                setTableSort({
                    name: null,
                    updateAt: null,
                    createAt: null,
                })
                break
        }
    }

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        setSearchCondition({
            ...searchCondition,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            current: 1,
        })
        setSelectedSort(selectedMenu)
        onChangeMenuToTableSort(selectedMenu)
    }

    return (
        <div className={styles.desensitizationWrapper}>
            <div className={styles.pageTitle}>
                <span className={styles.infoMargin4}>{__('脱敏算法')}</span>
                <Popover
                    title={__('脱敏算法')}
                    placement="bottomLeft"
                    content={<RulesTips />}
                    overlayClassName={styles.tipsWrapper}
                >
                    <InfotipOutlined />
                </Popover>
            </div>
            <div className={styles.top}>
                <div className={styles.topLeft}>
                    <Button
                        type="primary"
                        icon={<AddOutlined />}
                        onClick={() => {
                            setUpdateRule(undefined)
                            openCreation()
                        }}
                    >
                        {`${__('新建')}${__('脱敏算法')}`}
                    </Button>
                    {tableProps.dataSource.length > 0 && (
                        <>
                            <Tooltip
                                title={
                                    selectedRowKeys.length === 0
                                        ? __('请先选择脱敏算法')
                                        : null
                                }
                                placement="bottom"
                            >
                                <Button
                                    disabled={selectedRowKeys.length === 0}
                                    onClick={() => {
                                        exportRule(
                                            selectedRowKeys.map((item) =>
                                                item.toString(),
                                            ),
                                        )
                                    }}
                                >
                                    {__('导出')}
                                </Button>
                            </Tooltip>
                            <Button
                                disabled={selectedRowKeys.length === 0}
                                onClick={() => {
                                    setDelIds(
                                        selectedRowKeys.map((item) =>
                                            item.toString(),
                                        ),
                                    )
                                    delRule(
                                        selectedRowKeys.map((item) =>
                                            item.toString(),
                                        ),
                                    )
                                }}
                            >
                                {__('删除')}
                            </Button>
                        </>
                    )}
                </div>
                <Space size={12} className={styles.topRight}>
                    <SearchInput
                        style={{ width: 272 }}
                        placeholder={__('搜索脱敏算法名称')}
                        onKeyChange={(kw: string) => {
                            if (kw === searchCondition?.keyword) return
                            setSearchCondition({
                                ...searchCondition,
                                current: 1,
                                keyword: kw,
                            })
                            setKeyword(kw)
                        }}
                    />
                    <Space size={0}>
                        <SortBtn
                            contentNode={
                                <DropDownFilter
                                    menus={menus}
                                    defaultMenu={defaultMenu}
                                    menuChangeCb={handleMenuChange}
                                    changeMenu={selectedSort}
                                    overlayStyle={{ width: 160 }}
                                />
                            }
                        />
                        <RefreshBtn
                            onClick={() => {
                                setSearchCondition({
                                    ...searchCondition,
                                    current: 1,
                                })
                                setFalse()
                            }}
                        />
                    </Space>
                </Space>
            </div>

            <div className={styles.bottom} id="desensitizationList">
                {!isSearch &&
                tableProps.dataSource.length === 0 &&
                !tableProps.loading ? (
                    <div className={styles.emptyWrapper}>
                        <Empty desc="暂无数据" iconSrc={dataEmpty} />
                    </div>
                ) : (
                    <Table
                        columns={columns}
                        {...tableProps}
                        rowKey="id"
                        rowSelection={rowSelection}
                        onChange={(currentPagination, filters, sorter) => {
                            if (
                                currentPagination.current ===
                                searchCondition.current
                            ) {
                                const selectedMenu = handleTableChange(sorter)
                                setSelectedSort(selectedMenu)
                                setSearchCondition({
                                    ...searchCondition,
                                    sort: selectedMenu.key,
                                    direction: selectedMenu.sort,
                                    pageSize: currentPagination.pageSize,
                                    current: 1,
                                })
                            } else {
                                setSearchCondition({
                                    ...searchCondition,
                                    pageSize: currentPagination.pageSize,
                                    current: currentPagination?.current || 1,
                                })
                            }
                        }}
                        scroll={{
                            x: 500,
                            y:
                                tableProps.dataSource.length === 0
                                    ? undefined
                                    : tableProps.pagination.total > 20
                                    ? 'calc(100vh - 250px)'
                                    : 'calc(100vh - 250px)',
                        }}
                        pagination={{
                            ...tableProps.pagination,
                            hideOnSinglePage: tableProps.pagination.total <= 10,
                            showSizeChanger: true,
                            size: 'small',
                            onChange(current, pageSize) {
                                setSearchCondition({
                                    ...searchCondition,
                                    current,
                                    pageSize,
                                })
                            },
                            showTotal(total, range) {
                                return `共 ${total} 条`
                            },
                        }}
                        bordered={false}
                        locale={{
                            emptyText: tableProps.loading ? (
                                <div style={{ height: 300 }} />
                            ) : (
                                <Empty />
                            ),
                        }}
                    />
                )}
                <ProgressModal ref={progressModalRef} {...rest} />
                <DelModal
                    ref={delModalRef}
                    allCompleted={rest.allCompleted}
                    isSingle={delIds.length < 2}
                    successCount={rest.successCount}
                    failedCount={rest.failedCount}
                    onCancel={() => {
                        if (delModalRef.current) {
                            delModalRef.current.setFalse()
                        }
                    }}
                    onCheck={(id, type) => {
                        if (type === 'Desensitization') {
                            setDetail(id)
                            setTrue()
                        } else {
                            privacyIdRef.current = id
                            openPrivacy()
                        }
                    }}
                    onSuccess={() => {
                        // 删除成功，重新获取列表
                        run({ ...pagination, ...searchCondition })
                    }}
                />
                <Details
                    open={open}
                    detailsId={detail}
                    onClose={() => {
                        setDetail('')
                        setFalse()
                    }}
                />
                <PrivacyDetails
                    open={privacyOpen}
                    id={privacyIdRef.current}
                    getContainer={false}
                    mask={false}
                    zIndex={1000}
                    onClose={() => {
                        closePrivacy()
                    }}
                />
                <Config
                    open={creationOpen}
                    data={updateRule}
                    onOk={() => {
                        setUpdateRule(undefined)
                        closeCreation()
                        // 新建成功，重新请求列表
                        run({ ...pagination, ...searchCondition })
                    }}
                    onClose={() => {
                        setUpdateRule(undefined)
                        closeCreation()
                    }}
                />
            </div>
        </div>
    )
}

export default Desensitization
