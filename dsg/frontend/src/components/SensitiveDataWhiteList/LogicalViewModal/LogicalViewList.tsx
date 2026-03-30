import { memo, useEffect, useState } from 'react'
import { List, Space, Pagination, Tooltip } from 'antd'
import { useUpdateEffect } from 'ahooks'
import classnames from 'classnames'
import { find } from 'lodash'
import {
    formatError,
    getDatasheetView,
    getWhiteListRelateFormView,
    getDataPrivacyPolicyRelateFormView,
} from '@/core'
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
import LogicViewDetail from '@/components/DataAssetsCatlg/LogicViewDetail'

const ListItem = ({
    item,
    checked,
    onChecked,
    onView,
    dataViewLists,
}: {
    item: any
    checked: boolean
    onChecked: (checked) => void
    onView: () => void
    dataViewLists: []
}) => {
    const { disabled } = item
    return (
        <Tooltip title={disabled ? __('当前库表已存在策略，不能重复创建') : ''}>
            <div
                className={classnames({
                    [styles['lv-item']]: true,
                    [styles['is-checked']]: checked,
                    [styles['is-disabled']]: disabled,
                })}
                onClick={() => !disabled && onChecked(!checked)}
            >
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
                        <span title={item?.technical_name}>
                            {__('技术名称')}: {item?.technical_name}
                        </span>
                    </div>
                </div>
                <a
                    onClick={(e) => {
                        e.stopPropagation()
                        onView()
                    }}
                >
                    {__('查看')}
                </a>
            </div>
        </Tooltip>
    )
}

const LogicalViewList = (props: any) => {
    const {
        condition,
        dataType,
        checkItems,
        setCheckItems,
        isRelateWhiteList = false,
        isRelatePrivacyData = false,
    } = props
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
    const [dataViewDetailsOpen, setDataViewDetailsOpen] =
        useState<boolean>(false)
    const [currentDataView, setCurrentDataView] = useState<any>({})

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
            let disabledIds: string[] = []
            if (isRelateWhiteList) {
                const releteRes = await getWhiteListRelateFormView({
                    form_view_ids: res?.entries?.map((item) => item.id),
                })
                disabledIds = releteRes?.entries?.map(
                    (item) => item.form_view_id,
                )
            }
            if (isRelatePrivacyData) {
                const releteRes = await getDataPrivacyPolicyRelateFormView({
                    form_view_ids: res?.entries?.map((item) => item.id),
                })
                disabledIds = releteRes?.form_view_ids
            }
            const list = res?.entries?.map((item) => ({
                ...item,
                disabled: disabledIds?.includes(item?.id || ''),
            }))
            setListData(list || [])
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
            newCheckItems = [currItem]
        } else {
            newCheckItems = checkItems.filter(
                (checkItem) => checkItem.id !== currItem.id,
            )
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
                                    onView={() => {
                                        setCurrentDataView(item)
                                        setDataViewDetailsOpen(true)
                                    }}
                                    checked={
                                        !!find(checkItems, (o) => {
                                            return o.id === item.id
                                        })
                                    }
                                    dataViewLists={[]}
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
                    className={styles['lv-list-bottom-page']}
                />
            </div>
            {dataViewDetailsOpen && (
                <LogicViewDetail
                    open={dataViewDetailsOpen}
                    onClose={() => {
                        setDataViewDetailsOpen(false)
                    }}
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                        top: 0,
                    }}
                    id={currentDataView?.id}
                    // isIntroduced
                    isAudit
                    showDataConsanguinity={false}
                />
            )}
        </div>
    )
}

export default memo(LogicalViewList)
