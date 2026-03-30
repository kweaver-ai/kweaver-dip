import { Form, Modal, message } from 'antd'
import { useContext, useEffect } from 'react'
import { MicroWidgetPropsContext } from '@/context'
import { formatError, updateWorkOrder } from '@/core'

import DepartResponsibleSelect from '../DepartResponsibleSelect'
import __ from './locale'
import styles from './styles.module.less'

const TransferModal = ({ item, visible, onClose, isWorkOrder = true }: any) => {
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [form] = Form.useForm()

    useEffect(() => {
        if (item) {
            const { responsible_uid, responsible_uname } = item
            form?.setFieldsValue({
                responsible: responsible_uid
                    ? { value: responsible_uid, label: responsible_uname }
                    : undefined,
            })
        } else {
            form?.resetFields()
        }
    }, [item, form])

    const onFinish = async (values) => {
        const { responsible, ...rest } = values
        const params = {
            ...rest,
            responsible_uid: responsible?.value,
        }

        try {
            const tip = __('转派成功')

            if (item?.work_order_id) {
                await updateWorkOrder(item?.work_order_id, params)

                if (microWidgetProps?.components?.toast) {
                    microWidgetProps?.components?.toast.success(tip)
                } else {
                    message.success(tip)
                }
            }

            onClose?.(true)
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
        }
    }

    return (
        <Modal
            title={__('转派')}
            open={visible}
            onCancel={() => onClose(false)}
            maskClosable={false}
            destroyOnClose
            getContainer={false}
            onOk={() => {
                form.submit()
            }}
            width={400}
            bodyStyle={{ maxHeight: 300, overflow: 'auto', paddingBottom: 0 }}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                autoComplete="off"
                className={styles.form}
            >
                <Form.Item
                    label={isWorkOrder ? __('责任人') : __('处理人')}
                    name="responsible"
                    rules={[
                        {
                            required: true,
                            message: isWorkOrder
                                ? __('请选择责任人')
                                : __('请选择处理人'),
                        },
                    ]}
                >
                    <DepartResponsibleSelect
                        placeholder={
                            isWorkOrder
                                ? __('请选择责任人')
                                : __('请选择处理人')
                        }
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default TransferModal
