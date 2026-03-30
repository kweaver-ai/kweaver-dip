import { Radio, Tabs } from 'antd'
import classnames from 'classnames'
import moment from 'moment'
import React, {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import dataEmpty from '@/assets/dataEmpty.svg'
import {
    isValidTime,
    SampleOptionValue,
} from '@/components/DataAssetsCatlg/LogicViewDetail/helper'
import { MicroWidgetPropsContext } from '@/context'
import {
    allRoleList,
    AssetTypeEnum,
    formatError,
    getBusinessUpdateTime,
    HasAccess,
    IPolicyInfo,
    policyDetail,
} from '@/core'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { Loader } from '@/ui'
import Empty from '@/ui/Empty'
import 'swiper/css'
import 'swiper/css/navigation'
import FieldStatistics from './FieldStatistics'
import {
    getScore,
    getScoreColor,
    IRowItem,
    KVMap,
    RowKVArr,
    ScoreType,
    transTypeValue,
} from './helper'
import __ from './locale'
import RuleDetail from './RuleDetail'
import styles from './styles.module.less'
import CheckListCard from './ViewCards/CheckListCard'
import DimensionScoreCard from './ViewCards/DimensionScoreCard'
import HistoryTrendCard from './ViewCards/HistoryTrendCard'
import ListCard from './ViewCards/ListCard'
import QualityScoreCard from './ViewCards/QualityScoreCard'
import RowQualityCard from './ViewCards/RowQualityCard'
import UpdateTimeCard from './ViewCards/UpdateTimeCard'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import FieldsInfo from '@/components/WorkOrder/QualityReport/ReportDetail/FieldsInfo'

/** 仅显示 完整性|唯一性|准确性 */
const ShowTypes = ['completeness', 'uniqueness', 'accuracy']
export const getIconScore = (score: number) => {
    return (
        <div className={styles['score-item']}>
            <span
                className={styles['score-item-icon']}
                style={{
                    background: getScoreColor(score),
                }}
            />
            <span className={styles.scoreValue}>{score}</span>
        </div>
    )
}

interface IViewQualityReport {
    data: any
    dataViewId: string
    // 样例数据是否需要权限控制，为true则传userid，否则不传
    isNeedPermisControl?: boolean
    // 服务超市-是否是视图owner（是则只显示样例数据不显示合成数据）
    isAudit?: boolean
    /** 有探查报告 */
    hasReport?: boolean
    formViewStatus?: string
    className?: string
}

const ViewQualityReport = (props: IViewQualityReport) => {
    const {
        data,
        dataViewId,
        isNeedPermisControl = true,
        isAudit,
        formViewStatus,
        hasReport,
        className,
    } = props

    const {
        overview, // 总览
        explore_metadata_details, // 元数据级
        explore_field_details, // 字段级
        explore_row_details, // 行级
        explore_view_details, // 视图级
        formView,
    } = data

    const [activeTab, setActiveTab] = useState<string>('view')
    const [userId] = useCurrentUser('ID')
    // useCogAsstContext 已移除，相关功能已下线
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)

    const [loading, setLoading] = useState(false)
    const [timeLoading, setTimeLoading] = useState(false)
    const [radarMapData, setRadarMapData] = useState<any[]>()
    /** 规则配置评分数据 */
    const [scoreData, setScoreData] = useState<any[]>([])
    const [probeTime, setProbeTime] = useState<any>({})
    const [rowShowList, setRowShowList] = useState<IRowItem[]>([])
    const [fieldPreviewOpen, setFieldPreviewOpen] = useState<boolean>(false)
    const [ruleDetailOpen, setRuleDetailOpen] = useState<boolean>(false)
    const [ruleType, setRuleType] = useState<string>()
    const [radioTypes, setRadioTypes] = useState<string[]>(ShowTypes)
    const [radioType, setRadioType] = useState<string>()
    const [confTimeliness, setConfTimeliness] = useState<string>()
    const { checkPermissions } = useUserPermCtx()
    const [showFieldTable, setShowFieldTable] = useState<boolean>(false)
    const [updateField, setUpdateField] = useState<any>()
    // 是否有整表权限
    const [isOwnedFullReadPermis, setIsOwnedFullReadPermis] =
        useState<boolean>(false)

    const sliderRef = useRef<any>()

    useEffect(() => {
        setIsOwnedFullReadPermis(false)
        checkIsOwnedView(dataViewId, AssetTypeEnum.DataView)
        const scoreItems = (explore_field_details || []).map((o) => ({
            isScore: true,
            key: o.field_id,
            isOnlyStatistics: o?.details.every(
                (it) => it?.dimension === 'data_statistics',
            ),
            data: {
                /** 完整性 */
                completeness_score: getScore(o?.completeness_score, false),
                /** 唯一性 */
                uniqueness_score: getScore(o?.uniqueness_score, false),
                /** 规范性 */
                standardization_score: getScore(
                    o?.standardization_score,
                    false,
                ),
                /** 准确性 */
                accuracy_score: getScore(o?.accuracy_score, false),
            },
        }))
        setScoreData(scoreItems)
    }, [data])

    const isTimelinessPass = useMemo(() => {
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
    }, [confTimeliness, probeTime])

    useEffect(() => {
        getRadarMapData(isTimelinessPass)
        getRadarMapDataEmpytStatus()
    }, [overview, isTimelinessPass, confTimeliness])

    useEffect(() => {
        const conf = explore_view_details?.find(
            (o) => o.dimension === 'timeliness',
        )?.rule_config

        const timelinessPeriod = JSON.parse(conf || '{}')?.update_period
        setConfTimeliness(timelinessPeriod)
    }, [explore_view_details])

    // 是否拥有数据运营工程师
    const hasDataOperRole = useMemo(() => {
        return checkPermissions(HasAccess.isGovernOrOperation) ?? false
    }, [checkPermissions])

    // 仅展现具有可读权限的字段
    const accessFields = useMemo(() => {
        return formView?.fields?.filter((o) => o?.is_readable)
    }, [formView?.fields])

    // 样例数据radio
    const [sampleOption, setSampleOption] = useState(SampleOptionValue.Sample)

    const [currentRuleInfo, setCurrentRuleInfo] = useState<any>()
    useEffect(() => {
        // 开启了及时性探查
        if (dataViewId && confTimeliness) {
            getProbeUpdateTime()
        }
    }, [dataViewId, confTimeliness])

    const getProbeUpdateTime = async () => {
        try {
            setTimeLoading(true)
            const res = await getBusinessUpdateTime(dataViewId)
            const time = res?.business_update_time
            const fieldInfo = {
                field_id: res?.field_id,
                field_business_name: res?.field_business_name,
            }
            setUpdateField(fieldInfo)
            if (time) {
                const { isTime, date } = isValidTime(time)
                if (isTime) {
                    const timeStr = isTime ? date : ''
                    const year = new Date(timeStr).getFullYear()
                    const month = new Date(timeStr).getMonth() + 1
                    const day = new Date(timeStr).getDate()
                    const hms = moment(timeStr).format('LTS')
                    setProbeTime({
                        date,
                        year,
                        month: month < 10 ? `0${month}` : month,
                        day: day < 10 ? `0${day}` : day,
                        hms,
                    })
                }
            }
        } catch (err) {
            // formatError(err)
        } finally {
            setTimeLoading(false)
        }
    }

    // 视图有整表read权限才需要切换样例、合成数据
    const checkIsOwnedView = async (viewId: string, rtype: AssetTypeEnum) => {
        try {
            setLoading(true)
            if (hasDataOperRole) {
                setIsOwnedFullReadPermis(true)
                return
            }
            const res: IPolicyInfo = await policyDetail(viewId, rtype)
            const owndUserIdList = res?.owner_id ? [res?.owner_id] : []
            res?.subjects?.forEach((item) => {
                const { subject_id } = item
                if (subject_id) {
                    owndUserIdList.push(subject_id)
                }
            })
            setIsOwnedFullReadPermis(owndUserIdList.includes(userId))
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
        } finally {
            setLoading(false)
        }
    }

    const getRadarMapData = (pass: boolean) => {
        const itemList = [
            {
                item: __('准确性'),
                score: getScore(overview?.accuracy_score, false),
            },
            {
                item: __('完整性'),
                score: getScore(overview?.completeness_score, false),
            },
            {
                item: __('一致性'),
                score: getScore(overview?.consistency_score, false),
            },
            {
                item: __('规范性'),
                score: getScore(overview?.standardization_score, false),
            },
            {
                item: __('唯一性'),
                score: getScore(overview?.uniqueness_score, false),
            },
            {
                item: __('及时性'),
                score: pass ? 100 : confTimeliness ? 0 : null,
            },
        ]
        setRadarMapData(itemList)
    }

    const getRadarMapDataEmpytStatus = () => {
        const fieldList = [
            'completeness_score',
            'uniqueness_score',
            'timeliness_score',
            'consistency_score',
            'standardization_score',
            'accuracy_score',
        ]
        const flag: boolean = fieldList.every(
            (item) => overview?.[item] === null,
        )
        return flag
    }

    // 数据质量评分
    const dataQulityScore = useMemo(() => {
        let score
        try {
            const validScoreList = radarMapData?.filter(
                (item) => typeof item.score === 'number',
            )
            const count = validScoreList?.length
            if (typeof count === 'number' && count > 0) {
                const sum = validScoreList
                    ?.map((item) => item.score)
                    .reduce((num, res) => num + res * 100, 0)

                if (sum >= 0) {
                    // 取整
                    score = Math.trunc(sum / count) / 100
                }
            }
        } catch (e) {
            // console.log(e)
        }
        return score
    }, [radarMapData])

    const getScoreTrendEmpytStatus = () => {
        const score =
            overview?.score_trend.map(
                (item) =>
                    item.accuracy_score ||
                    item.completeness_score ||
                    item.consistency_score ||
                    item.standardization_score ||
                    item.uniqueness_score,
            ) || []
        const flag: boolean = score.every((item) => item === null)
        return flag
    }

    const empty = (desc: string | React.ReactElement, height = 144) => {
        return <Empty iconSrc={dataEmpty} desc={desc} iconHeight={height} />
    }

    const handleEmptyOprClick = () => {
        setSampleOption(SampleOptionValue.Synthetic)
    }

    const ruleCards = useMemo(() => {
        const metaItems = (explore_metadata_details?.explore_details || []).map(
            (o) => {
                const showIsPass = o.rule_name === '表描述检查'
                return {
                    ...o,
                    showIsPass,
                    score: getScore(o?.[KVMap[o?.dimension]]),
                }
            },
        )
        const viewCustom = (explore_view_details || [])
            .filter((o) => o.dimension === 'completeness')
            .map((o) => ({
                ...o,
                showIsPass: true,
                score: getScore(o?.[KVMap[o?.dimension]]),
            }))

        const items = [...metaItems, ...viewCustom]
        return items
    }, [data])

    useEffect(() => {
        const rowArr: IRowItem[] = RowKVArr.reduce(
            (prev: IRowItem[], cur: string) => {
                const it = {
                    type: cur,
                    score: explore_row_details?.[KVMap[cur]],
                    list: explore_row_details?.explore_details?.filter(
                        (o) => o?.dimension === cur,
                    ),
                }
                return [...prev, it]
            },
            [],
        )

        const types: string[] = rowArr
            .filter((o) => o.list?.length > 0)
            .map((o) => o.type)
        setRadioTypes(types)
        setRadioType(types?.[0] || 'completeness')
        setRowShowList(rowArr)
    }, [explore_row_details])

    // 行级数据
    const rowList = useMemo(() => {
        return rowShowList?.find((o) => o.type === radioType)?.list || []
    }, [radioType, rowShowList])

    const handlePrev = useCallback(() => {
        if (!sliderRef.current) return
        sliderRef.current.swiper.slidePrev()
    }, [])

    const handleNext = useCallback(() => {
        if (!sliderRef.current) return
        sliderRef.current.swiper.slideNext()
    }, [])

    return (
        <div
            className={classnames(styles.dataPreviewViewWrapper, className)}
            style={{
                height: `100%`,
                overflowY: 'auto',
            }}
        >
            <div className={styles.viewRowRule}>
                {explore_row_details?.explore_details?.length > 0 ? (
                    <Tabs
                        defaultActiveKey={activeTab}
                        onChange={(key: string) => setActiveTab(key)}
                        items={[
                            {
                                key: 'view',
                                label: __('库表级质量'),
                            },
                            {
                                key: 'row',
                                label: __('行级质量'),
                            },
                        ]}
                    />
                ) : (
                    <div className={styles.viewRuleTitle}>
                        {__('库表级质量')}
                    </div>
                )}

                {/* 视图级 */}
                <div
                    className={styles['view-detail']}
                    hidden={activeTab === 'row'}
                >
                    {/* 图表 */}
                    <div className={styles['view-detail-list']}>
                        {/* 质量评分 */}
                        <QualityScoreCard data={dataQulityScore} />
                        {/* 维度评分 */}
                        <DimensionScoreCard
                            data={radarMapData}
                            isEmpty={typeof dataQulityScore !== 'number'}
                        />
                        {/* 质量检测条目数统计 */}
                        <CheckListCard data={overview?.fields} />
                        {/* 各维度评分历史趋势 */}
                        <HistoryTrendCard
                            isEmpty={getScoreTrendEmpytStatus()}
                            data={transTypeValue(overview?.score_trend)}
                        />
                    </div>
                    {/* 元数据及更新时间 */}
                    <div className={styles['view-detail-cards']}>
                        <Swiper
                            ref={sliderRef}
                            slidesPerView={4}
                            spaceBetween={14}
                            modules={[Navigation]}
                            navigation={{
                                prevEl: '.prev-arrow',
                                nextEl: '.next-arrow',
                            }}
                            className={styles.swiper}
                        >
                            {confTimeliness && (
                                <SwiperSlide>
                                    <UpdateTimeCard
                                        loading={timeLoading}
                                        data={probeTime}
                                        isPass={isTimelinessPass}
                                        onClick={() => {
                                            setCurrentRuleInfo({
                                                rule_name: '数据及时性检查',
                                                rule_description:
                                                    '通过数据业务更新时间与更新周期进行比较',
                                                rule_config: JSON.stringify({
                                                    update_period:
                                                        confTimeliness,
                                                }),
                                            })
                                            setRuleDetailOpen(true)
                                            setRuleType('view')
                                        }}
                                        field={
                                            updateField?.field_business_name ||
                                            ''
                                        }
                                    />
                                </SwiperSlide>
                            )}
                            {ruleCards?.map((it) => {
                                return (
                                    <SwiperSlide key={it.rule_id}>
                                        <ListCard
                                            data={it}
                                            onClick={() => {
                                                const { rule_id, ...rest } =
                                                    it || {}
                                                setCurrentRuleInfo(rest)
                                                setRuleDetailOpen(true)
                                                setRuleType('view')
                                            }}
                                        />
                                    </SwiperSlide>
                                )
                            })}
                        </Swiper>

                        <div
                            className="arrow-btn prev-arrow"
                            onClick={handlePrev}
                        >
                            <FontIcon
                                name="icon-xiala"
                                type={IconType.FONTICON}
                            />
                        </div>
                        <div
                            className="arrow-btn next-arrow"
                            onClick={handleNext}
                        >
                            <FontIcon
                                name="icon-xiala"
                                type={IconType.FONTICON}
                            />
                        </div>
                    </div>
                </div>
                {/* 行级 */}
                <div className={styles.thirdLine} hidden={activeTab === 'view'}>
                    <div>
                        <RowQualityCard data={rowShowList} />
                    </div>
                    <div>
                        <div
                            className={classnames(
                                styles.thirdList,
                                styles.rowList,
                            )}
                        >
                            <div
                                className={styles.thirdTitle}
                                style={{ padding: '16px 20px 12px' }}
                            >
                                <div>{__('行级规则评分')}</div>
                                <div hidden={radioTypes?.length <= 1}>
                                    <Radio.Group
                                        value={radioType}
                                        className={styles.radioGroup}
                                        onChange={(e) =>
                                            setRadioType(e.target.value)
                                        }
                                    >
                                        {radioTypes?.map((key) => (
                                            <Radio.Button
                                                className={styles.groupButton}
                                                value={key}
                                                key={key}
                                            >
                                                {ScoreType[KVMap[key]]}
                                            </Radio.Button>
                                        ))}
                                    </Radio.Group>
                                </div>
                            </div>
                            <div className={styles.lists}>
                                {rowList?.map((item) => (
                                    <div className={styles.ruleScoreItem}>
                                        <a
                                            className={styles.ruleTitle}
                                            title={item?.rule_name}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                const { rule_id, ...rest } =
                                                    item || {}
                                                setCurrentRuleInfo(rest)
                                                setRuleDetailOpen(true)
                                                setRuleType('row')
                                            }}
                                        >
                                            {item?.rule_name}
                                        </a>

                                        {getIconScore(
                                            getScore(
                                                item?.[
                                                    KVMap?.[item?.dimension]
                                                ],
                                            ),
                                        )}
                                    </div>
                                ))}
                                {!rowList?.length && empty(__('暂无数据'))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <FieldsInfo
                    data={data?.explore_field_details}
                    fieldsList={data?.formView?.fields}
                />
            </div>

            {fieldPreviewOpen && (
                <FieldStatistics
                    data={explore_field_details}
                    open={fieldPreviewOpen}
                    onClose={() => setFieldPreviewOpen(false)}
                />
            )}

            {ruleDetailOpen && (
                <RuleDetail
                    type={ruleType}
                    open={ruleDetailOpen}
                    onClose={() => {
                        setRuleDetailOpen(false)
                        setRuleType(undefined)
                        setCurrentRuleInfo(undefined)
                    }}
                    ruleId={currentRuleInfo?.rule_id}
                    ruleInfo={currentRuleInfo}
                />
            )}
        </div>
    )
}

export default ViewQualityReport
