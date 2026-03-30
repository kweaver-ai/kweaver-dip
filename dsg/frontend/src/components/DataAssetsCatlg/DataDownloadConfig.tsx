import React, {
    useEffect,
    useState,
    useContext,
    useMemo,
    CSSProperties,
} from 'react'
import { LeftOutlined } from '@ant-design/icons'
import { Button, Space, message, Tooltip } from 'antd'
import CustomDrawer from '../CustomDrawer'
import Loader from '@/ui/Loader'
import styles from './styles.module.less'
import __ from './locale'
import {
    formatError,
    getDatasheetViewDetails,
    createDownloadTask,
    getExploreReport,
    SortDirection,
} from '@/core'
import { DatasheetViewColored } from '@/icons'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import { MicroWidgetPropsContext } from '@/context'
import { getScore } from '../DatasheetView/DataPreview/helper'
import ScrollFilter from '../DatasheetView/DataPreview/ScrollFilter'
import { useDataViewContext } from '../DatasheetView/DataViewProvider'

interface IDataDownloadConfig {
    formViewId: string
    open: boolean
    isFullScreen?: boolean
    drawerStyle?: CSSProperties | undefined
    onClose: () => void
    errorCallback?: (error?: any) => void
}

const DataDownloadConfig: React.FC<IDataDownloadConfig> = ({
    formViewId,
    open,
    drawerStyle,
    onClose,
    errorCallback,
    isFullScreen,
}) => {
    const [data, setData] = useState<any>()
    const [scoreData, setScoreData] = useState<any[]>([])
    const [formViewStatus, setFormViewStatus] = useState<string>('')
    const { setExplorationData } = useDataViewContext()
    const [config, setConfig] = useState<any>()
    /** 是否有探查结果 */
    const [hasExploreResult, setHasExploreResult] = useState<boolean>(false)
    const [loading, setLoading] = useState(false)
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)

    useEffect(() => {
        if (formViewId) {
            initData()
        }
    }, [formViewId])

    /** 初始化加载 */
    const initData = () => {
        setLoading(true)
        Promise.allSettled([
            /** 获取探查报告 */
            getExploreReport({
                id: formViewId,
            }),
            /** 查询库表详情 */
            getDatasheetViewDetails(formViewId),
        ])
            .then((results: any) => {
                const [{ value: reportRes }, { value: dataViewRes }] = results
                const errors = results?.filter(
                    (o, idx) => idx !== 0 && o.status === 'rejected',
                )
                if (errors?.length) {
                    formatError(errors[0]?.reason)
                }

                setFormViewStatus(
                    !dataViewRes?.last_publish_time &&
                        dataViewRes.status !== 'delete'
                        ? 'unPublished'
                        : dataViewRes.status,
                )
                setData((prev) => ({
                    ...prev,
                    ...(reportRes || {}),
                    formView: dataViewRes,
                }))

                // 是否有报告
                setHasExploreResult(!!reportRes)
            })
            .finally(() => {
                setLoading(false)
            })
    }

    useEffect(() => {
        if (data) {
            const scoreItems = (data?.explore_field_details || []).map((o) => ({
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
        } else {
            setScoreData([])
        }
    }, [data])

    const handleOk = async () => {
        if (!config) return
        try {
            const member = (config?.filters || [])?.map((o) => {
                const val = Array.isArray(o?.value)
                    ? o?.value?.join(',')
                    : o?.value
                return {
                    ...o,
                    value: val,
                }
            })

            const useConfig: any = {
                fields: (config?.fields || [])?.filter((o) => o?.isChecked),
                row_filters: {
                    member,
                },
            }
            if (config?.sort_field_id) {
                useConfig.sort_field_id = config?.sort_field_id
                useConfig.direction = config?.direction || SortDirection.DESC
            }

            const detail = JSON.stringify(useConfig || '{}')
            await createDownloadTask({
                form_view_id: formViewId,
                detail,
            })
            if (microWidgetProps?.components?.toast) {
                microWidgetProps?.components?.toast?.success(
                    __('已添加至「下载任务」'),
                )
            } else {
                message.success(__('已添加至「下载任务」'))
            }
            onClose()
        } catch (err) {
            formatError(err)
        }
    }

    const back = async () => {
        if (config) {
            ReturnConfirmModal({
                content: __('离开此页将放弃本次更改的内容，请确认操作。'),
                onCancel: () => {
                    onClose()
                },
                microWidgetProps,
            })
        } else {
            onClose()
        }
    }

    const accessFields = useMemo(() => {
        return data?.formView?.fields?.filter(
            (o) => o.is_readable && !o.label_is_protected,
        )
    }, [data?.formView?.fields])

    return (
        <CustomDrawer
            open={open}
            isShowFooter={false}
            bodyStyle={{
                padding: 24,
                background: '#EDEFF5',
            }}
            customHeaderStyle={{ display: 'none' }}
            customBodyStyle={{
                height: '100%',
                width: '100%',
                boxShadow: '0px 5px 12px 4px rgba(0,0,0,0.05)',
                borderRadius: '8px',
            }}
            style={
                drawerStyle || {
                    position: 'fixed',
                    width: isFullScreen ? '100vw' : 'calc(100vw - 220px)',
                    height: 'calc(100vh - 52px)',
                    top: '52px',
                    left: isFullScreen ? 0 : '220px',
                    zIndex: 1000,
                }
            }
        >
            {loading ? (
                <Loader />
            ) : (
                <div className={styles.downlaodWrapper}>
                    <div className={styles.title}>
                        <div className={styles.back} onClick={() => back()}>
                            <LeftOutlined className={styles.backArrow} />
                            <span className={styles.backText}>
                                {__('返回')}
                            </span>
                        </div>
                        <div className={styles.divider} />
                        <div className={styles.backText}>{__('下载')}</div>
                        <DatasheetViewColored className={styles.viewIcon} />
                        <div
                            className={styles.viewNamee}
                            title={data?.formView?.business_name}
                        >
                            {data?.formView?.business_name}
                        </div>
                        <div className={styles.rightSubmit}>
                            <div>
                                {__('说明')}:
                                {__(
                                    '实际下载的数据受数据权限限制和安全策略限制',
                                )}
                                ,{__('最多可下载10万条数据')}
                            </div>
                            <div>
                                <Space size={12}>
                                    <Tooltip title={__('取消')}>
                                        <Button onClick={back}>
                                            {__('取消')}
                                        </Button>
                                    </Tooltip>
                                    <Tooltip
                                        title={
                                            !config
                                                ? __('请先配置')
                                                : __('提交')
                                        }
                                    >
                                        <Button
                                            disabled={!config}
                                            onClick={handleOk}
                                            type="primary"
                                        >
                                            {__('提交')}
                                        </Button>
                                    </Tooltip>
                                </Space>
                            </div>
                        </div>
                    </div>
                    <div className={styles.filterBox}>
                        <ScrollFilter
                            id={formViewId}
                            formViewStatus={formViewStatus}
                            scoreItems={scoreData}
                            hasRule={hasExploreResult}
                            isAudit
                            fields={accessFields || []}
                            onConfigChange={(conf) => setConfig(conf)}
                            isDownloadPage
                        />
                    </div>
                </div>
            )}
        </CustomDrawer>
    )
}

export default DataDownloadConfig
