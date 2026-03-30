import { useEffect, forwardRef, useImperativeHandle } from 'react'
import { Form, Row, Col, Select } from 'antd'
import styles from './styles.module.less'
import __ from '../locale'
import { LabelTitle } from '../BaseInfo'
import { RequestContentTypeList } from '../const'
import ApiEditTable, { ColumnKeys } from './ApiEditTable'

interface IApiResource {
    value: any
    onChange: (o: any) => void
}

const ApiResource = forwardRef((props: IApiResource, ref) => {
    const { value, onChange } = props
    const [form] = Form.useForm()

    useEffect(() => {
        form.setFieldsValue(value)
    }, [value])

    useImperativeHandle(ref, () => ({
        getFormAndValidate,
    }))

    // 获取form参数，并校验
    const getFormAndValidate = () => {
        form.submit()
        const formValue = form.validateFields()
        formValue.then().catch(() => {
            // 在catch中进行错误定位
            setTimeout(() => {
                const errorList = document.querySelectorAll(
                    '.any-fabric-ant-form-item-has-error',
                )
                errorList[0]?.scrollIntoView({
                    block: 'center',
                    behavior: 'smooth',
                })
            }, 300)
        })
        return formValue
    }

    return (
        <div className={styles.apiResourceWrapper}>
            <Form form={form} layout="vertical">
                <Row id="resource">
                    <LabelTitle label={__('上报资源信息')} />
                    <Col span={12} className={styles.formItem}>
                        <Form.Item
                            label={__('服务请求报文格式')}
                            name="request_format"
                            rules={[
                                {
                                    required: true,
                                    message: `${__('请选择')}${__(
                                        '服务请求报文格式',
                                    )}`,
                                },
                            ]}
                        >
                            <Select
                                allowClear
                                options={RequestContentTypeList}
                                placeholder={`${__('请选择')}${__(
                                    '服务请求报文格式',
                                )}`}
                                value={value.request_format || ''}
                                getPopupContainer={(node) => node.parentNode}
                                onChange={(o) =>
                                    onChange({
                                        ...value,
                                        request_format: o,
                                    })
                                }
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12} className={styles.formItem}>
                        <Form.Item
                            label={__('服务响应报文格式')}
                            name="response_format"
                            rules={[
                                {
                                    required: true,
                                    message: `${__('请选择')}${__(
                                        '服务请求报文格式',
                                    )}`,
                                },
                            ]}
                        >
                            <Select
                                allowClear
                                options={RequestContentTypeList}
                                placeholder={`${__('请选择')}${__(
                                    '服务响应报文格式',
                                )}`}
                                value={value.response_format || ''}
                                onChange={(o) =>
                                    onChange({
                                        ...value,
                                        response_format: o,
                                    })
                                }
                                getPopupContainer={(node) => node.parentNode}
                            />
                        </Form.Item>
                    </Col>
                    <LabelTitle label={__('请求body')} />
                    <ApiEditTable
                        isEidt
                        columnKeys={[
                            ColumnKeys.name,
                            ColumnKeys.data_type,
                            ColumnKeys.isArray,
                        ]}
                        value={value.request_body}
                        onChange={(o) =>
                            onChange({
                                ...value,
                                request_body: o,
                            })
                        }
                    />
                    <div style={{ marginTop: 20 }}>
                        <LabelTitle label={__('响应参数')} />
                    </div>
                    <ApiEditTable
                        isEidt
                        value={value.response_body}
                        columnKeys={[
                            ColumnKeys.name,
                            ColumnKeys.data_type,
                            ColumnKeys.isArray,
                            ColumnKeys.default_value,
                        ]}
                        onChange={(o) =>
                            onChange({
                                ...value,
                                response_body: o,
                            })
                        }
                    />
                </Row>
            </Form>
        </div>
    )
})
export default ApiResource
