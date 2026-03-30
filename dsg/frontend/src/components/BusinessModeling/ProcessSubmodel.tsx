import React, { useEffect, useRef, useState } from 'react'
import { List, Pagination } from 'antd'
import { useSize, useUpdateEffect } from 'ahooks'
import Loader from '@/ui/Loader'
import styles from './styles.module.less'
import {
    formatError,
    getCoreBusinesses,
    IBusinessDomainItem,
    ICoreBusinessesParams,
    ICoreBusinessItem,
    TaskType,
} from '@/core'
import CoreBusinessCard from './CoreBusinessCard'
import { ViewMode } from './const'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import __ from './locale'
import { OperateType } from '@/utils'
import CreateCoreBusiness from './CreateCoreBusiness'

interface IProcessSubmodel {
    processNode: IBusinessDomainItem
    handleOperate: (op: OperateType | TaskType, data?: any) => void
    businessDomainTreeRef?: any
}
const ProcessSubmodel: React.FC<IProcessSubmodel> = ({
    processNode,
    handleOperate,
    businessDomainTreeRef,
}) => {
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)
    const [searchCondition, setSearchCondition] = useState<
        Partial<ICoreBusinessesParams>
    >({
        limit: 12,
        offset: 1,
        getall: false,
        node_id: processNode.id,
    })
    const [open, setOpen] = useState(false)
    const [operateType, setOperateType] = useState(OperateType.DETAIL)

    useUpdateEffect(() => {
        if (processNode.id === searchCondition.node_id) return
        setSearchCondition({ ...searchCondition, node_id: processNode.id })
    }, [processNode])

    const [coreBusinessList, setCoreBusinessList] = useState<
        ICoreBusinessItem[]
    >([])
    const [operateData, setOperateData] = useState<ICoreBusinessItem>()

    const ref = useRef<HTMLDivElement>(null)

    // 获取业务模型列表
    const getCoreBusinessList = async () => {
        try {
            setLoading(true)
            const res = await getCoreBusinesses(searchCondition)
            setCoreBusinessList(res.entries || [])
            setTotal(res.total_count)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getCoreBusinessList()
    }, [searchCondition])

    const handlePageChange = (offset: number) => {
        setSearchCondition({ ...searchCondition, offset })
    }

    const size = useSize(ref)
    const col = size
        ? (size?.width || 0) >= 1356
            ? 4
            : (size?.width || 0) >= 1012
            ? 3
            : (size?.width || 0) >= 668
            ? 2
            : 1
        : 3

    return (
        <div className={styles['process-submodel']}>
            <div className={styles['submodel-title']}>子流程模型</div>
            {loading ? (
                <Loader />
            ) : total > 0 ? (
                <div className={styles.bottom} ref={ref}>
                    <List
                        grid={{
                            gutter: 20,
                            column: col,
                        }}
                        dataSource={coreBusinessList}
                        renderItem={(item) => (
                            <List.Item
                                style={{
                                    maxWidth:
                                        (size?.width || 0 - (col - 1) * 20) /
                                        col,
                                }}
                            >
                                <CoreBusinessCard
                                    item={item}
                                    handleOperate={(type) => {
                                        if (type === OperateType.DETAIL) {
                                            setOperateType(type)
                                            setOpen(true)
                                            setOperateData(item)
                                            return
                                        }
                                        handleOperate(type, item)
                                    }}
                                    onDeleteSuccess={async () => {
                                        setSearchCondition({
                                            ...searchCondition,
                                        })
                                        // 更新架构树 数量
                                        await businessDomainTreeRef.current?.execNode(
                                            OperateType.MINUS,
                                            item.domain_id,
                                        )
                                    }}
                                    viewMode={ViewMode.BArchitecture}
                                />
                            </List.Item>
                        )}
                        className={styles.list}
                        locale={{
                            emptyText: (
                                <Empty
                                    desc={__('暂无数据')}
                                    iconSrc={dataEmpty}
                                />
                            ),
                        }}
                    />
                    <Pagination
                        current={searchCondition.offset}
                        pageSize={searchCondition.limit}
                        onChange={handlePageChange}
                        className={styles.pagination}
                        total={total}
                        showSizeChanger={false}
                        hideOnSinglePage
                    />
                </div>
            ) : (
                <div className={styles.emptyWrapper}>
                    <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
                </div>
            )}
            <CreateCoreBusiness
                visible={open}
                operateType={operateType as OperateType}
                setOperateType={setOperateType}
                onClose={() => setOpen(false)}
                onSuccess={() => {
                    setSearchCondition({ ...searchCondition })
                    setOpen(false)
                }}
                selectedNode={processNode}
                viewMode={ViewMode.BArchitecture}
                editId={operateData?.id}
            />
        </div>
    )
}

export default ProcessSubmodel
