import React, { useEffect, useState } from 'react'
import { DatePicker, Form, message, Modal, Row, Switch, TimePicker } from 'antd'
import moment from 'moment'
import { RangePickerProps } from 'antd/es/date-picker'
import styles from './styles.module.less'
import {
    createWfTimePlan,
    editWfTimePlan,
    formatError,
    messageError,
} from '@/core'
import __ from './locale'
import NumberInput from '@/ui/NumberInput'
import { NumberType } from '@/ui/NumberInput/const'
import { DeadlineOutlined } from '@/icons'

interface IEditTimePlan {
    visible: boolean
    data?: any
    taskId?: string
    onClose: () => void
    onSure: (any) => void
}

/**
 * 创建/编辑 时间计划
 * @param visible 显示/隐藏
 * @param data 工作流数据
 * @param onClose 关闭
 * @param onSure 确定
 */
const EditTimePlan: React.FC<IEditTimePlan> = ({
    visible,
    data,
    taskId,
    onClose,
    onSure,
}) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [switchOpen, setSwitchOpen] = useState(true)

    // 不可选日期
    const disabledDate: RangePickerProps['disabledDate'] = (current) => {
        return current && current < moment().startOf('day')
    }

    useEffect(() => {
        if (visible) {
            const date = new Date()
            if (data?.execution_time) {
                form.setFieldsValue({
                    frequency: data.frequency,
                    execution_time: moment(
                        `${date.toLocaleDateString()} ${data.execution_time}`,
                    ),
                    start_date: data.start_date ? moment(data.start_date) : '',
                    end_date: data.end_date ? moment(data.end_date) : '',
                })
                setSwitchOpen(data?.activation)
                return
            }
            form.setFieldsValue({
                frequency: 1,
                start_date: moment(date.toLocaleDateString()),
            })
            return
        }
        form.resetFields()
    }, [visible])

    // 对话框onCancel
    const handleModalCancel = () => {
        onClose()
        form.resetFields()
    }

    // 对话框onOk
    const handleModalOk = async () => {
        try {
            setLoading(true)
            await form.validateFields()
            const { frequency, execution_time, start_date, end_date } =
                form.getFieldsValue()
            if (
                end_date &&
                moment(start_date).startOf('day') >
                    moment(end_date).startOf('day')
            ) {
                form.setFields([
                    {
                        name: 'end_date',
                        errors: [__('不可早于“执行开始于”')],
                    },
                ])
                return
            }
            const queryParams = {
                frequency: Number(frequency),
                unit: 'day',
                execution_time: moment(execution_time).format('HH:mm'),
                start_date: moment(start_date).format('YYYY-MM-DD'),
                end_date: end_date ? moment(end_date).format('YYYY-MM-DD') : '',
                activation: switchOpen,
                task_id: taskId,
            }

            let res
            if (!data?.execution_time) {
                res = await createWfTimePlan(data?.id, queryParams)
            } else {
                res = await editWfTimePlan(data?.id, queryParams)
            }
            message.success(__('配置成功'))
            handleModalCancel()
            onSure(res)
        } catch (e) {
            if (e.errorFields) {
                return
            }
            if (
                e?.data?.detail?.[0]?.Key === 'InvalidParameter' &&
                e?.data?.detail?.[0]?.Message.includes('10078')
            ) {
                messageError(__('“周期”或“执行时间”不在执行日期范围内'))
                return
            }
            formatError(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            title={__('配置时间计划')}
            width={640}
            maskClosable={false}
            open={visible}
            onCancel={handleModalCancel}
            onOk={handleModalOk}
            destroyOnClose
            getContainer={false}
            className={styles.editTimePlanWrap}
            okButtonProps={{ loading }}
        >
            <Form
                form={form}
                layout="vertical"
                autoComplete="off"
                initialValues={{ remember: true }}
            >
                <Row className={styles.rowRrapper}>
                    <Form.Item
                        label={__('周期')}
                        name="frequency"
                        className={styles.w284}
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                            {
                                required: true,
                                validator: (ruler, value) =>
                                    Number(value) > 31 || Number(value) < 1
                                        ? Promise.reject(
                                              new Error(
                                                  __('仅支持 1~31 之间的整数'),
                                              ),
                                          )
                                        : Promise.resolve(),
                            },
                        ]}
                    >
                        <NumberInput
                            placeholder={__('请输入周期')}
                            addonAfter={__('天')}
                            type={NumberType.Natural}
                        />
                    </Form.Item>
                    <Form.Item
                        label={__('执行时间')}
                        name="execution_time"
                        className={styles.w284}
                        rules={[
                            {
                                required: true,
                                message: __('请选择执行时间'),
                            },
                        ]}
                    >
                        <TimePicker
                            placeholder={__('请选择执行时间')}
                            style={{ width: '100%' }}
                            format="HH:mm"
                        />
                    </Form.Item>
                </Row>
                <Row className={styles.rowRrapper}>
                    <Form.Item
                        label={__('执行开始于')}
                        name="start_date"
                        className={styles.w284}
                        rules={[
                            {
                                required: true,
                                message: __('请选择执行开始于'),
                            },
                        ]}
                    >
                        <DatePicker
                            placeholder={__('请选择执行开始于')}
                            style={{ width: '100%' }}
                            suffixIcon={<DeadlineOutlined />}
                            disabledDate={disabledDate}
                        />
                    </Form.Item>
                    <Form.Item
                        label={__('执行结束于')}
                        name="end_date"
                        className={styles.w284}
                    >
                        <DatePicker
                            placeholder={__('请选择执行结束于')}
                            style={{ width: '100%' }}
                            suffixIcon={<DeadlineOutlined />}
                            onChange={() => {
                                form.setFields([
                                    { name: 'end_date', errors: [] },
                                ])
                            }}
                            disabledDate={(date) => {
                                const startDate =
                                    form.getFieldValue('start_date')
                                if (startDate) {
                                    startDate.endOf('day').unix()
                                    return (
                                        date <
                                        moment(
                                            (startDate.endOf('day').unix() +
                                                24 * 60 * 60) *
                                                1000,
                                        ).startOf('day')
                                    )
                                }
                                return date && date < moment().startOf('day')
                            }}
                        />
                    </Form.Item>
                </Row>
                <div className={styles.tp_switchWrap}>
                    <div className={styles.tp_switchTitleWrap}>
                        <div>{__('是否启用')}</div>
                        <div className={styles.tp_switchDesc}>
                            {__('配置后也可以随时开启或关闭')}
                        </div>
                    </div>
                    <Switch
                        checked={switchOpen}
                        onChange={(checked) => setSwitchOpen(checked)}
                    />
                </div>
            </Form>
        </Modal>
    )
}

export default EditTimePlan
