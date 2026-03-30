import { useEffect, useState } from 'react'
import { Button, Drawer, Space, Table } from 'antd'
import { useAntdTable } from 'ahooks'
import { formatError, getWorkOrderQualityAudit } from '@/core'
import __ from './locale'
import styles from './styles.module.less'
import { Empty } from '@/ui'
import { OperateType } from '@/utils'
import OptModal from './OptModal'
import { OrderType } from '../helper'
import DetailModal from './DetailModal'
import { SourceTypeEnum } from './helper'

function QualityExamineDrawer({ onClose, open }: any) {
    const [currentData, setCurrentData] = useState<any>()
    const [orderName, setOrderName] = useState<string>('')
    const [searchCondition, setSearchCondition] = useState<any>({
        keyword: '',
        offset: 1,
        limit: 10,
    })
    const [detailVisible, setDetailVisible] = useState<boolean>(false)
    const [qualityExamineOpen, setQualityExamineOpen] = useState<boolean>(false)

    useEffect(() => {
        run(searchCondition)
    }, [])

    const handleOperate = async (op: OperateType, item: any) => {
        switch (op) {
            case OperateType.DETAIL:
                setCurrentData(item)
                setDetailVisible(true)
                break
            case OperateType.QUALITY_EXAMINE:
                // 发起质量检测
                setOrderName(`${__('质量检测')}-${item.name}`)
                setCurrentData(item)
                setQualityExamineOpen(true)
                break
            default:
                break
        }
    }

    const columns = [
        {
            title: (
                <div>
                    <span>{__('工单名称')}</span>
                    <span
                        style={{
                            color: 'rgba(0,0,0,0.45)',
                            fontWeight: 'normal',
                        }}
                    >
                        （{__('编号')}）
                    </span>
                </div>
            ),
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.titleBox}>
                    <div className={styles.planTitle}>
                        <div
                            title={text}
                            onClick={() =>
                                handleOperate(OperateType.DETAIL, record)
                            }
                        >
                            {text || '--'}
                        </div>
                    </div>
                    <div className={styles.planContent} title={record?.code}>
                        {record?.code || '--'}
                    </div>
                </div>
            ),
        },
        {
            title: __('责任人'),
            dataIndex: 'responsible_uname',
            key: 'responsible_uname',
            ellipsis: true,
            render: (text, record) => text || '--',
        },
        {
            title: __('操作'),
            key: 'action',
            width: 160,
            render: (_: string, record) => {
                return (
                    <Space size={12}>
                        <Button
                            type="link"
                            onClick={(e) => {
                                handleOperate(OperateType.DETAIL, record)
                            }}
                        >
                            {__('详情')}
                        </Button>
                        <Button
                            type="link"
                            onClick={(e) => {
                                handleOperate(
                                    OperateType.QUALITY_EXAMINE,
                                    record,
                                )
                            }}
                        >
                            {__('发起质量检测')}
                        </Button>
                    </Space>
                )
            },
        },
    ]

    // 工单查询
    const getDataList = async (params: any) => {
        try {
            const res = await getWorkOrderQualityAudit(params)
            return { total: res.total_count, list: res.entries }
        } catch (error) {
            formatError(error)
            return {
                total: 0,
                list: [],
            }
        }
    }

    const { tableProps, run, pagination } = useAntdTable(getDataList, {
        defaultPageSize: 10,
        manual: true,
    })

    return (
        <div>
            <Drawer
                open={open}
                title={__('新表质检')}
                placement="right"
                onClose={onClose}
                width={1000}
                push={false}
            >
                <Table
                    columns={columns}
                    {...tableProps}
                    rowKey="id"
                    scroll={{
                        y: 'calc(100vh - 250px)',
                    }}
                    pagination={{
                        ...tableProps.pagination,
                        hideOnSinglePage: true,
                        showQuickJumper: true,
                        current: searchCondition.offset,
                        pageSize: searchCondition.limit,
                        showTotal: (count) => __('共${count}条', { count }),
                    }}
                    bordered={false}
                    locale={{
                        emptyText: <Empty />,
                    }}
                    className={styles.tableWrapper}
                    onChange={(newPagination, filters, sorter) => {
                        setSearchCondition((per) => ({
                            ...per,
                            offset: newPagination?.current || 1,
                            limit: newPagination?.pageSize || 10,
                        }))
                        run({
                            ...searchCondition,
                            offset: newPagination?.current || 1,
                            limit: newPagination?.pageSize || 10,
                        })
                    }}
                />
            </Drawer>
            {qualityExamineOpen && (
                <OptModal
                    id={currentData?.work_order_id}
                    visible={qualityExamineOpen}
                    type={OrderType.QUALITY_EXAMINE}
                    fromType={OrderType.AGGREGATION}
                    onClose={(refresh?: boolean) => {
                        if (refresh) {
                            run({ ...searchCondition })
                        }
                        setQualityExamineOpen(false)
                        setCurrentData(undefined)
                        setOrderName('')
                    }}
                    orderName={orderName}
                    orderSourceType={SourceTypeEnum.AGGREGATION_WORK_ORDER}
                />
            )}
            {detailVisible && (
                <DetailModal
                    id={currentData?.work_order_id}
                    type={OrderType.AGGREGATION}
                    onClose={() => {
                        setDetailVisible(false)
                        setCurrentData(undefined)
                    }}
                />
            )}
        </div>
    )
}

export default QualityExamineDrawer
