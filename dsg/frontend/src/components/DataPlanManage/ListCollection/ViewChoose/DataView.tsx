import React, { useEffect, useState } from 'react'
import { Checkbox, Tooltip } from 'antd'
import { useSafeState } from 'ahooks'
import classNames from 'classnames'
import ViewItem, { ViewItemWithDB } from './ViewItem'
import styles from './styles.module.less'
import { SearchInput, Empty } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import { formatError, getDatasheetView, SortDirection } from '@/core'
import { RefreshBtn } from '@/components/ToolbarComponents'

const DataViewItem = ({
    data,
    isCheck,
    isBind,
    onCheck,
    onClick,
    isChoose,
}: any) => {
    return (
        <div
            className={classNames(
                styles['data-view-item'],
                isCheck && styles['is-checked'],
                isChoose && styles['is-choose'],
            )}
            onClick={onClick}
        >
            <div className={styles['data-view-item-checkbox']}>
                <Checkbox
                    disabled={isBind}
                    checked={isCheck}
                    onChange={(e) => {
                        e.stopPropagation()
                        onCheck(!isCheck, data)
                    }}
                />
            </div>
            <div className={styles['data-view-item-content']}>
                <ViewItemWithDB
                    data={data}
                    extend={
                        <div hidden={!isBind} className={styles.extend}>
                            <span>已添加</span>
                        </div>
                    }
                />
            </div>
        </div>
    )
}

const DataView = ({ bindItems, checkedItems, onCheck, onChoose }: any) => {
    const [searchKey, setSearchKey] = useSafeState<string>('')
    const [data, setData] = useState<any[]>([])
    const [currentView, setCurrentView] = useState<any>()
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

    useEffect(() => {
        setSearchCondition((prev) => ({ ...prev, keyword: searchKey }))
    }, [searchKey])

    const getData = async (params) => {
        try {
            const res = await getDatasheetView(params)
            setData(res?.entries || [])
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        getData({ ...searchCondition })
    }, [searchCondition])

    return (
        <div className={styles['data-view']}>
            <div className={styles['data-view-search']}>
                <SearchInput
                    placeholder="搜索库表业务名称、技术名称"
                    onKeyChange={setSearchKey}
                />
                <RefreshBtn
                    onClick={() => setSearchCondition({ ...searchCondition })}
                />
            </div>
            <div className={styles['data-view-list']}>
                {data?.length > 0 ? (
                    data.map((item) => (
                        <DataViewItem
                            key={item?.id}
                            isChoose={currentView?.id === item?.id}
                            data={item}
                            isCheck={checkedItems?.some(
                                (o) => o?.id === item?.id,
                            )}
                            isBind={bindItems?.some((o) => o?.id === item?.id)}
                            onCheck={onCheck}
                            onClick={() => {
                                setCurrentView(item)
                                onChoose?.(item)
                            }}
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
