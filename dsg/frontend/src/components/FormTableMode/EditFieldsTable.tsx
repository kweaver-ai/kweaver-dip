import {
    DownOutlined,
    ExclamationCircleFilled,
    InfoCircleFilled,
    MenuOutlined,
    SwapOutlined,
    UpOutlined,
} from '@ant-design/icons'
import { useGetState } from 'ahooks'
import { Button, Dropdown, Form, Space, Table, Tooltip, message } from 'antd'
import { TableRowSelection } from 'antd/lib/table/interface'
import { arrayMoveImmutable } from 'array-move'
import { debounce, noop } from 'lodash'
import React, {
    FC,
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react'
import type { SortableContainerProps } from 'react-sortable-hoc'
import {
    SortableContainer,
    SortableElement,
    SortableHandle,
} from 'react-sortable-hoc'
import { confirm } from '@/utils/modalHelper'
import Empty from '@/ui/Empty'
import { LightweightSearch, SearchInput } from '@/ui'
import MoreHorizontalOutlined from '@/icons/MoreHorizontalOutlined'
import { AddOutlined, FontIcon } from '@/icons'
import { DataGradeLabelType, IFormEnumConfigModel, IGradeLabel } from '@/core'
import dataEmpty from '@/assets/dataEmpty.svg'
import {
    StandardKeys,
    findNodeById,
    generateFullPathData,
    newFieldTemplate,
} from '../FormGraph/helper'
import { NewFormType } from '../Forms/const'
import {
    FilterItem,
    OptionType,
    RefStatus,
    StandardDataDetail,
    getBatchValuesStatus,
    getUniqueCount,
    moreDropDown,
    needBatchField,
} from './const'
import {
    filterSingleData,
    getEditTableColumns,
    scollerToErrorElement,
} from './helper'
import __ from './locale'
import styles from './styles.module.less'

/**
 * 可拖拽的表格
 */
const SortableBody = SortableContainer(
    (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
        <tbody {...props} />
    ),
)

/**
 * 可拖拽的容器
 */
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

/**
 * 可拖拽的行
 */
const SortableItem = SortableElement(
    (props: React.HTMLAttributes<HTMLTableRowElement>) => <tr {...props} />,
)

/**
 * 拖拽的图标
 */
const DragHandle = SortableHandle(() => (
    <MenuOutlined style={{ cursor: 'grab', color: '#999' }} />
))

/**
 * 可拖拽的表格行
 */
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

interface IEditFieldsTable {
    ref: any
    fields: Array<any>
    // 字段信息的相关的后端枚举映射
    dataEnumOptions: IFormEnumConfigModel | null
    taskId: string
    formInfo: any
    // 标准规则详情Map
    standardRuleDetail: StandardDataDetail

    updateSaveBtn?: (status: boolean) => void

    onSave: (values: any) => Promise<void>

    formType: NewFormType
    isStart: boolean
    tagData: IGradeLabel[]
    initDepartmentId?: string
}

const EditFieldsTable: FC<IEditFieldsTable> = forwardRef(
    (
        {
            fields,
            dataEnumOptions,
            taskId,
            formInfo,
            standardRuleDetail,
            updateSaveBtn = noop,
            onSave,
            formType,
            isStart,
            tagData,
            initDepartmentId,
        }: Omit<IEditFieldsTable, 'ref'>,
        ref,
    ) => {
        const [originData, setOriginData] = useState<any[]>([])
        // 编辑的全部数据
        const [editFieldsData, setEditFieldsData] = useState<Array<any>>([])
        // 搜索的数据
        const [searchFieldsData, setSearchFieldsData] =
            useState<Array<any> | null>()
        // 表头数据
        const [columns, setColumns] = useState<Array<any>>([])
        // 搜索条件
        const [searchKey, setSearchKey, getSearchKey] = useGetState<string>('')

        // 过滤条件
        const [filterKey, setFilterKey, getFilterKey] = useGetState<
            RefStatus | ''
        >('')

        // 选中的字段
        const [selectedFields, setSelectedFields] = useState<Array<any>>([])

        // 新字段的唯一标识
        const [createFieldUnique, setCreateFieldUnique] = useState<number>(0)

        const [form] = Form.useForm()

        // 配置模式
        const [configModel, setConfigModel] = useState<boolean>(false)

        // 配置模式表头

        const [configColumns, setConfigColumns] = useState<Array<any>>([])

        // 配置属性的数据
        const [configModelData, setConfigModelData] = useState<Array<any>>([])

        // 当前选中的数据是否存在引用字段
        const [isIncludeRefData, setIsIncludeRefData] = useState<number>(0)

        const [isAdd, setIsAdd, getIsAdd] = useGetState<boolean>(false)
        const [tableLoading, setTableLoading] = useState<boolean>(true)

        const [errorIndex, setErrorIndex] = useState<number>(0)
        const [changedAllData, setChangedAllData] = useState<Array<any> | null>(
            [],
        )

        const containerNode: any = useRef()

        const containerTable: any = useRef()

        const tableRef: any = useRef()

        useEffect(() => {
            containerTable.current = tableRef.current.querySelector(
                '.any-fabric-ant-table-body',
            )
        }, [tableRef])

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
                (currentSelectedData) => currentSelectedData.uniqueId,
            ),
        }

        // 所有错误数据
        const [errorInfos, setErrorInfos] = useState<Array<any>>([])

        const [searchSubmit, setSearchSubmit, getSearchSubmit] =
            useGetState<boolean>(false)

        const [tagOptions, setTagOptions] = useState<any>([])

        const generateTagItem = (dataArr: any[]) => {
            return dataArr.map((item) => {
                if (item.node_type === DataGradeLabelType.Node) {
                    return {
                        ...item,
                        label: (
                            <>
                                <FontIcon
                                    name="icon-biaoqianicon"
                                    style={{ color: item.icon, marginRight: 4 }}
                                />
                                <span title={item.name}>{item.name}</span>
                            </>
                        ),
                        value: item.id,
                    }
                }
                if (item.node_type === DataGradeLabelType.Group) {
                    return {
                        ...item,
                        label: item.name,
                        value: item.id,
                        children:
                            item.children?.length > 0
                                ? generateTagItem(item.children)
                                : [
                                      {
                                          label: <div>{__('暂无数据')}</div>,
                                          value: '',
                                          disabled: true,
                                      },
                                  ],
                    }
                }

                return item
            })
        }

        useEffect(() => {
            setTagOptions(generateTagItem([...tagData]))
        }, [tagData])

        useEffect(() => {
            setTableLoading(true)
            // 生成带有path的数据
            generateFullPathData(tagData, [])
            setOriginData(tagData)
            setEditFieldsData(
                fields.map((currentField) => ({
                    ...currentField,
                    formulate_basis: currentField.formulate_basis || undefined,
                    // 回显分类分级数据 需要数组格式  （保存时回复字符串格式）
                    label_id: findNodeById(tagData, currentField.label_id)
                        ?.path,
                })),
            )

            setCreateFieldUnique(getUniqueCount(fields))
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
            if (configModel || searchFieldsData?.length) {
                return
            }
            updateFormData()
        }, [editFieldsData])

        useEffect(() => {
            if (changedAllData && changedAllData.length) {
                setEditFieldsData(changedAllData)
            }
        }, [changedAllData])

        useEffect(() => {
            if (searchFieldsData) {
                // 更新全部数据
                const primaryKey = searchFieldsData.find(
                    (item) => item.is_primary_key,
                )
                // 搜索数据中有主键，则将全部数据中的非搜索数据中有主键的清除
                if (primaryKey) {
                    setEditFieldsData(
                        editFieldsData.map((item) => {
                            const searchItem = searchFieldsData.find(
                                (f) => f.uniqueId === item.uniqueId,
                            )
                            if (searchItem) {
                                return searchItem
                            }
                            if (item.is_primary_key) {
                                return {
                                    ...item,
                                    is_primary_key: 0,
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

        useEffect(() => {
            if (dataEnumOptions) {
                // 整行编辑模式
                const columnsR = getEditTableColumns({
                    dataEnumOptions,
                    getAllFieldsData: () => {
                        const currentDisplayData = form.getFieldValue('fields')
                        // 当前表格数据+全部数据组成最新的所右数据
                        return editFieldsData.map((currenField) => {
                            const foundField = currentDisplayData?.find(
                                (searchField) =>
                                    searchField.uniqueId ===
                                    currenField.uniqueId,
                            )
                            return foundField || currenField
                        })
                    },
                    taskId,
                    formInfo,
                    form,
                    standardRuleDetail,
                    onOptionData: handleOptionData,
                    parentNode: containerNode?.current,
                    tagOptions,
                    departmentId: initDepartmentId,
                }).filter(
                    (currentColumn) =>
                        !(
                            currentColumn.key === 'action' &&
                            formType === NewFormType.DSIMPORT
                        ),
                )
                setColumns(columnsR)
                // setColumns(
                //     isStart
                //         ? columnsR
                //         : columnsR.filter((c) => c.key !== 'label_id'),
                // )
                // 多选编辑模式
                const columnsM = getEditTableColumns({
                    dataEnumOptions,
                    getAllFieldsData: () => editFieldsData,
                    taskId,
                    formInfo,
                    form,
                    standardRuleDetail,
                    isConfigModel: true,
                    parentNode: containerNode?.current,
                    tagOptions,
                    departmentId: initDepartmentId,
                }).filter((currentColumn) => currentColumn.key !== 'action')
                setConfigColumns(columnsM)
                // setConfigColumns(
                //     isStart
                //         ? columnsM
                //         : columnsM.filter((c) => c.key !== 'label_id'),
                // )
            }
        }, [dataEnumOptions, tagOptions, isStart, initDepartmentId])

        useEffect(() => {
            // 根据中文名或者英文匹配，统一转为小写比较
            const currentDisplayData = form.getFieldValue('fields')
            // 当前表格数据+全部数据组成最新的所右数据
            const newAllData = editFieldsData.map((currenField) => {
                const foundField = currentDisplayData?.find(
                    (searchField) =>
                        searchField.uniqueId === currenField.uniqueId,
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

        const onSortEnd = ({ oldIndex, newIndex }) => {
            const dataSource = form.getFieldValue('fields')

            if (oldIndex !== newIndex) {
                const newData = arrayMoveImmutable(
                    dataSource.slice(),
                    oldIndex,
                    newIndex,
                ).filter((el: any) => !!el)
                form.setFieldValue('fields', newData)
            }
        }

        useImperativeHandle(ref, () => ({
            onSave: async () => {
                try {
                    if (getSearchKey() || getFilterKey()) {
                        setSearchKey('')
                        setFilterKey('')
                        setSearchSubmit(true)
                    } else {
                        // await form.validateFields()

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
                        ?.find(
                            (searchField) =>
                                searchField.uniqueId === currenField.uniqueId,
                        )
                    return foundField || currenField
                })
            },

            validateFields: () => {
                return form.validateFields()
            },
        }))

        const handleFinish = (values) => {
            onSave(values.fields)
        }

        /**
         * 更新字段数据
         */
        const updateFormData = async () => {
            if (changedAllData) {
                setChangedAllData(null)
            } else {
                await form.setFieldValue('fields', editFieldsData)
            }

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
         * 表格操作
         * @param {key} 操作类型
         * @param {data} 操作的当前行数据
         * @param {index} 操作的数据下表
         */
        const handleOptionData = (
            key: OptionType | string,
            outIndex?: number,
        ) => {
            const formFields: Array<any> = form.getFieldValue('fields') || []
            switch (key) {
                case OptionType.Unbind: {
                    // 解绑单条数据
                    const newFields = formFields?.map((currentData, index) =>
                        outIndex === index
                            ? {
                                  ...currentData,
                                  ref_id: '',
                              }
                            : currentData,
                    )
                    setEditFieldsData(newFields)
                    if (selectedFields?.length) {
                        const newSelectedFields = selectedFields?.map(
                            (currentData, index) => {
                                const existData = newFields.find(
                                    (newField) =>
                                        newField.uniqueId ===
                                        currentData.uniqueId,
                                )
                                return existData
                            },
                        )
                        setSelectedFields(newSelectedFields)
                    }
                    break
                }
                case OptionType.DELETE: {
                    // 删除单条数据

                    confirm({
                        title: `${__(`确认要删除字段吗？`)}`,
                        icon: (
                            <ExclamationCircleFilled
                                style={{ color: 'rgb(250 173 20)' }}
                            />
                        ),
                        width: 480,
                        content: (
                            <div className={styles.deleteInfo}>
                                {__(
                                    '字段及其字段信息被删除后无法找回，请谨慎操作！',
                                )}
                            </div>
                        ),
                        onOk() {
                            const newFields = formFields?.filter(
                                (currentData, index) => outIndex !== index,
                            )
                            setEditFieldsData(newFields)
                            if (selectedFields?.length) {
                                const newSelectedFields =
                                    selectedFields?.filter(
                                        (currentData, index) => {
                                            const existData = newFields.find(
                                                (newField) =>
                                                    newField.uniqueId ===
                                                    currentData.uniqueId,
                                            )
                                            return !!existData
                                        },
                                    )
                                setSelectedFields(newSelectedFields)
                            }
                        },
                        onCancel() {},
                        okText: __('确定'),
                        cancelText: __('取消'),
                    })

                    break
                }
                case OptionType.BatchUnbind: {
                    const newFields = formFields?.map((currentData, index) =>
                        selectedFields.find(
                            (selectedField) =>
                                selectedField.uniqueId === currentData.uniqueId,
                        )
                            ? {
                                  ...currentData,
                                  ref_id: '',
                              }
                            : currentData,
                    )
                    setEditFieldsData(newFields)
                    setSelectedFields([])
                    // 解绑选中数据
                    break
                }
                case OptionType.BatchDelete: {
                    // 删除选中数据
                    confirm({
                        title: `${__(`确认要删除字段吗？`)}`,
                        icon: (
                            <ExclamationCircleFilled
                                style={{ color: 'rgb(250 173 20)' }}
                            />
                        ),
                        width: 480,
                        content: __('删除后不可恢复！'),
                        onOk() {
                            const newFields = formFields?.filter(
                                (currentData, index) =>
                                    !selectedFields.find(
                                        (selectedField) =>
                                            selectedField.uniqueId ===
                                            currentData.uniqueId,
                                    ),
                            )
                            setEditFieldsData(newFields)
                            setSelectedFields([])
                        },
                        onCancel() {},
                        okText: __('确定'),
                        cancelText: __('取消'),
                    })

                    break
                }
                default:
                    break
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
                        // 若修改的是影响标准化的字段，更改标准化状态
                        standard_status: StandardKeys.includes(currentKey)
                            ? ''
                            : itemData.standard_status,
                        standard_id: StandardKeys.includes(currentKey)
                            ? ''
                            : itemData.standard_id,
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
                                              standard_id: '',
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
                                              standard_id: '',
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
                                (currentValue, innerIndex) => {
                                    if (index === innerIndex) {
                                        const newItemData = {
                                            ...editFieldsData[index],
                                            ...values.fields[index],
                                            ...changedValue,
                                            standard_status: '',
                                            ...newDataTypeData,
                                            standard_id: '',
                                            value_range:
                                                itemKey === 'value_range_type'
                                                    ? null
                                                    : values.fields[index]
                                                          .value_range,
                                        }
                                        form.setFieldValue(
                                            ['fields', index],
                                            newItemData,
                                        )
                                        return newItemData
                                    }
                                    return currentValue
                                },
                            )
                            setChangedAllData(newValues)
                        }
                    })
                }
            }
            setTimeout(() => {
                const allErrors = form
                    .getFieldsError()
                    .filter((currentError) => currentError.errors.length)
                // setErrorInfos(allErrors)
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
            // field.name数据格式 : ['fields', 0, 'is_primary_key']
            const field = changedFields[0]
            const changeIndex = field.name[1]
            const allData = form.getFieldValue('fields')
            const currentData = allData[changeIndex]
            if (field.name.includes('is_primary_key') && field.value === 1) {
                const primaryKeyIndex = editFieldsData.findIndex(
                    (item) => item.is_primary_key,
                )
                // 如果存在其他字段是主键
                if (primaryKeyIndex > -1) {
                    confirm({
                        title: __('确认要替换吗？'),
                        icon: (
                            <InfoCircleFilled
                                style={{ color: 'rgba(250, 173, 20, 1)' }}
                            />
                        ),
                        content: __(
                            '字段「${name1}」已被设置为主键，是否替换？',
                            {
                                name1:
                                    editFieldsData[primaryKeyIndex].name ||
                                    __('未命名字段'),
                            },
                        ),
                        onOk: () => {
                            if (configModel) {
                                // 配置模式
                                const primaryKeyIndexConfigModel =
                                    configModelData.findIndex(
                                        (item) => item.is_primary_key,
                                    )

                                setConfigModelData(
                                    configModelData.map((item, index) => {
                                        if (
                                            index === primaryKeyIndexConfigModel
                                        ) {
                                            return {
                                                ...item,
                                                is_primary_key: 0,
                                            }
                                        }
                                        if (index === changeIndex) {
                                            return {
                                                ...item,
                                                is_primary_key: 1,
                                                is_required: 1,
                                            }
                                        }
                                        return item
                                    }),
                                )
                            } else if (searchFieldsData?.length) {
                                // 搜索模式
                                const primaryKeyIndexSearchModel =
                                    searchFieldsData.findIndex(
                                        (item) => item.is_primary_key,
                                    )
                                setSearchFieldsData(
                                    searchFieldsData.map((item, index) => {
                                        if (
                                            index === primaryKeyIndexSearchModel
                                        ) {
                                            return {
                                                ...item,
                                                is_primary_key: 0,
                                            }
                                        }
                                        if (index === changeIndex) {
                                            return {
                                                ...item,
                                                is_primary_key: 1,
                                                is_required: 1,
                                            }
                                        }
                                        return item
                                    }),
                                )
                            } else {
                                // 普通模式
                                setEditFieldsData(
                                    editFieldsData.map((item, index) => {
                                        if (index === changeIndex) {
                                            return {
                                                ...item,
                                                is_primary_key: 1,
                                                is_required: 1,
                                            }
                                        }
                                        if (index === primaryKeyIndex) {
                                            return {
                                                ...item,
                                                is_primary_key: 0,
                                            }
                                        }
                                        return item
                                    }),
                                )
                            }
                        },
                        onCancel: () => {
                            form.setFieldValue(field.name, 0)
                        },

                        okText: __('确定'),
                        cancelText: __('取消'),
                    })
                } else if (configModel) {
                    setConfigModelData(
                        configModelData.map((item, index) => {
                            if (changeIndex === index) {
                                return {
                                    ...item,
                                    is_primary_key: 1,
                                    is_required: 1,
                                }
                            }
                            return {
                                ...item,
                                is_primary_key: 0,
                            }
                        }),
                    )
                } else if (searchFieldsData?.length) {
                    setEditFieldsData(
                        editFieldsData.map((item, index) => {
                            if (item.uniqueId === currentData.uniqueId) {
                                return {
                                    ...item,
                                    is_primary_key: 1,
                                    is_required: 1,
                                }
                            }
                            return {
                                ...item,
                                is_primary_key: 0,
                            }
                        }),
                    )
                    setSearchFieldsData(
                        searchFieldsData.map((item, index) => {
                            if (changeIndex === index) {
                                return {
                                    ...item,
                                    is_primary_key: 1,
                                    is_required: 1,
                                }
                            }
                            return {
                                ...item,
                                is_primary_key: 0,
                            }
                        }),
                    )
                } else {
                    setEditFieldsData(
                        editFieldsData.map((item, index) => {
                            if (changeIndex === index) {
                                return {
                                    ...item,
                                    is_primary_key: 1,
                                    is_required: 1,
                                }
                            }
                            return {
                                ...item,
                                is_primary_key: 0,
                            }
                        }),
                    )
                }
            } else if (
                field.name.includes('is_primary_key') &&
                field.value === 0 &&
                !configModel
            ) {
                setEditFieldsData(
                    editFieldsData.map((item) => {
                        if (item.uniqueId === currentData.uniqueId) {
                            return {
                                ...item,
                                is_primary_key: 0,
                            }
                        }
                        return item
                    }),
                )
            }
        }

        return (
            <div className={styles.editFormTableWrapper} ref={containerNode}>
                {configModel ? (
                    <div className={styles.editTableTool}>
                        <Space size={12}>
                            <Button
                                disabled={!selectedFields.length}
                                onClick={() => {
                                    setConfigModel(false)
                                    const newConfigData =
                                        form.getFieldValue('fields')
                                    const primaryKey = newConfigData.find(
                                        (item) => item.is_primary_key,
                                    )
                                    const newDatas = editFieldsData.map(
                                        (editField) => {
                                            const foundEditedData =
                                                newConfigData.find(
                                                    (newEditedField) =>
                                                        newEditedField.uniqueId ===
                                                        editField.uniqueId,
                                                )
                                            updateSaveBtn(false)
                                            if (foundEditedData) {
                                                return {
                                                    ...editField,
                                                    ...foundEditedData,
                                                }
                                            }
                                            // 配置模式下有主键，需要将普通模式下的其他主键清除
                                            if (
                                                primaryKey &&
                                                editField.is_primary_key
                                            ) {
                                                return {
                                                    ...editField,
                                                    is_primary_key: 0,
                                                }
                                            }
                                            return editField
                                        },
                                    )
                                    setEditFieldsData(newDatas)
                                    setConfigModelData(newDatas)
                                    message.success(__('属性配置成功'))
                                    setSelectedFields([])
                                }}
                            >
                                {__('完成配置属性')}
                            </Button>
                            <Button
                                disabled={!selectedFields.length}
                                onClick={() => {
                                    setConfigModel(false)
                                    setConfigModelData(editFieldsData)
                                    updateSaveBtn(false)
                                    setSelectedFields([])
                                }}
                            >
                                {__('取消')}
                            </Button>
                        </Space>
                    </div>
                ) : (
                    <div className={styles.editTableTool}>
                        <Space size={8}>
                            {formType === NewFormType.BLANK ? (
                                <Button
                                    type="primary"
                                    onClick={() => {
                                        const newField = {
                                            ...newFieldTemplate,
                                            uniqueId: createFieldUnique,
                                        }
                                        setIsAdd(true)
                                        setCreateFieldUnique(
                                            createFieldUnique + 1,
                                        )
                                        if (searchFieldsData) {
                                            setSearchFieldsData(null)
                                            setEditFieldsData([
                                                ...editFieldsData,
                                                newField,
                                            ])
                                            setFilterKey('')
                                            setSearchKey('')
                                        } else {
                                            setEditFieldsData([
                                                ...form.getFieldValue('fields'),
                                                newField,
                                            ])
                                        }
                                    }}
                                >
                                    {__('添加字段')}
                                </Button>
                            ) : null}
                            <Tooltip
                                title={
                                    !selectedFields.length ||
                                    isIncludeRefData === selectedFields.length
                                        ? __('请先勾选非引用字段')
                                        : ''
                                }
                            >
                                <div>
                                    <Button
                                        disabled={
                                            !selectedFields.length ||
                                            isIncludeRefData ===
                                                selectedFields.length
                                        }
                                        onClick={() => {
                                            if (isIncludeRefData) {
                                                confirm({
                                                    title: `${__(`配置属性`)}`,
                                                    icon: (
                                                        <ExclamationCircleFilled
                                                            style={{
                                                                color: '#126ee3',
                                                            }}
                                                        />
                                                    ),
                                                    content: __(
                                                        '引用状态的字段无法批量设置属性，点击确定后，自动取消选择引用字段，并进入批量配置属性模式',
                                                    ),
                                                    onOk() {
                                                        const newConfigData =
                                                            form.getFieldValue(
                                                                'fields',
                                                            )

                                                        setEditFieldsData(
                                                            newConfigData,
                                                        )

                                                        setConfigModel(true)
                                                        const newSelectedData =
                                                            selectedFields.filter(
                                                                (
                                                                    selectedField,
                                                                ) =>
                                                                    !selectedField.ref_id,
                                                            )
                                                        setSelectedFields(
                                                            newSelectedData,
                                                        )
                                                        setConfigModelData(
                                                            newSelectedData.map(
                                                                (
                                                                    selectedField,
                                                                ) => {
                                                                    const findedFiled =
                                                                        newConfigData.find(
                                                                            (
                                                                                currentField,
                                                                            ) =>
                                                                                currentField.uniqueId ===
                                                                                selectedField.uniqueId,
                                                                        )

                                                                    return findedFiled
                                                                        ? {
                                                                              ...selectedField,
                                                                              ...findedFiled,
                                                                          }
                                                                        : selectedField
                                                                },
                                                            ),
                                                        )
                                                        updateSaveBtn(true)
                                                        Object.keys(
                                                            needBatchField,
                                                        ).forEach(
                                                            (batchField) => {
                                                                const batchValue =
                                                                    getBatchValuesStatus(
                                                                        selectedFields,
                                                                        batchField,
                                                                    )
                                                                form.setFieldValue(
                                                                    batchField,
                                                                    {
                                                                        value: batchValue.value,
                                                                        status: batchValue.status,
                                                                    },
                                                                )
                                                            },
                                                        )
                                                    },
                                                    onCancel() {},
                                                    okText: __('确定'),
                                                    cancelText: __('取消'),
                                                })
                                            } else {
                                                const newConfigData =
                                                    form.getFieldValue('fields')

                                                setConfigModel(true)
                                                setConfigModelData(
                                                    selectedFields.map(
                                                        (selectedField) => {
                                                            const findedFiled =
                                                                newConfigData.find(
                                                                    (
                                                                        currentField,
                                                                    ) =>
                                                                        currentField.uniqueId ===
                                                                        selectedField.uniqueId,
                                                                )

                                                            return findedFiled
                                                                ? {
                                                                      ...selectedField,
                                                                      ...findedFiled,
                                                                  }
                                                                : selectedField
                                                        },
                                                    ),
                                                )
                                                updateSaveBtn(true)
                                                Object.keys(
                                                    needBatchField,
                                                ).forEach((batchField) => {
                                                    const batchValue =
                                                        getBatchValuesStatus(
                                                            selectedFields,
                                                            batchField,
                                                        )

                                                    form.setFieldValue(
                                                        batchField,
                                                        {
                                                            value: batchValue.value,
                                                            status: batchValue.status,
                                                        },
                                                    )
                                                })
                                            }
                                        }}
                                    >
                                        {__('配置属性')}
                                    </Button>
                                </div>
                            </Tooltip>

                            {formType === NewFormType.BLANK ? (
                                <Tooltip
                                    title={
                                        !selectedFields.length
                                            ? __('请先勾选字段')
                                            : __('更多')
                                    }
                                >
                                    <div>
                                        <Dropdown
                                            menu={{
                                                items: moreDropDown?.map(
                                                    (options) => {
                                                        if (
                                                            !isIncludeRefData &&
                                                            options?.key ===
                                                                OptionType.BatchUnbind
                                                        ) {
                                                            return {
                                                                ...options,
                                                                label: (
                                                                    <Tooltip
                                                                        title={__(
                                                                            '请先勾选引用字段',
                                                                        )}
                                                                    >
                                                                        {__(
                                                                            '解绑',
                                                                        )}
                                                                    </Tooltip>
                                                                ),
                                                                disabled: true,
                                                            }
                                                        }
                                                        return options
                                                    },
                                                ),
                                                onClick: ({ key }) => {
                                                    handleOptionData(
                                                        key as OptionType,
                                                    )
                                                },
                                            }}
                                            disabled={!selectedFields.length}
                                        >
                                            <Button
                                                icon={
                                                    <MoreHorizontalOutlined />
                                                }
                                            />
                                        </Dropdown>
                                    </div>
                                </Tooltip>
                            ) : null}
                            {errorInfos?.length ? (
                                <div className={styles.errorTips}>
                                    <span>
                                        {__('${count}个字段信息不完善', {
                                            count: errorInfos.length,
                                        })}
                                    </span>

                                    <div>
                                        <span className={styles.errorBar}>
                                            {`${errorIndex + 1}/${
                                                errorInfos.length
                                            }`}
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
                                                        setErrorIndex(
                                                            errorIndex - 1,
                                                        )
                                                    }
                                                }}
                                            />
                                        </Tooltip>
                                        <Tooltip title={__('下一个')}>
                                            <Button
                                                type="text"
                                                disabled={
                                                    errorIndex ===
                                                    errorInfos.length - 1
                                                }
                                                icon={<DownOutlined />}
                                                onClick={() => {
                                                    if (
                                                        errorIndex <
                                                        errorInfos.length
                                                    ) {
                                                        scollerToErrorElement(
                                                            errorInfos[
                                                                errorIndex + 1
                                                            ].name.join('-'),
                                                        )
                                                        setErrorIndex(
                                                            errorIndex + 1,
                                                        )
                                                    }
                                                }}
                                            />
                                        </Tooltip>
                                    </div>
                                </div>
                            ) : null}
                        </Space>
                        <Space size={12}>
                            <SearchInput
                                value={searchKey}
                                placeholder={__('搜索字段中文名称、英文名称')}
                                className={styles.searchField}
                                onKeyChange={(kw: string) => {
                                    setSearchKey(kw)
                                }}
                            />
                            {formType === NewFormType.BLANK ? (
                                <LightweightSearch
                                    formData={FilterItem}
                                    onChange={(data, key) => {
                                        setFilterKey((key && data?.[key]) || '')
                                    }}
                                    defaultValue={{ refStatus: '' }}
                                />
                            ) : null}
                        </Space>
                    </div>
                )}
                <div className={styles.tableContiner}>
                    <Form
                        form={form}
                        name="edit"
                        onValuesChange={debounce(handleValuesChange, 500)}
                        onFieldsChange={onFieldsChange}
                        onFinish={handleFinish}
                        scrollToFirstError
                    >
                        <Form.Item valuePropName="dataSource" name="fields">
                            {configModel ? (
                                <Table
                                    columns={configColumns}
                                    scroll={{
                                        x: 1950,
                                        y: `calc(100vh - 400px)`,
                                    }}
                                    sticky
                                    loading={tableLoading}
                                    locale={{
                                        emptyText: configModelData?.length ? (
                                            <Empty
                                                desc={__('暂无数据')}
                                                iconSrc={dataEmpty}
                                            />
                                        ) : (
                                            <Empty />
                                        ),
                                    }}
                                    pagination={false}
                                    ref={tableRef}
                                />
                            ) : (
                                <Table
                                    columns={[
                                        {
                                            dataIndex: 'drag',
                                            width: 50,
                                            key: 'drag',
                                            fixed: 'left',
                                            title: (
                                                <div
                                                    style={{
                                                        transform:
                                                            'rotate(-90deg)',
                                                    }}
                                                >
                                                    <SwapOutlined />
                                                </div>
                                            ),
                                            className: 'drag-visible',
                                            render: () => <DragHandle />,
                                        },
                                        ...columns,
                                    ]}
                                    scroll={{
                                        x: 1950,
                                        y: `calc(100vh - 400px)`,
                                    }}
                                    sticky
                                    rowKey="uniqueId"
                                    rowSelection={rowSelection}
                                    loading={tableLoading}
                                    locale={{
                                        emptyText:
                                            editFieldsData?.length === 0 ? (
                                                <Empty
                                                    desc={__('暂无数据')}
                                                    iconSrc={dataEmpty}
                                                />
                                            ) : (
                                                <Empty />
                                            ),
                                    }}
                                    components={{
                                        body: {
                                            wrapper: (props) =>
                                                DraggableContainer({
                                                    onSortEnd,
                                                    props,
                                                }),
                                            row: (props) => {
                                                return DraggableBodyRow({
                                                    dataSource:
                                                        form.getFieldValue(
                                                            'fields',
                                                        ),
                                                    ...props,
                                                })
                                            },
                                        },
                                    }}
                                    pagination={false}
                                    ref={tableRef}
                                />
                            )}
                        </Form.Item>

                        {configModel ||
                        formType === NewFormType.DSIMPORT ? null : (
                            <Button
                                onClick={() => {
                                    const newField = {
                                        ...newFieldTemplate,
                                        uniqueId: createFieldUnique,
                                    }
                                    setIsAdd(true)

                                    setCreateFieldUnique(createFieldUnique + 1)
                                    if (searchFieldsData) {
                                        setSearchFieldsData(null)
                                        setEditFieldsData([
                                            ...editFieldsData,
                                            newField,
                                        ])
                                        setFilterKey('')
                                        setSearchKey('')
                                    } else {
                                        setEditFieldsData([
                                            ...form.getFieldValue('fields'),
                                            newField,
                                        ])
                                    }
                                }}
                                type="dashed"
                                icon={<AddOutlined />}
                                className={styles.addBtn}
                            >
                                {__('添加字段')}
                            </Button>
                        )}
                    </Form>
                </div>
            </div>
        )
    },
)

export default EditFieldsTable
