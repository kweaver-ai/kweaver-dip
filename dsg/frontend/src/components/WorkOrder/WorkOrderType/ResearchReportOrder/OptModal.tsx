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
    Tooltip,
    message,
} from 'antd'
import { trim } from 'lodash'
import moment from 'moment'
import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ErrorInfo, keyboardReg, nameReg, validateName } from '@/utils'
import {
    checkNameWorkOrder,
    createWorkOrder,
    formatError,
    getWorkOrderDetail,
    updateWorkOrder,
} from '@/core'
import { MicroWidgetPropsContext } from '@/context'

import { useCurrentUser } from '@/hooks/useCurrentUser'
import DepartResponsibleSelect from '../../DepartResponsibleSelect'
import { OrderTypeOptions, SelectPriorityOptions } from '../../helper'
import Return from '../../Return'
import __ from './locale'
import styles from './styles.module.less'
import { SourceTypeEnum } from '../../WorkOrderManage/helper'

const OptModal = ({ id, visible, type, onClose }: any) => {
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [form] = Form.useForm()
    const [detail, setDetail] = useState<any>()
    const container = useRef<any>(null)
    const [userInfo] = useCurrentUser()

    const getDetail = async () => {
        try {
            const res = await getWorkOrderDetail(id)
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
                description,
                finished_at,
                name,
                // remark,
                priority,
                responsible_uid,
                responsible_uname,
            } = detail

            const param: any = {
                name,
                description,
                // remark,
                priority: priority ? { value: priority } : undefined,
                finished_at: finished_at
                    ? moment(finished_at * 1000)
                    : undefined,
                responsible: responsible_uid
                    ? { value: responsible_uid, label: responsible_uname }
                    : undefined,
            }

            form?.setFieldsValue(param)
        } else {
            form?.resetFields()

            const param: any = {}
            param.responsible = {
                value: userInfo?.ID,
                key: userInfo?.ID,
                label: userInfo?.VisionName,
            }

            form?.setFieldsValue(param)
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
                checkNameWorkOrder({
                    name: trimValue,
                    id: fid,
                    type,
                })
                    .then((res) => {
                        if (res) {
                            reject(new Error(errorMsg))
                        } else {
                            resolve(1)
                        }
                    })
                    .catch(() => {
                        reject(new Error(errorMsg))
                    })
            })
        }
    }

    const onFinish = async (values) => {
        const { priority, responsible, finished_at, ...rest } = values
        const params = {
            ...rest,
            type,
            priority: priority ? priority.value : undefined,

            finished_at: finished_at
                ? finished_at.endOf('day').unix()
                : undefined,
            responsible_uid: responsible?.value,

            source_type: SourceTypeEnum.STANDALONE,
        }

        try {
            const tip = id ? __('更新成功') : __('新建成功')

            if (id) {
                await updateWorkOrder(id, params)
            } else {
                await createWorkOrder(params)
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

    const typeLabel = useMemo(() => {
        return OrderTypeOptions.find((o) => o.value === type)?.label ?? ''
    }, [type])

    // 禁止选择今天之前的日期
    const disabledDate = (current) => {
        return current && current < moment().startOf('day')
    }

    return (
        <Drawer
            open={visible}
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
                        title={`${id ? __('编辑') : __('新建')}${__(
                            '${type}工单',
                            {
                                type: typeLabel,
                            },
                        )}`}
                    />
                </div>
                <div className={styles.body}>
                    <div className={styles.content} ref={container}>
                        <div className={styles.infoList}>
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={onFinish}
                                autoComplete="off"
                                className={styles.form}
                            >
                                <div
                                    className={styles.moduleTitle}
                                    id="base-info"
                                >
                                    <h4>{__('基本信息')}</h4>
                                </div>
                                <Row gutter={24}>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('工单名称')}
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
                                                placeholder={__(
                                                    '请输入工单名称',
                                                )}
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
                                            label={__('截止日期')}
                                            name="finished_at"
                                            validateTrigger={[
                                                'onChange',
                                                'onBlur',
                                            ]}
                                            validateFirst
                                        >
                                            <DatePicker
                                                style={{ width: '100%' }}
                                                format="YYYY-MM-DD"
                                                disabledDate={disabledDate}
                                                placeholder={__(
                                                    '请选择截止日期',
                                                )}
                                                getPopupContainer={(node) =>
                                                    node.parentElement ||
                                                    document.body
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={24}>
                                    <Col span={24}>
                                        <Form.Item
                                            label={__('工单说明')}
                                            name="description"
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
                                                maxLength={800}
                                                style={{
                                                    height: 100,
                                                    resize: 'none',
                                                }}
                                                className={styles['show-count']}
                                                showCount
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Form>
                        </div>
                    </div>
                    <div className={styles.footer}>
                        <Space size={16}>
                            <Button onClick={() => onClose(false)}>
                                {__('取消')}
                            </Button>
                            <Tooltip>
                                <Button
                                    type="primary"
                                    onClick={() => {
                                        form.submit()
                                    }}
                                >
                                    {__('提交')}
                                </Button>
                            </Tooltip>
                        </Space>
                    </div>
                </div>
            </div>
        </Drawer>
    )
}

export default OptModal
