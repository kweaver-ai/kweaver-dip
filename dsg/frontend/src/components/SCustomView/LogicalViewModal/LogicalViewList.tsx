import { memo, useEffect, useState, useContext } from 'react'
import { List, Space, Pagination, Checkbox, Tooltip, message } from 'antd'
import { useUpdateEffect } from 'ahooks'
import classnames from 'classnames'
import { filter, find } from 'lodash'
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
import Empty from '@/ui/Empty'
import { DatasheetViewColored } from '@/icons'
import { DsType, defaultMenu } from '@/components/DatasheetView/const'
import { CustomViewContext } from '../CustomViewRedux'

const ListItem = ({
    item,
    checked,
    onChecked,
    dataViewLists,
}: {
    item: any
    checked: boolean
    onChecked: (checked) => void
    dataViewLists: []
}) => {
    const isExist =
        filter(dataViewLists, (dataView: any) => dataView.id === item.id)
            .length > 0
    return (
        <div
            className={classnames({
                [styles['lv-item']]: true,
                [styles['is-checked']]: checked,
                [styles['is-disabled']]: isExist,
            })}
            onClick={() => !isExist && onChecked(!checked)}
        >
            <Tooltip
                placement="top"
                title={isExist ? __('已添加过此库表') : ''}
            >
                <Checkbox
                    checked={isExist ? true : checked}
                    disabled={isExist}
                    onChange={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        onChecked(e.target.checked)
                    }}
                />
            </Tooltip>
            <div className={styles.icon}>
                <DatasheetViewColored />
            </div>
            <div className={styles.title}>
                <div
                    title={`${item?.business_name}`}
                    className={styles['title-name']}
                >
                    {`${item?.business_name}`}
                </div>
                <div className={styles['title-code']}>
                    {__('编码')}: {item?.uniform_catalog_code}
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    {__('技术名称')}: {item?.technical_name}
                </div>
            </div>
        </div>
    )
}

const LogicalViewList = (props: any) => {
    const { condition, dataType, checkItems, setCheckItems } = props
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
    const { data: contextData, dispatch } = useContext(CustomViewContext)
    const { dataViewLists } = contextData.toJS()

    useEffect(() => {
        if (
            !(
                dataType !== undefined &&
                [DsType.all, DsType.datasourceType].includes(dataType)
            ) &&
            searchCondition.sort === 'type'
        ) {
            setSearchCondition((prev) => ({
                ...prev,
                sort: defaultMenu.key,
                direction: defaultMenu.sort,
            }))
            return
        }
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
            const res = await getDatasheetView(params)
            setListData(res?.entries || [])
            setTotal(res?.total_count || 0)
        } catch (error) {
            formatError(error)
            setListData([])
            setTotal(0)
        } finally {
            setLoading(false)
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

    const handleChangeCheckbox = (checked, curr) => {
        const currItem = {
            ...curr,
        }
        let newCheckItems: any = []
        if (checked) {
            const tmp = [...checkItems, currItem]
            newCheckItems = tmp.reduce((acc, current: any) => {
                const exists = acc.some((item: any) => item.id === current.id)
                if (!exists) {
                    return [...acc, current]
                }
                return acc
            }, [])
        } else {
            newCheckItems = checkItems.filter(
                (checkItem) => checkItem.id !== currItem.id,
            )
        }
        if (newCheckItems.length > 20) {
            message.info({
                content: '一次最多可选择20个，请分批添加',
                style: { zIndex: 2000 },
            })
            return
        }
        setCheckItems(newCheckItems)
    }

    return (
        <div className={styles['lv-list']}>
            <h4 className={styles['lv-list-title']}>{__('库表')}</h4>
            <Space
                size={12}
                className={styles['lv-list-top']}
                hidden={total === 0 && !searchCondition.keyword}
            >
                <SearchInput
                    style={{ width: 478 }}
                    placeholder={__('搜索库表名称、编码')}
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
                                    onChecked={(val) =>
                                        handleChangeCheckbox(val, item)
                                    }
                                    checked={
                                        !!find(checkItems, (o) => {
                                            return o.id === item.id
                                        })
                                    }
                                    dataViewLists={dataViewLists}
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
