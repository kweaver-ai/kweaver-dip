import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
} from 'react'
import {
    Form,
    Button,
    Space,
    Select,
    Input,
    DatePicker,
    InputNumber,
    Spin,
    AutoComplete,
} from 'antd'
import moment from 'moment'
import { CaretDownOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { isNaN, replace, trim } from 'lodash'
import {
    limitNumber,
    limitList,
    BelongList,
    limitString,
    beforeTime,
    currentTime,
    beforeDateOptions,
    currentDateOptions,
    beforeDateTimeOptions,
    currentDataTimeOptions,
    limitAndBelongList,
    limitDateRanger,
    limitChoose,
} from '../../BussinessConfigure/const'
import { validateEmpty } from '@/utils/validate'
import styles from './styles.module.less'
import { AddOutlined, DeleteOutLined } from '@/icons'
import __ from '../locale'
import { checkWhereFormulaConfig, getFormulaItem } from '../helper'
import { IFormula, IFormulaFields, getDictValuesBySearch } from '@/core'
import { FieldTypes, FormulaError, fieldInfos, noContentLimit } from '../const'
import { ErrorInfo, numberReg, DATA_TYPE_MAP } from '@/utils'
import { dataEmptyView, IFormulaConfigEl, tipLabel, fieldLabel } from './helper'
import ConfigHeader from './ConfigHeader'
import NumberInput from '@/ui/NumberInput'
import { NumberType } from '@/ui/NumberInput/const'
import { FieldLimitItem } from '@/components/RowAndColFilter/RowFilter/CommonItem'
import { useViewGraphContext } from '../ViewGraphProvider'

const { RangePicker } = DatePicker

const WhereFormula = forwardRef((props: IFormulaConfigEl, ref) => {
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
    const [form] = Form.useForm()
    const [loading, setLoading] = useState<boolean>(false)
    // 当前的算子信息
    const [formulaItem, setFormulaItem] = useState<IFormula>()
    // 前序节点数据
    const [preNodeData, setPreNodeData] = useState<IFormulaFields[]>([])
    // 字段选项
    const [fieldOptions, setFieldOptions] = useState<any>([])
    // 组间条件
    const [whereRelation, setWhereRelation] = useState<string>('and')
    // 码表选项集
    const [tableList, setTableList] = useState<
        Array<{ dict_id: string; options: any[] }>
    >([])
    // form 值变更
    const [valuesChange, setValuesChange] = useState<any>()
    const { setContinueFn } = useViewGraphContext()

    useImperativeHandle(ref, () => ({
        checkSaveChanged,
        onSave: handleSave,
    }))

    // 检查保存变更
    const checkSaveChanged = (): Promise<boolean> => {
        if (!node) return Promise.resolve(false)
        const realFormula = node.data.formula.find(
            (info) => info.id === formulaData!.id,
        )
        if (!realFormula) return Promise.resolve(false)
        setFormulaItem(realFormula)
        const { errorMsg, config, output_fields } = realFormula
        if (errorMsg && errorMsg !== FormulaError.ConfigError) {
            return Promise.resolve(false)
        }
        if (valuesChange) {
            return Promise.resolve(true)
        }
        return Promise.resolve(false)
    }

    useEffect(() => {
        if (visible && formulaData && graph && node) {
            checkData()
        }
    }, [visible, formulaData])

    // 保存节点配置
    const handleSave = async () => {
        try {
            await form.validateFields()
            const { formula } = node!.data
            const values = form.getFieldsValue()
            const { where } = values
            const whereValue = where.map((a) => {
                const { member } = a
                return {
                    ...a,
                    member: member.map((b) => {
                        const { field, value } = b
                        const fieldValue = preNodeData.find((c) => {
                            const ids = field.split('_')
                            return c.id === ids[0] && c.sourceId === ids[1]
                        })
                        // let realValue = value
                        // if (typeof value === 'object') {
                        //     if (Array.isArray(value)) {
                        //         realValue = value.join(',')
                        //     } else {
                        //         const { dateNumber, unit, date } = value
                        //         if (date) {
                        //             realValue = date
                        //                 .map((c) =>
                        //                     moment(c).format(
                        //                         'YYYY-MM-DD HH:mm:ss',
                        //                     ),
                        //                 )
                        //                 .join(',')
                        //         } else {
                        //             realValue = `${dateNumber} ${unit}`
                        //         }
                        //     }
                        // }
                        return { ...b, field: fieldValue, value }
                    }),
                }
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
                                where: whereValue,
                                where_relation:
                                    whereValue.length > 1
                                        ? whereRelation
                                        : 'and',
                            },
                            output_fields: preNodeData,
                        }
                    }
                    return info
                }),
            })
            onClose()
        } catch (err) {
            if (err?.errorFields?.length > 0) {
                setContinueFn(undefined)
            }
        }
    }

    const clearData = () => {
        form.resetFields()
        setPreNodeData([])
        setFormulaItem(undefined)
        setFieldOptions([])
        setWhereRelation('and')
    }

    // 检查更新数据
    const checkData = () => {
        setLoading(true)
        clearData()
        const { preOutData, outData } = checkWhereFormulaConfig(
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
        if (errorMsg && errorMsg !== FormulaError.ConfigError) {
            setTimeout(() => {
                setLoading(false)
            }, 400)
            return
        }

        setPreNodeData(preOutData)
        setFieldOptions(
            preOutData.map((info) => {
                const type =
                    info?.data_type ||
                    fieldsData.data.find((a) => a.id === info.id)?.data_type
                const disabled = DATA_TYPE_MAP.time.includes(type)

                return {
                    value: `${info.id}_${info.sourceId}`,
                    label: fieldLabel(
                        fieldsData.dataType.length > 0 &&
                            fieldsData.dataType.find((it) => {
                                return it.value_en === type
                            })?.value,
                        info.alias,
                    ),
                    disabled,
                }
            }),
        )
        if (config) {
            const { where, where_relation } = config
            setWhereRelation(where_relation || 'and')
            const whereValue = where.map((a, i) => {
                const { member } = a
                return {
                    ...a,
                    member: member.map((b, j) => {
                        const { field, operator, value } = b
                        const findItem = preOutData.find(
                            (c) =>
                                c.id === field.id &&
                                c.sourceId === field.sourceId,
                        )
                        if (!findItem) {
                            setTimeout(() => {
                                form.setFields([
                                    {
                                        name: [
                                            'where',
                                            i,
                                            'member',
                                            j,
                                            'field',
                                        ],
                                        errors: [__('字段被删除')],
                                    },
                                ])
                            }, 450)
                            return { field: undefined }
                        }
                        const findItemDataType =
                            findItem?.data_type ||
                            fieldsData.data.find((d) => d.id === findItem.id)
                                ?.data_type
                        const fieldDataType =
                            field?.data_type ||
                            fieldsData.data.find((d) => d.id === field.id)
                                ?.data_type
                        if (
                            findItemDataType !== fieldDataType ||
                            !fieldInfos[fieldDataType].limitListOptions.find(
                                (m) => m.value === operator,
                            )
                        ) {
                            setTimeout(() => {
                                form.setFields([
                                    {
                                        name: [
                                            'where',
                                            i,
                                            'member',
                                            j,
                                            'field',
                                        ],
                                        errors: [__('字段类型变更')],
                                    },
                                ])
                            }, 450)
                            return {
                                field: `${findItem.id}_${findItem.sourceId}`,
                            }
                        }
                        // let realValue = value
                        // switch (findItemDataType) {
                        //     case FieldTypes.NUMBER:
                        //         if (limitAndBelongList.includes(operator)) {
                        //             realValue = value.split(',')
                        //         }
                        //         break
                        //     case FieldTypes.CHAR:
                        //         if (limitAndBelongList.includes(operator)) {
                        //             realValue = value.split(',')
                        //         }
                        //         break
                        //     case FieldTypes.DATE:
                        //     case FieldTypes.DATETIME:
                        //     case FieldTypes.TIMESTAMP:
                        //         if (beforeTime.includes(operator)) {
                        //             const valueArr = value.split(' ')
                        //             realValue = {
                        //                 dateNumber: valueArr[0],
                        //                 unit: valueArr[1],
                        //             }
                        //         } else if (limitDateRanger.includes(operator)) {
                        //             realValue = {
                        //                 date: value
                        //                     .split(',')
                        //                     .map((info) => moment(info)),
                        //             }
                        //         }
                        //         break
                        //     default:
                        //         break
                        // }
                        // queryTableCodeList(
                        //     `${findItem.id}_${findItem.sourceId}`,
                        // )
                        return {
                            ...b,
                            field: `${findItem.id}_${findItem.sourceId}`,
                            value,
                        }
                    }),
                }
            })
            form.setFieldValue('where', whereValue)
        }

        setTimeout(() => {
            setLoading(false)
        }, 400)
    }

    // 关联字段搜索过滤
    const filterRelatedField = (inputValue: string, option) => {
        const res = preNodeData
            .filter((info) =>
                info.alias
                    ?.toLocaleLowerCase()
                    .includes(trim(inputValue).toLocaleLowerCase()),
            )
            .filter(
                (info) =>
                    info.id === option?.value?.split('_')[0] &&
                    info.sourceId === option?.value?.split('_')[1],
            )
        return res.length > 0
    }

    /**
     * 字段值变更
     * @param i 组index
     * @param j 条index
     * @param value 字段值
     * @param innerValue 整条数据
     */
    const handleFieldChange = (i, j, value, innerValue) => {
        const values = form.getFieldValue('where')
        form.setFieldValue(
            'where',
            values.map((a, idx1) => {
                if (idx1 === i) {
                    const { member } = a
                    return {
                        ...a,
                        member: member.map((b, idx2) => {
                            if (idx2 === j) {
                                if (!value) {
                                    return { field: undefined }
                                }
                                return { field: value }
                            }
                            return b
                        }),
                    }
                }
                return a
            }),
        )
        form.setFields([
            { name: ['where', i, 'member', j, 'value'], errors: [] },
        ])
    }

    /**
     * 过滤条件变更
     * @param i 组index
     * @param j 条index
     * @param value 字段值
     * @param innerValue 整条数据
     */
    const handleOperatorChange = (i, j, value, innerValue) => {
        const values = form.getFieldValue('where')
        const fieldInfo = preNodeData.find((info) => {
            const ids = innerValue.field.split('_')
            return info.id === ids[0] && info.sourceId === ids[1]
        })
        // const field_type_en =
        //     fieldInfo?.data_type ||
        //     fieldsData.data.find((a) => a.id === fieldInfo?.id)?.data_type
        // if (
        //     (field_type_en === FieldTypes.NUMBER &&
        //         limitNumber.includes(value)) ||
        //     (field_type_en === FieldTypes.CHAR &&
        //         ['belong', '=', '<>'].includes(value))
        // ) {
        //     queryTableCodeList(innerValue.field)
        // }
        form.setFieldValue(
            'where',
            values.map((a, idx1) => {
                if (idx1 === i) {
                    const { member } = a
                    return {
                        ...a,
                        member: member.map((b, idx2) => {
                            if (idx2 === j) {
                                return {
                                    ...b,
                                    operator: value,
                                    value: undefined,
                                }
                            }
                            return b
                        }),
                    }
                }
                return a
            }),
        )
        form.setFields([
            { name: ['where', i, 'member', j, 'value'], errors: [] },
        ])
    }

    /**
     * 请求码表数据
     * @param fieldValue 字段值
     */
    const queryTableCodeList = async (fieldValue: string) => {
        const { dict_id } = fieldsData.data.find(
            (info) => info.id === fieldValue.split('_')[0],
        )
        if (dict_id) {
            if (!tableList.find((info) => info.dict_id === dict_id)) {
                const { data } = await getDictValuesBySearch({ dict_id })
                if (data && data.length > 0) {
                    setTableList([
                        ...tableList,
                        {
                            dict_id,
                            options: data.map((table) => ({
                                label: `${table.code}（${table.value}）`,
                                value: table.code,
                                showLabel: table.code,
                            })),
                        },
                    ])
                }
            }
        }
    }

    /**
     * 限定内容变更
     * @param i 组index
     * @param j 条index
     * @param value 字段值
     * @param originField 原始字段信息
     * @param flag 值类型
     * @param blur 失焦触发
     */
    const handleValueChange = (
        i,
        j,
        value,
        originField?: any,
        flag:
            | 'number'
            | 'array'
            | 'numberArray'
            | 'other'
            | 'dateNumber'
            | 'unit'
            | 'date' = 'other',
        blur: boolean = false,
    ) => {
        const values = form.getFieldValue('where')
        form.setFieldValue(
            'where',
            values.map((a, idx1) => {
                if (idx1 === i) {
                    const { member } = a
                    return {
                        ...a,
                        member: member.map((b, idx2) => {
                            if (idx2 === j) {
                                if (flag === 'array') {
                                    if (value.length > 0) {
                                        const temp = value[value.length - 1]
                                        if (!trim(temp)) {
                                            value.splice(value.length - 1, 1)
                                            return {
                                                ...b,
                                                value,
                                            }
                                        }
                                        value.splice(
                                            value.length - 1,
                                            1,
                                            trim(temp),
                                        )
                                        return {
                                            ...b,
                                            value,
                                        }
                                    }
                                    return {
                                        ...b,
                                        value: undefined,
                                    }
                                }
                                if (['dateNumber', 'unit'].includes(flag)) {
                                    const oldValue = b.value
                                    return {
                                        ...b,
                                        value: {
                                            ...oldValue,
                                            [flag]: value,
                                        },
                                    }
                                }
                                if (flag === 'date') {
                                    return {
                                        ...b,
                                        value: { date: value },
                                    }
                                }
                                if (flag === 'numberArray') {
                                    if (value.length > 0) {
                                        const temp = value[value.length - 1]
                                        if (!trim(temp)) {
                                            value.splice(value.length - 1, 1)
                                            return {
                                                ...b,
                                                value,
                                            }
                                        }
                                        const numberVal = Number(trim(temp))
                                        value.splice(
                                            value.length - 1,
                                            1,
                                            isNaN(numberVal)
                                                ? trim(temp)
                                                : numberVal.toString(),
                                        )
                                        return {
                                            ...b,
                                            value,
                                        }
                                    }
                                    return {
                                        ...b,
                                        value: undefined,
                                    }
                                }
                                if (flag === 'number' && value !== undefined) {
                                    const numValue = value.split('.')
                                    if (numValue.length > 1) {
                                        const fir = numValue[0]
                                        const sec = numValue[1].substring(
                                            0,
                                            originField?.data_accuracy || 30,
                                        )
                                        if (blur) {
                                            return {
                                                ...b,
                                                value: Number(
                                                    `${fir}.${sec}`,
                                                ).toString(),
                                            }
                                        }
                                        return {
                                            ...b,
                                            value: `${fir}.${sec}`,
                                        }
                                    }
                                    return {
                                        ...b,
                                        value,
                                    }
                                }
                                return {
                                    ...b,
                                    value: blur ? trim(value) : value,
                                }
                            }
                            return b
                        }),
                    }
                }
                return a
            }),
        )
    }

    /**
     * 删除一条数据
     * @param i 组index
     * @param j 条index
     */
    const handleRemoveOneData = (i, j) => {
        const values = form.getFieldValue('where')
        form.setFields([
            { name: ['where', i, 'member', j, 'field'], errors: [] },
            { name: ['where', i, 'member', j, 'value'], errors: [] },
        ])
        if (values.length === 1 && values[0].member.length === 1) {
            form.setFieldValue('where', [
                {
                    relation: undefined,
                    member: [
                        {
                            field: undefined,
                        },
                    ],
                },
            ])
        } else {
            let clearRelation: boolean = false
            if (values[i].member.length === 2) {
                clearRelation = true
            }
            form.setFieldValue(
                'where',
                values
                    .map((a, idx1) => {
                        if (idx1 === i) {
                            const { member, relation } = a
                            if (member.length === 1) {
                                return undefined
                            }
                            return {
                                relation: clearRelation ? undefined : relation,
                                member: member.filter((_, idx2) => idx2 !== j),
                            }
                        }
                        return a
                    })
                    .filter((info) => !!info),
            )
        }
    }

    /**
     * 组内添加一条数据
     * @param i 组index
     */
    const handleAddOneData = (i) => {
        const values = form.getFieldValue('where')
        form.setFieldValue(
            'where',
            values.map((a, idx1) => {
                if (idx1 === i) {
                    const { member, relation } = a
                    return {
                        relation: relation || 'and',
                        member: [...member, { field: undefined }],
                    }
                }
                return a
            }),
        )
    }

    // 校验正整数｜0
    const validatePositiveNumber = (value) => {
        return new Promise((resolve, reject) => {
            const trimValue = trim(value)
            if (!trimValue) {
                reject(new Error(__('输入不能为空')))
            }
            if (trimValue && !numberReg.test(trimValue)) {
                reject(new Error(__('仅支持数字')))
            }
            resolve(1)
        })
    }

    // 隐藏 tag 时显示的内容
    const maxTagContent = (omittedValues) => (
        <div title={omittedValues.map((o) => o.label).join('；')}>
            + {omittedValues.length} ...
        </div>
    )

    /**
     * 渲染过滤条件下拉框options
     * @param i 组index
     * @param j 条index
     */
    const renderLimitOptions = (i, j) => {
        const values = form.getFieldValue('where')
        const { field } = values[i].member[j]
        if (field) {
            const item = preNodeData.find((info) => {
                const ids = field.split('_')
                return info.id === ids[0] && info.sourceId === ids[1]
            })
            const field_type_en =
                item?.data_type ||
                fieldsData.data.find((d) => d.id === item?.id)?.data_type
            return field_type_en
                ? fieldInfos[field_type_en]?.limitListOptions
                : []
        }
        return []
    }

    /**
     * 根据过滤条件加载限定内容
     * @param i 组index
     * @param j 条index
     * @param innerField 条
     * @param innerValue 条数据
     */
    const renderLimitNode = (i, j, innerField, innerValue) => {
        const numReg = /^-?\d*(\.\d*)?$/
        const defaultNode: any = (
            <Form.Item name={[innerField.name, 'value']} style={{ flex: 1 }}>
                <Input disabled placeholder={__('无需填写限定内容')} />
            </Form.Item>
        )
        const formValue = form.getFieldValue('where')
        const { field, operator, value } = innerValue
        if (field && operator) {
            // const valueWi = 'calc(42% - 32px)'
            // 字段原始数据
            const originFieldInfo = fieldsData.data.find(
                (info) => info.id === field.split('_')[0],
            )
            const fieldItem = preNodeData.find(
                (info) => `${info.id}_${info.sourceId}` === field,
            )
            const sourceFormulaItem = getFormulaItem(
                graph,
                fieldItem?.formulaId,
            )
            const sourceFieldName = sourceFormulaItem?.output_fields?.find(
                (item) => item.id === fieldItem?.id,
            )?.name

            // // 算子中字段数据
            // const fieldInfo = preNodeData.find((info) => {
            //     const ids = field.split('_')
            //     return info.id === ids[0] && info.sourceId === ids[1]
            // })
            // const field_type_en =
            //     fieldInfo?.data_type ||
            //     fieldsData.data.find((a) => a.id === fieldInfo?.id)?.data_type
            // switch (field_type_en) {
            //     case FieldTypes.NUMBER:
            //         if (limitNumber.includes(operator)) {
            //             return (
            //                 <Form.Item
            //                     name={[innerField.name, 'value']}
            //                     rules={[
            //                         {
            //                             required: true,
            //                             message: __('请选择限定内容'),
            //                         },
            //                         {
            //                             pattern: numReg,
            //                             message: ErrorInfo.ONLYSUPNUM,
            //                             transform: (val) => trim(val),
            //                         },
            //                     ]}
            //                     style={{ width: valueWi }}
            //                 >
            //                     <AutoComplete
            //                         placeholder={__('请输入限定内容')}
            //                         options={
            //                             tableList?.find(
            //                                 (a) =>
            //                                     a.dict_id ===
            //                                     originFieldInfo?.dict_id,
            //                             )?.options || []
            //                         }
            //                         filterOption
            //                         getPopupContainer={(n) => n.parentNode}
            //                         onChange={(currentValue) =>
            //                             handleValueChange(
            //                                 i,
            //                                 j,
            //                                 currentValue,
            //                                 originFieldInfo,
            //                                 'number',
            //                             )
            //                         }
            //                         onBlur={() =>
            //                             handleValueChange(
            //                                 i,
            //                                 j,
            //                                 value,
            //                                 originFieldInfo,
            //                                 'number',
            //                                 true,
            //                             )
            //                         }
            //                     >
            //                         <Input
            //                             maxLength={65}
            //                             value={value}
            //                             autoComplete="off"
            //                         />
            //                     </AutoComplete>
            //                 </Form.Item>
            //             )
            //         }
            //         if (limitList.includes(operator)) {
            //             return (
            //                 <Form.Item
            //                     name={[innerField.name, 'value']}
            //                     rules={[
            //                         {
            //                             required: true,
            //                             message: __('请选择限定内容'),
            //                         },
            //                     ]}
            //                     style={{ width: valueWi }}
            //                 >
            //                     <Select
            //                         placeholder={__('请选择限定内容')}
            //                         mode="multiple"
            //                         options={
            //                             tableList?.find(
            //                                 (a) =>
            //                                     a.dict_id ===
            //                                     originFieldInfo?.dict_id,
            //                             )?.options || []
            //                         }
            //                         maxTagCount={3}
            //                         maxTagTextLength={10}
            //                         maxTagPlaceholder={(omittedValues) =>
            //                             maxTagContent(omittedValues)
            //                         }
            //                         onChange={(val) =>
            //                             handleValueChange(
            //                                 i,
            //                                 j,
            //                                 val,
            //                                 originFieldInfo,
            //                                 'array',
            //                             )
            //                         }
            //                         getPopupContainer={(n) => n.parentNode}
            //                         notFoundContent={tipLabel(__('暂无数据'))}
            //                     />
            //                 </Form.Item>
            //             )
            //         }
            //         if (BelongList.includes(operator)) {
            //             return (
            //                 <Form.Item
            //                     name={[innerField.name, 'value']}
            //                     rules={[
            //                         {
            //                             required: true,
            //                             message: __('请输入限定内容'),
            //                         },
            //                         {
            //                             type: 'array',
            //                             defaultField: {
            //                                 pattern: numReg,
            //                                 message: ErrorInfo.ONLYSUPNUM,
            //                                 transform: (val) => trim(val),
            //                             },
            //                         },
            //                     ]}
            //                     style={{ width: valueWi }}
            //                 >
            //                     <Select
            //                         placeholder={__('请输入限定内容')}
            //                         mode="tags"
            //                         maxTagCount={1}
            //                         maxTagTextLength={10}
            //                         maxTagPlaceholder={(omittedValues) =>
            //                             maxTagContent(omittedValues)
            //                         }
            //                         options={
            //                             tableList?.find(
            //                                 (a) =>
            //                                     a.dict_id ===
            //                                     originFieldInfo?.dict_id,
            //                             )?.options || []
            //                         }
            //                         onChange={(val) =>
            //                             handleValueChange(
            //                                 i,
            //                                 j,
            //                                 val,
            //                                 originFieldInfo,
            //                                 'numberArray',
            //                             )
            //                         }
            //                         optionLabelProp="showLabel"
            //                         notFoundContent={null}
            //                         getPopupContainer={(n) => n.parentNode}
            //                     />
            //                 </Form.Item>
            //             )
            //         }
            //         return defaultNode
            //     case FieldTypes.CHAR:
            //         if (limitChoose.includes(operator)) {
            //             return (
            //                 <Form.Item
            //                     name={[innerField.name, 'value']}
            //                     rules={[
            //                         {
            //                             required: true,
            //                             message: __('请选择限定内容'),
            //                         },
            //                     ]}
            //                     style={{ width: valueWi }}
            //                 >
            //                     <AutoComplete
            //                         placeholder={__('请输入限定内容')}
            //                         maxLength={128}
            //                         options={
            //                             tableList?.find(
            //                                 (a) =>
            //                                     a.dict_id ===
            //                                     originFieldInfo?.dict_id,
            //                             )?.options || []
            //                         }
            //                         filterOption
            //                         allowClear
            //                         getPopupContainer={(n) => n.parentNode}
            //                         onChange={(currentValue) =>
            //                             handleValueChange(
            //                                 i,
            //                                 j,
            //                                 currentValue,
            //                                 originFieldInfo,
            //                             )
            //                         }
            //                         onBlur={() =>
            //                             handleValueChange(
            //                                 i,
            //                                 j,
            //                                 value,
            //                                 originFieldInfo,
            //                                 'other',
            //                             )
            //                         }
            //                     />
            //                 </Form.Item>
            //             )
            //         }
            //         if (limitString.includes(operator)) {
            //             return (
            //                 <Form.Item
            //                     name={[innerField.name, 'value']}
            //                     rules={[
            //                         {
            //                             required: true,
            //                             validator: validateEmpty(
            //                                 __('输入不能为空'),
            //                             ),
            //                         },
            //                     ]}
            //                     style={{ flex: 1 }}
            //                 >
            //                     <Input
            //                         placeholder={__('请输入限定内容')}
            //                         maxLength={128}
            //                         onChange={(e) =>
            //                             handleValueChange(
            //                                 i,
            //                                 j,
            //                                 e.target.value,
            //                                 originFieldInfo,
            //                             )
            //                         }
            //                         onBlur={() =>
            //                             handleValueChange(
            //                                 i,
            //                                 j,
            //                                 value,
            //                                 originFieldInfo,
            //                                 'other',
            //                                 true,
            //                             )
            //                         }
            //                     />
            //                 </Form.Item>
            //             )
            //         }
            //         if (limitList.includes(operator)) {
            //             return (
            //                 <Form.Item
            //                     name={[innerField.name, 'value']}
            //                     rules={[
            //                         {
            //                             required: true,
            //                             message: __('请选择限定内容'),
            //                         },
            //                     ]}
            //                     style={{ width: valueWi }}
            //                 >
            //                     <Select
            //                         placeholder={__('请选择限定内容')}
            //                         mode="multiple"
            //                         options={
            //                             tableList?.find(
            //                                 (info) =>
            //                                     info.dict_id ===
            //                                     originFieldInfo?.dict_id,
            //                             )?.options || []
            //                         }
            //                         maxTagCount={3}
            //                         maxTagTextLength={10}
            //                         maxTagPlaceholder={(omittedValues) =>
            //                             maxTagContent(omittedValues)
            //                         }
            //                         onChange={(val) =>
            //                             handleValueChange(
            //                                 i,
            //                                 j,
            //                                 val,
            //                                 originFieldInfo,
            //                                 'array',
            //                             )
            //                         }
            //                         getPopupContainer={(n) => n.parentNode}
            //                         notFoundContent={tipLabel(__('暂无数据'))}
            //                     />
            //                 </Form.Item>
            //             )
            //         }
            //         if (BelongList.includes(operator)) {
            //             return (
            //                 <Form.Item
            //                     name={[innerField.name, 'value']}
            //                     rules={[
            //                         {
            //                             required: true,
            //                             validator: validateEmpty(
            //                                 __('输入不能为空'),
            //                             ),
            //                         },
            //                     ]}
            //                     style={{ width: valueWi }}
            //                 >
            //                     <Select
            //                         placeholder={__('请输入限定内容')}
            //                         mode="tags"
            //                         maxTagCount={1}
            //                         maxTagTextLength={10}
            //                         maxTagPlaceholder={(omittedValues) =>
            //                             maxTagContent(omittedValues)
            //                         }
            //                         options={
            //                             tableList?.find(
            //                                 (a) =>
            //                                     a.dict_id ===
            //                                     originFieldInfo?.dict_id,
            //                             )?.options || []
            //                         }
            //                         onChange={(val) =>
            //                             handleValueChange(
            //                                 i,
            //                                 j,
            //                                 val,
            //                                 originFieldInfo,
            //                                 'array',
            //                             )
            //                         }
            //                         notFoundContent={null}
            //                         getPopupContainer={(n) => n.parentNode}
            //                     />
            //                 </Form.Item>
            //             )
            //         }
            //         return defaultNode
            //     case FieldTypes.BOOL:
            //         return defaultNode
            //     case FieldTypes.DATE:
            //     case FieldTypes.TIMESTAMP:
            //     case FieldTypes.DATETIME:
            //         if (beforeTime.includes(operator)) {
            //             return (
            //                 <Space.Compact block>
            //                     <Form.Item
            //                         name={[
            //                             innerField.name,
            //                             'value',
            //                             'dateNumber',
            //                         ]}
            //                         rules={[
            //                             {
            //                                 required: true,
            //                                 validator: (e, val) =>
            //                                     validatePositiveNumber(val),
            //                             },
            //                         ]}
            //                         style={{
            //                             flex: 1,
            //                         }}
            //                     >
            //                         <InputNumber
            //                             style={{ width: '100%' }}
            //                             placeholder={__('请输入数字')}
            //                             keyboard
            //                             min={0}
            //                             stringMode
            //                             max={65535}
            //                             onChange={(val) =>
            //                                 handleValueChange(
            //                                     i,
            //                                     j,
            //                                     val,
            //                                     originFieldInfo,
            //                                     'dateNumber',
            //                                 )
            //                             }
            //                         />
            //                     </Form.Item>
            //                     <Form.Item
            //                         name={[innerField.name, 'value', 'unit']}
            //                         style={{ width: '30%' }}
            //                         rules={[
            //                             {
            //                                 required: true,
            //                                 message: __('请选择'),
            //                             },
            //                         ]}
            //                     >
            //                         <Select
            //                             getPopupContainer={(n) => n.parentNode}
            //                             placeholder={__('请选择')}
            //                             options={
            //                                 field_type_en === FieldTypes.DATE
            //                                     ? beforeDateOptions
            //                                     : beforeDateTimeOptions
            //                             }
            //                             onChange={(val) =>
            //                                 handleValueChange(
            //                                     i,
            //                                     j,
            //                                     val,
            //                                     originFieldInfo,
            //                                     'unit',
            //                                 )
            //                             }
            //                         />
            //                     </Form.Item>
            //                 </Space.Compact>
            //             )
            //         }
            //         if (currentTime.includes(operator)) {
            //             return (
            //                 <Form.Item
            //                     name={[innerField.name, 'value']}
            //                     style={{ flex: 1 }}
            //                     rules={[
            //                         {
            //                             required: true,
            //                             message: __('请选择限定内容'),
            //                         },
            //                     ]}
            //                 >
            //                     <Select
            //                         getPopupContainer={(n) => n.parentNode}
            //                         placeholder={__('请选择限定内容')}
            //                         options={
            //                             field_type_en === FieldTypes.DATE
            //                                 ? currentDateOptions
            //                                 : currentDataTimeOptions
            //                         }
            //                         onChange={(val) =>
            //                             handleValueChange(
            //                                 i,
            //                                 j,
            //                                 val,
            //                                 originFieldInfo,
            //                             )
            //                         }
            //                     />
            //                 </Form.Item>
            //             )
            //         }
            //         return (
            //             <Form.Item
            //                 name={[innerField.name, 'value', 'date']}
            //                 rules={[
            //                     {
            //                         required: true,
            //                         message:
            //                             field_type_en === FieldTypes.DATE
            //                                 ? __('请选择日期')
            //                                 : __('请选择时间'),
            //                     },
            //                 ]}
            //                 style={{ flex: 1 }}
            //             >
            //                 <RangePicker
            //                     style={{ width: '100%' }}
            //                     placeholder={
            //                         field_type_en === FieldTypes.DATE
            //                             ? [__('开始日期'), __('结束日期')]
            //                             : [__('开始时间'), __('结束时间')]
            //                     }
            //                     showTime={
            //                         field_type_en === FieldTypes.DATE
            //                             ? false
            //                             : { format: 'HH:mm' }
            //                     }
            //                     onChange={(val) =>
            //                         handleValueChange(
            //                             i,
            //                             j,
            //                             val,
            //                             originFieldInfo,
            //                             'date',
            //                         )
            //                     }
            //                 />
            //             </Form.Item>
            //         )
            //     default:
            //         break
            // }

            return (
                <div style={{ width: 'calc(42% - 32px)' }}>
                    <FieldLimitItem
                        width="100%"
                        field={innerField}
                        exampleData={
                            fieldsData.exampleData.find(
                                (e) =>
                                    e.id === originFieldInfo?.form_view_id ||
                                    e.id === fieldItem?.formulaId,
                            )?.example
                        }
                        openProbe={!!originFieldInfo}
                        getItem={() =>
                            originFieldInfo || {
                                ...fieldItem,
                                technical_name: sourceFieldName,
                            }
                        }
                        getOperator={() => operator}
                        shouldUpdate={(pre, cur) => {
                            return (
                                pre.where[i]?.member[j]?.field !==
                                    cur.where[i]?.member[j]?.field ||
                                pre.where[i]?.member[j]?.operator !==
                                    cur.where[i]?.member[j]?.operator
                            )
                        }}
                        onChange={(val) => {
                            const where = form.getFieldValue(['where'])
                            form.setFieldValue('where', where)
                        }}
                    />
                </div>
            )
        }
        return defaultNode
    }

    return (
        <div className={styles.whereFormulaWrap}>
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
                <div className={styles.wf_contentWrap}>
                    {!formulaItem?.errorMsg ||
                    formulaItem.errorMsg === FormulaError.ConfigError ? (
                        <Form
                            layout="vertical"
                            form={form}
                            autoComplete="off"
                            style={{
                                height: '100%',
                            }}
                            onValuesChange={(changedValues, allValues) => {
                                setValuesChange(true)
                            }}
                        >
                            <Form.List
                                name="where"
                                initialValue={[
                                    {
                                        relation: '',
                                        member: [
                                            {
                                                field: undefined,
                                            },
                                        ],
                                    },
                                ]}
                            >
                                {/* 多组数据数据内容 */}
                                {(fields, { add }) => {
                                    const allMemberNum: number = form
                                        .getFieldValue('where')
                                        ?.reduce((pre, cur) => {
                                            return (
                                                pre + (cur?.member?.length || 0)
                                            )
                                        }, 0)
                                    return (
                                        <div
                                            style={{
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                            }}
                                        >
                                            {/* 多组数据增加组数 */}
                                            <div
                                                style={{
                                                    marginBottom: 16,
                                                    marginLeft: 16,
                                                    height: 22,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Button
                                                    disabled={
                                                        fields.length >= 20
                                                    }
                                                    type="link"
                                                    size="small"
                                                    onClick={() =>
                                                        add({
                                                            member: [
                                                                {
                                                                    field: undefined,
                                                                },
                                                            ],
                                                            relation: '',
                                                        })
                                                    }
                                                    icon={<AddOutlined />}
                                                >
                                                    {__('新增过滤')}
                                                </Button>
                                            </div>

                                            <div
                                                style={{
                                                    overflow: 'auto',
                                                    height: 0,
                                                    flex: 1,
                                                    marginLeft:
                                                        fields.length === 1
                                                            ? 16
                                                            : 0,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                    }}
                                                >
                                                    {/* 多组数据左侧条件 */}
                                                    {fields.length > 1 && (
                                                        <div
                                                            className={
                                                                styles.outLeftOperatorWrap
                                                            }
                                                            style={{
                                                                marginLeft:
                                                                    fields.length >
                                                                    1
                                                                        ? 16
                                                                        : 0,
                                                            }}
                                                        >
                                                            <div
                                                                className={
                                                                    styles.outLeftOperator
                                                                }
                                                            >
                                                                <Select
                                                                    size="small"
                                                                    placement="bottomLeft"
                                                                    bordered={
                                                                        false
                                                                    }
                                                                    className={
                                                                        styles.leftSelect
                                                                    }
                                                                    suffixIcon={
                                                                        <CaretDownOutlined />
                                                                    }
                                                                    options={[
                                                                        {
                                                                            value: 'and',
                                                                            label: __(
                                                                                '且',
                                                                            ),
                                                                        },
                                                                        {
                                                                            value: 'or',
                                                                            label: __(
                                                                                '或',
                                                                            ),
                                                                        },
                                                                    ]}
                                                                    value={
                                                                        whereRelation
                                                                    }
                                                                    onChange={(
                                                                        val,
                                                                    ) => {
                                                                        setWhereRelation(
                                                                            val,
                                                                        )
                                                                    }}
                                                                    getPopupContainer={(
                                                                        n,
                                                                    ) =>
                                                                        n.parentNode
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div
                                                        className={
                                                            styles.limitWrap
                                                        }
                                                        style={{
                                                            paddingLeft:
                                                                fields.length >
                                                                1
                                                                    ? 18
                                                                    : 0,
                                                        }}
                                                    >
                                                        {fields?.map(
                                                            (
                                                                outItem,
                                                                outIndex,
                                                            ) => {
                                                                const {
                                                                    key: outKey,
                                                                    name: outName,
                                                                } = outItem
                                                                const outValue =
                                                                    form.getFieldValue(
                                                                        'where',
                                                                    )?.[
                                                                        outIndex
                                                                    ]
                                                                return (
                                                                    <div
                                                                        key={
                                                                            outKey
                                                                        }
                                                                    >
                                                                        <div
                                                                            className={
                                                                                styles.limitItem
                                                                            }
                                                                        >
                                                                            {/* 多组数据左侧条件空间 */}
                                                                            {fields.length >
                                                                                1 && (
                                                                                <div
                                                                                    className={
                                                                                        styles.outLeftWrap
                                                                                    }
                                                                                    style={
                                                                                        outIndex ===
                                                                                        fields.length -
                                                                                            1
                                                                                            ? {
                                                                                                  alignItems:
                                                                                                      'start',
                                                                                              }
                                                                                            : {
                                                                                                  alignItems:
                                                                                                      'end',
                                                                                              }
                                                                                    }
                                                                                >
                                                                                    <div
                                                                                        className={
                                                                                            styles.outLeft
                                                                                        }
                                                                                        style={
                                                                                            outIndex ===
                                                                                            0
                                                                                                ? {
                                                                                                      borderBottom:
                                                                                                          'none',
                                                                                                  }
                                                                                                : outIndex ===
                                                                                                  fields.length -
                                                                                                      1
                                                                                                ? {
                                                                                                      borderTop:
                                                                                                          'none',
                                                                                                  }
                                                                                                : {
                                                                                                      borderTop:
                                                                                                          'none',
                                                                                                      borderBottom:
                                                                                                          'none',
                                                                                                      height: '100%',
                                                                                                  }
                                                                                        }
                                                                                    >
                                                                                        {/* <div
                                                                                    hidden={
                                                                                        outIndex ===
                                                                                            0 ||
                                                                                        outIndex ===
                                                                                            fields.length -
                                                                                                1
                                                                                    }
                                                                                    className={
                                                                                        styles.outLeftMiddle
                                                                                    }
                                                                                /> */}
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            <div
                                                                                className={
                                                                                    styles.innerContent
                                                                                }
                                                                            >
                                                                                {/* 单组数据左侧条件 */}
                                                                                {outValue
                                                                                    ?.member
                                                                                    .length >
                                                                                    1 && (
                                                                                    <div
                                                                                        className={
                                                                                            styles.innerLeft
                                                                                        }
                                                                                    >
                                                                                        <div
                                                                                            className={
                                                                                                styles.leftOperator
                                                                                            }
                                                                                        >
                                                                                            <Form.Item
                                                                                                name={[
                                                                                                    outName,
                                                                                                    'relation',
                                                                                                ]}
                                                                                                noStyle
                                                                                            >
                                                                                                <Select
                                                                                                    size="small"
                                                                                                    placement="bottomLeft"
                                                                                                    bordered={
                                                                                                        false
                                                                                                    }
                                                                                                    className={
                                                                                                        styles.leftSelect
                                                                                                    }
                                                                                                    suffixIcon={
                                                                                                        <CaretDownOutlined />
                                                                                                    }
                                                                                                    options={[
                                                                                                        {
                                                                                                            value: 'and',
                                                                                                            label: __(
                                                                                                                '且',
                                                                                                            ),
                                                                                                        },
                                                                                                        {
                                                                                                            value: 'or',
                                                                                                            label: __(
                                                                                                                '或',
                                                                                                            ),
                                                                                                        },
                                                                                                    ]}
                                                                                                    getPopupContainer={(
                                                                                                        n,
                                                                                                    ) =>
                                                                                                        n.parentNode
                                                                                                    }
                                                                                                />
                                                                                            </Form.Item>
                                                                                        </div>
                                                                                    </div>
                                                                                )}

                                                                                {/* 单组数据数据内容 */}
                                                                                <Form.List
                                                                                    name={[
                                                                                        outName,
                                                                                        'member',
                                                                                    ]}
                                                                                    initialValue={[
                                                                                        {
                                                                                            field: undefined,
                                                                                        },
                                                                                    ]}
                                                                                >
                                                                                    {(
                                                                                        subfields,
                                                                                    ) => (
                                                                                        <div
                                                                                            className={
                                                                                                styles.innerWrap
                                                                                            }
                                                                                        >
                                                                                            {subfields.map(
                                                                                                (
                                                                                                    innerItem,
                                                                                                    innerIndex,
                                                                                                ) => {
                                                                                                    const {
                                                                                                        key: innerKey,
                                                                                                        name: innerName,
                                                                                                    } =
                                                                                                        innerItem
                                                                                                    const innerValue =
                                                                                                        outValue
                                                                                                            ?.member[
                                                                                                            innerIndex
                                                                                                        ]
                                                                                                    const {
                                                                                                        field,
                                                                                                        operator,
                                                                                                        value,
                                                                                                    } =
                                                                                                        innerValue
                                                                                                    const delDisabled =
                                                                                                        fields.length ===
                                                                                                            1 &&
                                                                                                        subfields.length ===
                                                                                                            1 &&
                                                                                                        innerIndex ===
                                                                                                            0 &&
                                                                                                        !field
                                                                                                    const addDisabled =
                                                                                                        !field ||
                                                                                                        !operator ||
                                                                                                        (!noContentLimit.includes(
                                                                                                            operator,
                                                                                                        ) &&
                                                                                                            (typeof value ===
                                                                                                                'object' &&
                                                                                                            !Array.isArray(
                                                                                                                value,
                                                                                                            )
                                                                                                                ? (!value?.dateNumber ||
                                                                                                                      !value?.unit) &&
                                                                                                                  !value?.date
                                                                                                                : !value))
                                                                                                    return (
                                                                                                        <div
                                                                                                            key={
                                                                                                                innerKey
                                                                                                            }
                                                                                                            className={
                                                                                                                styles.innerItemWrap
                                                                                                            }
                                                                                                            // style={{
                                                                                                            //     marginBottom:
                                                                                                            //         innerIndex !==
                                                                                                            //         subfields.length -
                                                                                                            //             1
                                                                                                            //             ? 16
                                                                                                            //             : 0,
                                                                                                            // }}
                                                                                                        >
                                                                                                            {/* 单条数据填充内容 */}
                                                                                                            <div
                                                                                                                className={
                                                                                                                    styles.innerList
                                                                                                                }
                                                                                                            >
                                                                                                                <div
                                                                                                                    style={{
                                                                                                                        display:
                                                                                                                            'flex',
                                                                                                                        flex: 1,
                                                                                                                    }}
                                                                                                                >
                                                                                                                    {/* <div
                                                                                                            style={{
                                                                                                                display:
                                                                                                                    'flex',
                                                                                                            }}
                                                                                                        > */}
                                                                                                                    <Form.Item
                                                                                                                        name={[
                                                                                                                            innerName,
                                                                                                                            'field',
                                                                                                                        ]}
                                                                                                                        rules={[
                                                                                                                            {
                                                                                                                                required:
                                                                                                                                    true,
                                                                                                                                message:
                                                                                                                                    __(
                                                                                                                                        '请选择字段名称',
                                                                                                                                    ),
                                                                                                                            },
                                                                                                                        ]}
                                                                                                                        style={{
                                                                                                                            marginRight: 16,
                                                                                                                            flexShrink: 0,
                                                                                                                            width: '36%',
                                                                                                                            alignSelf:
                                                                                                                                'center',
                                                                                                                        }}
                                                                                                                    >
                                                                                                                        <Select
                                                                                                                            placeholder={__(
                                                                                                                                '请选择字段名称',
                                                                                                                            )}
                                                                                                                            dropdownMatchSelectWidth={
                                                                                                                                200
                                                                                                                            }
                                                                                                                            allowClear
                                                                                                                            showSearch
                                                                                                                            filterOption={(
                                                                                                                                inputValue,
                                                                                                                                option,
                                                                                                                            ) =>
                                                                                                                                filterRelatedField(
                                                                                                                                    inputValue,
                                                                                                                                    option,
                                                                                                                                )
                                                                                                                            }
                                                                                                                            options={
                                                                                                                                fieldOptions
                                                                                                                            }
                                                                                                                            onChange={(
                                                                                                                                val,
                                                                                                                            ) =>
                                                                                                                                handleFieldChange(
                                                                                                                                    outIndex,
                                                                                                                                    innerIndex,
                                                                                                                                    val,
                                                                                                                                    innerValue,
                                                                                                                                )
                                                                                                                            }
                                                                                                                            notFoundContent={tipLabel(
                                                                                                                                __(
                                                                                                                                    '抱歉，没有找到相关内容',
                                                                                                                                ),
                                                                                                                            )}
                                                                                                                            getPopupContainer={(
                                                                                                                                n,
                                                                                                                            ) =>
                                                                                                                                n.parentNode
                                                                                                                            }
                                                                                                                        />
                                                                                                                    </Form.Item>
                                                                                                                    <Form.Item
                                                                                                                        name={[
                                                                                                                            innerName,
                                                                                                                            'operator',
                                                                                                                        ]}
                                                                                                                        style={{
                                                                                                                            width: '22%',
                                                                                                                            marginRight: 16,
                                                                                                                            flexShrink: 0,
                                                                                                                            alignSelf:
                                                                                                                                'center',
                                                                                                                        }}
                                                                                                                        rules={[
                                                                                                                            {
                                                                                                                                required:
                                                                                                                                    true,
                                                                                                                                message:
                                                                                                                                    __(
                                                                                                                                        '请选择过滤条件',
                                                                                                                                    ),
                                                                                                                            },
                                                                                                                        ]}
                                                                                                                    >
                                                                                                                        <Select
                                                                                                                            placeholder={__(
                                                                                                                                '过滤条件',
                                                                                                                            )}
                                                                                                                            options={renderLimitOptions(
                                                                                                                                outIndex,
                                                                                                                                innerIndex,
                                                                                                                            )}
                                                                                                                            onChange={(
                                                                                                                                val,
                                                                                                                            ) =>
                                                                                                                                handleOperatorChange(
                                                                                                                                    outIndex,
                                                                                                                                    innerIndex,
                                                                                                                                    val,
                                                                                                                                    innerValue,
                                                                                                                                )
                                                                                                                            }
                                                                                                                            notFoundContent={tipLabel(
                                                                                                                                __(
                                                                                                                                    '请先选择字段',
                                                                                                                                ),
                                                                                                                            )}
                                                                                                                            getPopupContainer={(
                                                                                                                                n,
                                                                                                                            ) =>
                                                                                                                                n.parentNode
                                                                                                                            }
                                                                                                                        />
                                                                                                                    </Form.Item>
                                                                                                                    {/* </div> */}
                                                                                                                    {renderLimitNode(
                                                                                                                        outIndex,
                                                                                                                        innerIndex,
                                                                                                                        innerItem,
                                                                                                                        innerValue,
                                                                                                                    )}
                                                                                                                </div>

                                                                                                                {/* 单条数据删除 */}
                                                                                                                <div
                                                                                                                    className={
                                                                                                                        styles.innerItemDelWrap
                                                                                                                    }
                                                                                                                    style={{
                                                                                                                        marginLeft: 12,
                                                                                                                    }}
                                                                                                                >
                                                                                                                    <DeleteOutLined
                                                                                                                        className={classnames(
                                                                                                                            styles.innerItemDel,
                                                                                                                            delDisabled &&
                                                                                                                                styles.innerItemDelDisabled,
                                                                                                                        )}
                                                                                                                        onClick={() => {
                                                                                                                            if (
                                                                                                                                delDisabled
                                                                                                                            )
                                                                                                                                return
                                                                                                                            handleRemoveOneData(
                                                                                                                                outIndex,
                                                                                                                                innerIndex,
                                                                                                                            )
                                                                                                                        }}
                                                                                                                    />
                                                                                                                </div>
                                                                                                                {/* 单组数据增加条数 */}
                                                                                                                <div
                                                                                                                    className={
                                                                                                                        styles.innerItemDelWrap
                                                                                                                    }
                                                                                                                    style={{
                                                                                                                        visibility:
                                                                                                                            innerIndex !==
                                                                                                                                subfields.length -
                                                                                                                                    1 ||
                                                                                                                            subfields.length >=
                                                                                                                                20
                                                                                                                                ? 'hidden'
                                                                                                                                : 'visible',
                                                                                                                        marginLeft: 4,
                                                                                                                    }}
                                                                                                                >
                                                                                                                    <AddOutlined
                                                                                                                        className={classnames(
                                                                                                                            styles.innerItemDel,
                                                                                                                            addDisabled &&
                                                                                                                                styles.innerItemDelDisabled,
                                                                                                                        )}
                                                                                                                        onClick={() => {
                                                                                                                            if (
                                                                                                                                addDisabled
                                                                                                                            )
                                                                                                                                return
                                                                                                                            handleAddOneData(
                                                                                                                                outIndex,
                                                                                                                            )
                                                                                                                        }}
                                                                                                                    />
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    )
                                                                                                },
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </Form.List>
                                                                            </div>
                                                                        </div>

                                                                        {/* 多组数据间隔线 */}
                                                                        {fields.length >
                                                                            1 &&
                                                                            outIndex !==
                                                                                fields.length -
                                                                                    1 && (
                                                                                <div
                                                                                    className={
                                                                                        styles.outLeftLine
                                                                                    }
                                                                                />
                                                                            )}
                                                                    </div>
                                                                )
                                                            },
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }}
                            </Form.List>
                        </Form>
                    ) : (
                        dataEmptyView(formulaItem?.errorMsg, formulaItem?.type)
                    )}
                </div>
            )}
        </div>
    )
})

export default WhereFormula
