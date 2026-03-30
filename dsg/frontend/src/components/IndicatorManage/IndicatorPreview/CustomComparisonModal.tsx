import React, { useEffect, useMemo, useState } from 'react'
import {
    Modal,
    Checkbox,
    Input,
    Select,
    Button,
    Form,
    Tooltip,
    message,
} from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import moment from 'moment'
import styles from './styles.module.less'
import __ from '../locale'
import {
    getSameperiodExample,
    sameperiodMethodMap,
    sameperiodTimeGranularityMap,
    timeConstraintToChange,
} from '../const'
import NumberInput from '@/ui/NumberInput'
import { NumberType } from '@/ui/NumberInput/const'

/**
 * 自定义同环比
 */
const CustomComparisonModal: React.FC<{
    open: boolean
    onClose: (data?: any) => void
    config?: any
    timeValue?: {
        operator: string
        value: string[]
    }
}> = ({ open, onClose, timeValue, config }) => {
    const [form] = Form.useForm()
    const [example, setExample] = useState<any>()

    useEffect(() => {
        if (open) {
            if (config?.sameperiod_config?.custom) {
                form.setFieldsValue(config.sameperiod_config)
            }
            getExample()
            return
        }
        form.resetFields()
        setExample(undefined)
    }, [open, config])

    const handleConfirm = async () => {
        const values = form.getFieldsValue()
        const { method, offset, time_granularity } = values
        if (method.length === 0) {
            message.error(__('请选择计算类型'))
            return
        }
        onClose({
            type: 'sameperiod',
            sameperiod_config: {
                custom: true,
                ...values,
                offset: Number(offset),
            },
        })
    }

    // 示例
    const getExample = () => {
        const { method, offset, time_granularity } = form.getFieldsValue()
        if (timeValue) {
            const res = getSameperiodExample(
                timeValue,
                method,
                offset,
                time_granularity,
            )
            setExample(res)
        }
    }

    return (
        <Modal
            title={__('自定义同环比')}
            width={480}
            open={open}
            maskClosable={false}
            onCancel={() => onClose()}
            okText={__('确定')}
            cancelText={__('取消')}
            onOk={handleConfirm}
            okButtonProps={{ style: { minWidth: 80 } }}
            cancelButtonProps={{ style: { minWidth: 80 } }}
            className={styles.customComparisonModal}
            bodyStyle={{ padding: '24px 24px 16px' }}
        >
            <Form
                form={form}
                layout="horizontal"
                initialValues={{
                    method: ['growth_value', 'growth_rate'],
                    offset: 1,
                    time_granularity: 'day',
                }}
                onValuesChange={() => {
                    getExample()
                }}
            >
                <Form.Item
                    label={__('计算类型')}
                    name="method"
                    required
                    style={{ marginBottom: 16 }}
                >
                    <Checkbox.Group
                        options={Object.values(sameperiodMethodMap).map(
                            (item) => ({
                                ...item,
                                label: (
                                    <span>
                                        {item.label}
                                        <Tooltip
                                            title={item.tip}
                                            color="#fff"
                                            overlayInnerStyle={{
                                                color: 'rgba(0,0,0,0.85)',
                                            }}
                                        >
                                            <QuestionCircleOutlined
                                                style={{
                                                    marginLeft: 6,
                                                    color: 'rgba(0,0,0,0.65)',
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    e.preventDefault()
                                                }}
                                            />
                                        </Tooltip>
                                    </span>
                                ),
                            }),
                        )}
                    />
                </Form.Item>
                <Form.Item label={__('日期时间')} style={{ marginBottom: 20 }}>
                    {example?.source.start} {__('至')} {example?.source.end}
                </Form.Item>
                <Form.Item label={__('相对时间')} style={{ marginBottom: 16 }}>
                    <Input.Group compact style={{ marginBottom: 10 }}>
                        <span className={styles.compactName}>
                            {__('偏移量')}
                            <Tooltip
                                title={__('仅支持输入1～1000的数字')}
                                color="#fff"
                                overlayInnerStyle={{
                                    color: 'rgba(0,0,0,0.85)',
                                }}
                            >
                                <QuestionCircleOutlined
                                    style={{
                                        marginLeft: 6,
                                        color: 'rgba(0,0,0,0.65)',
                                    }}
                                />
                            </Tooltip>
                        </span>
                        <Form.Item name="offset" noStyle>
                            <NumberInput
                                min={1}
                                max={1000}
                                placeholder={__('请输入1～1000的数字')}
                                style={{ width: '64%' }}
                                type={NumberType.IntegerOneToThousand}
                            />
                        </Form.Item>
                    </Input.Group>
                    <Input.Group compact>
                        <span className={styles.compactName}>
                            {__('时间粒度')}
                        </span>
                        <Form.Item name="time_granularity" noStyle>
                            <Select
                                style={{ width: '64%' }}
                                options={Object.values(
                                    sameperiodTimeGranularityMap,
                                )}
                            />
                        </Form.Item>
                    </Input.Group>
                </Form.Item>
            </Form>
            {form.getFieldValue('method')?.length > 0 && (
                <div className={styles.example}>
                    <span>{__('计算公式示例: ')}</span>
                    {example?.growth_value && (
                        <div className={styles.exampleItem}>
                            <div className={styles.exampleItemName}>
                                {__('增长值：')}
                            </div>
                            <div>{example.growth_value}</div>
                        </div>
                    )}
                    {example?.growth_rate && (
                        <div className={styles.exampleItem}>
                            <div className={styles.exampleItemName}>
                                {__('增长率：')}
                            </div>
                            <div>{example.growth_rate}</div>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    )
}

export default CustomComparisonModal
