import { useEffect, useState } from 'react'
import { Modal, Statistic, Progress } from 'antd'
import styles from './styles.module.less'
import { formatError, exploreOverview } from '@/core'
import __ from '../locale'
import { DatasheetViewColored } from '@/icons'
import { animation } from '@/utils/animation'
import { viewCardList, viewContentCardList, viewStatisticsList } from './const'
import { Loader } from '@/ui'
import { useGradeLabelState } from '@/hooks/useGradeLabelState'

interface IDatasourceOverview {
    open: boolean
    datasource_id: string
    exploreTime?: string
    onClose: () => void
}

const DatasourceOverview = ({
    open,
    onClose,
    datasource_id,
    exploreTime,
}: IDatasourceOverview) => {
    const [isGradeOpen] = useGradeLabelState()
    const [total, setTotal] = useState<number>(0)
    const [viewCardData, setViewCardData] = useState<any>(viewCardList)
    const [viewContentCardData, setViewContentCardData] = useState<any>(
        viewContentCardList.map((item) => ({
            ...item,
            title:
                item.key === 'explored_classification_view_count' &&
                !isGradeOpen
                    ? item.subTitle
                    : item.title,
        })),
    )
    const [viewStatisticsData, setViewStatisticsData] =
        useState<any>(viewStatisticsList)
    const [loading, setLoading] = useState<boolean>(false)

    useEffect(() => {
        if (open && datasource_id) {
            init()
        }
    }, [open])

    const init = async () => {
        try {
            setLoading(true)
            const res = await exploreOverview({ datasource_id })
            animation(1000, 0, res.view_count, (value) => {
                setTotal(Math.ceil(value))
            })
            setViewContentCardData(
                viewContentCardData.map((item) => {
                    const percent =
                        Math.round((res[item.key] / res.view_count) * 10000) /
                        100
                    return {
                        ...item,
                        value: res[item.key],
                        percent,
                    }
                }),
            )
            setViewCardData(
                viewCardData.map((item) => {
                    return {
                        ...item,
                        value:
                            item.key === 'unpublished_view_count'
                                ? res.view_count - res.published_view_count
                                : res[item.key],
                    }
                }),
            )
            setViewStatisticsData(
                viewStatisticsData.map((item) => {
                    const value =
                        Math.round((res[item.key] / res.field_count) * 10000) /
                        100
                    return {
                        ...item,
                        value,
                        labelList: item.labelList.map((it) => ({
                            ...it,
                            value:
                                it.key === 'sum'
                                    ? res[item.key]
                                    : res.field_count,
                        })),
                    }
                }),
            )
        } catch (err) {
            formatError(err)
        } finally {
            setLoading(false)
        }
    }
    return (
        <Modal
            title={
                <div className={styles.modalTitle}>
                    <div className={styles.title}>{__('数据源概览')}</div>
                    <div className={styles.titleTime}>
                        {exploreTime
                            ? __('最近探查时间(${exploreTime})', {
                                  exploreTime,
                              })
                            : __('最近探查时间 ：--')}
                    </div>
                </div>
            }
            width={960}
            open={open}
            onCancel={onClose}
            className={styles.modalWrapper}
            maskClosable={false}
            footer={null}
        >
            {loading ? (
                <div className={styles.loadBox}>
                    <Loader />
                </div>
            ) : (
                <div className={styles.modalBox}>
                    <div className={styles.firstBox}>
                        <div className={styles.left}>
                            <div className={styles.tilte}>{__('库表')}</div>
                            <div className={styles.firstBoxCard}>
                                {viewCardData.map((item) => {
                                    return (
                                        <div
                                            key={item.key}
                                            className={styles.sumCardItem}
                                        >
                                            <div className={styles.sumCardItem}>
                                                {item.key === 'view_count' && (
                                                    <DatasheetViewColored
                                                        className={styles.icon}
                                                    />
                                                )}
                                                <div className={styles.text}>
                                                    <div
                                                        className={
                                                            styles.subTilte
                                                        }
                                                    >
                                                        {item.title}
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.statisticText
                                                        }
                                                    >
                                                        <Statistic
                                                            value={item.value}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {item.key === 'view_count' && (
                                                <div
                                                    className={styles.divider}
                                                />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        <div className={styles.right}>
                            <div className={styles.tilte}>
                                {__('探查内容分布')}
                            </div>
                            <div className={styles.firstBoxCard}>
                                {viewContentCardData.map((item) => {
                                    return (
                                        <div
                                            className={styles.cardItem}
                                            key={item.key}
                                        >
                                            <Progress
                                                type="circle"
                                                percent={item.percent}
                                                strokeColor={item.color}
                                                success={{
                                                    strokeColor: item.color,
                                                }}
                                                width={60}
                                                strokeWidth={12}
                                                trailColor="#f0f0f0"
                                            />
                                            <div className={styles.itemValue}>
                                                <div
                                                    className={
                                                        styles.statisticText
                                                    }
                                                    title={item.value}
                                                >
                                                    <Statistic
                                                        value={item.value}
                                                    />
                                                </div>
                                                <div
                                                    title={item.title}
                                                    className={styles.cardTitle}
                                                >
                                                    {item.title}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                    <div className={styles.secBox}>
                        {viewStatisticsData.map((item) => {
                            return (
                                <div
                                    className={styles.statisticItem}
                                    key={item.color}
                                >
                                    <div className={styles.tilte}>
                                        {item.title}
                                    </div>
                                    <div className={styles.progress}>
                                        <Progress
                                            type="circle"
                                            percent={item.value}
                                            width={120}
                                            strokeWidth={12}
                                            strokeColor={item.color}
                                            trailColor="#f0f0f0"
                                            success={{
                                                strokeColor: item.color,
                                            }}
                                        />
                                    </div>
                                    <div className={styles.labelBox}>
                                        {item.labelList.map((it) => {
                                            return (
                                                <div
                                                    key={it.key}
                                                    className={styles.labelItem}
                                                >
                                                    <div
                                                        className={
                                                            styles.labelDot
                                                        }
                                                        style={{
                                                            background:
                                                                it.color,
                                                        }}
                                                    />
                                                    <div
                                                        className={
                                                            styles.labelText
                                                        }
                                                    >
                                                        {it.label}
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.labelText
                                                        }
                                                    >
                                                        <Statistic
                                                            value={it.value}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </Modal>
    )
}

export default DatasourceOverview
