import { useEffect, useState } from 'react'
import { Rate, Table, TableProps } from 'antd'
import { SortOrder } from 'antd/lib/table/interface'
import { useUpdateEffect } from 'ahooks'
import styles from './styles.module.less'
import { CommonTitle } from '@/ui'
import __ from './locale'
import {
    formatError,
    getCatlgScoreDetails,
    ICatlgScoreDetailsItem,
    ICatlgScoreDetailsRes,
} from '@/core'
import { formatTime } from '@/utils'

const Statistics = [1, 2, 3, 4, 5]

interface IProps {
    catalogId: string
}
const CatlgScore = ({ catalogId }: IProps) => {
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        scoreAt: 'descend',
    })

    const [searchCondition, setSearchCondition] = useState<any>({
        current: 1,
        limit: 10,
        sort: 'scored_at',
        direction: 'descend',
    })

    const [details, setDetails] = useState<ICatlgScoreDetailsRes>()

    const getDetails = async () => {
        try {
            const res = await getCatlgScoreDetails(catalogId, {
                ...searchCondition,
                current: undefined,
                offset: searchCondition.current,
                direction:
                    searchCondition.direction === 'descend' ? 'desc' : 'asc',
            })
            setDetails(res)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        getDetails()
    }, [])

    useUpdateEffect(() => {
        getDetails()
    }, [searchCondition])

    const columns: TableProps<any>['columns'] = [
        {
            title: __('姓名'),
            dataIndex: 'user_name',
            key: 'user_name',
            ellipsis: true,
        },
        // {
        //     title: __('所属部门'),
        //     dataIndex: 'department',
        //     key: 'department',
        //     render: (_, record: ICatlgScoreDetailsItem) => {
        //         return (
        //             <span title={record.department_path}>
        //                 {record.department}
        //             </span>
        //         )
        //     },
        // },
        {
            title: __('评分'),
            dataIndex: 'score',
            key: 'score',
        },
        {
            title: __('评分时间'),
            dataIndex: 'scored_at',
            key: 'scored_at',
            sorter: true,
            sortOrder: tableSort.scoreAt,
            showSorterTooltip: false,
            render: (val) => formatTime(val),
        },
    ]

    return (
        <div className={styles['catlg-score-wrapper']}>
            <div className={styles['catlg-score-overview']}>
                <div className={styles['comprehensive-score']}>
                    <div className={styles['comprehensive-score-value']}>
                        {details?.average_score}
                    </div>
                    <div className={styles['comprehensive-score-info']}>
                        <div className={styles['score-info-title']}>
                            {__('综合评分')}
                        </div>
                        <div className={styles['score-info-rate']}>
                            <Rate
                                value={details?.average_score || 0}
                                disabled
                            />
                            <span className={styles['score-desc']}>
                                {__('来自${num}个真实评分', {
                                    num:
                                        details?.score_detail?.total_count ||
                                        '0',
                                })}
                            </span>
                        </div>
                    </div>
                </div>
                <div className={styles['statistics-container']}>
                    {Statistics.map((item, index) => {
                        return (
                            <div
                                className={styles['statistics-item']}
                                key={index}
                            >
                                <div className={styles['statistics-title']}>
                                    {__('${num}星（个）', {
                                        num: item,
                                    })}
                                </div>
                                <div className={styles['statistics-value']}>
                                    {details?.score_stat.find(
                                        (s) => s.score === item,
                                    )?.count || 0}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            <div className={styles['catlg-score-list-container']}>
                <CommonTitle title={__('评分列表')} />
                <Table
                    className={styles['score-table']}
                    dataSource={details?.score_detail.entries}
                    columns={columns}
                    pagination={
                        (details?.score_detail.total_count || 0) > 10
                            ? {
                                  total: details?.score_detail.total_count,
                                  pageSize: searchCondition.limit,
                                  current: searchCondition.current,
                                  showSizeChanger: true,
                                  showTotal: (total) => {
                                      return __('共${total}条', { total })
                                  },
                              }
                            : false
                    }
                    onChange={(currentPagination, filters, sorter: any) => {
                        if (
                            !currentPagination.current ||
                            (currentPagination.current ===
                                searchCondition.current &&
                                currentPagination.pageSize ===
                                    searchCondition.limit)
                        ) {
                            if (sorter.column) {
                                setTableSort({
                                    scoreAt: sorter.order || 'ascend',
                                })
                            } else {
                                setTableSort({
                                    scoreAt:
                                        tableSort.scoreAt === 'ascend'
                                            ? 'descend'
                                            : 'ascend',
                                })
                            }
                            setSearchCondition({
                                ...searchCondition,
                                limit: currentPagination.pageSize,
                                direction:
                                    tableSort.scoreAt === 'ascend'
                                        ? 'descend'
                                        : 'ascend',
                                current: 1,
                            })
                        } else {
                            setSearchCondition({
                                ...searchCondition,
                                limit: currentPagination.pageSize,
                                current: currentPagination?.current || 1,
                            })
                        }
                    }}
                />
            </div>
        </div>
    )
}

export default CatlgScore
