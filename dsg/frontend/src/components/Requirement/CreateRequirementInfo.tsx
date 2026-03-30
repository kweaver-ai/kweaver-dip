import { Col, DatePicker, Form, Input, Row } from 'antd'
import React from 'react'
import { trim } from 'lodash'
import { RangePickerProps } from 'antd/lib/date-picker'
import moment from 'moment'
import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons'
import { checkDemandName, formatError } from '@/core'
import styles from './styles.module.less'
import { ErrorInfo, keyboardReg, nameReg } from '@/utils'
import __ from './locale'

interface ICreateRequirementInfo {
    demandId: string
    isHidden: boolean
    setIsHidden: (hidden: boolean) => void
}
const CreateRequirementInfo: React.FC<ICreateRequirementInfo> = ({
    demandId,
    isHidden,
    setIsHidden,
}) => {
    const validateNameEmpty = (value: string) => {
        const trimValue = trim(value)
        if (trimValue) {
            return Promise.resolve()
        }
        setIsHidden(false)
        return Promise.reject(new Error(ErrorInfo.NOTNULL))
    }

    const validateNameRepeat = async (value: string): Promise<void> => {
        const trimValue = trim(value)
        try {
            const res = await checkDemandName({
                demand_title: trimValue,
                demand_id: demandId || undefined,
            })
            if (res.repeat) {
                setIsHidden(false)
                return Promise.reject(new Error(__('该名称已存在，请重新输入')))
            }
            return Promise.resolve()
        } catch (error) {
            formatError(error)
            return Promise.resolve()
        }
    }

    // 设置不可选日期 - 当天之前不可选
    const disabledDate: RangePickerProps['disabledDate'] = (current) => {
        return current < moment().subtract(1, 'days')
    }

    return (
        <div className={styles.createInfo}>
            <div className={styles.titleWrapper}>
                {isHidden ? (
                    <CaretRightOutlined
                        className={styles.arrowIcon}
                        onClick={() => setIsHidden(!isHidden)}
                    />
                ) : (
                    <CaretDownOutlined
                        className={styles.arrowIcon}
                        onClick={() => setIsHidden(!isHidden)}
                    />
                )}
                <div className={styles.title}>{__('基本信息')}</div>
            </div>
            <Row
                gutter={44}
                hidden={isHidden}
                className={styles.contentWrapper}
            >
                <Col span={12}>
                    <Form.Item
                        label={__('需求名称')}
                        name="demand_title"
                        validateTrigger={['onChange', 'onBlur']}
                        validateFirst
                        rules={[
                            {
                                required: true,
                                // message: ErrorInfo.NOTNULL,
                                validator: (e, value) =>
                                    validateNameEmpty(value),
                            },
                            {
                                pattern: nameReg,
                                message: ErrorInfo.ONLYSUP,
                            },
                            {
                                validateTrigger: ['onBlur'],
                                validator: (e, value) =>
                                    validateNameRepeat(value),
                            },
                        ]}
                    >
                        <Input
                            placeholder={__('请输入需求名称')}
                            maxLength={128}
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label={__('期望完成日期')} name="finish_date">
                        <DatePicker
                            style={{ width: '100%' }}
                            placeholder={__('请选择期望完成日期')}
                            disabledDate={disabledDate}
                        />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item
                        label={__('需求描述')}
                        name="description"
                        required
                        rules={[
                            {
                                pattern: keyboardReg,
                                message: ErrorInfo.EXCEPTEMOJI,
                            },
                        ]}
                    >
                        <Input.TextArea
                            placeholder={__('请输入需求描述')}
                            maxLength={255}
                            className={styles.textArea}
                        />
                    </Form.Item>
                </Col>
            </Row>
        </div>
    )
}

export default CreateRequirementInfo
