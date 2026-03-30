import React, { memo, useEffect, useState } from 'react'
import { Checkbox } from 'antd'
import { useSafeState } from 'ahooks'
import ViewItem from './ViewItem'
import styles from './styles.module.less'
import { SearchInput, Empty } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import {
    formatError,
    getAllBizForms,
    getDepartmentForms,
    getUngroupForms,
} from '@/core'
import { RefreshBtn } from '@/components/ToolbarComponents'
import { FormTableKind } from '@/components/Forms/const'

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
                <ViewItem title={data?.name} desc={data?.description} />
            </div>
            <div className={styles['data-view-item-added']} hidden={!isBind}>
                <span>已添加</span>
            </div>
        </div>
    )
}

const DataView = ({ node, bindItems, checkedItems, onCheck }: any) => {
    const [searchKey, setSearchKey] = useSafeState<string>('')
    const [data, setData] = useState<any[]>([])
    const [views, setViews] = useState<any[]>([])
    const [dataMap, setDataMap] = useState<any>({})

    const getBizForms = async ({ isUngroup, isAll }: any) => {
        if (node?.id && dataMap[node?.id]) {
            setData(dataMap[node.id])
            return
        }

        if (isAll && dataMap.all) {
            setData(dataMap.all)
            return
        }

        try {
            if (isAll) {
                const res = await getAllBizForms({
                    limit: 999,
                    table_kind: [
                        FormTableKind.BUSINESS,
                        FormTableKind.STANDARD,
                    ].join(','),
                })
                setDataMap((prev) => ({ ...prev, all: res }))
                setData(res)
            } else if (isUngroup) {
                const res = await getUngroupForms()
                setDataMap((prev) => ({ ...prev, upgroup: res }))
                setData(res)
            } else {
                const res = await getDepartmentForms([node?.id])
                setDataMap((prev) => ({ ...prev, [node?.id]: res }))
                setData(res[node?.id])
            }
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (searchKey) {
            setViews(
                data?.filter((o) =>
                    o?.name?.toLowerCase().includes(searchKey?.toLowerCase()),
                ),
            )
        } else {
            setViews(data)
        }
    }, [searchKey, data])

    useEffect(() => {
        if (node?.id) {
            getBizForms({ isUngroup: node?.id === 'upgroup' })
        } else {
            getBizForms({ isAll: true })
        }
    }, [node])

    return (
        <div className={styles['data-view']}>
            <div className={styles['data-view-search']}>
                <SearchInput
                    placeholder="搜索业务表名称"
                    onKeyChange={setSearchKey}
                />
                <RefreshBtn
                    onClick={() => {
                        setDataMap({})
                        if (node?.id) {
                            getBizForms({ isUngroup: node?.id === 'upgroup' })
                        } else {
                            getBizForms({ isAll: true })
                        }
                    }}
                />
            </div>
            <div className={styles['data-view-list']}>
                {views?.length > 0 ? (
                    views.map((item) => (
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

export default memo(DataView)
