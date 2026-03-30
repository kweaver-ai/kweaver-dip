import { useEffect, useRef, useState } from 'react'
import { Anchor, Descriptions, Drawer, Tag, Tooltip } from 'antd'
import { isNumber } from 'lodash'
import moment from 'moment'
import {
    formatError,
    getDataAggregationInventories,
    getInvestigationReport,
    getWorkOrderDetail,
} from '@/core'
import Return from '../../Return'
import {
    getOptionState,
    OrderStatusOptions,
    OrderType,
    OrderTypeOptions,
    PriorityOptions,
} from '../../helper'
import __ from './locale'
import styles from './styles.module.less'
import TaskTable from './TaskTable'
import AggregationInfo from '../../WorkOrderProcessing/AggregationInfo'
import ReportDetailModal from '@/components/DataPlanManage/Investigation/DetailModal'
import { Loader } from '@/ui'
import { SourceTypeEnum } from '../../WorkOrderManage/helper'

const { Link } = Anchor
function DetailModal({ id, onClose }: any) {
    const [detail, setDetail] = useState<any>()
    const container = useRef<any>(null)
    const [reportItem, setReportItem] = useState<any>()
    const [reportVisible, setReportVisible] = useState<any>(false)
    const [loading, setLoading] = useState<boolean>(false)
    const getDetail = async () => {
        try {
            setLoading(true)
            const res = await getWorkOrderDetail(id)
            setDetail(res)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    const getReport = async () => {
        try {
            const res = await getInvestigationReport({ work_order_id: id })
            if (res?.entries?.[0]) {
                setReportItem(res?.entries?.[0])
            }
        } catch (error) {
            // formatError(error)
        }
    }

    useEffect(() => {
        if (id) {
            getDetail()
            getReport()
        }
    }, [id])

    const ReportTip = reportItem ? (
        <span>
            {__('查看')}

            <a
                onClick={(e) => {
                    e.stopPropagation()
                    setReportVisible(true)
                }}
            >
                {__('调研报告')}
            </a>
        </span>
    ) : (
        <span>
            {__('查看')}

            <Tooltip title={__('暂无报告')}>
                <span style={{ textDecoration: 'underline' }}>
                    {__('调研报告')}
                </span>
            </Tooltip>
        </span>
    )

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
                                <Descriptions.Item label={__('工单名称')}>
                                    {detail?.name || '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('工单类型')}>
                                    {OrderTypeOptions.find(
                                        (o) => o.value === detail?.type,
                                    )?.label ?? '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('责任人')}>
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
                                <Descriptions.Item label={__('来源')}>
                                    {detail?.source_type === SourceTypeEnum.PLAN
                                        ? '归集计划'
                                        : detail?.source_type ===
                                          SourceTypeEnum.BUSINESS_FORM
                                        ? __('来源业务表')
                                        : detail?.source_type ===
                                          SourceTypeEnum.PROJECT
                                        ? '项目'
                                        : '无'}
                                </Descriptions.Item>
                                {detail?.source_type === SourceTypeEnum.PLAN ? (
                                    <Descriptions.Item label={__('来源计划')}>
                                        {detail?.source_name || '--'}
                                    </Descriptions.Item>
                                ) : detail?.source_type ===
                                  SourceTypeEnum.BUSINESS_FORM ? (
                                    <Descriptions.Item label={__('来源业务表')}>
                                        <div
                                            className={styles.businessFormList}
                                        >
                                            {detail?.data_aggregation_inventory
                                                ?.business_forms?.length > 0
                                                ? detail?.data_aggregation_inventory?.business_forms.map(
                                                      (o) => (
                                                          <Tag
                                                              key={o.name}
                                                              title={o?.name}
                                                          >
                                                              {o.name}
                                                          </Tag>
                                                      ),
                                                  )
                                                : '--'}
                                        </div>
                                    </Descriptions.Item>
                                ) : detail?.source_type ===
                                  SourceTypeEnum.PROJECT ? (
                                    <>
                                        <Descriptions.Item
                                            label={__('来源项目')}
                                        >
                                            {detail?.source_name ?? '--'}
                                        </Descriptions.Item>
                                        <Descriptions.Item
                                            label={__('工单所在节点')}
                                        >
                                            {`${
                                                detail?.stage_name
                                                    ? `${detail?.stage_name}/`
                                                    : ''
                                            }${detail?.node_name || ''}` ||
                                                '--'}
                                        </Descriptions.Item>
                                    </>
                                ) : (
                                    ''
                                )}
                                <Descriptions.Item
                                    label={__('工单状态')}
                                    span={detail?.status === 'finished' ? 1 : 2}
                                >
                                    {getOptionState(
                                        detail?.status,
                                        OrderStatusOptions,
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

                                <Descriptions.Item
                                    label={__('工单说明')}
                                    span={2}
                                >
                                    {detail?.description}
                                </Descriptions.Item>
                                {/* <Descriptions.Item label={__('备注')} span={2}>
                                    {detail?.remark}
                                </Descriptions.Item> */}
                            </Descriptions>
                            <div
                                className={styles.moduleTitle}
                                id="aggregation-info"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <h4>{__('归集信息')}</h4>
                                <span
                                    style={{
                                        fontSize: '12px',
                                        color: 'rgba(0,0,0,0.65)',
                                        marginRight: '10px',
                                    }}
                                >
                                    {ReportTip}
                                </span>
                            </div>
                            <div>
                                <AggregationInfo
                                    readOnly
                                    data={detail}
                                    fromType={detail?.source_type}
                                />
                            </div>
                            <div className={styles.moduleTitle} id="order-task">
                                <h4>{__('工单任务')}</h4>
                            </div>
                            <div style={{ padding: '16px 0' }}>
                                <TaskTable workOrderId={id} />
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
                                    href="#aggregation-info"
                                    title={__('归集信息')}
                                />
                                <Link
                                    href="#order-task"
                                    title={__('工单任务')}
                                />
                                <Link
                                    href="#processing-content"
                                    title={__('处理说明')}
                                />
                                <Link
                                    href="#more-info"
                                    title={__('更多信息')}
                                />
                            </Anchor>
                        </div>
                    </div>
                </div>
            </div>

            {reportVisible && (
                <ReportDetailModal
                    id={reportItem?.id}
                    onClose={() => {
                        setReportVisible(false)
                    }}
                />
            )}
        </Drawer>
    )
}

export default DetailModal
