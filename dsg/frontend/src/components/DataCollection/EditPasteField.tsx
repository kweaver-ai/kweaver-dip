import { Modal, Form, Button } from 'antd'
import * as React from 'react'
import { useState, useEffect } from 'react'
import { ExclamationCircleFilled } from '@ant-design/icons'
import { Node } from '@antv/x6'
import { cloneDeep } from 'lodash'
import { useGetState } from 'ahooks'
import { FormItemConfig, ComponentType } from '@/ui'
import AutoFormConfig from '@/ui/AutoFormConfig'
import __ from './locale'
import { getDataLengthValidate } from './helper'
import { checkNumberRanage } from '../FormGraph/helper'
import styles from './styles.module.less'
import { PasteSourceChecked } from './const'

interface EditPasteFieldType {
    onConfirm: (values) => void
    onCancel: () => void
    field: any
    open
    node: Node | null
}
const EditPasteField = ({
    onConfirm,
    onCancel,
    field,
    open,
    node,
}: EditPasteFieldType) => {
    const existDataLength = ['char', 'varchar', 'decimal', 'binary']
    const [form] = Form.useForm()
    const [dataNode, setDataNode, getDataNode] = useGetState<Node | null>(null)
    const [dataField, setDataField, getDataField] = useGetState<any>(null)
    const [config, setConfig, getConfig] = useGetState<{
        [key: string]: FormItemConfig
    }>({
        name: {
            label: __('字段名称'),
            type: ComponentType.Input,
            disabled: false,
            rules: [
                {
                    required: true,
                    message: __('输入不能为空'),
                },
                {
                    validateTrigger: ['onBlur'],
                    validator: (e, value) => checkNameRepeat(e, value),
                },
            ],
            placeholder: __('请输入字段名称'),
            maxLength: 255,
        },
        group1: {
            type: ComponentType.LayoutGroup,
            children: {
                widths: [12, 6, 6],
                config: {
                    type: {
                        type: ComponentType.Select,
                        label: __('数据类型'),
                        placeholder: __('请选择数据类型'),
                        options: [
                            { label: 'string', value: 'string' },
                            {
                                label: 'char',
                                value: 'char',
                            },
                            { label: 'varchar', value: 'varchar' },
                            {
                                label: 'tinyint',
                                value: 'tinyint',
                            },
                            { label: 'smallint', value: 'smallint' },
                            {
                                label: 'int',
                                value: 'int',
                            },
                            { label: 'bigint', value: 'bigint' },
                            {
                                label: 'float',
                                value: 'float',
                            },
                            {
                                label: 'double',
                                value: 'double',
                            },
                            {
                                label: 'decimal',
                                value: 'decimal',
                            },
                            { label: 'boolean', value: 'boolean' },
                            {
                                label: 'date',
                                value: 'date',
                            },
                            {
                                label: 'datetime',
                                value: 'datetime',
                            },
                            {
                                label: 'timestamp',
                                value: 'timestamp',
                            },
                            {
                                label: 'binary',
                                value: 'binary',
                            },
                        ],
                    },
                    length: {
                        type: ComponentType.InputNumber,
                        label: __('长度/精度'),
                        placeholder: existDataLength.includes(
                            form.getFieldsValue().type,
                        )
                            ? __('请输入数据长度/精度')
                            : __('无需填写长度/精度'),
                        disabled: !existDataLength.includes(field?.type),
                        rules: [
                            {
                                required: field?.type === 'binary',
                                message: __('输入不能为空'),
                            },
                            ...getDataLengthValidate(field?.type),
                        ],
                    },
                    field_precision: {
                        type: ComponentType.InputNumber,
                        label: __('标度'),
                        placeholder:
                            form.getFieldsValue().type === 'decimal'
                                ? __('请输入数据标度')
                                : __('无需填写标度'),
                        disabled: !(form.getFieldsValue().type === 'decimal'),
                        rules: [
                            {
                                required: true,
                                message: __('输入不能为空'),
                            },
                            {
                                validateTrigger: ['onBlur'],
                                validator: (e, value) =>
                                    checkNumberRanage(
                                        e,
                                        value,
                                        {
                                            max: field?.length,
                                            min: 0,
                                        },
                                        __(
                                            '仅支持 ${min}~${max} 之间的整数且数值小于精度',
                                            {
                                                min: '0',
                                                max: 38,
                                            },
                                        ),
                                    ),
                            },
                        ],
                    },
                },
            },
        },
        description: {
            label: __('字段注释'),
            type: ComponentType.Input,
            rules: [
                {
                    require: false,
                },
            ],
            maxLength: 255,
            placeholder: __('请输入字段注释'),
        },
    })
    useEffect(() => {
        form.resetFields()
    }, [open])

    useEffect(() => {
        form.setFieldsValue(field)
        setConfig({
            ...config,
            group1: {
                ...config?.group1,
                children: {
                    widths: [12, 6, 6],
                    ...config.group1?.children,
                    config: {
                        ...config.group1.children?.config,
                        length: {
                            type: ComponentType.InputNumber,
                            label: __('长度/精度'),
                            placeholder: existDataLength.includes(
                                form.getFieldsValue().type,
                            )
                                ? __('请输入数据长度/精度')
                                : __('无需填写长度/精度'),
                            disabled: !existDataLength.includes(
                                form.getFieldsValue().type,
                            ),
                            rules: [
                                {
                                    required:
                                        existDataLength.includes(
                                            form.getFieldsValue().type,
                                        ) &&
                                        form.getFieldsValue().type !== 'binary',
                                    message: __('输入不能为空'),
                                },
                                ...getDataLengthValidate(
                                    form.getFieldsValue().type,
                                ),
                            ],
                        },
                        field_precision: {
                            type: ComponentType.InputNumber,
                            label: __('标度'),
                            placeholder:
                                form.getFieldsValue().type === 'decimal'
                                    ? __('请输入数据标度')
                                    : __('无需填写标度'),
                            disabled: !(
                                form.getFieldsValue().type === 'decimal'
                            ),
                            rules: [
                                {
                                    required:
                                        form.getFieldsValue().type ===
                                        'decimal',
                                    message: __('输入不能为空'),
                                },
                                {
                                    validateTrigger: ['onBlur'],
                                    validator: (e, value) =>
                                        checkNumberRanage(
                                            e,
                                            value,
                                            {
                                                max: form.getFieldsValue()
                                                    .length,
                                                min: 0,
                                            },
                                            __(
                                                '仅支持 ${min}~${max} 之间的整数且数值小于精度',
                                                {
                                                    min: '0',
                                                    max: 38,
                                                },
                                            ),
                                        ),
                                },
                            ],
                        },
                    },
                },
            },
        })
        setDataField(field)
    }, [field])

    useEffect(() => {
        setDataNode(node)
    }, [node])

    const handleFinsh = (values) => {
        onConfirm({
            ...values,
            length: values.length ? Number(values.length) : null,
            field_precision: values.field_precision
                ? Number(values.field_precision)
                : null,
        })
    }

    /**
     * 检查重名
     */
    const checkNameRepeat = (e, value) => {
        if (
            getDataNode()?.data.items.find(
                (fieldsItem) =>
                    fieldsItem.name === value &&
                    fieldsItem.id !== getDataField().id,
            )
        ) {
            return Promise.reject(
                new Error(__('该字段名已存在当前数据表的表格中')),
            )
        }
        return Promise.resolve()
    }
    return (
        <Modal
            title={__('编辑字段')}
            onCancel={onCancel}
            onOk={() => {
                form.submit()
            }}
            footer={
                <div className={styles.modalFooterContent}>
                    {node?.data.formInfo.checked !== PasteSourceChecked.New ? (
                        <div className={styles.tips}>
                            <ExclamationCircleFilled className={styles.icon} />
                            {__('编辑“已采集”的数据表的字段，数据表需重新采集')}
                        </div>
                    ) : (
                        <div />
                    )}
                    <div>
                        <Button onClick={onCancel}>{__('取消')}</Button>
                        <Button
                            type="primary"
                            onClick={() => {
                                form.submit()
                            }}
                        >
                            {__('确定')}
                        </Button>
                    </div>
                </div>
            }
            width={640}
            open={open}
            maskClosable={false}
        >
            <AutoFormConfig
                config={getConfig()}
                onFinsh={handleFinsh}
                onChange={(value, allValues) => {
                    if (Object.keys(value).includes('type')) {
                        if (!existDataLength.includes(value.type)) {
                            form.setFieldValue('length', null)
                        }
                        if (value.type !== 'decimal') {
                            form.setFieldValue('field_precision', null)
                        }
                        setConfig({
                            ...config,
                            group1: {
                                ...config?.group1,
                                children: {
                                    widths: [12, 6, 6],
                                    ...config.group1?.children,
                                    config: {
                                        ...config.group1.children?.config,
                                        length: {
                                            type: ComponentType.InputNumber,
                                            label: __('长度/精度'),
                                            placeholder:
                                                existDataLength.includes(
                                                    value.type,
                                                )
                                                    ? __('请输入数据长度/精度')
                                                    : __('无需填写长度/精度'),
                                            disabled: !existDataLength.includes(
                                                value.type,
                                            ),
                                            rules: [
                                                {
                                                    required:
                                                        existDataLength.includes(
                                                            value.type,
                                                        ) &&
                                                        value.type !== 'binary',
                                                    message: __('输入不能为空'),
                                                },
                                                ...getDataLengthValidate(
                                                    value.type,
                                                ),
                                            ],
                                        },
                                        field_precision: {
                                            type: ComponentType.InputNumber,
                                            label: __('标度'),
                                            placeholder:
                                                value.type === 'decimal'
                                                    ? __('请输入数据标度')
                                                    : __('无需填写标度'),
                                            disabled: value.type !== 'decimal',
                                            rules: [
                                                {
                                                    required:
                                                        value.type ===
                                                        'decimal',
                                                    message: __('输入不能为空'),
                                                },
                                                {
                                                    validateTrigger: ['onBlur'],
                                                    validator: (
                                                        e,
                                                        validatorValue,
                                                    ) => {
                                                        return checkNumberRanage(
                                                            e,
                                                            validatorValue,
                                                            {
                                                                max: form.getFieldsValue()
                                                                    .length,
                                                                min: 0,
                                                            },
                                                            __(
                                                                '仅支持 ${min}~${max} 之间的整数且数值小于精度',
                                                                {
                                                                    min: '0',
                                                                    max: 38,
                                                                },
                                                            ),
                                                        )
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                        })
                    }
                }}
                form={form}
                defaultData={field}
                layout="vertical"
            />
        </Modal>
    )
}

export default EditPasteField
