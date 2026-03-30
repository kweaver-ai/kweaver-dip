import React, {
    FC,
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'
import {
    Table,
    Pagination,
    Space,
    Button,
    Dropdown,
    Form,
    Modal,
    message,
    Tooltip,
} from 'antd'

import { TableRowSelection } from 'antd/lib/table/interface'
import { debounce, isEmpty, isEqual, noop, trim } from 'lodash'
import { useDebounce, useGetState, useUpdateEffect } from 'ahooks'
import {
    DownOutlined,
    ExclamationCircleFilled,
    InfoCircleFilled,
    MenuOutlined,
    UpOutlined,
} from '@ant-design/icons'
import { arrayMoveImmutable } from 'array-move'
import {
    SortEnd,
    SortableContainer,
    SortableContainerProps,
    SortableElement,
    SortableHandle,
} from 'react-sortable-hoc'
import {
    DataGradeLabelType,
    IFormEnumConfigModel,
    IGradeLabel,
    formatError,
    formsEnumConfig,
    getFormsFieldsList,
    queryInfoResCatlgColumns,
} from '@/core'
import dataEmpty from '@/assets/dataEmpty.svg'
import Empty from '@/ui/Empty'
import __ from './locale'
import { LightweightSearch, SearchInput } from '@/ui'
import styles from './styles.module.less'
import { AddOutlined, FontIcon, ObjL3Outlined } from '@/icons'
import MoreHorizontalOutlined from '@/icons/MoreHorizontalOutlined'
import {
    generateFullPathData,
    findNodeById,
    newFieldTemplate,
} from '@/components/FormGraph/helper'
import { NewFormType } from '@/components/Forms/const'
import {
    StandardDataDetail,
    RefStatus,
    getUniqueCount,
    getBatchValuesStatus,
    moreDropDown,
    FilterItem,
    OptionType,
} from '@/components/FormTableMode/const'
import { ShareTypeEnum, StandardKeys } from '../const'
import {
    fieldRadioValueList,
    filterSingleData,
    getEditTableColumns,
    scollerToErrorElement,
    needBatchField,
    businFormToInfoCatlgDataType,
    InfoCatlgItemDataType,
} from './helper'
import { keyboardReg, ErrorInfo, useQuery } from '@/utils'
import { IconType } from '@/icons/const'
import FieldTableView from '@/components/FormGraph/FieldTableView'

const SortableItem = SortableElement(
    (props: React.HTMLAttributes<HTMLTableRowElement>) => <tr {...props} />,
)
const SortableBody = SortableContainer(
    (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
        <tbody {...props} />
    ),
)
const DragHandle = SortableHandle(() => (
    <MenuOutlined style={{ cursor: 'grab', color: '#999' }} />
))
const DraggableBodyRow: React.FC<any> = ({
    dataSource,
    className,
    style,
    onClick,
    ...restProps
}) => {
    const index = dataSource?.findIndex((x, dataIndex) => {
        return dataIndex === restProps['data-row-key']
    })
    return <SortableItem index={index} {...restProps} />
}

interface IEditFieldsTable {
    ref: any
    fieldData: Array<any>
    originFields?: Array<any>
    // 标准规则详情Map
    standardRuleDetail: StandardDataDetail
    bizForm?: any
    saveDisabled?: boolean
    loading?: boolean

    // 完成配置保存数据
    updateSaveBtn?: (status: boolean) => void

    onSave: (values: any) => void
    // 修改字段顺序
    onChange?: (value) => void
}

const EditFieldsTable: FC<IEditFieldsTable> = forwardRef(
    (
        {
            fieldData,
            originFields,
            loading = false,
            bizForm,
            standardRuleDetail,
            saveDisabled = false,
            updateSaveBtn = noop,
            onSave,
            onChange = noop,
        }: Omit<IEditFieldsTable, 'ref'>,
        ref,
    ) => {
        const query = useQuery()

        const catlgId = query.get('id') || ''

        // 字段信息
        const [fields, setFields] = useState<Array<any>>([])
        const [totalCount, setTotalCount] = useState(0)
        const [searchCondtion, setSearchCondition] = useState<any>({
            offset: 1,
            limit: 10,
            keyword: '',
        })
        // 字段信息的相关的后端枚举映射
        const [dataEnumOptions, setDataEnumOptions] =
            useState<IFormEnumConfigModel | null>(null)

        const [originData, setOriginData] = useState<any[]>([])
        // 编辑的全部数据
        const [editFieldsData, setEditFieldsData] = useState<Array<any>>([])
        const editFieldsDataDebounce = useDebounce(editFieldsData, {
            wait: 300,
        })

        // 搜索的数据
        const [searchFieldsData, setSearchFieldsData] =
            useState<Array<any> | null>()
        // 表头数据
        const [columns, setColumns] = useState<Array<any>>([])
        // 搜索条件
        const [searchKey, setSearchKey, getSearchKey] = useGetState<string>('')

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
        const [tableLoading, setTableLoading] = useState<boolean>(false)
        const [preFormVisible, setPreFormVisible] = useState<boolean>(false)

        const [errorIndex, setErrorIndex] = useState<number>(0)

        const containerNode: any = useRef()

        const containerTable: any = useRef()

        const tableRef: any = useRef()

        const [tableDataFilter, setTableDataFilter] = useState<any[]>([])
        // 所有错误数据
        const [errorInfos, setErrorInfos] = useState<Array<any>>([])

        const validateRule = {
            business_name: {
                pattern: keyboardReg,
                message: ErrorInfo.EXCEPTEMOJI,
            },
            technical_name: {
                pattern: keyboardReg,
                message: __('输入不能为空'),
            },
            data_type: {
                nullMsg: __('请选择数据类型'),
            },
            data_length: {
                [InfoCatlgItemDataType.Decimal]: {
                    max: 38,
                    message: __('仅支持 0~38 之间的整数'),
                },
                [InfoCatlgItemDataType.Char]: {
                    max: 65535,
                    message: __('仅支持 0~65535 之间的整数'),
                },
            },
            // data_accuracy: {
            //     max: 30,
            //     message: __('仅支持 0~30 之间的整数'),
            // },
            shared_type: {
                nullMsg: __('请选择共享属性'),
            },
            shared_condition: {
                nullMsg: __('请输入共享条件'),
                pattern: keyboardReg,
                message: ErrorInfo.EXCEPTEMOJI,
            },
            open_type: {
                nullMsg: __('请选择开放属性'),
            },
            // open_condition: {
            //     nullMsg: __('请输入开放条件'),
            //     pattern: keyboardReg,
            //     message: ErrorInfo.EXCEPTEMOJI,
            // },
            sensitive_flag: {
                nullMsg: __('请选择敏感属性'),
            },
            classified_flag: {
                nullMsg: __('请选择涉密属性'),
            },
        }

        useEffect(() => {
            if (!isEqual(fields, fieldData)) {
                setFields(fieldData)
            }
        }, [fieldData])

        const setErrorText = (key: string, val: any, record?: any) => {
            const isNumber =
                record?.data_type === 0 || record?.data_type === 'number'
            const isChar =
                record?.data_type === 1 || record?.data_type === 'char'

            if (
                !val &&
                val !== 0 &&
                key !== 'data_accuracy' &&
                key !== 'data_length'
            ) {
                return validateRule?.[key]?.nullMsg || __('输入不能为空')
            }
            if (
                key === 'technical_name' &&
                editFieldsData
                    ?.map((item) => item.technical_name)
                    ?.includes(val)
            ) {
                return __('技术名称不能重复')
            }
            if (
                validateRule?.[key]?.pattern &&
                !validateRule?.[key]?.pattern?.test(val)
            ) {
                return validateRule?.[key]?.message
            }
            if (key === 'data_length') {
                if (!val && val !== 0 && (isChar || isNumber))
                    return __('输入不能为空')
                if (
                    isNumber &&
                    Number(val) >
                        validateRule?.[key]?.[InfoCatlgItemDataType.Digit]?.max
                ) {
                    return validateRule?.[key]?.[InfoCatlgItemDataType.Digit]
                        ?.message
                }
                if (
                    isChar &&
                    Number(val) >
                        validateRule?.[key]?.[InfoCatlgItemDataType.Char]?.max
                ) {
                    return validateRule?.[key]?.[InfoCatlgItemDataType.Char]
                        ?.message
                }
            }
            if (key === 'data_accuracy') {
                if (isNumber) {
                    if (!val && val !== 0) return __('输入不能为空')
                    if (val > validateRule?.[key]?.max)
                        return validateRule?.[key]?.message
                }
            }
            return ''
        }

        const getErrInfo = (list: any[]) => {
            const sumArr =
                list?.map((item) => {
                    return Object.values(item?.errorTips || {})?.filter(
                        (it) => it,
                    )?.length
                }) || []
            const primarySum = 0
            // 是否时间戳、是否主键校验
            // if (primaryRequired) {
            //     primarySum +=
            //         list.filter((item) => item.primary_flag)?.length > 0 ? 0 : 1
            //     primarySum +=
            //         list.filter((item) => item.timestamp_flag)?.length > 0
            //             ? 0
            //             : 1
            // }
            const total = sumArr.reduce((pre, cur) => pre + cur, 0) + primarySum
            // 数据资源目录setErrorInfos处理为数字
            // setErrorInfos(total)
            return total
        }

        const onValidate = () => {
            const requiredKeys = Object.keys(validateRule)
            const list = editFieldsData.map((item) => {
                const filterKeys: string[] = []
                const info = {
                    ...item,
                    // isSelectedFlag: selectedFields
                    //     ?.map((row) => row.id)
                    //     ?.includes(item.id),
                }
                if (
                    !item.shared_type ||
                    item.shared_type === ShareTypeEnum.UNCONDITION
                ) {
                    filterKeys.push('shared_condition')
                }
                // if (!item.open_type || item.open_type === OpenTypeEnum.NOOPEN) {
                //     filterKeys.push('open_condition')
                // }
                let errorTips = {}
                requiredKeys
                    ?.filter((it) => !filterKeys.includes(it))
                    .forEach((it) => {
                        errorTips = {
                            ...errorTips,
                            [it]: info.isSelectedFlag
                                ? setErrorText(it, item[it], item)
                                : '',
                        }
                    })
                const noErr = isEmpty(errorTips)
                return noErr
                    ? info
                    : {
                          ...info,
                          errorTips,
                      }
            })
            onChange?.(list)
            return {
                validateStatus: getErrInfo(list) === 0,
                list,
            }
        }

        useEffect(() => {
            containerTable.current = tableRef.current.querySelector(
                '.any-fabric-ant-table-body',
            )
        }, [tableRef])

        const selectedRowIds = useMemo(() => {
            const ids = selectedFields.map((_item) => _item.id)
            return ids
        }, [selectedFields])

        const rowSelection: TableRowSelection<any> = {
            type: 'checkbox',
            fixed: true,
            onSelect: (record, selected, selectedRows) => {
                // 单选更新选中项
                setSelectedFields(selectedRows)
                // 始终传递完整的数据，不传递不完整的选中数据
                // onChange在这里不需要调用，因为选中状态变化不应该影响数据传递
                // onChange?.(
                //     editFieldsData?.map((item) => ({
                //         ...item,
                //     })),
                // )
            },
            onSelectAll: (selected, selectedRows, changeRows) => {
                // 多选更新选中项
                setSelectedFields(selectedRows)
            },
            // selectedRowKeys: selectedFields.map(
            //     (currentSelectedData) => currentSelectedData.id,
            // ),
            selectedRowKeys: selectedRowIds,
        }

        const [searchSubmit, setSearchSubmit, getSearchSubmit] =
            useGetState<boolean>(false)

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
            // setTableLoading(true)
            // 生成带有path的数据
            // generateFullPathData(tagData || [], [])
            // setOriginData(tagData || [])
            // setSelectedFields(fields?.filter((item) => item.isSelectedFlag))
            setEditFieldsData(
                fields.map((currentField) => ({
                    ...currentField,

                    // formulate_basis: currentField.formulate_basis || undefined,
                    // 回显分类分级数据 需要数组格式  （保存时回复字符串格式）
                    // label_id:
                    //     findNodeById(tagData, currentField.label_id)?.path ||
                    //     [],
                })),
            )

            setCreateFieldUnique(getUniqueCount(fields))
        }, [fields])

        useEffect(() => {
            updateSaveBtn(!selectedFields?.length)
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
                if (tableLoading) {
                    setTimeout(() => {
                        setTableLoading(false)
                    }, 0)
                }
                return
            }
            updateFormData()
        }, [editFieldsDataDebounce])

        useEffect(() => {
            if (searchFieldsData) {
                // 更新全部数据
                // const primaryKey = searchFieldsData.find(
                //     (item) => item.is_primary_key,
                // )
                // 搜索数据中有主键，则将全部数据中的非搜索数据中有主键的清除
                // if (primaryKey) {
                //     setEditFieldsData(
                //         editFieldsData.map((item) => {
                //             const searchItem = searchFieldsData.find(
                //                 (f) => f.id === item.id,
                //             )
                //             if (searchItem) {
                //                 return searchItem
                //             }
                //             if (item.is_primary_key) {
                //                 return {
                //                     ...item,
                //                     is_primary_key: 0,
                //                 }
                //             }
                //             return item
                //         }),
                //     )
                // }
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

        const handleDelete = (it) => {
            const fieldItems = fields?.filter((o) => o.id !== it.id)
            setFields(fieldItems)
            setEditFieldsData(fieldItems)
            onChange?.(fieldItems)
        }
        useEffect(() => {
            // 整行编辑模式
            const columnsR =
                getEditTableColumns({
                    form,
                    parentNode: containerNode?.current,
                    handleDelete,
                    formName: bizForm?.name,
                }) || {}
            setColumns([
                // {
                //     dataIndex: 'drag',
                //     width: 50,
                //     key: 'drag',
                //     className: 'drag-visible',
                //     render: () => <DragHandle />,
                // },
                ...columnsR,
            ])
            // 多选编辑模式
            const columnsM = getEditTableColumns({
                form,
                isConfigModel: true,
                parentNode: containerNode?.current,
                formName: bizForm?.name,
            }).filter((currentColumn) => currentColumn.key !== 'action')
            setConfigColumns(columnsM)
            // setConfigColumns(
            //     isStart
            //         ? columnsM
            //         : columnsM.filter((c) => c.key !== 'label_id'),
            // )
        }, [fields])

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
            if (searchKey) {
                setSearchFieldsData(
                    newAllData?.filter((currentData) =>
                        filterSingleData(currentData, searchKey),
                    ) || [],
                )
                if (tableLoading) {
                    setTimeout(() => {
                        setTableLoading(false)
                    }, 0)
                }
            } else {
                if (searchFieldsData?.length) {
                    // 搜索结束合并数据到总数据中
                    setEditFieldsData(newAllData)
                }
                setSearchFieldsData(null)
            }
        }, [searchKey])

        const checkFieldNames = [
            'name',
            // 'data_refer',
            // 'code_set',
            'data_type',
            'is_sensitive',
            'is_secret',
        ]

        const validteSelRowFields = async () => {
            try {
                const ids = selectedFields?.map((item) => item.id) || []
                const selInfoItems = editFieldsData?.map((item, index) => ({
                    ...item,
                    dataIndex: index,
                    // isSelectedFlag: ids.includes(item.id),
                }))

                const namePaths: Array<any> = []
                selInfoItems?.forEach((item) => {
                    // return ['fields', item.dataIndex]
                    // if (item.isSelectedFlag) {
                    checkFieldNames.forEach((fName) => {
                        namePaths.push(['fields', item.dataIndex, fName])
                    })
                    // }
                })

                await form.validateFields(namePaths)
            } catch (e) {
                formatError(e)
            }
        }

        useImperativeHandle(ref, () => ({
            // 目录校验方法
            // onValidate,
            // 业务表使用校验方法
            onValidate: async () => {
                try {
                    // const name

                    // test-del
                    await form.validateFields([
                        ['fields', 0],
                        ['fields', 1, 'name'],
                    ])
                    // handleFinish(form.getFieldsValue())
                    // onChange?.(form.getFieldsValue())
                } catch (ex) {
                    setErrorInfos(ex.errorFields)
                    setErrorIndex(0)
                    scollerToErrorElement(ex.errorFields?.[0]?.name?.join('-'))
                }
            },
            getFields: () => {
                return editFieldsData.map((currenField) => {
                    const foundField = form
                        .getFieldValue('fields')
                        ?.find(
                            (searchField) => searchField.id === currenField.id,
                        )
                    return foundField || currenField
                })
            },
            getSelFields: () => {
                return editFieldsData?.map((item) => {
                    const { id, ...rest } = item
                    const {
                        data_refer,
                        code_set,
                        data_type,
                        data_length,
                        data_range,
                        is_sensitive,
                        is_secret,
                        is_primary_key,
                        is_incremental,
                        is_local_generated,
                        is_standardized,
                    } = rest
                    const newItem = {
                        ...rest,
                        metadata: {
                            data_type,
                            data_length,
                            data_range,
                        },
                        // 如果没有选择主键，就把选择的第一个给提示
                        is_primary_key:
                            is_primary_key === 1 ||
                            selectedFields?.length === 1,
                        is_incremental: is_incremental === 1,
                        is_local_generated: is_local_generated === 1,
                        is_standardized: is_standardized === 1,
                        // isSelectedFlag: selectedRowIds.includes(item.id),
                    }
                    if (catlgId) {
                        // 编辑，需要自带id
                        return {
                            id,
                            ...newItem,
                        }
                    }
                    return newItem
                })
            },
            getFormValues: () => {
                return form.getFieldsValue()
            },
            // validateFields: () => {
            //     return form.validateFields()
            // },
            validateFileds: async () => {
                const ids = selectedFields?.map((item) => item.id) || []

                const selInfoItems = editFieldsData?.map((item, index) => ({
                    ...item,
                    dataIndex: index,
                    // isSelectedFlag: ids.includes(item.id),
                }))

                const namePaths: Array<any> = []
                selInfoItems?.forEach((item) => {
                    // return ['fields', item.dataIndex]
                    // if (item.isSelectedFlag) {
                    checkFieldNames.forEach((fName) => {
                        namePaths.push(['fields', item.dataIndex, fName])
                    })
                    // }
                })

                let error: any

                const res = await form
                    .validateFields(namePaths)
                    .then()
                    .catch((ex) => {
                        error = ex
                        setErrorInfos(ex.errorFields)
                        setErrorIndex(0)
                        scollerToErrorElement(ex.errorFields[0].name.join('-'))
                        return error
                    })
                return res
            },
            data: form.getFieldsValue(),
            onSave: async () => {
                try {
                    await validteSelRowFields()
                } catch (ex) {
                    setErrorInfos(ex.errorFields)
                    setErrorIndex(0)
                    scollerToErrorElement(ex.errorFields[0].name.join('-'))
                }
            },
        }))

        const handleFinish = (values) => {
            onSave(
                values.fields?.map((item) => {
                    const {
                        data_refer,
                        code_set,
                        metadata,
                        is_sensitive,
                        is_secret,
                        is_primary_key,
                        is_incremental,
                        is_local_generated,
                        is_standardized,
                        is_required,
                    } = item
                    const data_refer_arr = data_refer?.split('>><<')
                    const code_set_arr = code_set?.split('>><<')
                    return {
                        ...item,
                        data_refer: {
                            id: data_refer_arr[0],
                            name: data_refer_arr[1],
                        },
                        code_set: {
                            id: code_set_arr[0],
                            name: code_set_arr[1],
                        },
                        is_primary_key: fieldRadioValueList[is_primary_key],
                        is_incremental: fieldRadioValueList[is_incremental],
                        is_local_generated:
                            fieldRadioValueList[is_local_generated],
                        is_standardized: fieldRadioValueList[is_standardized],
                    }
                }),
            )
        }

        /**
         * 更新字段数据
         */
        const updateFormData = async () => {
            await form.setFieldValue('fields', editFieldsData)

            // 使用深度比较，确保只有在数据真正变化时才触发onChange回调
            const newFieldsData = editFieldsData

            // 获取当前展示的字段数据用于比较
            const prevFieldsData = fields

            // 只有当数据真正变化时才触发onChange
            if (!isEqual(newFieldsData, prevFieldsData)) {
                onChange?.(newFieldsData)
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
                    scollerToErrorElement(ex.errorFields?.[0]?.name?.join('-'))
                    setSearchSubmit(false)
                }
            }
        }

        /**
         * 字段更新
         */
        const handleValuesChange = (changedValues, values) => {
            // 根据当前模式获取完整的数据源
            let completeData = editFieldsData

            if (configModel) {
                // 配置模式下：合并批量配置的更改到完整数据中
                completeData = editFieldsData.map((item) => {
                    const configItem = values?.fields?.find(
                        (field) => field.id === item.id,
                    )
                    return configItem ? { ...item, ...configItem } : item
                })
            } else if (searchFieldsData?.length) {
                // 搜索模式下：合并搜索结果的更改到完整数据中
                completeData = editFieldsData.map((item) => {
                    const searchItem = values?.fields?.find(
                        (field) => field.id === item.id,
                    )
                    return searchItem ? { ...item, ...searchItem } : item
                })
            } else {
                // 普通模式下：直接使用表单数据
                completeData = values?.fields || editFieldsData
            }

            // 使用深度比较判断是否真的有变化，避免不必要的更新
            const currentFieldsData = completeData

            const prevFieldsData = fields

            // 只有当数据真正变化时才触发onChange，并传递完整数据
            if (!isEqual(currentFieldsData, prevFieldsData)) {
                onChange?.(completeData)
            }

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

                        // 只有当改变的字段是批量字段时才更新批量表单状态
                        // 避免主键等非批量字段影响其他字段的批量状态
                        if (Object.keys(needBatchField).includes(itemKey)) {
                            const batchValue = getBatchValuesStatus(
                                values.fields,
                                itemKey,
                            )
                            form.setFieldValue(itemKey, {
                                value: batchValue.value,
                                status: batchValue.status,
                            })
                        }

                        const newDataTypeData =
                            itemKey === 'data_type'
                                ? { data_length: null, data_accuracy: null }
                                : {}

                        // 批量编辑场景下更新标准化状态或其他字段变更
                        const newValues = values.fields.map(
                            (currentValue, innerIndex) =>
                                index === innerIndex
                                    ? {
                                          ...configModelData[index],
                                          ...values.fields[index],
                                          ...changedValue,
                                          // 只有当是标准化相关字段时才重置标准化状态
                                          standard_status:
                                              StandardKeys.includes(itemKey)
                                                  ? ''
                                                  : configModelData[index]
                                                        ?.standard_status || '',
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
        }

        const onFieldsChange = useCallback(
            (changedFields) => {
                // field.name数据格式 : ['fields', 0, 'is_primary_key']
                const field = changedFields[0] || {}
                const changeIndex = field?.name?.[1]
                const allData = form.getFieldValue('fields')
                const currentData = allData?.[changeIndex || 0]
                if (!field.name) return

                if (
                    field.name?.includes('is_primary_key') &&
                    field.value === 1
                ) {
                    if (configModel) {
                        // 配置模式下，只更新当前字段，不影响其他字段
                        setConfigModelData((prev) =>
                            prev.map((item, index) => {
                                if (changeIndex === index) {
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
                        setEditFieldsData((prev) =>
                            prev.map((item) => {
                                if (item.id === currentData.id) {
                                    return {
                                        ...item,
                                        is_primary_key: 1,
                                        is_required: 1,
                                    }
                                }
                                return item
                            }),
                        )
                        setSearchFieldsData((prev) =>
                            prev?.map((item, index) => {
                                if (changeIndex === index) {
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
                        setEditFieldsData((prev) =>
                            prev.map((item, index) => {
                                if (changeIndex === index) {
                                    return {
                                        ...item,
                                        is_primary_key: 1,
                                        is_required: 1,
                                    }
                                }
                                return item
                            }),
                        )
                    }
                } else if (
                    field.name.includes('is_primary_key') &&
                    field.value === 0
                ) {
                    // 支持配置模式下的主键取消操作
                    if (configModel) {
                        setConfigModelData((prev) =>
                            prev.map((item, index) => {
                                if (changeIndex === index) {
                                    return {
                                        ...item,
                                        is_primary_key: 0,
                                        // 保持其他字段状态不变，不要重置 is_required
                                    }
                                }
                                return item
                            }),
                        )
                    } else if (searchFieldsData?.length) {
                        setEditFieldsData((prev) =>
                            prev.map((item) => {
                                if (item.id === currentData.id) {
                                    return {
                                        ...item,
                                        is_primary_key: 0,
                                        // 保持其他字段状态不变
                                    }
                                }
                                return item
                            }),
                        )
                        setSearchFieldsData((prev) =>
                            prev?.map((item, index) => {
                                if (changeIndex === index) {
                                    return {
                                        ...item,
                                        is_primary_key: 0,
                                        // 保持其他字段状态不变
                                    }
                                }
                                return item
                            }),
                        )
                    } else {
                        setEditFieldsData((prev) =>
                            prev.map((item) => {
                                if (item.id === currentData.id) {
                                    return {
                                        ...item,
                                        is_primary_key: 0,
                                        // 保持其他字段状态不变
                                    }
                                }
                                return item
                            }),
                        )
                    }
                }
            },
            [
                configModel,
                configModelData,
                searchFieldsData,
                editFieldsData,
                form,
            ],
        )

        const onSortEnd = useCallback(
            ({ oldIndex, newIndex }: SortEnd) => {
                if (oldIndex !== newIndex) {
                    const newData = arrayMoveImmutable(
                        editFieldsData.slice(),
                        oldIndex,
                        newIndex,
                    ).filter((el: any) => !!el)
                    setEditFieldsData(newData)
                    setTableDataFilter(newData)
                    onChange?.(newData)
                }
            },
            [editFieldsData, onChange],
        )

        const DraggableContainer = useCallback(
            (props: SortableContainerProps) => (
                <SortableBody
                    useDragHandle
                    disableAutoscroll
                    helperClass="rowDragging"
                    onSortEnd={onSortEnd}
                    {...props}
                />
            ),
            [onSortEnd],
        )

        const components = useMemo(
            () => ({
                body: {
                    wrapper: DraggableContainer,
                    row: DraggableBodyRow,
                },
            }),
            [DraggableContainer],
        )

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

                                    // 获取批量配置的表单值
                                    const batchFormValues = {}
                                    Object.keys(needBatchField).forEach(
                                        (batchField) => {
                                            const fieldValue =
                                                form.getFieldValue(batchField)
                                            if (
                                                fieldValue &&
                                                fieldValue.value !== null &&
                                                fieldValue.value !== undefined
                                            ) {
                                                batchFormValues[batchField] =
                                                    fieldValue.value
                                            }
                                        },
                                    )

                                    const newDatas = editFieldsData.map(
                                        (editField) => {
                                            const foundEditedData =
                                                newConfigData.find(
                                                    (newEditedField) =>
                                                        newEditedField.id ===
                                                        editField.id,
                                                )
                                            updateSaveBtn(false)
                                            if (foundEditedData) {
                                                // 如果该字段被选中进行批量配置，应用批量配置的值
                                                const isSelectedField =
                                                    selectedFields.some(
                                                        (field) =>
                                                            field.id ===
                                                            editField.id,
                                                    )
                                                return {
                                                    ...editField,
                                                    ...foundEditedData,
                                                    // 应用批量配置的值
                                                    ...(isSelectedField
                                                        ? batchFormValues
                                                        : {}),
                                                }
                                            }
                                            // 配置模式下有主键，需要将普通模式下的其他主键清除
                                            // if (
                                            //     primaryKey &&
                                            //     editField.is_primary_key
                                            // ) {
                                            //     return {
                                            //         ...editField,
                                            //         is_primary_key: 0,
                                            //     }
                                            // }
                                            return editField
                                        },
                                    )

                                    setEditFieldsData(newDatas)
                                    setConfigModelData(newDatas)
                                    message.success(__('属性配置成功'))
                                    // 保持批量操作行的勾选状态，不清空选中状态
                                    // setSelectedFields([])

                                    // 确保传递完整数据给父组件
                                    onChange?.(newDatas)
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
                                    // 保持批量操作行的勾选状态，不清空选中状态
                                    // setSelectedFields([])

                                    // 确保传递完整数据给父组件，取消时传递原始数据
                                    onChange?.(editFieldsData)
                                }}
                            >
                                {__('取消')}
                            </Button>
                        </Space>
                    </div>
                ) : (
                    <div className={styles.editTableTool}>
                        <Space size={12}>
                            <Tooltip
                                title={
                                    !selectedFields.length
                                        ? __('请先勾选字段')
                                        : ''
                                }
                            >
                                <div>
                                    <Button
                                        disabled={!selectedFields.length}
                                        onClick={() => {
                                            const newConfigData =
                                                form.getFieldValue('fields')

                                            setConfigModel(true)
                                            // 配置数据源自勾选字段
                                            setConfigModelData(
                                                selectedFields.map(
                                                    (selectedField) => {
                                                        const findedFiled =
                                                            newConfigData.find(
                                                                (
                                                                    currentField,
                                                                ) =>
                                                                    currentField.id ===
                                                                    selectedField.id,
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
                                            // 优化批量字段初始化，保留已有值
                                            Object.keys(needBatchField).forEach(
                                                (batchField) => {
                                                    const batchValue =
                                                        getBatchValuesStatus(
                                                            selectedFields,
                                                            batchField,
                                                        )

                                                    // 只有当前表单值为空或未定义时才设置批量值
                                                    const currentValue =
                                                        form.getFieldValue(
                                                            batchField,
                                                        )
                                                    if (
                                                        !currentValue ||
                                                        currentValue.value ===
                                                            null ||
                                                        currentValue.value ===
                                                            undefined
                                                    ) {
                                                        form.setFieldValue(
                                                            batchField,
                                                            {
                                                                value: batchValue.value,
                                                                status: batchValue.status,
                                                            },
                                                        )
                                                    }
                                                },
                                            )
                                        }}
                                    >
                                        {__('批量配置')}
                                    </Button>
                                </div>
                            </Tooltip>
                            <div
                                className={styles.relativeBizForm}
                                hidden={!bizForm}
                            >
                                {__('映射业务表名称')}：
                                <div className={styles.relativeBizFormTitle}>
                                    <FontIcon
                                        name="icon-kongbaiyewubiao"
                                        type={IconType.COLOREDICON}
                                        style={{ fontSize: '16px' }}
                                    />
                                    <a
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                            setPreFormVisible(true)
                                        }}
                                    >
                                        {bizForm?.name}
                                    </a>
                                </div>
                            </div>
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
                                placeholder={__('搜索信息项名称')}
                                className={styles.searchField}
                                onKeyChange={(val: string) => {
                                    const kw = trim(val)
                                    setSearchKey(kw)
                                    setSearchCondition({
                                        ...searchCondtion,
                                        keyword: kw,
                                    })
                                }}
                            />
                        </Space>
                    </div>
                )}
                <div className={styles.tableContiner}>
                    <Form
                        form={form}
                        name="edit"
                        onValuesChange={debounce(handleValuesChange, 500)}
                        onFieldsChange={debounce(onFieldsChange, 500)}
                        scrollToFirstError
                        style={{ height: '100%' }}
                    >
                        <Form.Item
                            valuePropName="dataSource"
                            name="fields"
                            style={{ height: '100%' }}
                        >
                            <Table
                                columns={configModel ? configColumns : columns}
                                components={components}
                                scroll={{
                                    x: 2050,
                                    y: `calc(100vh - 364px)`,
                                }}
                                sticky
                                rowKey="id"
                                rowSelection={
                                    configModel ? undefined : rowSelection
                                }
                                loading={tableLoading || loading}
                                locale={{
                                    emptyText: configModel ? (
                                        configModelData?.length ? (
                                            <Empty
                                                desc={__('暂无数据')}
                                                iconSrc={dataEmpty}
                                            />
                                        ) : (
                                            <Empty />
                                        )
                                    ) : editFieldsData?.length === 0 ? (
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
                        </Form.Item>
                    </Form>
                </div>
                <FieldTableView
                    visible={preFormVisible}
                    formId={bizForm?.id}
                    items={originFields || []}
                    isDrawio
                    model="view"
                    onClose={() => {
                        setPreFormVisible(false)
                    }}
                />
            </div>
        )
    },
)

export default EditFieldsTable
