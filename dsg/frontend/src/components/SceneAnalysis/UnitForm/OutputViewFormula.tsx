import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Select, Input, Radio, Table, Spin, Popover } from 'antd'
import ls, { trim } from 'lodash'
import classnames from 'classnames'
import { Node, StringExt } from '@antv/x6'
import { CloseCircleFilled, ExclamationCircleOutlined } from '@ant-design/icons'
import { ColumnsType } from 'antd/lib/table'
import update from 'immutability-helper'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import {
    CatalogType,
    IDataItem,
    IFormula,
    IFormulaFields,
    formatError,
    getDataEleDetailById,
    getDictDetailById,
    messageError,
} from '@/core'
import styles from './styles.module.less'
import { FieldErrorType, FormulaError, FormulaType, fieldInfos } from '../const'
import __ from '../locale'
import { dataEmptyView, IFormulaConfigEl } from './helper'
import ConfigHeader from './ConfigHeader'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import Icons from '@/components/BussinessConfigure/Icons'
import { checkOutputViewFormulaConfig, sceneAlsDataType } from '../helper'
import { SearchInput } from '@/ui'
import { lowercaseEnNumNameReg, useQuery } from '@/utils'
import SelDataByTypeModal from '@/components/SelDataByTypeModal'
import DataEleDetails from '@/components/DataEleManage/Details'
import { DraggableBodyRow } from './FieldsDragTable'
import { DragOutlined } from '@/icons'
import CodeTableDetails from '@/components/CodeTableManage/Details'
import DataOutPreview from './DataOutPreview'

/**
 * 输出自定义库表算子配置
 */
const OutputViewFormula = ({
    visible,
    graph,
    node,
    formulaData,
    fieldsData,
    viewSize = 0,
    dragExpand,
    onChangeExpand,
    onClose,
}: IFormulaConfigEl) => {
    type propName = 'alias' | 'name_en' | 'standard' | 'dict'
    const query = useQuery()
    const sRef: any = useRef(null)
    const dRef: any = useRef(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [dataOutVisible, setDataOutVisible] = useState(false)
    const [selDataVisible, setSelDataVisible] = useState<boolean>(false)
    // 数据元详情
    const [dataEleDetailVisible, setDataEleDetailVisible] =
        useState<boolean>(false)
    // 码表详情
    const [codeTbDetailVisible, setCodeTbDetailVisible] =
        useState<boolean>(false)
    // 当前的算子信息
    const [formulaItem, setFormulaItem] = useState<IFormula>()
    // 字段集合
    const [fieldItems, setFieldItems] = useState<any[]>([])
    // 编辑字段
    const [editItem, setEditItem] = useState<{
        id: string
        flag: propName
    }>()
    // 编辑字段信息
    const [editValue, setEditValue] = useState<string>()
    // 搜索关键字
    const [keyword, setKeyword] = useState('')
    // 搜索字段集合
    const [searchItems, setSearchItems] = useState<IFormulaFields[]>([])
    const [selDataItems, setSelDataItems] = useState<IDataItem[]>([])
    // 详情id
    const [showDEDetailId, setShowDEDetailId] = useState<string>()

    useMemo(() => {
        if (keyword) {
            setSearchItems(
                searchItems.map((info) => {
                    const findItem = fieldItems.find((d) => info.id === d.id)
                    if (findItem) {
                        return {
                            ...findItem,
                        }
                    }
                    return info
                }),
            )
        } else {
            setSearchItems([])
        }
    }, [fieldItems])

    useEffect(() => {
        if (visible && formulaData && node && graph) {
            checkData()
        }
    }, [visible, formulaData])

    const hasError = useMemo(() => {
        if (fieldItems.every((info) => info.editError?.length === 0)) {
            return false
        }
        return true
    }, [fieldItems])

    // 保存节点配置
    const handleSave = async () => {
        let error = false
        const checkFields = fieldItems.map((info, idx1) => {
            let { editError } = info
            const hasRep = !!fieldItems.find(
                (b, idx2) =>
                    b?.name_en?.toLowerCase() ===
                        info?.name_en?.toLowerCase() && idx1 !== idx2,
            )
            if (hasRep) {
                error = true
                editError = [...editError, FieldErrorType.EnRepeat]
            }
            if (handleCheckEnName(info, info.name_en)) {
                error = true
                editError = [...editError, FieldErrorType.IllegalCharacter]
            }
            return {
                ...info,
                editError,
            }
        })
        if (hasError || error) {
            setFieldItems(checkFields)
            messageError(__('请先修改错误'))
            return
        }

        const { formula } = node!.data
        const configData: any[] = fieldItems.map((info) => {
            const newId = StringExt.uuid()
            const tempItem = ls.omit(info, ['editError'])
            return {
                ...tempItem,
                outId: info?.outId || newId,
                originName: tempItem.alias,
            }
        })
        const outData = configData.map((info) => {
            const tempItem = ls.omit(info, [
                'standard_code',
                'standard_name',
                'dict_id',
                'dict_id',
                'dict_name',
                'primary_key',
                'standard_deleted',
                'standard_state',
                'dict_deleted',
                'dict_state',
            ])
            return { ...tempItem, data_type: info.type }
        })
        node!.replaceData({
            ...node?.data,
            formula: formula.map((info) => {
                if (info.id === formulaItem?.id) {
                    const tempFl = info
                    delete tempFl.errorMsg
                    return {
                        ...tempFl,
                        config: {
                            config_fields: configData,
                            output_view: configData,
                        },
                        output_fields: outData,
                    }
                }
                return info
            }),
        })
        onClose()
    }

    const clearData = () => {
        setFormulaItem(undefined)
        setFieldItems([])
        setEditItem(undefined)
        setEditValue(undefined)
        setKeyword('')
        setSearchItems([])
        setSelDataItems([])
        setShowDEDetailId('')
    }

    // 检查更新数据
    const checkData = async () => {
        setLoading(true)
        clearData()
        const { preOutData } = checkOutputViewFormulaConfig(
            graph!,
            node!,
            formulaData!,
            fieldsData,
        )
        const realFormula = node!.data.formula.find(
            (info) => info.id === formulaData!.id,
        )
        setFormulaItem(realFormula)
        const { config, errorMsg } = realFormula
        if (
            errorMsg &&
            ![FormulaError.ConfigError, FormulaError.NodeChange].includes(
                errorMsg as FormulaError,
            )
        ) {
            setTimeout(() => {
                setLoading(false)
            }, 400)
            return
        }
        let tempFields
        if (config) {
            const { config_fields } = config
            tempFields = preOutData.map((info) => {
                let findItem = config_fields.find((d) => d.id === info.id)
                if (findItem) {
                    const dataType =
                        info?.data_type ||
                        fieldsData.data.find((d) => d.id === info.id)?.data_type
                    if (dataType !== findItem.type) {
                        return {
                            ...findItem,
                            editError: [FieldErrorType.Inconformity],
                        }
                    }
                    return {
                        ...findItem,
                        editError: [],
                    }
                }
                findItem = fieldsData.data.find((d) => d.id === info.id)
                return {
                    ...info,
                    primary_key: findItem?.primary_key ?? false,
                    name_en: info?.name_en || findItem?.name_en,
                    type: info?.data_type || findItem?.data_type,
                    dict_id: info?.dict_id || findItem?.dict_id,
                    dict_name: info?.dict_name || findItem?.dict_name,
                    standard_code:
                        info?.standard_code || findItem?.standard_code,
                    standard_name:
                        info?.standard_name || findItem?.standard_name,
                    editError: [],
                }
            })
        } else {
            tempFields = preOutData.map((info) => {
                const findItem = fieldsData.data.find((d) => d.id === info.id)
                return {
                    ...info,
                    primary_key: findItem?.primary_key ?? false,
                    name_en: info?.name_en || findItem?.name_en,
                    type: info?.data_type || findItem?.data_type,
                    dict_id: info?.dict_id || findItem?.dict_id,
                    dict_name: info?.dict_name || findItem?.dict_name,
                    dict_deleted: findItem?.code_table_status === 'deleted',
                    dict_state:
                        findItem?.code_table_status === 'disable'
                            ? 'disable'
                            : 'enable',
                    standard_code:
                        info?.standard_code || findItem?.standard_code,
                    standard_name:
                        info?.standard_name || findItem?.standard_name,
                    editError: [],
                }
            })
        }
        if (tempFields.filter((info) => info.primary_key).length > 1) {
            setFieldItems(
                tempFields.map((info) => ({ ...info, primary_key: false })),
            )
        } else {
            setFieldItems(tempFields)
        }

        setTimeout(() => {
            setLoading(false)
        }, 400)
    }

    // 搜索字段
    const handleSearchField = (kw: string) => {
        setSearchItems(
            fieldItems?.filter((info) => {
                return (
                    info.alias?.includes(kw) ||
                    info.alias?.match(new RegExp(kw, 'ig')) ||
                    info?.name_en?.includes(kw) ||
                    info?.name_en?.match(new RegExp(kw, 'ig'))
                )
            }) || [],
        )
        setKeyword(kw)
    }

    // 名称合法性检查
    const handleCheckEnName = (
        item: any,
        value: string,
        set: boolean = false,
    ): boolean => {
        const trimValue = trim(value)
        if (!trimValue) {
            return false
            // setFieldItems(
            //     getFieldItems().map((info) => {
            //         if (item.id === info.id) {
            //             return {
            //                 ...info,
            //                 editError: [
            //                     ...info.editError,
            //                     FieldErrorType.EnEmpty,
            //                 ],
            //             }
            //         }
            //         return info
            //     }),
            // )
            // return true
        }
        if (!lowercaseEnNumNameReg.test(trim(value))) {
            if (set) {
                setFieldItems(
                    fieldItems.map((info, idx) => {
                        if (item.id === info.id) {
                            return {
                                ...info,
                                editError: [
                                    ...info.editError.filter(
                                        (err) => err !== FieldErrorType.EnEmpty,
                                    ),
                                    FieldErrorType.IllegalCharacter,
                                ],
                            }
                        }
                        return info
                    }),
                )
            }
            return true
        }
        if (set) {
            setFieldItems(
                fieldItems.map((info, idx) => {
                    if (item.id === info.id) {
                        return {
                            ...info,
                            editError: info.editError.filter(
                                (err) =>
                                    ![
                                        FieldErrorType.IllegalCharacter,
                                        FieldErrorType.EnEmpty,
                                        FieldErrorType.EnRepeat,
                                    ].includes(err),
                            ),
                        }
                    }
                    return info
                }),
            )
        }
        return false
    }

    // 主键变更
    const handleChangeUnique = (item: any) => {
        setFieldItems(
            fieldItems.map((info, idx) => {
                if (item.id === info.id) {
                    return {
                        ...info,
                        primary_key: true,
                    }
                }
                return {
                    ...info,
                    primary_key: false,
                }
            }),
        )
    }

    // 字段开始改动
    const handleStartChange = (item: any, flag: 'alias' | 'name_en') => {
        if (item.editError.length > 0) {
            setFieldItems(
                fieldItems.map((info) => {
                    if (item.id === info.id) {
                        return {
                            ...info,
                            editError: info.editError.filter(
                                (err) =>
                                    err !==
                                    (flag === 'alias'
                                        ? FieldErrorType.Repeat
                                        : FieldErrorType.EnRepeat),
                            ),
                        }
                    }
                    return info
                }),
            )
        }
    }

    // 确定修改字段名称
    const handleSureFieldName = (item: any, flag: 'alias' | 'name_en') => {
        let name = trim(editValue)
        if (!name) {
            name = item?.[flag]
        }
        let tempData = fieldItems.slice()
        if (
            !tempData
                .filter((info) => info.id !== item.id)
                .every(
                    (info) =>
                        info?.[flag] !== name &&
                        info?.[flag]?.toLowerCase() !== name?.toLowerCase(),
                )
        ) {
            tempData = tempData.map((info, idx) => {
                if (info.id === item.id) {
                    const editError = [
                        ...info.editError.filter(
                            (err) =>
                                !(
                                    flag === 'alias'
                                        ? [FieldErrorType.Empty]
                                        : [FieldErrorType.EnEmpty]
                                ).includes(err),
                        ),
                        flag === 'alias'
                            ? FieldErrorType.Repeat
                            : FieldErrorType.EnRepeat,
                    ]
                    if (item?.[flag] !== name) {
                        return {
                            ...info,
                            [flag]: name,
                            editError,
                        }
                    }
                    return {
                        ...info,
                        editError,
                    }
                }
                return info
            })
        } else {
            tempData = tempData.map((info, idx) => {
                if (info.id === item.id) {
                    const editError = info.editError.filter(
                        (err) =>
                            !(
                                flag === 'alias'
                                    ? [FieldErrorType.Repeat]
                                    : [
                                          FieldErrorType.EnEmpty,
                                          FieldErrorType.EnRepeat,
                                      ]
                            ).includes(err),
                    )
                    if (item?.[flag] !== name) {
                        return {
                            ...info,
                            [flag]: name,
                            editError,
                        }
                    }
                    return { ...info, editError }
                }
                return info
            })
        }
        tempData = tempData.map((a, idx1) => {
            const hasRep = !!tempData.find(
                (b, idx2) =>
                    b?.[flag]?.toLowerCase() === a?.[flag]?.toLowerCase() &&
                    idx1 !== idx2,
            )
            if (hasRep) {
                return a
            }
            return {
                ...a,
                editError: a.editError.filter(
                    (err) =>
                        err !==
                        (flag === 'alias'
                            ? FieldErrorType.Repeat
                            : FieldErrorType.EnRepeat),
                ),
            }
        })
        setFieldItems(tempData)
        setEditItem(undefined)
    }

    // 检查名称重复
    const checkNameRepeat = (itemId?: string, items = fieldItems) => {
        return items.map((a, idx1) => {
            const hasNameRep = !!items.find(
                (b, idx2) =>
                    b?.alias?.toLowerCase() === a?.alias?.toLowerCase() &&
                    idx1 !== idx2,
            )
            const hasEnNameRep = !!items.find(
                (b, idx2) =>
                    b?.name_en?.toLowerCase() === a?.name_en?.toLowerCase() &&
                    idx1 !== idx2,
            )
            if (a.id === itemId) {
                let tempItem = {
                    ...a,
                    editError: a.editError.filter(
                        (err) =>
                            ![
                                FieldErrorType.Repeat,
                                FieldErrorType.EnRepeat,
                            ].includes(err),
                    ),
                }
                if (hasNameRep) {
                    tempItem = {
                        ...tempItem,
                        editError: [
                            ...tempItem.editError,
                            FieldErrorType.Repeat,
                        ],
                    }
                }
                if (hasEnNameRep) {
                    tempItem = {
                        ...tempItem,
                        editError: [
                            ...tempItem.editError,
                            FieldErrorType.EnRepeat,
                        ],
                    }
                }
                return tempItem
            }
            let errs: FieldErrorType[] = []
            if (!hasNameRep) {
                errs = [...errs, FieldErrorType.Repeat]
            }
            if (!hasEnNameRep) {
                errs = [...errs, FieldErrorType.EnRepeat]
            }
            return {
                ...a,
                editError: a.editError.filter((err) => !errs.includes(err)),
            }
        })
    }

    // 检查结果类型显示 true-不一致
    const checkDataType = (item): boolean => {
        if (
            item.type !==
            (item?.data_type ||
                fieldsData.data.find((d) => d.id === item.id)?.data_type)
        ) {
            return true
        }
        return false
    }

    // 配置数据元
    const handleSelDataEle = async (newDataEle: any) => {
        const dataEleCode = newDataEle?.code
        if (!dataEleCode) return
        try {
            let fieldItem = fieldItems.find((info) => info.id === editItem?.id)
            // 获取标准详情
            const { data } = await getDataEleDetailById({
                type: 2,
                value: dataEleCode,
            })
            const {
                id,
                code,
                name_cn,
                name_en,
                deleted,
                state,
                dict_id,
                data_type,
            } = data
            fieldItem = {
                ...fieldItem,
                alias: name_cn,
                name_en,
                standard_code: id,
                standard_name: name_cn,
                standard_deleted: deleted,
                standard_state: state,
                type: sceneAlsDataType.find((t) => t.id === data_type)
                    ?.value_en,
            }
            if (dict_id) {
                // // 获取码表详情
                // const { data: dictData } = await getDictDetailById(dict_id)
                // const {
                //     code: dict_code,
                //     ch_name: dict_name,
                //     deleted: dict_deleted,
                //     state: dict_state,
                // } = dictData
                fieldItem = {
                    ...fieldItem,
                    dict_id: data.dict_id,
                    dict_name: data.dict_name_cn,
                    dict_deleted: data.dict_deleted,
                    dict_state: data.dict_state,
                }
            } else {
                fieldItem = {
                    ...fieldItem,
                    dict_id: undefined,
                    dict_name: undefined,
                    dict_deleted: undefined,
                    dict_state: undefined,
                }
            }
            const tempItems = fieldItems.map((info) => {
                if (info.id === editItem?.id) {
                    let errs: FieldErrorType[] = []
                    if (checkDataType(fieldItem)) {
                        errs = [...errs, FieldErrorType.Inconformity]
                    }
                    if (handleCheckEnName(fieldItem, name_en)) {
                        errs = [...errs, FieldErrorType.IllegalCharacter]
                    }
                    const editError = info.editError.filter(
                        (e) =>
                            ![
                                FieldErrorType.EnEmpty,
                                FieldErrorType.IllegalCharacter,
                                FieldErrorType.Inconformity,
                            ].includes(e),
                    )
                    return {
                        ...fieldItem,
                        editError: [...editError, ...errs],
                    }
                }
                return info
            })
            setFieldItems(checkNameRepeat(editItem?.id, tempItems))
        } catch (err) {
            formatError(err)
        } finally {
            setEditItem(undefined)
        }
    }

    // 配置码表
    const handleSelDict = async (newDataEle: any) => {
        const dictId = newDataEle?.key
        if (!dictId) return
        try {
            let fieldItem = fieldItems.find((info) => info.id === editItem?.id)
            const { data: dictData } = await getDictDetailById(dictId)
            const {
                ch_name: dict_name,
                deleted: dict_deleted,
                state: dict_state,
            } = dictData
            fieldItem = {
                ...fieldItem,
                dict_id: dictId,
                dict_name,
                dict_deleted,
                dict_state,
            }
            setFieldItems(
                fieldItems.map((info) => {
                    if (info.id === editItem?.id) {
                        return fieldItem
                    }
                    return info
                }),
            )
        } catch (err) {
            formatError(err)
        } finally {
            setEditItem(undefined)
        }
    }

    // 清除已选标准
    const clearStandard = (item) => {
        setFieldItems(
            fieldItems.map((info) => {
                if (info.id === item.id) {
                    return {
                        ...info,
                        standard_code: undefined,
                        standard_name: undefined,
                        standard_deleted: undefined,
                        standard_state: undefined,
                        type:
                            info?.data_type ||
                            fieldsData.data.find((d) => d.id === info.id)
                                ?.data_type,
                        editError: info.editError.filter(
                            (err) => err !== FieldErrorType.Inconformity,
                        ),
                    }
                }
                return info
            }),
        )
    }

    // 清除已选码表
    const clearDict = (item) => {
        setFieldItems(
            fieldItems.map((info) => {
                if (info.id === item.id) {
                    return {
                        ...info,
                        dict_id: undefined,
                        dict_name: undefined,
                        dict_deleted: undefined,
                        dict_state: undefined,
                    }
                }
                return info
            }),
        )
    }

    // 检查错误提示
    const checkErrorTip = (
        record: any,
        flag: propName,
    ): { error: string; width: number } => {
        const item = fieldItems.find((info) => info.id === record.id)
        let tip
        let width = 144
        if (flag === 'alias') {
            // if (item.editError.includes(FieldErrorType.Inconformity)) {
            //     tip = __('关联数据标准的数据类型与字段数据类型不一致')
            //     width = 326
            // } else
            if (item.editError.includes(FieldErrorType.Repeat)) {
                tip = __('该业务名称已存在，请重新输入')
                width = 228
            }
        }
        if (flag === 'name_en') {
            if (item.editError.includes(FieldErrorType.EnEmpty)) {
                tip = __('技术名称不能为空')
                width = 144
            } else if (
                item.editError.includes(FieldErrorType.IllegalCharacter)
            ) {
                tip = __('仅支持小写字母、数字及下划线，且不能以数字开头')
                width = 354
            } else if (item.editError.includes(FieldErrorType.EnRepeat)) {
                tip = __('该技术名称已存在，请重新输入')
                width = 228
            }
        }
        if (flag === 'standard') {
            width = 158
            if (item.editError.includes(FieldErrorType.Inconformity)) {
                tip = __('关联数据标准的数据类型与字段数据类型不一致')
                width = 326
            }
        }
        return { error: tip, width }
    }

    const redDot = (
        <span
            style={{
                color: '#F5222D',
                fontFamily: 'SimSun, sans-serif',
                marginRight: 4,
            }}
        >
            *
        </span>
    )

    const customColumns: ColumnsType<any> = [
        {
            title: (
                <span>
                    {redDot}
                    {__('业务名称')}
                </span>
            ),
            dataIndex: 'alias',
            key: 'alias',
            width: '26%',
            render: (_, record) => {
                const { error, width } = checkErrorTip(record, 'alias')
                return (
                    <span className={styles.rowNameWrap}>
                        <DragOutlined
                            className={styles.dragIcon}
                            hidden={!!keyword}
                        />
                        <Input
                            placeholder={__('请输入业务名称')}
                            allowClear
                            maxLength={255}
                            prefix={
                                <Icons
                                    type={
                                        record?.data_type ||
                                        fieldsData.data.find(
                                            (d) => d.id === record.id,
                                        )?.data_type
                                    }
                                />
                            }
                            status={error ? 'error' : undefined}
                            value={
                                editItem?.id === record.id &&
                                editItem?.flag === 'alias'
                                    ? editValue
                                    : record?.alias
                            }
                            onChange={(e) => {
                                handleStartChange(record, 'alias')
                                setEditValue(e.target.value)
                            }}
                            onFocus={() => {
                                setEditItem({ id: record.id, flag: 'alias' })
                                setEditValue(record?.alias)
                            }}
                            onBlur={() => handleSureFieldName(record, 'alias')}
                        />
                        {error && (
                            <Popover
                                content={error}
                                getPopupContainer={(n) => n.parentElement || n}
                                overlayInnerStyle={{ minWidth: width }}
                                placement="right"
                            >
                                <ExclamationCircleOutlined
                                    className={styles.errIcon}
                                />
                            </Popover>
                        )}
                    </span>
                )
            },
        },
        {
            title: (
                <span>
                    {redDot}
                    {__('技术名称')}
                </span>
            ),
            dataIndex: 'name_en',
            key: 'name_en',
            width: '26%',
            render: (_, record) => {
                const { error, width } = checkErrorTip(record, 'name_en')
                return (
                    <span className={styles.rowNameWrap}>
                        <Input
                            placeholder={__('请输入技术名称')}
                            allowClear
                            maxLength={100}
                            status={error ? 'error' : undefined}
                            value={
                                editItem?.id === record.id &&
                                editItem?.flag === 'name_en'
                                    ? editValue
                                    : record?.name_en
                            }
                            onChange={(e) => {
                                handleStartChange(record, 'name_en')
                                setEditValue(e.target.value)
                                handleCheckEnName(record, e.target.value, true)
                            }}
                            onFocus={() => {
                                setEditItem({ id: record.id, flag: 'name_en' })
                                setEditValue(record?.name_en)
                            }}
                            onBlur={() =>
                                handleSureFieldName(record, 'name_en')
                            }
                        />
                        {error && (
                            <Popover
                                content={error}
                                getPopupContainer={(n) => n.parentElement || n}
                                overlayInnerStyle={{ minWidth: width }}
                                placement="right"
                            >
                                <ExclamationCircleOutlined
                                    className={styles.errIcon}
                                />
                            </Popover>
                        )}
                    </span>
                )
            },
        },
        {
            title: <span>{__('是否主键')}</span>,
            dataIndex: 'primary_key',
            key: 'primary_key',
            width: 100,
            render: (value, record) => {
                return (
                    <Radio
                        checked={value}
                        onChange={() => handleChangeUnique(record)}
                    >
                        {value ? __('是') : __('否')}
                    </Radio>
                )
            },
        },
        // {
        //     title: <span>{__('数据类型')}</span>,
        //     dataIndex: 'type',
        //     key: 'type',
        //     width: 120,
        //     render: (value, record) => fieldInfos[value]?.name || '--',
        // },
        // {
        //     title: <span>{__('关联数据标准')}</span>,
        //     dataIndex: 'standard',
        //     key: 'standard',
        //     render: (_, record) => {
        //         const { error, width } = checkErrorTip(record, 'standard')
        //         const options = record?.standard_code
        //             ? [
        //                   {
        //                       label: (
        //                           <div className={styles.dataElOptionLabel}>
        //                               <span
        //                                   title={record.standard_name}
        //                                   className={classnames(
        //                                       styles.optionLabelName,
        //                                       (record.standard_deleted ||
        //                                           record.standard_state ===
        //                                               'disable') &&
        //                                           styles.errorName,
        //                                   )}
        //                               >
        //                                   {record.standard_name}
        //                               </span>
        //                               {record.standard_deleted && (
        //                                   <span className={styles.errorTag}>
        //                                       {__('已删除')}
        //                                   </span>
        //                               )}
        //                               {record.standard_state === 'disable' && (
        //                                   <span
        //                                       className={classnames(
        //                                           styles.errorTag,
        //                                           styles.disable,
        //                                       )}
        //                                   >
        //                                       {__('已停用')}
        //                                   </span>
        //                               )}
        //                           </div>
        //                       ),
        //                       value: record.standard_code,
        //                   },
        //               ]
        //             : []
        //         return (
        //             <span className={styles.rowNameWrap}>
        //                 <span className={styles.rowName}>
        //                     <Select
        //                         ref={sRef}
        //                         style={{ width: '100%' }}
        //                         placeholder={__('选择关联数据标准')}
        //                         options={options}
        //                         value={record?.standard_code}
        //                         open={false}
        //                         suffixIcon={<a>{__('选择')}</a>}
        //                         onClick={(e) => {
        //                             e.stopPropagation()
        //                             setEditItem({
        //                                 id: record.id,
        //                                 flag: 'standard',
        //                             })
        //                             setSelDataVisible(true)
        //                             sRef?.current?.blur()
        //                         }}
        //                         status={error ? 'error' : undefined}
        //                     />
        //                     <CloseCircleFilled
        //                         className={styles.clearIcon}
        //                         style={{
        //                             visibility: !record.standard_code
        //                                 ? 'hidden'
        //                                 : undefined,
        //                         }}
        //                         onClick={(e) => {
        //                             e.stopPropagation()
        //                             clearStandard(record)
        //                         }}
        //                     />
        //                 </span>
        //                 {error && (
        //                     <Popover
        //                         content={error}
        //                         getPopupContainer={(n) => n.parentElement || n}
        //                         overlayInnerStyle={{ minWidth: width }}
        //                         placement="right"
        //                     >
        //                         <ExclamationCircleOutlined
        //                             className={styles.errIcon}
        //                         />
        //                     </Popover>
        //                 )}
        //             </span>
        //         )
        //     },
        // },
        // {
        //     title: <span>{__('关联码表')}</span>,
        //     dataIndex: 'dict',
        //     key: 'dict',
        //     render: (_, record) => {
        //         const options = record?.dict_id
        //             ? [
        //                   {
        //                       label: (
        //                           <div className={styles.dataElOptionLabel}>
        //                               <span
        //                                   title={record.dict_name}
        //                                   className={classnames(
        //                                       styles.optionLabelName,
        //                                       (record.dict_deleted ||
        //                                           record.dict_state ===
        //                                               'disable') &&
        //                                           styles.errorName,
        //                                   )}
        //                               >
        //                                   {record.dict_name}
        //                               </span>
        //                               {record.dict_deleted && (
        //                                   <span className={styles.errorTag}>
        //                                       {__('已删除')}
        //                                   </span>
        //                               )}
        //                               {record.dict_state === 'disable' && (
        //                                   <span
        //                                       className={classnames(
        //                                           styles.errorTag,
        //                                           styles.disable,
        //                                       )}
        //                                   >
        //                                       {__('已停用')}
        //                                   </span>
        //                               )}
        //                           </div>
        //                       ),
        //                       value: record.dict_id,
        //                   },
        //               ]
        //             : []
        //         const disabled = !!record?.standard_code
        //         return (
        //             <span className={styles.rowNameWrap}>
        //                 <span className={styles.rowName}>
        //                     <Select
        //                         ref={dRef}
        //                         style={{ width: '100%' }}
        //                         placeholder={
        //                             disabled && !record.dict_id
        //                                 ? __('暂无码表')
        //                                 : __('选择关联码表')
        //                         }
        //                         options={options}
        //                         value={record?.dict_id}
        //                         open={false}
        //                         disabled={disabled}
        //                         onClick={(e) => {
        //                             e.stopPropagation()
        //                             if (disabled) return
        //                             setEditItem({ id: record.id, flag: 'dict' })
        //                             setSelDataVisible(true)
        //                             dRef?.current?.blur()
        //                         }}
        //                         suffixIcon={
        //                             <a
        //                                 style={{
        //                                     color: disabled
        //                                         ? 'rgba(18,110,227,0.25)'
        //                                         : '#126ee3',
        //                                 }}
        //                             >
        //                                 {__('选择')}
        //                             </a>
        //                         }
        //                     />
        //                     <CloseCircleFilled
        //                         className={styles.clearIcon}
        //                         style={{
        //                             visibility:
        //                                 !record.dict_id || disabled
        //                                     ? 'hidden'
        //                                     : undefined,
        //                         }}
        //                         onClick={(e) => {
        //                             e.stopPropagation()
        //                             clearDict(record)
        //                         }}
        //                     />
        //                 </span>
        //             </span>
        //         )
        //     },
        // },
    ]

    const components = {
        body: {
            row: DraggableBodyRow,
        },
    }

    // 移动行
    const moveRow = useCallback(
        (dragIndex: number, hoverIndex: number) => {
            const dragRow = fieldItems[dragIndex]
            setFieldItems(
                update(fieldItems, {
                    $splice: [
                        [dragIndex, 1],
                        [hoverIndex, 0, dragRow],
                    ],
                }),
            )
        },
        [fieldItems],
    )

    return (
        <div className={styles.outputViewFormulaWrap}>
            <ConfigHeader
                node={node}
                formulaItem={formulaItem}
                loading={loading}
                dragExpand={dragExpand}
                onChangeExpand={onChangeExpand}
                onClose={() => onClose(false)}
                onSure={() => handleSave()}
            />
            {loading ? (
                <Spin className={styles.ldWrap} />
            ) : (
                <div className={styles.of_contentWrap}>
                    {!formulaItem?.errorMsg ||
                    [
                        FormulaError.ConfigError,
                        FormulaError.NodeChange,
                    ].includes(formulaItem.errorMsg as FormulaError) ? (
                        <>
                            <div className={styles.of_contentTopWrap}>
                                <span className={styles.crt_tit}>
                                    {__('字段列表')}
                                    <span
                                        className={classnames(
                                            styles.crt_link,
                                            hasError && styles.linkDisabled,
                                        )}
                                        onClick={() => {
                                            if (!hasError) {
                                                setDataOutVisible(true)
                                            }
                                        }}
                                    >
                                        {__('预览输出字段')}
                                    </span>
                                </span>
                                <SearchInput
                                    style={{ width: 272 }}
                                    maxLength={255}
                                    placeholder={__(
                                        '搜索输出业务名称、技术名称',
                                    )}
                                    onKeyChange={handleSearchField}
                                    onPressEnter={(e: any) =>
                                        handleSearchField(e.target.value.trim())
                                    }
                                />
                            </div>
                            <DndProvider backend={HTML5Backend}>
                                <Table
                                    columns={customColumns}
                                    dataSource={
                                        keyword ? searchItems : fieldItems
                                    }
                                    components={components}
                                    onRow={(record, index) => {
                                        const attr = {
                                            index,
                                            canDrag:
                                                !keyword &&
                                                editItem?.id !== record.id,
                                            moveRow,
                                        }
                                        return attr as React.HTMLAttributes<any>
                                    }}
                                    rowClassName={styles.of_tableRowWrap}
                                    rowKey={(record) => record.id}
                                    pagination={false}
                                    scroll={{
                                        y:
                                            (window.innerHeight - 52) *
                                                (viewSize / 100) -
                                            155,
                                    }}
                                    locale={{
                                        emptyText: keyword ? (
                                            <Empty />
                                        ) : (
                                            <Empty
                                                iconSrc={dataEmpty}
                                                desc={__('暂无数据')}
                                            />
                                        ),
                                    }}
                                />
                            </DndProvider>
                        </>
                    ) : (
                        dataEmptyView(formulaItem?.errorMsg, formulaItem?.type)
                    )}
                </div>
            )}
            <DataOutPreview
                visible={dataOutVisible}
                items={fieldItems}
                fieldsData={fieldsData}
                allowPrimary
                formulaType={FormulaType.OUTPUTVIEW}
                onClose={() => setDataOutVisible(false)}
            />
            <SelDataByTypeModal
                visible={selDataVisible}
                onClose={() => setSelDataVisible(false)}
                dataType={
                    editItem?.flag === 'standard'
                        ? CatalogType.DATAELE
                        : CatalogType.CODETABLE
                }
                oprItems={[]}
                setOprItems={setSelDataItems}
                onOk={(oprItems: any) => {
                    if (editItem?.flag === 'standard') {
                        handleSelDataEle(oprItems?.[0])
                    } else {
                        handleSelDict(oprItems?.[0])
                    }
                }}
                handleShowDataDetail={(
                    dataType: CatalogType,
                    dataId?: string,
                ) => {
                    setShowDEDetailId(dataId || '')
                    if (dataId) {
                        if (editItem?.flag === 'standard') {
                            setDataEleDetailVisible(true)
                        } else {
                            setCodeTbDetailVisible(true)
                        }
                    }
                }}
            />
            {dataEleDetailVisible && showDEDetailId && (
                <DataEleDetails
                    visible={dataEleDetailVisible}
                    dataEleId={showDEDetailId}
                    onClose={() => {
                        setDataEleDetailVisible(false)
                        setShowDEDetailId(undefined)
                    }}
                />
            )}
            {codeTbDetailVisible && showDEDetailId && (
                <CodeTableDetails
                    visible={codeTbDetailVisible}
                    dictId={showDEDetailId}
                    onClose={() => {
                        setCodeTbDetailVisible(false)
                        setShowDEDetailId(undefined)
                    }}
                />
            )}
        </div>
    )
}

export default OutputViewFormula
