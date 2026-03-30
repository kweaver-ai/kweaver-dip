import { useEffect, useMemo, useState } from 'react'
import { Space, Table, Button, message } from 'antd'
import { SortOrder } from 'antd/lib/table/interface'
import { useAntdTable, useUpdateEffect } from 'ahooks'
import classnames from 'classnames'
import dataEmpty from '@/assets/dataEmpty.svg'
import Empty from '@/ui/Empty'
import { AddOutlined } from '@/icons'
import { searchData, defaultMenu } from './const'
import styles from './styles.module.less'
import {
    formatError,
    SortDirection,
    getBusinessMattersList,
    delBusinessMatters,
} from '@/core'
import __ from './locale'
import { OperateType } from '@/utils'
import Confirm from '../Confirm'
import { SearchInput, LightweightSearch } from '@/ui'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { RefreshBtn } from '@/components/ToolbarComponents'
import CreateModal from './CreateModal'
import { IformItem } from '@/ui/LightweightSearch/const'
import { getDictItems } from './helper'

const BusinessMatters = () => {
    const [searchValue, setSearchValue] = useState('')
    const [searchCondition, setSearchCondition] = useState<any>({
        type_key: '',
        keyword: '',
        current: 1,
    })
    const [{ cssjj }] = useGeneralConfig()

    const [createOpen, setCreateOpen] = useState<boolean>(false)
    const [currentData, setCurrentData] = useState<any>()
    const [delVisible, setDelVisible] = useState<boolean>(false)
    const [delBtnLoading, setDelBtnLoading] = useState<boolean>(false)
    const [operate, setOperate] = useState<OperateType>()
    const [LightweightData, setLightweightData] =
        useState<IformItem[]>(searchData)

    const [defaultValue, setDefaultValue] = useState<any>({
        type_key: '',
    })
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        name: 'descend',
    })

    const isSearch = useMemo(() => {
        return !!searchCondition.type_key
    }, [searchCondition])

    useEffect(() => {
        getTypeOptions()
    }, [])

    useEffect(() => {
        run({ ...pagination, ...searchCondition })
    }, [searchCondition])

    useUpdateEffect(() => {
        if (searchValue === searchCondition.keyword) return
        setSearchCondition((pre) => ({
            ...pre,
            keyword: searchValue,
            offset: 1,
        }))
    }, [searchValue])

    const getList = async (params: any) => {
        const { offset, limit, keyword, sort, direction, type_key } = params

        try {
            const res = await getBusinessMattersList({
                offset,
                limit,
                keyword,
                sort,
                direction,
                type_key,
            })
            return { total: res.total_count, list: res.entries }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        } finally {
            setSelectedSort(undefined)
        }
    }

    const { tableProps, run, pagination } = useAntdTable(getList, {
        defaultPageSize: 10,
        manual: true,
    })

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        setSearchCondition((pre) => ({
            ...pre,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            offset: 1,
        }))
        setSelectedSort(selectedMenu)
        onChangeMenuToTableSort(selectedMenu)
    }

    const onChangeMenuToTableSort = (selectedMenu) => {
        setTableSort({
            name: null,
            [selectedMenu.key]:
                selectedMenu.sort === SortDirection.ASC ? 'ascend' : 'descend',
        })
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        const sorterKey = sorter.columnKey

        if (sorter.column) {
            setTableSort({
                name: null,
                [sorterKey]: sorter.order || 'ascend',
            })
            return {
                key: sorterKey,
                sort:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }

        setTableSort({
            name: null,
            [sorterKey]:
                searchCondition.direction === SortDirection.ASC
                    ? 'descend'
                    : 'ascend',
        })

        return {
            key: searchCondition.sort,
            sort:
                searchCondition.direction === SortDirection.ASC
                    ? SortDirection.DESC
                    : SortDirection.ASC,
        }
    }

    const columns: any[] = [
        {
            title: (
                <div>
                    <span>{__('事项名称')}</span>
                    {/* <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                        {__('（编码）')}
                    </span> */}
                </div>
            ),
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.name,
            showSorterTooltip: {
                title: __('按事项名称排序'),
                placement: 'bottom',
                overlayInnerStyle: {
                    color: '#fff',
                },
            },
        },
        {
            title: __('事项类型'),
            dataIndex: 'type_value',
            key: 'type_value',
            ellipsis: true,
            render: (text, record) => text || '--',
        },
        {
            title: __('来源部门'),
            dataIndex: 'department_name',
            key: 'department_name',
            ellipsis: true,
            render: (text, record) => (
                <span title={record.department_path}>{text || '--'}</span>
            ),
        },
        {
            title: __('材料数'),
            dataIndex: 'materials_number',
            key: 'materials_number',
            ellipsis: true,
            render: (text, record) => text || '0',
        },
        {
            title: __('操作'),
            key: 'action',
            width: 120,
            render: (text, record) => {
                const btnList: any[] = [
                    {
                        key: 'edit',
                        label: __('编辑'),
                    },
                    {
                        key: 'del',
                        label: __('删除'),
                    },
                ]
                return (
                    <Space size={16} className={styles.oprColumn}>
                        {btnList.map((item) => {
                            return (
                                <Button
                                    type="link"
                                    key={item.key}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleOperate(item.key, record)
                                    }}
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

    const toAdd = () => {
        setCurrentData(undefined)
        setCreateOpen(true)
        setOperate(OperateType.CREATE)
    }

    const handleOperate = async (op: string, item: any) => {
        setCurrentData(item)
        if (op === 'edit') {
            setCreateOpen(true)
            setOperate(OperateType.EDIT)
        } else {
            setDelVisible(true)
        }
    }

    const handleDelete = async () => {
        try {
            setDelBtnLoading(true)
            if (!currentData) return
            await delBusinessMatters(currentData.id)
            setDelBtnLoading(false)
            message.success(__('删除成功'))
        } catch (e) {
            formatError(e)
        } finally {
            setDelBtnLoading(false)
            setDelVisible(false)
            setSearchCondition((pre) => ({
                ...pre,
                offset: 1,
            }))
        }
    }
    const getTypeOptions = async () => {
        const res = await getDictItems()
        setLightweightData((pre) =>
            pre.map((o) => ({
                ...o,
                options: [{ label: '不限', value: '' }, ...res],
            })),
        )
    }

    return (
        <div className={styles.architectureWrapper}>
            {!cssjj && <div className={styles.title}>{__('业务事项管理')}</div>}
            <div
                className={classnames(styles.top, cssjj ? styles.cssjjTop : '')}
            >
                {cssjj && (
                    <div className={styles.title}>{__('业务事项管理')}</div>
                )}
                {!cssjj && (
                    <Button
                        type="primary"
                        icon={<AddOutlined />}
                        onClick={toAdd}
                    >
                        {__('新增')}
                    </Button>
                )}
                <Space size={8} className={styles.searchRight}>
                    <SearchInput
                        className={styles.nameInput}
                        placeholder="搜索业务事项名称"
                        value={searchValue}
                        onKeyChange={(val: string) => setSearchValue(val)}
                    />
                    <LightweightSearch
                        formData={LightweightData}
                        onChange={(data, key) =>
                            setSearchCondition((pre) => ({
                                ...pre,
                                [key || '']: data[key || ''],
                                offset: 1,
                            }))
                        }
                        defaultValue={defaultValue}
                    />
                    <Space size={0}>
                        {/* <SortBtn
                            contentNode={
                                <DropDownFilter
                                    menus={menus}
                                    defaultMenu={defaultMenu}
                                    menuChangeCb={handleMenuChange}
                                    changeMenu={selectedSort}
                                />
                            }
                        /> */}
                        <RefreshBtn onClick={() => run(searchCondition)} />
                    </Space>
                </Space>
            </div>
            <div className={styles.bottom}>
                {!isSearch &&
                tableProps.dataSource.length === 0 &&
                !tableProps.loading ? (
                    <div className={styles.emptyWrapper}>
                        <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                    </div>
                ) : (
                    <Table
                        columns={
                            cssjj
                                ? columns?.filter((o) => o.key !== 'action')
                                : columns
                        }
                        {...tableProps}
                        rowKey="id"
                        pagination={{
                            ...tableProps.pagination,
                            hideOnSinglePage: tableProps.pagination.total <= 10,
                            showQuickJumper: true,
                            showSizeChanger: true,
                            pageSize: searchCondition.limit,
                            current: searchCondition.offset,
                            showTotal: (count) => __('共${count}条', { count }),
                        }}
                        bordered={false}
                        locale={{
                            emptyText: tableProps.loading ? (
                                <div style={{ height: 300 }} />
                            ) : (
                                <Empty />
                            ),
                        }}
                        onChange={(currentPagination, filters, sorter) => {
                            const selectedMenu = handleTableChange(sorter)
                            setSelectedSort(selectedMenu)
                            setSearchCondition((prev) => ({
                                ...prev,
                                sort: selectedMenu.key,
                                direction: selectedMenu.sort,
                                offset: currentPagination.current,
                                limit: currentPagination.pageSize,
                            }))
                        }}
                    />
                )}
            </div>

            <Confirm
                open={delVisible}
                title={__('确认要删除该记录吗？')}
                content={__('记录删除将无法找回，请谨慎操作')}
                onOk={handleDelete}
                onCancel={() => {
                    setDelVisible(false)
                }}
                width={432}
                okButtonProps={{ loading: delBtnLoading }}
            />
            {createOpen && (
                <CreateModal
                    open={createOpen}
                    operate={operate}
                    currentData={currentData}
                    onClose={(refresh?: boolean) => {
                        setCreateOpen(false)
                        if (refresh) {
                            setSearchCondition((pre) => ({
                                ...pre,
                                offset: 1,
                            }))
                        }
                    }}
                />
            )}
        </div>
    )
}

export default BusinessMatters
