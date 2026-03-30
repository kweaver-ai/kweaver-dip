import {
    Button,
    Col,
    DatePicker,
    Divider,
    Form,
    Input,
    Row,
    Space,
    message,
} from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { trim } from 'lodash'
import { RangePickerProps } from 'antd/lib/date-picker'
import moment from 'moment'
import { useContext } from 'react'
import styles from './styles.module.less'
import GlobalMenu from '../GlobalMenu'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import __ from './locale'
import { ErrorInfo, keyboardReg, nameReg } from '@/utils'
import { checkDemandNameV2, createDemandV2, formatError } from '@/core'
import UploadAttachment from './Upload'
import { DemandType } from './const'
import { MicroWidgetPropsContext } from '@/context'
import { Return } from '@/ui'

const Create = () => {
    const navigate = useNavigate()
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [form] = Form.useForm()

    const returnToDemandList = () => {
        ReturnConfirmModal({
            microWidgetProps,
            onCancel: () => navigate(`/my-assets/?menuType=myDemand`),
        })
    }

    // 设置不可选日期 - 当天之前不可选
    const disabledDate: RangePickerProps['disabledDate'] = (current) => {
        return current < moment().subtract(1, 'days')
    }

    const validateNameRepeat = async (value: string): Promise<void> => {
        const trimValue = trim(value)
        try {
            const res = await checkDemandNameV2({
                title: trimValue,
            })
            if (res.repeat) {
                return Promise.reject(new Error(__('该名称已存在，请重新输入')))
            }
            return Promise.resolve()
        } catch (error) {
            formatError(error)
            return Promise.resolve()
        }
    }

    const onFinish = async (values) => {
        const params = {
            ...values,
            dmd_type: DemandType.DataApply,
            finish_date: values.finish_date
                ? moment(
                      values.finish_date.format('YYYY-MM-DD 00:00:00'),
                  ).valueOf()
                : undefined,
            attachment_id: values?.attachment?.id,
            attachment: undefined,
        }
        try {
            await createDemandV2(params)
            if (microWidgetProps?.components?.toast) {
                microWidgetProps?.components?.toast.success(__('新建成功'))
            } else {
                message.success(__('新建成功'))
            }
            // navigate(`/demand-application`)
            navigate(`/my-assets/?menuType=myDemand`)
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
        }
    }

    return (
        <div className={styles['create-wrapper']}>
            <div className={styles.header}>
                <Return onReturn={returnToDemandList} title={__('新建需求')} />
            </div>
            <div className={styles.body}>
                <div className={styles.content}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        autoComplete="off"
                        className={styles.form}
                    >
                        <Row gutter={40} className={styles.contentWrapper}>
                            <Col span={12}>
                                <Form.Item
                                    label={__('需求名称')}
                                    name="title"
                                    validateTrigger={['onChange', 'onBlur']}
                                    validateFirst
                                    rules={[
                                        {
                                            required: true,
                                            message: ErrorInfo.NOTNULL,
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
                                        placeholder={__('请输入')}
                                        maxLength={128}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label={__('期望完成日期')}
                                    name="finish_date"
                                >
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
                                            required: true,
                                            message: ErrorInfo.NOTNULL,
                                        },
                                        {
                                            pattern: keyboardReg,
                                            message: ErrorInfo.EXCEPTEMOJI,
                                        },
                                    ]}
                                >
                                    <Input.TextArea
                                        placeholder={__('请输入')}
                                        maxLength={800}
                                        className={styles['text-area']}
                                        showCount
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item label={__('附件')} name="attachment">
                                    <UploadAttachment />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </div>
                <div className={styles.footer}>
                    <Space size={16}>
                        <Button
                            onClick={() =>
                                navigate(`/my-assets/?menuType=myDemand`)
                            }
                        >
                            {__('取消')}
                        </Button>
                        <Button type="primary" onClick={() => form.submit()}>
                            {__('提交')}
                        </Button>
                    </Space>
                </div>
            </div>
        </div>
    )
}

export default Create
