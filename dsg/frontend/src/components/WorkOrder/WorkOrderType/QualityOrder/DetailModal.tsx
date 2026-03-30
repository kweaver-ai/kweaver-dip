import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Anchor, Descriptions, Drawer } from 'antd'
import { isNumber } from 'lodash'
import moment from 'moment'
import {
    CloseCircleFilled,
    InfoCircleFilled,
    InfoCircleOutlined,
} from '@ant-design/icons'
import classNames from 'classnames'
import { formatError, getExploreReport, getWorkOrderDetail } from '@/core'
import Return from '../../Return'
import {
    AuditType,
    getOptionState,
    CommonOrderStatusOptions,
    OrderTypeOptions,
    PriorityOptions,
    StatusType,
} from '../../helper'
import __ from './locale'
import styles from './styles.module.less'
import { Empty, Loader } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import CorrectionTable from './CorrectionTable'
import {
    AnchorType,
    KVMap,
    ScoreType,
} from '@/components/DatasheetView/DataPreview/helper'
import { DataViewProvider } from '@/components/DatasheetView/DataViewProvider'
import ReportDetail from '../../QualityReport/ReportDetail'
import ImprovmentModal from './ImprovmentModal'
import DatasourceDetails from '@/components/DataSource/Details'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'

const { Link } = Anchor

/**
 *质量整改详情
 */
function DetailModal({ id, onClose, fromAudit }: any) {
    const [detail, setDetail] = useState<any>()
    const container = useRef<any>(null)
    const [reportVisible, setReportVisible] = useState<boolean>(false)
    const [compareVisible, setCompareVisible] = useState<boolean>(false)
    const [report, setReport] = useState<any>()
    const [loading, setLoading] = useState<boolean>(false)
    const [datasourceVisible, setDatasourceVisible] = useState<boolean>(false)
    const [{ third_party }] = useGeneralConfig()

    const getDetail = async () => {
        try {
            setLoading(true)
            const res = await getWorkOrderDetail(id)
            setDetail(res)
            getReport(res?.data_quality_improvement?.form_view_id)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (id) {
            getDetail()
        }
    }, [id])

    const getReport = async (dataViewId: string) => {
        try {
            const res = await getExploreReport({
                id: dataViewId,
                third_party: !!third_party,
            })
            setReport(res)
        } catch (error) {
            //
        }
    }

    const improvementsFields = useMemo(() => {
        return (detail?.data_quality_improvement?.improvements || []).map(
            (it: any) => ({
                ...it,
                id: `${it?.field_id}-${it?.rule_id}`,
                rule_type: AnchorType[KVMap[it?.dimension]],
                score: isNumber(it?.score)
                    ? Math.ceil(it.score * 10000) / 100
                    : '--',
            }),
        )
    }, [detail?.data_quality_improvement?.improvements])

    const correctionTip = useMemo(() => {
        return report?.version >
            detail?.data_quality_improvement?.report_version ? (
            <span className={styles.correctionTip}>
                <a
                    onClick={(e) => {
                        e.stopPropagation()
                        setReportVisible(true)
                    }}
                >
                    {__('最新报告')}
                </a>
                <a
                    onClick={(e) => {
                        e.stopPropagation()
                        setCompareVisible(true)
                    }}
                >
                    {__('查看对比')}
                </a>
            </span>
        ) : (
            <span
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: 'rgba(0,0,0,0.45)',
                    fontSize: 12,
                    gap: 8,
                }}
            >
                <InfoCircleOutlined
                    style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}
                />
                {__('暂无新报告，生成新报告后可查看整改结果对比')}
            </span>
        )
    }, [report, detail])

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
            <div className={styles['opt-wrapper']}>
                <div className={styles.header}>
                    <Return
                        onReturn={() => onClose(false)}
                        title={detail?.name || __('详情')}
                    />
                </div>
                <div className={styles.body}>
                    <div className={styles.detailContent} ref={container}>
                        <div
                            style={{
                                height: '100%',
                                display: 'grid',
                                placeContent: 'center',
                            }}
                            hidden={!loading}
                        >
                            <Loader />
                        </div>
                        <div className={styles.infoList} hidden={loading}>
                            <div
                                hidden={
                                    !(
                                        (detail?.status !==
                                            StatusType.COMPLETED &&
                                            !!detail?.reject_reason) ||
                                        (detail?.status ===
                                            StatusType.COMPLETED &&
                                            detail?.audit_status ===
                                                AuditType.PASS &&
                                            !!detail?.reject_reason)
                                    )
                                }
                                className={styles.rejectReason}
                            >
                                <Alert
                                    message="此工单已被执行方驳回"
                                    showIcon
                                    description={`驳回理由：${detail?.reject_reason}`}
                                    type="error"
                                    icon={
                                        <span
                                            style={{
                                                color: 'rgb(255 77 79 / 100%)',
                                                fontSize: '14px',
                                                marginRight: '8px',
                                            }}
                                        >
                                            <InfoCircleFilled />
                                        </span>
                                    }
                                />
                            </div>
                            <div className={styles.moduleTitle} id="base-info">
                                <h4>{__('基本信息')}</h4>
                            </div>
                            <Descriptions
                                column={2}
                                labelStyle={{
                                    width: '126px',
                                    color: 'rgba(0, 0, 0, 0.45)',
                                }}
                            >
                                <Descriptions.Item label={__('整改单名称')}>
                                    {detail?.name || '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('类型')}>
                                    {OrderTypeOptions.find(
                                        (o) => o.value === detail?.type,
                                    )?.label ?? '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('处理人')}>
                                    {detail?.responsible_uname || '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('优先级')}>
                                    {getOptionState(
                                        detail?.priority,
                                        PriorityOptions,
                                    )}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('截止日期')}>
                                    {isNumber(detail?.finished_at) &&
                                    detail?.finished_at
                                        ? moment(
                                              detail.finished_at * 1000,
                                          ).format('YYYY-MM-DD')
                                        : '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('来源报告')}>
                                    {detail?.data_quality_improvement
                                        ?.form_view_business_name &&
                                    detail?.data_quality_improvement
                                        ?.report_version
                                        ? `${
                                              detail?.data_quality_improvement
                                                  ?.form_view_business_name
                                          }(v.${
                                              detail?.data_quality_improvement
                                                  ?.report_version || 0
                                          })`
                                        : '--'}
                                </Descriptions.Item>

                                <Descriptions.Item
                                    label={__('状态')}
                                    span={detail?.status === 'finished' ? 1 : 2}
                                >
                                    {getOptionState(
                                        detail?.status,
                                        CommonOrderStatusOptions,
                                    )}
                                </Descriptions.Item>
                                {detail?.status === 'finished' && (
                                    <Descriptions.Item label={__('完成时间')}>
                                        {isNumber(detail?.updated_at) &&
                                        detail?.updated_at
                                            ? moment(detail.updated_at).format(
                                                  'YYYY-MM-DD HH:mm:ss',
                                              )
                                            : '--'}
                                    </Descriptions.Item>
                                )}

                                <Descriptions.Item label={__('备注')} span={2}>
                                    {detail?.description || '--'}
                                </Descriptions.Item>
                            </Descriptions>
                            <div
                                className={styles.moduleTitle}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                                id="correction-content"
                            >
                                <h4>{__('整改内容')}</h4>
                                <span
                                    style={{
                                        fontSize: '12px',
                                        color: 'rgba(0,0,0,0.65)',
                                        marginRight: '10px',
                                    }}
                                    hidden={fromAudit || loading}
                                >
                                    {correctionTip}
                                </span>
                            </div>
                            <div>
                                <div
                                    style={{
                                        margin: '10px 0',
                                        fontWeight: 550,
                                    }}
                                >
                                    {__('基本信息')}
                                </div>
                                <Descriptions
                                    column={3}
                                    labelStyle={{
                                        width: '80px',
                                        color: 'rgba(0, 0, 0, 0.45)',
                                    }}
                                >
                                    <Descriptions.Item label={__('数据源')}>
                                        <div
                                            className={classNames(
                                                styles.ellipsisTxt,
                                                styles.link,
                                            )}
                                            onClick={() => {
                                                setDatasourceVisible(true)
                                            }}
                                        >
                                            {detail?.data_quality_improvement
                                                ?.data_source_name || '--'}
                                        </div>
                                    </Descriptions.Item>
                                    <Descriptions.Item label={__('库表')}>
                                        <div className={styles.ellipsisTxt}>
                                            {detail?.data_quality_improvement
                                                ?.form_view_business_name ||
                                                '--'}
                                        </div>
                                    </Descriptions.Item>
                                </Descriptions>
                            </div>
                            <div>
                                <div
                                    style={{
                                        margin: '10px 0',
                                        fontWeight: 550,
                                    }}
                                >
                                    {__('需要整改字段列表')}
                                </div>
                                {improvementsFields?.length > 0 ? (
                                    <CorrectionTable
                                        readOnly
                                        data={improvementsFields}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            display: 'grid',
                                            placeContent: 'center',
                                            padding: '20px',
                                        }}
                                    >
                                        <Empty
                                            iconSrc={dataEmpty}
                                            desc={__('暂无数据')}
                                        />
                                    </div>
                                )}
                            </div>
                            <div
                                className={styles.moduleTitle}
                                id="processing-content"
                            >
                                <h4>{__('处理说明')}</h4>
                            </div>
                            <Descriptions
                                column={2}
                                labelStyle={{
                                    width: '126px',
                                    color: 'rgba(0, 0, 0, 0.45)',
                                }}
                            >
                                <Descriptions.Item
                                    label={__('处理说明')}
                                    span={2}
                                >
                                    {detail?.processing_instructions || '--'}
                                </Descriptions.Item>
                            </Descriptions>
                            <div className={styles.moduleTitle} id="feedback">
                                <h4>{__('反馈')}</h4>
                            </div>
                            {detail?.data_quality_improvement?.feedback ? (
                                <Descriptions
                                    column={1}
                                    labelStyle={{
                                        width: '126px',
                                        color: 'rgba(0, 0, 0, 0.45)',
                                    }}
                                >
                                    <Descriptions.Item label={__('评分')}>
                                        {detail?.data_quality_improvement
                                            ?.feedback?.score ?? '--'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label={__('反馈内容')}>
                                        {detail?.data_quality_improvement
                                            ?.feedback?.feedback_content ||
                                            '--'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label={__('反馈时间')}>
                                        {isNumber(
                                            detail?.data_quality_improvement
                                                ?.feedback?.feedback_at,
                                        ) &&
                                        detail?.data_quality_improvement
                                            ?.feedback?.feedback_at
                                            ? moment(
                                                  detail
                                                      ?.data_quality_improvement
                                                      ?.feedback.feedback_at,
                                              ).format('YYYY-MM-DD HH:mm:ss')
                                            : '--'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label={__('反馈人')}>
                                        {detail?.data_quality_improvement
                                            ?.feedback?.feedback_by || '--'}
                                    </Descriptions.Item>
                                </Descriptions>
                            ) : (
                                <div
                                    style={{
                                        display: 'grid',
                                        placeContent: 'center',
                                        padding: '20px',
                                    }}
                                >
                                    <Empty
                                        iconSrc={dataEmpty}
                                        desc={__('暂无数据')}
                                    />
                                </div>
                            )}

                            <div className={styles.moduleTitle} id="more-info">
                                <h4>{__('更多信息')}</h4>
                            </div>
                            <Descriptions
                                column={2}
                                labelStyle={{
                                    width: '126px',
                                    color: 'rgba(0, 0, 0, 0.45)',
                                }}
                            >
                                <Descriptions.Item label={__('创建人')}>
                                    {detail?.created_by || '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('创建时间')}>
                                    {isNumber(detail?.created_at) &&
                                    detail?.created_at
                                        ? moment(detail.created_at).format(
                                              'YYYY-MM-DD HH:mm:ss',
                                          )
                                        : '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('更新人')}>
                                    {detail?.updated_by || '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('更新时间')}>
                                    {isNumber(detail?.updated_at) &&
                                    detail?.updated_at
                                        ? moment(detail.updated_at).format(
                                              'YYYY-MM-DD HH:mm:ss',
                                          )
                                        : '--'}
                                </Descriptions.Item>
                            </Descriptions>
                        </div>
                        <div className={styles.menuContainer} hidden={loading}>
                            <Anchor
                                targetOffset={48}
                                getContainer={() =>
                                    (container.current as HTMLElement) || window
                                }
                                onClick={(e: any) => e.preventDefault()}
                                className={styles.anchorWrapper}
                            >
                                <Link
                                    href="#base-info"
                                    title={__('基本信息')}
                                />
                                <Link
                                    href="#correction-content"
                                    title={__('整改内容')}
                                />
                                <Link
                                    href="#processing-content"
                                    title={__('处理说明')}
                                />
                                <Link href="#feedback" title={__('反馈')} />
                                <Link
                                    href="#more-info"
                                    title={__('更多信息')}
                                />
                            </Anchor>
                        </div>
                    </div>
                </div>
            </div>

            {compareVisible && (
                <ImprovmentModal
                    id={detail?.work_order_id}
                    visible={compareVisible}
                    onClose={() => setCompareVisible(false)}
                />
            )}
            {reportVisible && (
                <DataViewProvider>
                    <ReportDetail
                        item={{
                            form_view_id:
                                detail?.data_quality_improvement?.form_view_id,
                            business_name:
                                detail?.data_quality_improvement
                                    ?.form_view_business_name,
                            status:
                                detail?.status === StatusType.COMPLETED
                                    ? 'not_add'
                                    : 'added',
                        }}
                        visible={reportVisible}
                        onClose={() => setReportVisible(false)}
                    />
                </DataViewProvider>
            )}
            {datasourceVisible && (
                <DatasourceDetails
                    open={datasourceVisible}
                    onClose={() => {
                        setDatasourceVisible(false)
                    }}
                    id={detail?.data_quality_improvement?.data_source_id}
                />
            )}
        </Drawer>
    )
}

export default DetailModal
