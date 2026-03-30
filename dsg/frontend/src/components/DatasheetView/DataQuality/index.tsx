import React, { useEffect, useState, useMemo, ReactNode } from 'react'
import { Button, Space, Tooltip, Row, message } from 'antd'
import classnames from 'classnames'
import __ from './locale'
import styles from './styles.module.less'
import {
    formatError,
    getExploreReport,
    getExploreReportStatus,
    IExploreReportRes,
    executeProjectsConfigRule,
    getDatasheetViewDetails,
    getDataViewBaseInfo,
    getDatasourceConfig,
    createExploreTask,
} from '@/core'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import DataQualityView from './DataQualityView'
import JobConfig from './JobConfig'
import Loader from '@/ui/Loader'
import { useQuery } from '@/utils'
import {
    explorationTaskStatus,
    explorationContentType,
} from '@/components/DatasheetView/DatasourceExploration/const'

interface IDataQuality {
    dataViewId: string
    // 是否数据服务超市
    isMarket?: boolean
}

const DataQuality = (props: IDataQuality) => {
    const { dataViewId, isMarket = false } = props
    const query = useQuery()
    const targetTab = query.get('targetTab')
    const [exploreReportData, setExploreReportData] = useState<any>({})
    const [exploreReportStatus, setExploreReportStatus] =
        useState<IExploreReportRes>({
            explore_job_id: '',
            explore_job_version: '',
            status: 'RUNNING',
        })
    const [showDataQualityView, setShowDataQualityView] =
        useState<boolean>(false)
    const [showJobConfig, setShowJobConfig] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(true)
    const [disabledConfigBtn, setDisabledConfigBtn] = useState<boolean>(false)

    useEffect(() => {
        getExploreReportData()
    }, [])

    const empty = () => {
        return (
            <Empty
                className={styles.emptyBox}
                iconSrc={dataEmpty}
                desc={
                    <div>
                        <div
                            style={{
                                marginBottom: '20px',
                                textAlign: 'center',
                            }}
                        >
                            {isMarket
                                ? __('暂无结果')
                                : exploreReportData?.ret_flag === 1
                                ? __('暂无结果，请先配置数据探查规则')
                                : exploreReportStatus?.status === 'RUNNING'
                                ? __('数据探查中，请耐心等待')
                                : __('暂无结果')}
                        </div>
                        {!isMarket && (
                            <div style={{ textAlign: 'center' }}>
                                {exploreReportData?.ret_flag === 1 ? (
                                    <Tooltip
                                        title={
                                            disabledConfigBtn
                                                ? __(
                                                      '源表已删除，无法配置数据探查规则',
                                                  )
                                                : ''
                                        }
                                    >
                                        <Button
                                            disabled={disabledConfigBtn}
                                            onClick={() => JobConfigClick()}
                                        >
                                            {__('配置数据探查规则')}
                                        </Button>
                                    </Tooltip>
                                ) : exploreReportStatus?.status ===
                                  'RUNNING' ? (
                                    <Space>
                                        <Button type="primary" disabled>
                                            {__('探查中...')}
                                        </Button>
                                        <Tooltip
                                            title={
                                                disabledConfigBtn
                                                    ? __(
                                                          '源表已删除，无法配置数据探查规则',
                                                      )
                                                    : ''
                                            }
                                        >
                                            <Button
                                                disabled={disabledConfigBtn}
                                                onClick={() => JobConfigClick()}
                                            >
                                                {__('配置数据探查规则')}
                                            </Button>
                                        </Tooltip>
                                    </Space>
                                ) : (
                                    <Space>
                                        <Tooltip
                                            title={
                                                disabledConfigBtn
                                                    ? __('源表已删除，无法探查')
                                                    : ''
                                            }
                                        >
                                            <Button
                                                onClick={() => executeJob()}
                                                type="primary"
                                                disabled={disabledConfigBtn}
                                            >
                                                {__('开始探查')}
                                            </Button>
                                        </Tooltip>
                                        <Tooltip
                                            title={
                                                disabledConfigBtn
                                                    ? __(
                                                          '源表已删除，无法配置数据探查规则',
                                                      )
                                                    : ''
                                            }
                                        >
                                            <Button
                                                disabled={disabledConfigBtn}
                                                onClick={() => JobConfigClick()}
                                            >
                                                {__('配置数据探查规则')}
                                            </Button>
                                        </Tooltip>
                                    </Space>
                                )}
                            </div>
                        )}
                    </div>
                }
            />
        )
    }

    const getExploreReportData = async () => {
        try {
            const res = await getExploreReport({
                id: dataViewId,
            })
            const baseInfo = await getDatasheetViewDetails(dataViewId)
            const business_update_time_field = baseInfo?.fields?.find(
                (item) => item.business_timestamp,
            )
            setDisabledConfigBtn(baseInfo?.status === 'delete')
            setShowDataQualityView(res?.ret_flag === 3)
            setExploreReportData({
                ...res,
                data: {
                    ...(res.data || {}),
                    business_update_time: baseInfo?.business_update_time,
                    business_update_time_field,
                },
            })
            if ((res?.ret_flag === 3 || res?.ret_flag === 2) && !isMarket) {
                getExploreReportDataStatus()
            } else {
                setExploreReportStatus({
                    explore_job_id: '',
                    explore_job_version: '',
                    status: '',
                })
            }
            // 通过列表发起探查，没有报告时，进入配置页面
            if (targetTab && res?.ret_flag !== 3 && !showJobConfig) {
                JobConfigClick()
            }
        } catch (err) {
            // formatError(err)
            setExploreReportData({
                ret_flag: 1,
            })
        } finally {
            setLoading(false)
        }
    }
    const getExploreReportDataStatus = async () => {
        try {
            const resStatus = await getExploreReportStatus({
                form_view_id: dataViewId,
            })
            const status =
                resStatus?.find((item) => item.explore_type === 'explore_data')
                    ?.status || ''
            setExploreReportStatus({
                ...exploreReportStatus,
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

    const JobConfigClick = () => {
        setShowDataQualityView(false)
        setShowJobConfig(true)
    }

    const jobConfigClose = () => {
        setShowDataQualityView(false)
        setLoading(true)
        setShowJobConfig(false)
        getExploreReportData()
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

    return (
        <div
            className={classnames(
                styles.dataQualityWrapper,
                isMarket && styles.isMarket,
                !showDataQualityView && !showJobConfig && styles.isEmpty,
            )}
        >
            {loading ? (
                <Loader />
            ) : showDataQualityView ? (
                <DataQualityView
                    dataViewId={dataViewId}
                    data={exploreReportData?.data}
                    configHandle={() => JobConfigClick()}
                    isMarket={isMarket}
                    exploreReportStatus={exploreReportStatus}
                    disabledConfigBtn={disabledConfigBtn}
                />
            ) : showJobConfig ? (
                <JobConfig
                    id={dataViewId}
                    onClose={() => jobConfigClose()}
                    exploreReportStatus={exploreReportStatus}
                />
            ) : (
                empty()
            )}
        </div>
    )
}

export default DataQuality
