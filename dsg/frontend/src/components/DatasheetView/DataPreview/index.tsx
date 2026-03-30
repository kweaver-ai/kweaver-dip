import classnames from 'classnames'
import { useEffect, useState } from 'react'
import {
    ExplorationType,
    explorationTaskStatus,
} from '@/components/DatasheetView/DatasourceExploration/const'
import {
    formatError,
    getDatasheetViewDetails,
    getDatasourceConfig,
    getExploreReport,
    getExploreReportStatus,
} from '@/core'
import Loader from '@/ui/Loader'
import { useDataViewContext } from '../DataViewProvider'
import DataPreviewView from './DataPreviewView'
import styles from './styles.module.less'
import DatasourceExploration from '../DatasourceExploration'

interface IDataPreview {
    dataViewId: string
    // 样例数据是否需要权限控制，为true则传userid，否则不传
    isNeedPermisControl?: boolean
    // 是否数据服务超市
    isMarket?: boolean
    // 服务超市-是否是库表owner（是则只显示样例数据不显示合成数据）
    isOwner?: boolean
    formViewStatus?: string
    // 是否审核待办
    isAudit?: boolean
}

const DataPreview = (props: IDataPreview) => {
    const {
        dataViewId,
        formViewStatus,
        isNeedPermisControl = true,
        isMarket = false,
        isOwner = false,
        isAudit = false,
    } = props

    const [exploreReportData, setExploreReportData] = useState<any>({})
    const [loading, setLoading] = useState<boolean>(true)
    const [hasExploreProcessing, setHasExploreProcessing] =
        useState<boolean>(false)
    const { setExplorationData } = useDataViewContext()
    /** 图表是否存在 */
    const [tableExist, setTableExist] = useState<boolean>(false)
    /** 是否有探查结果 */
    const [hasExploreResult, setHasExploreResult] = useState<boolean>(false)

    const [showJobConfig, setShowJobConfig] = useState<boolean>(false)
    const [formView, setFormView] = useState<any>({})
    useEffect(() => {
        if (dataViewId) {
            initData()
        }
    }, [dataViewId])
    /** 初始化加载 */
    const initData = () => {
        setLoading(true)
        Promise.allSettled([
            /** 获取探查报告 */
            getExploreReport({
                id: dataViewId,
            }),
            /** 查询探查状态 */
            getExploreReportStatus({
                form_view_id: dataViewId,
            }),
            /** 查询库表详情 */
            getDatasheetViewDetails(dataViewId, {
                enable_data_protection: true,
            }),
        ])
            .then((results: any) => {
                const [
                    { value: reportRes },
                    { value: statusRes },
                    { value: dataViewRes },
                ] = results
                const errors = results?.filter(
                    (o, idx) => idx !== 1 && o.status === 'rejected',
                )
                if (errors?.length) {
                    if (errors[0]?.reason?.status !== 404) {
                        formatError(errors[0]?.reason)
                    }
                }
                setFormView({
                    id: dataViewId,
                    ...dataViewRes,
                })

                const fieldList = dataViewRes?.fields

                setTableExist(dataViewRes?.status === 'delete')
                setExploreReportData((prev) => ({
                    ...prev,
                    ...(reportRes || {}),
                    formView: dataViewRes,
                }))
                setExplorationData((prev) => ({
                    ...prev,
                    fieldList,
                    dataViewId,
                    explorationType: ExplorationType.FormView,
                }))
                const hasRuleConf = !!reportRes?.explore_view_details

                if (hasRuleConf) {
                    const confData = {
                        total_sample: reportRes?.total_sample || 0,
                        dataViewId,
                    }
                    setExplorationData((prev) => ({
                        ...prev,
                        ...confData,
                    }))
                }
                // 是否有进行中的任务
                setHasExploreProcessing(
                    statusRes
                        ?.filter((o) => o?.explore_type === 'explore_data')
                        ?.some((o) =>
                            [
                                explorationTaskStatus.Queuing,
                                explorationTaskStatus.Running,
                            ].includes(o.status),
                        ),
                )
                // 是否有报告
                setHasExploreResult(!!reportRes)
            })
            .finally(() => {
                setLoading(false)
            })
    }

    const handleExploreCallback = async () => {
        Promise.allSettled([
            /** 获取探查报告 */
            getExploreReport({
                id: dataViewId,
            }),
            /** 查询探查状态 */
            getExploreReportStatus({
                form_view_id: dataViewId,
            }),
        ]).then((results: any) => {
            const [{ value: reportRes }, { value: statusRes }] = results
            const errors = results?.filter(
                (o, idx) => idx !== 0 && o.status === 'rejected',
            )
            if (errors?.length) {
                formatError(errors[0]?.reason)
            }

            setExploreReportData((prev) => ({
                ...prev,
                ...(reportRes || {}),
            }))

            // 是否有进行中的任务
            setHasExploreProcessing(
                statusRes
                    ?.filter((o) => o?.explore_type === 'explore_data')
                    ?.some((o) =>
                        [
                            explorationTaskStatus.Queuing,
                            explorationTaskStatus.Running,
                        ].includes(o.status),
                    ),
            )
            // 是否有报告
            setHasExploreResult(!!reportRes)
        })
    }

    /** 配置探查规则 */
    const showExploreConf = () => {
        setHasExploreResult(false)
        setShowJobConfig(true)
    }

    /** 关闭配置 */
    const closeExploreConf = () => {
        setHasExploreResult(false)
        setShowJobConfig(false)
        /** 重新加载 */
        initData()
    }

    return (
        <div
            className={classnames(
                styles.dataPreviewWrapper,
                isMarket && styles.isMarket,
            )}
        >
            {loading ? (
                <div style={{ paddingTop: '20vh' }}>
                    <Loader />
                </div>
            ) : (
                <DataPreviewView
                    dataViewId={dataViewId}
                    data={exploreReportData}
                    configHandle={() => showExploreConf()}
                    onExploreCallback={handleExploreCallback}
                    isMarket={isMarket}
                    isAudit={isAudit}
                    isOwner={isOwner}
                    hasReport={hasExploreResult}
                    canExplore={tableExist}
                    formViewStatus={formViewStatus}
                    isNeedPermisControl={isNeedPermisControl}
                    exploreProcessing={hasExploreProcessing}
                    refresh={() => initData()}
                />
            )}

            {showJobConfig && (
                <DatasourceExploration
                    open={showJobConfig}
                    onClose={() => {
                        closeExploreConf()
                    }}
                    type={ExplorationType.FormView}
                    formView={formView}
                />
            )}
        </div>
    )
}

export default DataPreview
