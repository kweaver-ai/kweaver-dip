import { useState, useEffect } from 'react'
import classNames from 'classnames'
import moment from 'moment'
import { Form, Row, Col, Select, InputNumber, TimePicker } from 'antd'
import styles from './styles.module.less'
import __ from '../locale'
import { LabelTitle } from '../BaseInfo'
import { ScheduleTypeList, ScheduleType, ScheduleTypeTips } from '../const'

interface ISchedulePlan {
    value: any
    onFormChange: (val: any) => void
}

const SchedulePlan = (props: ISchedulePlan) => {
    const { value, onFormChange } = props
    const [form] = Form.useForm()
    const [schedulingPlan, setSchedulingPlan] = useState<ScheduleType>(
        value?.scheduling_plan,
    )
    const [interval, setInterval] = useState<any>(value?.interval)
    const [time, setTime] = useState<any>(value?.time)

    useEffect(() => {
        if (value) {
            setSchedulingPlan(value?.scheduling_plan)
            setInterval(value?.interval)
            setTime(value?.time)
            form.setFieldsValue(value)
        }
    }, [value])

    return (
        <div className={styles.schedulePlanWrapper}>
            <Form form={form} layout="vertical">
                <Row id="resource">
                    <LabelTitle label={__('调度信息')} />
                    <Col span={12}>
                        <Form.Item
                            label={__('调度计划')}
                            name="scheduling_plan"
                            rules={[
                                {
                                    required: true,
                                    message: `${__('请选择')}${__('调度计划')}`,
                                },
                            ]}
                        >
                            <Select
                                // allowClear
                                options={ScheduleTypeList}
                                placeholder={`${__('请选择')}${__('调度计划')}`}
                                getPopupContainer={(node) => node.parentNode}
                                onChange={(val) => {
                                    onFormChange({
                                        ...value,
                                        interval: undefined,
                                        time: undefined,
                                        scheduling_plan: val,
                                    })
                                }}
                                value={schedulingPlan}
                            />
                        </Form.Item>
                    </Col>
                    {[
                        ScheduleType.Minute,
                        ScheduleType.Week,
                        ScheduleType.Month,
                    ].includes(schedulingPlan) && (
                        <Form.Item
                            name="interval"
                            noStyle
                            rules={[
                                {
                                    required: true,
                                    message: __('请输入'),
                                },
                            ]}
                        >
                            <div className={styles.intervalWrapper}>
                                <span className={styles.fieldLabel}>
                                    {ScheduleTypeTips[schedulingPlan].first}
                                </span>
                                <InputNumber
                                    min={1}
                                    placeholder={__('请输入')}
                                    className={styles.inputWrapper}
                                    onChange={(val) => {
                                        onFormChange({
                                            ...value,
                                            interval: val,
                                        })
                                    }}
                                    value={interval}
                                />
                                <span>
                                    {schedulingPlan === ScheduleType.Minute
                                        ? ScheduleTypeTips[schedulingPlan]?.last
                                        : ScheduleTypeTips[schedulingPlan]
                                              ?.middle}
                                </span>
                            </div>
                        </Form.Item>
                    )}
                    {[
                        ScheduleType.Month,
                        ScheduleType.Week,
                        ScheduleType.Day,
                    ].includes(schedulingPlan) && (
                        <Form.Item
                            name="time"
                            noStyle
                            rules={[
                                {
                                    required: true,
                                    message: __('请选择时间'),
                                },
                            ]}
                        >
                            <div
                                className={classNames(
                                    styles.intervalWrapper,
                                    schedulingPlan !== ScheduleType.Day &&
                                        styles.timeWrapper,
                                )}
                            >
                                {schedulingPlan === ScheduleType.Day && (
                                    <span className={styles.fieldLabel}>
                                        {
                                            ScheduleTypeTips[schedulingPlan]
                                                ?.first
                                        }
                                    </span>
                                )}
                                <TimePicker
                                    format="HH:mm"
                                    placeholder={__('请选择时间')}
                                    className={styles.inputWrapper}
                                    onChange={(val) => {
                                        onFormChange({
                                            ...value,
                                            time: moment(val).format('HH:mm'),
                                        })
                                    }}
                                    value={
                                        time ? moment(time, 'HH:mm') : undefined
                                    }
                                />
                                <span>
                                    {ScheduleTypeTips[schedulingPlan].last}
                                </span>
                            </div>
                        </Form.Item>
                    )}
                </Row>
            </Form>
        </div>
    )
}

export default SchedulePlan
