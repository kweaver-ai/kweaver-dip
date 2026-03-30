import { useState, useEffect, FC } from 'react'
import { Button, Modal, Form, Input, Row, Col, Select } from 'antd'
import { trim } from 'lodash'
import { hive } from 'sql-formatter'
import __ from '../locale'
import { enBeginNameRegNew } from '@/utils'
import NumberInput from '@/ui/NumberInput'
import { DataBaseType } from '@/components/DataSource/const'
import {
    hiveDataConfig,
    hiveDataType,
    hiveOnlyHasLength,
    hiveOnlyhasLengthAndPrecision,
    mysqlDataConfig,
    mysqlDataType,
    postgresSqlDataConfig,
    postgresSqlHasLength,
    postgresSqlOnlyhasLengthAndPrecision,
    postgresSqlType,
} from '@/components/DataSynchronization/const'
import { checkRepeat } from '@/components/DataSynchronization/helper'
import { NumberType } from '@/ui/NumberInput/const'
import { IConnectorConfigType } from '@/core'

interface IEditField {
    field: any
    checkFieldRepeat: (name: string, indexId: number | string) => Promise<any>
    onSave: (values: any) => void
    onClose: () => void
    editStatus: 'create' | 'edit'
    dataBaseType: DataBaseType
    disabled?: boolean
    onCheckRepeat: (indexId: number | string, name: string) => Promise<any>
    optionalsDataTypes: Array<IConnectorConfigType>
}
const EditFieldModal: FC<IEditField> = ({
    field,
    checkFieldRepeat,
    onSave,
    onClose,
    editStatus = 'edit',
    dataBaseType,
    disabled = false,
    onCheckRepeat,
    optionalsDataTypes,
}) => {
    const [fieldError, setFieldError] = useState<string>('')
    const [form] = Form.useForm()
    const [lengthLimit, setLengthLimit] = useState<Array<number> | undefined>(
        undefined,
    )
    const [typeOptions, setTypeOptions] = useState<
        Array<{
            label: string
            value: string
            detail: IConnectorConfigType
        }>
    >([])

    const [precisionDataFlag, setPrecisionDataFlag] = useState<number>(0)

    useEffect(() => {
        form.resetFields()
        form.setFieldsValue(field)
    }, [field])

    useEffect(() => {
        if (field && typeOptions) {
            const newTypeOptions = optionalsDataTypes
                .map((currentOptions) => ({
                    value: currentOptions.olkWriteType,
                    label: currentOptions.olkWriteType,
                    detail: currentOptions,
                }))
                .filter((item) => !!item.value)
            setTypeOptions(newTypeOptions)
            const currentTypeDetail = newTypeOptions.find(
                (currentOption) => currentOption.value === field.type,
            )?.detail
            setPrecisionDataFlag(currentTypeDetail?.precisionFlag || 0)
            if (!currentTypeDetail?.precisionFlag) {
                setLengthLimit(undefined)
            } else {
                setLengthLimit([
                    currentTypeDetail?.minTypeLength || 0,
                    currentTypeDetail?.maxTypeLength || 65535,
                ])
            }
        }
    }, [optionalsDataTypes, field])

    const handleFinish = (values) => {
        onSave({
            ...values,
            length: values.length ? Number(values.length) : null,
            field_precision:
                values.field_precision || Number(values.field_precision) === 0
                    ? Number(values.field_precision)
                    : null,
        })
    }

    return (
        <Modal
            title={
                disabled
                    ? __('查看字段')
                    : editStatus === 'edit'
                    ? __('编辑字段')
                    : __('新建字段')
            }
            onCancel={onClose}
            onOk={() => {
                form.submit()
            }}
            width={640}
            open
            maskClosable={false}
        >
            <Form
                layout="vertical"
                onFinish={handleFinish}
                form={form}
                onValuesChange={(value) => {
                    const dataKey = Object.keys(value)[0]
                    if (dataKey === 'type') {
                        const currentTypeDetail = typeOptions.find(
                            (currentOption) =>
                                currentOption.value === value.type,
                        )?.detail

                        setPrecisionDataFlag(
                            currentTypeDetail?.precisionFlag || 0,
                        )
                        if (!currentTypeDetail?.precisionFlag) {
                            setLengthLimit(undefined)
                        } else {
                            setLengthLimit([
                                currentTypeDetail?.minTypeLength || 0,
                                currentTypeDetail?.maxTypeLength || 65535,
                            ])
                        }

                        form.setFieldValue('length', null)
                        form.setFieldValue('field_precision', null)
                    }
                }}
                autoComplete="off"
            >
                <Form.Item
                    name="name"
                    label={__('字段名称')}
                    validateFirst
                    required
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: true,
                            transform: (value) => trim(value),
                            message: __('输入不能为空'),
                        },
                        {
                            pattern: enBeginNameRegNew,
                            message: __(
                                '仅支持英文、数字、下划线，且必须以字母开头',
                            ),
                            transform: (value) => trim(value),
                        },
                        {
                            validateTrigger: ['onBlur'],
                            validator: (ruler, value) => {
                                return onCheckRepeat(field.indexId, trim(value))
                            },
                        },
                    ]}
                >
                    <Input
                        placeholder={__('请输入字段名称')}
                        maxLength={255}
                        disabled={disabled}
                    />
                </Form.Item>
                <Row gutter={12}>
                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, curValues) =>
                            curValues.type !== prevValues.type
                        }
                    >
                        {({ getFieldValue }) => {
                            const dataType = getFieldValue('type')
                            const currentTypeDetail = typeOptions.find(
                                (currentOption) =>
                                    currentOption.value === dataType,
                            )?.detail

                            return (
                                <Col
                                    span={
                                        currentTypeDetail &&
                                        currentTypeDetail.precisionFlag
                                            ? 12
                                            : 24
                                    }
                                >
                                    <Form.Item
                                        name="type"
                                        label={__('数据类型')}
                                        validateFirst
                                        required
                                        rules={[
                                            {
                                                required: true,
                                                message: __('请选择数据类型'),
                                            },
                                        ]}
                                    >
                                        <Select
                                            placeholder={__('请选择数据类型')}
                                            options={typeOptions}
                                            notFoundContent={__('暂无数据')}
                                            disabled={disabled}
                                        />
                                    </Form.Item>
                                </Col>
                            )
                        }}
                    </Form.Item>

                    {precisionDataFlag > 0 && lengthLimit ? (
                        <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, curValues) =>
                                curValues.type !== prevValues.type
                            }
                        >
                            {({ getFieldValue }) => {
                                const dataType = getFieldValue('type')
                                const currentTypeDetail = typeOptions.find(
                                    (currentOption) =>
                                        currentOption.value === dataType,
                                )?.detail
                                return (
                                    <Col
                                        span={
                                            currentTypeDetail?.precisionFlag ===
                                            2
                                                ? 6
                                                : 12
                                        }
                                    >
                                        <Form.Item
                                            name="length"
                                            label={
                                                currentTypeDetail?.precisionFlag ===
                                                2
                                                    ? __('精度')
                                                    : __('长度')
                                            }
                                            validateFirst
                                            required={
                                                !!(
                                                    currentTypeDetail?.precisionFlag &&
                                                    currentTypeDetail.precisionFlag >
                                                        0
                                                )
                                            }
                                            rules={[
                                                {
                                                    required: true,
                                                    message: __(
                                                        '请输入 ${minNumber}~${maxNumber} 之间的整数',
                                                        {
                                                            minNumber:
                                                                lengthLimit[0].toString(),
                                                            maxNumber:
                                                                lengthLimit[1],
                                                        },
                                                    ),
                                                },
                                            ]}
                                        >
                                            <NumberInput
                                                placeholder={__(
                                                    '请输入 ${minNumber}~${maxNumber} 之间的整数',
                                                    {
                                                        minNumber:
                                                            lengthLimit[0].toString(),
                                                        maxNumber:
                                                            lengthLimit[1],
                                                    },
                                                )}
                                                disabled={
                                                    !lengthLimit || disabled
                                                }
                                                min={lengthLimit[0]}
                                                max={lengthLimit[1]}
                                                type={NumberType.Natural}
                                            />
                                        </Form.Item>
                                    </Col>
                                )
                            }}
                        </Form.Item>
                    ) : null}
                    {precisionDataFlag === 2 && lengthLimit ? (
                        <Col span={6}>
                            <Form.Item
                                noStyle
                                shouldUpdate={(prevValues, curValues) =>
                                    curValues.type !== prevValues.type ||
                                    curValues?.length !== prevValues?.length
                                }
                            >
                                {({ getFieldValue }) => {
                                    const dataType = getFieldValue('type')
                                    const dataLength = getFieldValue('length')
                                    return (
                                        <Form.Item
                                            name="field_precision"
                                            label={__('标度')}
                                            validateFirst
                                            required
                                            rules={[
                                                {
                                                    required: true,
                                                    message: __(
                                                        '请输入 ${minNumber}~${maxNumber} 之间的整数',
                                                        {
                                                            minNumber: '0',
                                                            maxNumber:
                                                                dataLength ||
                                                                lengthLimit[1],
                                                        },
                                                    ),
                                                },
                                            ]}
                                        >
                                            <NumberInput
                                                placeholder={__(
                                                    '请输入 ${minNumber}~${maxNumber} 之间的整数',
                                                    {
                                                        minNumber: '0',
                                                        maxNumber:
                                                            dataLength ||
                                                            lengthLimit[1],
                                                    },
                                                )}
                                                min={0}
                                                max={
                                                    dataLength || lengthLimit[1]
                                                }
                                                type={NumberType.Natural}
                                            />
                                        </Form.Item>
                                    )
                                }}
                            </Form.Item>
                        </Col>
                    ) : null}
                </Row>
                <Form.Item name="description" label={__('字段注释')}>
                    <Input
                        maxLength={255}
                        placeholder={__('字段注释')}
                        disabled={disabled}
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default EditFieldModal
