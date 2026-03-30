import React, {
    useState,
    useEffect,
    useRef,
    useImperativeHandle,
    forwardRef,
} from 'react'
import { Table, Tooltip, Button, Form } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TableComponents } from 'rc-table/lib/interface'
import { arrayMoveImmutable } from 'array-move'
import type { SortableContainerProps } from 'react-sortable-hoc'
import { SortableContainer, SortableElement } from 'react-sortable-hoc'
import { useGetState } from 'ahooks'
import { debounce, noop } from 'lodash'
import { TableRowSelection } from 'antd/lib/table/interface'
import { DownOutlined, UpOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'
import {
    scollerToErrorElement,
    filterSingleData,
} from '../../FormTableMode/helper'
import { SearchInput } from '@/ui'
import { needBatchField, StandardKeys } from '../const'
import {
    getBatchValuesStatus,
    getUniqueCount,
    RefStatus,
} from '../../FormTableMode/const'
import Empty from '@/ui/Empty'
import { getEditTableColumns } from './EditTableColumns'

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

interface SortTableType {
    columns: ColumnsType<any>
    value?: Array<any>
    onChange?: (value) => void
    isDrag?: boolean
    components?: TableComponents<any>
}
const SortTable = forwardRef(
    (
        {
            columns,
            value = [],
            onChange = noop,
            components,
            isDrag = false,
        }: SortTableType,
        ref,
    ) => {
        return (
            <Table
                pagination={false}
                rowKey={(record, index) => index || 0}
                dataSource={value}
                columns={columns}
                className={styles.paramTable}
                components={isDrag ? components : {}}
                scroll={{
                    x: 1920,
                    y: `calc(100vh - 364px)`,
                }}
                sticky
                locale={{
                    emptyText: <Empty />,
                }}
            />
        )
    },
)

interface IFieldsTable {
    fields: Array<any>
    onSave: (values: any) => Promise<void>
}

const FieldsTable = forwardRef(({ fields, onSave }: IFieldsTable, ref) => {
    const [form] = Form.useForm()
    const tableRef: any = useRef()
    const containerTable: any = useRef()
    const containerNode: any = useRef()

    // 所有错误数据
    const [errorInfos, setErrorInfos] = useState<Array<any>>([])
    const [searchSubmit, setSearchSubmit, getSearchSubmit] =
        useGetState<boolean>(false)
    const [errorIndex, setErrorIndex] = useState<number>(0)
    // 搜索条件
    const [searchKey, setSearchKey, getSearchKey] = useGetState<string>('')
    // 过滤条件
    const [filterKey, setFilterKey, getFilterKey] = useGetState<RefStatus | ''>(
        '',
    )
    // 配置属性的数据
    const [configModelData, setConfigModelData] = useState<Array<any>>([])
    // 配置模式
    const [configModel, setConfigModel] = useState<boolean>(true)
    // 搜索的数据
    const [searchFieldsData, setSearchFieldsData] =
        useState<Array<any> | null>()
    // 编辑的全部数据
    const [editFieldsData, setEditFieldsData] = useState<Array<any>>([])
    // 配置模式表头
    const [configColumns, setConfigColumns] = useState<Array<any>>([])
    // 表头数据
    const [columns, setColumns] = useState<Array<any>>([])
    // 选中的字段
    const [selectedFields, setSelectedFields] = useState<Array<any>>([])
    // 新字段的唯一标识
    const [createFieldUnique, setCreateFieldUnique] = useState<number>(0)
    const [isAdd, setIsAdd, getIsAdd] = useGetState<boolean>(false)
    const [tableLoading, setTableLoading] = useState<boolean>(true)
    // 当前选中的数据是否存在引用字段
    const [isIncludeRefData, setIsIncludeRefData] = useState<number>(0)

    // useEffect(() => {
    //     containerTable.current = tableRef?.current?.querySelector(
    //         '.any-fabric-ant-table-body',
    //     )
    // }, [tableRef])

    const rowSelection: TableRowSelection<any> = {
        type: 'checkbox',
        fixed: true,
        onSelect: (record, selected, selectedRows) => {
            // 单选更新选中项
            setSelectedFields(selectedRows)
        },
        onSelectAll: (selected, selectedRows, changeRows) => {
            // 多选更新选中项
            setSelectedFields(selectedRows)
        },
        selectedRowKeys: selectedFields.map(
            (currentSelectedData) => currentSelectedData.id,
        ),
    }

    // useEffect(() => {
    //     setTagOptions(generateTagItem([...tagData]))
    // }, [tagData])

    useEffect(() => {
        setEditFieldsData(
            fields.map((currentField) => ({
                ...currentField,
                formulate_basis: currentField.formulate_basis || undefined,
            })),
        )

        setCreateFieldUnique(getUniqueCount(fields))
        setConfigModelData(fields)
        // 多选编辑模式
        const columnsM = getEditTableColumns({
            getAllFieldsData: () => fields,
            form,
            parentNode: containerNode?.current,
        })
        setConfigColumns(columnsM)
    }, [fields])

    useEffect(() => {
        if (selectedFields && selectedFields.length) {
            const existRefData = selectedFields?.filter(
                (selectedField) => selectedField.ref_id,
            )
            setIsIncludeRefData(existRefData ? existRefData.length : 0)
        } else {
            setIsIncludeRefData(0)
        }
    }, [selectedFields])

    useEffect(() => {
        updateFormData()
    }, [editFieldsData])

    useEffect(() => {
        if (searchFieldsData) {
            // 更新全部数据
            const primaryKey = searchFieldsData.find(
                (item) => item.primary_flag,
            )
            // 搜索数据中有主键，则将全部数据中的非搜索数据中有主键的清除
            if (primaryKey) {
                setEditFieldsData(
                    editFieldsData.map((item) => {
                        const searchItem = searchFieldsData.find(
                            (f) => f.id === item.id,
                        )
                        if (searchItem) {
                            return searchItem
                        }
                        if (item.primary_flag) {
                            return {
                                ...item,
                                primary_flag: 0,
                            }
                        }
                        return item
                    }),
                )
            }
            setTimeout(() => {
                form.setFieldValue('fields', searchFieldsData)
            }, 100)
        } else {
            form.setFieldValue('fields', editFieldsData)
        }
    }, [searchFieldsData])

    useEffect(() => {
        form.setFieldValue('fields', configModelData)
    }, [configModelData])

    // useEffect(() => {
    //     if (dataEnumOptions) {
    //         // 多选编辑模式
    //         const columnsM = getEditTableColumns({
    //             dataEnumOptions,
    //             getAllFieldsData: () => editFieldsData,
    //             form,
    //             parentNode: containerNode?.current,
    //         })
    //         setConfigColumns(columnsM)
    //     }
    // }, [dataEnumOptions])

    useEffect(() => {
        // 根据中文名或者英文匹配，统一转为小写比较
        const currentDisplayData = form.getFieldValue('fields')
        // 当前表格数据+全部数据组成最新的所右数据
        const newAllData = editFieldsData.map((currenField) => {
            const foundField = currentDisplayData?.find(
                (searchField) => searchField.id === currenField.id,
            )
            return foundField || currenField
        })
        if (searchKey || filterKey) {
            setSearchFieldsData(
                newAllData?.filter((currentData) =>
                    filterSingleData(currentData, searchKey, filterKey),
                ) || [],
            )
        } else {
            if (searchFieldsData?.length) {
                // 搜索结束合并数据到总数据中
                setEditFieldsData(newAllData)
            }
            setSearchFieldsData(null)
        }
    }, [searchKey, filterKey])

    useImperativeHandle(ref, () => ({
        onSave: async () => {
            try {
                if (getSearchKey() || getFilterKey()) {
                    setSearchKey('')
                    setFilterKey('')
                    setSearchSubmit(true)
                } else {
                    await form.validateFields()

                    form.submit()
                }
            } catch (ex) {
                setErrorInfos(ex.errorFields)
                setErrorIndex(0)
                scollerToErrorElement(ex.errorFields[0].name.join('-'))
            }
        },
        getFields: () => {
            return editFieldsData.map((currenField) => {
                const foundField = form
                    .getFieldValue('fields')
                    ?.find((searchField) => searchField.id === currenField.id)
                return foundField || currenField
            })
        },

        validateFields: () => {
            return form.validateFields()
        },
    }))

    /**
     * 更新字段数据
     */
    const updateFormData = async () => {
        await form.setFieldValue('fields', editFieldsData)
        if (tableLoading) {
            setTimeout(() => {
                setTableLoading(false)
            }, 0)
        }
        if (getIsAdd()) {
            if (
                containerTable?.current?.scrollHeight &&
                containerTable.current.scrollHeight >
                    containerTable.current.scrollTop
            ) {
                containerTable.current.scrollTop =
                    containerTable.current.scrollHeight
            }
            setIsAdd(false)
        }
        if (getSearchSubmit()) {
            try {
                await form.validateFields()
                form.submit()
                setSearchSubmit(false)
            } catch (ex) {
                setErrorInfos(ex.errorFields)
                setErrorIndex(0)
                scollerToErrorElement(ex.errorFields[0].name.join('-'))
                setSearchSubmit(false)
            }
        }
    }

    /**
     * 字段更新
     */
    const handleValuesChange = (changedValues, values) => {
        const currentKey = Object.keys(changedValues)[0]

        if (Object.keys(needBatchField).includes(currentKey)) {
            const newConfigModelData = configModelData.map(
                (itemData, index) => ({
                    ...itemData,
                    ...values.fields[index],
                    [currentKey]: changedValues[currentKey].value,
                }),
            )
            const batchValue = getBatchValuesStatus(
                newConfigModelData,
                currentKey,
            )
            form.setFieldValue(currentKey, {
                value: batchValue.value,
                status: batchValue.status,
            })
            setConfigModelData(newConfigModelData)
        }

        if (currentKey === 'fields') {
            if (configModel) {
                changedValues[currentKey].forEach((changedValue, index) => {
                    const itemKey = Object.keys(changedValue)[0]
                    const batchValue = getBatchValuesStatus(
                        values.fields,
                        itemKey,
                    )
                    form.setFieldValue(itemKey, {
                        value: batchValue.value,
                        status: batchValue.status,
                    })
                    const newDataTypeData =
                        itemKey === 'data_type'
                            ? { data_length: null, data_accuracy: null }
                            : {}

                    // 批量编辑场景下更新标准化状态
                    if (StandardKeys.includes(itemKey)) {
                        const newValues = values.fields.map(
                            (currentValue, innerIndex) =>
                                index === innerIndex
                                    ? {
                                          ...configModelData[index],
                                          ...values.fields[index],
                                          ...changedValue,
                                          standard_status: '',
                                          ...newDataTypeData,
                                          value_range:
                                              itemKey === 'value_range_type'
                                                  ? null
                                                  : values.fields[index]
                                                        .value_range,
                                      }
                                    : currentValue,
                        )
                        setConfigModelData(newValues)
                    }
                })
            } else if (searchFieldsData?.length) {
                // 搜索场景下更新标准化状态
                changedValues[currentKey].forEach((changedValue, index) => {
                    const itemKey = Object.keys(changedValue)[0]
                    const newDataTypeData =
                        itemKey === 'data_type'
                            ? { data_length: null, data_accuracy: null }
                            : {}
                    if (StandardKeys.includes(itemKey)) {
                        const newValues = values.fields.map(
                            (currentValue, innerIndex) =>
                                index === innerIndex
                                    ? {
                                          ...searchFieldsData[index],
                                          ...values.fields[index],
                                          ...changedValue,
                                          standard_status: '',
                                          ...newDataTypeData,
                                          value_range:
                                              itemKey === 'value_range_type'
                                                  ? null
                                                  : values.fields[index]
                                                        .value_range,
                                      }
                                    : currentValue,
                        )
                        setSearchFieldsData(newValues)
                    }
                })
            } else {
                // 非搜索&非批量场景下更新标准化状态
                changedValues[currentKey].forEach((changedValue, index) => {
                    const itemKey = Object.keys(changedValue)[0]
                    const newDataTypeData =
                        itemKey === 'data_type'
                            ? { data_length: null, data_accuracy: null }
                            : {}
                    if (StandardKeys.includes(itemKey)) {
                        const newValues = values.fields.map(
                            (currentValue, innerIndex) =>
                                index === innerIndex
                                    ? {
                                          ...editFieldsData[index],
                                          ...values.fields[index],
                                          ...changedValue,
                                          standard_status: '',
                                          ...newDataTypeData,
                                          value_range:
                                              itemKey === 'value_range_type'
                                                  ? null
                                                  : values.fields[index]
                                                        .value_range,
                                      }
                                    : currentValue,
                        )
                        setEditFieldsData(newValues)
                    }
                })
            }
        }
        setTimeout(() => {
            const allErrors = form
                .getFieldsError()
                .filter((currentError) => currentError.errors.length)
            setErrorInfos(allErrors)
            if (allErrors.length - 1 > errorIndex) {
                // scollerToErrorElement(allErrors[errorIndex].name.join('-'))
            } else {
                // scollerToErrorElement(
                //     allErrors[allErrors.length - 1].name.join('-'),
                // )
                setErrorIndex(allErrors.length - 1)
            }
        }, 0)
    }

    const onFieldsChange = (changedFields) => {
        // field.name数据格式 : ['fields', 0, 'primary_flag']
        const field = changedFields[0]
        const changeIndex = field.name[1]
        if (field.name.includes('primary_flag') && field.value === 1) {
            setConfigModelData(
                configModelData.map((item, index) => {
                    if (changeIndex === index) {
                        return {
                            ...item,
                            primary_flag: 1,
                        }
                    }
                    return {
                        ...item,
                        primary_flag: 0,
                    }
                }),
            )
        }
        if (field.name.includes('timestamp_flag') && field.value === 1) {
            setConfigModelData(
                configModelData.map((item, index) => {
                    if (changeIndex === index) {
                        return {
                            ...item,
                            timestamp_flag: 1,
                        }
                    }
                    return {
                        ...item,
                        timestamp_flag: 0,
                    }
                }),
            )
        }
    }

    const handleFinish = (values) => {
        onSave(values.fields)
    }

    const onSortEnd = ({ oldIndex, newIndex }) => {
        const dataSource = form.getFieldValue('fields')

        if (oldIndex !== newIndex) {
            const newData = arrayMoveImmutable(
                dataSource.slice(),
                oldIndex,
                newIndex,
            ).filter((el: any) => !!el)
            form.setFieldValue('fields', newData)
            setEditFieldsData(newData)
        }
    }

    return (
        <div className={styles.fieldsTableWrapper} ref={containerNode}>
            <div className={styles.title}>
                {errorInfos?.length ? (
                    <div className={styles.errorTips}>
                        <span>
                            {__('${count}个字段信息不完善', {
                                count: errorInfos.length,
                            })}
                        </span>

                        <div>
                            <span className={styles.errorBar}>
                                {`${errorIndex + 1}/${errorInfos.length}`}
                            </span>
                            <Tooltip title={__('上一个')}>
                                <Button
                                    type="text"
                                    icon={<UpOutlined />}
                                    disabled={errorIndex === 0}
                                    onClick={() => {
                                        if (errorIndex > 0) {
                                            scollerToErrorElement(
                                                errorInfos[
                                                    errorIndex - 1
                                                ].name.join('-'),
                                            )
                                            setErrorIndex(errorIndex - 1)
                                        }
                                    }}
                                />
                            </Tooltip>
                            <Tooltip title={__('下一个')}>
                                <Button
                                    type="text"
                                    disabled={
                                        errorIndex === errorInfos.length - 1
                                    }
                                    icon={<DownOutlined />}
                                    onClick={() => {
                                        if (errorIndex < errorInfos.length) {
                                            scollerToErrorElement(
                                                errorInfos[
                                                    errorIndex + 1
                                                ].name.join('-'),
                                            )
                                            setErrorIndex(errorIndex + 1)
                                        }
                                    }}
                                />
                            </Tooltip>
                        </div>
                    </div>
                ) : (
                    <div />
                )}
                <SearchInput
                    value={searchKey}
                    placeholder={__('搜索信息中文、英文名称')}
                    className={styles.searchField}
                    onKeyChange={(kw: string) => {
                        setSearchKey(kw)
                    }}
                    style={{ width: '272px' }}
                />
            </div>
            <div className={styles.tableContiner}>
                <Form
                    form={form}
                    name="edit"
                    onValuesChange={debounce(handleValuesChange, 300)}
                    onFieldsChange={debounce(onFieldsChange, 300)}
                    onFinish={handleFinish}
                    scrollToFirstError
                >
                    <Form.Item valuePropName="dataSource" name="fields">
                        {/* <Table
                            columns={configColumns}
                            scroll={{
                                x: 1920,
                                y: `calc(100vh - 364px)`,
                            }}
                            sticky
                            rowKey="id"
                            // rowSelection={rowSelection}
                            loading={tableLoading}
                            locale={{
                                emptyText: <Empty />,
                            }}
                            pagination={false}
                            ref={tableRef}
                        /> */}
                        <SortTable
                            columns={configColumns}
                            isDrag
                            value={editFieldsData}
                            ref={tableRef}
                            components={{
                                body: {
                                    wrapper: (props) =>
                                        DraggableContainer({
                                            onSortEnd,
                                            props,
                                        }),
                                    row: (props) =>
                                        DraggableBodyRow({
                                            dataSource: editFieldsData,
                                            ...props,
                                        }),
                                },
                            }}
                        />
                    </Form.Item>
                </Form>
            </div>
        </div>
    )
})
export default FieldsTable
