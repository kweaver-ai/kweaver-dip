import React, { useEffect, useState } from 'react'
import {
    Form,
    Input,
    message,
    Row,
    Col,
    Modal,
    Select,
    Button,
    Space,
    InputNumber,
    Spin,
    Tooltip,
    Radio,
} from 'antd'
import JSEncrypt from 'jsencrypt'
import { noop, trim } from 'lodash'
import { LoadingOutlined } from '@ant-design/icons'
import { ErrorInfo, getActualUrl, nameReg, OperateType } from '@/utils'
import { validateNumber, validateEmpty, validatePort } from '@/utils/validate'
import styles from './styles.module.less'
import {
    AuthModel,
    changeTestData,
    DataBaseArray,
    DataBaseFormConfig,
    DoubleAuthModel,
    getConnectProtocol,
} from './const'
import {
    checkDataSourceRepeat,
    createDataSource,
    editDataSource,
    formatError,
    getDataBaseDetails,
    reqInfoSystemList,
    testDataBaseConnect,
    getFirstLevelDepartment,
    testConnectDatabase,
} from '@/core'
import {
    dataBaseOptions,
    DataSourceOrigin,
    editDataSourceOptions,
    publicKey,
} from './helper'
import __ from './locale'
import { OrganizationOutlined } from '@/icons'
import DepartmentAndOrgSelect from '../DepartmentAndOrgSelect'
import { DataColoredBaseIcon, databaseTypesEleData } from '@/core/dataSource'

const { Option } = Select

interface ICreateDataSource {
    visible: boolean
    operateType: OperateType
    // infoSystemId: string
    editId?: string
    departmentId?: string
    onClose: () => void
    onSuccess?: () => void
}
const CreateDataSource: React.FC<ICreateDataSource> = ({
    operateType,
    visible,
    editId = '',
    departmentId = '',
    onClose,
    // infoSystemId,
    onSuccess = noop,
}) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [testing, setTesting] = useState(false)
    const [loadingFlag, setLoadingFlag] = useState(true)
    const [systemsOptions, setSystemsOptions] = useState<any>([])
    const [organizationOptions, setOrganizationOptions] = useState<any>([])
    const [systemKeyword, setSystemKeyword] = useState<string>('')
    const [defaultOrg, setDefaultOrg] = useState<string>()
    const [authModel, setAuthModel] = useState<AuthModel>(AuthModel.PASSWORD)
    const [selectedDataSourceType, setSelectedDataSourceType] =
        useState<string>('')
    useEffect(() => {
        if (visible) {
            setLoading(false)
            setLoadingFlag(true)
            setInitValues()
            getSystems()
            // getOrgDepartment()
            if (operateType === OperateType.EDIT) {
                getDetails()
            }
        } else {
            form.resetFields()
            setAuthModel(AuthModel.PASSWORD)
            setSelectedDataSourceType('')
        }
    }, [visible])

    useEffect(() => {
        if (departmentId && operateType === OperateType.CREATE) {
            form.setFieldsValue({
                department_id: departmentId,
            })
            setDefaultOrg(departmentId)
        }
    }, [departmentId])

    const setInitValues = () => {
        form.resetFields()
        form.setFieldsValue({
            info_system_id: undefined,
        })
    }

    // 获取数据源详情
    const getDetails = async () => {
        try {
            if (!editId) return
            const res = await getDataBaseDetails(editId)
            form.setFieldsValue({
                source_type: res.source_type || undefined,
                info_system_id: res.info_system_id || undefined,
                department_id: res.department_id || undefined,
            })
            setDefaultOrg(res.department_id || undefined)
            setSelectedDataSourceType(res.type || '')
            // 用户名不存在，设置为token模式
            if (!res.username) {
                setAuthModel(AuthModel.TOKEN)
            }
        } catch (error) {
            formatError(error)
        }
    }
    // 切换数据库类型
    const changeType = (val) => {
        const values = form.getFieldsValue()
        form.setFieldsValue({
            ...values,
            database_name: '',
            schema: '',
        })
    }
    const getSystems = async () => {
        try {
            const res = await reqInfoSystemList({
                limit: 2000,
                offset: 1,
            })
            setSystemsOptions(
                res.entries?.map((item) => ({
                    label: item.name,
                    value: item.id,
                })) || [],
            )
            setLoadingFlag(false)
        } catch (error) {
            formatError(error)
        }
    }

    const getOrgDepartment = async () => {
        try {
            const res = await getFirstLevelDepartment({ limit: 0 })
            setOrganizationOptions(
                res?.map((item) => ({
                    label: (
                        <div>
                            <OrganizationOutlined
                                style={{
                                    fontSize: '16px',
                                    marginRight: '8px',
                                }}
                            />
                            <span>{item.name}</span>
                        </div>
                    ),
                    value: item.id,
                })) || [],
            )
        } catch (error) {
            formatError(error)
        }
    }

    // 信息系统为空
    const renderInfoSystemEmpty = () => {
        return loadingFlag ? (
            <Spin />
        ) : systemKeyword ? (
            __('未找到匹配的结果')
        ) : (
            <div
                style={{
                    textAlign: 'center',
                }}
            >
                {`${__('暂无数据')}${__('，')}${__('可前往')}`}
                <a
                    href={getActualUrl('/systemConfig/infoSystem', true, 2)}
                    style={{
                        color: '#126ee3',
                    }}
                    target="_blank"
                    rel="noreferrer"
                >
                    {__('【信息系统】')}
                </a>
                {__('创建')}
            </div>
        )
    }

    // 对密码进行加密和base64处理
    const encryptAndSerializeString = (str) => {
        if (str) {
            // 创建RSA实例
            const encrypt = new JSEncrypt()
            encrypt.setPublicKey(publicKey)
            // 使用公钥加密字符串
            const encrypted = encrypt.encrypt(str)
            return encrypted
        }
        return ''
    }
    // 保存数据源
    const onFinish = async (values) => {
        try {
            setLoading(true)
            const { password, info_system_id } = values
            const newPsw = encryptAndSerializeString(password)
            if (operateType === OperateType.CREATE) {
                await createDataSource({
                    ...values,
                    excel_base: values.excel_base?.trim() || undefined,
                })
                message.success(__('新建成功'))
            } else {
                await editDataSource(editId, {
                    ...values,
                    info_system_id: info_system_id || '',
                    excel_base: values.excel_base?.trim() || undefined,
                })
                message.success(__('编辑成功'))
            }
            onSuccess()
        } catch (error) {
            formatError(error)
            setLoading(false)
        } finally {
            setLoading(false)
        }
    }
    // 重名校验
    const validateNameRepeat = async (value: string): Promise<void> => {
        const trimValue = trim(value)
        const vales = form.getFieldsValue()
        const { info_system_id, source_type } = vales
        try {
            if (operateType === OperateType.CREATE) {
                await checkDataSourceRepeat({
                    id: operateType === OperateType.CREATE ? undefined : editId,
                    name: trimValue,
                    info_system_id,
                    source_type,
                })
            }
            return Promise.resolve()
        } catch (error) {
            if (error.data.code === 'ConfigurationCenter.DataSourceNameExist') {
                return Promise.reject(new Error(error.data.description))
            }
            return Promise.resolve()
        }
    }

    const FormDataTemplateConfig = {
        database_name: (
            <Col span={12}>
                <Form.Item
                    label={__('数据库名称')}
                    required
                    name="database_name"
                    rules={[
                        {
                            required: true,
                            validator: validateEmpty('请输入数据库名称'),
                        },
                    ]}
                >
                    <Input
                        placeholder={__('请输入数据库名称')}
                        maxLength={128}
                        allowClear
                    />
                </Form.Item>
            </Col>
        ),
        schema: (
            <Form.Item
                noStyle
                shouldUpdate={(prevValues, curValues) =>
                    prevValues.type !== curValues.type
                }
            >
                {({ getFieldValue }) => {
                    const dataBaseType = getFieldValue('type')
                    return DataBaseArray.includes(dataBaseType) ? (
                        <Col span={12}>
                            <Form.Item
                                label={__('数据库模式')}
                                required
                                name="schema"
                                rules={[
                                    {
                                        required: true,
                                        validator:
                                            validateEmpty('请输入数据库模式'),
                                    },
                                ]}
                            >
                                <Input
                                    placeholder={__('请输入数据库模式')}
                                    allowClear
                                    maxLength={128}
                                />
                            </Form.Item>
                        </Col>
                    ) : null
                }}
            </Form.Item>
        ),
        host: (
            <Col span={12}>
                <Form.Item
                    label={__('连接地址')}
                    required
                    name="host"
                    rules={[
                        {
                            required: true,
                            validator: validatePort(),
                        },
                    ]}
                >
                    <Input placeholder={__('请输入连接地址')} maxLength={128} />
                </Form.Item>
            </Col>
        ),
        port: (
            <Col span={12}>
                <Form.Item
                    label={__('端口')}
                    required
                    name="port"
                    rules={[
                        {
                            required: true,
                            validator: validateNumber(),
                        },
                    ]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        controls={false}
                        placeholder={__('请输入端口')}
                        maxLength={128}
                    />
                </Form.Item>
            </Col>
        ),
        authModel: DoubleAuthModel.includes(selectedDataSourceType) ? (
            <>
                <Col span={24}>
                    <Form.Item label={__('身份验证方式')}>
                        <Radio.Group
                            value={authModel}
                            onChange={(e) => {
                                setAuthModel(e.target.value)
                            }}
                        >
                            <Radio value={AuthModel.PASSWORD}>
                                {__('用户名&密码')}
                            </Radio>
                            <Radio value={AuthModel.TOKEN}>Token</Radio>
                        </Radio.Group>
                    </Form.Item>
                </Col>
                {authModel === AuthModel.PASSWORD ? (
                    <>
                        <Col span={12}>
                            <Form.Item
                                label={__('用户名')}
                                required
                                name="username"
                                rules={[
                                    {
                                        required: true,
                                        message: '请输入用户名',
                                    },
                                ]}
                            >
                                <Input
                                    placeholder={__('请输入用户名')}
                                    maxLength={128}
                                    autoComplete="off"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label={__('密码')}
                                required
                                name="password"
                                rules={[
                                    {
                                        required: true,
                                        message: '请输入密码',
                                    },
                                ]}
                            >
                                <Input
                                    placeholder={__('请输入密码')}
                                    maxLength={100}
                                    autoComplete="new-password"
                                    type="password"
                                />
                            </Form.Item>
                        </Col>
                    </>
                ) : (
                    <Col span={24}>
                        <Form.Item
                            label="Token"
                            required
                            name="guardian-token"
                            rules={[
                                {
                                    required: true,
                                    message: '请输入Token',
                                },
                            ]}
                        >
                            <Input.TextArea
                                placeholder={__('请输入Token')}
                                style={{
                                    height: 80,
                                    resize: 'none',
                                }}
                            />
                        </Form.Item>
                    </Col>
                )}
            </>
        ) : (
            <>
                <Col span={12}>
                    <Form.Item
                        label={__('用户名')}
                        required
                        name="username"
                        rules={[
                            {
                                required: true,
                                message: '请输入用户名',
                            },
                        ]}
                    >
                        <Input
                            placeholder={__('请输入用户名')}
                            maxLength={128}
                            autoComplete="off"
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        label={__('密码')}
                        required
                        name="password"
                        rules={[
                            {
                                required: true,
                                message: '请输入密码',
                            },
                        ]}
                    >
                        <Input
                            placeholder={__('请输入密码')}
                            maxLength={100}
                            autoComplete="new-password"
                            type="password"
                        />
                    </Form.Item>
                </Col>
            </>
        ),
        excel_protocol: (
            <Col span={12}>
                <Form.Item
                    label={__('文件存储位置')}
                    name="excel_protocol"
                    initialValue="anyshare"
                >
                    <Input disabled />
                </Form.Item>
            </Col>
        ),
        excel_base: (
            <Col span={12}>
                <Form.Item
                    label={__('路径')}
                    name="excel_base"
                    rules={[
                        {
                            required: true,
                            message: __('请输入路径'),
                            transform: (value) => trim(value),
                        },
                    ]}
                >
                    <Input placeholder={__('请输入路径')} />
                </Form.Item>
            </Col>
        ),
    }

    /**
     * 处理测试连接的函数
     *
     * 这个函数用于验证表单字段并尝试测试数据源连接。
     * 它捕获并格式化任何在验证过程中可能出现的错误。
     *
     * @function
     * @async
     * @returns {Promise<void>}
     */
    const handleTest = async (values: any) => {
        // try {
        //     setTesting(true)

        const res = await testConnectDatabase({
            type: ['hive-jdbc', 'hive-hadoop2'].includes(values.type)
                ? 'hive'
                : values.type,
            bin_data: {
                database_name: form.getFieldValue('database_name'),
                connect_protocol: getConnectProtocol(values.type),
                host: values.host,
                port: values.port,
                account: values.username,
                password: encryptAndSerializeString(values.password) as string,
                schema: values?.schema || undefined,
            },
        })
        if (res.status) {
            message.success(__('测试连接成功'))
        } else {
            message.error(__('测试连接失败'))
        }
    }

    const handleExcelTest = async (allFields: any) => {
        try {
            // 获取所有表单字段的值

            // 对密码进行加密和base64处理
            const newPsw = encryptAndSerializeString(allFields.password)
            // 测试接口
            const res = await testDataBaseConnect(
                changeTestData({
                    ...allFields,
                    password: newPsw,
                }),
            )
            if (res.status) {
                message.success(__('测试连接成功'))
            } else {
                message.error(__('测试连接失败'))
            }
        } catch (error) {
            // 如果测试失败，返回
            if (error?.errorFields) {
                return
            }
            formatError(error)
        }
    }

    const handleAllTest = async () => {
        try {
            setTesting(true)
            await form.validateFields()
            const allFields = form.getFieldsValue()
            if (allFields.type === 'excel') {
                await handleExcelTest(allFields)
            } else {
                await handleTest(allFields)
            }
        } catch (err) {
            if (err?.errorFields) {
                return
            }
            formatError(err)
        } finally {
            setTesting(false)
        }
    }

    return (
        <div className={styles.createCoreBusiness}>
            <Modal
                width={800}
                open={visible}
                closable
                title={
                    operateType === OperateType.CREATE
                        ? __('添加数据源')
                        : __('编辑来源/归属信息')
                }
                destroyOnClose
                maskClosable={false}
                className={styles.createCoreBusinessModal}
                onCancel={onClose}
                footer={
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                        }}
                    >
                        <Space size={12}>
                            <Button onClick={onClose}>{__('取消')}</Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                disabled={testing}
                                onClick={() => form.submit()}
                            >
                                {__('确定')}
                            </Button>
                        </Space>
                    </div>
                }
            >
                <Spin
                    spinning={testing}
                    indicator={
                        <LoadingOutlined style={{ fontSize: 24 }} spin />
                    }
                    tip={__('测试中...')}
                >
                    <Form
                        form={form}
                        autoComplete="off"
                        layout="vertical"
                        onFinish={onFinish}
                        scrollToFirstError
                        onValuesChange={(changeValue) => {
                            if (Object.keys(changeValue).includes('type')) {
                                setSelectedDataSourceType(changeValue.type)
                            }
                        }}
                        style={{ height: '350px' }}
                    >
                        <Row gutter={24}>
                            <Col span={24}>
                                <Form.Item
                                    label={__('数据源来源')}
                                    name="source_type"
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请选择数据源来源'),
                                            transform: (value) => trim(value),
                                        },
                                    ]}
                                >
                                    <Select
                                        getPopupContainer={(node) =>
                                            node.parentNode
                                        }
                                        allowClear
                                        placeholder={__('请选择数据源来源')}
                                        options={editDataSourceOptions}
                                    />
                                </Form.Item>
                            </Col>

                            <Form.Item
                                noStyle
                                shouldUpdate={(prevValues, curValues) =>
                                    prevValues.source_type !==
                                    curValues.source_type
                                }
                            >
                                {({ getFieldValue }) => {
                                    const sourceType =
                                        getFieldValue('source_type')
                                    return sourceType ===
                                        DataSourceOrigin.INFOSYS ? (
                                        <Col span={24}>
                                            <Form.Item
                                                label={__('信息系统')}
                                                name="info_system_id"
                                                // rules={[
                                                //     {
                                                //         required: true,
                                                //         message:
                                                //             __('请选择信息系统'),
                                                //     },
                                                // ]}
                                            >
                                                <Select
                                                    getPopupContainer={(node) =>
                                                        node.parentNode
                                                    }
                                                    notFoundContent={renderInfoSystemEmpty()}
                                                    showSearch
                                                    placeholder={__(
                                                        '请选择信息系统',
                                                    )}
                                                    allowClear
                                                    onSearch={(value) => {
                                                        setSystemKeyword(value)
                                                    }}
                                                    optionFilterProp="children"
                                                >
                                                    {systemsOptions.map(
                                                        (option) => (
                                                            <Option
                                                                key={
                                                                    option.value
                                                                }
                                                                value={
                                                                    option.value
                                                                }
                                                            >
                                                                {option.label}
                                                            </Option>
                                                        ),
                                                    )}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    ) : null
                                }}
                            </Form.Item>
                            <Col span={24}>
                                <Form.Item
                                    label={__('所属组织架构')}
                                    name="department_id"
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请选择所属一级部门'),
                                            transform: (value) => trim(value),
                                        },
                                    ]}
                                >
                                    <DepartmentAndOrgSelect
                                        defaultValue={defaultOrg}
                                        allowClear
                                        getInitValueError={(errorMessage) => {
                                            form?.setFields([
                                                {
                                                    name: 'department_id',
                                                    errors: [errorMessage],
                                                    value: null,
                                                },
                                            ])
                                        }}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Spin>
            </Modal>
        </div>
    )
}

export default CreateDataSource
