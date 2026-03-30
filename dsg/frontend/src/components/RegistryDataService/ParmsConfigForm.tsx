import * as React from 'react'
import { useRef, useCallback, useEffect, useState } from 'react'
import {
    Button,
    Checkbox,
    Col,
    Form,
    Input,
    Popconfirm,
    Row,
    Select,
    Table,
    Tooltip,
    Radio,
    message,
    Modal,
} from 'antd'
import classnames from 'classnames'
import { noop, trim } from 'lodash'
import {
    ExclamationCircleFilled,
    MenuOutlined,
    OneToOneOutlined,
    QuestionCircleOutlined,
    SearchOutlined,
} from '@ant-design/icons'
import { FormInstance } from 'antd/es/form/Form'
import { ColumnsType } from 'antd/lib/table'
import {
    SortableContainer,
    SortableElement,
    SortableHandle,
} from 'react-sortable-hoc'
import type { SortableContainerProps, SortEnd } from 'react-sortable-hoc'
import { arrayMoveImmutable } from 'array-move'
import { format } from 'sql-formatter'
import { request } from 'http'
import { check } from 'prettier'
import { TableComponents } from 'rc-table/lib/interface'
import { DefaultOptionType } from 'antd/lib/select'
import FormTitle from '../ConfigDataSerivce/FormTitle'
import __ from './locale'
import styles from './styles.module.less'
import {
    formatError,
    formExchangeSql,
    getColumnsByData,
    getDataCatalogs,
    getDataCatalogsDetail,
    getParamsBySQL,
    getSchemas,
    getTablesBySchemas,
    ParamsMasking,
    ParamsOperator,
    ParamsSort,
    getErrorMessage,
} from '@/core'
import { ColumnsInfo } from '@/core/apis/dataApplicationService/index.d'
import { CheckedStatus, defautData } from '../ConfigDataSerivce/const'
import {
    AddOutlined,
    FormatOutlined,
    ScriptModelOutlined,
    WizardModelOutlined,
} from '@/icons'
import { entendNameEnReg, keyboardReg, nameReg } from '@/utils'
import { defaultTableRequestParams, defaultTableResponseParams } from './const'

interface ParamsTableType {
    columns: ColumnsType<any>
    value?: Array<any>
    onChange?: (value) => void
    isDrag?: boolean
    components?: TableComponents<any>
}

interface ParmsConfigFormType {
    onFinsh: (values) => void
    form: FormInstance<any>
    defaultValues?: any
    onDataChange?: () => void
}

const ParamsTable = ({
    columns,
    value = [],
    onChange = noop,
    components,
    isDrag = false,
}: ParamsTableType) => {
    return (
        <Table
            pagination={false}
            rowKey={(record, index) => index || 0}
            dataSource={value || []}
            columns={columns}
            className={styles.paramTable}
            components={isDrag ? components : {}}
            scroll={{
                y: 500,
            }}
        />
    )
}

const ParmsConfigForm = ({
    onFinsh,
    form,
    defaultValues = {},
    onDataChange = noop,
}: ParmsConfigFormType) => {
    const requestContentNode = useRef<HTMLDivElement>(null)
    useEffect(() => {
        form.setFieldsValue(defaultValues)
    }, [defaultValues])

    /**
     * 新建请求参数
     */
    const handleAddRequestData = () => {
        const requestData = form.getFieldValue('data_table_request_params')
        form.setFieldValue('data_table_request_params', [
            defaultTableRequestParams,
            ...requestData,
        ])
    }

    // 请求参数
    const paramsFormRequestColumns: ColumnsType<any> = [
        {
            title: __('中文名称'),
            key: 'cn_name',
            render: (_, record, index) => (
                <Form.Item
                    name={['data_table_request_params', index, 'cn_name']}
                    validateFirst
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
                    <Input
                        placeholder={__('请输入')}
                        autoComplete="off"
                        maxLength={128}
                    />
                </Form.Item>
            ),
            width: '15%',
        },
        {
            title: __('英文名称'),
            key: 'en_name',
            render: (_, record, index) => (
                <Form.Item
                    name={['data_table_request_params', index, 'en_name']}
                    validateFirst
                    rules={[
                        {
                            required: true,
                            message: __('请输入英文名称'),
                        },
                        {
                            pattern: entendNameEnReg,
                            message: __(
                                '仅支持英文、数字、下划线、中划线，且不能以下划线和中划线开头',
                            ),
                            transform: (value) => trim(value),
                        },
                        {
                            validateTrigger: ['onBlur', 'onChange'],
                            validator: (ruler, value) => {
                                const allFields = form.getFieldValue(
                                    'data_table_request_params',
                                )
                                if (
                                    allFields.find(
                                        (field, dataIndex) =>
                                            field.en_name === value &&
                                            dataIndex !== index,
                                    )
                                ) {
                                    return Promise.reject(
                                        new Error(
                                            __('该名称已存在，请重新输入'),
                                        ),
                                    )
                                }
                                return Promise.resolve()
                            },
                        },
                    ]}
                >
                    <Input
                        placeholder={__('请输入')}
                        autoComplete="off"
                        maxLength={128}
                    />
                </Form.Item>
            ),
            width: '15%',
        },
        {
            title: __('字段类型'),
            key: 'data_type',
            render: (_, record, index) => (
                <Form.Item
                    name={['data_table_request_params', index, 'data_type']}
                    rules={[
                        {
                            required: true,
                            message: __('请选择字段类型'),
                        },
                    ]}
                >
                    <Select
                        notFoundContent={__('暂无数据')}
                        getPopupContainer={(node) =>
                            requestContentNode?.current || node.parentNode
                        }
                        value={record.required}
                        style={{ width: '100px' }}
                        placeholder={__('请选择')}
                        options={[
                            {
                                value: 'string',
                                label: 'string',
                            },
                            {
                                value: 'int',
                                label: 'int',
                            },
                            {
                                value: 'long',
                                label: 'long',
                            },
                            {
                                value: 'float',
                                label: 'float',
                            },
                            {
                                value: 'double',
                                label: 'double',
                            },
                            {
                                value: 'boolean',
                                label: 'boolean',
                            },
                        ]}
                    />
                </Form.Item>
            ),
            width: '15%',
        },
        {
            title: __('是否必填'),
            key: 'required',
            render: (_, record, index) => (
                <Form.Item
                    name={['data_table_request_params', index, 'required']}
                    initialValue="yes"
                    noStyle
                >
                    <Select
                        notFoundContent={__('暂无数据')}
                        getPopupContainer={(node) =>
                            requestContentNode?.current || node.parentNode
                        }
                        value={record.required}
                        style={{ width: '60px' }}
                        options={[
                            {
                                value: 'yes',
                                label: __('是'),
                            },
                            {
                                value: 'no',
                                label: __('否'),
                            },
                        ]}
                    />
                </Form.Item>
            ),
            width: '10%',
        },
        {
            title: __('默认值'),
            key: 'default_value',
            render: (_, record, index) => (
                <Form.Item
                    name={['data_table_request_params', index, 'default_value']}
                    validateFirst
                    rules={[
                        {
                            pattern: keyboardReg,
                            message: __(
                                '仅支持中英文、数字、及键盘上的特殊字符',
                            ),
                            transform: (value) => trim(value),
                        },
                    ]}
                    initialValue={record.default_value}
                >
                    <Input
                        placeholder={__('请输入')}
                        autoComplete="off"
                        maxLength={255}
                    />
                </Form.Item>
            ),
            width: '10%',
        },
        {
            title: __('描述'),
            key: 'description',
            render: (_, record, index) => (
                <Form.Item
                    name={['data_table_request_params', index, 'description']}
                    validateFirst
                    rules={[
                        {
                            pattern: keyboardReg,
                            message: __(
                                '仅支持中英文、数字、及键盘上的特殊字符',
                            ),
                            transform: (value) => trim(value),
                        },
                    ]}
                    initialValue={record.description}
                >
                    <Input
                        placeholder={__('请输入')}
                        autoComplete="off"
                        maxLength={255}
                    />
                </Form.Item>
            ),
            width: '15%',
        },
        {
            title: __('操作'),
            key: 'action',
            render: (_, record, index) => (
                <Popconfirm
                    placement="top"
                    title={__('你确定要删除吗？')}
                    onConfirm={() => {
                        const currentData = form.getFieldValue(
                            'data_table_request_params',
                        )
                        const filterRequstData = currentData?.filter(
                            (requestData, requestIndex) =>
                                requestIndex !== index,
                        )
                        form.setFieldValue(
                            'data_table_request_params',
                            filterRequstData,
                        )
                    }}
                    okText={__('确定')}
                    cancelText={__('取消')}
                >
                    <Button type="link">{__('移除')}</Button>
                </Popconfirm>
            ),
            width: '10%',
        },
    ]
    return (
        <Form
            layout="vertical"
            className={styles.paramsConfig}
            form={form}
            onFinish={onFinsh}
            initialValues={defaultValues}
            onValuesChange={() => {
                onDataChange()
            }}
        >
            <FormTitle title={__('参数配置')} />
            <div className={styles.formInfoContent}>
                <div className={styles.addTitle}>
                    <div
                        className={classnames(
                            styles.selectedTableToolBar,
                            styles.tableTop,
                        )}
                    >
                        <div className={styles.title}>{__('请求参数')}</div>
                    </div>
                    <Button
                        type="link"
                        icon={<AddOutlined />}
                        onClick={handleAddRequestData}
                    >
                        {__('添加')}
                    </Button>
                </div>
                <div ref={requestContentNode}>
                    <Form.Item name="data_table_request_params">
                        <ParamsTable columns={paramsFormRequestColumns} />
                    </Form.Item>
                </div>
            </div>
        </Form>
    )
}

export default ParmsConfigForm
