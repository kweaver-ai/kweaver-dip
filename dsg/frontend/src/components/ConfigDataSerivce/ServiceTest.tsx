import * as React from 'react'
import { useState, useEffect } from 'react'
import {
    Button,
    Checkbox,
    Col,
    Form,
    Input,
    Radio,
    Row,
    Select,
    Switch,
    Table,
    Tooltip,
} from 'antd'
import { noop, trim } from 'lodash'
import {
    CheckCircleFilled,
    CloseCircleFilled,
    QuestionCircleOutlined,
} from '@ant-design/icons'
import { FormInstance } from 'antd/es/form/Form'
import { serialize } from 'v8'
import { ColumnsType } from 'antd/lib/table'
import JSONBig from 'json-bigint'
import FormTitle from './FormTitle'
import __ from './locale'
import styles from './styles.module.less'
import empty from '@/assets/dataEmpty.svg'
import Empty from '@/ui/Empty'
import { queryTestAPI, testAPI } from '@/core'
import { keyboardReg } from '@/utils'
import ResponseResult from './ResponseResult'
import NumberInput from '@/ui/NumberInput'
import { NumberType } from '@/ui/NumberInput/const'
import { getParamsByType } from './common'

interface ResponseResultType {
    defaultValues?: any
    form: FormInstance<any>
    onFinsh?: (values) => void
    isDetail?: boolean
    serviceData: any
    onDataChange?: () => void
}

interface JsonPreViewType {
    value?: string
    onChange?: () => void
    isDetail?: boolean
}
const JsonPreView = ({
    value = '',
    onChange = noop,
    isDetail = false,
}: JsonPreViewType) => {
    return value ? (
        <div className={styles.jsonPreviewContainer}>
            <pre style={{ whiteSpace: 'pre' }}>
                {JSONBig.stringify(JSONBig.parse(value), null, 4)}
            </pre>
        </div>
    ) : (
        <div className={styles.jsonPreviewContainer}>
            <div className={styles.previewEmpty}>
                <Empty
                    desc={
                        <div className={styles.emptyText}>
                            <div>{__('暂无数据')}</div>
                            {!isDetail && <div>{__('点击开始测试查看')}</div>}
                        </div>
                    }
                    iconSrc={empty}
                />
            </div>
        </div>
    )
}

const ServiceTest = ({
    defaultValues = {},
    form,
    onFinsh,
    isDetail,
    serviceData,
    onDataChange = noop,
}: ResponseResultType) => {
    const { service_info, service_response, service_param } = serviceData
    const requestsParams = service_param?.data_table_request_params || []
    const [errorMessage, setErrorMessage] = useState<string>('')
    const [tableRequstData, setTableRequestData] = useState<Array<any>>([])
    const [testStatus, setTestStatus] = useState<'failed' | 'success' | 'none'>(
        'none',
    )
    const [tableForm] = Form.useForm()

    useEffect(() => {
        const newData = requestsParams.map((requestsParam) => ({
            ...requestsParam,
            value: requestsParam?.default_value || null,
        }))
        setTableRequestData(newData)
        tableForm.setFieldValue('testData', newData)
    }, [requestsParams])

    useEffect(() => {
        form.setFieldsValue(defaultValues)
    }, [defaultValues])

    const testFormColumns: ColumnsType<any> = [
        {
            title: __('中文/英文名称'),
            key: 'cn_name',
            render: (_, record) => (
                <div className={styles.tableTrContainer}>
                    <div className={styles.itemTitle} title={record.cn_name}>
                        {record.cn_name}
                    </div>
                    <div
                        style={{
                            color: 'rgba(0,0,0,0.45)',
                        }}
                        className={styles.itemTitle}
                        title={record.en_name}
                    >
                        {record.en_name}
                    </div>
                </div>
            ),
            width: 150,
        },
        {
            title: __('字段类型'),
            key: 'param_type',
            render: (_, record) => (
                <Form.Item noStyle>
                    <div>{record.data_type}</div>
                </Form.Item>
            ),
            width: 100,
        },
        {
            title: __('是否必填'),
            key: 'required',
            render: (_, record) => (
                <div>{record.required === 'yes' ? __('是') : __('否')}</div>
            ),
            width: 100,
        },
    ]

    /**
     * 测试
     */
    const handleTest = async () => {
        tableForm.submit()
    }

    const handleFinish = async (values) => {
        try {
            const { service_type, http_method, datasheet_id } = service_info
            const {
                create_model,
                data_source,
                data_table_response_params,
                data_table_request_params,
            } = service_param
            const params = {
                service_type,
                create_model,
                catalog_name: data_source
                    ? JSONBig.parse(data_source)?.catalog_name
                    : null,
                schema_name: data_source
                    ? JSONBig.parse(data_source)?.schema_name
                    : null,
                table_name: service_param?.data_table || null,
                script: service_param?.script || null,
                page_size: service_response?.page_size
                    ? Number(service_response.page_size)
                    : null,
                http_method,
                backend_service_path:
                    service_info?.backend_service_path || null,
                backend_service_host:
                    service_info?.backend_service_host || null,
                data_table_response_params,
                data_table_request_params: data_table_request_params?.map(
                    (requestParams, index) => ({
                        ...requestParams,
                        default_value:
                            values.testData[index]?.value?.toString() || null,
                    }),
                ),
                rules: service_response?.rules || [],
                data_view_id: datasheet_id,
                datasource_id: service_param?.datasource_id,
            }

            const { request, response } = await queryTestAPI(params)
            form.setFieldValue('request_example', request)
            form.setFieldValue('response_example', response)
            onDataChange()
            setTestStatus('success')
        } catch (ex) {
            setTestStatus('failed')
            form.setFieldValue('request_example', '')
            form.setFieldValue('response_example', '')
            const exInfo = ex?.data?.detail?.[0]
            setErrorMessage(
                `${exInfo?.message || ex?.data?.description || ''}` ||
                    __('测试失败'),
            )
        }
    }

    return (
        <Form
            className={styles.serviceTest}
            form={form}
            initialValues={defaultValues}
            onFinish={onFinsh}
            onValuesChange={() => {
                onDataChange()
            }}
        >
            <FormTitle title={__('测试')} />
            <div className={styles.formInfoContent}>
                <Row gutter={24}>
                    <Col span={12}>
                        <div>
                            <div
                                style={{
                                    display: 'flex',
                                    // alignItems: 'center',
                                }}
                            >
                                <span className={styles.label}>
                                    {__('接口名称：')}
                                </span>
                                <span
                                    className={styles.name}
                                    title={
                                        serviceData?.service_info?.service_name
                                    }
                                >
                                    {serviceData?.service_info?.service_name}
                                </span>
                            </div>
                            <div className={styles.itemInfo}>
                                <div>
                                    <span className={styles.label}>
                                        {__('请求方式：')}
                                    </span>
                                    <span>
                                        {[
                                            {
                                                value: 'post',
                                                label: 'POST',
                                            },
                                            {
                                                value: 'get',
                                                label: 'GET',
                                            },
                                        ].find(
                                            (HttpMethod) =>
                                                HttpMethod.value ===
                                                serviceData?.service_info
                                                    ?.http_method,
                                        )?.label || '--'}
                                    </span>
                                </div>
                                <div className={styles.itemRight}>
                                    <span className={styles.label}>
                                        {__('返回类型：')}
                                    </span>
                                    <span>
                                        {[
                                            {
                                                value: 'json',
                                                label: 'JSON',
                                            },
                                        ].find(
                                            (returnType) =>
                                                returnType.value ===
                                                serviceData?.service_info
                                                    ?.return_type,
                                        )?.label || '--'}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.title}>{__('请求参数')}</div>
                            <Form
                                form={tableForm}
                                onFinish={(values) => {
                                    handleFinish(values)
                                }}
                            >
                                <Form.Item
                                    name="testData"
                                    noStyle
                                    valuePropName="dataSource"
                                    initialValue={requestsParams}
                                >
                                    <Table
                                        columns={
                                            isDetail
                                                ? testFormColumns
                                                : [
                                                      ...testFormColumns,
                                                      {
                                                          title: __('测试值'),
                                                          key: 'value',
                                                          render: (
                                                              _,
                                                              record,
                                                              index,
                                                          ) => (
                                                              <Form.Item
                                                                  name={[
                                                                      'testData',
                                                                      index,
                                                                      'value',
                                                                  ]}
                                                                  validateFirst
                                                                  rules={
                                                                      record.data_type ===
                                                                      'string'
                                                                          ? [
                                                                                {
                                                                                    required:
                                                                                        record.required ===
                                                                                        'yes',
                                                                                    message:
                                                                                        __(
                                                                                            '输入不能为空',
                                                                                        ),
                                                                                    transform:
                                                                                        (
                                                                                            value,
                                                                                        ) =>
                                                                                            trim(
                                                                                                value,
                                                                                            ),
                                                                                },
                                                                                {
                                                                                    pattern:
                                                                                        keyboardReg,
                                                                                    message:
                                                                                        __(
                                                                                            '仅支持中英文、数字、及键盘上的特殊字符',
                                                                                        ),
                                                                                    transform:
                                                                                        (
                                                                                            value,
                                                                                        ) =>
                                                                                            trim(
                                                                                                value,
                                                                                            ),
                                                                                },
                                                                            ]
                                                                          : [
                                                                                {
                                                                                    required:
                                                                                        record.required ===
                                                                                        'yes',
                                                                                    message:
                                                                                        __(
                                                                                            '输入不能为空',
                                                                                        ),
                                                                                    transform:
                                                                                        (
                                                                                            value,
                                                                                        ) =>
                                                                                            trim(
                                                                                                value,
                                                                                            ),
                                                                                },
                                                                            ]
                                                                  }
                                                                  initialValue={
                                                                      record.default_value
                                                                  }
                                                              >
                                                                  {getParamsByType(
                                                                      record.data_type,
                                                                      index,
                                                                  )}
                                                              </Form.Item>
                                                          ),
                                                          width: 150,
                                                      },
                                                  ]
                                        }
                                        dataSource={tableRequstData}
                                        pagination={false}
                                        scroll={{
                                            x: 'max-content',
                                        }}
                                    />
                                </Form.Item>
                            </Form>

                            {!isDetail && (
                                <Button
                                    type="link"
                                    className={styles.btn}
                                    onClick={handleTest}
                                >
                                    {__('开始测试')}
                                </Button>
                            )}
                        </div>
                    </Col>
                    <Col span={12}>
                        <div className={styles.title}>{__('请求详情')}</div>
                        <div className={styles.JsonContainer}>
                            <Form.Item name="request_example" noStyle>
                                <JsonPreView isDetail={isDetail} />
                            </Form.Item>
                        </div>
                        <div className={styles.title}>{__('返回结果')}</div>
                        <div className={styles.JsonContainer}>
                            <Form.Item name="response_example" noStyle>
                                <JsonPreView isDetail={isDetail} />
                            </Form.Item>
                        </div>
                        <div className={styles.JsonContainer}>
                            {testStatus === 'failed' ? (
                                <div>
                                    <CloseCircleFilled
                                        className={styles.errorTip}
                                    />
                                    <span>
                                        {__('${info}，请稍后重试。', {
                                            info: errorMessage,
                                        })}
                                    </span>
                                </div>
                            ) : testStatus === 'success' ? (
                                <div>
                                    <CheckCircleFilled
                                        className={styles.successTip}
                                    />
                                    <span>{__('测试成功')}</span>
                                </div>
                            ) : null}
                        </div>
                        {/* <div className={styles.title}>
                            {__('请求成功结果示例')}
                        </div>
                        <div className={styles.JsonContainer}>
                            <pre>
                                {JSON.stringify(
                                    {
                                        id: 1,
                                        name: 'my_name',
                                        address: 'my_address',
                                    },
                                    null,
                                    4,
                                )}
                            </pre>
                        </div> */}
                    </Col>
                </Row>
            </div>
        </Form>
    )
}

export default ServiceTest
