import { useAntdTable, useUpdateEffect } from 'ahooks'
import { useNavigate } from 'react-router-dom'
import { Button, Space, Table, Tooltip, message } from 'antd'
import { SortOrder } from 'antd/es/table/interface'
import { isNumber } from 'lodash'
import { useEffect, useState } from 'react'
import empty from '@/assets/dataEmpty.svg'
import {
    formatError,
    getDimensionModels,
    deleteDimensionModel,
    SortDirection,
    SortType,
} from '@/core'
import { AddOutlined } from '@/icons'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import { OptionMenuType, SearchInput, Empty, Loader } from '@/ui'
import { OperateType, formatTime, getActualUrl } from '@/utils'
import DropDownFilter from '../DropDownFilter'

import { DimensionModule, ViewMode, defaultMenu, menus } from './const'
import { labelText } from './helper'
import __ from './locale'
import styles from './styles.module.less'
import OperaionModel from './OperaionModel'
import {
    IDimModelItem,
    IQueryDimModel,
} from '@/core/apis/indicatorManagement/index.d'
import Confirm from '../Confirm'
import AlarmDetail from './AlarmDetail'

const DimensionModel = () => {
    const navigator = useNavigate()
    const [operationVisible, setOperationVisible] = useState(false)
    const [alarmVisible, setAlarmVisible] = useState(false)
    const [delVisible, setDelVisible] = useState(false)
    const [operateType, setOperateType] = useState(OperateType.CREATE)
    const [delBtnLoading, setDelBtnLoading] = useState(false)
    const [operateItem, setOperateItem] = useState<IDimModelItem>()
    const [searchKey, setSearchKey] = useState('')
    const [searchCondition, setSearchCondition] = useState<IQueryDimModel>({
        limit: 10,
        offset: 1,
        sort: defaultMenu.key,
        direction: defaultMenu.sort,
        keyword: '',
    })
    // 表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        name: null,
        created_at: null,
        updated_at: null,
        [defaultMenu.key]:
            defaultMenu.sort === SortDirection.DESC ? 'descend' : 'ascend',
    })

    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)

    // 获取维度模型列表
    const getDimModelListData = async (params) => {
        const { offset, limit, sort, direction, keyword } = params
        try {
            const res: any = await getDimensionModels({
                limit,
                offset,
                sort,
                direction,
                keyword,
            })
            return { total: res.total_count, list: res.entries || [] }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        } finally {
            setSelectedSort(undefined)
        }
    }
    const { tableProps, run, pagination, loading } = useAntdTable(
        getDimModelListData,
        {
            defaultPageSize: 10,
            manual: true,
        },
    )
    useEffect(() => {
        run({ ...searchCondition, current: searchCondition.offset })
    }, [searchCondition])

    useUpdateEffect(() => {
        if (searchKey === searchCondition.keyword) return
        setSearchCondition({
            ...searchCondition,
            keyword: searchKey,
            limit: 24,
            offset: 1,
        })
    }, [searchKey])

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        setSearchCondition({
            ...searchCondition,
            offset: 1,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
        })
        onChangeMenuToTableSort(selectedMenu)
    }

    const onChangeMenuToTableSort = (selectedMenu) => {
        setTableSort({
            name: null,
            created_at: null,
            updated_at: null,
            [selectedMenu.key]:
                selectedMenu.sort === SortDirection.ASC ? 'ascend' : 'descend',
        })
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        if (sorter.column) {
            setTableSort({
                created_at: null,
                updated_at: null,
                name: null,
                [sorter.columnKey]: sorter.order || 'ascend',
            })
            return {
                key: sorter.columnKey,
                sort:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }

        setTableSort({
            created_at: null,
            updated_at: null,
            name: null,
            [sorter.columnKey]:
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

    // 维度模型操作处理
    const handleOperate = async (op: OperateType, item?: IDimModelItem) => {
        setOperateItem(item)
        setOperateType(op)
        switch (op) {
            case OperateType.CREATE:
                setOperationVisible(true)
                break
            case OperateType.BASEEDIT:
                setOperationVisible(true)
                break
            case OperateType.CHANGE:
                setAlarmVisible(true)
                break
            case OperateType.PREVIEW:
                navigator(
                    `/dimensionGraph?dimModelId=${item?.id}&mode=${ViewMode.VIEW}`,
                )
                break
            case OperateType.EDIT:
                navigator(
                    `/dimensionGraph?dimModelId=${item?.id}&mode=${ViewMode.EDIT}`,
                )
                break
            case OperateType.DELETE:
                setDelVisible(true)
                break
            default:
                break
        }
    }

    // 删除维度模型
    const handleDelete = async () => {
        try {
            setDelBtnLoading(true)
            if (!operateItem) return
            await deleteDimensionModel(operateItem.id)
            setDelBtnLoading(false)
            message.success(__('删除成功'))
            setSearchCondition((prev) => ({
                ...prev,
                offset:
                    tableProps.dataSource?.length === 1 &&
                    tableProps.pagination.current !== 1
                        ? (prev.offset ?? 1) - 1
                        : prev.offset,
            }))
        } catch (error) {
            formatError(error)
        } finally {
            setDelBtnLoading(false)
            setDelVisible(false)
        }
    }

    // 新建/编辑 维度模型
    const handleCreateEdit = (item) => {
        setSearchCondition({
            ...searchCondition,
            offset:
                operateType === OperateType.CREATE ? 1 : searchCondition.offset,
        })
        if (item && operateType === OperateType.CREATE) {
            navigator(
                `/dimensionGraph?item=${encodeURIComponent(
                    JSON.stringify(item),
                )}&mode=${ViewMode.EDIT}`,
            )
        }
    }

    // 空库表
    const renderEmpty = () => {
        const createView = <Empty desc={__('暂无数据')} iconSrc={empty} />
        return searchKey ? <Empty /> : createView
    }

    // 列表项
    const columns: any = [
        {
            title: __('维度模型名称'),
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            sortOrder: tableSort.name,
            showSorterTooltip: false,
            render: (value, record) => (
                <div
                    className={styles.dimModelName}
                    title={labelText(value) as any}
                    onClick={() => handleOperate(OperateType.PREVIEW, record)}
                >
                    <span>{labelText(value)}</span>
                </div>
            ),
            ellipsis: true,
        },
        {
            title: __('描述'),
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (value) => labelText(value, __('暂无描述')),
        },
        {
            title: __('维度模式'),
            dataIndex: 'dim_module',
            key: 'dim_module',
            ellipsis: true,
            render: (_, record) =>
                DimensionModule.find((o) => o?.value === record?.dim_module)
                    ?.label || '--',
        },
        {
            title: __('创建时间'),
            dataIndex: 'created_at',
            key: 'created_at',
            width: 180,
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.created_at,
            showSorterTooltip: false,
            render: (value) => {
                return isNumber(value) ? formatTime(value) : '--'
            },
        },
        {
            title: __('更新人'),
            dataIndex: 'updater_name',
            key: 'updater_name',
            ellipsis: true,
            render: (value) => labelText(value),
        },
        {
            title: __('更新时间'),
            dataIndex: 'updated_at',
            key: 'updated_at',
            width: 180,
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.updated_at,
            showSorterTooltip: false,
            render: (value) => {
                return isNumber(value) ? formatTime(value) : '--'
            },
        },
        {
            title: __('操作'),
            key: 'action',
            width: 240,
            fixed: 'right',
            render: (_, record) => {
                const menuList = [
                    {
                        key: OperateType.EDIT,
                        label: __('编辑'),
                        menuType: OptionMenuType.Menu,
                    },
                    {
                        key: OperateType.BASEEDIT,
                        label: __('基本信息'),
                        menuType: OptionMenuType.Menu,
                    },
                    {
                        key: OperateType.CHANGE,
                        label: __('异常告警'),
                        menuType: OptionMenuType.Menu,
                    },
                    {
                        key: OperateType.DELETE,
                        label: __('删除'),
                        menuType: OptionMenuType.Menu,
                        disabled: record?.refer_count !== 0,
                        tips: __('模型被指标引用，暂不可删除'),
                    },
                ]
                return (
                    <Space size={12} className={styles.optionBtnGroup}>
                        {menuList.map((item) =>
                            item.disabled ? (
                                <Tooltip
                                    placement="topRight"
                                    key={item.key}
                                    title={
                                        item.disabled ? item.tips : undefined
                                    }
                                >
                                    <Button
                                        type="link"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            handleOperate(
                                                item.key as OperateType,
                                                record,
                                            )
                                        }}
                                        disabled
                                    >
                                        {item.label}
                                    </Button>
                                </Tooltip>
                            ) : (
                                <Button
                                    key={item.key}
                                    type="link"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleOperate(
                                            item.key as OperateType,
                                            record,
                                        )
                                    }}
                                >
                                    {item.label}
                                </Button>
                            ),
                        )}
                    </Space>
                )
            },
        },
    ]

    return (
        <div className={styles.dimensionModelWrapper}>
            <div className={styles.top}>
                <div className={styles.topLeft}>
                    <div className={styles.titleWrap}>{__('维度模型')}</div>
                    <Button
                        type="primary"
                        icon={<AddOutlined />}
                        onClick={() => handleOperate(OperateType.CREATE)}
                    >
                        {__('新建维度模型')}
                    </Button>
                </div>
                <Space
                    size={12}
                    className={styles.topRight}
                    style={{
                        visibility:
                            !searchKey && tableProps.dataSource.length === 0
                                ? 'hidden'
                                : 'visible',
                    }}
                >
                    <SearchInput
                        style={{ width: 272 }}
                        placeholder={__('搜索维度模型名称')}
                        onKeyChange={(kw: string) => {
                            setSearchCondition({
                                ...searchCondition,
                                offset: 1,
                                keyword: kw,
                            })
                            setSearchKey(kw)
                        }}
                        onPressEnter={(e: any) =>
                            setSearchCondition({
                                ...searchCondition,
                                offset: 1,
                                keyword: e.target.value,
                            })
                        }
                    />
                    <Space size={0}>
                        <SortBtn
                            contentNode={
                                <DropDownFilter
                                    menus={menus}
                                    defaultMenu={defaultMenu}
                                    menuChangeCb={handleMenuChange}
                                    changeMenu={selectedSort}
                                />
                            }
                        />
                        <RefreshBtn
                            onClick={() =>
                                setSearchCondition({
                                    ...searchCondition,
                                    offset: 1,
                                })
                            }
                        />
                    </Space>
                </Space>
            </div>
            {tableProps.dataSource.length ||
            !!searchKey ||
            (!tableProps.dataSource.length &&
                tableProps.pagination.current !== 1) ? (
                <Table
                    columns={columns}
                    {...tableProps}
                    rowKey="id"
                    scroll={{
                        x: 1340,
                        y:
                            tableProps.dataSource.length === 0
                                ? undefined
                                : `calc(100vh - 278px)`,
                    }}
                    loading={loading ? { tip: __('加载中...') } : false}
                    pagination={{
                        ...tableProps.pagination,
                        showSizeChanger: false,
                        hideOnSinglePage: true,
                    }}
                    bordered={false}
                    locale={{
                        emptyText: <Empty />,
                    }}
                    onChange={(newPagination, filters, sorter) => {
                        const selectedMenu = handleTableChange(sorter)
                        setSelectedSort(selectedMenu)
                        setSearchCondition((prev) => ({
                            ...prev,
                            sort: selectedMenu.key,
                            direction: selectedMenu.sort,
                            offset: newPagination.current,
                        }))
                    }}
                />
            ) : loading ? (
                <Loader />
            ) : (
                <div className={styles.emptyWrapper}>{renderEmpty()}</div>
            )}
            <Confirm
                open={delVisible}
                title={__('确认要删除维度模型吗?')}
                content={__('删除后该维度模型将无法找回，请谨慎操作!')}
                onOk={handleDelete}
                onCancel={() => {
                    setDelVisible(false)
                }}
                width={432}
                okButtonProps={{ loading: delBtnLoading }}
            />
            <OperaionModel
                visible={operationVisible}
                item={operateItem}
                operate={operateType as OperateType}
                onClose={() => {
                    setOperationVisible(false)
                    setOperateItem(undefined)
                }}
                onSure={(info) => handleCreateEdit(info)}
            />
            <AlarmDetail
                open={alarmVisible}
                id={operateItem?.id as string}
                onClose={() => {
                    setAlarmVisible(false)
                    setOperateItem(undefined)
                }}
            />
        </div>
    )
}

export default DimensionModel
