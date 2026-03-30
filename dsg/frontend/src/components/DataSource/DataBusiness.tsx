import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button, List, Pagination, Space } from 'antd'
import { SortOrder } from 'antd/lib/table/interface'
import { useDebounce, useSize, useUpdateEffect } from 'ahooks'
import { trim } from 'lodash'
import moment from 'moment'
import classnames from 'classnames'
import { getPlatformNumber, OperateType } from '@/utils'
import DropDownFilter from '../DropDownFilter'
import { defaultMenu, menus } from './const'
import {
    formatError,
    getConnectorIcon,
    getDataSourceList,
    ICoreBusinessItem,
    LoginPlatform,
    SortDirection,
} from '@/core'
import CreatDataBusiness from './CreatDataBusiness'
import DataBusinessCard from './DataBusinessCard'
import styles from './styles.module.less'
import { AddOutlined, FiltersOutlined } from '@/icons'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import Loader from '@/ui/Loader'
import { filterConditionList } from './helper'
import __ from './locale'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import {
    LightweightSearch,
    SearchInput,
    ListPagination,
    ListType,
    ListDefaultPageSize,
} from '@/ui'
import { disabledDate, stampFormatToDate } from '../MyAssets/helper'
import { auditStateList } from '../ResourcesDir/const'
import Details from './Details'
import { databaseTypesEleData } from '@/core/dataSource'
import { IformItem } from '@/ui/LightweightSearch/const'
import TableModel from './TableModel'

interface ICoreBusinessesParams {
    direction?: SortDirection
    keyword?: string
    limit?: number
    offset?: number
    type?: string
    source_type?: string
    sort?: string
    org_code?: string
}
interface ICoreBusiness {
    selectedSysId: string
    selectedDepartmentId: string
}

const initSearchCondition = {
    // limit: ListDefaultPageSize[ListType.CardList],
    offset: 1,
    keyword: '',
    type: '',
    source_type: '',
    direction: defaultMenu.sort,
    sort: defaultMenu.key,
}

const DataBusiness: React.FC<ICoreBusiness> = ({
    selectedSysId,
    selectedDepartmentId,
}) => {
    const [visible, setVisible] = useState(false)
    const [operateType, setOperateType] = useState(OperateType.CREATE)
    const [keyword, setKeyword] = useState('')
    const [direction, setDirection] = useState<SortDirection>(
        SortDirection.DESC,
    )
    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)
    const [coreBusinessList, setCoreBusinessList] = useState<
        ICoreBusinessItem[]
    >([])
    const [total, setTotal] = useState(0)
    const [searchCondition, setSearchCondition] =
        useState<ICoreBusinessesParams>(initSearchCondition)
    const [loading, setLoading] = useState(false)
    const [editId, setEditId] = useState<string>()
    const platform = getPlatformNumber()
    // const [supDataSource, setSupDataSource] = useState<
    //     { name: string; value: string }[]
    // >([])
    // const [dataSourceIconMap, setDataSourceIconMap] = useState<object>({})
    const ref = useRef<HTMLDivElement>(null)
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        name: 'ascend',
    })

    // 筛选条件筛选
    const [isSearch, setIsSearch] = useState<boolean>(false)

    const [filterConditionData, setFilterConditionData] = useState<
        Array<IformItem>
    >([])

    useEffect(() => {
        getFilterConditionData()
    }, [])

    useEffect(() => {
        // 使用函数式更新确保保留所有现有字段
        setSearchCondition((prev) => ({
            ...prev,
            limit: 10,
        }))
    }, [platform])

    useEffect(() => {
        getCoreBusinessList()
        setIsSearch(
            !!searchCondition.keyword ||
                !!searchCondition.type ||
                !!searchCondition.source_type,
        )
    }, [searchCondition])

    useEffect(() => {
        // getCoreBusinessList()
        setSearchCondition((prev) => ({
            ...prev,
            offset: 1,
        }))
    }, [selectedSysId])

    useUpdateEffect(() => {
        if (keyword === searchCondition.keyword) return
        setSearchCondition((prev) => ({
            ...prev,
            keyword,
            offset: 1,
        }))
    }, [keyword])

    useEffect(() => {
        setSearchCondition((prev) => ({
            ...prev,
            org_code: selectedDepartmentId || undefined,
        }))
    }, [selectedDepartmentId])

    // 根据数据源名获取对应图标
    // const getDataSourceIcon = async (connectorName: string) => {
    //     try {
    //         const res = await getConnectorIcon(connectorName)
    //         setDataSourceIconMap({ ...dataSourceIconMap, [connectorName]: res })
    //     } catch (error) {
    //         formatError(error)
    //     }
    // }

    // useEffect(() => {
    //     getSupportDataSource()
    // }, [])

    // useUpdateEffect(() => {
    //     supDataSource.forEach((ds) => {
    //         if (!dataSourceIconMap[ds.value]) {
    //             getDataSourceIcon(ds.value)
    //         }
    //     })
    // }, [supDataSource])

    // 获取数据源列表
    const getCoreBusinessList = async () => {
        try {
            setLoading(true)
            const res = await getDataSourceList({
                ...searchCondition,
                keyword,
                info_system_id: selectedSysId,
            })
            setCoreBusinessList(res.entries || [])
            setTotal(res.total_count)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
            setSelectedSort(undefined)
        }
    }
    // 列表大小
    const size = useSize(ref)
    const col = useMemo(() => {
        const refOffsetWidth = ref?.current?.offsetWidth || size?.width || 0
        return refOffsetWidth >= 1272
            ? 4
            : refOffsetWidth >= 948
            ? 3
            : undefined
    }, [size?.width])

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        setSearchCondition((prev) => ({
            ...prev,
            direction: selectedMenu.sort || SortDirection.DESC,
            sort: selectedMenu.key,
        }))
        setSelectedSort(selectedMenu)
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
    const handleOperate = (type: OperateType, id?: string) => {
        setOperateType(type)
        setVisible(true)
        setEditId(id)
    }
    const onCreateSuccess = () => {
        setVisible(false)
        setSearchCondition((prev) => ({ ...prev }))
    }
    const onDeleteSuccess = () => {
        setSearchCondition((prev) => ({
            ...prev,
            offset:
                coreBusinessList.length === 1
                    ? (prev.offset || 1) - 1 || 1
                    : prev.offset,
        }))
    }
    const handlePageChange = (offset: number, limit: number) => {
        setSearchCondition((prev) => ({ ...prev, offset, limit }))
    }
    const renderEmpty = () => {
        // 未搜索 没数据
        if (total === 0 && !searchCondition.keyword && !isSearch) {
            return <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
        }
        if (total === 0 && (searchCondition.keyword || isSearch)) {
            return <Empty />
        }
        return null
    }

    const searchChange = (data, dataKey) => {
        // 清空筛选
        setSearchCondition((prev) => ({
            ...prev,
            offset: 1,
            ...data,
        }))
    }

    const getFilterConditionData = async () => {
        await databaseTypesEleData.handleUpdateDataBaseTypes()
        setFilterConditionData(
            filterConditionList.map((currentData) =>
                currentData.key === 'type'
                    ? {
                          ...currentData,
                          options: [
                              ...currentData.options,
                              ...databaseTypesEleData.dataTypes.map(
                                  (currentTypes) => ({
                                      value: currentTypes.olkConnectorName,
                                      label: currentTypes.showConnectorName,
                                  }),
                              ),
                          ],
                      }
                    : currentData,
            ),
        )
    }

    const listType = useMemo(() => {
        return platform === LoginPlatform.default
            ? ListType.CardList
            : ListType.WideList
    }, [platform])

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

    return (
        <div className={styles.coreBusinessWrapper} ref={ref}>
            <div className={styles.top}>
                <div className={styles.title}>{__('数据源')}</div>
                {/* <Button
                    type="primary"
                    icon={<AddOutlined />}
                    onClick={() => handleOperate(OperateType.CREATE)}
                    style={{
                        marginTop: '16px',
                        visibility: 'visible',
                    }}
                >
                    {__('添加数据源')}
                </Button> */}
                {/* 初始条件无数据时 */}
                {total === 0 &&
                !searchCondition.keyword &&
                !searchCondition.type &&
                !searchCondition.source_type ? null : (
                    <Space>
                        <Button
                            type="link"
                            onClick={() =>
                                window.open('/studio/mmdl/data-connect')
                            }
                        >
                            {__('添加/管理数据源')}
                        </Button>
                        <SearchInput
                            className={styles.nameInput}
                            style={{ width: 300 }}
                            placeholder={__('搜索数据源、数据库名称')}
                            onKeyChange={(kw: string) => setKeyword(kw)}
                        />
                        <LightweightSearch
                            formData={filterConditionData}
                            onChange={(data, key) => searchChange(data, key)}
                            defaultValue={{ source_type: '', type: '' }}
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
                            <RefreshBtn onClick={() => getCoreBusinessList()} />
                        </Space>
                    </Space>
                )}
            </div>
            {loading ? (
                <Loader />
            ) : total > 0 ? (
                <div className={styles.bottom} ref={ref}>
                    {/* {platform === LoginPlatform.default ? (
                        <div className={styles.listWrapper}>
                            <List
                                grid={{
                                    gutter: 24,
                                    column: col,
                                }}
                                dataSource={coreBusinessList}
                                renderItem={(item) => (
                                    <List.Item
                                        style={{
                                            maxWidth: col
                                                ? (size?.width ||
                                                      0 - (col - 1) * 24) / col
                                                : undefined,
                                        }}
                                    >
                                        <DataBusinessCard
                                            item={item}
                                            handleOperate={handleOperate}
                                            onDeleteSuccess={onDeleteSuccess}
                                        />
                                    </List.Item>
                                )}
                                className={styles.list}
                                locale={{
                                    emptyText: (
                                        <Empty
                                            desc={__('暂无数据')}
                                            iconSrc={dataEmpty}
                                        />
                                    ),
                                }}
                            />
                        </div>
                    ) : ( */}
                    <TableModel
                        dataSource={coreBusinessList}
                        onOperate={(type, record) =>
                            handleOperate(type, record.id)
                        }
                        onDeleteSuccess={onDeleteSuccess}
                        tableSort={tableSort}
                        totalCount={total}
                        searchCondition={searchCondition}
                        handleTableChange={(newPagination, filters, sorter) => {
                            const selectedMenu = handleTableChange(sorter)
                            setSelectedSort(selectedMenu)
                            setSearchCondition((prev) => ({
                                ...prev,
                                sort: selectedMenu.key,
                                direction: selectedMenu.sort,
                                offset: newPagination.current || 1,
                                limit: newPagination.pageSize || 10,
                            }))
                        }}
                    />
                    {/* )} */}

                    {/* {searchCondition?.limit && (
                        <ListPagination
                            listType={listType}
                            queryParams={searchCondition}
                            totalCount={total}
                            onChange={handlePageChange}
                        />
                    )} */}
                </div>
            ) : (
                <div className={styles.emptyWrapper}>{renderEmpty()}</div>
            )}

            <CreatDataBusiness
                visible={visible}
                operateType={operateType}
                onClose={() => setVisible(false)}
                onSuccess={onCreateSuccess}
                editId={editId}
                departmentId={selectedDepartmentId}
                // infoSystemId={selectedSysId}
            />
        </div>
    )
}

export default DataBusiness
