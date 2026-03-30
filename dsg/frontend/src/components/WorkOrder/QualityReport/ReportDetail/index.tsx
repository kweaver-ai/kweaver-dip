import { Drawer } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import { MenuProps } from 'antd/lib/menu'
import moment from 'moment'
import Return from '../../Return'
import styles from './styles.module.less'
import {
    formatError,
    getDatasheetViewDetails,
    getDatasourceConfig,
    getExploreReport,
} from '@/core'
import { ExplorationType } from '@/components/DatasheetView/DatasourceExploration/const'
import __ from './locale'
import { useDataViewContext } from '@/components/DatasheetView/DataViewProvider'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import CorrectionOptModal from '../../WorkOrderType/QualityOrder/OptModal'
import { OrderType } from '../../helper'
import ReportDetailContent from './ReportDetailContent'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'

function ReportDetail({ item, visible, onClose, showCorrection = true }: any) {
    const [loading, setLoading] = useState<boolean>(false)
    const [formView, setFormView] = useState<any>()
    const [versionOpen, setVersionOpen] = useState<boolean>(false)
    const [exploreRuleConf, setExploreRuleConf] = useState<any>()
    const [exploreReportData, setExploreReportData] = useState<any>()
    const [correctionVisible, setCorrectionVisible] = useState<boolean>(false)
    const { setExplorationData } = useDataViewContext()
    const [{ third_party }] = useGeneralConfig()
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

                setExploreReportData((prev) => ({
                    ...prev,
                    ...(reportRes || {}),
                    formView: dataViewRes,
                }))

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

    useEffect(() => {
        if (item?.form_view_id) {
            initData(item?.form_view_id)
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

    return (
        <Drawer
            open={visible}
            contentWrapperStyle={{
                width: '100%',
                height: '100%',
                boxShadow: 'none',
                transform: 'none',
                marginTop: 0,
            }}
            style={{
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
            }}
            headerStyle={{ display: 'none' }}
            bodyStyle={{
                padding: '0 0 0 0',
                display: 'flex',
                flexDirection: 'column',
            }}
            destroyOnClose
            maskClosable={false}
            mask={false}
        >
            <div className={styles.reportDetail}>
                <div className={styles.header}>
                    <Return
                        onReturn={() => onClose(false)}
                        title={
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <FontIcon
                                    name="icon-shitusuanzi"
                                    type={IconType.COLOREDICON}
                                    style={{ fontSize: 16, marginRight: 8 }}
                                />
                                <span
                                    style={{
                                        display: 'inline-block',
                                        width: '140px',
                                        textOverflow: 'ellipsis',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {item?.business_name || '--'}
                                </span>
                            </div>
                        }
                    />
                </div>
                <ReportDetailContent
                    item={item}
                    showCorrection={showCorrection}
                />
            </div>

            {correctionVisible && (
                <CorrectionOptModal
                    item={item}
                    type={OrderType.QUALITY}
                    visible={correctionVisible}
                    onClose={() => setCorrectionVisible(false)}
                />
            )}
        </Drawer>
    )
}

export default ReportDetail
