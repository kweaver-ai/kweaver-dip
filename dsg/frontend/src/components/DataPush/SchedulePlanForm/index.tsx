import React, { useMemo, useRef } from 'react'
import {
    Col,
    DatePicker,
    Form,
    FormInstance,
    FormProps,
    Radio,
    Row,
} from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import moment from 'moment'
import __ from '../locale'
import styles from './styles.module.less'
import {
    ScheduleExecuteStatus,
    scheduleExecuteStatusOptions,
    ScheduleType,
    scheduleTypeOptions,
} from '../const'
import CrontabEditor from './CrontabEditor'

const { RangePicker } = DatePicker

interface ISchedulePlanForm extends FormProps {
    form: FormInstance
    isFullWidth?: boolean // 是否铺满, 默认是false, 占一半
}

/**
 * 调度计划
 */
const SchedulePlanForm = ({
    form,
    isFullWidth = false,
    ...props
}: ISchedulePlanForm) => {
    const crontabEditorRef = useRef<any>(null)

    // 禁用时间
    const disabledDateTime = (date: moment.Moment | null) => {
        const selectedData = date || moment()
        const isToday = selectedData.isSame(moment(), 'day')

        if (!isToday) {
            return {
                disabledHours: () => [],
                disabledMinutes: () => [],
                disabledSeconds: () => [],
            }
        }

        return {
            disabledHours: () => {
                const hours: number[] = []
                const currentHour = moment().hour()
                for (let i = 0; i < currentHour; i += 1) {
                    hours.push(i)
                }
                return hours
            },
            disabledMinutes: () => {
                const currentHour = moment().hour()
                const selectedHour = selectedData.hour()
                if (currentHour < selectedHour) {
                    return []
                }
                const minutes: number[] = []
                const currentMinute = moment().minute()
                for (let i = 0; i <= currentMinute; i += 1) {
                    minutes.push(i)
                }
                return minutes
            },
            disabledSeconds: () => [],
        }
    }

    return (
        <Form
            form={form}
            name="schedulePlanForm"
            layout="horizontal"
            autoComplete="off"
            scrollToFirstError
            className={styles.schedulePlanForm}
            initialValues={{
                schedule_type: ScheduleType.OneTime,
                schedule_execute_status: ScheduleExecuteStatus.Immediate,
            }}
            {...props}
        >
            <Row gutter={40}>
                <Col span={12}>
                    <Form.Item
                        name="schedule_type"
                        label={__('调度类型')}
                        required
                        rules={[
                            {
                                required: true,
                                message: __('请选择调度类型'),
                            },
                        ]}
                    >
                        <Radio.Group>
                            {scheduleTypeOptions.map((item) => (
                                <Radio value={item.value} key={item.value}>
                                    {item.label}
                                </Radio>
                            ))}
                        </Radio.Group>
                    </Form.Item>
                </Col>
            </Row>
            <Form.Item
                noStyle
                shouldUpdate={(prev, cur) =>
                    prev.schedule_type !== cur.schedule_type
                }
            >
                {({ getFieldValue }) => {
                    const scheduleType = getFieldValue('schedule_type')
                    return (
                        scheduleType === ScheduleType.OneTime && (
                            <Row gutter={40}>
                                <Col span={12}>
                                    <Form.Item
                                        name="schedule_execute_status"
                                        label={__('调度时间')}
                                        required
                                        rules={[
                                            {
                                                required: true,
                                                message: __('请选择调度时间'),
                                            },
                                        ]}
                                    >
                                        <Radio.Group>
                                            {scheduleExecuteStatusOptions.map(
                                                (item) => (
                                                    <Radio
                                                        value={item.value}
                                                        key={item.value}
                                                    >
                                                        {item.label}
                                                    </Radio>
                                                ),
                                            )}
                                        </Radio.Group>
                                    </Form.Item>
                                </Col>
                            </Row>
                        )
                    )
                }}
            </Form.Item>
            <Form.Item
                noStyle
                shouldUpdate={(prev, cur) =>
                    prev.schedule_execute_status !==
                        cur.schedule_execute_status ||
                    prev.schedule_type !== cur.schedule_type
                }
            >
                {({ getFieldValue }) => {
                    const status = getFieldValue('schedule_execute_status')
                    const scheduleType = getFieldValue('schedule_type')
                    return (
                        status === ScheduleExecuteStatus.Timing &&
                        scheduleType === ScheduleType.OneTime && (
                            <Row gutter={40}>
                                <Col span={isFullWidth ? 24 : 12}>
                                    <Form.Item
                                        label={__('定时时间')}
                                        name="schedule_time"
                                        required
                                        rules={[
                                            {
                                                required: true,
                                                message: __('请选择定时时间'),
                                            },
                                        ]}
                                    >
                                        <DatePicker
                                            style={{
                                                width: '100%',
                                            }}
                                            showTime
                                            getPopupContainer={(n) => n}
                                            placeholder={__('请选择定时时间')}
                                            suffixIcon={<ClockCircleOutlined />}
                                            disabledDate={(current) => {
                                                return (
                                                    current &&
                                                    current <
                                                        moment().startOf('day')
                                                )
                                            }}
                                            disabledTime={disabledDateTime}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        )
                    )
                }}
            </Form.Item>
            <Form.Item
                noStyle
                shouldUpdate={(prev, cur) =>
                    prev.schedule_type !== cur.schedule_type
                }
            >
                {({ getFieldValue }) => {
                    const scheduleType = getFieldValue('schedule_type')
                    return (
                        scheduleType === ScheduleType.Periodic && (
                            <Row gutter={40}>
                                <Col span={isFullWidth ? 24 : 16}>
                                    <Form.Item
                                        label={__('计划日期')}
                                        name="plan_date"
                                        required
                                        rules={[
                                            {
                                                required: true,
                                                message: __('请选择计划日期'),
                                            },
                                        ]}
                                        style={{ position: 'relative' }}
                                    >
                                        <RangePicker
                                            style={{
                                                width: '100%',
                                            }}
                                            getPopupContainer={(n) => n}
                                            placeholder={[
                                                __('开始日期'),
                                                __('结束日期'),
                                            ]}
                                            disabledDate={(current) => {
                                                return (
                                                    current &&
                                                    current <
                                                        moment().startOf('day')
                                                )
                                            }}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={isFullWidth ? 0 : 8}>
                                    {/* <div className={styles.planDateTip}>
                                        {__('可不设置结束日期')}
                                    </div> */}
                                </Col>
                            </Row>
                        )
                    )
                }}
            </Form.Item>
            <Form.Item
                noStyle
                shouldUpdate={(prev, cur) =>
                    prev.schedule_type !== cur.schedule_type
                }
            >
                {({ getFieldValue, setFields }) => {
                    const scheduleType = getFieldValue('schedule_type')
                    return (
                        scheduleType === ScheduleType.Periodic && (
                            <Row gutter={40}>
                                <Col span={24}>
                                    <Form.Item
                                        label={__('调度规则')}
                                        name="crontab_expr"
                                        required
                                        validateTrigger={['onBlur']}
                                        rules={[
                                            {
                                                validateTrigger: 'onBlur',
                                                validator: (_, value) =>
                                                    crontabEditorRef.current?.validate(),
                                            },
                                        ]}
                                    >
                                        <CrontabEditor ref={crontabEditorRef} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        )
                    )
                }}
            </Form.Item>
        </Form>
    )
}

export default SchedulePlanForm
