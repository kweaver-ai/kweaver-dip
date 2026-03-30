import React, { useEffect, useMemo, useState } from 'react'
import {
    Button,
    Space,
    Col,
    Row,
    Table,
    Progress,
    message,
    Tooltip,
} from 'antd'
import classnames from 'classnames'
import moment from 'moment'
import { max, isString } from 'lodash'
import { InfoCircleOutlined } from '@ant-design/icons'
import __ from './locale'
import styles from './styles.module.less'
import {
    formatError,
    createExploreTask,
    getDatasourceConfig,
    IExploreReportRes,
    getExploreReportStatus,
    getBusinessUpdateTime,
} from '@/core'
import Empty from '@/ui/Empty'
import { SubTitle } from '@/components/DataAssetsCatlg/helper'
import { DashBoard, RadarMap, LineGraph } from './g2plotConfig'
import { SearchInput, Loader } from '@/ui'
import FieldsDetailsModal from './FieldsDetailsModal'
import dataEmpty from '@/assets/dataEmpty.svg'
import { QualityScoreTips, QualityScoreDimensionTips } from './helper'
import { getFieldTypeEelment } from '@/components/DatasheetView/helper'
import { DataTypeNumberToString } from './const'
import {
    explorationTaskStatus,
    explorationContentType,
} from '@/components/DatasheetView/DatasourceExploration/const'
import {
    TimeRender,
    isValidTime,
} from '@/components/DataAssetsCatlg/LogicViewDetail/helper'

interface IDataQualityView {
    data: any
    configHandle?: () => void
    dataViewId: string
    isMarket?: boolean
    disabledConfigBtn?: boolean
    exploreReportStatus: IExploreReportRes | undefined
}

const DataQualityView = (props: IDataQualityView) => {
    const {
        data,
        dataViewId,
        configHandle,
        exploreReportStatus,
        isMarket,
        disabledConfigBtn,
    } = props

    const [radarMapData, setRadarMapData] = useState<any[]>()
    const [fillteTableData, setFillteTableData] = useState<any[]>([])
    const [searchKey, setSearchKey] = useState<any>()
    const [currentDetails, setCurrentDetails] = useState<any>({})
    const [reportStatus, setReportStatus] = useState<any>({})
    const [fieldsDetails, setFieldsDetails] = useState<boolean>(false)
    const [isProbe, setIsProbe] = useState<boolean>(false)
    const [probeTime, setProbeTime] = useState<any>({})
    const [timeLoading, setTimeLoading] = useState(false)

    useEffect(() => {
        getRadarMapData()
        getRadarMapDataEmpytStatus()
        setFillteTableData(data?.explore_details || [])
        setIsProbe(!!data?.business_update_time_field?.id)
    }, [data])

    useEffect(() => {
        if (dataViewId) {
            getProbeUpdateTime()
        }
    }, [dataViewId])

    const getProbeUpdateTime = async () => {
        try {
            setTimeLoading(true)
            const res = await getBusinessUpdateTime(dataViewId)
            const time = res?.business_update_time
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

    const column: Array<any> = [
        {
            title: '字段业务名称/技术名称',
            ellipsis: true,
            width: '25%',
            render: (_, record) => {
                return (
                    <div className={styles.fieldNames}>
                        <div className={styles.fieldIcon}>
                            {getFieldTypeEelment(
                                {
                                    ...record,
                                    type: DataTypeNumberToString(
                                        record.field_type,
                                    ),
                                },
                                20,
                            )}
                        </div>
                        <div style={{ maxWidth: 'calc(100% - 20px)' }}>
                            <div
                                className={styles.fieldCnNames}
                                title={record.field_name_cn}
                            >
                                {record.field_name_cn || '--'}
                            </div>
                            <div
                                className={styles.fieldEnNames}
                                title={record.field_name_en}
                            >
                                {record.field_name_en}
                            </div>
                        </div>
                    </div>
                )
            },
        },
        {
            title: __('准确性'),
            dataIndex: 'accuracy_score',
            ellipsis: true,
            sorter: {
                compare: (a, b) => a.accuracy_score - b.accuracy_score,
            },
            render: (text) => text || '--',
        },
        {
            title: __('完整性'),
            dataIndex: 'completeness_score',
            ellipsis: true,
            sorter: {
                compare: (a, b) => a.completeness_score - b.completeness_score,
            },
            render: (text) => text || '--',
        },
        // {
        //     title: __('一致性'),
        //     dataIndex: 'consistency_score',
        //     ellipsis: true,
        //     sorter: {
        //         compare: (a, b) => a.consistency_score - b.consistency_score,
        //     },
        //     render: (text) => text || '--',
        // },
        {
            title: __('有效性'),
            dataIndex: 'validity_score',
            ellipsis: true,
            sorter: {
                compare: (a, b) => a.validity_score - b.validity_score,
            },
            render: (text) => text || '--',
        },
        {
            title: __('唯一性'),
            dataIndex: 'uniqueness_score',
            ellipsis: true,
            sorter: {
                compare: (a, b) => a.uniqueness_score - b.uniqueness_score,
            },
            render: (text) => text || '--',
        },
        // {
        //     title: __('及时性'),
        //     dataIndex: 'timeliness_score',
        //     ellipsis: true,
        //     sorter: {
        //         compare: (a, b) => a.timeliness_score - b.timeliness_score,
        //     },
        //     render: (text) => text || '--',
        // },
        {
            title: __('操作'),
            key: 'action',
            width: 120,
            render: (text, record) => {
                return (
                    <Button
                        onClick={() => {
                            setCurrentDetails(record)
                            setFieldsDetails(true)
                        }}
                        type="link"
                    >
                        {__('详情')}
                    </Button>
                )
            },
        },
    ]

    // 及时性评分
    const timelinessScore = useMemo(() => {
        let score: any = null
        const { business_update_time } = data || {}
        if (business_update_time) {
            score = moment()
                .startOf('day')
                .diff(moment(business_update_time).startOf('day'), 'days')
            // 过滤未来时间
            if (score < 0) return null
            return max([100 - score, 0])
        }
        return score
    }, [data])

    const getRadarMapData = () => {
        const itemList = [
            { item: __('准确性'), score: data?.overview?.accuracy_score },
            { item: __('完整性'), score: data?.overview?.completeness_score },
            // { item: __('一致性'), score: data?.overview?.consistency_score },
            { item: __('有效性'), score: data?.overview?.validity_score },
            { item: __('唯一性'), score: data?.overview?.uniqueness_score },
            {
                item: __('及时性'),
                score: timelinessScore,
            },
        ]
        setRadarMapData(itemList)
    }

    // 数据质量评分
    const dataQulityScore = useMemo(() => {
        let score
        try {
            const validScoreList = radarMapData?.filter(
                (item) => typeof item.score === 'number',
            )
            const count = validScoreList?.length
            if (typeof count === 'number') {
                const sum = validScoreList
                    ?.map((item) => item.score)
                    .reduce((num, res) => num + res)
                if (sum >= 0) {
                    // 取整
                    score = Math.trunc(sum / count)
                }
            }
        } catch (e) {
            // console.log(e)
        }
        return score
    }, [radarMapData])

    const getRadarMapDataEmpytStatus = () => {
        const fieldList = [
            'completeness_score',
            'uniqueness_score',
            'timeliness_score',
            // 'consistency_score',
            'validity_score',
            'accuracy_score',
        ]
        const flag: boolean = fieldList.every(
            (item) => data?.overview?.[item] === null,
        )
        return flag
    }

    const getScoreTrendEmpytStatus = () => {
        const score =
            data?.overview?.score_trend.map((item) => item.score) || []
        const flag: boolean = score.every((item) => item === null)
        return flag
    }

    const executeJob = async () => {
        try {
            // 查询配置字段
            const configRes = await getDatasourceConfig({
                form_view_id: dataViewId,
            })
            const config = configRes?.config || ''
            await createExploreTask({
                form_view_id: dataViewId,
                type: explorationContentType.Quality,
                config,
            })
            message.success(__('创建质量检测任务成功'))
            getExploreReportDataStatus()
        } catch (err) {
            formatError(err)
        }
    }

    const getExploreReportDataStatus = async () => {
        try {
            const res = await getExploreReportStatus({
                form_view_id: dataViewId,
            })
            const status =
                res?.find((item) => item.explore_type === 'explore_data')
                    ?.status || ''
            setReportStatus({
                status:
                    status === explorationTaskStatus.Queuing ||
                    status === explorationTaskStatus.Running
                        ? 'RUNNING'
                        : '',
            })
        } catch (err) {
            formatError(err)
        }
    }

    const empty = (desc: string | React.ReactElement) => {
        return <Empty iconSrc={dataEmpty} desc={desc} />
    }

    return (
        <div
            className={classnames(
                styles.dataQualityViewWrapper,
                isMarket && styles.marketWrapper,
            )}
        >
            {!isMarket && (
                <div className={styles.header}>
                    <div className={styles.left}>{__('质量预览')}</div>
                    <div className={styles.right}>
                        <span className={styles.time}>
                            {__('检测时间：')}
                            {moment(data?.explore_time).format(
                                'YYYY-MM-DD HH:mm:ss',
                            )}
                        </span>
                        <Space>
                            <Tooltip
                                title={
                                    disabledConfigBtn
                                        ? __('源表已删除，无法配置数据探查规则')
                                        : ''
                                }
                            >
                                <Button
                                    disabled={disabledConfigBtn}
                                    onClick={() => configHandle?.()}
                                >
                                    {__('配置数据探查规则')}
                                </Button>
                            </Tooltip>
                            <Tooltip
                                title={
                                    disabledConfigBtn
                                        ? __('源表已删除，无法检测质量')
                                        : ''
                                }
                            >
                                <Button
                                    disabled={
                                        exploreReportStatus?.status ===
                                            'RUNNING' ||
                                        reportStatus?.status === 'RUNNING' ||
                                        disabledConfigBtn
                                    }
                                    onClick={() => executeJob()}
                                    type="primary"
                                >
                                    {exploreReportStatus?.status ===
                                        'RUNNING' ||
                                    reportStatus?.status === 'RUNNING'
                                        ? __('探查中...')
                                        : __('检测质量')}
                                </Button>
                            </Tooltip>
                        </Space>
                    </div>
                </div>
            )}
            <div className={styles.secondLine}>
                <div className={styles.plotWrapper}>
                    <div
                        className={classnames(
                            styles.plotTitle,
                            dataQulityScore && styles.mb,
                        )}
                    >
                        <SubTitle showIcon={isMarket} text={__('质量评分')} />
                        {QualityScoreTips()}
                    </div>
                    {dataQulityScore ? (
                        <DashBoard dataInfo={dataQulityScore || 0} />
                    ) : (
                        empty(__('暂无质量评分'))
                    )}
                </div>
                <div className={styles.plotWrapper}>
                    <div className={styles.plotTitle}>
                        <SubTitle showIcon={isMarket} text={__('维度评分')} />
                        {QualityScoreDimensionTips()}
                    </div>
                    {typeof dataQulityScore !== 'number' ? (
                        empty(__('暂无维度评分'))
                    ) : (
                        <RadarMap
                            padding={[5, 0, 0, 0]}
                            dataInfo={radarMapData || []}
                        />
                    )}
                </div>
                <div className={styles.plotWrapper}>
                    <SubTitle
                        showIcon={isMarket}
                        text={__('质量检测条目数统计')}
                    />
                    <div className={styles.fourth}>
                        <Progress
                            className={styles.fourthProgress}
                            type="circle"
                            percent={Math.round(
                                ((data?.overview?.fields?.explore_count || 0) /
                                    (data?.overview?.fields?.total_count ||
                                        1)) *
                                    100,
                            )}
                            width={200}
                            format={(percent) => `${percent}%`}
                            strokeColor="#59A4FF"
                        />
                        <div className={styles.fourthLegend}>
                            <div className={styles.legendBox}>
                                <span className={styles.legendDot} />
                                <span
                                    title={__('检测字段数')}
                                    className={styles.legendLabel}
                                >
                                    {__('检测字段数：')}
                                </span>
                                <span className={styles.legendValue}>
                                    {data?.overview?.fields?.explore_count}
                                </span>
                            </div>
                            <div className={styles.legendBox}>
                                <span
                                    className={classnames(
                                        styles.legendDot,
                                        styles.total,
                                    )}
                                />
                                <span
                                    title={__('表字段总数')}
                                    className={styles.legendLabel}
                                >
                                    {__('表字段总数：')}
                                </span>
                                <span className={styles.legendValue}>
                                    {data?.overview?.fields?.total_count || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                {isProbe && (
                    <div className={styles.plotWrapper}>
                        <SubTitle
                            showIcon={isMarket}
                            text={__('业务数据更新时间')}
                        />
                        {timeLoading ? (
                            <Loader />
                        ) : probeTime?.date ? (
                            <div className={styles.timeBox}>
                                <div className={styles.year}>{`${
                                    probeTime?.year
                                }${__('年')}${probeTime?.month}${__(
                                    '月',
                                )}`}</div>
                                <div>
                                    <span className={styles.day}>
                                        {probeTime?.day}
                                    </span>
                                    <span className={styles.unit}>
                                        {__('日')}
                                    </span>
                                </div>
                                <div className={styles.hms}>
                                    {probeTime?.hms}
                                    <Tooltip
                                        title={__('数据取值于「${fied}」字段', {
                                            fied:
                                                data?.business_update_time_field
                                                    ?.business_name || '',
                                        })}
                                    >
                                        <InfoCircleOutlined
                                            className={styles.icon}
                                        />
                                    </Tooltip>
                                </div>
                            </div>
                        ) : (
                            empty(
                                <TimeRender
                                    timeField={{
                                        ...data?.business_update_time_field,
                                        business_update_time:
                                            data?.business_update_time,
                                    }}
                                    formViewId=""
                                    deafText={__('暂无数据')}
                                />,
                            )
                        )}
                    </div>
                )}
                <div className={styles.plotWrapper}>
                    <SubTitle
                        showIcon={isMarket}
                        text={__('质量评分历史趋势')}
                    />

                    {getScoreTrendEmpytStatus() ? (
                        empty(__('暂无质量评分历史趋势'))
                    ) : (
                        <div className={styles.lineBox}>
                            <LineGraph
                                dataInfo={
                                    data?.overview?.score_trend.map((item) => {
                                        return {
                                            ...item,
                                            explore_time: moment(
                                                item.explore_time,
                                            ).format('YYYY-MM-DD HH:mm:ss'),
                                        }
                                    }) || []
                                }
                            />
                        </div>
                    )}
                </div>
            </div>
            <div className={styles.thirdLine}>
                <div className={styles.thirdTitle}>
                    <SubTitle showIcon={isMarket} text={__('字段评分')} />
                    <SearchInput
                        value={searchKey}
                        onKeyChange={(kw: string) => {
                            // 至少搜索过一次之后的清空操作
                            setFillteTableData(
                                kw
                                    ? data?.explore_details.filter((item) => {
                                          return (
                                              item.field_name_cn.includes(kw) ||
                                              item.field_name_en
                                                  .toLocaleLowerCase()
                                                  .includes(
                                                      kw.toLocaleLowerCase(),
                                                  )
                                          )
                                      })
                                    : data?.explore_details,
                            )
                            setSearchKey(kw)
                        }}
                        placeholder={__('搜索字段业务名称/技术名称')}
                        style={{ width: 272 }}
                        maxLength={128}
                    />
                </div>
                <div className={styles.thirdTable}>
                    {!fillteTableData?.length ? (
                        empty(__('暂无数据'))
                    ) : (
                        <Table
                            rowKey="field_name_en"
                            columns={column}
                            bordered={false}
                            locale={{
                                emptyText: <Empty />,
                            }}
                            dataSource={fillteTableData}
                            pagination={false}
                        />
                    )}
                </div>
            </div>

            {fieldsDetails && (
                <FieldsDetailsModal
                    open={fieldsDetails}
                    onClose={() => setFieldsDetails(false)}
                    data={currentDetails}
                />
            )}
        </div>
    )
}

export default DataQualityView
