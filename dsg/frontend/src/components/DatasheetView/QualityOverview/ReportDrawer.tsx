import { DownOutlined, LeftOutlined, UpOutlined } from '@ant-design/icons'
import { Breadcrumb, Button, Drawer, Dropdown } from 'antd'
import moment from 'moment'
import { memo, useEffect, useMemo, useState } from 'react'
import menu, { MenuProps } from 'antd/lib/menu'
import { Loader } from '@/ui'
import {
    formatError,
    getDatasheetViewDetails,
    getExploreReport,
    getExploreReportStatus,
} from '@/core'
import ViewQualityReport from '../DataPreview/ViewQualityReport'
import { useDataViewContext } from '../DataViewProvider'
import __ from './locale'
import styles from './styles.module.less'
import ViewSelect, { RenderViewItem } from './ViewSelect'
import { RefreshBtn } from '@/components/ToolbarComponents'

const ReportDrawer = ({
    isOwner,
    departmentId,
    dataView,
    onClose,
}: {
    isOwner?: boolean
    departmentId?: string
    dataView: any
    onClose: () => void
}) => {
    const [exploreReportData, setExploreReportData] = useState<any>({})
    const [versionOpen, setVersionOpen] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)
    const [hasExploreResult, setHasExploreResult] = useState<boolean>(false)
    const { setExplorationData } = useDataViewContext()
    /** 图表是否存在 */
    const [tableExist, setTableExist] = useState<boolean>(false)
    const [checkedNode, setCheckedNode] = useState<any>()
    const [viewId, setViewId] = useState<string>()
    useEffect(() => {
        if (dataView) {
            setViewId(dataView?.form_view_id)
            setCheckedNode({
                form_view_id: dataView?.form_view_id,
                business_name: dataView?.business_name,
            })
        }
    }, [dataView])
    useEffect(() => {
        if (viewId) {
            initData(viewId)
        }
    }, [viewId])
    /** 初始化加载 */
    const initData = (dataViewId: string, version?: number) => {
        setLoading(true)
        Promise.allSettled([
            /** 获取探查报告 */
            getExploreReport({
                id: dataViewId!,
                version,
            }),
            /** 查询探查状态 */
            getExploreReportStatus({
                form_view_id: dataViewId!,
            }),
            /** 查询库表详情 */
            getDatasheetViewDetails(dataViewId!),
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
                    formatError(errors[0]?.reason)
                }

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
                }))
                const hasRuleConf = !!reportRes?.explore_view_details

                if (hasRuleConf) {
                    const confData = {
                        total_sample: reportRes?.total_sample || 0,
                        dataViewId: dataViewId!,
                    }
                    setExplorationData((prev) => ({
                        ...prev,
                        ...confData,
                    }))
                }

                // 是否有报告
                setHasExploreResult(!!reportRes)
            })
            .finally(() => {
                setLoading(false)
            })
    }

    const switchVersion = (version: number) => {
        if (version === exploreReportData?.version) {
            return
        }
        initData(viewId!, version)
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
            open
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
            <div className={styles['drawer-wrapper']}>
                <div className={styles['drawer-wrapper-header']}>
                    <div
                        onClick={onClose}
                        className={styles['drawer-wrapper-header-back']}
                    >
                        <LeftOutlined className={styles['back-icon']} />
                        <span className={styles['back-text']}>
                            {__('返回')}
                        </span>
                    </div>
                    <div className={styles['drawer-wrapper-header-title']}>
                        <Breadcrumb>
                            {isOwner && (
                                <Breadcrumb.Item>
                                    <a
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onClose?.()
                                        }}
                                    >
                                        {__('部门质量详情')}
                                    </a>
                                </Breadcrumb.Item>
                            )}
                            <Breadcrumb.Item>
                                {__('库表质量报告')}
                            </Breadcrumb.Item>
                        </Breadcrumb>
                    </div>
                </div>
                <div className={styles['drawer-wrapper-content']}>
                    <div className={styles['report-wrapper']}>
                        <div className={styles['report-wrapper-header']}>
                            <div
                                className={styles['report-wrapper-header-left']}
                            >
                                <span>{__('库表')}：</span>

                                <ViewSelect
                                    placeholder={__('请选择库表')}
                                    onChange={(it) => {
                                        const node = {
                                            form_view_id: it.value,
                                            business_name: it.label,
                                        }
                                        setCheckedNode(node)
                                        setViewId(node?.form_view_id)
                                    }}
                                    departmentId={departmentId}
                                    value={
                                        checkedNode
                                            ? {
                                                  label: RenderViewItem(
                                                      checkedNode,
                                                  ),
                                                  value: checkedNode?.form_view_id,
                                              }
                                            : undefined
                                    }
                                    style={{ width: '200px' }}
                                />
                            </div>
                            <div
                                className={
                                    styles['report-wrapper-header-right']
                                }
                            >
                                <span>
                                    {__('数据质量基于${tip}进行统计', {
                                        tip: exploreReportData?.total_sample
                                            ? `${
                                                  exploreReportData?.total_sample ||
                                                  0
                                              }${__('条采样数据')}`
                                            : __('全量数据'),
                                    })}
                                </span>
                                <div className={styles.versionDropdown}>
                                    <Dropdown
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
                                <RefreshBtn
                                    style={{
                                        border: '1px solid rgba(0,0,0,0.15)',
                                        borderRadius: '4px',
                                    }}
                                    onClick={() => {
                                        if (viewId) {
                                            initData(viewId)
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <div className={styles['report-wrapper-content']}>
                            {loading ? (
                                <div
                                    className={
                                        styles['report-wrapper-content-loader']
                                    }
                                >
                                    <Loader />
                                </div>
                            ) : (
                                <ViewQualityReport
                                    dataViewId={viewId!}
                                    data={exploreReportData}
                                    hasReport={hasExploreResult}
                                    className={styles['report-extra']}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Drawer>
    )
}

export default memo(ReportDrawer)
