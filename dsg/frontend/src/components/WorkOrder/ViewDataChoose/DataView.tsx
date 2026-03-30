import React, { useEffect, useState } from 'react'
import { Checkbox, Pagination } from 'antd'
import { useSafeState, useUpdateEffect } from 'ahooks'
import { has } from 'lodash'
import ViewItem from './ViewItem'
import styles from './styles.module.less'
import { SearchInput, Empty, LightweightSearch } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import {
    formatError,
    getDatasheetView,
    getFormViewByAuditStatus,
    SortDirection,
} from '@/core'
import { RefreshBtn } from '@/components/ToolbarComponents'
import { cancelRequest } from '@/utils'
import { SearchType } from '@/ui/LightweightSearch/const'

const DataViewItem = ({ data, isCheck, isBind, onCheck }: any) => {
    return (
        <div className={styles['data-view-item']}>
            <div className={styles['data-view-item-checkbox']}>
                <Checkbox
                    disabled={isBind}
                    checked={isCheck}
                    onChange={() => {
                        onCheck(!isCheck, data)
                    }}
                />
            </div>
            <div className={styles['data-view-item-content']}>
                <ViewItem
                    title={data?.business_name}
                    desc={data?.technical_name}
                />
            </div>
            <div className={styles['data-view-item-added']} hidden={!isBind}>
                <span>已添加</span>
            </div>
        </div>
    )
}

const DataView = ({
    checkedAll, // 是否全选且不可取消
    checkedItems,
    onCheck,
    condition,
}: any) => {
    const [searchKey, setSearchKey] = useSafeState<string>('')
    const [data, setData] = useState<any[]>([])
    const [total, setTotal] = useState<number>(0)
    const [originalTotal, setOriginalTotal] = useState<number>(0) // 保存不搜索时的总数
    const [searchCondition, setSearchCondition] = useState<any>({
        offset: 1,
        limit: 10,
        keyword: '',
        direction: SortDirection.DESC,
        sort: 'updated_at',
        type: 'datasource',
        include_sub_subject: true,
        // publish_status: 'publish',
    })

    useUpdateEffect(() => {
        setSearchCondition((prev) => ({
            ...prev,
            offset: 1,
            keyword: searchKey,
        }))
    }, [searchKey])

    const getData = async (params: any) => {
        try {
            if (has(params, 'is_audited')) {
                // 根据检测状态查询库表列表
                cancelRequest(
                    '/api/data-view/v1/form-view/by-audit-status',
                    'get',
                )
                const res = await getFormViewByAuditStatus(params)
                setData(res?.entries || [])
                setTotal(res?.total_count || 0)
                // 没有搜索关键字时，保存原始总数
                if (!params?.keyword) {
                    setOriginalTotal(res?.total_count || 0)
                }
            } else {
                // 查询库表列表
                cancelRequest('/api/data-view/v1/form-view', 'get')
                const res = await getDatasheetView(params)
                setData(res?.entries || [])
                setTotal(res?.total_count || 0)
                // 没有搜索关键字时，保存原始总数
                if (!(params as any)?.keyword) {
                    setOriginalTotal(res?.total_count || 0)
                }
            }
        } catch (error) {
            formatError(error)
        }
    }

    useUpdateEffect(() => {
        getData({ ...searchCondition })
    }, [searchCondition])

    useUpdateEffect(() => {
        if (condition) {
            setSearchCondition({
                ...searchCondition,
                ...condition,
                offset: 1,
            })
        }
    }, [condition])

    const handlePageChange = (page: number, pageSize: number) => {
        setSearchCondition((prev) => ({
            ...prev,
            offset: page,
            limit: pageSize,
        }))
    }

    return (
        <div className={styles['data-view']}>
            <div className={styles['data-view-top']}>
                <div className={styles.title}>库表</div>
                <div className={styles.search}>
                    <SearchInput
                        placeholder="搜索库表名称"
                        onKeyChange={setSearchKey}
                    />

                    <RefreshBtn
                        onClick={() => {
                            setSearchCondition({ ...searchCondition })
                        }}
                    />
                </div>
            </div>

            <div className={styles['data-view-list']}>
                {data?.length > 0 ? (
                    data.map((item) => (
                        <DataViewItem
                            key={item?.id}
                            data={item}
                            isCheck={
                                checkedAll ||
                                checkedItems?.some((o) => o === item?.id)
                            }
                            isBind={checkedAll}
                            onCheck={(isCheck, d) => {
                                // 传递原始总数，用于判断是否全选（而不是搜索后的总数）
                                onCheck(isCheck, d, originalTotal)
                            }}
                        />
                    ))
                ) : (
                    <div className={styles.empty}>
                        <Empty iconSrc={dataEmpty} desc="暂无数据" />
                    </div>
                )}
            </div>

            {total > 0 && (
                <div className={styles['data-view-pagination']}>
                    <Pagination
                        current={searchCondition.offset}
                        pageSize={searchCondition.limit}
                        total={total}
                        onChange={handlePageChange}
                        size="small"
                    />
                </div>
            )}
        </div>
    )
}

export default DataView
