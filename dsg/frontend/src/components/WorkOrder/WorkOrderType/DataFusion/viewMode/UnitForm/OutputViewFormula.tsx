import React, {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'
import { Select, Input, Table, Spin, Popover } from 'antd'
import ls, { pick, trim } from 'lodash'
import classnames from 'classnames'
import { Node, StringExt } from '@antv/x6'
import { CheckCircleFilled, ExclamationCircleOutlined } from '@ant-design/icons'
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
import { enBeginNameReg, ErrorInfo, keyboardReg } from '@/utils'
import SelDataByTypeModal from '@/components/SelDataByTypeModal'
import DataEleDetails from '@/components/DataEleManage/Details'
import { DraggableBodyRow } from './FieldsDragTable'
import { DragOutlined } from '@/icons'
import CodeTableDetails from '@/components/CodeTableManage/Details'
import DataOutPreview from './DataOutPreview'
import { useViewGraphContext } from '../ViewGraphProvider'
import { FixedType } from '@/components/CommonTable/const'
import { getDataEleDetail } from '../../helper'
import CodeRuleDetails from '@/components/CodeRulesComponent/CodeRuleDetails'
import NumberInput from '@/ui/NumberInput'
import { NumberType } from '@/ui/NumberInput/const'

/**
 * 输出自定义库表算子配置
 */
const OutputViewFormula = forwardRef((props: IFormulaConfigEl, ref) => {
    const {
        visible,
        graph,
        node,
        formulaData,
        fieldsData,
        viewSize = 0,
        dragExpand,
        onChangeExpand,
        onClose,
    } = props
    const {
        setContinueFn,
        viewMode,
        viewHeight = window.innerHeight - 52,
    } = useViewGraphContext()

    type propName =
        | 'alias'
        | 'name_en'
        | 'standard_id'
        | 'code_table_id'
        | 'code_rule_id'
        | 'data_length'
        | 'data_accuracy'
        | 'data_type'
    const tableRef: any = useRef()
    const standardIdRef: any = useRef(null)
    const codeTableIdRef: any = useRef(null)
    const codeRuleIdRef: any = useRef(null)
    const [preOutputFields, setPreOutputFields] = useState<any[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [dataOutVisible, setDataOutVisible] = useState(false)
    const [selDataVisible, setSelDataVisible] = useState<boolean>(false)
    // 数据元详情
    const [dataEleDetailVisible, setDataEleDetailVisible] =
        useState<boolean>(false)
    // 码表详情
    const [codeTbDetailVisible, setCodeTbDetailVisible] =
        useState<boolean>(false)
    // 编码规则详情
    const [codeRuleDetailVisible, setCodeRuleDetailVisible] =
        useState<boolean>(false)
    // 当前的算子信息
    const [formulaItem, setFormulaItem] = useState<IFormula>()
    // 字段集合
    const [fieldItems, setFieldItems] = useState<any[]>([])
    // 编辑字段
    const [editItem, setEditItem] = useState<{
        id: string
        sourceId: string
        flag: propName
        [key: string]: any
    }>()
    // 编辑字段信息
    const [editValue, setEditValue] = useState<any>()
    // 搜索关键字
    const [keyword, setKeyword] = useState('')
    // 搜索字段集合
    const [searchItems, setSearchItems] = useState<IFormulaFields[]>([])
    const [selDataItems, setSelDataItems] = useState<IDataItem[]>([])
    // 详情id
    const [showDEDetailId, setShowDEDetailId] = useState<string>()
    // 记录有变动
    const [valuesChange, setValuesChange] = useState<boolean>(false)

    const inViewMode = useMemo(() => viewMode === 'view', [viewMode])

    useImperativeHandle(ref, () => ({
        checkSaveChanged,
        onSave: handleSave,
    }))

    // 检查算子保存变更
    const checkSaveChanged = (): Promise<boolean> => {
        if (!node) return Promise.resolve(false)
        const realFormula = node.data.formula.find(
            (info) => info.id === formulaData!.id,
        )
        if (!realFormula) return Promise.resolve(false)
        setFormulaItem(realFormula)
        const { errorMsg, config, output_fields } = realFormula
        if (
            errorMsg &&
            ![FormulaError.ConfigError, FormulaError.NodeChange].includes(
                errorMsg as FormulaError,
            )
        ) {
            return Promise.resolve(false)
        }
        if (valuesChange) {
            return Promise.resolve(true)
        }
        return Promise.resolve(false)
    }

    useMemo(() => {
        if (keyword) {
            setSearchItems(
                searchItems.map((info) => {
                    const findItem = fieldItems.find(
                        (d) =>
                            `${info.id}_${info.sourceId}` ===
                            `${d.id}_${d.sourceId}`,
                    )
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

    const checkError = (item: any, flag: propName): FieldErrorType[] => {
        const errs: FieldErrorType[] = []
        switch (flag) {
            case 'alias':
                if (
                    fieldItems.find(
                        (b, idx) =>
                            b?.[flag]?.toLowerCase() ===
                                item?.[flag]?.toLowerCase() &&
                            `${item?.id}_${item?.sourceId}` !==
                                `${b?.id}_${b?.sourceId}`,
                    )
                ) {
                    errs.push(FieldErrorType.Repeat)
                }
                if (!keyboardReg.test(item?.[flag])) {
                    errs.push(FieldErrorType.IllegalCharacter)
                }
                return errs
            case 'name_en':
                if (!item?.[flag]) {
                    return [FieldErrorType.EnEmpty]
                }
                if (
                    fieldItems.find(
                        (b, idx) =>
                            b?.[flag]?.toLowerCase() ===
                                item?.[flag]?.toLowerCase() &&
                            `${item?.id}_${item?.sourceId}` !==
                                `${b?.id}_${b?.sourceId}`,
                    )
                ) {
                    errs.push(FieldErrorType.EnRepeat)
                }
                if (!enBeginNameReg.test(item?.[flag])) {
                    errs.push(FieldErrorType.EnIllegalCharacter)
                }
                return errs
            case 'data_length':
                if (
                    (item.data_type === 'decimal' ||
                        item.data_type === 'char') &&
                    !item?.[flag]
                ) {
                    return [FieldErrorType.LengthAccuracyEmpty]
                }
                return []
            case 'data_accuracy':
                if (item.data_type === 'decimal' && !item?.[flag]) {
                    return [FieldErrorType.LengthAccuracyEmpty]
                }
                return []
            default:
                return []
        }
    }

    // 保存节点配置
    const handleSave = async () => {
        let error = false
        const checkFields = fieldItems.map((info, idx1) => {
            const errs = new Set<FieldErrorType>([
                ...checkError(info, 'alias'),
                ...checkError(info, 'name_en'),
                ...checkError(info, 'data_length'),
                ...checkError(info, 'data_accuracy'),
            ])
            if (errs.size > 0) {
                error = true
            }
            return {
                ...info,
                editError: Array.from(errs),
            }
        })
        if (hasError || error) {
            setContinueFn?.(undefined)
            setFieldItems(checkFields)
            messageError(__('请先完善配置信息'))
            return
        }

        const { formula } = node!.data
        const configData: any[] = fieldItems.map((info) => {
            const newId = StringExt.uuid()
            const tempItem = ls.omit(info, [
                'editError',
                'beEditing',
                'dataElement',
                'standard_code',
            ])
            return {
                ...tempItem,
                outId: info?.outId || newId,
                originName: tempItem.alias,
            }
        })
        // const outData = configData.map((info) => {
        //     const tempItem = ls.omit(info, [
        //         'beEditing',
        //         'standard_name',
        //         'dict_id',
        //         'dict_id',
        //         'dict_name',
        //         'primary_key',
        //         'standard_deleted',
        //         'standard_state',
        //         'dict_deleted',
        //         'dict_state',
        //     ])
        //     return { ...tempItem }
        // })
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
                        output_fields: configData,
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
        setPreOutputFields([])
    }

    const getEleData = async (value: any): Promise<any> => {
        try {
            const { standard_code, code_table_id, code_table_name_zh } = value
            const res = await getDataEleDetail(standard_code, 'code')
            return Promise.resolve({
                dataElement: res,
                data_type: sceneAlsDataType.find((t) => t.id === res?.data_type)
                    ?.value_en,
                standard_id: !res?.deleted && res?.id ? res.id : undefined,
                standard_name_zh:
                    !res?.deleted && res?.name_cn ? res.name_cn : undefined,
                code_table_id:
                    !res?.dict_deleted && res?.dict_id
                        ? res.dict_id
                        : code_table_id,
                code_table_name_zh:
                    !res?.dict_deleted && res?.dict_id
                        ? res?.dict_name_cn
                        : code_table_name_zh,
                code_rule_id:
                    !res?.rule_deleted && res?.rule_id
                        ? res.rule_id
                        : undefined,
                code_rule_name:
                    !res?.rule_deleted && res?.rule_id
                        ? res?.rule_name
                        : undefined,
            })
        } catch (err) {
            return Promise.resolve(undefined)
        }
    }

    // 检查更新数据
    const checkData = async () => {
        setLoading(true)
        clearData()
        const { preOutData, outData } = checkOutputViewFormulaConfig(
            graph!,
            node!,
            formulaData!,
            fieldsData,
        )
        setPreOutputFields(preOutData)
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
        const tempPreOutData = preOutData.map((info) => {
            const findItem = fieldsData.data.find((d) => d.id === info.id)
            return {
                ...info,
                standard_code: findItem?.standard_code,
                code_table_id: findItem?.code_table_id,
                code_table_name_zh: findItem?.code_table,
                primary_key: findItem?.primary_key ?? false,
                name_en: info?.name_en || findItem?.name_en,
                data_type: info?.data_type || findItem?.data_type,
                editError: [],
            }
        })
        let tempFields
        if (config) {
            const { config_fields } = config
            tempFields = await Promise.all(
                tempPreOutData.map(async (info) => {
                    const findItem = config_fields.find(
                        (d) =>
                            `${info.id}_${info.sourceId}` ===
                            `${d.id}_${d.sourceId}`,
                    )
                    if (findItem) {
                        return {
                            ...findItem,
                            editError: [],
                        }
                    }

                    if (info.standard_code) {
                        const eleData = await getEleData(info)
                        if (eleData) {
                            return {
                                ...info,
                                ...eleData,
                            }
                        }
                    }
                    return info
                }),
            )
            setPreOutputFields(
                preOutData.map((info) => {
                    const findItem = fieldsData.data.find(
                        (d) => d.id === info.id,
                    )
                    return {
                        ...info,
                        primary_key: findItem?.primary_key ?? false,
                        name_en: info?.name_en || findItem?.name_en,
                        data_type: info?.data_type || findItem?.data_type,
                    }
                }),
            )
        } else {
            tempFields = await Promise.all(
                tempPreOutData.map(async (info) => {
                    if (info.standard_code) {
                        const eleData = await getEleData(info)
                        if (eleData) {
                            return {
                                ...info,
                                ...eleData,
                            }
                        }
                    }
                    return info
                }),
            )
            setPreOutputFields(tempPreOutData)
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
                    info.alias?.toLowerCase().includes(kw.toLowerCase()) ||
                    info?.name_en?.toLowerCase().includes(kw.toLowerCase())
                )
            }) || [],
        )
        setKeyword(kw)
    }

    // 单选变更
    const handleChangeRadio = (
        item: any,
        value: boolean,
        flag: 'primary_key' | 'is_required' | 'is_increment',
    ) => {
        if (inViewMode) return
        setValuesChange(true)
        setFieldItems(
            fieldItems.map((info, idx) => {
                if (
                    `${info.id}_${info.sourceId}` ===
                    `${item.id}_${item.sourceId}`
                ) {
                    return {
                        ...info,
                        [flag]: value,
                    }
                }
                if (flag === 'primary_key') {
                    return {
                        ...info,
                        [flag]: value ? false : info[flag],
                    }
                }
                return info
            }),
        )
    }

    // 字段开始改动
    const handleStartChange = (e, item: any, flag: 'alias' | 'name_en') => {
        if (e.target.value) {
            setValuesChange(true)
        }
        if (item.editError.length > 0) {
            setFieldItems(
                fieldItems.map((info) => {
                    if (
                        `${info.id}_${info.sourceId}` ===
                        `${item.id}_${item.sourceId}`
                    ) {
                        return {
                            ...info,
                            editError: info.editError.filter(
                                (err) =>
                                    !(
                                        flag === 'alias'
                                            ? [
                                                  FieldErrorType.Repeat,
                                                  FieldErrorType.IllegalCharacter,
                                              ]
                                            : [
                                                  FieldErrorType.EnEmpty,
                                                  FieldErrorType.EnRepeat,
                                                  FieldErrorType.EnIllegalCharacter,
                                              ]
                                    ).includes(err),
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
        let tempData = fieldItems.slice().map((a) => {
            if (a.id === item.id && a.sourceId === item.sourceId) {
                return {
                    ...a,
                    [flag]: name,
                }
            }
            return a
        })
        tempData = tempData.map((a, idx1) => {
            const isRep = !!tempData.find(
                (b, idx2) =>
                    b?.[flag]?.toLowerCase() === a?.[flag]?.toLowerCase() &&
                    idx1 !== idx2,
            )
            if (a.id === item.id && a.sourceId === item.sourceId) {
                const isEmpty = !a?.[flag]
                // 技术名称只支持英文
                const isIllegal =
                    flag === 'alias'
                        ? !keyboardReg.test(a?.[flag])
                        : !enBeginNameReg.test(a?.[flag])

                const errs = new Set([
                    ...a.editError.filter(
                        (err) =>
                            !(
                                flag === 'alias'
                                    ? [
                                          FieldErrorType.Repeat,
                                          FieldErrorType.IllegalCharacter,
                                      ]
                                    : [
                                          FieldErrorType.EnEmpty,
                                          FieldErrorType.EnRepeat,
                                          FieldErrorType.EnIllegalCharacter,
                                      ]
                            ).includes(err),
                    ),
                ])
                if (isEmpty) {
                    errs.add(
                        flag === 'alias'
                            ? FieldErrorType.Empty
                            : FieldErrorType.EnEmpty,
                    )
                }
                if (isIllegal) {
                    errs.add(
                        flag === 'alias'
                            ? FieldErrorType.IllegalCharacter
                            : FieldErrorType.EnIllegalCharacter,
                    )
                }
                if (isRep) {
                    errs.add(
                        flag === 'alias'
                            ? FieldErrorType.Repeat
                            : FieldErrorType.EnRepeat,
                    )
                }
                return {
                    ...a,
                    editError: Array.from(errs),
                }
            }
            const errs = new Set([
                ...a.editError.filter(
                    (err) =>
                        !(
                            flag === 'alias'
                                ? [FieldErrorType.Repeat]
                                : [FieldErrorType.EnRepeat]
                        ).includes(err),
                ),
            ])
            if (isRep) {
                errs.add(
                    flag === 'alias'
                        ? FieldErrorType.Repeat
                        : FieldErrorType.EnRepeat,
                )
            }
            return {
                ...a,
                editError: Array.from(errs),
            }
        })
        setFieldItems(tempData)
        setEditItem(undefined)
    }

    // 配置数据元
    const handleSelDataEle = async (newDataEle: any) => {
        const dataEleCode = newDataEle?.code
        if (!dataEleCode || editItem?.standard_id === newDataEle?.key) return
        setValuesChange(true)
        try {
            // 获取标准详情
            const { data } = await getDataEleDetailById({
                type: 2,
                value: dataEleCode,
            })
            const tempItems = fieldItems.map((info) => {
                if (
                    info.id === editItem?.id &&
                    info.sourceId === editItem?.sourceId
                ) {
                    const tempItem = {
                        ...info,
                        dataElement: data,
                        data_type: sceneAlsDataType.find(
                            (t) => t.id === data?.data_type,
                        )?.value_en,
                        standard_id:
                            !data?.deleted && data?.id
                                ? data.id
                                : info.standard_id,
                        standard_name_zh:
                            !data?.deleted && data?.name_cn
                                ? data.name_cn
                                : info.standard_name_zh,
                        code_table_id:
                            !data?.dict_deleted && data?.dict_id
                                ? data.dict_id
                                : info.code_table_id,
                        code_table_name_zh:
                            !data?.dict_deleted && data?.dict_id
                                ? data?.dict_name_cn
                                : info.code_table_name_zh,
                        code_rule_id:
                            !data?.rule_deleted && data?.rule_id
                                ? data.rule_id
                                : info.code_rule_id,
                        code_rule_name:
                            !data?.rule_deleted && data?.rule_id
                                ? data?.rule_name
                                : info.code_rule_name,
                    }
                    const errs = new Set([
                        ...info.editError.filter(
                            (err) => err !== FieldErrorType.LengthAccuracyEmpty,
                        ),
                        ...checkError(tempItem, 'data_length'),
                        ...checkError(tempItem, 'data_accuracy'),
                    ])
                    return {
                        ...tempItem,
                        editError: Array.from(errs),
                    }
                }
                return info
            })
            setFieldItems(tempItems)
        } catch (err) {
            formatError(err)
        } finally {
            setEditItem(undefined)
        }
    }

    // 配置码表
    const handleSelDict = async (newDataEle: any) => {
        if (!newDataEle?.key || editItem?.code_table_id === newDataEle?.key)
            return
        setValuesChange(true)
        try {
            setFieldItems(
                fieldItems.map((info) => {
                    if (
                        info.id === editItem?.id &&
                        info.sourceId === editItem?.sourceId
                    ) {
                        if (
                            info?.dataElement?.dict_id &&
                            info?.dataElement?.dict_id !== newDataEle?.key
                        ) {
                            const tempItem = {
                                ...info,
                                data_type: preOutputFields.find(
                                    (d) =>
                                        d.id === info.id &&
                                        d.sourceId === info.sourceId,
                                )?.data_type,
                                dataElement: undefined,
                                standard_id: undefined,
                                standard_name_zh: undefined,
                                code_table_id: newDataEle?.key,
                                code_table_name_zh: newDataEle?.label,
                            }
                            const errs = new Set([
                                ...info.editError.filter(
                                    (err) =>
                                        err !==
                                        FieldErrorType.LengthAccuracyEmpty,
                                ),
                                ...checkError(tempItem, 'data_length'),
                                ...checkError(tempItem, 'data_accuracy'),
                            ])
                            return {
                                ...tempItem,
                                editError: Array.from(errs),
                            }
                        }
                        return {
                            ...info,
                            code_table_id: newDataEle?.key,
                            code_table_name_zh: newDataEle?.label,
                        }
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

    // 配置编码规则
    const handleSelCodeRule = async (newDataEle: any) => {
        if (!newDataEle?.key || editItem?.code_rule_id === newDataEle?.key)
            return
        setValuesChange(true)
        try {
            setFieldItems(
                fieldItems.map((info) => {
                    if (
                        info.id === editItem?.id &&
                        info.sourceId === editItem?.sourceId
                    ) {
                        if (
                            info?.dataElement?.rule_id &&
                            info?.dataElement?.rule_id !== newDataEle?.key
                        ) {
                            const tempItem = {
                                ...info,
                                data_type: preOutputFields.find(
                                    (d) =>
                                        d.id === info.id &&
                                        d.sourceId === info.sourceId,
                                )?.data_type,
                                dataElement: undefined,
                                standard_id: undefined,
                                standard_name_zh: undefined,
                                code_rule_id: newDataEle?.key,
                                code_rule_name: newDataEle?.label,
                            }
                            const errs = new Set([
                                ...info.editError.filter(
                                    (err) =>
                                        err !==
                                        FieldErrorType.LengthAccuracyEmpty,
                                ),
                                ...checkError(tempItem, 'data_length'),
                                ...checkError(tempItem, 'data_accuracy'),
                            ])
                            return {
                                ...tempItem,
                                editError: Array.from(errs),
                            }
                        }
                        return {
                            ...info,
                            code_rule_id: newDataEle?.key,
                            code_rule_name: newDataEle?.label,
                        }
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
        setValuesChange(true)
        setFieldItems(
            fieldItems.map((info) => {
                if (info.id === item.id && info.sourceId === item.sourceId) {
                    const tempItem = {
                        ...info,
                        dataElement: undefined,
                        standard_id: undefined,
                        standard_name_zh: undefined,
                        data_type: preOutputFields.find(
                            (d) =>
                                d.id === info.id &&
                                d.sourceId === info.sourceId,
                        )?.data_type,
                    }
                    const errs = new Set([
                        ...info.editError.filter(
                            (err) => err !== FieldErrorType.LengthAccuracyEmpty,
                        ),
                        ...checkError(tempItem, 'data_length'),
                        ...checkError(tempItem, 'data_accuracy'),
                    ])
                    return {
                        ...tempItem,
                        editError: Array.from(errs),
                    }
                }
                return info
            }),
        )
    }

    // 清除已选码表
    const clearDict = (item) => {
        setValuesChange(true)
        setFieldItems(
            fieldItems.map((info) => {
                if (info.id === item.id && info.sourceId === item.sourceId) {
                    return {
                        ...info,
                        code_table_id: undefined,
                        code_table_name_zh: undefined,
                    }
                }
                return info
            }),
        )
    }

    // 清除已选编码规则
    const clearCodeRule = (item) => {
        setValuesChange(true)
        setFieldItems(
            fieldItems.map((info) => {
                if (info.id === item.id && info.sourceId === item.sourceId) {
                    return {
                        ...info,
                        code_rule_id: undefined,
                        code_rule_name: undefined,
                    }
                }
                return info
            }),
        )
    }

    const handleDataTypeChange = (value, record) => {
        setValuesChange(true)
        setFieldItems(
            fieldItems.map((info) => {
                if (
                    info.id === record.id &&
                    info.sourceId === record.sourceId
                ) {
                    const tempVal: any = {
                        ...info,
                        data_type: value,
                        data_length: undefined,
                        data_accuracy: undefined,
                        editError: info.editError.filter(
                            (err) => err !== FieldErrorType.LengthAccuracyEmpty,
                        ),
                    }
                    if (value === 'decimal') {
                        tempVal.editError = [
                            ...tempVal.editError,
                            FieldErrorType.LengthAccuracyEmpty,
                        ]
                    }
                    if (
                        sceneAlsDataType.find(
                            (t) => t.id === record.dataElement?.data_type,
                        )?.value_en !== value
                    ) {
                        return {
                            ...info,
                            ...tempVal,
                            dataElement: undefined,
                            standard_id: undefined,
                            standard_name_zh: undefined,
                        }
                    }
                    return {
                        ...info,
                        ...tempVal,
                    }
                }
                return info
            }),
        )
    }

    const handleDataLengthAccuracyChange = (val, record, flag) => {
        setValuesChange(true)
        setEditItem(undefined)
        const value = val
        // record.data_type === 'decimal' ? val : editValue ? val : undefined
        setFieldItems(
            fieldItems.map((info) => {
                if (
                    info.id === record.id &&
                    info.sourceId === record.sourceId
                ) {
                    const tempVal: any = {
                        ...info,
                        [flag]: value,
                    }
                    const errs = [
                        ...info.editError.filter(
                            (err) => err !== FieldErrorType.LengthAccuracyEmpty,
                        ),
                    ]
                    if (
                        record.data_type === 'decimal' &&
                        (!tempVal.data_length || !tempVal.data_accuracy)
                    ) {
                        errs.push(FieldErrorType.LengthAccuracyEmpty)
                    }
                    if (record.data_type === 'char' && !tempVal.data_length) {
                        errs.push(FieldErrorType.LengthAccuracyEmpty)
                    }
                    return {
                        ...info,
                        ...tempVal,
                        editError: errs,
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
        const item = fieldItems.find(
            (info) =>
                `${info.id}_${info.sourceId}` ===
                `${record.id}_${record.sourceId}`,
        )
        let tip
        let width = 144
        if (flag === 'alias') {
            if (item.editError.includes(FieldErrorType.IllegalCharacter)) {
                tip = ErrorInfo.EXCEPTEMOJI
                width = 296
            } else if (item.editError.includes(FieldErrorType.Repeat)) {
                tip = __('该业务名称已存在，请重新输入')
                width = 228
            }
        }
        if (flag === 'name_en') {
            if (item.editError.includes(FieldErrorType.EnEmpty)) {
                tip = __('技术名称不能为空')
                width = 144
            } else if (
                item.editError.includes(FieldErrorType.EnIllegalCharacter)
            ) {
                tip = __(
                    '技术名称仅支持英文、数字、下划线、中划线，且必须以字母开头',
                )
                width = 240
            } else if (item.editError.includes(FieldErrorType.EnRepeat)) {
                tip = __('该技术名称已存在，请重新输入')
                width = 228
            }
        }
        if (flag === 'data_type') {
            if (item.editError.includes(FieldErrorType.LengthAccuracyEmpty)) {
                if (record.data_type === 'decimal') {
                    tip = __('长度和精度不能为空')
                    width = 176
                } else if (record.data_type === 'char') {
                    tip = __('长度不能为空')
                    width = 144
                }
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
            fixed: FixedType.LEFT,
            width: 200,
            render: (_, record) => {
                const { error, width } = checkErrorTip(record, 'alias')
                return (
                    <span className={styles.rowNameWrap}>
                        <DragOutlined
                            className={styles.dragIcon}
                            hidden={!!keyword || inViewMode}
                        />
                        <Input
                            disabled={inViewMode}
                            placeholder={__('请输入业务名称')}
                            allowClear={!inViewMode}
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
                                editItem?.sourceId === record.sourceId &&
                                editItem?.flag === 'alias'
                                    ? editValue
                                    : record?.alias
                            }
                            onChange={(e) => {
                                handleStartChange(e, record, 'alias')
                                setEditValue(e.target.value)
                            }}
                            onFocus={() => {
                                setEditItem({
                                    id: record.id,
                                    sourceId: record.sourceId,
                                    flag: 'alias',
                                })
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
            width: 200,
            render: (_, record) => {
                const { error, width } = checkErrorTip(record, 'name_en')
                return (
                    <span className={styles.rowNameWrap}>
                        <Input
                            disabled={inViewMode}
                            placeholder={__('请输入技术名称')}
                            allowClear={!inViewMode}
                            maxLength={100}
                            status={error ? 'error' : undefined}
                            value={
                                editItem?.id === record.id &&
                                editItem?.sourceId === record.sourceId &&
                                editItem?.flag === 'name_en'
                                    ? editValue
                                    : record?.name_en
                            }
                            onChange={(e) => {
                                handleStartChange(e, record, 'name_en')
                                setEditValue(e.target.value)
                                // handleCheckEnName(record, e.target.value, true)
                            }}
                            onFocus={() => {
                                setEditItem({
                                    id: record.id,
                                    sourceId: record.sourceId,
                                    flag: 'name_en',
                                })
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
            title: (
                <span>
                    {redDot}
                    {__('数据类型')}
                </span>
            ),
            dataIndex: 'data_type',
            key: 'data_type',
            width: 460,
            render: (value, record, index) => {
                const needLength =
                    record?.data_type === 'decimal' ||
                    record?.data_type === 'char'
                const needAccuracy = record?.data_type === 'decimal'
                const { error, width } = checkErrorTip(record, 'data_type')
                return (
                    <div className={styles.dataTypeWrap}>
                        <Select
                            style={{ width: '120px' }}
                            disabled={inViewMode}
                            placeholder={__('请选择')}
                            showArrow
                            value={record?.data_type}
                            options={sceneAlsDataType.map((item) => ({
                                label: item.value,
                                value: item.value_en,
                            }))}
                            onChange={(val) => {
                                handleDataTypeChange(val, record)
                            }}
                        />
                        <NumberInput
                            style={{ width: needLength ? 148 : 90 }}
                            placeholder={
                                record?.data_type === 'char'
                                    ? __('长度（1～65535）')
                                    : record?.data_type === 'decimal'
                                    ? __('长度（1~38）')
                                    : __('无需配置')
                            }
                            disabled={!needLength || inViewMode}
                            status={
                                needLength && !record?.data_length && error
                                    ? 'error'
                                    : undefined
                            }
                            min={1}
                            max={record?.data_type === 'decimal' ? 38 : 65535}
                            type={NumberType.Natural}
                            value={
                                editItem?.id === record.id &&
                                editItem?.sourceId === record.sourceId &&
                                editItem?.flag === 'data_length'
                                    ? editValue
                                    : needLength
                                    ? record?.data_length
                                    : undefined
                            }
                            onChange={(val) => {
                                setEditItem({
                                    id: record.id,
                                    sourceId: record.sourceId,
                                    flag: 'data_length',
                                })
                                setEditValue(val)
                            }}
                            onBlur={(val) => {
                                handleDataLengthAccuracyChange(
                                    val,
                                    record,
                                    'data_length',
                                )
                            }}
                            prefix={
                                needLength ? (
                                    <span style={{ color: '#FF4D4F' }}>*</span>
                                ) : undefined
                            }
                        />
                        {needAccuracy && (
                            <NumberInput
                                style={{ width: 148 }}
                                placeholder={__('精度（要≤长度）')}
                                min={1}
                                max={record?.data_length || 38}
                                type={NumberType.Natural}
                                prefix={
                                    <span style={{ color: '#FF4D4F' }}>*</span>
                                }
                                disabled={inViewMode}
                                status={
                                    record?.data_type === 'decimal' &&
                                    !Number.isInteger(record?.data_accuracy) &&
                                    error
                                        ? 'error'
                                        : undefined
                                }
                                value={
                                    editItem?.id === record.id &&
                                    editItem?.sourceId === record.sourceId &&
                                    editItem?.flag === 'data_accuracy'
                                        ? editValue
                                        : record?.data_accuracy
                                }
                                onChange={(val) => {
                                    setEditItem({
                                        id: record.id,
                                        sourceId: record.sourceId,
                                        flag: 'data_accuracy',
                                    })
                                    setEditValue(val)
                                }}
                                onBlur={(val) => {
                                    handleDataLengthAccuracyChange(
                                        val,
                                        record,
                                        'data_accuracy',
                                    )
                                }}
                            />
                        )}
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
                    </div>
                )
            },
        },
        {
            title: <span>{__('关联数据标准')}</span>,
            dataIndex: 'standard_id',
            key: 'standard_id',
            render: (_, record) => {
                const { error, width } = checkErrorTip(record, 'standard_id')
                const options = record?.standard_id
                    ? [
                          {
                              label: record.standard_name_zh,
                              value: record.standard_id,
                          },
                      ]
                    : []
                return (
                    <span className={styles.rowSelectWrap}>
                        <Select
                            disabled={inViewMode}
                            ref={standardIdRef}
                            style={{ width: '100%' }}
                            placeholder={__('请选择')}
                            options={options}
                            value={record?.standard_id}
                            open={false}
                            suffixIcon={<a>{__('选择')}</a>}
                            onClick={(e) => {
                                e.stopPropagation()
                                if (inViewMode) return
                                setEditItem({
                                    id: record.id,
                                    sourceId: record.sourceId,
                                    flag: 'standard_id',
                                    standard_id: record.standard_id,
                                })
                                setSelDataVisible(true)
                                standardIdRef?.current?.blur()
                            }}
                            status={error ? 'error' : undefined}
                            allowClear
                            onClear={() => clearStandard(record)}
                        />
                    </span>
                )
            },
        },
        {
            title: <span>{__('关联码表')}</span>,
            dataIndex: 'code_table_id',
            key: 'code_table_id',
            render: (_, record) => {
                const options = record?.code_table_id
                    ? [
                          {
                              label: record.code_table_name_zh,
                              value: record.code_table_id,
                          },
                      ]
                    : []
                return (
                    <span className={styles.rowSelectWrap}>
                        <Select
                            ref={codeTableIdRef}
                            style={{ width: '100%' }}
                            placeholder={__('请选择')}
                            options={options}
                            value={record?.code_table_id}
                            open={false}
                            disabled={inViewMode}
                            onClick={(e) => {
                                e.stopPropagation()
                                if (inViewMode) return
                                setEditItem({
                                    id: record.id,
                                    sourceId: record.sourceId,
                                    flag: 'code_table_id',
                                    code_table_id: record.code_table_id,
                                })
                                setSelDataVisible(true)
                                codeTableIdRef?.current?.blur()
                            }}
                            suffixIcon={<a>{__('选择')}</a>}
                            allowClear
                            onClear={() => clearDict(record)}
                        />
                    </span>
                )
            },
        },
        {
            title: <span>{__('关联编码规则')}</span>,
            dataIndex: 'code_rule_id',
            key: 'code_rule_id',
            render: (_, record) => {
                const options = record?.code_rule_id
                    ? [
                          {
                              label: record.code_rule_name,
                              value: record.code_rule_id,
                          },
                      ]
                    : []
                return (
                    <span className={styles.rowSelectWrap}>
                        <Select
                            disabled={inViewMode}
                            ref={codeRuleIdRef}
                            style={{ width: '100%' }}
                            placeholder={__('请选择')}
                            options={options}
                            value={record?.code_rule_id}
                            open={false}
                            onClick={(e) => {
                                e.stopPropagation()
                                if (inViewMode) return
                                setEditItem({
                                    id: record.id,
                                    sourceId: record.sourceId,
                                    flag: 'code_rule_id',
                                    code_rule_id: record.code_rule_id,
                                })
                                setSelDataVisible(true)
                                codeRuleIdRef?.current?.blur()
                            }}
                            allowClear
                            onClear={() => clearCodeRule(record)}
                            suffixIcon={<a>{__('选择')}</a>}
                        />
                    </span>
                )
            },
        },
        {
            title: <span>{__('主键')}</span>,
            dataIndex: 'primary_key',
            key: 'primary_key',
            width: 60,
            render: (value, record) => {
                return (
                    <div
                        className={classnames(styles.radioWrap, {
                            [styles.radioWrapDisabled]: inViewMode,
                        })}
                        onClick={(e) => {
                            e.stopPropagation()
                            handleChangeRadio(record, !value, 'primary_key')
                        }}
                    >
                        {value ? (
                            <CheckCircleFilled
                                className={classnames(styles.checked)}
                            />
                        ) : (
                            <div className={classnames(styles.unchecked)} />
                        )}
                    </div>
                )
            },
        },
        {
            title: <span>{__('必填')}</span>,
            dataIndex: 'is_required',
            key: 'is_required',
            width: 60,
            render: (value, record) => (
                <div
                    className={classnames(styles.radioWrap, {
                        [styles.radioWrapDisabled]: inViewMode,
                    })}
                    onClick={(e) => {
                        e.stopPropagation()
                        handleChangeRadio(record, !value, 'is_required')
                    }}
                >
                    {value ? (
                        <CheckCircleFilled
                            className={classnames(styles.checked)}
                        />
                    ) : (
                        <div className={classnames(styles.unchecked)} />
                    )}
                </div>
            ),
        },
        {
            title: <span>{__('增量字段')}</span>,
            dataIndex: 'is_increment',
            key: 'is_increment',
            width: 80,
            render: (value, record) => (
                <div
                    className={classnames(styles.radioWrap, {
                        [styles.radioWrapDisabled]: inViewMode,
                    })}
                    onClick={(e) => {
                        e.stopPropagation()
                        handleChangeRadio(record, !value, 'is_increment')
                    }}
                >
                    {value ? (
                        <CheckCircleFilled
                            className={classnames(styles.checked)}
                        />
                    ) : (
                        <div className={classnames(styles.unchecked)} />
                    )}
                </div>
            ),
        },
    ]

    const components = {
        body: {
            row: DraggableBodyRow,
        },
    }

    // 移动行
    const moveRow = useCallback(
        (dragIndex: number, hoverIndex: number) => {
            if (dragIndex !== hoverIndex) {
                setValuesChange(true)
            }
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
                                    ref={tableRef}
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
                                                !(
                                                    record.id ===
                                                        editItem?.id &&
                                                    record.sourceId ===
                                                        editItem?.sourceId
                                                ) &&
                                                !inViewMode,
                                            moveRow,
                                        }
                                        return attr as React.HTMLAttributes<any>
                                    }}
                                    rowClassName={styles.of_tableRowWrap}
                                    rowKey={(record) =>
                                        `${record.id}_${record.sourceId}`
                                    }
                                    pagination={false}
                                    scroll={{
                                        y: viewHeight * (viewSize / 100) - 160,
                                        x: 1600,
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
                    editItem?.flag === 'standard_id'
                        ? CatalogType.DATAELE
                        : editItem?.flag === 'code_table_id'
                        ? CatalogType.CODETABLE
                        : CatalogType.CODINGRULES
                }
                oprItems={
                    editItem?.flag === 'standard_id'
                        ? [
                              {
                                  key: editItem?.standard_id,
                                  label: editItem?.standard_name_zh,
                              },
                          ]
                        : editItem?.flag === 'code_table_id'
                        ? [
                              {
                                  key: editItem?.code_table_id,
                                  label: editItem?.code_table_name_zh,
                              },
                          ]
                        : [
                              {
                                  key: editItem?.code_rule_id,
                                  label: editItem?.code_rule_name,
                              },
                          ]
                }
                setOprItems={setSelDataItems}
                onOk={(oprItems: any) => {
                    if (editItem?.flag === 'standard_id') {
                        handleSelDataEle(oprItems?.[0])
                    } else if (editItem?.flag === 'code_table_id') {
                        handleSelDict(oprItems?.[0])
                    } else {
                        handleSelCodeRule(oprItems?.[0])
                    }
                }}
                handleShowDataDetail={(
                    dataType: CatalogType,
                    dataId?: string,
                ) => {
                    setShowDEDetailId(dataId || '')
                    if (dataId) {
                        if (editItem?.flag === 'standard_id') {
                            setDataEleDetailVisible(true)
                        } else if (editItem?.flag === 'code_table_id') {
                            setCodeTbDetailVisible(true)
                        } else {
                            setCodeRuleDetailVisible(true)
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
            {codeRuleDetailVisible && !!showDEDetailId && (
                <CodeRuleDetails
                    visible={codeRuleDetailVisible}
                    id={showDEDetailId}
                    onClose={() => {
                        setCodeRuleDetailVisible(false)
                        setShowDEDetailId(undefined)
                    }}
                />
            )}
        </div>
    )
})

export default OutputViewFormula
