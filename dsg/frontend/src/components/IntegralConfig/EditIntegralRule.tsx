import { Button, Form, Modal, Row } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import __ from './locale'
import IntegralTypeIcon from './IntegralTypeIcon'
import { IntegralCondition, IntegralTypeMap, ruleConfigOptions } from './const'
import styles from './styles.module.less'
import { RuleConfigItem } from './helper'
import ExpirationSelect from './AddIntegralRule/ExpirationSelect'
import IntegralNumberInput from './AddIntegralRule/IntegralNumberInput'

interface EditIntegralRuleProps {
    data: any
    open: boolean
    onClose: () => void
    onConfirm: (values: any) => void
}
const EditIntegralRule = ({
    data,
    open,
    onClose,
    onConfirm,
}: EditIntegralRuleProps) => {
    const [form] = Form.useForm()

    useEffect(() => {
        form.setFieldsValue(data)
    }, [data])

    return (
        <Modal
            title={__('编辑积分规则')}
            open={open}
            onCancel={onClose}
            width={640}
            maskClosable
            footer={
                <div className={styles.editModalFooter}>
                    <div className={styles.info}>
                        <InfoCircleOutlined style={{ fontSize: 16 }} />
                        <span>{__('变更规则不影响已获取的历史积分纪录')}</span>
                    </div>
                    <div className={styles.btns}>
                        <Button onClick={onClose}>{__('取消')}</Button>
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
        >
            <div className={styles.editIntegralRuleWrapper}>
                <div className={styles.ruleType}>
                    <IntegralTypeIcon
                        type={data.type}
                        style={{ fontSize: 20 }}
                    />
                    <span className={styles.text}>
                        {IntegralTypeMap[data.type]}
                    </span>
                </div>
                <Form
                    form={form}
                    labelCol={{ span: 4 }}
                    wrapperCol={{ span: 20 }}
                    layout="horizontal"
                    labelAlign="left"
                    onFinish={(values) => {
                        onConfirm(values)
                    }}
                >
                    {ruleConfigOptions.map((item) => {
                        if (item.key === 'strategy_config') {
                            return (
                                <Form.Item
                                    label={__('积分变化')}
                                    name="strategy_config"
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请输入积分值'),
                                        },
                                    ]}
                                >
                                    <IntegralNumberInput
                                        isScoring={
                                            data.integral_condition ===
                                            IntegralCondition.CATALOG_SCORING
                                        }
                                    />
                                </Form.Item>
                            )
                        }
                        if (item.key === 'strategy_period') {
                            return (
                                <Form.Item
                                    label={__('规则有效期')}
                                    name="strategy_period"
                                >
                                    <ExpirationSelect />
                                </Form.Item>
                            )
                        }
                        return <RuleConfigItem itemData={item} data={data} />
                    })}
                </Form>
            </div>
        </Modal>
    )
}

export default EditIntegralRule
