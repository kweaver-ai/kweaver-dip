import { useEffect, useState } from 'react'
import { LeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { Button, Col, Form, Input, Row, Space } from 'antd'
import { trim } from 'lodash'
import { ErrorInfo, keyboardReg, nameReg, useQuery } from '@/utils'
import styles from './styles.module.less'
import GlobalMenu from '../GlobalMenu'
import __ from './locale'
import { LabelTitle } from './helper'
import { validateNameRepeat } from './const'
import DepartmentAndOrgSelect from '../DepartmentAndOrgSelect'
import UploadMultipleAttachment from './Upload'
import { createDataCatalogFile, formatError } from '@/core'

const DataFileUpsert = (props: any) => {
    const query = useQuery()
    const [form] = Form.useForm()
    const navigator = useNavigate()
    const [selectedFiles, setSelectedFiles] = useState<any>([])

    useEffect(() => {
        getDataFileDetail()
    }, [])

    const getDataFileDetail = () => {
        setTimeout(() => {
            setSelectedFiles([{ name: 123 }])
        }, 1500)
    }

    const handleReturn = () => {
        const backUrl = `/dataService/interfaceService`

        if (window.history.length > 2) {
            navigator(-1)
        } else {
            navigator(backUrl)
        }
    }

    const onFinish = async (values) => {
        try {
            await createDataCatalogFile({
                name: values.title,
                department_id: values.department,
                description: values.description,
                is_publish: false,
            })
        } catch (err) {
            formatError(err)
        }
    }

    return (
        <div className={styles.dataFileUpsertWrapper}>
            <div className={styles.title}>
                <GlobalMenu />
                <div onClick={handleReturn} className={styles.returnInfo}>
                    <LeftOutlined className={styles.returnArrow} />
                    <span className={styles.returnText}>返回</span>
                </div>
                <div className={styles.divider} />
                <div className={styles.titleText}>{__('数据文件创建')}</div>
            </div>
            <div className={styles.body}>
                <div id="datafileupsert-content" className={styles.content}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        autoComplete="off"
                        className={styles.form}
                        onValuesChange={(changeValues) => {
                            // console.log(changeValues)
                        }}
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
                                    <Input
                                        placeholder={__('请输入')}
                                        maxLength={128}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
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
                                        defaultValue=""
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
                                            transform: (value) => trim(value),
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
                            {/* <Col span={24}>
                                <LabelTitle label={__('附件信息')} />
                                <Form.Item
                                    label={__('添加附件')}
                                    name="attachment"
                                    rules={[
                                        {
                                            required: true,
                                            message: ErrorInfo.NOTNULL,
                                        },
                                    ]}
                                >
                                    <UploadMultipleAttachment />
                                </Form.Item>
                            </Col> */}
                        </Row>
                    </Form>
                    {/* <FileTableContainer /> */}
                </div>

                <div className={styles.footer}>
                    <Space size={16}>
                        <Button onClick={handleReturn}>{__('取消')}</Button>
                        <Button type="primary" onClick={() => form.submit()}>
                            {__('提交')}
                        </Button>
                    </Space>
                </div>
            </div>
        </div>
    )
}

export default DataFileUpsert
