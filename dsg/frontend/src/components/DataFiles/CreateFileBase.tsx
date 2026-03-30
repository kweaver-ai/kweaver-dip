import { CloseOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { Drawer, Form, Input, Row, Col, Space, Button, message } from 'antd'
import __ from './locale'
import styles from './styles.module.less'
import { LabelTitle } from './helper'
import {
    createDataCatalogFile,
    editDataCatalogFile,
    formatError,
    getMainDepartInfo,
    getFileCatalogDetail,
} from '@/core'
import { ErrorInfo, keyboardReg, nameReg } from '@/utils'
import { validateNameRepeat } from './const'
import DepartmentAndOrgSelect from '../DepartmentAndOrgSelect'

interface CreateFileBaseProps {
    onConfirm: (dataId?: string) => void
    onCancel: () => void
    show: boolean
    dataId?: string
}
const CreateFileBase = ({
    onConfirm,
    onCancel,
    show,
    dataId,
}: CreateFileBaseProps) => {
    const [form] = Form.useForm()
    const [defaultDepartment, setDefaultDepartment] = useState<string>()

    useEffect(() => {
        if (dataId) {
            getFileDetail(dataId)
        } else {
            queryMainDepartInfo()
        }
    }, [dataId])

    // 获取文件资源详情
    const getFileDetail = async (id: string) => {
        try {
            const res = await getFileCatalogDetail(id)
            form.setFieldsValue({
                title: res.name,
                department: res.department_id,
                description: res.description,
            })
            setDefaultDepartment(res.department_id)
        } catch (err) {
            formatError(err)
        }
    }
    const onFinish = async (values) => {
        try {
            if (dataId) {
                await editDataCatalogFile(dataId, {
                    name: values.title,
                    department_id: values.department,
                    description: values.description,
                })
                message.success(__('编辑成功'))
                onConfirm(dataId)
            } else {
                await createDataCatalogFile({
                    name: values.title,
                    department_id: values.department,
                    description: values.description,
                    is_publish: false,
                })
                message.success(__('新建成功'))
                onConfirm()
            }
        } catch (err) {
            formatError(err)
        }
    }
    const queryMainDepartInfo = async () => {
        try {
            const res = await getMainDepartInfo()
            setDefaultDepartment(res?.id)
            form.setFieldValue('department', res?.id)
        } catch (e) {
            formatError(e)
        }
    }

    return (
        <Drawer
            width={560}
            title={
                <div className={styles.editFieldTitle}>
                    <div className={styles.editTitle}>
                        {dataId ? __('编辑文件资源') : __('新建文件资源')}
                    </div>
                    <div className={styles.closeButton}>
                        <CloseOutlined
                            onClick={() => {
                                onCancel()
                            }}
                        />
                    </div>
                </div>
            }
            placement="right"
            closable={false}
            mask={false}
            open
            getContainer={false}
            footer={
                <div className={styles.footerWrapper}>
                    <Space size={12}>
                        <Button className={styles.cancelBtn} onClick={onCancel}>
                            {__('取消')}
                        </Button>
                        <Button
                            className={styles.okBtn}
                            type="primary"
                            htmlType="submit"
                            onClick={() => {
                                form.submit()
                            }}
                        >
                            {__('确定')}
                        </Button>
                    </Space>
                </div>
            }
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                autoComplete="off"
                className={styles.form}
            >
                <LabelTitle label={__('基础信息')} />
                <Row gutter={40} className={styles.contentWrapper}>
                    <Col span={24}>
                        <Form.Item
                            label={__('文件资源名称')}
                            name="title"
                            validateTrigger={['onChange', 'onBlur']}
                            validateFirst
                            rules={[
                                {
                                    required: true,
                                    message: ErrorInfo.NOTNULL,
                                },
                                {
                                    pattern: nameReg,
                                    message: ErrorInfo.ONLYSUP,
                                },
                                {
                                    validateTrigger: ['onBlur'],
                                    validator: (e, value) =>
                                        validateNameRepeat(value),
                                },
                            ]}
                        >
                            <Input placeholder={__('请输入')} maxLength={128} />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            label={__('所属组织架构')}
                            name="department"
                            validateFirst
                            rules={[
                                {
                                    required: true,
                                    message: ErrorInfo.NOTNULL,
                                },
                            ]}
                        >
                            <DepartmentAndOrgSelect
                                defaultValue={defaultDepartment || ''}
                                allowClear
                                getInitValueError={(errorMessage) => {
                                    form?.setFields([
                                        {
                                            name: 'department',
                                            errors: [errorMessage],
                                            value: null,
                                        },
                                    ])
                                }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            label={__('描述')}
                            name="description"
                            rules={[
                                {
                                    pattern: keyboardReg,
                                    message: __(
                                        '仅支持中英文、数字、及键盘上的特殊字符',
                                    ),
                                    transform: (value) => value.trim(),
                                },
                            ]}
                        >
                            <Input.TextArea
                                placeholder={__('请输入')}
                                maxLength={800}
                                className={styles['text-area']}
                                showCount
                                style={{ height: 100, resize: 'none' }}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Drawer>
    )
}

export default CreateFileBase
