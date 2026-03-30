import React, { useState, useEffect } from 'react'
import { Button, Form, message, Modal, ModalProps } from 'antd'
import moment from 'moment'
import __ from '../locale'
import styles from './styles.module.less'
import SchedulePlanForm from '.'
import { formatError, getDataPushDetail, putDataPushSchedule } from '@/core'
import { DataPushStatus, ScheduleExecuteStatus } from '../const'

interface ISchedulePlanModal extends ModalProps {
    datapushData: any
    open: boolean
    onClose: (refresh?: boolean) => void
}

/**
 * 调度计划
 */
const SchedulePlanModal = ({
    datapushData,
    open,
    onClose,
}: ISchedulePlanModal) => {
    const [form] = Form.useForm()
    const [saveLoading, setSaveLoading] = useState(false)
    const [detailsData, setDetailsData] = useState<any>(null)

    useEffect(() => {
        if (open && datapushData) {
            getDetails()
        } else {
            form.resetFields()
        }
    }, [open, datapushData])

    // 获取详情
    const getDetails = async () => {
        try {
            const res = await getDataPushDetail(datapushData?.id)
            setDetailsData(res)
            if (res) {
                const obj = res.schedule_draft || res
                const {
                    schedule_start,
                    schedule_end,
                    schedule_time,
                    schedule_type,
                    crontab_expr,
                } = obj
                form.setFieldsValue({
                    schedule_type,
                    crontab_expr,
                    plan_date: [
                        schedule_start ? moment(schedule_start) : null,
                        schedule_end ? moment(schedule_end) : null,
                    ],
                    schedule_time: schedule_time ? moment(schedule_time) : null,
                    schedule_execute_status: schedule_time
                        ? ScheduleExecuteStatus.Timing
                        : ScheduleExecuteStatus.Immediate,
                })
            }
        } catch (error) {
            formatError(error)
        }
    }

    const handleOk = async (type: 'save' | 'confirm') => {
        if (!detailsData) {
            return
        }
        try {
            setSaveLoading(true)
            await form.validateFields()
            const values = form.getFieldsValue()
            const {
                schedule_time,
                plan_date,
                schedule_execute_status,
                ...other
            } = values
            const params = {
                ...other,
                id: detailsData.id,
                schedule_time: schedule_time
                    ? moment(schedule_time).format('YYYY-MM-DD HH:mm:ss')
                    : undefined,
                schedule_start: plan_date?.[0]
                    ? moment(plan_date[0]).format('YYYY-MM-DD')
                    : undefined,
                schedule_end: plan_date?.[1]
                    ? moment(plan_date[1]).format('YYYY-MM-DD')
                    : undefined,
            }
            if (detailsData.push_status === DataPushStatus.Stopped) {
                params.is_draft = type === 'save'
            }
            await putDataPushSchedule(params)
            message.success(type === 'save' ? __('保存成功') : __('提交成功'))
            onClose(true)
        } catch (error) {
            if (error?.errorFields?.length > 0) {
                return
            }
            formatError(error)
        } finally {
            setSaveLoading(false)
        }
    }

    const footer = (
        <div className={styles.footer}>
            <Button onClick={() => onClose()} key="cancel">
                {__('取消')}
            </Button>
            {detailsData?.push_status === DataPushStatus.Stopped && (
                <Button
                    onClick={() => handleOk('save')}
                    loading={saveLoading}
                    key="save"
                >
                    {__('保存')}
                </Button>
            )}
            <Button
                type="primary"
                onClick={() => handleOk('confirm')}
                loading={saveLoading}
                key="confirm"
            >
                {detailsData?.push_status === DataPushStatus.Stopped
                    ? __('确定并启用')
                    : __('确定')}
            </Button>
        </div>
    )

    return (
        <Modal
            width={666}
            open={open}
            title={__('修改调度时间')}
            maskClosable={false}
            destroyOnClose
            getContainer={false}
            okText={__('确定')}
            cancelText={__('取消')}
            okButtonProps={{ style: { minWidth: 80 }, loading: saveLoading }}
            cancelButtonProps={{ style: { minWidth: 80 } }}
            bodyStyle={{
                maxHeight: 484,
                minHeight: 300,
                padding: '20px 20px 0',
                overflow: 'hidden auto',
            }}
            onCancel={() => onClose()}
            footer={footer}
            className={styles.schedulePlanModal}
        >
            <SchedulePlanForm form={form} />
        </Modal>
    )
}

export default SchedulePlanModal
