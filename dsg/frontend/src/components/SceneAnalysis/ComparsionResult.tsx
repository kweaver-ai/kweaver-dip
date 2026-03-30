import {
    Tabs,
    Table,
    Dropdown,
    Button,
    Popover,
    Switch,
    Spin,
    Tooltip,
} from 'antd'
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    useCallback,
    CSSProperties,
} from 'react'
import { ColumnsType } from 'antd/lib/table'
import { AppstoreOutlined, InfoCircleOutlined } from '@ant-design/icons'
import {
    useBoolean,
    useResetState,
    useInfiniteScroll,
    useUnmount,
} from 'ahooks'
import __ from './locale'
import LightweightSearch from '@/ui/LightweightSearch'
import { SearchType } from '@/ui/LightweightSearch/const'
import styles from './styles.module.less'
import { Empty, SearchInput } from '@/ui'
import { getErrorMessage, runSceneView } from '@/core'
import dataEmpty from '@/assets/dataEmpty.svg'
import { getRunViewParam, convertExecDataFormat } from './helper'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { getSource } from '@/utils'

const searchData = [
    {
        label: '对象',
        key: 'difference_type',
        options: [
            {
                label: __('显示全部结果'),
                value: 'all',
            },
            {
                label: __('仅显示一致结果'),
                value: 'same',
            },
            {
                label: __('仅显示不一致结果'),
                value: 'difference',
            },
        ],
        type: SearchType.Radio,
        initLabel: __('显示全部结果'),
    },
]

// 将基准节点放到列的最前面
export const sortCompareColumns = (
    columns: any,
    condition: (col: any) => boolean,
) => {
    const headNode: any[] = []
    const otherNode: any[] = []
    columns.forEach((col) => {
        if (condition(col)) {
            headNode.push(col)
        } else {
            otherNode.push(col)
        }
    })

    return [...headNode, ...otherNode]
}

const renderCellContent = (text: string) => {
    if (text === null) return 'null'
    if (text === 'unjoin' || text === 'nojoin') return __('未参与对比')
    if (text === 'nomatch') return __('未匹配到')

    return text
}

enum CompareType {
    STRUCT = 'compare_metadata',
    CONTENT = 'compare_content',
}

const DropdownMenu = (props: {
    menus: any[]
    onOk?: (value: any[]) => void
}) => {
    const { onOk, menus } = props
    const [open, { setTrue, setFalse }] = useBoolean(false)
    const [searchValue, setSearchValue] = useState<string>()
    const [checkAll, setCheckAll] = useState(true)
    const defaultSettings = menus.map((menu) => ({ ...menu, checked: true }))
    const [settings, setSettings] = useState(defaultSettings)
    const [checkedKeys, setCheckedKeys] = useState(
        defaultSettings.filter((set) => set.checked).map((set) => set.key),
    )
    const initSettings = useRef(defaultSettings)
    const initCheckAll = useRef(checkAll)

    useEffect(() => {
        setCheckedKeys(
            settings.filter((set) => set.checked).map((set) => set.key),
        )
    }, [settings])

    const onChange = (item, checked) => {
        const next = [...settings]
        const curIndex = next.findIndex((n) => n.key === item.key)

        next.splice(curIndex, 1, { ...item, checked })

        if (
            next.filter((nextItem) => nextItem.checked).length === menus.length
        ) {
            setCheckAll(true)
        } else {
            setCheckAll(false)
        }

        setSettings(next)
    }

    const onSearch = (value: string) => {
        setSearchValue(value)
    }

    const showSettings = useMemo(() => {
        if (searchValue) {
            return settings.filter((item) => item.label.includes(searchValue))
        }
        return settings
    }, [searchValue, settings])

    // 重置，恢复选中全部的状态
    const onReset = () => {
        initCheckAll.current = true
        initSettings.current = defaultSettings
        setCheckAll(true)
        setSearchValue(undefined)
        setSettings(defaultSettings)

        if (onOk) {
            onOk(
                defaultSettings
                    .filter((set) => set.checked)
                    .map((set) => set.key),
            )
        }

        setFalse()
    }

    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen) {
            setTrue()
        } else {
            setFalse()
            setCheckAll(initCheckAll.current)
            setSettings(initSettings.current)
        }
    }

    const onConfirm = () => {
        initSettings.current = settings
        initCheckAll.current = checkAll
        setSearchValue(undefined)
        if (onOk) {
            onOk(checkedKeys)
        }
        setFalse()
    }

    const isDisabled = checkedKeys.length === 0

    const content = (
        <div className={styles['compare-result-settings']}>
            <div className={styles['compare-result-settings-top']}>
                <SearchInput
                    placeholder={__('搜索比对项')}
                    value={searchValue}
                    onKeyChange={onSearch}
                />
                <div className={styles['compare-result-settings-tip']}>
                    <InfoCircleOutlined style={{ marginRight: '12px' }} />
                    <span>{__('表格仅显示开启的比对项')}</span>
                </div>
                <div className={styles['compare-result-settings-list']}>
                    <div
                        key="all"
                        className={styles['compare-result-settings-list-item']}
                    >
                        <span>{__('全部')}</span>
                        <Switch
                            checked={checkAll}
                            size="small"
                            onChange={(checked) => {
                                setCheckAll(checked)
                                if (checked) {
                                    setSettings((prev) => {
                                        return prev.map((item) => ({
                                            ...item,
                                            checked: true,
                                        }))
                                    })
                                } else {
                                    setSettings((prev) => {
                                        return prev.map((item) => ({
                                            ...item,
                                            checked: false,
                                        }))
                                    })
                                }
                            }}
                        />
                    </div>
                    {showSettings.map((set) => (
                        <div
                            key={set.key}
                            className={
                                styles['compare-result-settings-list-item']
                            }
                        >
                            <span>{set.label}</span>
                            <Switch
                                size="small"
                                checked={set.checked}
                                onChange={(checked) => onChange(set, checked)}
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles['compare-result-operation']}>
                <Button type="link" onClick={onReset}>
                    {__('重置')}
                </Button>
                <Tooltip
                    title={isDisabled ? __('至少开启一个比对项') : null}
                    placement="topRight"
                >
                    <Button
                        type="link"
                        disabled={isDisabled}
                        onClick={onConfirm}
                    >
                        {__('确定')}
                    </Button>
                </Tooltip>
            </div>
        </div>
    )
    return (
        <Popover
            title={null}
            placement="bottomRight"
            content={content}
            overlayClassName={styles['compare-result-popover']}
            trigger="click"
            open={open}
            onOpenChange={handleOpenChange}
        >
            <Button icon={<AppstoreOutlined />}>{__('比对项')}</Button>
        </Popover>
    )
}

interface CompareProps {
    preNodes: any[]
    fieldsData: any
    scrollHeight: number
}

interface CompareTableProps extends CompareProps {
    activeKey: CompareType
    columns:
        | ColumnsType<any>
        | { (data: any[], columns?: any[]): ColumnsType<any> }
    searchCondition: any
    scrollWidth: number
    formatter?: (data: any[], columns: any[]) => any[]
}

const CompareTable = (props: CompareTableProps) => {
    const {
        activeKey,
        preNodes,
        fieldsData,
        columns,
        scrollWidth,
        searchCondition,
        scrollHeight,
        formatter,
    } = props
    const [dataSource, setDataSource] = useState<any>([])
    const curOffset = useRef<number>(1)
    const [errorMsg, setErrorMsg] = useState<string>()
    const originData = useRef<any[]>([])
    const columnsData = useRef<any[]>([])
    const compareColumns = useMemo(() => {
        return typeof columns === 'function'
            ? columns(originData.current, columnsData.current)
            : columns
    }, [columns, dataSource])
    const [requestLoading, setRequestLoading] = useState(false)

    useUnmount(() => {
        cancelRunGraph()
    })

    // 取消执行请求
    const cancelRunGraph = () => {
        const sor = getSource()
        if (sor.length > 0) {
            sor.forEach((info) => {
                if (
                    info.config?.url?.includes(
                        '/api/scene-analysis/v1/scene/exec?',
                    )
                ) {
                    info.source.cancel()
                }
            })
        }
    }

    const getResultList = async (
        offset: number,
        limit = defaultLimit,
        isFirst: boolean = true,
    ) => {
        try {
            cancelRunGraph()
            setErrorMsg(undefined)
            setRequestLoading(true)
            const params = getRunViewParam(preNodes, fieldsData, undefined, {
                ...searchCondition,
                activeKey,
            })
            const res = await runSceneView(
                limit,
                offset,
                params,
                isFirst,
                'scene-analysis',
            )
            const formatRes = convertExecDataFormat(res)
            columnsData.current = formatRes?.columns ?? []
            setRequestLoading(false)
            return {
                total: formatRes?.count ?? 0,
                data: formatRes?.data ?? [],
                list: formatRes?.data ?? [],
            }
        } catch (error) {
            if (error?.data?.code === 'ERR_CANCELED') {
                return { total: 0, list: [], data: [] }
            }
            setRequestLoading(false)
            setErrorMsg(getErrorMessage({ error }))
            return { total: 0, list: [], data: [] }
        }
    }

    const {
        data,
        loading,
        loadingMore,
        noMore,
        loadMore,
        reload: updateList,
        error,
    } = useInfiniteScroll<{
        data: any[]
        list: any[]
        total: number
    }>(
        () => {
            return getResultList(curOffset.current)
        },
        {
            target: () =>
                document.querySelector(
                    '#compare-result-table .any-fabric-ant-table-body',
                ),
            manual: true,
            isNoMore: (d: any) => {
                return d?.data?.length < defaultLimit || false
            },
            onSuccess: (d) => {
                curOffset.current += 1
            },
            // reloadDeps: [searchCondition],
        },
    )
    useEffect(() => {
        const list: any[] = formatter
            ? formatter(data?.data ?? [], compareColumns)
            : data?.data ?? []
        if (curOffset.current === 1) {
            originData.current = data?.data ?? []
            setDataSource(list)
        } else {
            originData.current = [...originData.current, ...(data?.data ?? [])]
            setDataSource([...dataSource, ...list])
        }
    }, [data, formatter])

    useEffect(() => {
        curOffset.current = 1
        updateList()
    }, [searchCondition])

    const hasNoData = errorMsg || data?.list.length === 0
    const emptyView = (
        <div>
            <Empty
                iconSrc={dataEmpty}
                desc={
                    <div
                        style={{
                            textAlign: 'center',
                        }}
                    >
                        <div>{__('暂无数据')}</div>
                        <div hidden={!errorMsg}>{errorMsg}</div>
                    </div>
                }
            />
        </div>
    )

    if (requestLoading && !loadingMore) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: '60px',
                }}
            >
                <Spin />
            </div>
        )
    }

    if (hasNoData) return emptyView

    return (
        <Table
            bordered
            columns={compareColumns}
            dataSource={dataSource}
            loading={loading}
            rowKey="id"
            id="compare-result-table"
            scroll={{
                x: scrollWidth,
                y: scrollHeight,
            }}
            pagination={false}
            summary={() =>
                (dataSource?.length > 0 && (
                    <div className={styles['text-center']}>
                        {loadingMore && <Spin size="small" />}
                        {noMore && <span>没有更多了</span>}
                        {error && (
                            <span className={styles['text-center-retry']}>
                                加载失败
                                <br />
                                <a
                                    onClick={() => {
                                        loadMore()
                                    }}
                                >
                                    重试
                                </a>
                            </span>
                        )}
                    </div>
                )) as any
            }
            className={styles.compareResultTable}
            locale={{
                emptyText: loading ? (
                    <div style={{ height: 300 }} />
                ) : (
                    <Empty />
                ),
            }}
        />
    )
}

const defaultLimit = 10

const defaultFilterValue = { difference_type: 'all' }

const ComparisionResult = (props: any) => {
    const { graph, node, preNodes = [], fieldsData, scrollHeight = 100 } = props
    const [activeKey, setActiveKey] = useState<CompareType>(CompareType.STRUCT)
    const [searchCondition, setSearchCondition] =
        useState<any>(defaultFilterValue)
    const { config } = node?.data?.formula?.[0] ?? {}
    const { benchmark } = config
    const sortedPreNodes = sortCompareColumns(
        node!.data.src.map((info) => graph!.getCellById(info)),
        (col) => col.id === benchmark,
    )

    const searchChange = (data, dataKey) => {
        if (!dataKey) {
            // 清空筛选
            setSearchCondition({
                ...searchCondition,
                ...data,
            })
        } else if (dataKey === 'difference_type') {
            setSearchCondition({
                ...searchCondition,
                difference_type: data[dataKey],
            })
        }
    }

    const allCompareFields =
        config?.compare_fields?.map((comp, idx) => {
            // const tempItem = outputFields.find(
            //     (f) => `${f.id}_${f.sourceId}` === comp.comparisonItem[1],
            // )
            // const temp = fieldsData?.data?.find(
            //     (f) => f.id === comp.comparisonItem[1]?.split('_')?.[0],
            // )

            return {
                title: comp.comparisonUnique,
                key: `comparisonUnique_${idx}`,
                dataIndex: `comparisonUnique_${idx}`,
                width: 200,
                ellipsis: true,
                id: `comparisonUnique_${idx}`,
            }
        }) || []

    const [compareItems, setCompareItems] = useState<any[]>(
        allCompareFields.map((f) => f.key),
    )
    const compareFields = useMemo(
        () =>
            allCompareFields.filter((item) => compareItems.includes(item.key)),
        [allCompareFields, compareItems],
    )

    const structureColumns = useMemo((): ColumnsType<any> => {
        const renderDiffCell = (
            record: any,
            dataIndex: string,
            diffKey: string,
        ) => {
            let finalStyle = {} as CSSProperties
            // 渲染为null或者不存在的单元格
            if (
                record[dataIndex] === 'nojoin' ||
                record[dataIndex] === 'unjoin' ||
                record[dataIndex] === 'nomatch'
            ) {
                finalStyle = {
                    color: 'rgba(0,0,0,0.25)',
                }
            }
            // 渲染有差异的单元格
            else if (record[diffKey] === 'false') {
                finalStyle = {
                    background: 'rgba(250, 173, 20, 0.1)',
                    color: '#ff822f',
                }
            }
            // 渲染一致的结果的单元格

            return {
                style: finalStyle,
            }
        }

        return sortedPreNodes.map((n, idx) => {
            const isBenchmark = n.id === benchmark
            return {
                title: (
                    <div>
                        <FontIcon
                            name="icon-zuzhijiegou2"
                            type={IconType.COLOREDICON}
                        />
                        <span className={styles.tableHead}>{n.data.name}</span>
                        {isBenchmark && (
                            <span className={styles.benchmarkNode}>
                                {__('基准')}
                            </span>
                        )}
                    </div>
                ),
                width: 1000,
                children: [
                    {
                        title: __('字段业务名称'),
                        dataIndex: isBenchmark
                            ? 'BusinessNameMaster'
                            : `BusinessNameSlave_${idx}`,
                        key: isBenchmark
                            ? 'BusinessNameMaster'
                            : `BusinessNameSlave_${idx}`,
                        width: 200,
                        render: renderCellContent,
                        ...(isBenchmark
                            ? {}
                            : {
                                  onCell: (record, rowIndex) => {
                                      return renderDiffCell(
                                          record,
                                          `BusinessNameSlave_${idx}`,
                                          `BusinessNameDifference_${idx}`,
                                      )
                                  },
                              }),
                        ...(isBenchmark ? { fixed: 'left' } : {}),
                    },
                    {
                        title: __('字段技术名称'),
                        dataIndex: isBenchmark
                            ? 'FieldNameMaster'
                            : `FieldNameSlave_${idx}`,
                        key: isBenchmark
                            ? 'FieldNameMaster'
                            : `FieldNameSlave_${idx}`,
                        width: 200,
                        render: renderCellContent,
                        ...(isBenchmark
                            ? {}
                            : {
                                  onCell: (record, rowIndex) =>
                                      renderDiffCell(
                                          record,
                                          `FieldNameSlave_${idx}`,
                                          `FieldNameDifference_${idx}`,
                                      ),
                              }),
                        ...(isBenchmark ? { fixed: 'left' } : {}),
                    },
                    {
                        title: __('数据类型'),
                        dataIndex: isBenchmark
                            ? 'FieldTypeMaster'
                            : `FieldTypeSlave_${idx}`,
                        key: isBenchmark
                            ? 'FieldTypeMaster'
                            : `FieldTypeSlave_${idx}`,
                        width: 200,
                        render: renderCellContent,
                        ...(isBenchmark
                            ? {}
                            : {
                                  onCell: (record, rowIndex) =>
                                      renderDiffCell(
                                          record,
                                          `FieldTypeSlave_${idx}`,
                                          `FieldTypeDifference_${idx}`,
                                      ),
                              }),
                        ...(isBenchmark ? { fixed: 'left' } : {}),
                    },
                    {
                        title: __('长度'),
                        dataIndex: isBenchmark
                            ? 'FieldLengthMaster'
                            : `FieldLengthSlave_${idx}`,
                        key: isBenchmark
                            ? 'FieldLengthMaster'
                            : `FieldLengthSlave_${idx}`,
                        width: 200,
                        render: renderCellContent,
                        ...(isBenchmark
                            ? {}
                            : {
                                  onCell: (record, rowIndex) =>
                                      renderDiffCell(
                                          record,
                                          `FieldLengthSlave_${idx}`,
                                          `FieldLengthDifference_${idx}`,
                                      ),
                              }),
                        ...(isBenchmark ? { fixed: 'left' } : {}),
                    },
                    {
                        title: __('精度'),
                        dataIndex: isBenchmark
                            ? 'FieldAccuracyMaster'
                            : `FieldAccuracySlave_${idx}`,
                        key: isBenchmark
                            ? 'FieldAccuracyMaster'
                            : `FieldAccuracySlave_${idx}`,
                        width: 200,
                        render: renderCellContent,
                        ...(isBenchmark
                            ? {}
                            : {
                                  onCell: (record, rowIndex) =>
                                      renderDiffCell(
                                          record,
                                          `FieldAccuracySlave_${idx}`,
                                          `FieldAccuracyDifference_${idx}`,
                                      ),
                              }),
                        ...(isBenchmark ? { fixed: 'left' } : {}),
                    },
                ],
                ...(isBenchmark ? { fixed: 'left' } : {}),
            }
        })
    }, [preNodes, fieldsData])

    const contentColumns = useCallback(
        (data: any[], columnsData?: any[]) => {
            const uniqueName = config?.compare_key?.[0]?.unique

            const benchmarkCount =
                columnsData?.find((d) => d.isBenchmark)?.count ?? 0

            const renderDiffCell = (
                record: any,
                recordIndex: number,
                rowIndex: number,
                dataIndex: string,
            ) => {
                const diffData = (
                    Array.isArray(data[rowIndex]) ? data[rowIndex] : []
                ).slice(-(compareFields.length ?? 0))
                const diffItem = diffData[recordIndex]
                let finalStyle = {} as CSSProperties
                // 渲染为null或者未参与对比的单元格
                if (
                    record[dataIndex] === 'unjoin' ||
                    record[dataIndex] === 'nojoin' ||
                    record[dataIndex] === 'nomatch'
                ) {
                    finalStyle = {
                        color: 'rgba(0,0,0,0.25)',
                    }
                }
                // 渲染有差异的单元格
                else if (diffItem === 'false') {
                    finalStyle = {
                        background: 'rgba(250, 173, 20, 0.1)',
                        color: '#ff822f',
                    }
                }
                // 渲染一致的结果的单元格
                return {
                    style: finalStyle,
                }
            }

            return (
                [
                    {
                        title: __('序号'),
                        dataIndex: 'no',
                        key: 'no',
                        fixed: 'left',
                        width: 100,
                        render(_, record, index) {
                            return index + 1
                        },
                    },
                    {
                        title: __('唯一标识'),
                        children: [
                            {
                                title: uniqueName,
                                dataIndex: 'identifier',
                                key: 'identifier',
                                fixed: 'left',
                                width: 200,
                            },
                        ],
                    },
                ] as ColumnsType<any>
            ).concat(
                sortedPreNodes.map((n, index) => {
                    const isBenchmark = n.id === benchmark
                    const { count = 0 } = columnsData?.[index] ?? {}
                    const diffCount = `${
                        count - benchmarkCount > 0 ? '+' : '-'
                    }${Math.abs(count - benchmarkCount)}`

                    return {
                        title: (
                            <div>
                                <FontIcon
                                    name="icon-zuzhijiegou2"
                                    type={IconType.COLOREDICON}
                                />
                                <span className={styles.tableHead}>
                                    {n.data.name}
                                </span>
                                {isBenchmark && (
                                    <span className={styles.benchmarkNode}>
                                        {__('基准')}
                                    </span>
                                )}
                                <span style={{ fontWeight: 400 }}>
                                    {__('数据量')}：
                                    {`${count} ${
                                        isBenchmark ||
                                        count - benchmarkCount === 0
                                            ? ''
                                            : `(${diffCount})`
                                    }`}{' '}
                                    条
                                </span>
                            </div>
                        ),
                        ellipsis: true,
                        children: compareFields.map((f, recordIndex) => ({
                            ...f,
                            key: `${f.key}_${n.id}`,
                            dataIndex: `${f.dataIndex}_${n.id}`,
                            render: renderCellContent,
                            ...(isBenchmark
                                ? {}
                                : {
                                      onCell: (record, rowIndex) =>
                                          renderDiffCell(
                                              record,
                                              recordIndex,
                                              rowIndex,
                                              `${f.dataIndex}_${n.id}`,
                                          ),
                                  }),
                        })),
                        ...(n.id === benchmark ? { fixed: 'left' } : {}),
                    }
                }),
            )
        },
        [preNodes, fieldsData, compareFields],
    )

    const comparsonItems = contentColumns?.[3]?.children ?? []
    const comparsonMenus = (allCompareFields ?? []).map((comp) => ({
        label: comp.title,
        key: comp.key,
    }))

    const formatter = useCallback((data: any, columns: any[]) => {
        return data.map((item) => {
            let offset = 0
            return columns.reduce((acc, cur, index) => {
                // 第一个是序号，忽略
                if (index === 0) return acc
                if (index === 1) {
                    // 写死的dataIndex
                    acc.identifier = item[offset]
                    offset += 1
                }
                if (index > 1) {
                    ;(cur.children ?? []).forEach((child) => {
                        acc[child.dataIndex] = item[offset]
                        offset += 1
                    })
                }

                return acc
            }, {})
        })
    }, [])

    const items = [
        {
            label: __('数据结构比对'),
            key: CompareType.STRUCT,
            children: (
                <CompareTable
                    columns={structureColumns}
                    preNodes={preNodes}
                    fieldsData={fieldsData}
                    searchCondition={searchCondition}
                    activeKey={CompareType.STRUCT}
                    scrollWidth={structureColumns.length * 1000}
                    scrollHeight={scrollHeight}
                />
            ),
        },
        {
            label: __('数据量/内容比对'),
            key: CompareType.CONTENT,
            children: (
                <CompareTable
                    columns={contentColumns}
                    preNodes={preNodes}
                    fieldsData={fieldsData}
                    searchCondition={searchCondition}
                    activeKey={CompareType.CONTENT}
                    scrollWidth={
                        (comparsonItems.length ?? 1) *
                            200 *
                            (contentColumns.length - 2) +
                        300
                    }
                    scrollHeight={scrollHeight}
                    formatter={formatter}
                />
            ),
        },
    ]

    const onOk = (checkedKeys) => {
        setCompareItems(checkedKeys)
    }

    const tabBarExtraContent = (
        <div className={styles['compare-result-tab-extra']}>
            <LightweightSearch
                formData={searchData}
                onChange={(dataSearch, key) => {
                    searchChange(dataSearch, key)
                }}
                defaultValue={defaultFilterValue}
            />
            {activeKey === CompareType.CONTENT && (
                <DropdownMenu menus={comparsonMenus} onOk={onOk} />
            )}
        </div>
    )

    const onChangeKey = (key) => {
        setActiveKey(key)
    }

    return (
        <Tabs
            activeKey={activeKey}
            className={styles['compare-result']}
            onChange={onChangeKey}
            items={items}
            tabBarExtraContent={tabBarExtraContent}
        />
    )
}

export default ComparisionResult
