import { Button, Drawer, Dropdown, message, Space, Tooltip } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import menu, { MenuProps } from 'antd/lib/menu'
import { DownOutlined, UpOutlined } from '@ant-design/icons'
import moment from 'moment'
import Return from '../../Return'
import styles from './styles.module.less'
import { RefreshBtn } from '@/components/ToolbarComponents'
import CardInfo from './CardInfo'
import FieldsInfo from './FieldsInfo'
import {
    delExplorationReport,
    formatError,
    getDatasheetViewDetails,
    getDatasourceConfig,
    getExploreReport,
} from '@/core'
import { ExplorationType } from '@/components/DatasheetView/DatasourceExploration/const'
import { Empty, Loader, ReturnConfirmModal } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import __ from './locale'
import { useDataViewContext } from '@/components/DatasheetView/DataViewProvider'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import CorrectionOptModal from '../../WorkOrderType/QualityOrder/OptModal'
import { OrderType } from '../../helper'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import DatasourceExploration from '@/components/DatasheetView/DatasourceExploration'

function ReportDetailContent({
    item,
    showCorrection = true,
    isMarket,
    showEvaluation,
}: any) {
    const [loading, setLoading] = useState<boolean>(false)
    const [formView, setFormView] = useState<any>()
    const [versionOpen, setVersionOpen] = useState<boolean>(false)
    const [exploreRuleConf, setExploreRuleConf] = useState<any>()
    const [exploreReportData, setExploreReportData] = useState<any>()
    const [correctionVisible, setCorrectionVisible] = useState<boolean>(false)
    const { isValueEvaluation, setExplorationData } = useDataViewContext()
    const [{ third_party }] = useGeneralConfig()
    const [hasReport, setHasReport] = useState<boolean>(false)
    const [canExplore, setCanExplore] = useState<boolean>(false)
    const [showJobConfig, setShowJobConfig] = useState<boolean>(false)
    /** 初始化加载 */
    const initData = (dataViewId: string, version?: number) => {
        setLoading(true)
        Promise.allSettled([
            /** 获取探查配置 */
            getDatasourceConfig({
                form_view_id: dataViewId,
            }),
            /** 获取探查报告 */
            getExploreReport({
                id: dataViewId,
                third_party: !!third_party,
                version,
            }),
            /** 查询库表详情 */
            getDatasheetViewDetails(dataViewId),
        ])
            .then((results: any) => {
                const [
                    { value: confRes },
                    { value: reportRes },
                    { value: dataViewRes },
                ] = results
                const errors = results?.filter(
                    (o, idx) => idx !== 1 && o.status === 'rejected',
                )
                if (errors?.length) {
                    formatError(errors[0]?.reason)
                }
                setFormView({
                    id: dataViewId,
                    ...dataViewRes,
                })

                const fieldList = dataViewRes?.fields
                setCanExplore(dataViewRes?.status === 'delete')
                setExploreReportData((prev) => ({
                    ...prev,
                    ...(reportRes || {}),
                    formView: dataViewRes,
                    dataViewId,
                }))

                setHasReport(!!reportRes)
                setExplorationData((prev) => ({
                    ...prev,
                    dataViewId,
                    fieldList,
                }))
                const hasRuleConf = !!confRes

                if (hasRuleConf) {
                    const ruleConf = JSON.parse(confRes?.config || '{}')
                    const confData = {
                        total_sample: ruleConf?.total_sample || 0,
                        dataViewId,
                        explorationType: ExplorationType.FormView,
                    }
                    setExploreRuleConf(ruleConf)
                    setExplorationData((prev) => ({
                        ...prev,
                        ...confData,
                    }))
                }
            })
            .finally(() => {
                setLoading(false)
            })
    }

    const onLoad = () => {
        initData(item?.form_view_id)
    }

    useEffect(() => {
        if (
            item?.form_view_id &&
            exploreReportData?.dataViewId !== item?.form_view_id
        ) {
            onLoad()
        }
    }, [item])

    const switchVersion = (version: number) => {
        if (version === exploreReportData?.version) {
            return
        }
        initData(item?.form_view_id, version)
    }

    const dropdownItems: MenuProps['items'] = useMemo(() => {
        const { overview } = exploreReportData || {}
        return (overview?.score_trend || []).reverse().map((o) => ({
            key: o?.version,
            label: (
                <div
                    onClick={() => {
                        switchVersion(o?.version)
                        setVersionOpen(false)
                    }}
                >
                    {exploreReportData?.version === o?.version ? (
                        <div>当前（v.{o?.version}）</div>
                    ) : (
                        <div>v.{o?.version}</div>
                    )}

                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                        {o?.explore_time
                            ? moment(o?.explore_time).format(
                                  'YYYY-MM-DD HH:mm:ss',
                              )
                            : '--'}
                    </div>
                </div>
            ),
        }))
    }, [exploreReportData])

    // 判断当前报告是否为最新报告
    const isLatestReport = useMemo(() => {
        const { overview } = exploreReportData || {}
        if (!overview?.score_trend?.length) return false

        // 获取所有版本并排序（从大到小）
        const allVersions = [...overview.score_trend].sort(
            (a, b) => b.version - a.version,
        )
        const latestVersion = allVersions[0]?.version

        return exploreReportData?.version === latestVersion
    }, [exploreReportData])

    const handleDeleteReport = () => {
        try {
            ReturnConfirmModal({
                title: __('确定要删除评估报告吗？'),
                content: __('删除后该评估报告将无法找回，请谨慎操作！'),
                cancelText: __('取消'),
                okText: __('确定'),
                onOK: async () => {
                    await delExplorationReport(exploreReportData?.task_id, {
                        task_version: exploreReportData?.version,
                    })
                    message.success(__('删除成功'))
                    onLoad()
                },
            })
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <div className={styles.content}>
            {loading ? (
                <div
                    style={{
                        flex: 1,
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Loader />
                </div>
            ) : exploreReportData ? (
                <>
                    <div className={styles.reportHeader}>
                        <div>
                            <div style={{ fontWeight: 'bold' }}>
                                {__('数据质量报告')}
                                <span
                                    hidden={
                                        !exploreReportData?.overview
                                            ?.score_trend?.length
                                    }
                                >
                                    v.
                                    {exploreReportData?.version || 0}
                                </span>
                            </div>
                            <div
                                style={{
                                    fontSize: 12,
                                    color: 'rgba(0,0,0,0.65)',
                                }}
                            >
                                {__('数据质量基于${tip}进行统计', {
                                    tip: exploreReportData?.total_sample
                                        ? `${
                                              exploreReportData?.total_sample
                                          }${__('条采样数据')}`
                                        : __('全量数据'),
                                })}
                            </div>
                        </div>
                        <div>
                            <span className={styles.time} hidden={!hasReport}>
                                {__('检测时间')}：
                                {moment(exploreReportData?.explore_time).format(
                                    'YYYY-MM-DD HH:mm:ss',
                                )}
                            </span>
                            {showEvaluation && (
                                <div hidden={isMarket}>
                                    <Tooltip
                                        title={
                                            canExplore
                                                ? __(
                                                      '源表已删除，无法配置探查规则',
                                                  )
                                                : ''
                                        }
                                    >
                                        <Button
                                            disabled={canExplore}
                                            onClick={() =>
                                                setShowJobConfig(true)
                                            }
                                        >
                                            {isValueEvaluation
                                                ? __('发起评估')
                                                : __('配置探查规则')}
                                        </Button>
                                    </Tooltip>
                                </div>
                            )}
                            {showCorrection && (
                                <div hidden={isMarket}>
                                    <Tooltip
                                        title={
                                            item?.status === 'added'
                                                ? __('此表整改中，暂时无法发起')
                                                : ''
                                        }
                                    >
                                        <Button
                                            type="default"
                                            onClick={() => {
                                                setCorrectionVisible(true)
                                            }}
                                            disabled={item?.status === 'added'}
                                        >
                                            {__('发起质量整改')}
                                        </Button>
                                    </Tooltip>
                                </div>
                            )}
                            <div
                                className={styles.versionDropdown}
                                hidden={
                                    !exploreReportData?.overview?.score_trend
                                        ?.length
                                }
                            >
                                <Dropdown
                                    open={versionOpen}
                                    menu={{ items: dropdownItems }}
                                    placement="bottom"
                                    trigger={['click']}
                                    onOpenChange={(open) => {
                                        setVersionOpen(open)
                                    }}
                                    overlayClassName={styles.versionPop}
                                >
                                    <Button
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            width: '152px',
                                        }}
                                    >
                                        {__('显示版本')}: v.
                                        {exploreReportData?.version || 0}
                                        {versionOpen ? (
                                            <UpOutlined
                                                style={{ fontSize: 12 }}
                                            />
                                        ) : (
                                            <DownOutlined
                                                style={{ fontSize: 12 }}
                                            />
                                        )}
                                    </Button>
                                </Dropdown>
                            </div>
                            <div className={styles.optBtn}>
                                <RefreshBtn
                                    onClick={() => {
                                        if (item?.form_view_id) {
                                            initData(item?.form_view_id)
                                        }
                                    }}
                                />
                            </div>
                            <div
                                className={styles.optBtn}
                                hidden={
                                    isLatestReport ||
                                    !showEvaluation ||
                                    isMarket
                                }
                            >
                                <span className={styles.deleteBtnBox}>
                                    <Tooltip placement="bottom" title="删除">
                                        <Button
                                            type="text"
                                            onClick={handleDeleteReport}
                                            className={styles.textBtn}
                                            icon={
                                                <FontIcon name="icon-lajitong" />
                                            }
                                        />
                                    </Tooltip>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <CardInfo
                            dataViewId={item?.form_view_id}
                            data={exploreReportData}
                            ruleConf={exploreRuleConf}
                        />
                    </div>
                    <div>
                        <FieldsInfo
                            data={exploreReportData?.explore_field_details}
                            fieldsList={exploreReportData?.formView?.fields}
                        />
                    </div>
                </>
            ) : (
                <div>
                    <Empty iconSrc={dataEmpty} desc="暂无数据" />
                </div>
            )}
            {correctionVisible && (
                <CorrectionOptModal
                    item={item}
                    type={OrderType.QUALITY}
                    visible={correctionVisible}
                    onClose={() => setCorrectionVisible(false)}
                />
            )}

            {showJobConfig && (
                <DatasourceExploration
                    open={showJobConfig}
                    onClose={() => {
                        setShowJobConfig(false)
                        onLoad()
                    }}
                    type={ExplorationType.FormView}
                    formView={formView}
                />
            )}
        </div>
    )
}

export default ReportDetailContent
