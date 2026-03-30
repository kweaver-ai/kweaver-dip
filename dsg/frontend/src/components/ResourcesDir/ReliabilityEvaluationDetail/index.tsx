import { FC, useEffect, useState } from 'react'
import { InfoCircleOutlined } from '@ant-design/icons'
import moment from 'moment'
import { Button, Tooltip } from 'antd'
import styles from './styles.module.less'
import __ from '../locale'
import { getScoreConfig, ScoreConfig, ScoreType } from '../helper'
import CompletenessCard from './CompletenessCard'
import SatisfactionList from './SatisfactionList'
import { TabKey } from '../const'
import { RadarMap } from '@/components/DatasheetView/DataPreview/g2plotConfig'
import { formatError, getBusinessUpdateTime, getExploreReport } from '@/core'
import { getScore } from '@/components/DatasheetView/DataPreview/helper'
import { TimelinessRuleList } from '@/components/DatasheetView/DatasourceExploration/const'
import { isValidTime } from '@/components/DataAssetsCatlg/LogicViewDetail/helper'
import { Empty, Loader } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'

interface IReliabilityEvaluationDetailProps {
    catlgId: string
    updateActiveKey: (key: TabKey) => void
    relatedRescId?: string
}

const TimelinessContentComponent = ({ config }: { config: any }) => {
    return (
        <div className={styles.timelinessContentContainer}>
            <div className={styles.itemInfoWrapper}>
                <span>{__('更新周期：')}</span>
                {/* <span>{config.cycle}</span> */}
                <span>{config.cycle}</span>
            </div>
            <div className={styles.timelinessDataWrapper}>
                <div className={styles.item}>
                    <div className={styles.title}>
                        <span>{__('准时更新次数')}</span>
                        <Tooltip
                            title={__('更新超过10次，仅展示近10次更新情况')}
                            color="#fff"
                            overlayInnerStyle={{ color: 'rgba(0,0,0,0.85)' }}
                        >
                            <InfoCircleOutlined className={styles.icon} />
                        </Tooltip>
                    </div>
                    <div className={styles.content}>
                        <span className={styles.number}>
                            {config.timelyUpdateCount}
                        </span>
                        <span className={styles.unit}>{__('次')}</span>
                    </div>
                </div>
                <div className={styles.item}>
                    <div className={styles.title}>
                        <span>{__('不准时更新次数')}</span>
                        <Tooltip
                            title={__('更新超过10次，仅展示近10次更新情况')}
                            color="#fff"
                            overlayInnerStyle={{ color: 'rgba(0,0,0,0.85)' }}
                        >
                            <InfoCircleOutlined />
                        </Tooltip>
                    </div>
                    <div className={styles.content}>
                        <span className={styles.number}>
                            {config.unTimelyUpdateCount}
                        </span>
                        <span className={styles.unit}>{__('次')}</span>
                    </div>
                </div>
            </div>

            <div className={styles.itemInfoWrapper}>
                <span>{__('最近更新时间：')}</span>
                <span>{config.lastUpdateTime}</span>
            </div>
            <div className={styles.itemInfoWrapper}>
                <div>{__('距离上次更新时间：')}</div>
                <div>
                    {__('${day}天', {
                        day: moment().diff(config.lastUpdateTime, 'days'),
                    })}
                </div>
            </div>
        </div>
    )
}

const ReliabilityEvaluationDetail: FC<IReliabilityEvaluationDetailProps> = ({
    catlgId,
    updateActiveKey,
    relatedRescId = '',
}) => {
    const [completenessResultConfig, setCompletenessResultConfig] =
        useState<any>(ScoreConfig[ScoreType.EXCELLENT])

    const [timelinessResultConfig, setTimelinessResultConfig] = useState<any>(
        ScoreConfig[ScoreType.GOOD],
    )

    const [accuracyResultConfig, setAccuracyResultConfig] = useState<any>(
        ScoreConfig[ScoreType.GENERAL],
    )

    const [loading, setLoading] = useState(true)

    const [timelinessData, setTimelinessData] = useState<any>({
        // 周期
        cycle: '--',
        // 准时更新次数
        timelyUpdateCount: 0,
        // 未准时更新次数
        unTimelyUpdateCount: 0,
        // 最近更新时间
        lastUpdateTime: '--',
        // 距离上次更新时间
        distanceLastUpdateTime: 1,
    })

    const [radarData, setRadarData] = useState<any>([])

    const [completenessConfig, setCompletenessConfig] = useState<
        Array<{
            title: string
            score: number | null
            description: string
            key: string
        }>
    >([
        {
            title: __('时间范围完整度'),
            key: 'time_range_completeness',
            score: 0,
            description: __('时间范围：不限'),
        },
        {
            title: __('空间范围完整度'),
            key: 'space_range_completeness',
            score: 0,
            description: __('空间范围：不限'),
        },
        {
            title: __('其他数据完整度'),
            key: 'other_data_completeness',
            score: 0,
            description: __('数据来源于此库表的质量报告中的完整性分数'),
        },
    ])

    const [completenessData, setCompletenessData] = useState<any>(null)

    const [timelinessOriginData, setTimelinessOriginData] = useState<any>(null)
    const [timelinessLoading, setTimelinessLoading] = useState<any>(true)
    useEffect(() => {
        if (relatedRescId) {
            getReportData()
        } else {
            setLoading(false)
        }
    }, [relatedRescId])

    const getReportData = async () => {
        try {
            const resReportData = await getExploreReport({ id: relatedRescId })
            getRadarMapData(resReportData?.overview)
            getCompletenessScore(resReportData?.overview)
            if (resReportData?.explore_view_details?.length) {
                getTimelinessScore(resReportData.explore_view_details)
            } else {
                setTimelinessLoading(false)
            }
        } catch (err) {
            setCompletenessData(null)
            setTimelinessLoading(false)
            if (err.data.code !== 'DataView.FormView.DataExploreReportGetErr') {
                formatError(err)
            }
        } finally {
            setLoading(false)
        }
    }

    /**
     * 获取及时性评分
     * @param ruleConfig 及时性规则配置
     */
    const getTimelinessScore = async (exploreViewDetails) => {
        try {
            const rule_config = JSON.parse(exploreViewDetails[0].rule_config)
            const resTimeless = await getBusinessUpdateTime(relatedRescId)
            const time = resTimeless?.business_update_time
            let isTimelinessPass = false
            if (time) {
                const { isTime, date } = isValidTime(time)
                if (isTime) {
                    const timeStr = isTime ? date : ''
                    const year = new Date(timeStr).getFullYear()
                    const month = new Date(timeStr).getMonth() + 1
                    const day = new Date(timeStr).getDate()
                    const hms = moment(timeStr).format('LTS')
                    isTimelinessPass = checkIsTimelinessPass(
                        rule_config?.update_period,
                        {
                            date,
                            year,
                            month: month < 10 ? `0${month}` : month,
                            day: day < 10 ? `0${day}` : day,
                            hms,
                        },
                    )
                }
            }
            setTimelinessData({
                ...timelinessData,
                lastUpdateTime: resTimeless?.business_update_time
                    ? moment(resTimeless.business_update_time).format(
                          'YYYY-MM-DD HH:mm:ss',
                      )
                    : '--',
                cycle:
                    TimelinessRuleList?.find(
                        (item) => item.value === rule_config?.update_period,
                    )?.label || '--',
                // timelyUpdateCount: isTimelinessPass ? 1 : 0,
                // unTimelyUpdateCount: isTimelinessPass ? 0 : 1,
                timelyUpdateCount: 1,
                unTimelyUpdateCount: 0,
            })
            setTimelinessResultConfig(getScoreConfig(100))
            setTimelinessOriginData(true)
        } catch (err) {
            setTimelinessData(null)
            if (
                err.data.code !== 'DataView.FormView.BusinessTimestampNotFound'
            ) {
                formatError(err)
            }
        } finally {
            setTimelinessLoading(false)
        }
    }

    const checkIsTimelinessPass = (confTimeliness, probeTime) => {
        let diffHours = -1
        if (confTimeliness) {
            let startTime: any = null
            switch (confTimeliness) {
                case 'day':
                    startTime = moment().add(-1, 'day').toDate()
                    break
                case 'week':
                    startTime = moment().add(-1, 'week').toDate()
                    break
                case 'month':
                    startTime = moment().add(-1, 'month').toDate()
                    break
                case 'quarter':
                    startTime = moment().add(-1, 'quarter').toDate()
                    break
                case 'half_a_year':
                    startTime = moment().add(-6, 'month').toDate()
                    break
                case 'year':
                    startTime = moment().add(-1, 'year').toDate()
                    break
                default:
                    break
            }

            diffHours = probeTime?.date
                ? moment(probeTime?.date)
                      .startOf('hour')
                      .diff(moment(startTime).startOf('hour'), 'hour')
                : -1
        }

        return diffHours >= 0
    }
    /**
     * 获取完整性评分
     * @param overview 完整性评分数据
     */
    const getCompletenessScore = (overview) => {
        setCompletenessData(overview)
        if (overview?.completeness_score !== null) {
            setCompletenessConfig(
                completenessConfig.map((item) => ({
                    ...item,
                    score:
                        item.key === 'other_data_completeness'
                            ? overview.completeness_score * 100
                            : 100,
                })),
            )
            const verageCompletenessScore =
                (overview.completeness_score * 100 + 100 * 2) / 3
            setCompletenessResultConfig(getScoreConfig(verageCompletenessScore))
        } else {
            setCompletenessConfig(
                completenessConfig.map((item) => ({
                    ...item,
                    score: null,
                })),
            )
            setCompletenessResultConfig(getScoreConfig(100))
        }
        // else {
        //     setCompletenessConfig(
        //         completenessConfig.map((item) => ({
        //             ...item,
        //             score: item.key === 'other_data_completeness' ? -1 : 100,
        //         })),
        //     )
        // }
    }

    /**
     * 获取雷达图数据
     * @param overview 雷达图数据
     */
    const getRadarMapData = (overview) => {
        const itemList = [
            {
                item: __('正确性'),
                score: getScore(overview?.accuracy_score, false),
            },
            {
                item: __('规范性'),
                score: getScore(overview?.standardization_score, false),
            },
            {
                item: __('唯一性'),
                score: getScore(overview?.uniqueness_score, false),
            },
        ]

        const allScore = [
            overview?.accuracy_score,
            overview?.standardization_score,
            overview?.uniqueness_score,
        ].filter((it) => it !== null)
        const averageScore = allScore.length
            ? (allScore.reduce((pre, cur) => pre + cur, 0) / allScore.length) *
              100
            : 0
        setAccuracyResultConfig(getScoreConfig(averageScore))

        setRadarData(itemList)
    }

    return loading ? (
        <div className={styles.loaderContainer}>
            <Loader />
        </div>
    ) : (
        <div className={styles.container}>
            <div className={styles.itemContainer}>
                <div className={styles.completenessContainer}>
                    <div className={styles.titleWrapper}>
                        <div>{__('完整性')}</div>
                        {completenessData !== null && (
                            <div
                                style={{
                                    backgroundColor:
                                        completenessResultConfig.color,
                                }}
                                className={styles.titleTip}
                            >
                                {completenessResultConfig.text}
                            </div>
                        )}
                    </div>
                    <div className={styles.contentWrapper}>
                        {completenessData !== null ? (
                            completenessConfig.map((item) => (
                                <div className={styles.item} key={item.title}>
                                    <CompletenessCard
                                        title={item.title}
                                        score={item.score}
                                        description={item.description}
                                    />
                                </div>
                            ))
                        ) : (
                            <div className={styles.emptyContainer}>
                                <Empty
                                    desc={__('暂无数据')}
                                    iconSrc={dataEmpty}
                                />
                            </div>
                        )}
                    </div>
                </div>
                <div className={styles.timelinessContainer}>
                    <div className={styles.titleWrapper}>
                        <div>{__('及时性')}</div>
                        {timelinessOriginData !== null && (
                            <div
                                style={{
                                    backgroundColor:
                                        timelinessResultConfig.color,
                                }}
                                className={styles.titleTip}
                            >
                                {timelinessResultConfig.text}
                            </div>
                        )}
                    </div>
                    {timelinessLoading ? (
                        <div className={styles.emptyContainer}>
                            <Loader />
                        </div>
                    ) : timelinessOriginData !== null ? (
                        <TimelinessContentComponent config={timelinessData} />
                    ) : (
                        <div className={styles.emptyContainer}>
                            <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                        </div>
                    )}
                </div>
            </div>
            <div className={styles.itemContainer}>
                <div className={styles.otherItemContainer}>
                    <div className={styles.titleWrapper}>
                        <div>{__('准确性')}</div>
                        {radarData?.length && (
                            <div
                                style={{
                                    backgroundColor: accuracyResultConfig.color,
                                }}
                                className={styles.titleTip}
                            >
                                {accuracyResultConfig.text}
                            </div>
                        )}
                    </div>
                    {radarData?.length ? (
                        <div className={styles.graphContainer}>
                            <div
                                className={styles['radar-map']}
                                style={{ zIndex: 1 }}
                            >
                                <RadarMap
                                    padding={[5, 0, 0, 0]}
                                    dataInfo={radarData || []}
                                    height={340}
                                    radarProps={{
                                        label: {
                                            offset: 0,
                                        },
                                        xAxis: {
                                            label: {
                                                offset: 4,
                                            },
                                            line: null,
                                            tickLine: null,
                                            grid: {
                                                line: {
                                                    style: {
                                                        lineDash: null,
                                                    },
                                                },
                                            },
                                        },
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className={styles.emptyContainer}>
                            <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                        </div>
                    )}
                </div>
                <div className={styles.otherItemContainer}>
                    <div className={styles.comprehensiveTitle}>
                        <div className={styles.titleWrapper}>
                            <div>{__('满意度')}</div>
                            <Tooltip
                                title={__('仅展示近10条评价')}
                                color="#fff"
                                overlayInnerStyle={{
                                    color: 'rgba(0,0,0,0.85)',
                                }}
                            >
                                <InfoCircleOutlined className={styles.icon} />
                            </Tooltip>
                        </div>
                        <Button
                            type="link"
                            onClick={() => updateActiveKey(TabKey.SCORE)}
                        >
                            {__('全部')}
                        </Button>
                    </div>
                    <div className={styles.content}>
                        <SatisfactionList categoryId={catlgId} />
                    </div>
                </div>
            </div>
        </div>
    )
}
export default ReliabilityEvaluationDetail
