import React, { useState, useImperativeHandle, forwardRef } from 'react'
import {
    Form,
    Button,
    Space,
    Select,
    Input,
    DatePicker,
    InputNumber,
    AutoComplete,
} from 'antd'
import { CaretDownOutlined } from '@ant-design/icons'
import { isNaN, get, trim } from 'lodash'
import classnames from 'classnames'
import moment from 'moment'
import { AddOutlined, DeleteOutLined } from '@/icons'
import __ from '../locale'
import { getFormulaItem, tipLabel } from './helper'
import { FieldTypes, fieldInfos, noContentLimit } from '../const'
import { getDictValuesBySearch, formatError } from '@/core'
import { ErrorInfo, numberReg } from '@/utils'
import { validateEmpty } from '@/utils/validate'
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
import styles from './styles.module.less'
import CopoundInput from '@/components/RowAndColFilter/RowFilter/CopoundInput'
import { FieldLimitItem } from '@/components/RowAndColFilter/RowFilter/CommonItem'

const { RangePicker } = DatePicker

export const getRelationValue = (
    form,
    key,
    where,
    preOutData,
    fieldsData,
    current,
    isValidate = false,
) => {
    return where?.map((a, i) => {
        const { member } = a
        return {
            ...a,
            member: member.map((b, j) => {
                const { field, operator, value } = b
                const findItem = preOutData.find(
                    (c) => c.id === field.id && c.sourceId === field.sourceId,
                )

                if (!findItem) {
                    if (isValidate) {
                        setTimeout(() => {
                            form.setFields([
                                {
                                    name: [key, i, 'member', j, 'field'],
                                    errors: [__('字段被删除')],
                                },
                            ])
                        }, 450)
                    } else {
                        return { field: undefined }
                    }
                }
                const findItemDataType =
                    findItem?.data_type ||
                    fieldsData.data.find((d) => d.id === findItem.id)?.data_type
                const fieldDataType =
                    field?.data_type ||
                    fieldsData.data.find((d) => d.id === field.id)?.data_type

                if (
                    findItemDataType !== fieldDataType ||
                    !fieldInfos[fieldDataType].limitListOptions.find(
                        (m) => m.value === operator,
                    )
                ) {
                    if (isValidate) {
                        setTimeout(() => {
                            form.setFields([
                                {
                                    name: ['where', i, 'member', j, 'field'],
                                    errors:
                                        findItemDataType === FieldTypes.TIME ||
                                        fieldDataType === FieldTypes.TIME
                                            ? [
                                                  __(
                                                      '当前不支持选择此类型的字段，请重新选择',
                                                  ),
                                              ]
                                            : [__('字段类型变更')],
                                },
                                {
                                    name: ['where', i, 'member', j, 'operator'],
                                    value: undefined,
                                },
                                {
                                    name: ['where', i, 'member', j, 'value'],
                                    value: undefined,
                                },
                            ])
                        }, 1500)
                    } else {
                        return {
                            field: `${findItem.id}_${findItem.sourceId}`,
                            operator: undefined,
                            value: undefined,
                        }
                    }
                }

                return {
                    ...b,
                    field: `${findItem.id}_${findItem.sourceId}`,
                    value,
                }
            }),
        }
    })
}
interface Props {
    form: any
    fieldsData: any
    preNodeData: any[]
    relationValue: string
    onRelationChange: (value: string) => void
    fieldOptions: any[]
    formListName: string
    addButtonText?: string
    showChildAdd?: boolean
    initialValue?: any
    clearErrorFields?: string[]
    disabled?: boolean
    required?: boolean // 是否必填
}
interface TableList {
    dict_id: string
    options: any[]
}

const FieldRelationFormList = (props: Props, ref: any) => {
    const {
        form,
        fieldsData,
        preNodeData,
        relationValue,
        onRelationChange,
        fieldOptions,
        formListName,
        addButtonText = '新增',
        showChildAdd = true,
        initialValue,
        clearErrorFields,
        disabled = false,
        required = false,
    } = props

    // 码表选项集
    const [tableList, setTableList] = useState<TableList[]>([])
    useImperativeHandle(ref, () => ({
        queryTableCodeList,
    }))
    /**
     * 删除一条数据
     * @param i 组index
     * @param j 条index
     */
    const handleRemoveOneData = (i, j) => {
        const values = form.getFieldValue(formListName)

        form.setFields([
            { name: [formListName, i, 'member', j, 'field'], errors: [] },
            { name: [formListName, i, 'member', j, 'value'], errors: [] },
        ])
        if (values.length === 1 && values[0].member.length === 1) {
            if (required) {
                form.setFieldValue(formListName, [
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
                form.setFieldValue(formListName, undefined)
            }
        } else {
            let clearRelation: boolean = false
            if (values[i].member.length === 2) {
                clearRelation = true
            }
            form.setFieldValue(
                formListName,
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
        const values = form.getFieldValue(formListName)
        form.setFieldValue(
            formListName,
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
    /**
     * 字段值变更
     * @param i 组index
     * @param j 条index
     * @param value 字段值
     * @param innerValue 整条数据
     */
    const handleFieldChange = (i, j, value, innerValue) => {
        const values = form.getFieldValue(formListName)
        form.setFieldValue(
            formListName,
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
            { name: [formListName, i, 'member', j, 'value'], errors: [] },
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
        const values = form.getFieldValue(formListName)
        const fieldInfo = preNodeData.find((info) => {
            const ids = innerValue.field.split('_')
            return info.id === ids[0] && info.sourceId === ids[1]
        })
        const field_type_en =
            fieldInfo?.data_type ||
            fieldsData.data.find((a) => a.id === fieldInfo?.id)?.data_type
        if (
            ([
                FieldTypes.INT,
                FieldTypes.FLOAT,
                FieldTypes.DECIMAL,
                FieldTypes.NUMBER,
            ].includes(field_type_en) &&
                limitNumber.includes(value)) ||
            (field_type_en === FieldTypes.CHAR &&
                ['belong', '=', '<>'].includes(value))
        ) {
            queryTableCodeList(innerValue.field)
        }
        form.setFieldValue(
            formListName,
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
            { name: [formListName, i, 'member', j, 'value'], errors: [] },
        ])
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
        const values = form.getFieldValue(formListName)

        form.setFieldValue(
            formListName,
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
     * 渲染过滤条件下拉框options
     * @param i 组index
     * @param j 条index
     */
    const renderLimitOptions = (i, j) => {
        const values = form.getFieldValue(formListName)
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
                ? fieldInfos[field_type_en].limitListOptions
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
        const { field, operator, value } = innerValue
        if (field && operator) {
            // const valueWi = 'calc(42% - 32px)'
            // 字段原始数据
            const originFieldInfo = fieldsData.data.find(
                (info) => info.id === field.split('_')[0],
            )
            // 算子中字段数据
            const fieldInfo = preNodeData.find((info) => {
                const ids = field.split('_')
                return info.id === ids[0] && info.sourceId === ids[1]
            })
            // const field_type_en =
            //     fieldInfo?.data_type ||
            //     fieldsData.data.find((a) => a.id === fieldInfo?.id)?.data_type

            return (
                <div style={{ width: 'calc(42% - 32px)' }}>
                    <FieldLimitItem
                        width="100%"
                        field={innerField}
                        exampleData={
                            fieldsData.exampleData?.find(
                                (e) => e.id === fieldsData?.formId,
                            )?.example
                        }
                        openProbe={!!originFieldInfo}
                        getItem={() =>
                            originFieldInfo || {
                                ...fieldInfo,
                                technical_name: fieldInfo?.name_en,
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

            // switch (field_type_en) {
            //     case FieldTypes.INT:
            //     case FieldTypes.FLOAT:
            //     case FieldTypes.DECIMAL:
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
            //                         disabled={disabled}
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
            //                             disabled={disabled}
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
            //                         disabled={disabled}
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
            //                         disabled={disabled}
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
            //                         disabled={disabled}
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
            //                         disabled={disabled}
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
            //                         disabled={disabled}
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
            //                         disabled={disabled}
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
            //                             disabled={disabled}
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
            //                             disabled={disabled}
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
            //                         disabled={disabled}
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
            //                     disabled={disabled}
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
            //                     onChange={(val) => {
            //                         let st = moment(
            //                             moment(val?.[0])
            //                                 .startOf('day')
            //                                 .format('YYYY-MM-DD HH:mm:ss'),
            //                         )

            //                         let et = moment(
            //                             moment(val?.[1])
            //                                 .endOf('day')
            //                                 .format('YYYY-MM-DD HH:mm:ss'),
            //                         )

            //                         if (field_type_en !== FieldTypes.DATE) {
            //                             st = moment(
            //                                 moment(val?.[0])
            //                                     .startOf('second')
            //                                     .format('YYYY-MM-DD HH:mm:ss'),
            //                             )
            //                             et = moment(
            //                                 moment(val?.[1])
            //                                     .endOf('second')
            //                                     .format('YYYY-MM-DD HH:mm:ss'),
            //                             )
            //                         }
            //                         handleValueChange(
            //                             i,
            //                             j,
            //                             [st, et],
            //                             originFieldInfo,
            //                             'date',
            //                         )
            //                     }}
            //                 />
            //             </Form.Item>
            //         )
            //     default:
            //         break
            // }
        }
        return defaultNode
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
    // 关联字段搜索过滤
    const filterRelatedField = (inputValue: string, option) => {
        const res = preNodeData
            .filter((info) => info.alias?.includes(trim(inputValue)))
            .filter(
                (info) =>
                    info.id === option?.value?.split('_')[0] &&
                    info.sourceId === option?.value?.split('_')[1],
            )
        return res.length > 0
    }
    return (
        <Form.List name={formListName} initialValue={initialValue}>
            {/* 多组数据数据内容 */}
            {(fields, { add }, { errors }) => {
                const allMemberNum: number = form
                    .getFieldValue(formListName)
                    ?.reduce((pre, cur) => {
                        return pre + (cur?.member?.length || 0)
                    }, 0)
                return (
                    <div
                        className={classnames(
                            disabled && styles.formListDisabled,
                        )}
                    >
                        <div
                            style={{
                                display: 'flex',
                                marginLeft: fields.length === 1 ? 16 : 0,
                            }}
                        >
                            {/* 多组数据左侧条件 */}
                            {fields.length > 1 && (
                                <div
                                    className={
                                        styles.fieldRelationOutLeftOperatorWrap
                                    }
                                    style={{
                                        height:
                                            allMemberNum * 54 +
                                            (fields.length - 1) * 40 +
                                            23,
                                        marginLeft: fields.length > 1 ? 16 : 0,
                                    }}
                                >
                                    <div className={styles.outLeftOperator}>
                                        <Select
                                            disabled={disabled}
                                            size="small"
                                            placement="bottomLeft"
                                            bordered={false}
                                            className={classnames(
                                                styles.leftSelect,
                                                disabled &&
                                                    styles.disabledLeftSelect,
                                            )}
                                            suffixIcon={<CaretDownOutlined />}
                                            options={[
                                                {
                                                    value: 'and',
                                                    label: __('且'),
                                                },
                                                {
                                                    value: 'or',
                                                    label: __('或'),
                                                },
                                            ]}
                                            value={relationValue}
                                            onChange={onRelationChange}
                                            getPopupContainer={(n) =>
                                                n.parentNode
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                            <div
                                className={styles.fieldRelationLimitWrap}
                                style={{
                                    paddingLeft: fields.length > 1 ? 18 : 0,
                                }}
                            >
                                {fields?.map((outItem, outIndex) => {
                                    const { key: outKey, name: outName } =
                                        outItem
                                    const outValue =
                                        form.getFieldValue(formListName)?.[
                                            outIndex
                                        ]
                                    return (
                                        <div key={outKey}>
                                            <div className={styles.limitItem}>
                                                {/* 多组数据左侧条件空间 */}
                                                {fields.length > 1 && (
                                                    <div
                                                        className={
                                                            styles.outLeftWrap
                                                        }
                                                        style={
                                                            outIndex ===
                                                            fields.length - 1
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
                                                            className={classnames(
                                                                styles.outLeft,
                                                                disabled &&
                                                                    styles.disabledOutLeft,
                                                            )}
                                                            style={
                                                                outIndex === 0
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
                                                    {outValue?.member.length >
                                                        1 && (
                                                        <div
                                                            className={
                                                                styles.innerLeft
                                                            }
                                                        >
                                                            <div
                                                                className={classnames(
                                                                    styles.leftOperator,
                                                                    disabled &&
                                                                        styles.disabledLeftOperator,
                                                                )}
                                                            >
                                                                <Form.Item
                                                                    name={[
                                                                        outName,
                                                                        'relation',
                                                                    ]}
                                                                    noStyle
                                                                >
                                                                    <Select
                                                                        disabled={
                                                                            disabled
                                                                        }
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
                                                        {(subfields) => (
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
                                                                            required
                                                                                ? fields.length ===
                                                                                      1 &&
                                                                                  subfields.length ===
                                                                                      1 &&
                                                                                  innerIndex ===
                                                                                      0 &&
                                                                                  !field
                                                                                : false
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
                                                                                                            '请选择业务名称',
                                                                                                        ),
                                                                                                },
                                                                                            ]}
                                                                                            style={{
                                                                                                marginRight: 16,
                                                                                                flexShrink: 0,
                                                                                                width: '36%',
                                                                                            }}
                                                                                        >
                                                                                            <Select
                                                                                                disabled={
                                                                                                    disabled
                                                                                                }
                                                                                                placeholder={__(
                                                                                                    '请选择业务名称',
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
                                                                                                        fieldOptions.length
                                                                                                            ? '抱歉，没有找到相关内容'
                                                                                                            : '暂无数据',
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
                                                                                                disabled={
                                                                                                    disabled
                                                                                                }
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
                                                                                    {!disabled && (
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
                                                                                    )}
                                                                                    {/* 单组数据增加条数 */}
                                                                                    {!disabled &&
                                                                                        showChildAdd && (
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
                                                                                        )}
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
                                            {fields.length > 1 &&
                                                outIndex !==
                                                    fields.length - 1 && (
                                                    <div
                                                        className={classnames(
                                                            styles.outLeftLine,
                                                            disabled &&
                                                                styles.disabledOutLeftLine,
                                                        )}
                                                    />
                                                )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        {/* 多组数据增加组数 */}
                        {!disabled && (
                            <div
                                style={{
                                    marginTop: fields.length ? 16 : 0,
                                    marginLeft: 16,
                                    marginBottom: fields.length ? 16 : 0,
                                    height: 22,
                                }}
                            >
                                <Button
                                    disabled={fields.length >= 20}
                                    type="link"
                                    size="small"
                                    onClick={() => {
                                        if (clearErrorFields?.length)
                                            form.setFields(
                                                clearErrorFields.map((k) => ({
                                                    name: k,
                                                    errors: null,
                                                })),
                                            )

                                        add({
                                            member: [
                                                {
                                                    field: undefined,
                                                },
                                            ],
                                            relation: '',
                                        })
                                    }}
                                    icon={<AddOutlined />}
                                >
                                    {addButtonText}
                                </Button>
                            </div>
                        )}
                        <Form.ErrorList errors={errors} />
                    </div>
                )
            }}
        </Form.List>
    )
}

export default forwardRef(FieldRelationFormList)
