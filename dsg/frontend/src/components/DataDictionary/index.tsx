import { message, Space, Table } from 'antd'

import { useUpdateEffect } from 'ahooks'
import { trim } from 'lodash'
import React, { useEffect, useMemo, useState } from 'react'
import searchEmpty from '@/assets/searchEmpty.svg'
import {
    DataDictQueryType,
    deleteDataDict,
    formatError,
    getDataDictPage,
    IDataDictBasicInfo,
    IGetDataDictPageParams,
    SortDirection,
    SortType,
} from '@/core'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { Loader, OptionBarTool, OptionMenuType, SearchInput } from '@/ui'
import { confirm } from '@/utils/modalHelper'
import DropDownFilter from '../DropDownFilter'
import { RefreshBtn, SortBtn } from '../ToolbarComponents'
import Details from './Details'
import Edit from './Edit'
import {
    DataDictionaryOperate,
    defaultMenu,
    renderEmpty,
    sortMenus,
} from './helper'
import __ from './locale'
import styles from './styles.module.less'

const initSearchCondition: IGetDataDictPageParams = {
    limit: 10,
    offset: 1,
    sort: SortType.UPDATED,
    direction: SortDirection.DESC,
    query_type: DataDictQueryType.Product,
    name: '',
}

const DataDictionary: React.FC = () => {
    // 初始化 load
    const [loading, setLoading] = useState<boolean>(true)
    // 加载数据 load
    const [fetching, setFetching] = useState<boolean>(true)
    // 表格数据
    const [tableData, setTableData] = useState<IDataDictBasicInfo[]>([])
    // 总条数
    const [total, setTotal] = useState<number>(0)
    // 当前操作项
    const [operateItem, setOperateItem] = useState<IDataDictBasicInfo>()
    // 详情弹窗
    const [detailsVisible, setDetailsVisible] = useState(false)
    // 评价弹窗
    const [editVisible, setEditVisible] = useState(false)
    // 新建弹窗
    const [newVisible, setNewVisible] = useState(false)
    // 搜索条件
    const [searchCondition, setSearchCondition] =
        useState<IGetDataDictPageParams>(initSearchCondition)
    // sszd开关
    const [{ governmentSwitch }] = useGeneralConfig()

    useEffect(() => {
        let condition = initSearchCondition
        if (governmentSwitch?.on) {
            condition = { ...condition, query_type: DataDictQueryType.SSZD }
        } else {
            condition = { ...condition, query_type: DataDictQueryType.Product }
        }
        setSearchCondition(condition)
    }, [])

    useUpdateEffect(() => {
        if (searchCondition) {
            getTableList({ ...searchCondition })
        }
    }, [searchCondition])

    // 获取表格数据
    const getTableList = async (params: IGetDataDictPageParams) => {
        try {
            setFetching(true)
            const res = await getDataDictPage(params)
            setTableData(res?.entries || [])
            setTotal(res?.total_count || 0)
        } catch (error) {
            formatError(error)
        } finally {
            setFetching(false)
            setLoading(false)
        }
    }

    const handleDelete = async (record: IDataDictBasicInfo) => {
        confirm({
            title: __('确定要删除数据字典吗？'),
            content: __('删除后该数据字典及数据字典项将无法找回，请谨慎操作！'),
            onOk: async () => {
                if (!record?.id) return
                try {
                    await deleteDataDict(record?.id)
                    message.success(__('删除成功'))
                    getTableList({ ...searchCondition, offset: 1 })
                } catch (error) {
                    formatError(error)
                }
            },
        })
    }

    // 表格操作事件
    const handleOptionTable = (key: string, record) => {
        setOperateItem(record)
        switch (key) {
            case DataDictionaryOperate.Details:
                setDetailsVisible(true)
                break
            case DataDictionaryOperate.Edit:
                setEditVisible(true)
                break

            case DataDictionaryOperate.Delete:
                handleDelete(record)
                break
            default:
                break
        }
    }

    // 表格操作项
    const getTableOptions = () => {
        const optionMenus = [
            {
                key: DataDictionaryOperate.Details,
                label: __('详情'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: DataDictionaryOperate.Edit,
                label: __('编辑'),
                menuType: OptionMenuType.Menu,
            },
            // {
            //     key: DataDictionaryOperate.Delete,
            //     label: __('删除'),
            //     menuType: OptionMenuType.Menu,
            // },
        ]

        return optionMenus
    }

    const columns: any = useMemo(() => {
        const cols = [
            {
                title: __('数据字典名称'),
                dataIndex: 'name',
                key: 'name',
                width: 200,
                ellipsis: true,
                render: (value, record) => (
                    <span
                        title={value}
                        className={styles.columnTitle}
                        onClick={() =>
                            handleOptionTable(
                                DataDictionaryOperate.Details,
                                record,
                            )
                        }
                    >
                        {value}
                    </span>
                ),
            },
            {
                title: __('描述'),
                dataIndex: 'description',
                key: 'description',
                ellipsis: true,
                render: (value) => value || '--',
            },

            {
                title: __('操作'),
                key: 'action',
                width: 120,
                fixed: 'right',
                render: (_, record) => {
                    return (
                        <OptionBarTool
                            menus={getTableOptions() as any[]}
                            onClick={(key, e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleOptionTable(key, record)
                            }}
                        />
                    )
                },
            },
        ]
        return cols
    }, [])

    // 关键字搜索
    const handleKwSearch = (kw) => {
        if (kw === searchCondition?.name) return
        setSearchCondition((prev) => ({
            ...prev,
            name: kw,
            offset: 1,
        }))
    }

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        setSearchCondition((prev: IGetDataDictPageParams) => ({
            ...prev,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            offset: 1,
        }))
    }

    // 刷新
    const handleRefresh = (refresh: boolean = true) => {
        setSearchCondition({
            ...searchCondition,
            offset: refresh ? 1 : searchCondition?.offset,
        })
    }

    // 分页改变
    const onPaginationChange = (page, pageSize) => {
        setSearchCondition((prev) => ({
            ...prev,
            offset: page || 1,
            limit: pageSize,
        }))
    }

    // 顶部右侧操作
    const rightOperate = (
        <div className={styles.topRight}>
            <Space size={8}>
                <SearchInput
                    value={searchCondition?.name}
                    style={{ width: 280 }}
                    placeholder={__('搜索数据字典名称')}
                    onKeyChange={(kw: string) => {
                        handleKwSearch(kw)
                    }}
                    onPressEnter={(
                        e: React.KeyboardEvent<HTMLInputElement>,
                    ) => {
                        handleKwSearch(trim(e.currentTarget.value))
                    }}
                />
                <SortBtn
                    contentNode={
                        <DropDownFilter
                            menus={sortMenus}
                            defaultMenu={defaultMenu}
                            menuChangeCb={handleMenuChange}
                        />
                    }
                />
                <RefreshBtn onClick={handleRefresh} />
            </Space>
        </div>
    )

    return (
        <div className={styles.dataDictionaryContent}>
            {loading ? (
                <Loader />
            ) : (
                <>
                    <div className={styles.dataDictionaryHeader}>
                        {__('数据字典')}
                    </div>
                    {/* <div className={styles.dataDictionaryOperation}>
                        <div className={styles.dataDictionaryTitle}>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    setNewVisible(true)
                                }}
                            >
                                {__('新建')}
                            </Button>
                        </div>
                        {rightOperate}
                    </div> */}
                    <Table
                        columns={columns}
                        dataSource={tableData}
                        loading={fetching}
                        rowKey="id"
                        scroll={{
                            x: columns.length * 180,
                            y: `calc(100vh - 220px)`,
                        }}
                        pagination={{
                            total,
                            pageSize: searchCondition.limit,
                            current: searchCondition.offset,
                            showQuickJumper: true,
                            onChange: onPaginationChange,
                            showSizeChanger: true,
                            showTotal: (count) => __('共${count}条', { count }),
                        }}
                        locale={{
                            emptyText: renderEmpty({
                                desc: __('抱歉，没有找到相关内容'),
                                iconSrc: searchEmpty,
                            }),
                        }}
                    />
                </>
            )}

            {detailsVisible ? (
                <Details
                    open={detailsVisible}
                    item={operateItem}
                    onDetailsClose={() => setDetailsVisible(false)}
                />
            ) : null}

            {editVisible ? (
                <Edit
                    open={editVisible}
                    item={operateItem}
                    onEditSuccess={() => {
                        setEditVisible(false)
                        handleRefresh()
                    }}
                    onEditClose={() => setEditVisible(false)}
                />
            ) : null}

            {newVisible ? (
                <Edit
                    open={newVisible}
                    item={null}
                    onEditClose={() => setNewVisible(false)}
                    onEditSuccess={() => {
                        setNewVisible(false)
                        handleRefresh()
                    }}
                />
            ) : null}
        </div>
    )
}

export default DataDictionary
