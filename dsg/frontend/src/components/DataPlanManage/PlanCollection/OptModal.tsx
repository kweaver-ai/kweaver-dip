import {
    Button,
    Col,
    DatePicker,
    Drawer,
    Form,
    Input,
    Row,
    Select,
    Space,
    message,
} from 'antd'
import { trim } from 'lodash'
import moment from 'moment'
import { useContext, useEffect, useRef, useState } from 'react'
import TextEditor from '@/components/TextEditor'
import { MicroWidgetPropsContext } from '@/context'
import {
    checkNameDataAggregationPlan,
    createDataAggregationPlan,
    formatError,
    getDataAggregationPlanDetail,
    updateDataAggregationPlan,
} from '@/core'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import { ErrorInfo, keyboardReg, nameReg, validateName } from '@/utils'
import Return from '../Return'
import { SelectPriorityOptions } from './helper'
import __ from './locale'
import styles from './styles.module.less'
import DepartResponsibleSelect from '@/components/WorkOrder/DepartResponsibleSelect'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const { RangePicker } = DatePicker
const OptModal = ({ id, onClose }: any) => {
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [form] = Form.useForm()
    const [detail, setDetail] = useState<any>()
    const needDeclaration = useRef<boolean>(false)
    const [editorInfoError, setEditorInfoError] = useState(false)
    const [formSubmitted, setFormSubmitted] = useState(false)
    const [userInfo] = useCurrentUser()
    const getDetail = async () => {
        try {
            const res = await getDataAggregationPlanDetail(id)
            setDetail(res)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (id) {
            getDetail()
        }
    }, [id])

    useEffect(() => {
        if (detail) {
            const {
                finished_at,
                name,
                plan_info,
                remark,
                priority,
                responsible_uid,
                responsible_uname,
                started_at,
                auto_start,
            } = detail

            form?.setFieldsValue({
                name,
                plan_info,
                remark,
                priority: priority ? { value: priority } : undefined,
                date_range: started_at
                    ? finished_at
                        ? [
                              moment(started_at * 1000),
                              moment(finished_at * 1000),
                          ]
                        : [moment(started_at * 1000), undefined]
                    : undefined,
                responsible: responsible_uid
                    ? { value: responsible_uid, label: responsible_uname }
                    : undefined,
                auto_start,
            })
        } else {
            form?.resetFields()
            form?.setFieldsValue({
                responsible: {
                    value: userInfo?.ID,
                    key: userInfo?.ID,
                    label: userInfo?.VisionName,
                },
            })
        }
    }, [detail, form])

    const validateNameRepeat = (fid?: string) => {
        return (_: any, value: string) => {
            return new Promise((resolve, reject) => {
                const trimValue = trim(value)
                if (!trimValue) {
                    reject(new Error(__('输入不能为空')))
                    return
                }
                if (trimValue && !nameReg.test(trimValue)) {
                    reject(new Error(__('仅支持中英文、数字、下划线及中划线')))
                    return
                }
                const errorMsg = __('该名称已存在，请重新输入')
                checkNameDataAggregationPlan({
                    name: trimValue,
                    id: fid,
                })
                    .then(() => {
                        resolve(1)
                    })
                    .catch(() => {
                        reject(new Error(errorMsg))
                    })
            })
        }
    }

    const onFinish = async (values) => {
        if (!values.plan_info) {
            setEditorInfoError(true)
            return
        }

        const { priority, date_range, responsible, auto_start, ...rest } =
            values
        const [startTime, endTime] = date_range || []
        const params = {
            ...rest,
            need_declaration: needDeclaration.current,
            priority: priority ? priority.value : undefined,
            started_at: startTime ? startTime.startOf('day').unix() : undefined,
            finished_at: endTime ? endTime.endOf('day').unix() : undefined,
            responsible_uid: responsible?.value,
            auto_start: !!auto_start,
        }

        try {
            const tip = id ? __('更新成功') : __('新建成功')

            if (id) {
                await updateDataAggregationPlan(id, params)
            } else {
                await createDataAggregationPlan(params)
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

    const handleBack = () => {
        const values = form.getFieldsValue()

        const hasValue = Object.values(values).some((value) => !!value)
        if (hasValue) {
            ReturnConfirmModal({
                onCancel: () => onClose(false),
            })
        } else {
            onClose(false)
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
                        onReturn={() => handleBack()}
                        title={
                            (id ? __('编辑') : __('新建')) + __('数据归集计划')
                        }
                    />
                </div>
                <div className={styles.body}>
                    <div className={styles.content}>
                        <div className={styles.infoList}>
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={onFinish}
                                autoComplete="off"
                                className={styles.form}
                            >
                                <div className={styles.moduleTitle}>
                                    <h4>{__('基本信息')}</h4>
                                </div>
                                <Row
                                    gutter={40}
                                    className={styles.contentWrapper}
                                >
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('名称')}
                                            name="name"
                                            validateTrigger={[
                                                'onChange',
                                                'onBlur',
                                            ]}
                                            validateFirst
                                            rules={[
                                                {
                                                    required: true,
                                                    validateTrigger: 'onChange',
                                                    validator: validateName(),
                                                },
                                                {
                                                    validateTrigger: 'onBlur',
                                                    validator:
                                                        validateNameRepeat(id),
                                                },
                                            ]}
                                        >
                                            <Input
                                                placeholder={__('请输入名称')}
                                                maxLength={128}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('责任人')}
                                            name="responsible"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: __('请选择责任人'),
                                                },
                                            ]}
                                        >
                                            <DepartResponsibleSelect
                                                placeholder={__('请选择责任人')}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('优先级')}
                                            name="priority"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: __('请选择优先级'),
                                                },
                                            ]}
                                        >
                                            <Select
                                                labelInValue
                                                placeholder={__('请选择优先级')}
                                                options={SelectPriorityOptions}
                                                getPopupContainer={(node) =>
                                                    node.parentNode
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            className={styles.fullLine}
                                            label={
                                                <div
                                                    style={{
                                                        width: '100%',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent:
                                                            'space-between',
                                                    }}
                                                >
                                                    <Space size={8}>
                                                        <span>
                                                            {__('计划日期')}
                                                        </span>
                                                    </Space>
                                                    <span
                                                        style={{
                                                            color: 'rgba(0,0,0,0.3)',
                                                        }}
                                                    >
                                                        {__('可不设置结束日期')}
                                                    </span>
                                                </div>
                                            }
                                            name="date_range"
                                            validateTrigger={[
                                                'onChange',
                                                'onBlur',
                                            ]}
                                            validateFirst
                                            rules={[
                                                {
                                                    required: true,
                                                    message: ErrorInfo.NOTNULL,
                                                },
                                            ]}
                                        >
                                            <RangePicker
                                                style={{ width: '100%' }}
                                                format="YYYY-MM-DD"
                                                placeholder={[
                                                    __('开始日期'),
                                                    __('结束日期'),
                                                ]}
                                                disabledDate={(current) => {
                                                    return (
                                                        current &&
                                                        current <
                                                            moment().startOf(
                                                                'day',
                                                            )
                                                    )
                                                }}
                                                allowEmpty={[false, true]}
                                                getPopupContainer={(node) =>
                                                    node.parentElement ||
                                                    document.body
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                    {/* <Col span={12}>
                                        <Form.Item
                                            name="auto_start"
                                            valuePropName="checked"
                                        >
                                            <Checkbox>
                                                {__(
                                                    '审核通过后，计划在开始日期自动启动',
                                                )}
                                            </Checkbox>
                                        </Form.Item>
                                    </Col> */}
                                </Row>
                                <div className={styles.moduleTitle}>
                                    <h4>{__('计划信息')}</h4>
                                </div>
                                <Row
                                    gutter={40}
                                    className={styles.contentWrapper}
                                >
                                    <Col span={24}>
                                        <Form.Item
                                            label={__('计划内容')}
                                            name="plan_info"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: ErrorInfo.NOTNULL,
                                                },
                                            ]}
                                            validateStatus={
                                                editorInfoError ? 'error' : ''
                                            }
                                            help={
                                                editorInfoError
                                                    ? ErrorInfo.NOTNULL
                                                    : ''
                                            }
                                        >
                                            <TextEditor
                                                className={
                                                    editorInfoError
                                                        ? styles.errorBorder
                                                        : ''
                                                }
                                                placeholder={__('请输入')}
                                                onChange={(value) => {
                                                    const newValue =
                                                        value || undefined
                                                    form.setFieldsValue({
                                                        plan_info: newValue,
                                                    })
                                                    if (formSubmitted) {
                                                        setEditorInfoError(
                                                            !newValue,
                                                        )
                                                    }
                                                }}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            label={__('备注')}
                                            name="remark"
                                            rules={[
                                                {
                                                    pattern: keyboardReg,
                                                    message:
                                                        ErrorInfo.EXCEPTEMOJI,
                                                },
                                            ]}
                                        >
                                            <Input.TextArea
                                                placeholder={__('请输入')}
                                                maxLength={300}
                                                style={{
                                                    height: 200,
                                                    resize: 'none',
                                                }}
                                                className={styles['show-count']}
                                                showCount
                                            />
                                        </Form.Item>
                                    </Col>
                                    <div
                                        style={{
                                            width: '100%',
                                            height: '48px',
                                        }}
                                    />
                                </Row>
                            </Form>
                        </div>
                    </div>
                    <div className={styles.footer}>
                        <Space size={16}>
                            <Button onClick={() => onClose(false)}>
                                {__('取消')}
                            </Button>
                            <Button
                                onClick={() => {
                                    needDeclaration.current = false
                                    setFormSubmitted(true)
                                    const planInfo =
                                        form.getFieldValue('plan_info')
                                    setEditorInfoError(!planInfo)
                                    form.submit()
                                }}
                            >
                                {__('暂存')}
                            </Button>
                            <Button
                                type="primary"
                                onClick={() => {
                                    needDeclaration.current = true
                                    setFormSubmitted(true)
                                    const planInfo =
                                        form.getFieldValue('plan_info')
                                    setEditorInfoError(!planInfo)
                                    form.submit()
                                }}
                            >
                                {__('提交')}
                            </Button>
                        </Space>
                    </div>
                </div>
            </div>
        </Drawer>
    )
}

export default OptModal
