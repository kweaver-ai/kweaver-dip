import { memo, useEffect, useState } from 'react'
import {
    List,
    Space,
    Pagination,
    Checkbox,
    Tooltip,
    message,
    Button,
    Breadcrumb,
} from 'antd'
import { useUpdateEffect } from 'ahooks'
import classnames from 'classnames'
import { filter, find } from 'lodash'
import { formatError, getUserDatasheetViewAll } from '@/core'
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
import FieldList from '../DimensionModel/components/ChooseBizTable/FieldList'

const ListItem = ({
    item,
    checked,
    onChecked,
    dataViewLists,
    handlePreview,
}: {
    item: any
    checked: boolean
    onChecked: (checked) => void
    dataViewLists: []
    handlePreview: (id: string) => void
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
                    <span
                        title={item?.uniform_catalog_code}
                        style={{ marginRight: 16 }}
                    >
                        {__('编码')}: {item?.uniform_catalog_code}
                    </span>
                    <span title={item?.technical_name}>
                        {__('技术名称')}: {item?.technical_name}
                    </span>
                </div>
            </div>
            <div className={styles.btn}>
                <Button type="link" onClick={() => handlePreview(item.id)}>
                    {__('预览')}
                </Button>
            </div>
        </div>
    )
}

const LogicalViewList = (props: any) => {
    const {
        condition,
        dataType,
        checkItems,
        setCheckItems,
        dataViewLists = [],
    } = props
    const [previewId, setPreviewId] = useState<string>()
    const [loading, setLoading] = useState(false)
    const [keyword, setKeyword] = useState('')
    const [listData, setListData] = useState<any[]>([])
    const [total, setTotal] = useState(0)
    const [searchCondition, setSearchCondition] = useState<any>({
        limit: ListDefaultPageSize[ListType.NarrowList],
        offset: 1,
        keyword,
        publish_status: 'publish',
    })

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
            const res = await getUserDatasheetViewAll({ ...params })
            setListData(res?.entries ?? [])
            setTotal(res?.total_count ?? 0)
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

    const handlePreview = (id: string) => {
        setPreviewId(id)
    }

    const breadCrumb = (
        <Breadcrumb>
            <Breadcrumb.Item
                className={styles.breadcrumb}
                key="view"
                onClick={() => {
                    setPreviewId(undefined)
                }}
            >
                {__('库表')}
            </Breadcrumb.Item>
            {previewId && (
                <Breadcrumb.Item key="preview">{__('库表')}</Breadcrumb.Item>
            )}
        </Breadcrumb>
    )

    const logicView = (
        <div className={styles['lv-list']}>
            <div className={styles['lv-list-breadcrumb']}>{breadCrumb}</div>
            <Space
                className={styles['lv-list-top']}
                hidden={total === 0 && !searchCondition.keyword}
            >
                <SearchInput
                    style={{ width: '100%' }}
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
                                    handlePreview={handlePreview}
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

    return previewId ? (
        <div className={styles['lv-fieldlist']}>
            <FieldList
                showCode
                selectedId={previewId}
                search={false}
                title={breadCrumb}
            />
        </div>
    ) : (
        logicView
    )
}

export default memo(LogicalViewList)
