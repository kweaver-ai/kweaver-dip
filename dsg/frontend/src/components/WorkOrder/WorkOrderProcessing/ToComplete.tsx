import { Button, Drawer, Form, Input, message, Space, Tooltip } from 'antd'
import classNames from 'classnames'
import { useContext, useEffect, useState } from 'react'
import { MicroWidgetPropsContext } from '@/context'
import {
    formatError,
    getInvestigationReport,
    getWorkOrderDetail,
    updateWorkOrderStatus,
} from '@/core'
import { Loader } from '@/ui'
import { ErrorInfo, keyboardReg } from '@/utils'
import { OrderType, StatusType } from '../helper'
import Return from '../Return'
import WorkInfo from '../WorkInfo'
import WorkOrderTaskTable from '../WorkOrderTaskTable'
import __ from './locale'
import styles from './styles.module.less'
import AggregationInfo from './AggregationInfo'
import TaskTable from '../WorkOrderType/AggregationOrder/TaskTable'
import ReportDetailModal from '@/components/DataPlanManage/Investigation/DetailModal'

function ToComplete({ id, onClose }: any) {
    const [detail, setDetail] = useState<any>()
    const [loading, setLoading] = useState<boolean>(false)
    const [form] = Form.useForm()
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [reportItem, setReportItem] = useState<any>()
    const [reportVisible, setReportVisible] = useState<any>(false)

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

    const onFinish = async (values) => {
        const params = {
            ...values,
            status: StatusType.COMPLETED,
        }

        try {
            const tip = __('确认成功')

            if (id) {
                await updateWorkOrderStatus(id, params)
            }

            if (microWidgetProps?.components?.toast) {
                microWidgetProps?.components?.toast.success(tip)
            } else {
                message.success(tip)
            }
            onClose?.(true)
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
        }
    }

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
                        title={__('确认完成工单')}
                    />
                </div>
                <div className={styles.body}>
                    <div
                        className={classNames(
                            styles.detailContent,
                            styles.toComplete,
                        )}
                    >
                        <div
                            hidden={!loading}
                            style={{
                                display: 'grid',
                                placeContent: ' center',
                                height: '100%',
                            }}
                        >
                            <Loader />
                        </div>
                        <div className={styles.infoSplit} hidden={loading}>
                            <WorkInfo
                                data={detail}
                                className={
                                    detail?.type === OrderType?.AGGREGATION &&
                                    styles['set-width']
                                }
                            />
                            <div className={styles.infoRight}>
                                <div className={styles.moduleTitle}>
                                    <h4>{__('工单任务')}</h4>
                                </div>
                                <div>
                                    {[
                                        OrderType.COMPREHENSION,
                                        OrderType.RESEARCH_REPORT,
                                        OrderType.DATA_CATALOG,
                                        OrderType.FRONT_PROCESSORS,
                                    ].includes(detail?.type) ? (
                                        <WorkOrderTaskTable
                                            workOrderId={id}
                                            readOnly
                                            orderType={detail?.type}
                                        />
                                    ) : (
                                        <TaskTable workOrderId={id} /> // OrderType.AGGREGATION
                                    )}
                                </div>
                                <div className={styles.moduleTitle}>
                                    <h4>{__('处理说明')}</h4>
                                </div>
                                <Form
                                    form={form}
                                    layout="vertical"
                                    onFinish={onFinish}
                                    autoComplete="off"
                                >
                                    <Form.Item
                                        label={__('处理说明')}
                                        name="processing_instructions"
                                        rules={[
                                            {
                                                required: true,
                                                message: ErrorInfo.NOTNULL,
                                            },
                                            {
                                                pattern: keyboardReg,
                                                message: ErrorInfo.EXCEPTEMOJI,
                                            },
                                        ]}
                                    >
                                        <Input.TextArea
                                            placeholder={__('请输入')}
                                            maxLength={300}
                                            className={styles['show-count']}
                                            showCount
                                        />
                                    </Form.Item>
                                </Form>
                            </div>
                        </div>
                    </div>
                    <div className={styles.footer}>
                        <Space size={16}>
                            <Button onClick={() => onClose(false)}>
                                {__('取消')}
                            </Button>

                            <Button
                                type="primary"
                                onClick={() => {
                                    form.submit()
                                }}
                            >
                                {__('确认完成')}
                            </Button>
                        </Space>
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

export default ToComplete
