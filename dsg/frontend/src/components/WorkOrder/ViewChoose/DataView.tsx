import React, { useEffect, useState } from 'react'
import { Checkbox } from 'antd'
import { useSafeState, useUpdateEffect } from 'ahooks'
import { has } from 'lodash'
import ViewItem from './ViewItem'
import styles from './styles.module.less'
import { SearchInput, Empty } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import {
    formatError,
    getDatasheetView,
    getFormViewByAuditStatus,
    SortDirection,
} from '@/core'
import { RefreshBtn } from '@/components/ToolbarComponents'
import { cancelRequest } from '@/utils'

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

const DataView = ({ bindItems, checkedItems, onCheck, condition }: any) => {
    const [searchKey, setSearchKey] = useSafeState<string>('')
    const [data, setData] = useState<any[]>([])
    const [searchCondition, setSearchCondition] = useState<any>({
        offset: 1,
        limit: 999,
        keyword: '',
        direction: SortDirection.DESC,
        sort: 'updated_at',
        type: 'datasource',
        include_sub_subject: true,
        publish_status: 'publish',
    })

    useUpdateEffect(() => {
        setSearchCondition((prev) => ({
            ...prev,
            offset: 1,
            keyword: searchKey,
        }))
    }, [searchKey])

    const getData = async (params) => {
        try {
            if (has(params, 'is_audited')) {
                // 根据检测状态查询库表列表
                cancelRequest(
                    '/api/data-view/v1/form-view/by-audit-status',
                    'get',
                )
                const res = await getFormViewByAuditStatus(params)
                setData(res || [])
            } else {
                // 查询库表列表
                cancelRequest('/api/data-view/v1/form-view', 'get')
                const res = await getDatasheetView(params)
                setData(res?.entries || [])
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

    return (
        <div className={styles['data-view']}>
            <div className={styles['data-view-search']}>
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
            <div className={styles['data-view-list']}>
                {data?.length > 0 ? (
                    data.map((item) => (
                        <DataViewItem
                            key={item?.id}
                            data={item}
                            isCheck={checkedItems?.some(
                                (o) => o?.id === item?.id,
                            )}
                            isBind={bindItems?.some((o) => o?.id === item?.id)}
                            onCheck={onCheck}
                        />
                    ))
                ) : (
                    <div className={styles.empty}>
                        <Empty iconSrc={dataEmpty} desc="暂无数据" />
                    </div>
                )}
            </div>
        </div>
    )
}

export default DataView
