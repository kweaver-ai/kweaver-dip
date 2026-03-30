import moment from 'moment'
import React, { memo, useEffect, useMemo, useState } from 'react'
import classnames from 'classnames'
import { Tooltip } from 'antd'
import styles from './styles.module.less'
import __ from './locale'
import DetailDialog from './DetailDialog'
import ViewPermission from '../DemandManagement/Details/ViewPermission'
import { TextAreaView } from '@/components/AutoFormView/baseViewComponents'
import { PermissionAuditConfigByType } from './const'
import { IndicatorTypes } from '../AccessPolicy/const'
import DetailIndicatorDialog from './IndicatorDetailDialog'
import { AssetTypeEnum } from '@/core'
import ApiDetailDialog from './ApiDetailDialog'

function PermissionAudit({ props }: any) {
    const {
        props: {
            // data: {
            //     logic_view_code,
            //     reason,
            //     logic_view_authorizing_request_id,
            //     logic_view_business_name,
            //     sub_view_name,
            //     requester_name,
            //     requester_id,
            //     type,
            //     timestamp,
            //     usage,
            // },
            data,
            process: { audit_type },
            target,
        },
    } = props

    const [detailDialogOpen, setDetailDialogOpen] = useState(false)
    const [demandDetailDrawerOpen, setDemandDetailDrawerOpen] = useState(false)
    const [configInfo, setConfigInfo] = useState<Array<any>>([])

    const [indicatorDetailOpen, setIndicatorDetailsOpen] =
        useState<boolean>(false)

    const [apiDetailOpen, setApiDetailOpen] = useState<boolean>(false)

    const isAuditPage = useMemo(() => {
        return target === 'auditPage'
    }, [target])

    useEffect(() => {
        setConfigInfo(PermissionAuditConfigByType[data.type])
    }, [data])

    /**
     * 根据配置项获取配置模板
     *
     * 根据不同的key值，返回不同的配置项渲染结果
     * 主要用于动态生成配置项的展示，以便于提高代码的复用性和灵活性
     *
     * @param {Object} item - 配置项对象，包含key和其他属性，用于确定配置项的类型和标签
     * @returns {React.Element} 返回根据配置项生成的配置模板组件
     */
    const getConfigTemplate = (item, index) => {
        // 根据配置项的key值，进行不同类型的处理
        switch (item.key) {
            // 当key为'details'时，返回详情配置模板
            case 'details':
                // 通过点击操作可以打开相应的详情抽屉或对话框
                return (
                    <div className={styles.text} key={index}>
                        <div className={styles.clums}>{__('详情')}：</div>
                        <div
                            className={classnames(styles.texts, styles.link)}
                            onClick={() => {
                                if (data.type === AssetTypeEnum.Indicator) {
                                    setIndicatorDetailsOpen(true)
                                } else if (data.type === AssetTypeEnum.Api) {
                                    setApiDetailOpen(true)
                                } else if (data.usage === 'DemandManagement') {
                                    setDemandDetailDrawerOpen(true)
                                } else {
                                    setDetailDialogOpen(true)
                                }
                            }}
                        >
                            {__('查看详情')}
                        </div>
                    </div>
                )
            // 当key为'reason'时，返回申请理由配置模板
            case 'reason':
                // 包含一个可展开的文本区域，用于显示申请理由
                return (
                    <div className={styles.reasonText} key={index}>
                        <span className={styles.clums}>{__('申请理由')}：</span>
                        <div
                            className={styles.reasonTexts}
                            title={data?.[item.key] || ''}
                        >
                            {/* <TextAreaView组件用于显示和编辑申请理由 */}
                            <TextAreaView
                                initValue={data?.[item.key] || ''}
                                rows={2}
                                placement="end"
                            />
                        </div>
                    </div>
                )
            // 当key为'timestamp'时，返回申请时间配置模板
            case 'timestamp':
                // 将时间戳格式化为易读的日期和时间格式
                return (
                    <div className={styles.text} key={index}>
                        <div className={styles.clums}>{__('申请时间')}：</div>
                        <div className={styles.texts}>
                            {moment(data?.[item.key] || '').format(
                                'YYYY-MM-DD HH:mm',
                            )}
                        </div>
                    </div>
                )
            // 对于其他key值，返回默认的配置项展示模板
            case 'indicator_type':
                return (
                    <div className={styles.text} key={index}>
                        <div className={styles.clums}>{item?.label}：</div>
                        <div
                            className={styles.texts}
                            title={IndicatorTypes[data?.[item.key]] || ''}
                        >
                            {IndicatorTypes[data?.[item.key]] || ''}
                        </div>
                    </div>
                )
            // 当key为'expired_at'时，返回有效期至配置模板
            case 'expired_at':
                return (
                    <div className={styles.text} key={index}>
                        <div className={styles.clums}>{item?.label}：</div>
                        <div
                            className={styles.texts}
                            title={data?.[item.key] || ''}
                        >
                            {data?.[item.key]
                                ? moment(data?.[item.key]).format(
                                      'YYYY-MM-DD HH:mm',
                                  )
                                : __('永久有效')}
                        </div>
                    </div>
                )
            default:
                return (
                    <div className={styles.text} key={index}>
                        <div className={styles.clums}>{item?.label}：</div>
                        <div
                            className={styles.texts}
                            title={data?.[item.key] || ''}
                        >
                            {data?.[item.key] || ''}
                        </div>
                    </div>
                )
        }
    }

    return (
        <div className={styles.wrapper}>
            {configInfo.map((item, index) => getConfigTemplate(item, index))}
            {detailDialogOpen ? (
                <DetailDialog
                    id={data.logic_view_authorizing_request_id}
                    open={detailDialogOpen}
                    type={data.type}
                    onCancel={() => setDetailDialogOpen(false)}
                    showSampleData={isAuditPage}
                />
            ) : null}
            {demandDetailDrawerOpen && (
                <ViewPermission
                    name={data.logic_view_business_name}
                    viewid={data.logic_view_authorizing_request_id || ''}
                    open={demandDetailDrawerOpen}
                    onClose={() => setDemandDetailDrawerOpen(false)}
                    sheetId=""
                />
            )}

            {indicatorDetailOpen && (
                <DetailIndicatorDialog
                    id={data.indicator_authorizing_request_id}
                    open={indicatorDetailOpen}
                    type={data.type}
                    onCancel={() => setIndicatorDetailsOpen(false)}
                    showSampleData={isAuditPage}
                    indicatorType={data.indicator_type}
                />
            )}
            {apiDetailOpen && (
                <ApiDetailDialog
                    id={data.api_authorizing_request_id}
                    open={apiDetailOpen}
                    onCancel={() => setApiDetailOpen(false)}
                />
            )}
        </div>
    )
}

export default memo(PermissionAudit)
