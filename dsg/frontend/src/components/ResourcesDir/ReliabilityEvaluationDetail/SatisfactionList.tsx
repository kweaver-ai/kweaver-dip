import { useEffect, useRef, useState } from 'react'
import { useDebounce, useSize } from 'ahooks'
import moment from 'moment'
import { Rate, Table } from 'antd'
import __ from '../locale'
import {
    formatError,
    getCatlgScoreDetails,
    ICatlgScoreDetailsItem,
} from '@/core'
import styles from './styles.module.less'
import { Empty, Loader } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'

interface SatisfactionListProps {
    categoryId: string
}

const RateComponent = ({
    value,
    isTitle = false,
}: {
    value: number
    isTitle?: boolean
}) => {
    return (
        <div className={styles.rateContainer}>
            <Rate value={value} disabled />
            <span className={isTitle ? styles.title : ''}>{value}</span>
        </div>
    )
}

const SatisfactionList = (props: SatisfactionListProps) => {
    const { categoryId } = props
    const [comprehensiveRate, setComprehensiveRate] = useState(0)
    const [dataSource, setDataSource] = useState<ICatlgScoreDetailsItem[]>([])
    const tableContainerRef = useRef<HTMLDivElement | null>(null)

    const tableContainerSize = useSize(tableContainerRef)

    const debouncedTableContainerHeight = useDebounce(
        tableContainerSize?.height,
        { wait: 500 },
    )
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (categoryId) {
            getSatisfactionList()
        }
    }, [categoryId])

    const getSatisfactionList = async () => {
        try {
            const res = await getCatlgScoreDetails(categoryId, {
                offset: 1,
                limit: 10,
            })
            setComprehensiveRate(res.average_score)
            setDataSource(res?.score_detail?.entries || [])
        } catch (err) {
            formatError(err)
        } finally {
            setLoading(false)
        }
    }

    const columns = [
        {
            title: '序号',
            dataIndex: 'index',
            key: 'index',
            render: (text: string, record: any, index: number) => (
                <span>{index + 1}</span>
            ),
        },
        {
            title: '评价结果',
            dataIndex: 'score',
            key: 'score',
            render: (text: string, record: any, index: number) => (
                <RateComponent value={record.score} />
            ),
        },
        {
            title: '部门',
            dataIndex: 'department',
            key: 'department',
            render: (text: string, record: any, index: number) => (
                <span title={record.department_path}>{record.department}</span>
            ),
        },
        {
            title: '评价时间',
            dataIndex: 'scored_at',
            key: 'scored_at',
            render: (text: string, record: any, index: number) => (
                <span>
                    {moment(record.scored_at).format('YYYY-MM-DD HH:mm:ss')}
                </span>
            ),
        },
    ]

    return loading ? (
        <div className={styles.loaderContainer}>
            <Loader />
        </div>
    ) : dataSource.length ? (
        <div className={styles.statusContainer}>
            <div className={styles.comprehensiveRate}>
                <span>{__('综合评价')}</span>
                <RateComponent value={comprehensiveRate} />
            </div>
            <div ref={tableContainerRef} className={styles.tableContainer}>
                <Table
                    columns={columns}
                    dataSource={dataSource}
                    pagination={false}
                    scroll={{ y: (debouncedTableContainerHeight || 500) - 48 }}
                />
            </div>
        </div>
    ) : (
        <div className={styles.emptyContainer}>
            <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
        </div>
    )
}

export default SatisfactionList
