import { Button, Select, Space, Table, Tooltip } from 'antd'
import React, {
    forwardRef,
    ReactNode,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'

import {
    DownOutlined,
    ExclamationCircleFilled,
    MenuOutlined,
    UpOutlined,
} from '@ant-design/icons'
import { arrayMoveImmutable } from 'array-move'
import classnames from 'classnames'
import { isEmpty, isEqual, isString, noop, uniq, uniqWith } from 'lodash'
import { FixedType } from 'rc-table/lib/interface'
import type { SortableContainerProps, SortEnd } from 'react-sortable-hoc'
import {
    SortableContainer,
    SortableElement,
    SortableHandle,
} from 'react-sortable-hoc'
import {
    commReg,
    ErrorInfo,
    info as modalInfo,
    keyboardReg,
    nameReg,
    positiveIntegerReg,
    useQuery,
} from '@/utils'
import Empty from '@/ui/Empty'
import { SearchInput } from '@/ui'
import { AddOutlined } from '@/icons'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { HoldingComponent, RadioBox } from '@/components/FormTableMode/helper'
import { useResourcesCatlogContext } from '../ResourcesCatlogProvider'
import {
    belongSystemClassifyList,
    classifiedOptoins,
    DataProcessingList,
    fieldType,
    FormatDataType,
    OpenTypeEnum,
    openTypeList,
    sensitiveOptions,
    ShareTypeEnum,
    shareTypeList,
    typeOptoins,
} from '../const'
import { getColorOptions } from '../helper'
import SelectTableCodeOrStandard from './SelectTableCodeOrStandard'
import {
    emptyCatalogValidateKeys,
    governmentKeys,
    validateRuleInfoItem,
} from './const'
import __ from './locale'
import styles from './styles.module.less'

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
    value?: Array<any>
    mapFieldInfo?: Array<any>
    onChange?: (value) => void
    setShowSecretDataTips?: (flag) => void
    showSecretDataTips?: boolean
    primaryRequired?: boolean
    // 没有挂接资源
    isEmptyCatalog?: boolean
    formName?: string
    resId?: string
}
const InfoItemEditTable = forwardRef(
    (
        {
            value = [],
            mapFieldInfo = [],
            primaryRequired,
            isEmptyCatalog,
            onChange = noop,
            formName,
            resId,
            showSecretDataTips,
            setShowSecretDataTips = noop,
        }: IInfoItemEditTable,
        ref,
    ) => {
        const query = useQuery()
        // 值为 true：空目录再次编目
        const isEmptyCatalogEdit = query.get('isEmptyCatalogEdit') || ''
        const isImport = query.get('isImport') || ''
        const opType = query.get('type') || ''
        const tableRef: any = useRef()
        const {
            emptyCatalogFields,
            mountResourceData,
            setMountResourceData,
            columnData,
            setColumnData,
            dataViewFields,
        } = useResourcesCatlogContext()
        const parentNode = tableRef?.current
        const [sharedType, setSharedType] = useState<any>()
        const [openType, setOpenType] = useState<any>()
        const [sensitiveType, setSensitiveType] = useState<any>()
        const [sourceSystemType, setSourceSystemType] = useState<any>()
        const [sourceSystemClassifyType, setSourceSystemClassifyType] =
            useState<any>()
        const [infoItemLevel, setInfoItemLevel] = useState<any>()
        const [classifiedType, setClassifiedType] = useState<any>()
        const [tableData, setTableData] = useState<any[]>([])
        const [tableDataFilter, setTableDataFilter] = useState<any[]>([])
        const [errorInfos, setErrorInfos] = useState<number>(0)
        const [errorIndex, setErrorIndex] = useState<number>(0)
        const [searchKey, setSearchKey] = useState<string>('')
        const [isSelecteKeyChange, setIsSelecteKeyChange] =
            useState<boolean>(false)
        const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
        const [selectedRowIds, setSelectedRowIds] = useState<React.Key[]>([])
        const [deleteMapFields, setDeleteMapFields] = useState<any[]>([])
        const [disabledOpenType, setDisabledOpenType] = useState<boolean>(false)
        const [{ using, governmentSwitch }] = useGeneralConfig()
        const [primaryIsRequired, setPrimaryIsRequired] =
            useState<boolean>(false)
        const [timestampIsRequired, setTimestampIsRequired] =
            useState<boolean>(false)

        const selectGetPopupContainer = (node) => {
            return parentNode?.parentNode?.parentNode || node.parentNode
        }

        const governmentStatus = useMemo(() => {
            return governmentSwitch.on
        }, [governmentSwitch])

        const isImportCatalog = useMemo(() => {
            return isImport === 'true'
        }, [governmentSwitch])

        const validateRule = useMemo(() => {
            if (governmentStatus && !isEmptyCatalog) {
                const validateObj: any = Object.assign(validateRuleInfoItem, {
                    source_system: {
                        nullMsg: __('请选择来源系统'),
                    },
                    source_system_level: {
                        nullMsg: __('请选择来源系统分类'),
                    },
                    // info_item_level: {
                    //     nullMsg: __('请选择信息项分级'),
                    // },
                })
                if (mountResourceData?.length) {
                    validateObj.source_id = {
                        nullMsg: __('请选择映射字段'),
                    }
                }
                // delete validateObj.shared_type
                return validateObj
            }
            if (isEmptyCatalog) {
                const valid: any = validateRuleInfoItem
                if (!mountResourceData?.length) {
                    delete valid.source_id
                }
                // 过滤 validateRuleInfoItem 中的属性
                return Object.keys(valid)
                    .filter((key) => emptyCatalogValidateKeys.includes(key))
                    .reduce((obj, key) => {
                        return { ...obj, [key]: validateRuleInfoItem[key] }
                    }, {})
            }
            if (mountResourceData?.length) {
                return {
                    ...validateRuleInfoItem,
                    source_id: {
                        nullMsg: __('请选择映射字段'),
                    },
                }
            }
            return validateRuleInfoItem
        }, [governmentStatus, isEmptyCatalog])

        const batchAttr = {
            shared_type: setSharedType,
            open_type: setOpenType,
            sensitive_flag: setSensitiveType,
            classified_flag: setClassifiedType,
            source_system: setSourceSystemType,
            source_system_level: setSourceSystemClassifyType,
            info_item_level: setInfoItemLevel,
        }

        useImperativeHandle(ref, () => ({
            onValidate,
        }))

        useEffect(() => {
            setDisabledOpenType(
                value?.filter(
                    (item) => item?.shared_type === ShareTypeEnum.NOSHARE,
                )?.length > 0,
            )
        }, [])

        useEffect(() => {
            if (isSelecteKeyChange) {
                setTableData(
                    value?.map((item) => ({
                        ...item,
                        isSelectedFlag: selectedRowIds.includes(item.id),
                    })),
                )
            }
        }, [selectedRowIds, isSelecteKeyChange])

        useEffect(() => {
            if (dataViewFields?.length && !isEqual(dataViewFields, value)) {
                const mapFields = dataViewFields.filter((o) => o.source_id)
                const UnMapFields = dataViewFields
                    .filter(
                        (o) =>
                            !o.source_id &&
                            !columnData
                                ?.map((i) => i.source_id)
                                ?.includes(o.id),
                    )
                    ?.map((o) => ({
                        ...o,
                        source_id: o.id,
                    }))
                const mapFieldsToViewData = columnData?.map((o) => {
                    const mapFieldsInfo = mapFields?.find(
                        (i) => i.source_id === o.id,
                    )
                    const fieldInfo = dataViewFields?.find(
                        (i) =>
                            i.technical_name === o.technical_name ||
                            i.business_name === o.business_name,
                    )
                    const fieldIsDelete =
                        o.source_id &&
                        !dataViewFields?.map((i) => i.id)?.includes(o.source_id)
                    const source_id =
                        mapFieldsInfo?.id ||
                        (fieldIsDelete
                            ? undefined
                            : o.source_id ||
                              (isImportCatalog ? fieldInfo?.id : undefined))
                    const info = {
                        ...o,
                        source_id,
                    }
                    return info
                })
                const list = uniqWith(
                    [
                        ...(mapFieldsToViewData?.length
                            ? mapFieldsToViewData
                            : mapFields),
                        ...(UnMapFields || []),
                    ],
                    (a, b) =>
                        a.technical_name === b.technical_name &&
                        a.business_name === b.business_name,
                )?.map((o) => {
                    const data_type =
                        o?.data_type &&
                        isString(o?.data_type) &&
                        (FormatDataType(o?.data_type) ||
                            FormatDataType(o?.data_type) === 0)
                            ? FormatDataType(o?.data_type)
                            : o.data_type
                    const currentInfo =
                        value?.find?.((i) => i.id === o.id) || {}
                    const fieldIsDelete = !dataViewFields
                        ?.map((i) => i.id)
                        ?.includes(o.source_id)
                    const info = {
                        ...o,
                        ...currentInfo,
                        source_id: fieldIsDelete
                            ? undefined
                            : o?.source_id ||
                              currentInfo?.source_id ||
                              undefined,
                        isSelectedFlag: true,
                        data_type,
                    }
                    return info
                })

                onChange?.(list)
            }
        }, [dataViewFields, columnData])

        useEffect(() => {
            setTableData(value)
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

        useEffect(() => {
            setTableDataFilter(
                value?.filter(
                    (item) =>
                        item.business_name
                            .toLocaleLowerCase()
                            .includes(searchKey.toLocaleLowerCase()) ||
                        item.technical_name
                            .toLocaleLowerCase()
                            .includes(searchKey.toLocaleLowerCase()),
                ),
            )
        }, [searchKey, value])

        const onFieldsChange = (
            type: 'all' | 'single',
            key: string,
            val: any,
            id?: string,
        ) => {
            let list: any[]
            if (type === 'single') {
                list = value.map((item) => {
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
                    if (key === 'standard_code' && isCurrent) {
                        info.standard_code = val?.code
                        info.standard = val?.label
                        // info.standard_type = val?.std_type
                    }
                    if (key === 'code_table_id' && isCurrent) {
                        info.code_table_id = val?.key
                        info.code_table = val?.label
                    }
                    if (key === 'source_id') {
                        info.source_id = isCurrent
                            ? val || undefined
                            : item?.source_id
                        info.source_field_id = isCurrent
                            ? val
                            : item.source_field_id
                        info.changeSource = isCurrent ? true : item.changeSource
                        if (isCurrent) {
                            const ids = val
                                ? deleteMapFields.filter((i) => i !== val)
                                : [...deleteMapFields, id]
                            setDeleteMapFields(uniq(ids))
                        }
                        // if (columnData?.find((i) => i.id === id)?.id) {
                        //     setColumnData((pre) =>
                        //         pre?.map((i) => ({
                        //             ...i,
                        //             source_id: i.id === id ? val : i.source_id,
                        //         })),
                        //     )
                        // }
                    }
                    const conditionErr = {
                        shared_condition:
                            key === 'shared_type' &&
                            item.shared_type !== ShareTypeEnum.UNCONDITION
                                ? setErrorText(key, val, item)
                                : '',
                        open_condition:
                            item.open_condition &&
                            !keyboardReg.test(item.open_condition)
                                ? ErrorInfo.EXCEPTEMOJI
                                : '',
                    }
                    // 切换为高精度时 若没有数据长度，则增加报错信息
                    const dataLengthErr =
                        key === 'data_type' &&
                        !item.data_length &&
                        info.isSelectedFlag
                            ? val === fieldType.decimal
                                ? {
                                      data_length: __('请输入数据长度'),
                                  }
                                : val === fieldType.char
                                ? {
                                      data_length: '',
                                  }
                                : {}
                            : {}
                    const errorTips = {
                        ...item?.errorTips,
                        [key]:
                            info.isSelectedFlag || isEmptyCatalog
                                ? setErrorText(key, val, item)
                                : '',
                        ...dataLengthErr,
                        ...conditionErr,
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
                list = value.map((item: any) => {
                    // if (item?.errorTips?.[key]) {
                    //     delete item.errorTips[key]
                    // }
                    const open_type =
                        key === 'shared_type' && val === ShareTypeEnum.NOSHARE
                            ? OpenTypeEnum.NOOPEN
                            : item.open_type
                    const errorTips = {
                        ...item?.errorTips,
                        [key]: '',
                    }
                    return {
                        ...item,
                        open_type,
                        [key]: val,
                        errorTips,
                    }
                })
            }
            if (key === 'timestamp_flag') {
                list = value.map((item) => {
                    return {
                        ...item,
                        [key]: item.id === id ? val : 0,
                    }
                })
            }
            if (key === 'primary_flag') {
                list = value.map((item) => {
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
            const list = value.map((item) => {
                const filterKeys: string[] = []
                const info = {
                    ...item,
                    isSelectedFlag:
                        selectedRowIds.includes(item.id) ||
                        isEmptyCatalogEdit === 'true',
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
                let errorTips: any = {}
                requiredKeys
                    ?.filter((it) => !filterKeys.includes(it))
                    .forEach((it) => {
                        errorTips = {
                            ...errorTips,
                            [it]:
                                info.isSelectedFlag || isEmptyCatalog
                                    ? setErrorText(it, item[it], item)
                                    : '',
                        }
                    })
                if (
                    item.open_condition &&
                    !keyboardReg.test(item.open_condition)
                ) {
                    errorTips.open_condition = ErrorInfo.EXCEPTEMOJI
                }
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

        const setErrorText = (key: string, val: any, record?: any) => {
            const isDecimal = record?.data_type === fieldType.decimal
            const isChar = record?.data_type === fieldType.char

            if (
                !val &&
                val !== 0 &&
                key !== 'data_accuracy' &&
                key !== 'data_length' &&
                key !== 'data_range'
            ) {
                return validateRule?.[key]?.nullMsg || __('输入不能为空')
            }
            if (
                key === 'technical_name' &&
                checkDuplicateName(val, key, record?.id)
            ) {
                return __('信息项技术名称不能重复')
            }
            if (
                key === 'business_name' &&
                checkDuplicateName(val, key, record?.id)
            ) {
                return __('信息项业务名称不能重复')
            }
            if (
                validateRule?.[key]?.pattern &&
                !validateRule?.[key]?.pattern?.test(val)
            ) {
                return validateRule?.[key]?.message
            }
            if (key === 'data_length' && val) {
                if (!positiveIntegerReg.test(val)) {
                    return isDecimal
                        ? __('请输入1~38之间的整数')
                        : __('请输入1～65535之间的整数')
                }
                if (isDecimal && Number(val) > 38) {
                    return __('请输入1~38之间的整数')
                }
                if (isChar && Number(val) > 65535) {
                    return __('请输入1～65535之间的整数')
                }
            }
            if (key === 'data_length' && !val && isDecimal) {
                return __('请输入数据长度')
            }
            if (key === 'data_range' && val) {
                if (!nameReg.test(val)) {
                    return ErrorInfo.ONLYSUP
                }
                if (!commReg.test(val)) {
                    return ErrorInfo.EXTENDCNNAME
                }
            }
            if (key === 'data_accuracy') {
                if (isDecimal) {
                    if (!val && val !== 0) return __('输入不能为空')
                    if (val > validateRule?.[key]?.max)
                        return validateRule?.[key]?.message
                }
            }
            // if (
            //     key === 'standard_type' &&
            //     (record?.standard_type || record?.standard_type === 0)
            // ) {
            //     return record?.standard_type !== record?.data_type
            //         ? __('关联数据标准的数据类型与字段数据类型不一致')
            //         : ''
            // }
            return ''
        }

        const getErrInfo = (list: any[]) => {
            const sumArr = list.map((item) => {
                return Object.values(item?.errorTips || {})?.filter((it) => it)
                    ?.length
            })
            let primaryAndTimestampSum = 0
            // 是否时间戳、是否主键校验
            if (primaryRequired) {
                const primarySum =
                    list.filter(
                        (item) => item.primary_flag && item.isSelectedFlag,
                    )?.length > 0
                        ? 0
                        : 1
                const timestampSum =
                    list.filter(
                        (item) => item.timestamp_flag && item.isSelectedFlag,
                    )?.length > 0
                        ? 0
                        : 1
                setPrimaryIsRequired(!!primarySum)
                setTimestampIsRequired(!!timestampSum)
                primaryAndTimestampSum = !list?.filter(
                    (item) => item.isSelectedFlag,
                )?.length
                    ? 0
                    : primarySum + timestampSum
            }
            const total =
                sumArr.reduce((pre, cur) => pre + cur, 0) +
                primaryAndTimestampSum
            setErrorInfos(total)
            if (errorIndex > 0) {
                setErrorIndex(errorIndex - 1)
            }
            return total
        }

        const checkDuplicateName = (
            val: string,
            key: string,
            currentId: string,
        ) => {
            return value
                .filter((item) => item.isSelectedFlag || isEmptyCatalog)
                .some((item) => item[key] === val && item.id !== currentId)
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
            onChange?.(
                value?.map((item) => ({
                    ...item,
                    isSelectedFlag: ids.includes(item.id),
                })),
            )
        }
        const rowSelection = {
            selectedRowKeys,
            onChange: onSelectChange,
            renderCell(checked, record, index, node) {
                return (
                    <Tooltip
                        placement="topRight"
                        title={__('被勾选的信息项作为编目内容')}
                        overlayClassName={styles.infoItemTableTooltipTips}
                    >
                        {node}
                    </Tooltip>
                )
            },
        }

        const columns = [
            {
                dataIndex: 'drag',
                width: 50,
                key: 'drag',
                className: 'drag-visible',
                render: () => <DragHandle />,
                fixed: 'left' as FixedType,
            },
            {
                title: (
                    <div className={styles.tableTitleContainer}>
                        <span className={styles.fieldLabel}>
                            {__('信息项业务名称')}
                        </span>
                        <div className={styles.tips}>
                            {__('不支持批量配置')}
                        </div>
                    </div>
                ),
                key: 'business_name',
                dataIndex: 'business_name',
                width: 240,
                fixed: 'left' as FixedType,
                render: (text, record, index) => (
                    <ErrorTips errorText={record?.errorTips?.business_name}>
                        <SearchInput
                            showIcon={false}
                            allowClear={false}
                            style={{
                                borderRadius: '4px',
                                width: '220px',
                            }}
                            status={
                                record?.errorTips?.business_name ? 'error' : ''
                            }
                            maxLength={255}
                            value={text}
                            autoComplete="off"
                            placeholder={__('请输入信息项业务名称')}
                            onBlur={(e) => {
                                onFieldsChange(
                                    'single',
                                    'business_name',
                                    e.target?.value,
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
                            {__('信息项技术名称')}
                        </span>
                        <div className={styles.tips}>
                            {__('不支持批量配置')}
                        </div>
                    </div>
                ),
                key: 'technical_name',
                dataIndex: 'technical_name',
                width: 240,
                render: (text, record, index) => (
                    <ErrorTips errorText={record?.errorTips?.technical_name}>
                        <SearchInput
                            showIcon={false}
                            allowClear={false}
                            style={{
                                borderRadius: '4px',
                                width: '220px',
                            }}
                            status={
                                record?.errorTips?.technical_name ? 'error' : ''
                            }
                            value={text}
                            autoComplete="off"
                            placeholder={__('请输入信息项技术名称')}
                            onBlur={(e) => {
                                onFieldsChange(
                                    'single',
                                    'technical_name',
                                    e.target?.value,
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
                            {__('映射字段')}
                        </span>
                        <div className={styles.tips}>
                            {__('不支持批量配置')}
                        </div>
                    </div>
                ),
                dataIndex: 'source_id',
                key: 'source_id',
                ellipsis: true,
                width: 200,
                render: (text, record) => {
                    const disabled =
                        value
                            ?.filter((o) => !o.changeSource && o.source_id)
                            ?.map((o) => o.source_id)
                            ?.includes(text) && isEmptyCatalogEdit !== 'true'
                    return (
                        <ErrorTips errorText={record?.errorTips?.source_id}>
                            <Select
                                style={{ width: '100%' }}
                                value={text}
                                allowClear
                                disabled={disabled}
                                options={dataViewFields?.map((field) => {
                                    const disabledOp =
                                        value
                                            .map((o) => o.technical_name)
                                            .includes(field.technical_name) ||
                                        value
                                            .map((o) => o.business_name)
                                            .includes(field.business_name) ||
                                        value
                                            ?.filter(
                                                (o) =>
                                                    o.source_field_id ||
                                                    o.source_id,
                                            )
                                            .map(
                                                (o) =>
                                                    o.source_field_id ||
                                                    o.source_id,
                                            )
                                            .includes(field.id)
                                    const opValue =
                                        field?.id?.length === 36
                                            ? field?.id
                                            : field.source_id
                                    const info = {
                                        ...field,
                                        label: `${field.business_name}（${field.technical_name}）`,
                                        value: opValue,
                                        disabled:
                                            disabledOp &&
                                            !deleteMapFields.includes(opValue),
                                    }
                                    return info
                                })}
                                status={
                                    record?.errorTips?.source_id ? 'error' : ''
                                }
                                placeholder={__('请选择')}
                                onChange={(val) => {
                                    onFieldsChange(
                                        'single',
                                        'source_id',
                                        val,
                                        record.id,
                                    )
                                }}
                                getPopupContainer={selectGetPopupContainer}
                            />
                        </ErrorTips>
                    )
                },
            },
            {
                title: (
                    <div className={styles.tableTitleContainer}>
                        <span>{__('关联数据标准')}</span>
                        <div className={styles.tips}>
                            {__('不支持批量配置')}
                        </div>
                    </div>
                ),
                width: 300,
                key: 'standard_code',
                dataIndex: 'standard_code',
                render: (_, record, index) => (
                    // <ErrorTips errorText={record?.errorTips?.standard_type}>
                    <SelectTableCodeOrStandard
                        placeholder={__('请选择关联数据标准')}
                        type="standard"
                        fields={record}
                        onChange={(val) => {
                            onFieldsChange(
                                'single',
                                'standard_code',
                                val,
                                record.id,
                            )
                        }}
                        status={record?.errorTips?.standard_type ? 'error' : ''}
                        stdRecParams={
                            formName && record.business_name
                                ? {
                                      table_name: formName,
                                      table_fields: [
                                          {
                                              table_field: record.business_name,
                                          },
                                      ],
                                  }
                                : undefined
                        }
                    />
                    // </ErrorTips>
                ),
            },
            {
                title: (
                    <div className={styles.tableTitleContainer}>
                        <span>{__('关联码表')}</span>
                        <div className={styles.tips}>
                            {__('不支持批量配置')}
                        </div>
                    </div>
                ),
                width: 300,
                key: 'code_table_id',
                dataIndex: 'code_table_id',
                render: (_, record, index) => {
                    return (
                        <SelectTableCodeOrStandard
                            placeholder={__('请选择关联码表')}
                            type="code"
                            fields={record}
                            onChange={(val) => {
                                onFieldsChange(
                                    'single',
                                    'code_table_id',
                                    val,
                                    record.id,
                                )
                            }}
                        />
                    )
                },
            },
            {
                title: (
                    <div className={styles.tableTitleContainer}>
                        <span
                            className={classnames(
                                !isEmptyCatalog && styles.fieldLabel,
                            )}
                        >
                            {__('数据类型')}
                        </span>
                        <div className={styles.tips}>
                            {__('不支持批量配置')}
                        </div>
                    </div>
                ),
                width: 420,
                key: 'data_type',
                dataIndex: 'data_type',
                render: (text, record, index) => {
                    const dataLength = record?.data_length
                    const dataRange = record?.data_range
                    const dataLengthType = [fieldType.char, fieldType.decimal]
                    return (
                        <Space size={8}>
                            <ErrorTips errorText={record?.errorTips?.data_type}>
                                <Select
                                    style={{ width: '120px' }}
                                    value={text}
                                    options={typeOptoins}
                                    status={
                                        record?.errorTips?.data_type
                                            ? 'error'
                                            : ''
                                    }
                                    getPopupContainer={selectGetPopupContainer}
                                    placeholder={__('请选择')}
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
                                    errorText={record?.errorTips?.data_length}
                                >
                                    <SearchInput
                                        showIcon={false}
                                        allowClear={false}
                                        status={
                                            record?.errorTips?.data_length
                                                ? 'error'
                                                : ''
                                        }
                                        min={1}
                                        max={
                                            text === fieldType.char ? 65535 : 38
                                        }
                                        style={{ width: 148 }}
                                        placeholder={
                                            text === fieldType.char
                                                ? __('长度（1~65535）')
                                                : __('长度（1~38）')
                                        }
                                        value={dataLength}
                                        onBlur={(e) => {
                                            let dataLen
                                            const inputVal =
                                                e.target?.value.replace(
                                                    /[^\d.]/g,
                                                    '',
                                                )
                                            if (text === fieldType.char) {
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
                                            if (text === fieldType.decimal) {
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
                                            text === fieldType.decimal && (
                                                <span
                                                    style={{ color: '#FF4D4F' }}
                                                >
                                                    *
                                                </span>
                                            )
                                        }
                                    />
                                </ErrorTips>
                            ) : (
                                <HoldingComponent
                                    style={{ width: '90px' }}
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
                // 数据精度暂时不要
                // render: (text, record, index) => {
                //     const dataLength = record?.data_length
                //     const dataAccuracy = record?.data_accuracy

                //     return (
                //         <Space size={8}>
                //             <ErrorTips errorText={record?.errorTips?.data_type}>
                //                 <Select
                //                     style={{ width: 120 }}
                //                     value={text}
                //                     options={typeOptoins}
                //                     status={
                //                         record?.errorTips?.data_type
                //                             ? 'error'
                //                             : ''
                //                     }
                //                     getPopupContainer={(element) =>
                //                         parentNode || element.parentNode
                //                     }
                //                     onChange={(val) => {
                //                         onFieldsChange(
                //                             'single',
                //                             'data_type',
                //                             val,
                //                             record.id,
                //                         )
                //                     }}
                //                 />
                //             </ErrorTips>

                //             {[fieldType.char, fieldType.decimal].includes(
                //                 text,
                //             ) && (
                //                 <ErrorTips
                //                     errorText={record?.errorTips?.data_length}
                //                 >
                //                     <InputNumber
                //                         status={
                //                             record?.errorTips?.data_length
                //                                 ? 'error'
                //                                 : ''
                //                         }
                //                         min={1}
                //                         max={
                //                             text === fieldType.char ? 65535 : 38
                //                         }
                //                         style={{ width: 148 }}
                //                         placeholder={
                //                             text === fieldType.char
                //                                 ? __('长度（1~65535）')
                //                                 : __('长度（1~38）')
                //                         }
                //                         value={dataLength}
                //                         onBlur={(e) => {
                //                             let dataLen = e.target?.value
                //                                 ? Number(e.target?.value)
                //                                 : 0
                //                             if (text === fieldType.char) {
                //                                 if (dataLen > 65535) {
                //                                     dataLen = 65535
                //                                 }
                //                             }
                //                             if (text === fieldType.decimal) {
                //                                 if (dataLen > 38) {
                //                                     dataLen = 38
                //                                 }
                //                             }
                //                             if (dataLen < 1) {
                //                                 dataLen = 1
                //                             }
                //                             onFieldsChange(
                //                                 'single',
                //                                 'data_length',
                //                                 dataLen,
                //                                 record.id,
                //                             )
                //                         }}
                //                         prefix={
                //                             text === fieldType.decimal && (
                //                                 <span
                //                                     style={{ color: '#FF4D4F' }}
                //                                 >
                //                                     *
                //                                 </span>
                //                             )
                //                         }
                //                     />
                //                 </ErrorTips>
                //             )}
                //             {record?.data_type === fieldType.decimal && (
                //                 <ErrorTips
                //                     errorText={record?.errorTips?.data_range}
                //                 >
                //                     <InputNumber
                //                         style={{
                //                             width: 148,
                //                         }}
                //                         status={
                //                             record?.errorTips?.data_range
                //                                 ? 'error'
                //                                 : ''
                //                         }
                //                         value={dataAccuracy}
                //                         min={0}
                //                         max={record?.data_length}
                //                         autoComplete="off"
                //                         placeholder={__('精度（要≤长度）')}
                //                         onBlur={(e) => {
                //                             let dataPrecision = e.target.value
                //                                 ? Number(e.target.value)
                //                                 : 0
                //                             const dataLen = record?.data_length
                //                                 ? Number(record?.data_length)
                //                                 : 0
                //                             if (
                //                                 dataPrecision > dataLen &&
                //                                 dataLen
                //                             ) {
                //                                 dataPrecision = dataLen
                //                             }
                //                             onFieldsChange(
                //                                 'single',
                //                                 'data_accuracy',
                //                                 dataPrecision,
                //                                 record.id,
                //                             )
                //                         }}
                //                         prefix={
                //                             <span style={{ color: '#FF4D4F' }}>
                //                                 *
                //                             </span>
                //                         }
                //                     />
                //                 </ErrorTips>
                //             )}
                //         </Space>
                //     )
                // },
            },
            {
                title: (
                    <div className={styles.tableTitleContainer}>
                        <span className={styles.fieldLabel}>
                            {__('共享属性')}
                        </span>
                        <div>
                            <Select
                                placeholder={__('批量配置')}
                                style={{ width: '130px' }}
                                options={getColorOptions(shareTypeList)}
                                getPopupContainer={selectGetPopupContainer}
                                value={sharedType}
                                onChange={(val) => {
                                    onFieldsChange('all', 'shared_type', val)
                                }}
                            />
                        </div>
                    </div>
                ),
                key: 'shared_type',
                dataIndex: 'shared_type',
                width: 158,
                render: (text, record, index) => (
                    <Space size={8}>
                        <ErrorTips errorText={record?.errorTips?.shared_type}>
                            <Select
                                status={
                                    record?.errorTips?.shared_type
                                        ? 'error'
                                        : ''
                                }
                                placeholder={__('请选择')}
                                style={{ width: '130px' }}
                                options={getColorOptions(shareTypeList)}
                                getPopupContainer={selectGetPopupContainer}
                                value={text}
                                onChange={(val) => {
                                    onFieldsChange(
                                        'single',
                                        'shared_type',
                                        val,
                                        record.id,
                                    )
                                }}
                            />
                        </ErrorTips>

                        {/* {text && text !== ShareTypeEnum.UNCONDITION ? (
                            <ErrorTips
                                errorText={record?.errorTips?.shared_condition}
                            >
                                <SearchInput
                                    showIcon={false}
                                    allowClear={false}
                                    status={
                                        record?.errorTips?.shared_condition
                                            ? 'error'
                                            : ''
                                    }
                                    value={record?.shared_condition}
                                    style={{ width: '164px' }}
                                    placeholder={
                                        text === ShareTypeEnum.CONDITION
                                            ? __('共享条件(必填)')
                                            : __('不予共享依据（必填）')
                                    }
                                    onBlur={(e) => {
                                        onFieldsChange(
                                            'single',
                                            'shared_condition',
                                            e.target?.value,
                                            record.id,
                                        )
                                    }}
                                />
                            </ErrorTips>
                        ) : (
                            <HoldingComponent
                                style={{ width: '164px' }}
                                text={__('无需配置此选项')}
                            />
                        )} */}
                    </Space>
                ),
            },
            {
                title: (
                    <div className={styles.tableTitleContainer}>
                        <span className={styles.fieldLabel}>
                            {__('开放属性')}
                        </span>
                        <div>
                            <Select
                                placeholder={__('批量配置')}
                                style={{ width: '134px' }}
                                options={getColorOptions(openTypeList)}
                                getPopupContainer={selectGetPopupContainer}
                                value={openType}
                                onChange={(val) => {
                                    onFieldsChange('all', 'open_type', val)
                                }}
                                disabled={disabledOpenType}
                            />
                        </div>
                    </div>
                ),
                key: 'open_type',
                dataIndex: 'open_type',
                width: 158,
                render: (text, record, index) => (
                    <Space size={8}>
                        <ErrorTips errorText={record?.errorTips?.open_type}>
                            <Select
                                status={
                                    record?.errorTips?.open_type ? 'error' : ''
                                }
                                placeholder={__('请选择')}
                                style={{ width: '134px' }}
                                options={getColorOptions(openTypeList)}
                                getPopupContainer={selectGetPopupContainer}
                                value={text}
                                onChange={(val) => {
                                    onFieldsChange(
                                        'single',
                                        'open_type',
                                        val,
                                        record.id,
                                    )
                                }}
                                disabled={
                                    record?.shared_type ===
                                    ShareTypeEnum.NOSHARE
                                }
                            />
                        </ErrorTips>

                        {/* {text === OpenTypeEnum.HASCONDITION ? (
                            <ErrorTips
                                errorText={record?.errorTips?.open_condition}
                            >
                                <SearchInput
                                    showIcon={false}
                                    allowClear={false}
                                    status={
                                        record?.errorTips?.open_condition
                                            ? 'error'
                                            : ''
                                    }
                                    style={{ width: '160px' }}
                                    placeholder={__('开放条件(选填)')}
                                    value={record?.open_condition}
                                    onBlur={(e) => {
                                        onFieldsChange(
                                            'single',
                                            'open_condition',
                                            e.target?.value,
                                            record.id,
                                        )
                                    }}
                                />
                            </ErrorTips>
                        ) : (
                            <HoldingComponent
                                style={{ width: '160px' }}
                                text={__('无需配置此选项')}
                            />
                        )} */}
                    </Space>
                ),
            },
            {
                title: (
                    <div className={styles.tableTitleContainer}>
                        <span className={styles.fieldLabel}>
                            {__('敏感属性')}
                        </span>
                        <div>
                            <Select
                                placeholder={__('批量配置')}
                                style={{ width: '100px' }}
                                options={getColorOptions(sensitiveOptions)}
                                getPopupContainer={selectGetPopupContainer}
                                value={sensitiveType}
                                onChange={(val) => {
                                    onFieldsChange('all', 'sensitive_flag', val)
                                }}
                            />
                        </div>
                    </div>
                ),
                key: 'sensitive_flag',
                dataIndex: 'sensitive_flag',
                width: 148,
                render: (text, record, index) => (
                    <ErrorTips errorText={record?.errorTips?.sensitive_flag}>
                        <Select
                            status={
                                record?.errorTips?.sensitive_flag ? 'error' : ''
                            }
                            placeholder={__('请选择')}
                            style={{ width: '100px' }}
                            options={getColorOptions(sensitiveOptions)}
                            getPopupContainer={selectGetPopupContainer}
                            value={text}
                            onChange={(val) => {
                                onFieldsChange(
                                    'single',
                                    'sensitive_flag',
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
                                !isEmptyCatalog && styles.fieldLabel,
                            )}
                        >
                            {__('来源系统')}
                        </span>
                        <div>
                            <Select
                                placeholder={__('批量配置')}
                                style={{ width: '100px' }}
                                options={DataProcessingList}
                                getPopupContainer={selectGetPopupContainer}
                                value={sourceSystemType}
                                onChange={(val) => {
                                    onFieldsChange('all', 'source_system', val)
                                }}
                            />
                        </div>
                    </div>
                ),
                key: 'source_system',
                dataIndex: 'source_system',
                width: 148,
                render: (text, record) => (
                    <ErrorTips errorText={record?.errorTips?.source_system}>
                        <Select
                            status={
                                record?.errorTips?.source_system ? 'error' : ''
                            }
                            placeholder={__('请选择')}
                            style={{ width: '100px' }}
                            options={DataProcessingList}
                            getPopupContainer={selectGetPopupContainer}
                            value={text}
                            onChange={(val) => {
                                onFieldsChange(
                                    'single',
                                    'source_system',
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
                                !isEmptyCatalog && styles.fieldLabel,
                            )}
                        >
                            {__('来源系统分类')}
                        </span>
                        <div>
                            <Select
                                placeholder={__('批量配置')}
                                style={{ width: '100px' }}
                                options={belongSystemClassifyList}
                                getPopupContainer={selectGetPopupContainer}
                                value={sourceSystemClassifyType}
                                onChange={(val) => {
                                    onFieldsChange(
                                        'all',
                                        'source_system_level',
                                        val,
                                    )
                                }}
                            />
                        </div>
                    </div>
                ),
                key: 'source_system_level',
                dataIndex: 'source_system_level',
                width: 148,
                render: (text, record) => (
                    <ErrorTips
                        errorText={record?.errorTips?.source_system_level}
                    >
                        <Select
                            status={
                                record?.errorTips?.source_system_level
                                    ? 'error'
                                    : ''
                            }
                            placeholder={__('请选择')}
                            style={{ width: '100px' }}
                            options={belongSystemClassifyList}
                            getPopupContainer={selectGetPopupContainer}
                            value={text}
                            onChange={(val) => {
                                onFieldsChange(
                                    'single',
                                    'source_system_level',
                                    val,
                                    record.id,
                                )
                            }}
                        />
                    </ErrorTips>
                ),
            },
            // {
            //     title: (
            //         <div className={styles.tableTitleContainer}>
            //             <span
            //                 className={classnames(
            //                     !isEmptyCatalog && styles.fieldLabel,
            //                 )}
            //             >
            //                 {__('信息项分级')}
            //             </span>
            //             <div>
            //                 <Select
            //                     placeholder={__('批量配置')}
            //                     style={{ width: '100px' }}
            //                     options={sensitivityLevelList}
            //                     getPopupContainer={selectGetPopupContainer}
            //                     value={infoItemLevel}
            //                     onChange={(val) => {
            //                         onFieldsChange(
            //                             'all',
            //                             'info_item_level',
            //                             val,
            //                         )
            //                     }}
            //                 />
            //             </div>
            //         </div>
            //     ),
            //     key: 'info_item_level',
            //     dataIndex: 'info_item_level',
            //     width: 148,
            //     render: (text, record) => (
            //         <ErrorTips errorText={record?.errorTips?.info_item_level}>
            //             <Select
            //                 status={
            //                     record?.errorTips?.info_item_level
            //                         ? 'error'
            //                         : ''
            //                 }
            //                 placeholder={__('请选择')}
            //                 style={{ width: '100px' }}
            //                 options={sensitivityLevelList}
            //                 getPopupContainer={selectGetPopupContainer}
            //                 value={text}
            //                 onChange={(val) => {
            //                     onFieldsChange(
            //                         'single',
            //                         'info_item_level',
            //                         val,
            //                         record.id,
            //                     )
            //                 }}
            //             />
            //         </ErrorTips>
            //     ),
            // },
            {
                title: (
                    <div className={styles.tableTitleContainer}>
                        <span className={styles.fieldLabel}>
                            {__('涉密属性')}
                        </span>
                        <div>
                            <Select
                                placeholder={__('批量配置')}
                                style={{ width: '100px' }}
                                options={getColorOptions(classifiedOptoins)}
                                getPopupContainer={selectGetPopupContainer}
                                value={classifiedType}
                                onChange={(val) => {
                                    if (showSecretDataTips && val === 1) {
                                        secretDataConfirm({
                                            type: 'all',
                                            key: 'classified_flag',
                                            value: val,
                                        })
                                    } else {
                                        onFieldsChange(
                                            'all',
                                            'classified_flag',
                                            val,
                                        )
                                    }
                                }}
                            />
                        </div>
                    </div>
                ),
                key: 'classified_flag',
                dataIndex: 'classified_flag',
                width: 128,
                render: (text, record, index) => (
                    <ErrorTips errorText={record?.errorTips?.classified_flag}>
                        <Select
                            status={
                                record?.errorTips?.classified_flag
                                    ? 'error'
                                    : ''
                            }
                            placeholder={__('请选择')}
                            style={{ width: '100px' }}
                            options={getColorOptions(classifiedOptoins)}
                            getPopupContainer={selectGetPopupContainer}
                            value={text}
                            onChange={(val) => {
                                if (showSecretDataTips && val === 1) {
                                    secretDataConfirm({
                                        type: 'single',
                                        key: 'classified_flag',
                                        value: val,
                                        id: record.id,
                                    })
                                } else {
                                    onFieldsChange(
                                        'single',
                                        'classified_flag',
                                        val,
                                        record.id,
                                    )
                                }
                            }}
                        />
                    </ErrorTips>
                ),
            },
            {
                title: (
                    <div className={styles.tableTitleContainer}>
                        <ErrorTips
                            errorText={
                                primaryRequired && timestampIsRequired
                                    ? __(
                                          '数据同步机制为增量，信息项更新时间戳需勾选一个',
                                      )
                                    : ''
                            }
                        >
                            <span
                                className={classnames(
                                    primaryRequired && styles.fieldLabel,
                                    primaryRequired &&
                                        timestampIsRequired &&
                                        styles.errorColor,
                                )}
                            >
                                {__('是否时间戳')}
                            </span>
                        </ErrorTips>
                        <div className={styles.tips}>{__('不支持批量')}</div>
                    </div>
                ),
                key: 'timestamp_flag',
                dataIndex: 'timestamp_flag',
                width: 110,
                render: (text, record, index) => (
                    <span
                        className={classnames(
                            timestampIsRequired &&
                                record?.isSelectedFlag &&
                                'any-fabric-ant-input-status-error',
                        )}
                    >
                        <RadioBox
                            checked={text}
                            onChange={(val) => {
                                onFieldsChange(
                                    'single',
                                    'timestamp_flag',
                                    val,
                                    record.id,
                                )
                            }}
                        />
                    </span>
                ),
            },
            {
                title: (
                    <div className={styles.tableTitleContainer}>
                        <ErrorTips
                            errorText={
                                primaryRequired && primaryIsRequired
                                    ? __(
                                          '数据同步机制为增量，信息项主键需勾选一个',
                                      )
                                    : ''
                            }
                        >
                            <span
                                className={classnames(
                                    primaryRequired && styles.fieldLabel,
                                    primaryRequired &&
                                        primaryIsRequired &&
                                        styles.errorColor,
                                )}
                            >
                                {__('是否主键')}
                            </span>
                        </ErrorTips>
                        <div className={styles.tips}>{__('不支持批量')}</div>
                    </div>
                ),
                key: 'primary_flag',
                dataIndex: 'primary_flag',
                width: 102,
                render: (text, record, index) => (
                    <span
                        className={classnames(
                            primaryIsRequired &&
                                record?.isSelectedFlag &&
                                'any-fabric-ant-input-status-error',
                        )}
                    >
                        <RadioBox
                            checked={text}
                            onChange={(val) => {
                                onFieldsChange(
                                    'single',
                                    'primary_flag',
                                    val,
                                    record.id,
                                )
                            }}
                        />
                    </span>
                ),
            },
            {
                title: __('操作'),
                key: 'action',
                width: 70,
                render: (_: string, record, index) => {
                    return (
                        <Button
                            type="link"
                            disabled={!!record?.source_id}
                            onClick={() => toDelete(index)}
                        >
                            {__('删除')}
                        </Button>
                    )
                },
            },
        ]
        const filteredColumns = useMemo(() => {
            let filterKeys: string[] = governmentStatus ? [] : governmentKeys
            if (resId) {
                filterKeys.push('action')
            }
            if (!mountResourceData?.length) {
                filterKeys.push('source_id')
            } else {
                filterKeys = filterKeys.filter((item) => item !== 'source_id')
            }
            return columns.filter((item) => !filterKeys.includes(item.key))
        }, [columns, governmentStatus, governmentKeys, mountResourceData])

        const scollerToErrorElement = (index) => {
            const errorList = document.querySelectorAll(
                '.any-fabric-ant-input-status-error, .any-fabric-ant-select-status-error, .any-fabric-ant-input-affix-wrapper-status-error',
            )
            errorList[index]?.scrollIntoView({
                inline: 'center',
                behavior: 'smooth',
            })
        }

        const toAdd = () => {
            onChange?.([
                ...value,
                {
                    business_name: '',
                    technical_name: '',
                    // 带字母id
                    id: `a-${value?.length}`,
                    // 添加默认值
                    shared_type: ShareTypeEnum.UNCONDITION, // 无条件共享
                    open_type: OpenTypeEnum.OPEN, // 无条件开放
                    sensitive_flag: 0, // 不敏感
                    classified_flag: 0, // 非涉密
                },
            ])
        }

        const toDelete = (index: number) => {
            onChange?.(value.filter((_, i) => i !== index))
        }

        const secretDataConfirm = (it: any) => {
            modalInfo({
                title: (
                    <div className={styles.modalInfoTitle}>{__('提示')}</div>
                ),
                icon: <ExclamationCircleFilled style={{ color: '#faad14' }} />,
                content: <div>{__('涉密数据不上网')}</div>,
                onOk() {
                    onFieldsChange(it.type, it.key, it.value, it?.id)
                    setShowSecretDataTips?.(false)
                },
                closable: true,
                okText: __('我知道了'),
            })
        }

        return (
            <div className={styles.fieldsTableWrapper}>
                <div className={styles.title}>
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
                                                setErrorIndex(errorIndex - 1)
                                            }
                                        }}
                                    />
                                </Tooltip>
                                <Tooltip title={__('下一个')}>
                                    <Button
                                        type="text"
                                        // disabled={errorIndex === errorInfos - 1}
                                        icon={<DownOutlined />}
                                        onClick={() => {
                                            if (errorIndex < errorInfos) {
                                                scollerToErrorElement(
                                                    errorIndex ===
                                                        errorInfos - 1
                                                        ? errorIndex
                                                        : errorIndex + 1,
                                                )
                                                if (
                                                    errorIndex !==
                                                    errorInfos - 1
                                                ) {
                                                    setErrorIndex(
                                                        errorIndex + 1,
                                                    )
                                                }
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
                        placeholder={__('搜索信息项业务名称、技术名称')}
                        className={styles.searchField}
                        onKeyChange={(kw: string) => {
                            setSearchKey(kw)
                        }}
                        style={{ width: '272px' }}
                    />
                </div>
                <div className={styles.tableContiner} ref={tableRef}>
                    <Table
                        pagination={false}
                        rowKey={(record, index) => index || 0}
                        dataSource={tableDataFilter}
                        className={styles.paramTable}
                        columns={filteredColumns}
                        components={components}
                        // rowSelection={
                        //     isEmptyCatalog || isEmptyCatalogEdit === 'true'
                        //         ? undefined
                        //         : rowSelection
                        // }
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
                        locale={{
                            emptyText: <Empty />,
                        }}
                    />
                </div>
                {isEmptyCatalog && (
                    <div className={styles.addBtn} onClick={toAdd}>
                        <AddOutlined />
                        {__('新建')}
                    </div>
                )}
            </div>
        )
    },
)
export default InfoItemEditTable
