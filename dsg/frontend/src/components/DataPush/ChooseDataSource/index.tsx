import { Button, List, Modal, Pagination, Tooltip } from 'antd'
import React, { memo, useEffect, useMemo, useState } from 'react'
import { omit } from 'lodash'
import { useUpdateEffect } from 'ahooks'
import {
    formatError,
    getCatalogedResourceList,
    ICatalogedResourceListItem,
} from '@/core'
import FieldList from './FieldList'
import dataEmpty from '@/assets/dataEmpty.svg'
import Empty from '@/ui/Empty'
import __ from './locale'
import styles from './styles.module.less'
import { Loader, SearchInput } from '@/ui'
import ResourceItem from './ResourceItem'
import { getActualUrl } from '@/utils'

interface IChooseDataSource {
    open: boolean
    checkedId?: string
    onClose: () => void
    onSure: (value) => void
}

/**
 * 选择数据资源
 */
const ChooseDataSource: React.FC<Partial<IChooseDataSource>> = ({
    open,
    checkedId, // 已选资源（库表）ID
    onClose,
    onSure,
}) => {
    // 弹窗内容加载中
    const [loading, setLoading] = useState<boolean>(false)
    // 数据加载中
    const [fetching, setFetching] = useState<boolean>(false)
    const [dataResource, setDataResource] = useState<
        ICatalogedResourceListItem[]
    >([])
    const [total, setTotal] = useState<number>(0)
    const [isEmpty, setIsEmpty] = useState<boolean>(false)
    // 已选资源 ID
    const [checkedItem, setCheckedItem] = useState<any>()
    // 查询条件
    const [condition, setCondition] = useState<any>({
        offset: 1,
        limit: 10,
    })

    useEffect(() => {
        if (open) {
            setLoading(true)
            setCondition({
                offset: 1,
                limit: 10,
            })
            setCheckedItem(checkedId ? { resource_id: checkedId } : undefined)
        } else {
            setCheckedItem(undefined)
        }
    }, [open, checkedId])

    // 是否有条件值
    const isSearchStatus = useMemo(() => {
        const ignoreAttr = ['offset', 'limit']
        return Object.values(omit(condition, ignoreAttr)).some((item) => item)
    }, [condition])

    useUpdateEffect(() => {
        if (condition) {
            getDataSource(condition)
        }
    }, [condition])

    useMemo(() => {
        if (!loading && total === 0) {
            setIsEmpty(true)
        } else {
            setIsEmpty(false)
        }
    }, [loading])

    const getDataSource = async (params: any) => {
        try {
            setFetching(true)
            const res = await getCatalogedResourceList(params)
            setDataResource(res?.entries || [])
            setTotal(res?.total_count || 0)
        } catch (error) {
            formatError(error)
            setDataResource([])
            setTotal(0)
        } finally {
            setFetching(false)
            setLoading(false)
        }
    }

    const footer = (
        <div className={styles.modalFooter}>
            <a
                onClick={() =>
                    window.open(
                        getActualUrl('/dataService/dataContent'),
                        '_blank',
                    )
                }
            >
                {__('找不到资源？去编目')}
            </a>
            <span>
                <Button onClick={onClose} className={styles.modalFooterBtn}>
                    {__('取消')}
                </Button>
                <Tooltip
                    title={checkedItem ? '' : __('请选择数据资源')}
                    placement="top"
                >
                    <Button
                        className={styles.modalFooterBtn}
                        type="primary"
                        disabled={
                            !checkedItem ||
                            checkedItem.resource_id === checkedId
                        }
                        onClick={() => {
                            onSure?.(checkedItem)
                        }}
                    >
                        {__('确定')}
                    </Button>
                </Tooltip>
            </span>
        </div>
    )

    return (
        <Modal
            title={__('选择数据资源')}
            width={640}
            maskClosable={false}
            open={open}
            onCancel={onClose}
            destroyOnClose
            getContainer={false}
            className={styles.chooseDataSourceModal}
            bodyStyle={{ height: 484, padding: 0 }}
            footer={footer}
        >
            <div className={styles.chooseDataSource}>
                {loading ? (
                    <div className={styles.inCenter}>
                        <Loader />
                    </div>
                ) : isEmpty ? (
                    <div className={styles.inCenter}>
                        <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                    </div>
                ) : (
                    <div className={styles.content}>
                        <div className={styles.left}>
                            <div className={styles.search}>
                                <SearchInput
                                    placeholder={__(
                                        '搜索资源名称、目录名称、目录编码',
                                    )}
                                    onKeyChange={(kw: string) => {
                                        if (kw === condition?.keyword) return
                                        setCondition({
                                            ...condition,
                                            offset: 1,
                                            keyword: kw,
                                        })
                                    }}
                                />
                            </div>
                            <List
                                className={styles.list}
                                loading={fetching}
                                dataSource={dataResource}
                                renderItem={(item: any) => (
                                    <List.Item>
                                        <ResourceItem
                                            data={item}
                                            checked={
                                                checkedItem?.resource_id ===
                                                item.resource_id
                                            }
                                            onCheck={() => {
                                                setCheckedItem(item)
                                            }}
                                        />
                                    </List.Item>
                                )}
                                split={false}
                                locale={{
                                    emptyText: isSearchStatus ? (
                                        <Empty />
                                    ) : (
                                        <Empty
                                            desc={__('暂无数据')}
                                            iconSrc={dataEmpty}
                                        />
                                    ),
                                }}
                            />
                            {total > 0 && (
                                <Pagination
                                    className={styles.pagination}
                                    size="small"
                                    total={total}
                                    hideOnSinglePage
                                    pageSize={condition.limit}
                                    current={condition.offset}
                                    onChange={(page, pageSize) => {
                                        setCondition({
                                            ...condition,
                                            offset: page,
                                            limit: pageSize,
                                        })
                                    }}
                                />
                            )}
                        </div>
                        <div className={styles.right}>
                            <FieldList resourceId={checkedItem?.resource_id} />
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    )
}

export default memo(ChooseDataSource)
