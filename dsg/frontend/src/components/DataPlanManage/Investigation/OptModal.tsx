import { Button, Col, Drawer, Form, Input, Row, Space, message } from 'antd'
import { trim } from 'lodash'
import { useContext, useEffect, useRef, useState } from 'react'
import TextEditor from '@/components/TextEditor'
import { MicroWidgetPropsContext } from '@/context'
import {
    checkNameInvestigationReport,
    createInvestigationReport,
    formatError,
    getInvestigationReportDetail,
    updateInvestigationReport,
} from '@/core'
import { ReturnConfirmModal } from '@/ui'
import { ErrorInfo, keyboardReg, nameReg, validateName } from '@/utils'
import Return from '../Return'
import __ from './locale'
import styles from './styles.module.less'
import WorkOrderSelect from './WorkOrderSelect'

const OptModal = ({ id, onClose }: any) => {
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [form] = Form.useForm()
    const [detail, setDetail] = useState<any>()
    const needDeclaration = useRef<boolean>(false)
    const [formSubmitted, setFormSubmitted] = useState(false)
    const [loading, setLoading] = useState<boolean>(false)
    const [editorInfoError, setEditorInfoError] = useState(false)
    const getDetail = async () => {
        try {
            const res = await getInvestigationReportDetail(id)
            // 编辑状态下对暂存版本处理
            if (res?.change_audit) {
                setDetail({ ...(res || {}), ...(res?.change_audit || {}) })
            } else {
                setDetail(res)
            }
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
                work_order_id,
                work_order_name,
                name,
                research_conclusion,
                research_content,
                research_method,
                research_object,
                research_purpose,
                remark,
            } = detail

            form?.setFieldsValue({
                name,
                research_conclusion,
                research_content,
                research_method,
                research_object,
                research_purpose,
                remark,
                work_order: work_order_id
                    ? {
                          value: work_order_id,
                          label: work_order_name,
                      }
                    : undefined,
            })
        } else {
            form?.resetFields()
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
                checkNameInvestigationReport({
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
        if (!values.research_content) {
            setEditorInfoError(true)
            return
        }
        setLoading(true)
        const { work_order, ...rest } = values
        const params = {
            ...rest,
            work_order_id: work_order?.value,
            need_declaration: needDeclaration.current,
        }

        try {
            const tip = id ? __('更新成功') : __('新建成功')

            if (id) {
                await updateInvestigationReport(id, params)
            } else {
                await createInvestigationReport(params)
            }

            if (microWidgetProps?.components?.toast) {
                microWidgetProps?.components?.toast.success(tip)
            } else {
                message.success(tip)
            }
            onClose?.(true)
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
        } finally {
            setLoading(false)
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
                        title={(id ? __('编辑') : __('新建')) + __('调研报告')}
                    />
                </div>
                <div className={styles.body}>
                    <div className={styles.content}>
                        <div className={styles.infoList}>
                            <Form
                                form={form}
                                layout="vertical"
                                autoComplete="off"
                                onFinish={onFinish}
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
                                                disabled={
                                                    id &&
                                                    detail?.declaration_status ===
                                                        'declarationed'
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('关联工单')}
                                            name="work_order"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: __('请关联工单'),
                                                },
                                            ]}
                                        >
                                            <WorkOrderSelect type="data_aggregation" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('调研目的')}
                                            name="research_purpose"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: ErrorInfo.NOTNULL,
                                                },
                                            ]}
                                        >
                                            <Input
                                                placeholder={__(
                                                    '请输入调研目的',
                                                )}
                                                maxLength={300}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('调研对象')}
                                            name="research_object"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: ErrorInfo.NOTNULL,
                                                },
                                            ]}
                                        >
                                            <Input
                                                placeholder={__(
                                                    '请输入调研对象',
                                                )}
                                                maxLength={300}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('调研方法')}
                                            name="research_method"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: ErrorInfo.NOTNULL,
                                                },
                                            ]}
                                        >
                                            <Input
                                                placeholder={__(
                                                    '请输入调研方法',
                                                )}
                                                maxLength={300}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <div className={styles.moduleTitle}>
                                    <h4>{__('调研信息')}</h4>
                                </div>
                                <Row
                                    gutter={40}
                                    className={styles.contentWrapper}
                                >
                                    <Col span={24}>
                                        <Form.Item
                                            label={__('调研内容')}
                                            name="research_content"
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
                                                        research_content:
                                                            newValue,
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
                                            label={__('调研结论')}
                                            name="research_conclusion"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: ErrorInfo.NOTNULL,
                                                },
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
                                                className={styles['text-area']}
                                                showCount
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
                                loading={loading}
                                onClick={() => {
                                    needDeclaration.current = false
                                    setFormSubmitted(true)
                                    const reContent =
                                        form.getFieldValue('research_content')
                                    setEditorInfoError(!reContent)
                                    form.submit()
                                    // form.submit()
                                    // const val = form?.getFieldsValue()
                                    // onFinish(val)
                                }}
                            >
                                {__('暂存')}
                            </Button>
                            <Button
                                type="primary"
                                loading={loading}
                                onClick={() => {
                                    needDeclaration.current = true
                                    setFormSubmitted(true)
                                    const reContent =
                                        form.getFieldValue('research_content')
                                    setEditorInfoError(!reContent)
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
