import React, { memo, useEffect, useState } from 'react'
import { List, Space, Pagination } from 'antd'
import { useUpdateEffect } from 'ahooks'
import classnames from 'classnames'
import { CheckOutlined } from '@ant-design/icons'
import { formatError, getDatasheetView } from '@/core'
import { getIndicatorListByType } from '@/core/apis/indicatorManagement'
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
import Icons from '../Icons'
import { FormulaType } from '../const'
import { defaultMenu, menus } from './const'

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
                [styles['at-item']]: true,
                [styles['is-checked']]: checked,
            })}
            onClick={() => !checked && onChecked?.()}
        >
            <div className={styles['at-item-icon']}>
                <Icons type={FormulaType.ATOM} colored fontSize={20} />
            </div>
            <div className={styles['at-item-title']}>
                <div
                    title={item?.name}
                    className={styles['at-item-title-name']}
                >
                    {item?.name}
                </div>
                <div className={styles['at-item-title-code']}>
                    <span title={item?.code}>{item?.code}</span>
                </div>
            </div>

            {checked && (
                <div className={styles['at-item-checkIcon']}>
                    <CheckOutlined />
                </div>
            )}
        </div>
    )
}

const AtomList = ({
    condition,
    checkedId,
    onChecked,
}: {
    condition?: any
    checkedId?: string
    onChecked: (val) => void
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
        getListData({ ...searchCondition, ...condition })
    }, [searchCondition, condition])

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
            const res = await getIndicatorListByType({
                ...params,
                indicator_type: 'atomic',
            })
            setListData(res?.entries || [])
            setTotal(res?.count || 0)
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
        <div className={styles['at-list']}>
            <Space
                size={12}
                className={styles['at-list-top']}
                hidden={total === 0 && !searchCondition.keyword}
            >
                <SearchInput
                    style={{ width: 282 }}
                    placeholder={__('搜索指标名称、编码')}
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
                                menus={menus}
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
            <div className={styles['at-list-bottom']}>
                <div className={styles['at-list-bottom-content']}>
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
                    hideOnSinglePage
                    pageSizeOptions={ListPageSizerOptions[ListType.NarrowList]}
                    size="small"
                    className={styles['at-list-bottom-page']}
                />
            </div>
        </div>
    )
}

export default memo(AtomList)
