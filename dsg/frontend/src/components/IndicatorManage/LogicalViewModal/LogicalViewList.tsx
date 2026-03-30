import React, { memo, useEffect, useState } from 'react'
import { List, Space, Pagination } from 'antd'
import { useUpdateEffect } from 'ahooks'
import classnames from 'classnames'
import { CheckOutlined } from '@ant-design/icons'
import { formatError, getDatasheetView } from '@/core'
import styles from './styles.module.less'
import dataEmpty from '@/assets/dataEmpty.svg'
import __ from './locale'
import {
    ListDefaultPageSize,
    ListPageSizerOptions,
    ListType,
    SearchInput,
} from '@/ui'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import DropDownFilter from '@/components/DropDownFilter'
import Empty from '@/ui/Empty'
import { DatasheetViewColored } from '@/icons'
import { DsType, defaultMenu, menus } from '@/components/DatasheetView/const'

const ListItem = ({
    item,
    checked,
    onChecked,
}: {
    item: any
    checked: boolean
    onChecked: () => void
}) => {
    return (
        <div
            className={classnames({
                [styles['lv-item']]: true,
                [styles['is-checked']]: checked,
            })}
            onClick={() => !checked && onChecked?.()}
        >
            <div className={styles['lv-item-icon']}>
                <DatasheetViewColored />
            </div>
            <div className={styles['lv-item-title']}>
                <div
                    title={item?.business_name}
                    className={styles['lv-item-title-name']}
                >
                    {item?.business_name}
                </div>
                <div className={styles['lv-item-title-code']}>
                    <span title={item?.uniform_catalog_code}>
                        {`${__('编码')}：${item?.uniform_catalog_code}`}
                    </span>
                    <span title={item?.technical_name}>
                        {`${__('技术名称')}：${item?.technical_name}`}
                    </span>
                </div>
            </div>

            {checked && (
                <div className={styles['lv-item-checkIcon']}>
                    <CheckOutlined />
                </div>
            )}
        </div>
    )
}

const LogicalViewList = ({
    condition,
    checkedId,
    onChecked,
    dataType,
}: {
    condition?: any
    checkedId?: string
    onChecked: (val) => void
    dataType?: DsType
}) => {
    const [loading, setLoading] = useState(false)
    const [keyword, setKeyword] = useState('')
    const [listData, setListData] = useState<any[]>([])
    const [total, setTotal] = useState(0)
    const [searchCondition, setSearchCondition] = useState<any>({
        limit: ListDefaultPageSize[ListType.NarrowList],
        offset: 1,
        sort: defaultMenu.key,
        direction: defaultMenu.sort,
        keyword,
        publish_status: 'publish',
    })
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)

    useEffect(() => {
        if (
            !(
                dataType !== undefined &&
                [DsType.all, DsType.datasourceType].includes(dataType)
            ) &&
            searchCondition.sort === 'type'
        ) {
            setSelectedSort(defaultMenu)
            setSearchCondition((prev) => ({
                ...prev,
                sort: defaultMenu.key,
                direction: defaultMenu.sort,
            }))
            return
        }
        getListData({ ...searchCondition, ...condition })
    }, [searchCondition])

    useUpdateEffect(() => {
        setSearchCondition((prev) => ({
            ...prev,
            offset: 1,
        }))
    }, [condition])
    useUpdateEffect(() => {
        if (keyword === searchCondition.keyword) return
        setSearchCondition((prev) => ({
            ...prev,
            keyword,
            offset: 1,
        }))
    }, [keyword])

    const getListData = async (params) => {
        try {
            setLoading(true)
            const res = await getDatasheetView(params)
            setListData(res?.entries || [])
            setTotal(res?.total_count || 0)
        } catch (error) {
            formatError(error)
            setListData([])
            setTotal(0)
        } finally {
            setLoading(false)
            setSelectedSort(undefined)
        }
    }

    // 空库表
    const renderEmpty = () => {
        // 未搜索 没数据
        if (total === 0 && !searchCondition.keyword) {
            return <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
        }
        if (total === 0 && searchCondition.keyword) {
            return <Empty />
        }
        return null
    }

    return (
        <div className={styles['lv-list']}>
            <Space
                size={12}
                className={styles['lv-list-top']}
                hidden={total === 0 && !searchCondition.keyword}
            >
                <SearchInput
                    style={{ width: 282 }}
                    placeholder={__('搜索库表业务名称、技术名称、编码')}
                    onKeyChange={(kw: string) => {
                        setSearchCondition((prev) => ({
                            ...prev,
                            offset: 1,
                            keyword: kw,
                        }))
                        setKeyword(kw)
                    }}
                    onPressEnter={(e: any) =>
                        setSearchCondition((prev) => ({
                            ...prev,
                            offset: 1,
                            keyword: e.target.value,
                        }))
                    }
                />
                <Space size={0}>
                    <SortBtn
                        contentNode={
                            <DropDownFilter
                                menus={
                                    dataType !== undefined &&
                                    [
                                        DsType.all,
                                        DsType.datasourceType,
                                    ].includes(dataType)
                                        ? menus
                                        : menus.filter(
                                              (item) => item.key !== 'type',
                                          )
                                }
                                defaultMenu={defaultMenu}
                                menuChangeCb={(selectedMenu) =>
                                    setSearchCondition((prev) => ({
                                        ...prev,
                                        offset: 1,
                                        sort: selectedMenu.key,
                                        direction: selectedMenu.sort,
                                    }))
                                }
                                changeMenu={selectedSort}
                            />
                        }
                    />
                    <RefreshBtn
                        onClick={() =>
                            setSearchCondition((prev) => ({
                                ...prev,
                                offset: 1,
                            }))
                        }
                    />
                </Space>
            </Space>
            <div className={styles['lv-list-bottom']}>
                <div className={styles['lv-list-bottom-content']}>
                    <List
                        split={false}
                        dataSource={listData}
                        renderItem={(item) => (
                            <List.Item>
                                <ListItem
                                    item={item}
                                    checked={item.id === checkedId}
                                    onChecked={() => onChecked(item)}
                                />
                            </List.Item>
                        )}
                        loading={loading}
                        locale={{
                            emptyText: (
                                <div style={{ marginTop: 56 }}>
                                    {renderEmpty()}
                                </div>
                            ),
                        }}
                    />
                </div>
                <Pagination
                    current={searchCondition.offset}
                    pageSize={searchCondition.limit}
                    onChange={(page, pageSize) =>
                        setSearchCondition((prev) => ({
                            ...prev,
                            offset: page,
                            limit: pageSize,
                        }))
                    }
                    total={total}
                    showSizeChanger={false}
                    // showSizeChanger={
                    //     total > ListDefaultPageSize[ListType.NarrowList]
                    // }
                    // showQuickJumper={total > searchCondition.limit * 8}
                    hideOnSinglePage
                    pageSizeOptions={ListPageSizerOptions[ListType.NarrowList]}
                    size="small"
                    className={styles['lv-list-bottom-page']}
                />
            </div>
        </div>
    )
}

export default memo(LogicalViewList)
