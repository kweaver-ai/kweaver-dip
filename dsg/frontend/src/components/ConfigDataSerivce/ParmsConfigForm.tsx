import {
    ExclamationCircleFilled,
    MenuOutlined,
    QuestionCircleOutlined,
} from '@ant-design/icons'
import {
    Button,
    Checkbox,
    Form,
    Input,
    message,
    Popconfirm,
    Select,
    Table,
    Tooltip,
} from 'antd'
import { FormInstance } from 'antd/es/form/Form'
import { DefaultOptionType } from 'antd/lib/select'
import { ColumnsType } from 'antd/lib/table'
import { arrayMoveImmutable } from 'array-move'
import classnames from 'classnames'
import { noop, trim } from 'lodash'
import { TableComponents } from 'rc-table/lib/interface'
import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import type { SortableContainerProps } from 'react-sortable-hoc'
import {
    SortableContainer,
    SortableElement,
    SortableHandle,
} from 'react-sortable-hoc'
import { format } from 'sql-formatter'
import { confirm } from '@/utils/modalHelper'
import { keyboardCharactersReg, keyboardReg } from '@/utils'
import Empty from '@/ui/Empty'
import { SearchInput } from '@/ui'
import { ScriptModelOutlined } from '@/icons'
import {
    formatError,
    formExchangeSql,
    getParamsBySQL,
    ParamsMasking,
    ParamsOperator,
    ParamsSort,
} from '@/core'
import { useCatalogColumn } from '../DimensionModel/helper'
import FormTitle from './FormTitle'
import SqlEditor from './SqlEditor'
import { getParamsByType } from './common'
import { CheckedStatus, dataTypeRelation } from './const'
import __ from './locale'
import styles from './styles.module.less'

interface ParamsTableType {
    columns: ColumnsType<any>
    value?: Array<any>
    onChange?: (value) => void
    isDrag?: boolean
    components?: TableComponents<any>
}

interface ParmsConfigFormType {
    model: 'wizard' | 'script'
    onFinsh: (values) => void
    form: FormInstance<any>
    defaultValues?: any
    onDataChange?: () => void
}
const SortableItem = SortableElement(
    (props: React.HTMLAttributes<HTMLTableRowElement>) => <tr {...props} />,
)
const SortableBody = SortableContainer(
    (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
        <tbody {...props} />
    ),
)

const DraggableBodyRow: React.FC<any> = ({
    dataSource,
    className,
    style,
    ...restProps
}) => {
    const index = dataSource?.findIndex((x, dataIndex) => {
        return dataIndex === restProps['data-row-key']
    })
    return <SortableItem index={index} {...restProps} />
}

const DraggableContainer = ({
    onSortEnd,
    props,
}: {
    onSortEnd: any
    props: SortableContainerProps
}) => (
    <SortableBody
        useDragHandle
        disableAutoscroll
        helperClass={styles.rowDragging}
        onSortEnd={onSortEnd}
        {...props}
    />
)

interface ConfirmSelectType {
    options: DefaultOptionType[] | undefined
    value?: any
    onChange?: (value) => void
    title: string
    content: string
    disabled?: boolean
    confirmCondition: () => boolean
    optionFilterProp?: string
    onSearch?: (value: string) => void
    filterOption?: boolean | ((valueType: any, option: any) => boolean)
}

const ConfirmSelect = ({
    options,
    value,
    onChange = noop,
    title,
    content,
    disabled = false,
    confirmCondition,
    optionFilterProp,
    filterOption = true,
    onSearch = noop,
}: ConfirmSelectType) => {
    return (
        <Select
            notFoundContent={__('暂无数据')}
            getPopupContainer={(node) => node.parentNode}
            placeholder={__('请选择')}
            value={value}
            options={options}
            disabled={disabled}
            optionFilterProp={optionFilterProp}
            onSearch={onSearch}
            filterOption={filterOption}
            onChange={(currentValue) => {
                if (confirmCondition()) {
                    confirm({
                        title,
                        icon: (
                            <ExclamationCircleFilled
                                style={{ color: 'rgb(250, 173, 20)' }}
                            />
                        ),
                        content,
                        okText: __('确定'),
                        cancelText: __('取消'),
                        onOk: () => {
                            onChange(currentValue)
                        },
                        onCancel: () => {
                            // onChange(value)
                        },
                    })
                } else {
                    onChange(currentValue)
                }
            }}
            showSearch
        />
    )
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
            dataSource={value}
            columns={columns}
            className={styles.paramTable}
            components={isDrag ? components : {}}
            scroll={{
                y: 500,
            }}
        />
    )
}

const DragHandle = SortableHandle(() => (
    <MenuOutlined style={{ cursor: 'grab', color: '#999' }} />
))

interface DataViewType {
    title: string
    value?: string
    onChange?: (value) => void
    style: any
    name?: string
}
const DataView = ({ title, value, onChange, style, name }: DataViewType) => {
    return (
        <div className={styles.dataSourceTable} style={style}>
            <div className={styles.label}>{title}</div>
            <div>
                {name === 'data_source' && value
                    ? JSON.parse(value)?.schema_name
                    : value}
            </div>
        </div>
    )
}
const ParmsConfigForm = ({
    model,
    onFinsh,
    form,
    defaultValues = {},
    onDataChange = noop,
}: ParmsConfigFormType) => {
    const [configModel, setConfigModel] = useState<'wizard' | 'script'>(
        'wizard',
    )
    const [errorMessge, setErrorMessage] = useState<string>('')
    const [columnsData, setColumnsData] = useState<Array<any>>([])
    const [defaultColumns, seDefaultColumns] = useState<Array<any>>([])
    const [keyword, setKeyword] = useState<string>('')
    const [requestCheckedStatus, setRequestCheckedStatus] =
        useState<CheckedStatus>(CheckedStatus.UnChecked)
    const [requestParams, setRequestParams] = useState<Array<any>>([])
    const [responseCheckedStatus, setResponseCheckedStatus] =
        useState<CheckedStatus>(CheckedStatus.UnChecked)
    const [responseParams, setResponseParams] = useState<Array<any>>([])
    const [selectorMode, setSelectorModel] = useState<string>(
        defaultValues?.data_source_select_type || 'custom',
    )
    const [dataTableName, setDataTableName] = useState<string>('')
    const requestContentNode = useRef<HTMLDivElement>(null)
    const responseContentNode = useRef<HTMLDivElement>(null)
    const { loading, getColumnsById } = useCatalogColumn()

    useEffect(() => {
        if (defaultValues?.create_model) {
            setConfigModel(defaultValues?.create_model)
        }
        if (defaultValues?.data_source_select_type) {
            setSelectorModel(defaultValues?.data_source_select_type)
            if (defaultValues.data_source_select_type === 'custom') {
                if (
                    defaultValues?.data_table_request_params &&
                    defaultValues?.data_table_response_params
                ) {
                    setRequestParams(defaultValues.data_table_request_params)
                    setResponseParams(defaultValues.data_table_response_params)
                    form.setFieldValue(
                        'data_table_response_params',
                        defaultValues.data_table_response_params,
                    )
                    form.setFieldValue(
                        'data_table_request_params',
                        defaultValues.data_table_request_params,
                    )
                }
            }
        }
        if (defaultValues?.data_view_id) {
            setFieldByTable(defaultValues?.data_view_id)
        }
    }, [defaultValues])

    // useEffect(() => {
    //     setConfigModel(model)
    // }, [model])

    useEffect(() => {
        if (defaultColumns.length) {
            setColumnsData(
                defaultColumns.filter(
                    (columnData) =>
                        columnData.en_name.includes(keyword) ||
                        columnData.cn_name.includes(keyword),
                ),
            )
        }
    }, [keyword])

    useEffect(() => {
        setCheckoutResponseStatus()
    }, [responseParams])

    useEffect(() => {
        setCheckoutRequestStatus()
    }, [requestParams])

    useEffect(() => {
        setCheckoutResponseStatus()
        setCheckoutRequestStatus()
    }, [columnsData])

    const onSortEnd = ({ oldIndex, newIndex }) => {
        const dataSource = form.getFieldValue('data_table_response_params')

        if (oldIndex !== newIndex) {
            const newData = arrayMoveImmutable(
                dataSource.slice(),
                oldIndex,
                newIndex,
            ).filter((el: any) => !!el)
            form.setFieldValue('data_table_response_params', newData)
            setResponseParams(newData)
        }
    }

    const setFieldByTable = async (tableName) => {
        const { data } = await getColumnsById(tableName)
        const columns = data.map((item) => ({
            ...item,
            en_name: item.technical_name,
            cn_name: item.business_name,
        }))
        seDefaultColumns(columns)
        setColumnsData(columns)
    }

    const clearFormData = () => {
        form.setFieldValue('data_table_response_params', [])
        form.setFieldValue('data_table_request_params', [])
        setRequestParams([])
        setResponseParams([])
    }

    const setCheckoutRequestStatus = () => {
        if (requestParams.length) {
            const selectedCurrentData = requestParams?.filter((currentvalue) =>
                columnsData.find(
                    (selectedValue) =>
                        selectedValue.en_name === currentvalue.en_name,
                ),
            )
            if (selectedCurrentData.length === columnsData.length) {
                setRequestCheckedStatus(CheckedStatus.Checked)
            } else if (!selectedCurrentData.length) {
                setRequestCheckedStatus(CheckedStatus.UnChecked)
            } else {
                setRequestCheckedStatus(CheckedStatus.Indeterminated)
            }
        } else {
            setRequestCheckedStatus(CheckedStatus.UnChecked)
        }
    }

    const setCheckoutResponseStatus = () => {
        if (responseParams.length) {
            const selectedCurrentData = responseParams?.filter((currentvalue) =>
                columnsData.find(
                    (selectedValue) =>
                        selectedValue.en_name === currentvalue.en_name,
                ),
            )
            if (selectedCurrentData.length === columnsData.length) {
                setResponseCheckedStatus(CheckedStatus.Checked)
            } else if (!selectedCurrentData.length) {
                setResponseCheckedStatus(CheckedStatus.UnChecked)
            } else {
                setResponseCheckedStatus(CheckedStatus.Indeterminated)
            }
        } else {
            setResponseCheckedStatus(CheckedStatus.UnChecked)
        }
    }

    const selectAllData = (
        checkedStatus: boolean,
        currentSelectedData: Array<any>,
    ) => {
        if (checkedStatus) {
            const unSelectedData = columnsData.filter(
                (currentvalue) =>
                    !currentSelectedData.find(
                        (selectedValue) =>
                            selectedValue.en_name === currentvalue.en_name,
                    ),
            )
            return [...currentSelectedData, ...unSelectedData]
        }
        return currentSelectedData.filter((currentvalue) => {
            const exist = !columnsData.find(
                (selectedValue) =>
                    selectedValue.en_name === currentvalue.en_name,
            )
            return exist
        })
    }

    // 参数选择表
    const originFormColumns: ColumnsType<any> = [
        {
            title: __('技术名称'),
            key: 'en_name',
            render: (_, record) => (
                <div className={styles.tableText} title={record?.en_name || ''}>
                    {record.en_name}
                </div>
            ),
            width: '30%',
        },
        {
            title: __('业务名称'),
            key: 'cn_name',
            render: (_, record) => (
                <div className={styles.tableText} title={record?.cn_name || ''}>
                    {record?.cn_name || '--'}
                </div>
            ),
            width: '30%',
        },
        {
            title: __('数据类型'),
            key: 'data_type',
            render: (_, record) => <div>{record?.data_type || '--'}</div>,
            width: '20%',
        },
        {
            title: __('原始数据类型'),
            key: 'original_data_type',
            render: (_, record) => (
                <div>{record?.original_data_type || '--'}</div>
            ),
            width: '20%',
        },
        {
            title: (
                <Checkbox
                    checked={requestCheckedStatus === CheckedStatus.Checked}
                    indeterminate={
                        requestCheckedStatus === CheckedStatus.Indeterminated
                    }
                    onChange={(e) => {
                        const checkedData = selectAllData(
                            e.target.checked,
                            form.getFieldValue('data_table_request_params'),
                        )
                        const checkedFormatData = checkedData.map(
                            (requestData) => {
                                return requestData.required
                                    ? requestData
                                    : {
                                          en_name: requestData.en_name,
                                          data_type: changeDataType(
                                              requestData.data_type,
                                          ),
                                          cn_name: requestData?.cn_name || '',
                                      }
                            },
                        )

                        form.setFieldValue(
                            'data_table_request_params',
                            checkedFormatData,
                        )
                        setRequestParams(checkedFormatData)
                    }}
                >
                    {__('设为请求参数')}
                </Checkbox>
            ),
            key: 'request',
            render: (_, record) => (
                <Checkbox
                    checked={
                        !!requestParams.find(
                            (requestData) =>
                                requestData.en_name === record.en_name,
                        )
                    }
                    onChange={(e) => {
                        const currentData =
                            form.getFieldValue('data_table_request_params') ||
                            []
                        if (e.target.checked) {
                            setRequestParams([
                                ...requestParams,
                                {
                                    en_name: record.en_name,
                                    data_type: changeDataType(record.data_type),
                                    cn_name: record?.cn_name || '',
                                },
                            ])
                            form.setFieldValue('data_table_request_params', [
                                ...currentData,
                                {
                                    en_name: record.en_name,
                                    data_type: changeDataType(record.data_type),
                                    cn_name: record?.cn_name || '',
                                },
                            ])
                            form.validateFields(['data_table_request_params'])
                        } else {
                            const filterRequesteData = currentData?.filter(
                                (requestData) =>
                                    requestData.en_name !== record.en_name,
                            )
                            form.setFieldValue(
                                'data_table_request_params',
                                filterRequesteData,
                            )
                            setRequestParams(filterRequesteData)
                        }
                    }}
                />
            ),
            width: '20%',
        },
        {
            title: (
                <Checkbox
                    checked={responseCheckedStatus === CheckedStatus.Checked}
                    indeterminate={
                        responseCheckedStatus === CheckedStatus.Indeterminated
                    }
                    onChange={(e) => {
                        const checkedData = selectAllData(
                            e.target.checked,
                            form.getFieldValue('data_table_response_params'),
                        ).map((responseData) =>
                            responseData.sort
                                ? responseData
                                : {
                                      en_name: responseData.en_name,
                                      data_type: changeDataType(
                                          responseData.data_type,
                                      ),
                                      cn_name: responseData?.cn_name || '',
                                  },
                        )
                        form.setFieldValue(
                            'data_table_response_params',
                            checkedData,
                        )
                        setResponseParams(checkedData)
                    }}
                >
                    {__('设为返回参数')}
                </Checkbox>
            ),
            key: 'response',
            render: (_, record) => (
                <Checkbox
                    checked={
                        !!responseParams.find(
                            (responseData) =>
                                responseData.en_name === record.en_name,
                        )
                    }
                    onChange={(e) => {
                        const currentData =
                            form.getFieldValue('data_table_response_params') ||
                            []
                        if (e.target.checked) {
                            setResponseParams([
                                ...currentData,
                                {
                                    en_name: record.en_name,
                                    data_type: changeDataType(record.data_type),
                                    cn_name: record?.cn_name || '',
                                },
                            ])
                            form.setFieldValue('data_table_response_params', [
                                ...currentData,
                                {
                                    en_name: record.en_name,
                                    data_type: changeDataType(record.data_type),
                                    cn_name: record?.cn_name || '',
                                },
                            ])
                            form.validateFields(['data_table_response_params'])
                        } else {
                            const filterResponseData = currentData?.filter(
                                (responseData) =>
                                    responseData.en_name !== record.en_name,
                            )
                            form.setFieldValue(
                                'data_table_response_params',
                                filterResponseData,
                            )
                            setResponseParams(filterResponseData)
                        }
                    }}
                />
            ),
            width: '20%',
        },
    ]

    // 返回参数表
    const paramsFormResponseColumns: ColumnsType<any> = [
        {
            dataIndex: 'drag',
            width: '5%',
            key: 'drag',
            className: 'drag-visible',
            render: () => <DragHandle />,
        },
        {
            title: __('技术名称'),
            key: 'en_name',
            render: (_, record, index) => (
                <Form.Item
                    name={['data_table_response_params', index, 'en_name']}
                    noStyle
                    initialValue={record.en_name}
                >
                    {record.en_name}
                </Form.Item>
            ),
            width: '15%',
        },
        {
            title: __('业务名称'),
            key: 'cn_name',
            render: (_, record, index) => (
                <Form.Item
                    name={['data_table_response_params', index, 'cn_name']}
                    validateFirst
                    rules={[
                        {
                            pattern: keyboardCharactersReg,
                            message: __(
                                '仅支持中英文、数字、及键盘上的特殊字符',
                            ),
                            transform: (value) => trim(value),
                        },
                    ]}
                    initialValue={record?.cn_name || ''}
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
            render: (_, record, index) => {
                return (
                    <Form.Item
                        name={[
                            'data_table_response_params',
                            index,
                            'data_type',
                        ]}
                        initialValue={record.data_type}
                    >
                        {record.data_type}
                    </Form.Item>
                )
            },
            width: '15%',
        },
        {
            title: __('排序规则'),
            key: 'sort',
            render: (_, record, index) => (
                <Form.Item
                    name={['data_table_response_params', index, 'sort']}
                    noStyle
                    initialValue={ParamsSort.Unsorted}
                >
                    <Select
                        notFoundContent={__('暂无数据')}
                        getPopupContainer={(node) =>
                            responseContentNode?.current || node.parentNode
                        }
                        options={[
                            {
                                value: ParamsSort.Unsorted,
                                label: __('不排序'),
                            },
                            {
                                value: ParamsSort.ASC,
                                label: __('升序'),
                            },
                            {
                                value: ParamsSort.DESC,
                                label: __('降序'),
                            },
                        ]}
                    />
                </Form.Item>
            ),
            width: '15%',
        },
        {
            title: __('脱敏规则'),
            key: 'masking',
            render: (_, record, index) => (
                <Form.Item
                    name={['data_table_response_params', index, 'masking']}
                    noStyle
                    initialValue={ParamsMasking.Plaintext}
                >
                    <Select
                        notFoundContent={__('暂无数据')}
                        getPopupContainer={(node) =>
                            responseContentNode?.current || node.parentNode
                        }
                        options={[
                            {
                                value: ParamsMasking.Plaintext,
                                label: __('不脱敏'),
                            },
                            {
                                value: ParamsMasking.Hash,
                                label: __('哈希'),
                            },
                            {
                                value: ParamsMasking.Override,
                                label: __('覆盖'),
                            },
                            {
                                value: ParamsMasking.Replace,
                                label: __('替换'),
                            },
                        ]}
                    />
                </Form.Item>
            ),
            width: '15%',
        },
        {
            title: __('描述'),
            key: 'description',
            render: (_, record, index) => (
                <Form.Item
                    name={['data_table_response_params', index, 'description']}
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
                        maxLength={255}
                    />
                </Form.Item>
            ),
            width: '15%',
        },
        {
            title: __('操作'),
            key: 'action',
            render: (_, record) => (
                <Popconfirm
                    placement="top"
                    title={__('你确定要删除吗？')}
                    onConfirm={() => {
                        const currentData = form.getFieldValue(
                            'data_table_response_params',
                        )
                        const filterResponseData = currentData?.filter(
                            (responseData) =>
                                responseData.en_name !== record.en_name,
                        )
                        form.setFieldValue(
                            'data_table_response_params',
                            filterResponseData,
                        )
                        setResponseParams(filterResponseData)
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

    // 请求参数
    const paramsFormRequestColumns: ColumnsType<any> = [
        {
            title: __('技术名称'),
            key: 'en_name',
            render: (_, record, index) => (
                <Form.Item
                    name={['data_table_request_params', index, 'en_name']}
                    initialValue={record.en_name}
                    noStyle
                >
                    <div>{record.en_name}</div>
                </Form.Item>
            ),
            width: '15%',
        },
        {
            title: __('业务名称'),
            key: 'cn_name',
            render: (_, record, index) => (
                <Form.Item
                    name={['data_table_request_params', index, 'cn_name']}
                    validateFirst
                    rules={[
                        {
                            pattern: keyboardCharactersReg,
                            message: __(
                                '仅支持中英文、数字、及键盘上的特殊字符',
                            ),
                            transform: (value) => trim(value),
                        },
                    ]}
                    initialValue={record?.cn_name || ''}
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
            render: (_, record, index) => {
                return (
                    <Form.Item
                        name={['data_table_request_params', index, 'data_type']}
                        initialValue={record.data_type}
                    >
                        {record.data_type}
                    </Form.Item>
                )
            },
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
                        disabled={configModel === 'script'}
                    />
                </Form.Item>
            ),
            width: '10%',
        },
        {
            title: __('运算逻辑'),
            key: 'operator',
            render: (_, record, index) => (
                <Form.Item
                    name={['data_table_request_params', index, 'operator']}
                    initialValue={ParamsOperator.Equal}
                    noStyle
                >
                    <Select
                        getPopupContainer={(node) =>
                            requestContentNode?.current || node.parentNode
                        }
                        style={{ width: '130px' }}
                        options={[
                            {
                                value: ParamsOperator.Equal,
                                label: `${__('精确匹配')}(${
                                    ParamsOperator.Equal
                                })`,
                            },
                            {
                                value: ParamsOperator.Like,
                                label: `${__('模糊匹配')}(${
                                    ParamsOperator.Like
                                })`,
                            },
                            {
                                value: ParamsOperator.Neq,
                                label: `${__('不等于')}(${ParamsOperator.Neq})`,
                            },
                            {
                                value: ParamsOperator.Greater,
                                label: `${__('大于')}(${
                                    ParamsOperator.Greater
                                })`,
                            },
                            {
                                value: ParamsOperator.GreaterEqual,
                                label: `${__('大于等于')}(${
                                    ParamsOperator.GreaterEqual
                                })`,
                            },
                            {
                                value: ParamsOperator.Less,
                                label: `${__('小于')}(${ParamsOperator.Less})`,
                            },
                            {
                                value: ParamsOperator.LessEqual,
                                label: `${__('小于等于')}(${
                                    ParamsOperator.LessEqual
                                })`,
                            },
                            {
                                value: ParamsOperator.Incloudes,
                                label: `${__('包含')}(${
                                    ParamsOperator.Incloudes
                                })`,
                            },
                            {
                                value: ParamsOperator.Excludes,
                                label: `${__('不包含')}(${
                                    ParamsOperator.Excludes
                                })`,
                            },
                        ]}
                    />
                </Form.Item>
            ),
            width: '15%',
        },
        {
            title: __('默认值'),
            key: 'default_value',
            render: (_, record, index) => (
                <Form.Item
                    name={['data_table_request_params', index, 'default_value']}
                    validateFirst
                    rules={
                        record.data_type === 'string'
                            ? [
                                  {
                                      pattern: keyboardReg,
                                      message: __(
                                          '仅支持中英文、数字、及键盘上的特殊字符',
                                      ),
                                      transform: (value) => trim(value),
                                  },
                              ]
                            : []
                    }
                    initialValue={record.default_value}
                >
                    {getParamsByType(record.data_type, index)}
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
            render: (_, record) => (
                <Popconfirm
                    placement="top"
                    title={__('你确定要删除吗？')}
                    onConfirm={() => {
                        const currentData = form.getFieldValue(
                            'data_table_request_params',
                        )
                        const filterRequstData = currentData?.filter(
                            (requestData) =>
                                requestData.en_name !== record.en_name,
                        )
                        form.setFieldValue(
                            'data_table_request_params',
                            filterRequstData,
                        )
                        setRequestParams(filterRequstData)
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

    const formatScript = () => {
        form.setFieldValue(
            'script',
            format(form.getFieldValue('script'), {
                denseOperators: true,
                logicalOperatorNewline: 'before',
            }),
        )
    }

    const changeDataType = (originType) => {
        const simpleType = originType.split('(')[0] || ''
        const type = Object.keys(dataTypeRelation).find((dataTypeKey) =>
            dataTypeRelation[dataTypeKey].includes(simpleType),
        )
        return type
        // return changeFormatToType(originType)
    }

    /**
     * 运行数据库脚本
     */
    const handleRuningSql = async () => {
        try {
            const script = form.getFieldValue('script')
            if (script) {
                const {
                    data_table_response_params,
                    data_table_request_params,
                    tables,
                } = await getParamsBySQL({
                    sql: script,
                    data_view_id: defaultValues?.data_view_id,
                    datasource_id: defaultValues?.datasource_id,
                })
                const requstParamsData = data_table_request_params.map(
                    (currentData) => ({
                        ...currentData,
                        data_type: changeDataType(currentData.data_type),
                        required: 'yes',
                        operator: ParamsOperator.Equal,
                    }),
                )
                const responseParamsData = data_table_response_params.map(
                    (currentData) => ({
                        ...currentData,
                        data_type: changeDataType(currentData.data_type),
                        sort: ParamsSort.Unsorted,
                        masking: ParamsMasking.Plaintext,
                    }),
                )
                setRequestParams(requstParamsData)
                setResponseParams(responseParamsData)
                form.setFieldValue(
                    'data_table_response_params',
                    responseParamsData,
                )
                form.setFieldValue(
                    'data_table_request_params',
                    requstParamsData,
                )
                form.validateFields()
            } else if (selectorMode === 'custom') {
                form.validateFields(['data_source', 'script'])
            } else {
                form.validateFields(['data_catalog', 'script'])
            }
            setErrorMessage('')
        } catch (ex) {
            if (ex && ex.data && ex.data.solution) {
                setErrorMessage(ex.data.solution)
                setRequestParams([])
                setResponseParams([])
                form.setFieldValue('data_table_response_params', [])
                form.setFieldValue('data_table_request_params', [])
            }
        }
    }
    /**
     * 切换到脚本模式
     */
    const switchConfigToScriptModel = async () => {
        try {
            const requestData = form.getFieldValue('data_table_request_params')
            const responseData = form.getFieldValue(
                'data_table_response_params',
            )
            setConfigModel('script')
            if (requestData.length && responseData.length) {
                const { sql } = await formExchangeSql({
                    data_view_id: defaultValues?.data_view_id,
                    datasource_id: defaultValues?.datasource_id,
                    data_table_request_params: requestData.map(
                        (currentData) => ({
                            en_name: currentData.en_name,
                            operator: currentData.operator,
                        }),
                    ),
                    data_table_response_params: responseData.map(
                        (currentData) => ({
                            en_name: currentData.en_name,
                        }),
                    ),
                })
                form.setFieldValue('script', sql)
            } else {
                form.setFieldValue('data_table_response_params', [])
                form.setFieldValue('data_table_request_params', [])
                setRequestParams([])
                setResponseParams([])
                form.setFieldValue('script', '')
            }

            form.setFieldValue('create_model', 'script')
        } catch (ex) {
            formatError(ex)
        }
    }

    /**
     * 切换到向导模式
     */
    const switchConfigToWizardModel = async () => {
        try {
            const script = form.getFieldValue('script')
            if (script) {
                const {
                    data_table_response_params,
                    data_table_request_params,
                    tables,
                } = await getParamsBySQL({
                    sql: script,
                    data_view_id: defaultValues?.data_view_id,
                    datasource_id: defaultValues?.datasource_id,
                })
                if (tables.length === 1) {
                    setConfigModel('wizard')

                    form.setFieldValue('create_model', 'wizard')
                    form.setFieldValue('data_table', tables[0])
                    setFieldByTable(defaultValues?.data_view_id)
                    setRequestParams(data_table_request_params)
                    setResponseParams(data_table_response_params)
                    // clearFormData()
                } else {
                    message.error(__('当前为多表查询不能切换到向导模式'))
                }
                setErrorMessage('')
            } else {
                form.setFieldValue('data_table_response_params', [])
                form.setFieldValue('data_table_request_params', [])
                setRequestParams([])
                setResponseParams([])
                setConfigModel('wizard')
                form.setFieldValue('create_model', 'wizard')
            }
        } catch (ex) {
            formatError(ex)
        }
    }

    return (
        <Form
            layout="vertical"
            className={styles.paramsConfig}
            form={form}
            onFinish={onFinsh}
            validateTrigger={['onChange', 'onBlur']}
            initialValues={defaultValues}
            onValuesChange={() => {
                onDataChange()
            }}
        >
            <div className={styles.dataViewContent}>
                <span className={styles.dataViewLabel}>
                    {__('已选择库表：')}
                </span>
                <span
                    className={styles.dataViewName}
                    title={defaultValues?.data_view_name}
                >
                    {defaultValues?.data_view_name}
                </span>
            </div>
            <FormTitle title={__('参数配置')} />
            <div className={styles.formInfoContent}>
                {configModel === 'wizard' ? (
                    <div>
                        <div className={styles.selectedTableToolBar}>
                            <div className={styles.title}>{__('选择参数')}</div>
                            <div className={styles.tools}>
                                <SearchInput
                                    placeholder={__('搜索中文名称、英文名称')}
                                    className={styles.searchInput}
                                    value={keyword}
                                    onKeyChange={(value: string) => {
                                        setKeyword(value)
                                    }}
                                    autoComplete="off"
                                />
                                <Form.Item name="create_model">
                                    <Tooltip
                                        placement="top"
                                        title={__('切换为脚本模式')}
                                    >
                                        <div
                                            className={styles.switchBtn}
                                            onClick={switchConfigToScriptModel}
                                        >
                                            <ScriptModelOutlined />
                                        </div>
                                    </Tooltip>
                                </Form.Item>
                            </div>
                        </div>
                        <Table
                            columns={originFormColumns}
                            pagination={false}
                            dataSource={columnsData}
                            scroll={{
                                y: 500,
                            }}
                            locale={{
                                emptyText: keyword ? <Empty /> : undefined,
                            }}
                        />
                    </div>
                ) : (
                    <div
                        style={{
                            marginBottom: '24px',
                        }}
                    >
                        <div className={styles.selectedTableToolBar}>
                            <div className={styles.title}>{__('编写脚本')}</div>
                            <div className={styles.sqlTools}>
                                {/* <Tooltip placement="top" title={__('美化格式')}>
                                    <div
                                        className={styles.switchBtn}
                                        onClick={formatScript}
                                        style={{
                                            marginRight: '16px',
                                        }}
                                    >
                                        <FormatOutlined />
                                    </div>
                                </Tooltip> */}
                                {/* <Form.Item name="create_model">
                                    <Tooltip
                                        placement="top"
                                        title={__('切换为向导模式')}
                                    >
                                        <div
                                            className={styles.switchBtn}
                                            onClick={switchConfigToWizardModel}
                                        >
                                            <WizardModelOutlined />
                                        </div>
                                    </Tooltip>
                                </Form.Item> */}
                            </div>
                        </div>
                        <div className={styles.sqlEditorContiner}>
                            <Form.Item name="script" noStyle>
                                <SqlEditor width="calc(100% - 2px)" />
                            </Form.Item>
                        </div>
                        <div className={styles.sqlBottomToolBar}>
                            <div className={styles.leftBar}>
                                <Button
                                    type="link"
                                    className={styles.btn}
                                    onClick={handleRuningSql}
                                >
                                    {__('运行')}
                                </Button>

                                <div className={styles.errorInfo}>
                                    <div>{errorMessge}</div>
                                </div>
                            </div>
                            <div className={styles.rightBar}>
                                <div className={styles.label}>
                                    {__('脚本示例')}
                                </div>
                                <Tooltip
                                    placement="bottom"
                                    title={
                                        <div>
                                            <div>
                                                select id, name from test_table
                                            </div>
                                            <div>
                                                {` where id = \${id} and name = \${name};`}
                                            </div>
                                        </div>
                                    }
                                >
                                    <QuestionCircleOutlined
                                        className={styles.titleHelper}
                                    />
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                )}
                <div
                    className={classnames(
                        styles.selectedTableToolBar,
                        styles.tableTop,
                    )}
                >
                    <div className={styles.title}>{__('已选择请求参数')}</div>
                </div>
                <div ref={requestContentNode}>
                    <Form.Item
                        name="data_table_request_params"
                        valuePropName="dataSource"
                        validateTrigger={['onChange']}
                    >
                        <ParamsTable
                            columns={paramsFormRequestColumns}
                            value={requestParams}
                        />
                    </Form.Item>
                </div>

                <div
                    className={classnames(
                        styles.selectedTableToolBar,
                        styles.tableTop,
                    )}
                >
                    <div className={styles.title}>{__('已选择的返回参数')}</div>
                </div>
                <div className={styles.descriptimnTitle}>
                    {__(
                        '字段越靠上 ，排序的优先级越高，您可以通过按住左侧图标，上下拖动改变字段顺序',
                    )}
                </div>
                <div ref={responseContentNode}>
                    <Form.Item
                        name="data_table_response_params"
                        valuePropName="dataSource"
                        validateTrigger={['onChange']}
                        rules={[
                            {
                                required: true,
                                type: 'array',
                                message:
                                    configModel === 'wizard'
                                        ? __('请选择返回参数')
                                        : __(
                                              '请先编写脚本，执行后，选择参数信息',
                                          ),
                            },
                        ]}
                    >
                        <ParamsTable
                            columns={paramsFormResponseColumns}
                            value={responseParams}
                            isDrag
                            components={{
                                body: {
                                    wrapper: (props) =>
                                        DraggableContainer({
                                            onSortEnd,
                                            props,
                                        }),
                                    row: (props) =>
                                        DraggableBodyRow({
                                            dataSource: responseParams,
                                            ...props,
                                        }),
                                },
                            }}
                        />
                    </Form.Item>
                </div>
            </div>
        </Form>
    )
}

export default ParmsConfigForm
