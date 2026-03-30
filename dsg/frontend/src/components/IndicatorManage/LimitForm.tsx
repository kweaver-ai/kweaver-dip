import React, { useEffect, useRef, useState } from 'react'
import {
    Form,
    Button,
    Space,
    Select,
    Input,
    DatePicker,
    InputNumber,
    Cascader,
    Spin,
    AutoComplete,
} from 'antd'
import moment from 'moment'
import { CaretDownOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { trim } from 'lodash'
import { FormInstance } from 'antd/es/form'
import { useGetState } from 'ahooks'
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
} from '../BussinessConfigure/const'
import { validateEmpty } from '@/utils/validate'
import styles from './styles.module.less'
import { AddOutlined, DeleteOutLined } from '@/icons'
import {
    IFormula,
    IFormulaFields,
    getCodeTableDetail,
    getDimensionModelFields,
} from '@/core'
import { FieldTypes, LimitType, fieldInfos, noContentLimit } from './const'
import { numberReg } from '@/utils'
import { tipLabel, FormDataType } from './helper'
import __ from './locale'
import SelectRestrict from './SelectRestrict'

const { RangePicker } = DatePicker

interface LimitFormType {
    // 字段数据
    fieldsData: Array<FormDataType>

    form: FormInstance<any>

    formData: Array<any>

    limitType: LimitType

    itemKeyName: string

    dimFormsDataLoading?: boolean
    modelId?: string
    outRelation?: string
}

const LimitForm = ({
    fieldsData,
    form,
    formData,
    limitType,
    itemKeyName,
    dimFormsDataLoading = false,
    modelId = '',
    outRelation,
}: LimitFormType) => {
    const containerRef = useRef<HTMLDivElement | null>(null)
    // 字段选项
    const [fieldOptions, setFieldOptions] = useState<any>(fieldsData)

    const [outRelationValue, setOutRelationValue] = useState<string>('')

    // const [outRelationValue, setOutRelationValue] = useState<string>('')

    // 字段值自动补全
    const [
        autoCompleteOptions,
        setAutoCompleteOptions,
        getAutoCompleteOptions,
    ] = useGetState<{
        [key: string]: Array<{
            label: string
            value: string
        }>
    }>({})

    useEffect(() => {
        setFieldOptions(fieldsData)
    }, [fieldsData])

    // casder面板只展示最后一级目录
    const displayRender = (labels: string[]) => {
        if (labels && labels[0] && labels[1]) {
            return (
                <div className={styles.ellipsis}>
                    {labels[labels.length - 1]}
                </div>
            )
        }
        return (
            <span style={{ color: 'rgba(0, 0, 0, 0.35)' }}>
                {__('请选择字段名称')}
            </span>
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
        const values = form.getFieldValue(itemKeyName)
        form.setFieldValue(
            itemKeyName,
            values.map((a, idx1) => {
                if (idx1 === i) {
                    const { member } = a
                    return {
                        ...a,
                        member: member.map((b, idx2) => {
                            if (idx2 === j) {
                                if (!value) {
                                    return { field_id: undefined }
                                }
                                return { field_id: value }
                            }
                            return b
                        }),
                    }
                }
                return a
            }),
        )
        form.setFields([
            { name: [itemKeyName, i, 'member', j, 'value'], errors: [] },
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
        const values = form.getFieldValue(itemKeyName)
        // if (value === 'in list') {
        //     queryTableCodeList(innerValue.field)
        // }
        form.setFieldValue(
            itemKeyName,
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
            { name: [itemKeyName, i, 'member', j, 'value'], errors: [] },
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
            | 'other'
            | 'dateNumber'
            | 'unit'
            | 'date' = 'other',
        blur: boolean = false,
    ) => {
        const values = form.getFieldValue(itemKeyName)
        form.setFieldValue(
            itemKeyName,
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
                                if (flag === 'number') {
                                    const numValue = value.split('.')
                                    if (numValue.length > 1) {
                                        return {
                                            ...b,
                                            value: `${
                                                numValue[0]
                                            }.${numValue[1].substring(
                                                0,
                                                originField?.data_accuracy ||
                                                    30,
                                            )}`,
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
        const values = form.getFieldValue(itemKeyName)
        form.setFields([
            { name: [itemKeyName, i, 'member', j, 'field_id'], errors: [] },
            { name: [itemKeyName, i, 'member', j, 'value'], errors: [] },
        ])
        if (values.length === 1 && values[0].member.length === 1) {
            form.setFieldValue(itemKeyName, [])
        } else {
            form.setFieldValue(
                itemKeyName,
                values
                    .map((a, idx1) => {
                        if (idx1 === i) {
                            const { member } = a
                            if (member.length === 1) {
                                return undefined
                            }
                            return {
                                ...a,
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
        const values = form.getFieldValue(itemKeyName)
        form.setFieldValue(
            itemKeyName,
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

    // 确定控件长度类型
    const getWidthNum = (
        outlength: number,
        innerLength: number,
        flag: 'field_id' | 'value',
    ) => {
        if (flag === 'field_id') {
            return outlength === 1
                ? innerLength === 1
                    ? 175
                    : 149
                : innerLength === 1
                ? 145
                : 119
        }
        return outlength === 1
            ? innerLength === 1
                ? 295
                : 269
            : innerLength === 1
            ? 265
            : 239
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
        const values = form.getFieldValue(itemKeyName)
        const { field_id } = values[i].member[j]
        if (field_id) {
            const item = formData.find((info) => {
                return info.id === field_id[0]
            })
            const fieldItem = item?.fields?.find((fieldInfo) => {
                return fieldInfo.id === field_id[1]
            })
            return fieldItem ? fieldInfos[fieldItem?.type].limitListOptions : []
        }
        return []
    }

    const getCurrentFieldValues = async (currentIds: [string, string]) => {
        const allIds = Object.keys(getAutoCompleteOptions())
        if (allIds.includes(currentIds[1])) {
            return
        }
        if (modelId) {
            const { columns, data } = await getDimensionModelFields({
                dimensional_model_id: modelId,
                field_id: currentIds[1],
                table_id: currentIds[0],
            })
            setAutoCompleteOptions({
                ...getAutoCompleteOptions(),
                [currentIds[1]]: data.flat().map((currentData) => ({
                    label: currentData,
                    value: currentData,
                })),
            })
        }
    }
    /**
     * 根据过滤条件加载限定内容
     * @param i 组index
     * @param j 条index
     * @param innerField 条
     * @param innerValue 条数据
     */
    const renderLimitNode = (i, j, innerField, innerValue) => {
        const defaultNode: any = (
            <Form.Item name={[innerField.name, 'value']} style={{ flex: 1 }}>
                <Input disabled placeholder={__('无需填写限定内容')} />
            </Form.Item>
        )
        const formValue = form.getFieldValue(itemKeyName)
        const { field_id, operator, value } = innerValue
        if (field_id && operator) {
            const wi = getWidthNum(
                formValue.length,
                formValue[i].member.length,
                'value',
            )
            // 字段原始数据
            const selectedFormInfo = formData.find((info) => {
                return info.id === field_id[0]
            })
            const originFieldInfo = selectedFormInfo?.fields?.find(
                (fieldInfo) => {
                    return fieldInfo.id === field_id[1]
                },
            )
            if (originFieldInfo?.type === FieldTypes.CHAR) {
                getCurrentFieldValues(field_id)
            }
            switch (originFieldInfo?.type) {
                case FieldTypes.INT:
                case FieldTypes.FLOAT:
                case FieldTypes.DECIMAL:
                case FieldTypes.NUMBER:
                    if (limitNumber.includes(operator)) {
                        return (
                            <Form.Item
                                name={[innerField.name, 'value']}
                                style={{ flex: 1 }}
                                rules={[
                                    {
                                        required: true,
                                        validator: validateEmpty(
                                            __('输入不能为空'),
                                        ),
                                    },
                                ]}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    placeholder={__('请输入限定内容')}
                                    keyboard
                                    stringMode
                                    maxLength={
                                        originFieldInfo?.data_length || 65
                                    }
                                    onChange={(val) =>
                                        handleValueChange(
                                            i,
                                            j,
                                            val || '',
                                            originFieldInfo,
                                            'number',
                                        )
                                    }
                                />
                            </Form.Item>
                        )
                    }
                    if (limitList.includes(operator)) {
                        return (
                            // <Form.Item
                            //     name={[innerField.name, 'value']}
                            //     rules={[
                            //         {
                            //             required: true,
                            //             message: __('请选择限定内容'),
                            //         },
                            //     ]}
                            //     // style={{ width: '100%', maxWidth: wi }}
                            //     style={{ flex: 1 }}
                            // >
                            //     <Select
                            //         placeholder={__('请选择限定内容')}
                            //         mode="multiple"
                            //         options={
                            //             tableList?.find(
                            //                 (a) =>
                            //                     a.code === originFieldInfo?.id,
                            //             )?.options || []
                            //         }
                            //         maxTagCount={3}
                            //         maxTagTextLength={10}
                            //         maxTagPlaceholder={(omittedValues) =>
                            //             maxTagContent(omittedValues)
                            //         }
                            //         onChange={(val) =>
                            //             handleValueChange(
                            //                 i,
                            //                 j,
                            //                 val,
                            //                 originFieldInfo,
                            //                 'array',
                            //             )
                            //         }
                            //         getPopupContainer={(n) => n.parentNode}
                            //         notFoundContent={tipLabel(__('暂无数据'))}
                            //     />
                            // </Form.Item>
                            <Form.Item
                                name={[innerField.name, 'value']}
                                style={{ flex: 1 }}
                                rules={[
                                    {
                                        required: true,
                                        validator: validateEmpty(
                                            __('输入不能为空'),
                                        ),
                                    },
                                ]}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    placeholder={__('请输入限定内容')}
                                    keyboard
                                    stringMode
                                    maxLength={
                                        originFieldInfo?.data_length || 65
                                    }
                                    onChange={(val) =>
                                        handleValueChange(
                                            i,
                                            j,
                                            val,
                                            originFieldInfo,
                                            'number',
                                        )
                                    }
                                />
                            </Form.Item>
                        )
                    }
                    if (BelongList.includes(operator)) {
                        return (
                            <Form.Item
                                name={[innerField.name, 'value']}
                                rules={[
                                    {
                                        required: true,
                                        message: __('请输入限定内容'),
                                    },
                                ]}
                                // style={{ width: '100%', maxWidth: wi }}
                                style={{ flex: 1 }}
                            >
                                <Select
                                    placeholder={__(
                                        '输入限定内容后点击回车添加',
                                    )}
                                    mode="tags"
                                    maxTagCount={1}
                                    maxTagTextLength={10}
                                    maxTagPlaceholder={(omittedValues) =>
                                        maxTagContent(omittedValues)
                                    }
                                    onChange={(val) =>
                                        handleValueChange(
                                            i,
                                            j,
                                            val,
                                            originFieldInfo,
                                            'array',
                                        )
                                    }
                                    notFoundContent={null}
                                    getPopupContainer={(n) =>
                                        containerRef.current || n.parentNode
                                    }
                                />
                            </Form.Item>
                        )
                    }
                    return defaultNode
                case FieldTypes.CHAR:
                    if (limitString.includes(operator)) {
                        return (
                            <Form.Item
                                name={[innerField.name, 'value']}
                                rules={[
                                    {
                                        required: true,
                                        validator: validateEmpty(
                                            __('输入不能为空'),
                                        ),
                                    },
                                ]}
                                style={{ flex: 1 }}
                            >
                                {/* <AutoComplete
                                    placeholder={__('请输入限定内容')}
                                    maxLength={128}
                                    options={
                                        autoCompleteOptions[field_id[1]] || []
                                    }
                                    filterOption
                                    getPopupContainer={(n) =>
                                        containerRef.current || n.parentNode
                                    }
                                    onChange={(currentValue) =>
                                        handleValueChange(
                                            i,
                                            j,
                                            currentValue,
                                            originFieldInfo,
                                        )
                                    }
                                    onBlur={() =>
                                        handleValueChange(
                                            i,
                                            j,
                                            value,
                                            originFieldInfo,
                                            'other',
                                            true,
                                        )
                                    }
                                /> */}
                                {autoCompleteOptions[field_id[1]]?.length ? (
                                    <SelectRestrict
                                        options={
                                            autoCompleteOptions[field_id[1]] ||
                                            []
                                        }
                                        placeholder={__('请输入限定内容')}
                                        onChange={(currentValue) => {
                                            handleValueChange(
                                                i,
                                                j,
                                                currentValue,
                                                originFieldInfo,
                                            )
                                        }}
                                    />
                                ) : (
                                    <Input placeholder={__('请输入限定内容')} />
                                )}
                            </Form.Item>
                        )
                    }
                    if (limitList.includes(operator)) {
                        return (
                            // <Form.Item
                            //     name={[innerField.name, 'value']}
                            //     rules={[
                            //         {
                            //             required: true,
                            //             message: __('请选择限定内容'),
                            //         },
                            //     ]}
                            //     // style={{ width: '100%', maxWidth: wi }}
                            //     style={{ flex: 1 }}
                            // >
                            //     <Select
                            //         placeholder={__('请选择限定内容')}
                            //         mode="multiple"
                            //         options={
                            //             tableList?.find(
                            //                 (info) =>
                            //                     info.code ===
                            //                     originFieldInfo?.code_table_code,
                            //             )?.options || []
                            //         }
                            //         maxTagCount={3}
                            //         maxTagTextLength={10}
                            //         maxTagPlaceholder={(omittedValues) =>
                            //             maxTagContent(omittedValues)
                            //         }
                            //         onChange={(val) =>
                            //             handleValueChange(
                            //                 i,
                            //                 j,
                            //                 val,
                            //                 originFieldInfo,
                            //                 'array',
                            //             )
                            //         }
                            //         getPopupContainer={(n) => n.parentNode}
                            //         notFoundContent={tipLabel(__('暂无数据'))}
                            //     />
                            // </Form.Item>
                            <Form.Item
                                name={[innerField.name, 'value']}
                                rules={[
                                    {
                                        required: true,
                                        validator: validateEmpty(
                                            __('输入不能为空'),
                                        ),
                                    },
                                ]}
                                style={{ flex: 1 }}
                            >
                                <Input
                                    placeholder={__('请输入限定内容')}
                                    maxLength={128}
                                    onChange={(e) =>
                                        handleValueChange(
                                            i,
                                            j,
                                            e.target.value,
                                            originFieldInfo,
                                        )
                                    }
                                    onBlur={() =>
                                        handleValueChange(
                                            i,
                                            j,
                                            value,
                                            originFieldInfo,
                                            'other',
                                            true,
                                        )
                                    }
                                />
                            </Form.Item>
                        )
                    }
                    if (BelongList.includes(operator)) {
                        return (
                            <Form.Item
                                name={[innerField.name, 'value']}
                                rules={[
                                    {
                                        required: true,
                                        validator: validateEmpty(
                                            __('输入不能为空'),
                                        ),
                                    },
                                ]}
                                // style={{ width: '100%', maxWidth: wi }}
                                style={{ flex: 1 }}
                            >
                                <Select
                                    placeholder={__(
                                        '输入限定内容后点击回车添加',
                                    )}
                                    mode="tags"
                                    maxTagCount={1}
                                    maxTagTextLength={10}
                                    maxTagPlaceholder={(omittedValues) =>
                                        maxTagContent(omittedValues)
                                    }
                                    onChange={(val) =>
                                        handleValueChange(
                                            i,
                                            j,
                                            val,
                                            originFieldInfo,
                                            'array',
                                        )
                                    }
                                    notFoundContent={null}
                                    getPopupContainer={(n) =>
                                        containerRef.current || n.parentNode
                                    }
                                />
                            </Form.Item>
                        )
                    }
                    return defaultNode
                case FieldTypes.BOOL:
                    return defaultNode
                case FieldTypes.DATE:
                case FieldTypes.DATETIME:
                    if (beforeTime.includes(operator)) {
                        return (
                            <Space.Compact block>
                                <Form.Item
                                    name={[
                                        innerField.name,
                                        'value',
                                        'dateNumber',
                                    ]}
                                    rules={[
                                        {
                                            required: true,
                                            validator: (e, val) =>
                                                validatePositiveNumber(val),
                                        },
                                    ]}
                                    style={{
                                        flex: 1,
                                    }}
                                >
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        placeholder={__('请输入数字')}
                                        keyboard
                                        min={0}
                                        stringMode
                                        max={65535}
                                        onChange={(val) =>
                                            handleValueChange(
                                                i,
                                                j,
                                                val,
                                                originFieldInfo,
                                                'dateNumber',
                                            )
                                        }
                                    />
                                </Form.Item>
                                <Form.Item
                                    name={[innerField.name, 'value', 'unit']}
                                    style={{ width: '30%' }}
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请选择'),
                                        },
                                    ]}
                                >
                                    <Select
                                        getPopupContainer={(n) =>
                                            containerRef.current || n.parentNode
                                        }
                                        placeholder={__('请选择')}
                                        options={
                                            originFieldInfo.type ===
                                            FieldTypes.DATE
                                                ? beforeDateOptions
                                                : beforeDateTimeOptions
                                        }
                                        onChange={(val) =>
                                            handleValueChange(
                                                i,
                                                j,
                                                val,
                                                originFieldInfo,
                                                'unit',
                                            )
                                        }
                                    />
                                </Form.Item>
                            </Space.Compact>
                        )
                    }
                    if (currentTime.includes(operator)) {
                        return (
                            <Form.Item
                                name={[innerField.name, 'value']}
                                // style={{ width: '100%', maxWidth: wi }}
                                style={{ flex: 1 }}
                                rules={[
                                    {
                                        required: true,
                                        message: __('请选择限定内容'),
                                    },
                                ]}
                            >
                                <Select
                                    getPopupContainer={(n) =>
                                        containerRef.current || n.parentNode
                                    }
                                    placeholder={__('请选择限定内容')}
                                    options={
                                        originFieldInfo.type === FieldTypes.DATE
                                            ? currentDateOptions
                                            : currentDataTimeOptions
                                    }
                                    onChange={(val) =>
                                        handleValueChange(
                                            i,
                                            j,
                                            val,
                                            originFieldInfo,
                                        )
                                    }
                                />
                            </Form.Item>
                        )
                    }
                    return (
                        <Form.Item
                            name={[innerField.name, 'value', 'date']}
                            rules={[
                                {
                                    required: true,
                                    message:
                                        originFieldInfo.type === FieldTypes.DATE
                                            ? __('请选择日期')
                                            : __('请选择时间'),
                                },
                            ]}
                            style={{ flex: 1 }}
                        >
                            <RangePicker
                                style={{ width: '100%' }}
                                showTime={
                                    originFieldInfo.type === FieldTypes.DATE
                                        ? false
                                        : { format: 'HH:mm' }
                                }
                                placeholder={
                                    originFieldInfo.type === FieldTypes.DATE
                                        ? [__('开始日期'), __('结束日期')]
                                        : [__('开始时间'), __('结束时间')]
                                }
                                onChange={(val) =>
                                    handleValueChange(
                                        i,
                                        j,
                                        val,
                                        originFieldInfo,
                                        'date',
                                    )
                                }
                            />
                        </Form.Item>
                    )
                default:
                    break
            }
        }
        return defaultNode
    }

    return (
        <div className={styles.whereFormulaWrap} ref={containerRef}>
            <div
                style={{
                    display: 'flex',
                    overflow: 'auto',
                    height: '100%',
                    flex: 'auto',
                    // height:
                    //     (window.innerHeight - 52) *
                    //         (viewSize / 100) -
                    //     112,
                }}
            >
                <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, curValues) =>
                        prevValues[itemKeyName]?.length !==
                        curValues[itemKeyName]?.length
                    }
                >
                    {({ getFieldValue }) => {
                        const fields = getFieldValue(itemKeyName)
                        const allMemberNum: number = form
                            .getFieldValue(itemKeyName)
                            ?.reduce((pre, cur) => {
                                return pre + (cur?.member?.length || 0)
                            }, 0)
                        return (
                            fields?.length > 1 &&
                            outRelation && (
                                <div
                                    className={styles.outLeftOperatorWrap}
                                    style={{
                                        height:
                                            allMemberNum * 54 +
                                            (fields.length - 1) * 40 +
                                            23,
                                    }}
                                >
                                    <div className={styles.innerLeft}>
                                        <div className={styles.leftOperator}>
                                            <Form.Item
                                                noStyle
                                                name={outRelation}
                                                initialValue="and"
                                            >
                                                <Select
                                                    size="small"
                                                    placement="bottomLeft"
                                                    bordered={false}
                                                    className={
                                                        styles.leftSelect
                                                    }
                                                    suffixIcon={
                                                        <CaretDownOutlined />
                                                    }
                                                    popupClassName={
                                                        styles.leftSelectDrop
                                                    }
                                                    // onChange={(value) => {
                                                    //     form.setFieldValue(
                                                    //         outRelation,
                                                    //         value,
                                                    //     )
                                                    //     setOutRelationValue(
                                                    //         value,
                                                    //     )
                                                    // }}
                                                    // value={
                                                    //     outRelationValue ||
                                                    //     'and'
                                                    // }
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
                                                    getPopupContainer={(n) =>
                                                        containerRef.current ||
                                                        n.parentNode
                                                    }
                                                />
                                            </Form.Item>
                                        </div>
                                    </div>
                                </div>
                            )
                        )
                    }}
                </Form.Item>
                <Form.List name={itemKeyName} initialValue={[]}>
                    {/* 多组数据数据内容 */}
                    {(fields, { add }) => {
                        const allMemberNum: number = form
                            .getFieldValue(itemKeyName)
                            ?.reduce((pre, cur) => {
                                return pre + (cur?.member?.length || 0)
                            }, 0)
                        // const outRelationValue = outRelation
                        //     ? form.getFieldValue(outRelation)
                        //     : ''
                        const currenData = form.getFieldValue(itemKeyName)
                        return (
                            <div style={{ height: '100%', flex: 'auto' }}>
                                {/* 多组数据增加组数 */}

                                <div
                                    style={{
                                        display: 'flex',
                                        overflow: 'auto',
                                        // height:
                                        //     (window.innerHeight - 52) *
                                        //         (viewSize / 100) -
                                        //     112,
                                    }}
                                >
                                    <div
                                        className={styles.limitWrap}
                                        style={{
                                            paddingLeft:
                                                fields.length > 1 ? 11 : 0,
                                        }}
                                    >
                                        {fields?.map((outItem, outIndex) => {
                                            const {
                                                key: outKey,
                                                name: outName,
                                            } = outItem
                                            const outValue =
                                                form.getFieldValue(
                                                    itemKeyName,
                                                )?.[outIndex]
                                            return (
                                                <div key={outKey}>
                                                    <div
                                                        className={
                                                            styles.limitItem
                                                        }
                                                    >
                                                        {/* 多组数据左侧条件空间 */}
                                                        {fields.length > 1 && (
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
                                                            {outValue?.member
                                                                .length > 1 && (
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
                                                                                popupClassName={
                                                                                    styles.leftSelectDrop
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
                                                                                    containerRef.current ||
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
                                                                        field_id:
                                                                            undefined,
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
                                                                                    field_id,
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
                                                                                    !field_id
                                                                                const addDisabled =
                                                                                    !field_id ||
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
                                                                                                        'field_id',
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
                                                                                                        // flex: 1,
                                                                                                        marginRight: 16,
                                                                                                        // width: getWidthNum(
                                                                                                        //     fields.length,
                                                                                                        //     subfields.length,
                                                                                                        //     'field',
                                                                                                        // ),
                                                                                                        flexShrink: 0,
                                                                                                        width: '36%',
                                                                                                    }}
                                                                                                >
                                                                                                    <Cascader
                                                                                                        placeholder={__(
                                                                                                            '请选择字段名称',
                                                                                                        )}
                                                                                                        popupClassName={
                                                                                                            styles.cascaderWrapper
                                                                                                        }
                                                                                                        options={
                                                                                                            fieldOptions
                                                                                                        }
                                                                                                        displayRender={
                                                                                                            displayRender
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
                                                                                                        allowClear={
                                                                                                            false
                                                                                                        }
                                                                                                        getPopupContainer={(
                                                                                                            n,
                                                                                                        ) =>
                                                                                                            containerRef.current ||
                                                                                                            n.parentNode
                                                                                                        }
                                                                                                        notFoundContent={
                                                                                                            dimFormsDataLoading ? (
                                                                                                                <Spin />
                                                                                                            ) : (
                                                                                                                __(
                                                                                                                    '暂无数据',
                                                                                                                )
                                                                                                            )
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
                                                                                                            containerRef.current ||
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
                                                                                                        // delDisabled &&
                                                                                                        //     styles.innerItemDelDisabled,
                                                                                                    )}
                                                                                                    onClick={() => {
                                                                                                        // if (
                                                                                                        //     delDisabled
                                                                                                        // )
                                                                                                        //     return
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
                                                    {fields.length > 1 &&
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
                                        })}
                                    </div>
                                </div>

                                {(limitType === LimitType.NormalLimit ||
                                    currenData.length === 0) && (
                                    <div
                                        style={{
                                            marginTop: currenData.length
                                                ? 16
                                                : 8,
                                            height: 24,
                                        }}
                                    >
                                        <Button
                                            disabled={fields.length >= 20}
                                            type="link"
                                            size="small"
                                            onClick={() => {
                                                if (outRelation) {
                                                    const relation =
                                                        form.getFieldValue(
                                                            outRelation,
                                                        )
                                                    if (!relation) {
                                                        form.setFieldValue(
                                                            outRelation,
                                                            'and',
                                                        )
                                                    }
                                                }
                                                add({
                                                    member: [
                                                        {
                                                            field_id: undefined,
                                                        },
                                                    ],
                                                    relation: '',
                                                })
                                            }}
                                            icon={<AddOutlined />}
                                        >
                                            {__('新增限定')}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )
                    }}
                </Form.List>
            </div>
        </div>
    )
}

export default LimitForm
