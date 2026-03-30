import React, {
    useState,
    useEffect,
    useRef,
    useImperativeHandle,
    forwardRef,
    ReactNode,
    useMemo,
    memo,
    useCallback,
} from 'react'
import {
    Table,
    Select,
    Input,
    Tooltip,
    Space,
    InputNumber,
    Button,
    message,
    Form,
} from 'antd'
import { debounce, noop, isEmpty } from 'lodash'
import type { ColumnsType } from 'antd/es/table'
import classnames from 'classnames'
import { TableComponents } from 'rc-table/lib/interface'
import { arrayMoveImmutable } from 'array-move'
import type { SortableContainerProps, SortEnd } from 'react-sortable-hoc'
import {
    SortableContainer,
    SortableElement,
    SortableHandle,
} from 'react-sortable-hoc'
import { UpOutlined, DownOutlined, MenuOutlined } from '@ant-design/icons'
import { useDebounce, useUpdateEffect } from 'ahooks'
import { getFieldTypeEelment } from '@/components/DatasheetView/helper'
import {
    shareTypeList,
    openTypeList,
    ShareTypeEnum,
    OpenTypeEnum,
    sensitiveOptions,
    classifiedOptoins,
    DataProcessingList,
    belongSystemClassifyList,
    sensitivityLevelList,
} from '../const'
import styles from './styles.module.less'
import __ from './locale'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import { HoldingComponent, RadioBox } from '@/components/FormTableMode/helper'
import { SearchInput, Loader } from '@/ui'
import NumberInput from '@/ui/NumberInput'
import { NumberType } from '@/ui/NumberInput/const'
import {
    ErrorInfo,
    commReg,
    entendNameEnReg,
    keyboardInputValidator,
    keyboardReg,
    numberReg,
    useQuery,
} from '@/utils'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import SelectTableCodeOrStandard from '@/components/ResourcesDir/FieldsTable/SelectTableCodeOrStandard'
import {
    formatError,
    getFormsFieldsList,
    IFormQueryFieldsListParams,
    queryInfoResCatlgColumns,
} from '@/core'
import {
    businFormToInfoCatlgDataType,
    InfoCatlgItemDataType,
    InfoCatlgItemDataTypeOptions,
} from './helper'
import {
    SecurityClassificationOption,
    SensibilityOption,
} from '@/components/FormGraph/helper'

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

const ErrorTips = (props: { children: ReactNode; errorText?: string }) => {
    const { errorText, children } = props
    return (
        <Tooltip
            title={errorText}
            placement="topLeft"
            color="#fff"
            overlayInnerStyle={{
                color: '#e60012',
            }}
            // getPopupContainer={(element) => element}
            zIndex={99}
        >
            {children}
        </Tooltip>
    )
}

interface IInfoItemEditTable {
    // 业务表id
    formId: string
    value?: Array<any>
    primaryRequired?: boolean

    onChange?: (value) => void

    // 完成配置保存数据
    updateSaveBtn?: (status: boolean) => void
}
const InfoItemEditTable = forwardRef(
    (
        {
            formId,
            value = [],
            primaryRequired,
            onChange = noop,
            updateSaveBtn = noop,
        }: IInfoItemEditTable,
        ref,
    ) => {
        const query = useQuery()
        const catlgId = query.get('id') || ''

        const tableRef: any = useRef()
        const parentNode = useMemo(() => {
            return tableRef?.current
        }, [tableRef?.current])
        const [sharedType, setSharedType] = useState<any>()
        const [openType, setOpenType] = useState<any>()
        const [sensitiveType, setSensitiveType] = useState<any>()
        const [sourceSystemType, setSourceSystemType] = useState<any>()
        const [sourceSystemClassifyType, setSourceSystemClassifyType] =
            useState<any>()
        const [infoItemLevel, setInfoItemLevel] = useState<any>()
        const [classifiedType, setClassifiedType] = useState<any>()
        const [businFormFieldList, setBusinFormFieldList] = useState<any[]>([])
        const [tableDataFilter, setTableDataFilter] = useState<any[]>([])
        const tableDataFilterDebounce = useDebounce(tableDataFilter, {
            wait: 100,
        })
        const [delTableDataFilter, setDelTableDataFilter] = useState<any[]>()
        const [errorInfos, setErrorInfos] = useState<number>(0)
        const [errorIndex, setErrorIndex] = useState<number>(0)
        const [searchKey, setSearchKey] = useState<string>('')
        const [isSelecteKeyChange, setIsSelecteKeyChange] =
            useState<boolean>(false)
        const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
        const [selectedRowIds, setSelectedRowIds] = useState<React.Key[]>([])
        const [disabledOpenType, setDisabledOpenType] = useState<boolean>(false)
        const [{ using, governmentSwitch }] = useGeneralConfig()

        const [form] = Form.useForm()

        useEffect(() => {
            setDelTableDataFilter(tableDataFilter)
        }, [tableDataFilter])

        // 配置模式
        const [configModel, setConfigModel] = useState<boolean>(false)

        // 配置模式表头
        // const [configColumns, setConfigColumns] = useState<Array<any>>([])
        // 配置属性的数据
        const [configModelData, setConfigModelData] = useState<Array<any>>([])
        // 搜索的数据
        const [searchFieldsData, setSearchFieldsData] =
            useState<Array<any> | null>()

        // 选中的字段
        const [selectedFields, setSelectedFields] = useState<Array<any>>([])
        const [searchCondtion, setSearchCondition] = useState<any>({
            offset: 1,
            limit: 10,
            keyword: '',
        })

        const validateRule = {
            name: {
                pattern: commReg,
                message: ErrorInfo.EXTENDCNNAME,
            },
            data_type: {
                nullMsg: __('请选择'),
            },
            data_length: {
                [businFormToInfoCatlgDataType.number]: {
                    max: 65,
                    message: __('仅支持 0~65 之间的整数'),
                },
                [businFormToInfoCatlgDataType.char]: {
                    max: 65535,
                    message: __('仅支持 0~65535 之间的整数'),
                },
            },
            is_primary_key: {
                message: __('请选择'),
            },
            // shared_type: {
            //     nullMsg: __('请选择共享属性'),
            // },
            // shared_condition: {
            //     nullMsg: __('请输入共享条件'),
            //     pattern: keyboardReg,
            //     message: ErrorInfo.EXCEPTEMOJI,
            // },
            // open_type: {
            //     nullMsg: __('请选择开放属性'),
            // },
            // open_condition: {
            //     nullMsg: __('请输入开放条件'),
            //     pattern: keyboardReg,
            //     message: ErrorInfo.EXCEPTEMOJI,
            // },
            is_sensitive: {
                nullMsg: __('请选择'),
            },
            is_secret: {
                nullMsg: __('请选择'),
            },
        }

        const batchAttr = {
            // shared_type: setSharedType,
            // open_type: setOpenType,
            is_sensitive: setSensitiveType,
            is_secret: setClassifiedType,
            // source_system: setSourceSystemType,
            // source_system_level: setSourceSystemClassifyType,
            // info_item_level: setInfoItemLevel,
        }

        useImperativeHandle(ref, () => ({
            onValidate,
        }))

        useEffect(() => {
            // setDisabledOpenType(
            //     businFormFieldList?.filter(
            //         (item) => item?.shared_type === ShareTypeEnum.NOSHARE,
            //     )?.length > 0,
            // )
        }, [])

        useEffect(() => {
            getBusinFormFields(formId, searchCondtion)
        }, [formId])

        // useUpdateEffect(() => {
        //     getBusinFormFields(formId, searchCondtion)
        // }, [searchCondtion])

        useEffect(() => {
            if (isSelecteKeyChange) {
                setBusinFormFieldList(
                    businFormFieldList?.map((item) => ({
                        ...item,
                        isSelectedFlag: selectedRowIds.includes(item.id),
                    })),
                )
            }
        }, [selectedRowIds, isSelecteKeyChange])

        useEffect(() => {
            // setTableData(value)
            setSelectedRowIds(
                value
                    ?.filter((item) => item.isSelectedFlag)
                    ?.map((item) => item.id),
            )
            const keys: number[] = []
            value.forEach((item, index) => {
                if (item.isSelectedFlag) {
                    keys.push(index)
                }
            })
            // 拖拽顺序需要index为key
            setSelectedRowKeys(keys)
        }, [value])

        useUpdateEffect(() => {
            // setBusinFormFieldList(value)
            const newFieldData = value?.filter((item) =>
                item.name
                    .toLocaleLowerCase()
                    .includes(searchKey.toLocaleLowerCase()),
            )
            setSearchFieldsData(newFieldData)
            setTableDataFilter(newFieldData)
        }, [searchKey, value])

        // 获取业务表字段
        const getBusinFormFields = async (
            fId: string,
            params: IFormQueryFieldsListParams,
        ) => {
            if (!fId) return
            try {
                let res: any = {}
                let fieldsTemp: Array<any> = []
                if (catlgId) {
                    // 编辑目录
                    res = await queryInfoResCatlgColumns({
                        id: catlgId,
                        offset: 1,
                        limit: 2000,
                    })
                    fieldsTemp =
                        res?.entries?.map((item) => {
                            return {
                                ...item,
                                ...item.metadata,
                                isSelectedFlag: true,
                            }
                        }) || []
                } else {
                    // 新建目录
                    res = await getFormsFieldsList(fId, params)
                    fieldsTemp =
                        res?.entries.map((item) => {
                            return {
                                ...item,
                                data_type:
                                    businFormToInfoCatlgDataType[
                                        item.data_type
                                    ] || InfoCatlgItemDataType.Other,
                            }
                        }) || []
                    // fieldsTemp = res?.entries
                }
                // const editedFields: Record<string, any> = {}
                // res?.entries?.forEach((item) => {
                //     if (item.id) {
                //         editedFields[item.id] = { ...item }
                //     }
                // })
                // const allFields = businFormRes?.entries?.map((item) => {
                //     const editField = item.id ? editedFields[item.id] || {} : {}

                //     return {
                //         ...item,
                //         ...editField,
                //         data_type:
                //             businFormToInfoCatlgDataType[item.data_type] ||
                //             InfoCatlgItemDataType.Other,
                //         isChecked: !!editField?.id,
                //     }
                // })
                // setFields([...(allFields || [])])
                // setTotalCount(businFormRes?.total_count || 0)

                onChange?.(fieldsTemp)
                setBusinFormFieldList(fieldsTemp)

                setTableDataFilter(fieldsTemp)
                setSelectedRowIds(
                    fieldsTemp
                        ?.filter((item) => item.isSelectedFlag)
                        ?.map((item) => item.id),
                )
                const keys: number[] = []
                fieldsTemp.forEach((item, index) => {
                    if (item.isSelectedFlag) {
                        keys.push(index)
                    }
                })
                // 拖拽顺序需要index为key
                setSelectedRowKeys(keys)
            } catch (e) {
                formatError(e)
            }
        }

        const onFieldsChange = (
            type: 'all' | 'single',
            key: string,
            val: any,
            id?: string,
        ) => {
            let list: any[]
            if (type === 'single') {
                list = tableDataFilter.map((item) => {
                    const isCurrent = item.id === id
                    // 共享属性为不予共享时，开放属性为不予开放
                    const open_type =
                        key === 'shared_type' &&
                        val === ShareTypeEnum.NOSHARE &&
                        isCurrent
                            ? OpenTypeEnum.NOOPEN
                            : item.open_type
                    const info = {
                        ...item,
                        open_type,
                        [key]: isCurrent ? val : item[key],
                        isSelectedFlag: selectedRowIds.includes(item.id),
                    }
                    if (key === 'data_refer' && isCurrent) {
                        info.data_refer = val?.key || item.data_refer?.id
                        info.standard = val?.label || item.standard
                    }
                    if (key === 'code_set' && isCurrent) {
                        info.code_set = val?.key || item.code_set?.id
                        info.code_table = val?.label || item.code_table
                    }

                    // 切换为高精度时 若没有数据长度，则增加报错信息
                    const dataLengthErr =
                        key === 'data_type' && !item.data_length
                            ? val === InfoCatlgItemDataType.Decimal
                                ? {
                                      data_length: __('请输入数据长度'),
                                  }
                                : val === InfoCatlgItemDataType.Char
                                ? {
                                      data_length: '',
                                  }
                                : {}
                            : {}

                    const errorTips = {
                        ...item?.errorTips,
                        [key]:
                            catlgId || info.isSelectedFlag
                                ? setErrorText(key, val, item)
                                : '',
                        ...dataLengthErr,
                    }
                    const noErr = isEmpty(errorTips)
                    return !noErr && isCurrent
                        ? {
                              ...info,
                              errorTips,
                          }
                        : info
                })
            } else {
                list = tableDataFilter.map((item: any) => {
                    const errorTips = {
                        ...item?.errorTips,
                        [key]: '',
                    }
                    return {
                        ...item,
                        [key]: val,
                        errorTips,
                    }
                })
            }
            if (key === 'is_primary_key') {
                list = tableDataFilter.map((item) => {
                    return {
                        ...item,
                        [key]: item.id === id ? val : item[key],
                    }
                })
            }
            setDisabledOpenType(
                list?.filter(
                    (item) => item?.shared_type === ShareTypeEnum.NOSHARE,
                )?.length > 0,
            )

            // setTableDataFilter(list)
            setBusinFormFieldList((prev) => {
                const newData = prev?.map((item) => {
                    const editField =
                        list?.find((editItem) => editItem?.id === item.id) || {}
                    return {
                        ...item,
                        ...editField,
                    }
                })
                return newData
            })
            onChange?.(list)
            const setAction = batchAttr[key]
            if (setAction) {
                // 选项值是否统一，统一则头部选项有值，否则头部显示多项值
                const flag = list
                    .map((item) => item[key])
                    .every((item) => item === val)
                setAction(type === 'all' || flag ? val : null)
            }
            getErrInfo(list)
        }

        const onValidate = () => {
            const requiredKeys = Object.keys(validateRule)
            const list = businFormFieldList.map((item) => {
                const filterKeys: string[] = []
                let info = {
                    ...item,
                    isSelectedFlag: selectedRowIds.includes(item.id),
                }
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
                const dataEle = data_refer?.split('>><<')
                const codeTb = code_set?.split('>><<')
                const newItem = {
                    ...rest,
                    metadata: {
                        data_type,
                        data_length,
                        data_range,
                    },
                    data_refer: dataEle?.length
                        ? {
                              id: dataEle?.[0],
                              name: dataEle?.[1],
                          }
                        : undefined,
                    code_set: codeTb?.length
                        ? {
                              id: codeTb?.[0],
                              name: codeTb?.[1],
                          }
                        : undefined,
                    // 如果没有选择主键，就把选择的第一个给提示
                    is_primary_key:
                        is_primary_key === 1 || selectedFields?.length === 1,
                    is_incremental: is_incremental === 1,
                    is_local_generated: is_local_generated === 1,
                    is_standardized: is_standardized === 1,
                    isSelectedFlag: selectedRowIds.includes(item.id),
                }
                if (catlgId) {
                    // 编辑，需要自带id
                    info = {
                        id,
                        ...newItem,
                    }
                }
                let errorTips = {}
                requiredKeys.forEach((it) => {
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

        const checkDuplicateName = (
            val: string,
            key: string,
            currentId: string,
        ) => {
            // 编辑时，所有字段互相比较，新建时，选中字段互相比较
            return businFormFieldList
                .filter((item) => catlgId || item.isSelectedFlag)
                .some((item) => item[key] === val && item.id !== currentId)
        }

        const setErrorText = (key: string, val: any, record?: any) => {
            const isNumber =
                record?.data_type === businFormToInfoCatlgDataType.number
            const isChar =
                record?.data_type === businFormToInfoCatlgDataType.char

            if (!val && val !== 0 && key !== 'data_length') {
                return validateRule?.[key]?.nullMsg || __('输入不能为空')
            }
            if (key === 'name' && checkDuplicateName(val, key, record?.id)) {
                return __('名称不能重复')
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
                        validateRule?.[key]?.[
                            businFormToInfoCatlgDataType.number
                        ]?.max
                ) {
                    return validateRule?.[key]?.[
                        businFormToInfoCatlgDataType.number
                    ]?.message
                }
                if (
                    isChar &&
                    Number(val) >
                        validateRule?.[key]?.[businFormToInfoCatlgDataType.char]
                            ?.max
                ) {
                    return validateRule?.[key]?.[
                        businFormToInfoCatlgDataType.char
                    ]?.message
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
            const sumArr = list.map((item) => {
                return Object.values(item?.errorTips || {})?.filter((it) => it)
                    ?.length
            })
            let primarySum = 0
            // 是否主键校验
            if (primaryRequired) {
                primarySum +=
                    list.filter((item) => item.is_primary_key)?.length > 0
                        ? 0
                        : 1
            }
            const total = sumArr.reduce((pre, cur) => pre + cur, 0) + primarySum
            setErrorInfos(total)
            return total
        }

        const onSortEnd = useCallback(
            ({ oldIndex, newIndex }: SortEnd) => {
                if (oldIndex !== newIndex) {
                    const newData = arrayMoveImmutable(
                        tableDataFilter.slice(),
                        oldIndex,
                        newIndex,
                    ).filter((el: any) => !!el)

                    setTableDataFilter(newData)
                    if (!searchKey && !configModel) {
                        // 对原始字段重新排序
                        setBusinFormFieldList(newData)
                    }
                    onChange?.(newData)
                }
            },
            [tableDataFilter, onChange],
        )
        const DraggableContainer = useCallback(
            (props: SortableContainerProps) => (
                <SortableBody
                    useDragHandle
                    disableAutoscroll
                    helperClass={styles.rowDragging}
                    onSortEnd={onSortEnd}
                    {...props}
                />
            ),
            [onSortEnd],
        )

        const dataSource = useMemo(() => {
            return configModel ? configModelData : tableDataFilter
        }, [configModel, configModelData, tableDataFilter])

        const components = useMemo(
            () => ({
                body: {
                    wrapper: DraggableContainer,
                    row: DraggableBodyRow,
                },
            }),
            [DraggableContainer],
        )
        const onSelectChange = (keys: React.Key[], selectedRows) => {
            setSelectedRowKeys(keys)
            const ids = selectedRows?.map((item) => item.id)
            setIsSelecteKeyChange(true)
            setSelectedRowIds(ids)
            setSelectedFields(selectedRows)
            onChange?.(
                businFormFieldList?.map((item) => ({
                    ...item,
                    isSelectedFlag: ids.includes(item.id),
                })),
            )
        }
        const rowSelection = {
            selectedRowKeys,
            onChange: onSelectChange,
        }

        const columns = useMemo(() => {
            const newColumns = [
                {
                    title: configModel ? (
                        <div className={styles.tableTitleContainer}>
                            <span className={styles.fieldLabel}>
                                {__('信息项名称')}
                            </span>
                            <div className={styles.tips}>
                                {__('不支持批量配置')}
                            </div>
                        </div>
                    ) : (
                        <span className={styles.fieldLabel}>
                            {__('信息项名称')}
                        </span>
                    ),
                    key: 'name',
                    dataIndex: 'name',
                    width: 240,
                    // fixed: 'left',
                    render: (text, record, index) => (
                        <ErrorTips errorText={record?.errorTips?.name}>
                            <SearchInput
                                showIcon={false}
                                allowClear={false}
                                style={{
                                    borderRadius: '4px',
                                    width: '220px',
                                }}
                                status={record?.errorTips?.name ? 'error' : ''}
                                maxLength={255}
                                value={text}
                                autoComplete="off"
                                placeholder={__('请输入')}
                                onBlur={(e) => {
                                    onFieldsChange(
                                        'single',
                                        'name',
                                        e.target?.value,
                                        record.id,
                                    )
                                }}
                            />
                        </ErrorTips>
                    ),
                },
                {
                    title: configModel ? (
                        <div className={styles.tableTitleContainer}>
                            <span>{__('关联数据标准')}</span>
                            <div className={styles.tips}>
                                {__('不支持批量配置')}
                            </div>
                        </div>
                    ) : (
                        <span>{__('关联数据标准')}</span>
                    ),
                    width: 300,
                    key: 'data_refer',
                    dataIndex: 'data_refer',
                    render: (_, record, index) => (
                        <SelectTableCodeOrStandard
                            placeholder={__('请选择关联数据标准')}
                            type="standard"
                            fields={record}
                            onChange={(val) => {
                                onFieldsChange(
                                    'single',
                                    'data_refer',
                                    val,
                                    record.id,
                                )
                            }}
                        />
                    ),
                },
                {
                    title: configModel ? (
                        <div className={styles.tableTitleContainer}>
                            <span>{__('关联码表')}</span>
                            <div className={styles.tips}>
                                {__('不支持批量配置')}
                            </div>
                        </div>
                    ) : (
                        <span>{__('关联码表')}</span>
                    ),
                    width: 300,
                    key: 'code_set',
                    dataIndex: 'code_set',
                    render: (_, record, index) => (
                        <SelectTableCodeOrStandard
                            placeholder={__('请选择关联码表')}
                            type="code"
                            fields={record}
                            onChange={(val) => {
                                onFieldsChange(
                                    'single',
                                    'code_set',
                                    val,
                                    record.id,
                                )
                            }}
                        />
                    ),
                },
                {
                    title: configModel ? (
                        <div className={styles.tableTitleContainer}>
                            <span className={styles.fieldLabel}>
                                {__('数据类型')}
                            </span>
                            <div className={styles.tips}>
                                {__('不支持批量配置')}
                            </div>
                        </div>
                    ) : (
                        <span className={styles.fieldLabel}>
                            {__('数据类型')}
                        </span>
                    ),
                    width: 420,
                    key: 'data_type',
                    dataIndex: 'data_type',
                    render: (text, record, index) => {
                        const dataLength = record?.data_length
                        const dataRange = record?.data_range
                        const dataLengthType = [
                            InfoCatlgItemDataType.Decimal,
                            InfoCatlgItemDataType.Char,
                        ]

                        return (
                            <Space size={8}>
                                <ErrorTips
                                    errorText={record?.errorTips?.data_type}
                                >
                                    <Select
                                        style={{ width: '120px' }}
                                        value={text}
                                        options={InfoCatlgItemDataTypeOptions}
                                        status={
                                            record?.errorTips?.data_type
                                                ? 'error'
                                                : ''
                                        }
                                        getPopupContainer={(element) =>
                                            parentNode || element.parentNode
                                        }
                                        onChange={(val) => {
                                            onFieldsChange(
                                                'single',
                                                'data_type',
                                                val,
                                                record.id,
                                            )
                                        }}
                                    />
                                </ErrorTips>

                                {dataLengthType.includes(text) ? (
                                    <ErrorTips
                                        errorText={
                                            record?.errorTips?.data_length
                                        }
                                    >
                                        <InputNumber
                                            status={
                                                record?.errorTips?.data_length
                                                    ? 'error'
                                                    : ''
                                            }
                                            min={1}
                                            max={
                                                text ===
                                                InfoCatlgItemDataType.Char
                                                    ? 65535
                                                    : 38
                                            }
                                            style={{ width: 148 }}
                                            placeholder={
                                                text ===
                                                InfoCatlgItemDataType.Char
                                                    ? __('长度（1~65535）')
                                                    : __('长度（1~38）')
                                            }
                                            controls={false}
                                            value={dataLength}
                                            onBlur={(e) => {
                                                let dataLen
                                                const inputVal =
                                                    e.target?.value.replace(
                                                        /[^\d.]/g,
                                                        '',
                                                    )
                                                if (
                                                    text ===
                                                    InfoCatlgItemDataType.Char
                                                ) {
                                                    dataLen =
                                                        inputVal === ''
                                                            ? ''
                                                            : Number(inputVal)
                                                    if (
                                                        dataLen &&
                                                        dataLen > 65535
                                                    ) {
                                                        dataLen = 65535
                                                    }
                                                }
                                                if (
                                                    text ===
                                                    InfoCatlgItemDataType.Decimal
                                                ) {
                                                    dataLen = Number(inputVal)
                                                    if (dataLen > 38) {
                                                        dataLen = 38
                                                    }
                                                }

                                                if (dataLen === 0) {
                                                    dataLen = 1
                                                }
                                                onFieldsChange(
                                                    'single',
                                                    'data_length',
                                                    dataLen,
                                                    record.id,
                                                )
                                            }}
                                            prefix={
                                                text ===
                                                    InfoCatlgItemDataType.Decimal && (
                                                    <span
                                                        style={{
                                                            color: '#FF4D4F',
                                                        }}
                                                    >
                                                        *
                                                    </span>
                                                )
                                            }
                                        />
                                    </ErrorTips>
                                ) : (
                                    <HoldingComponent
                                        style={{ width: 90 }}
                                        text={__('数据长度')}
                                    />
                                )}
                                <ErrorTips
                                    errorText={record?.errorTips?.data_range}
                                >
                                    <SearchInput
                                        showIcon={false}
                                        allowClear={false}
                                        style={{
                                            borderRadius: '4px',
                                            width: '90px',
                                        }}
                                        status={
                                            record?.errorTips?.data_range
                                                ? 'error'
                                                : ''
                                        }
                                        maxLength={128}
                                        value={dataRange}
                                        autoComplete="off"
                                        placeholder={__('数据值域')}
                                        onBlur={(e) => {
                                            onFieldsChange(
                                                'single',
                                                'data_range',
                                                e.target?.value,
                                                record.id,
                                            )
                                        }}
                                    />
                                </ErrorTips>
                            </Space>
                        )
                    },
                },

                {
                    title: (
                        <div className={styles.tableTitleContainer}>
                            <span className={styles.fieldLabel}>
                                {__('敏感属性')}
                            </span>
                            {configModel ? (
                                <div>
                                    <Select
                                        placeholder={__('多项值')}
                                        style={{ width: '92px' }}
                                        options={sensitiveOptions}
                                        getPopupContainer={(element) =>
                                            parentNode || element.parentNode
                                        }
                                        value={sensitiveType}
                                        onChange={(val) => {
                                            onFieldsChange(
                                                'all',
                                                'is_sensitive',
                                                val,
                                            )
                                        }}
                                    />
                                </div>
                            ) : undefined}
                        </div>
                    ),
                    key: 'is_sensitive',
                    dataIndex: 'is_sensitive',
                    width: 128,
                    render: (text, record, index) => (
                        <ErrorTips errorText={record?.errorTips?.is_sensitive}>
                            <Select
                                status={
                                    record?.errorTips?.is_sensitive
                                        ? 'error'
                                        : ''
                                }
                                placeholder={__('请选择')}
                                style={{ width: '92px' }}
                                options={sensitiveOptions}
                                getPopupContainer={(element) =>
                                    parentNode || element.parentNode
                                }
                                value={text}
                                onChange={(val) => {
                                    onFieldsChange(
                                        'single',
                                        'is_sensitive',
                                        val,
                                        record.id,
                                    )
                                }}
                            />
                        </ErrorTips>
                    ),
                },

                {
                    title: (
                        <div className={styles.tableTitleContainer}>
                            <span className={styles.fieldLabel}>
                                {__('涉密属性')}
                            </span>
                            {configModel ? (
                                <div>
                                    <Select
                                        placeholder={__('多项值')}
                                        style={{ width: '92px' }}
                                        options={classifiedOptoins}
                                        getPopupContainer={(element) =>
                                            parentNode || element.parentNode
                                        }
                                        value={classifiedType}
                                        onChange={(val) => {
                                            onFieldsChange(
                                                'all',
                                                'is_secret',
                                                val,
                                            )
                                        }}
                                    />
                                </div>
                            ) : undefined}
                        </div>
                    ),
                    key: 'is_secret',
                    dataIndex: 'is_secret',
                    width: 128,
                    render: (text, record, index) => (
                        <ErrorTips errorText={record?.errorTips?.is_secret}>
                            <Select
                                status={
                                    record?.errorTips?.is_secret ? 'error' : ''
                                }
                                placeholder={__('请选择')}
                                style={{ width: '92px' }}
                                options={classifiedOptoins}
                                getPopupContainer={(element) =>
                                    parentNode || element.parentNode
                                }
                                value={text}
                                onChange={(val) => {
                                    onFieldsChange(
                                        'single',
                                        'is_secret',
                                        val,
                                        record.id,
                                    )
                                }}
                            />
                        </ErrorTips>
                    ),
                },
                {
                    title: (
                        <div className={styles.tableTitleContainer}>
                            <span
                                className={classnames(
                                    primaryRequired && styles.fieldLabel,
                                )}
                            >
                                {__('是否主键')}
                            </span>
                            {configModel && (
                                <div className={styles.tips}>
                                    {__('不支持批量')}
                                </div>
                            )}
                        </div>
                    ),
                    key: 'is_primary_key',
                    dataIndex: 'is_primary_key',
                    width: 102,
                    // 选了一个或者多个，如果没有选择主键，就把选择的第一个给提示
                    render: (text, record, index) => (
                        <ErrorTips
                            errorText={
                                record?.id === selectedRowIds?.[0]
                                    ? record?.errorTips?.is_primary_key
                                    : ''
                            }
                        >
                            <RadioBox
                                checked={text}
                                onChange={(val) => {
                                    onFieldsChange(
                                        'single',
                                        'is_primary_key',
                                        val,
                                        record.id,
                                    )
                                }}
                            />
                        </ErrorTips>
                    ),
                },
                {
                    title: (
                        <div className={styles.tableTitleContainer}>
                            <span
                                className={classnames(
                                    primaryRequired && styles.fieldLabel,
                                )}
                            >
                                {__('是否增量字段')}
                            </span>
                            {configModel && (
                                <div className={styles.tips}>
                                    {__('不支持批量')}
                                </div>
                            )}
                        </div>
                    ),
                    key: 'is_incremental',
                    dataIndex: 'is_incremental',
                    width: 102,
                    render: (text, record, index) => (
                        <RadioBox
                            checked={text}
                            onChange={(val) => {
                                onFieldsChange(
                                    'single',
                                    'is_incremental',
                                    val,
                                    record.id,
                                )
                            }}
                        />
                    ),
                },
                {
                    title: (
                        <div className={styles.tableTitleContainer}>
                            <span
                                className={classnames(
                                    primaryRequired && styles.fieldLabel,
                                )}
                            >
                                {__('是否本部门产生')}
                            </span>
                            {configModel && (
                                <div className={styles.tips}>
                                    {__('不支持批量')}
                                </div>
                            )}
                        </div>
                    ),
                    key: 'is_local_generated',
                    dataIndex: 'is_local_generated',
                    width: 102,
                    render: (text, record, index) => (
                        <RadioBox
                            checked={text}
                            onChange={(val) => {
                                onFieldsChange(
                                    'single',
                                    'is_local_generated',
                                    val,
                                    record.id,
                                )
                            }}
                        />
                    ),
                },
                {
                    title: (
                        <div className={styles.tableTitleContainer}>
                            <span
                                className={classnames(
                                    primaryRequired && styles.fieldLabel,
                                )}
                            >
                                {__('是否标准化')}
                            </span>
                            {configModel && (
                                <div className={styles.tips}>
                                    {__('不支持批量')}
                                </div>
                            )}
                        </div>
                    ),
                    key: 'is_standardized',
                    dataIndex: 'is_standardized',
                    width: 102,
                    render: (text, record, index) => (
                        <RadioBox
                            checked={text}
                            onChange={(val) => {
                                onFieldsChange(
                                    'single',
                                    'is_standardized',
                                    val,
                                    record.id,
                                )
                            }}
                        />
                    ),
                },
            ]

            if (configModel) {
                return newColumns
            }
            return [
                {
                    dataIndex: 'drag',
                    width: 50,
                    key: 'drag',
                    className: 'drag-visible',
                    render: () => <DragHandle />,
                },
                ...newColumns,
            ]
        }, [configModel])

        const scollerToErrorElement = (index) => {
            const errorList = document.querySelectorAll(
                '.any-fabric-ant-select-status-error',
            )
            errorList[index]?.scrollIntoView({
                inline: 'center',
                behavior: 'smooth',
            })
        }

        return (
            <div className={styles.fieldsTableWrapper}>
                <div className={styles.title}>
                    <div className={styles.editTableTool}>
                        {configModel ? (
                            <Space size={12}>
                                <Button
                                    disabled={!selectedFields.length}
                                    onClick={() => {
                                        setConfigModel(false)
                                        const newConfigData = configModelData
                                        const primaryKey = newConfigData.find(
                                            (item) => item.is_primary_key,
                                        )
                                        const newOriginData =
                                            businFormFieldList.map(
                                                (editField) => {
                                                    const foundEditedData =
                                                        newConfigData.find(
                                                            (newEditedField) =>
                                                                newEditedField.id ===
                                                                editField.id,
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
                                        setBusinFormFieldList(newOriginData)
                                        // 若配置前时有关键词，完成配置后回到搜索的列表
                                        let newTableFilterData: any =
                                            newOriginData
                                        if (searchKey) {
                                            newTableFilterData =
                                                newOriginData?.filter(
                                                    (item) =>
                                                        item.business_name
                                                            .toLocaleLowerCase()
                                                            .includes(
                                                                searchKey.toLocaleLowerCase(),
                                                            ) ||
                                                        item.technical_name
                                                            .toLocaleLowerCase()
                                                            .includes(
                                                                searchKey.toLocaleLowerCase(),
                                                            ),
                                                )
                                        }
                                        setTableDataFilter(newTableFilterData)

                                        setConfigModelData(newTableFilterData)
                                        message.success(__('属性配置成功'))
                                        // setSelectedFields([])
                                    }}
                                >
                                    {__('完成配置属性')}
                                </Button>
                                <Button
                                    disabled={!selectedFields.length}
                                    onClick={() => {
                                        setConfigModel(false)
                                        updateSaveBtn(false)
                                    }}
                                >
                                    {__('取消')}
                                </Button>
                            </Space>
                        ) : (
                            <Tooltip
                                title={
                                    !selectedFields.length
                                        ? __('请先勾选字段')
                                        : ''
                                }
                            >
                                <Button
                                    disabled={!selectedRowKeys.length}
                                    onClick={() => {
                                        const newConfigData = [
                                            ...tableDataFilter,
                                        ]?.filter((field) => {
                                            return selectedRowIds?.includes(
                                                field?.id,
                                            )
                                        })
                                        updateSaveBtn(true)
                                        setConfigModel(true)
                                        setConfigModelData(newConfigData)
                                    }}
                                >
                                    {__('配置属性')}
                                </Button>
                            </Tooltip>
                        )}

                        {errorInfos ? (
                            <div className={styles.errorTips}>
                                <span>
                                    {__('${count}个字段信息不完善', {
                                        count: errorInfos,
                                    })}
                                </span>

                                <div>
                                    <span className={styles.errorBar}>
                                        {`${errorIndex + 1}/${errorInfos}`}
                                    </span>
                                    <Tooltip title={__('上一个')}>
                                        <Button
                                            type="text"
                                            icon={<UpOutlined />}
                                            disabled={errorIndex === 0}
                                            onClick={() => {
                                                if (errorIndex > 0) {
                                                    scollerToErrorElement(
                                                        errorIndex - 1,
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
                                                errorIndex === errorInfos - 1
                                            }
                                            icon={<DownOutlined />}
                                            onClick={() => {
                                                if (errorIndex < errorInfos) {
                                                    scollerToErrorElement(
                                                        errorIndex + 1,
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
                        ) : (
                            <div />
                        )}
                    </div>
                    {!configModel && (
                        <SearchInput
                            value={searchKey}
                            placeholder={__('搜索信息项名称')}
                            className={styles.searchField}
                            onKeyChange={(kw: string) => {
                                setSearchKey(kw)
                            }}
                            style={{ width: '272px' }}
                        />
                    )}
                </div>
                <div className={styles.tableContiner} ref={tableRef}>
                    <Table
                        pagination={false}
                        rowKey={(record, index) => index || 0}
                        dataSource={dataSource}
                        // dataSource={
                        //     configModel ? configModelData : tableDataFilter
                        // }
                        className={styles.paramTable}
                        columns={columns}
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
                            ) : tableDataFilter?.length === 0 ? (
                                <Empty
                                    desc={__('暂无数据')}
                                    iconSrc={dataEmpty}
                                />
                            ) : (
                                <Empty />
                            ),
                        }}
                        components={components}
                        rowSelection={configModel ? undefined : rowSelection}
                        onRow={(record, index) => ({
                            index,
                            onClick: (event) => {
                                event.stopPropagation()
                            },
                        })}
                        scroll={{
                            x: 1920,
                            y: `calc(100vh - 364px)`,
                        }}
                        sticky
                    />
                </div>
            </div>
        )
    },
)
export default InfoItemEditTable
