import React, { useEffect, useState } from 'react'
import { Form, Input, message, Modal, Radio } from 'antd'
import { noop, templateSettings, trim } from 'lodash'
import {
    applyDownloadBusinessObjectAccess,
    formatError,
    messageError,
    messageInfo,
} from '@/core'
import { ErrorInfo, keyboardReg } from '@/utils'
import __ from './locale'
import styles from './styles.module.less'
import { BusinObjOpr } from './const'
import { validateEmpty } from '@/utils/validate'
import { formatCatlgError, RescErrorCodeList } from './helper'

interface IApplyDownloadPermission {
    id: string
    open: boolean
    onClose: () => void
    update?: (type: BusinObjOpr) => void
    errorCallback?: (error?: any) => void
}
const ApplyDownloadPermission: React.FC<IApplyDownloadPermission> = ({
    id,
    open,
    onClose,
    update = noop,
    errorCallback = noop,
}) => {
    const [form] = Form.useForm()

    const onFinish = async (values) => {
        let { apply_reason } = values
        apply_reason = trim(apply_reason)

        try {
            await applyDownloadBusinessObjectAccess(
                id,
                'af-data-catalog-download',
                { ...values, apply_reason },
            )
            message.success(__('操作成功'))
            update(BusinObjOpr.DATADOWNLOAD)
            onClose()
        } catch (error) {
            const { code } = error?.data || {}
            formatCatlgError(error, () => {
                if (code === RescErrorCodeList.ASSETSOFFLINEERROR) {
                    onClose()
                    errorCallback(error)
                }
            })
        }
    }

    useEffect(() => {
        if (!open) {
            form.resetFields()
        }
    }, [open])

    const [onTextAreaFocus, setOnTextAreaFocus] = useState(false)

    return (
        <Modal
            title={__('申请下载权限')}
            open={open}
            width={520}
            className={styles.applyAccessModal}
            onCancel={onClose}
            onOk={() => {
                form.submit()
            }}
            // okButtonProps={{ loading }}
            destroyOnClose
            maskClosable={false}
            wrapProps={{
                onClick: (e) => {
                    e.stopPropagation()
                },
            }}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                className={styles.applyForm}
            >
                <Form.Item label="有效期" name="apply_days" initialValue={7}>
                    <Radio.Group>
                        <Radio value={7}>7天</Radio>
                        <Radio value={15}>15天</Radio>
                        <Radio value={30}>30天</Radio>
                    </Radio.Group>
                </Form.Item>
                <Form.Item
                    label="申请理由"
                    required
                    name="apply_reason"
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        { required: true, message: ErrorInfo.NOTNULL },
                        {
                            validateTrigger: 'onBlur',
                            validator: validateEmpty(__('纯空格判断为空')),
                        },
                        {
                            pattern: keyboardReg,
                            message: ErrorInfo.EXCEPTEMOJI,
                        },
                    ]}
                >
                    <Input.TextArea
                        className={styles.showCount}
                        style={{
                            height: 104,
                            resize: 'none',
                            borderColor: onTextAreaFocus ? '#3a8ff0' : '',
                            boxShadow: onTextAreaFocus
                                ? '0 0 0 2px rgb(18 110 227 / 20%)'
                                : '',
                        }}
                        onFocus={() => {
                            setOnTextAreaFocus(true)
                        }}
                        onBlur={() => {
                            setOnTextAreaFocus(false)
                        }}
                        placeholder="请输入申请理由"
                        showCount
                        maxLength={800}
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default ApplyDownloadPermission
