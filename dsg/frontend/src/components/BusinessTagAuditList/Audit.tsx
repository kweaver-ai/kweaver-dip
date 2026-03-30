import { Button, Modal, Form, Input, Radio, Space, message } from 'antd'
import classNames from 'classnames'
import { useEffect, useState } from 'react'
import styles from './styles.module.less'
import __ from './locale'
import { CommonTitle } from '@/ui'
import {
    putDocAudit,
    getAuditDetails,
    formatError,
    IAppCaseAuditItem,
    IAppCaseAuditType,
    TagDetailsType,
} from '@/core'
import TagDetails from '@/components/BusinessTagClassify/Details'
import { auditTypeOptions } from './const'

interface AuditProps {
    open: boolean
    onClose: () => void
    appCaseInfo: any
    target: any
    id: string
}

const Audit = ({ open, onClose, appCaseInfo, target, id }: AuditProps) => {
    const [form] = Form.useForm()
    const [auditOpen, setAuditOpen] = useState(false)

    const onFinish = async (values: any) => {
        try {
            const res = await getAuditDetails(appCaseInfo.proc_inst_id)
            await putDocAudit({
                id: appCaseInfo.proc_inst_id,
                task_id: res?.task_id,
                audit_idea: !!values.audit_idea,
                audit_msg: values.audit_msg,
                attachments: [],
            })
            onClose()
        } catch (error) {
            formatError(error)
        }
    }
    return (
        <Modal
            title={`${__('审核-')}${
                auditTypeOptions?.find((item) => item.value === target)
                    ?.label || ''
            }`}
            open={open}
            width={640}
            className={styles['audit-Modal']}
            footer={
                <Space className={styles['app-case-audit-footer']}>
                    <Button onClick={onClose}>{__('取消')}</Button>
                    <Button type="primary" onClick={() => form.submit()}>
                        {__('确定')}
                    </Button>
                </Space>
            }
        >
            <div className={styles['audit-content']}>
                <Form layout="vertical" form={form} onFinish={onFinish}>
                    <Form.Item
                        label={__('审核选项')}
                        name="audit_idea"
                        required
                        rules={[
                            {
                                required: true,
                                message: __('请选择一个处理方式'),
                            },
                        ]}
                        initialValue={1}
                    >
                        <Radio.Group>
                            <Radio value={1}>{__('同意')}</Radio>
                            <Radio value={0}>{__('拒绝')}</Radio>
                        </Radio.Group>
                    </Form.Item>
                    <Form.Item label={__('备注')} name="audit_msg">
                        <Input.TextArea
                            placeholder={__('填写意见（选填）')}
                            maxLength={255}
                            showCount
                            style={{ height: 100, resize: 'none' }}
                        />
                    </Form.Item>
                </Form>
            </div>
            {auditOpen && (
                <TagDetails
                    open={auditOpen}
                    id={id}
                    showTreeInfo
                    showAuditInfo
                    type={TagDetailsType.audit}
                    onClose={() => setAuditOpen(false)}
                />
            )}
        </Modal>
    )
}

export default Audit
