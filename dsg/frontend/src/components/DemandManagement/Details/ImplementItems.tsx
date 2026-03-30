import { Space, Table } from 'antd'
import React, { useEffect, useState } from 'react'
import __ from '../locale'
import styles from './styles.module.less'
import dataEmpty from '@/assets/dataEmpty.svg'
import {
    IDemandItemInfo,
    IImplAchv,
    IItemImplementAuthority,
    formatError,
    getDemandItemDetailsV2,
    getItemDetails,
} from '@/core'
import { CommonItemsColumn, IExtendDemandItemInfo } from '../const'
import ViewConfig from './ViewConfig'
import ViewImplementResult from './ViewImplementResult'
import { Empty, Loader } from '@/ui'

interface IDemandItems {
    id?: string
    isBack?: boolean
    initItems?: IDemandItemInfo[]
    implementResult: IItemImplementAuthority[]
}
const ImplementItems: React.FC<IDemandItems> = ({
    id = '',
    isBack = false,
    initItems,
    implementResult,
}) => {
    const [configOpen, setConfigOpen] = useState(false)
    const [implementOpen, setImplementOpen] = useState(false)
    const [items, setItems] = useState<IDemandItemInfo[]>([])
    const [operateId, setOperateId] = useState('')
    const [operateData, setOperateData] = useState<IExtendDemandItemInfo>()
    const [implementRes, setImplementRes] = useState<IItemImplementAuthority[]>(
        [],
    )
    const [operateItemAuthority, setOperateItemAuthority] =
        useState<IImplAchv>()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (initItems) {
            setItems(initItems)
        }
    }, [initItems])

    useEffect(() => {
        if (implementResult) {
            setImplementRes(implementResult)
        }
    }, [implementResult])

    // 查看配置
    const handleView = async (item: IDemandItemInfo) => {
        try {
            const action = isBack ? getItemDetails : getDemandItemDetailsV2
            const res = await action(id, item.id)
            setOperateData({
                ...res,
                visitors: res.extend_info
                    ? JSON.parse(res.extend_info)?.visitors
                    : [],
            })
            setConfigOpen(true)
        } catch (error) {
            formatError(error)
        }
    }

    const viewImplementRes = (item: IDemandItemInfo) => {
        setImplementOpen(true)

        setOperateData(item)
        const res = implementRes.find((imp) => imp.item_id === item.id)
        if (res) {
            setOperateItemAuthority(res.impl_achv)
        }
    }

    const columns = [
        ...CommonItemsColumn,
        {
            title: __('操作'),
            dataIndex: 'action',
            key: 'action',
            width: 220,
            render: (action, record: IDemandItemInfo) => (
                <Space size={24}>
                    <a
                        onClick={() => {
                            if (isBack) {
                                handleView(record)
                            } else {
                                setOperateId(record.id)
                                setConfigOpen(true)
                            }
                        }}
                    >
                        {__('查看配置')}
                    </a>
                    <a onClick={() => viewImplementRes(record)}>
                        {__('查看实施结果')}
                    </a>
                </Space>
            ),
        },
    ]

    return (
        <div className={styles['demand-items-wrapper']}>
            {loading ? (
                <Loader />
            ) : items.length === 0 ? (
                <div className={styles['empty-container']}>
                    <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
                </div>
            ) : (
                <div className={styles['demand-items']}>
                    <Table
                        dataSource={items}
                        columns={columns}
                        pagination={false}
                        rowKey="id"
                    />
                </div>
            )}
            {configOpen && (
                <ViewConfig
                    demandId={id}
                    itemId={operateId}
                    open={configOpen}
                    onClose={() => {
                        setConfigOpen(false)
                        setOperateData(undefined)
                    }}
                    initData={operateData}
                />
            )}

            {implementOpen && (
                <ViewImplementResult
                    open={implementOpen}
                    onClose={() => setImplementOpen(false)}
                    authority={operateData?.authority || []}
                    initAuthority={operateItemAuthority}
                />
            )}
        </div>
    )
}

export default ImplementItems
