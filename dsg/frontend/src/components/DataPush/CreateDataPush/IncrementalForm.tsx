import React, { useEffect, useState } from 'react'
import {
    Col,
    DatePicker,
    Form,
    FormInstance,
    FormProps,
    Radio,
    Row,
    Select,
    Tooltip,
} from 'antd'
import { ClockCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import __ from '../locale'
import styles from './styles.module.less'
import { TransmitMode, transmitModeOptions } from '../const'
import { NotFoundContent } from './helper'

interface ISchedulePlanForm extends FormProps {
    form: FormInstance
    fieldList?: any[] // 字段列表
    inMount?: boolean // 是否在编目页
}

/**
 * 推送机制
 */
const IncrementalForm = ({
    form,
    fieldList = [],
    inMount = false,
    ...props
}: ISchedulePlanForm) => {
    const [selectedFields, setSelectedFields] = useState<any[]>([])
    const [hasPrimaryKey, setHasPrimaryKey] = useState<boolean>(false)

    useEffect(() => {
        if (inMount) {
            setSelectedFields(fieldList)
        } else {
            checkFieldList()
        }
    }, [fieldList, inMount])

    const checkFieldList = () => {
        const primaryKey = fieldList.find((item) => item.primary_key)
        const tempFieldList = fieldList.filter((item) => item.selected_flag)
        setHasPrimaryKey(!!primaryKey)
        setSelectedFields(tempFieldList)
        try {
            const obj: any = {}
            const { increment_field, primary_key } = form.getFieldsValue()
            // 增量字段不在字段列表中
            if (
                increment_field &&
                !tempFieldList.find(
                    (item) => item.technical_name === increment_field,
                )
            ) {
                obj.increment_field = undefined
            }
            if (!primaryKey && primary_key && primary_key.length > 0) {
                obj.primary_key = primary_key.filter((item) =>
                    tempFieldList.find((i) => i.technical_name === item),
                )
            }
            form.setFieldsValue(obj)
        } catch (error) {
            // formatError(error)
        }
    }

    return (
        <Form
            form={form}
            name="incrementalForm"
            layout="horizontal"
            autoComplete="off"
            scrollToFirstError
            labelAlign="left"
            className={styles.incrementalForm}
            initialValues={{ transmit_mode: TransmitMode.Full }}
            {...props}
        >
            {!inMount && (
                <Row gutter={40}>
                    <Col span={12}>
                        <Form.Item
                            name="transmit_mode"
                            label={__('推送类型')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('请选择推送类型'),
                                },
                            ]}
                        >
                            <Radio.Group>
                                {transmitModeOptions.map((item) => (
                                    <Radio value={item.value} key={item.value}>
                                        {item.label}
                                    </Radio>
                                ))}
                            </Radio.Group>
                        </Form.Item>
                    </Col>
                </Row>
            )}
            <Form.Item
                noStyle
                shouldUpdate={(prev, cur) =>
                    prev.transmit_mode !== cur.transmit_mode
                }
            >
                {({ getFieldValue }) => {
                    const transmitMode = getFieldValue('transmit_mode')
                    return (
                        transmitMode === TransmitMode.Incremental && (
                            <>
                                <Row gutter={40}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="increment_field"
                                            label={__('增量字段')}
                                            required
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        __('请选择增量字段'),
                                                },
                                            ]}
                                        >
                                            <Select
                                                showSearch
                                                options={selectedFields.map(
                                                    (item) => ({
                                                        value: item.technical_name,
                                                        label: item.technical_name,
                                                    }),
                                                )}
                                                placeholder={__(
                                                    '请选择增量字段',
                                                )}
                                                notFoundContent={
                                                    selectedFields.length ===
                                                    0 ? (
                                                        <NotFoundContent />
                                                    ) : (
                                                        <NotFoundContent
                                                            text={__(
                                                                '抱歉，没有找到相关内容',
                                                            )}
                                                        />
                                                    )
                                                }
                                                getPopupContainer={(n) =>
                                                    n.parentNode
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="increment_timestamp"
                                            label={
                                                <>
                                                    {__('增量时间戳值')}
                                                    <Tooltip
                                                        title={__(
                                                            '如果不选，提交后将默认设置为提交时间',
                                                        )}
                                                    >
                                                        <InfoCircleOutlined
                                                            style={{
                                                                color: 'rgba(0, 0, 0, 0.65)',
                                                                marginLeft:
                                                                    '8px',
                                                            }}
                                                        />
                                                    </Tooltip>
                                                </>
                                            }
                                        >
                                            <DatePicker
                                                style={{
                                                    width: '100%',
                                                }}
                                                showTime
                                                getPopupContainer={(n) => n}
                                                placeholder={__(
                                                    '请选择首次增量开始时间',
                                                )}
                                                suffixIcon={
                                                    <ClockCircleOutlined />
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                {!inMount && (
                                    <Row gutter={40}>
                                        <Col span={12}>
                                            <Form.Item
                                                name="primary_key"
                                                label={__('主键')}
                                            >
                                                <Select
                                                    disabled={hasPrimaryKey}
                                                    showSearch
                                                    mode="multiple"
                                                    options={(hasPrimaryKey
                                                        ? fieldList
                                                        : selectedFields
                                                    ).map((item) => ({
                                                        value: item.technical_name,
                                                        label: item.technical_name,
                                                    }))}
                                                    placeholder={__(
                                                        '请选择主键',
                                                    )}
                                                    notFoundContent={
                                                        (hasPrimaryKey
                                                            ? fieldList
                                                            : selectedFields
                                                        ).length === 0 ? (
                                                            <NotFoundContent />
                                                        ) : (
                                                            <NotFoundContent
                                                                text={__(
                                                                    '抱歉，没有找到相关内容',
                                                                )}
                                                            />
                                                        )
                                                    }
                                                    getPopupContainer={(n) =>
                                                        n.parentNode
                                                    }
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                )}
                            </>
                        )
                    )
                }}
            </Form.Item>
        </Form>
    )
}

export default IncrementalForm
