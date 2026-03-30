import { Anchor, Descriptions, Drawer } from 'antd'
import { isNumber } from 'lodash'
import moment from 'moment'
import { useEffect, useRef, useState } from 'react'
import { formatError, getWorkOrderDetail } from '@/core'
import AggregateDetailModal from '@/components/WorkOrder/WorkOrderType/AggregationOrder/DetailModal'
import PlanDetailModal from '@/components/DataPlanManage/PlanProcessing/DetailModal'
import Return from '../../Return'
import { SourceTypeEnum } from '../../WorkOrderManage/helper'
import {
    getOptionState,
    OrderStatusOptions,
    OrderType,
    OrderTypeOptions,
    PriorityOptions,
} from '../../helper'
import ExamineTaskTable from './ExamineTaskTable'
import ModalTable from './ModalTable'
import __ from './locale'
import styles from './styles.module.less'
import { DataViewProvider } from '@/components/DatasheetView/DataViewProvider'
import TaskTable from './TaskTable'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'

const { Link } = Anchor

/**
 * 质量检测工单详情
 */
function DetailModal({ id, onClose }: any) {
    // 锚点定位
    const container = useRef<any>(null)
    // 工单详情
    const [detail, setDetail] = useState<any>()
    const [planVisible, setPlanView] = useState<any>()
    const [aggregateVisible, setAggregateView] = useState<any>()
    const [datasourceInfo, setDatasourceInfo] = useState<any>([])

    const [{ third_party }] = useGeneralConfig()
    const getDetail = async () => {
        try {
            const res = await getWorkOrderDetail(id)
            setDetail(res)
            setDatasourceInfo(
                JSON.parse(res?.remark || '{}')?.datasource_infos || [],
            )
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (id) {
            getDetail()
        }
    }, [id])

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
                        <div className={styles.infoList}>
                            <div className={styles.moduleTitle} id="base-info">
                                <h4>{__('基本信息')}</h4>
                            </div>
                            <div className={styles['padding-16']}>
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
                                    {/* <Descriptions.Item label={__('来源')}>
                                        {detail?.source_type ===
                                        SourceTypeEnum.PLAN
                                            ? __('处理计划')
                                            : detail?.source_type ===
                                              SourceTypeEnum.AGGREGATION_WORK_ORDER
                                            ? __('归集工单')
                                            : detail?.source_type ===
                                              SourceTypeEnum.PROJECT
                                            ? '项目'
                                            : __('无')}
                                    </Descriptions.Item> */}
                                    {detail?.source_type ===
                                        SourceTypeEnum.PLAN && (
                                        <Descriptions.Item
                                            label={__('来源计划')}
                                        >
                                            <span
                                                className={styles.sourceName}
                                                onClick={() => {
                                                    setPlanView(true)
                                                }}
                                            >
                                                {detail?.source_name ?? '--'}
                                            </span>
                                        </Descriptions.Item>
                                    )}
                                    {detail?.source_type ===
                                        SourceTypeEnum.AGGREGATION_WORK_ORDER && (
                                        <Descriptions.Item
                                            label={__('来源工单')}
                                        >
                                            <span
                                                className={styles.sourceName}
                                                onClick={() => {
                                                    setAggregateView(true)
                                                }}
                                            >
                                                {detail?.source_name ?? '--'}
                                            </span>
                                        </Descriptions.Item>
                                    )}
                                    {detail?.source_type ===
                                        SourceTypeEnum.PROJECT && (
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
                                    )}
                                    <Descriptions.Item label={__('工单状态')}>
                                        {getOptionState(
                                            detail?.status,
                                            OrderStatusOptions,
                                        )}
                                    </Descriptions.Item>
                                    {detail?.status === 'finished' && (
                                        <Descriptions.Item
                                            label={__('完成时间')}
                                            span={
                                                detail?.source_type === 'plan'
                                                    ? 2
                                                    : 1
                                            }
                                        >
                                            {isNumber(detail?.updated_at) &&
                                            detail?.updated_at
                                                ? moment(
                                                      detail.updated_at,
                                                  ).format(
                                                      'YYYY-MM-DD HH:mm:ss',
                                                  )
                                                : '--'}
                                        </Descriptions.Item>
                                    )}
                                </Descriptions>
                                <Descriptions
                                    column={2}
                                    labelStyle={{
                                        width: '126px',
                                        color: 'rgba(0, 0, 0, 0.45)',
                                    }}
                                    style={{ marginTop: '20px' }}
                                >
                                    <Descriptions.Item
                                        label={__('工单说明')}
                                        span={2}
                                    >
                                        {detail?.description || '--'}
                                    </Descriptions.Item>
                                </Descriptions>
                            </div>
                            <div
                                className={styles.moduleTitle}
                                id="quality-model"
                            >
                                <h4>{__('质量检测模型')}</h4>
                            </div>
                            <div className={styles['padding-16']}>
                                <ModalTable
                                    readOnly
                                    dataSourceInfo={datasourceInfo}
                                    workOrderTitle={detail?.name}
                                />
                            </div>
                            <div className={styles.moduleTitle} id="order-task">
                                <h4>{__('质量检测任务')}</h4>
                            </div>
                            <div className={styles['padding-16']}>
                                {third_party ? (
                                    <TaskTable
                                        workOrderId={id}
                                        onShowTaskDetail={() => {}}
                                    />
                                ) : (
                                    <DataViewProvider>
                                        <ExamineTaskTable
                                            workOrderId={id}
                                            workOrderTitle={detail?.name}
                                        />
                                    </DataViewProvider>
                                )}
                            </div>
                            {/* <div
                                className={styles.moduleTitle}
                                id="processing-content"
                            >
                                <h4>{__('处理说明')}</h4>
                            </div> */}
                            {/* <Descriptions
                                column={2}
                                labelStyle={{
                                    width: '126px',
                                    color: 'rgba(0, 0, 0, 0.45)',
                                }}
                                className={styles['padding-16']}
                            >
                                <Descriptions.Item
                                    label={__('处理说明')}
                                    span={2}
                                >
                                    {detail?.processing_instructions || '--'}
                                </Descriptions.Item>
                            </Descriptions> */}
                            <div className={styles.moduleTitle} id="more-info">
                                <h4>{__('更多信息')}</h4>
                            </div>
                            <Descriptions
                                column={2}
                                labelStyle={{
                                    width: '126px',
                                    color: 'rgba(0, 0, 0, 0.45)',
                                }}
                                className={styles['padding-16']}
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
                        <div className={styles.menuContainer}>
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
                                    href="#quality-model"
                                    title={__('质量检测模型')}
                                />
                                <Link
                                    href="#order-task"
                                    title={__('质量检测任务')}
                                />
                                {/* <Link
                                    href="#processing-content"
                                    title={__('处理说明')}
                                /> */}
                                <Link
                                    href="#more-info"
                                    title={__('更多信息')}
                                />
                            </Anchor>
                        </div>
                    </div>
                </div>
            </div>
            {planVisible && (
                <PlanDetailModal
                    id={detail?.source_id}
                    onClose={() => {
                        setPlanView(false)
                    }}
                />
            )}
            {aggregateVisible && (
                <AggregateDetailModal
                    id={detail?.source_id}
                    type={OrderType.AGGREGATION}
                    onClose={() => {
                        setAggregateView(false)
                    }}
                />
            )}
        </Drawer>
    )
}

export default DetailModal
