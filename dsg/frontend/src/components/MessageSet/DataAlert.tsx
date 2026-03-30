import { InputNumber, Input, Form, message } from 'antd'
import React, { useEffect, useState } from 'react'
import { formatError, getAlarmRule, updateAlarmRule, IAlarmRule } from '@/core'
import {
    renderLoader,
    DetailGroupTitle,
    initialValues,
    Mode,
    FooterButtons,
} from './helper'
import __ from './locale'
import styles from './styles.module.less'

const DataAlert = () => {
    const [mode, setMode] = useState<Mode.View | Mode.Edit>(Mode.View) // 默认为 view 模式
    const [form] = Form.useForm()
    const [loading, setLoading] = useState<boolean>(true)
    const [alarmRule, setAlarmRule] = useState<IAlarmRule | null>(null)

    useEffect(() => {
        getData()
    }, [])

    // 获取表格数据
    const getData = async () => {
        try {
            setLoading(true)
            const res = await getAlarmRule()
            // 设置表单值
            form.setFieldsValue(res?.entries[0] || initialValues)
            setAlarmRule(res?.entries[0])
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    // 处理表单提交
    const onFinish = async (values) => {
        try {
            await updateAlarmRule({
                alarm_rules: [
                    {
                        ...values,
                        id: alarmRule?.id,
                    },
                ],
            })
            message.success(__('保存成功'))
            // 保存成功后切换到 view 模式
            setMode(Mode.View)
        } catch (error) {
            formatError(error)
        }
    }

    const handleSubmit = async () => {
        try {
            await form.validateFields()
            form.submit()
        } catch (error) {
            // console.log(error)
        }
    }

    // 处理重置
    const handleReset = () => {
        form.setFieldsValue(initialValues)
    }

    // 切换到编辑模式
    const handleEdit = () => {
        setMode(Mode.Edit)
    }

    return (
        <div>
            {loading ? (
                renderLoader()
            ) : (
                <Form
                    form={form}
                    initialValues={initialValues}
                    onFinish={onFinish}
                >
                    <div className={styles.messageSetPanel}>
                        <div>
                            <DetailGroupTitle
                                title={__('告警期限配置')}
                                tips={__(
                                    '依据配置的“告警期限”，从数据质量整改生成时开始计算工单整改的截止日期',
                                )}
                            />
                            <div className={styles.timeInputNumberWrapper}>
                                <Form.Item
                                    name="deadline_time"
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请输入告警期限'),
                                        },
                                    ]}
                                >
                                    <InputNumber
                                        min={1}
                                        precision={0}
                                        disabled={mode === Mode.View}
                                    />
                                </Form.Item>
                                <div className={styles.timeUnit}>
                                    {__('天')}
                                </div>
                            </div>
                        </div>
                        <div>
                            <DetailGroupTitle
                                title={__('临期告警内容')}
                                tips={__('以下内容会显示在临期告警消息提醒中')}
                            />
                            <Form.Item name="deadline_reminder">
                                <Input
                                    className={styles.messageInput}
                                    // disabled={mode === Mode.View}
                                    disabled
                                />
                            </Form.Item>
                        </div>
                    </div>
                    <div className={styles.messageSetPanel}>
                        <div>
                            <DetailGroupTitle
                                title={__('提前告警配置')}
                                tips={__(
                                    '若在配置的“提前告警”天数时仍未完成数据质量整改，则会发出告警消息提醒',
                                )}
                            />
                            <div className={styles.timeInputNumberWrapper}>
                                <Form.Item
                                    name="beforehand_time"
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请输入提前告警天数'),
                                        },
                                    ]}
                                >
                                    <InputNumber
                                        min={1}
                                        precision={0}
                                        disabled={mode === Mode.View}
                                    />
                                </Form.Item>
                                <div className={styles.timeUnit}>
                                    {__('天')}
                                </div>
                            </div>
                        </div>
                        <div>
                            <DetailGroupTitle
                                title={__('提前告警内容')}
                                tips={__('以下内容会显示在提前告警消息提醒中')}
                            />
                            <Form.Item name="beforehand_reminder">
                                <Input
                                    className={styles.messageInput}
                                    // disabled={mode === Mode.View}
                                    disabled
                                />
                            </Form.Item>
                        </div>
                    </div>
                    <FooterButtons
                        mode={mode}
                        handleEdit={handleEdit}
                        handleSubmit={handleSubmit}
                        handleReset={handleReset}
                    />
                </Form>
            )}
        </div>
    )
}

export default DataAlert
