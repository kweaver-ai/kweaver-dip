import React, { useState, useEffect } from 'react'
import { Drawer, Radio, Input, Button, Form, message } from 'antd'
import __ from '../locale'
import styles from './styles.module.less'
import {
    formatError,
    getAuditDetails,
    IShareApplyAudit,
    messageError,
    putDocAudit,
} from '@/core'
import ResourceShareAudit from '.'
import { GroupHeader, PromptModal } from '../helper'
import { AuditType } from '../const'
import { PolicyType } from '@/components/AuditPolicy/const'

interface IAuditDrawer {
    data?: IShareApplyAudit
    open: boolean
    onClose: (refresh?: boolean) => void
}

/**
 * 资源申请发相关审核
 */
const AuditDrawer = ({ data, open, onClose }: IAuditDrawer) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        form.resetFields()
    }, [open])

    const handleConfirm = () => {
        if (!data) return
        const { audit_idea, audit_msg } = form.getFieldsValue()
        const title = audit_idea
            ? __('确定同意申请资源吗？')
            : __('确定拒绝申请资源吗？')
        const content = audit_idea
            ? data?.audit_type === AuditType.Apply
                ? __('同意后资源申请将上报到省平台')
                : __('同意后资源共享结果将反馈到申请方')
            : data?.audit_type === AuditType.Apply
            ? __('拒绝后资源申请将无法上报到省平台')
            : __('拒绝后资源共享结果将反馈到申请方')
        PromptModal({
            title,
            content,
            async onOk() {
                try {
                    setLoading(true)
                    const res = await getAuditDetails(data?.proc_inst_id)
                    await putDocAudit({
                        id: data.proc_inst_id,
                        task_id: res?.task_id,
                        audit_idea,
                        audit_msg,
                        attachments: [],
                    })
                    onClose(true)
                } catch (e) {
                    message.error(e?.data?.cause)
                } finally {
                    setLoading(false)
                }
            },
            onCancel() {},
        })
    }

    return (
        <Drawer
            width={640}
            open={open}
            title={
                data?.audit_type === AuditType.Apply
                    ? __('资源申请发起审核')
                    : __('资源共享处理审核')
            }
            maskClosable={false}
            destroyOnClose
            placement="right"
            bodyStyle={{ padding: 20 }}
            onClose={() => onClose()}
            footerStyle={{ alignSelf: 'flex-end' }}
            push={false}
            footer={[
                <Button
                    onClick={() => onClose()}
                    style={{ marginRight: 8, minWidth: 80 }}
                >
                    {__('取消')}
                </Button>,
                <Button
                    type="primary"
                    onClick={handleConfirm}
                    loading={loading}
                    style={{ minWidth: 80 }}
                >
                    {__('确定')}
                </Button>,
            ]}
            className={styles.auditDrawer}
        >
            <GroupHeader text={__('资源申请信息')} />
            <div className={styles.auditDrawer_content}>
                <ResourceShareAudit
                    props={{
                        props: {
                            data: {
                                ...data,
                                catalog_name: data?.catalog_title,
                            },
                            process: {
                                audit_type:
                                    data?.audit_type === AuditType.Apply
                                        ? PolicyType.SSZDShareApplyEscalate
                                        : PolicyType.SSZDShareApplyApprove,
                            },
                        },
                        inAudit: false,
                    }}
                />
            </div>

            <GroupHeader text={__('资源申请审核')} />
            <Form
                form={form}
                layout="vertical"
                initialValues={{ audit_idea: true }}
                className={styles.auditDrawer_form}
            >
                <Form.Item
                    name="audit_idea"
                    label={__('审核意见')}
                    required
                    style={{ marginBottom: 16 }}
                >
                    <Radio.Group>
                        <Radio value>{__('同意')}</Radio>
                        <Radio value={false}>{__('拒绝')}</Radio>
                    </Radio.Group>
                </Form.Item>
                <Form.Item name="audit_msg" label={__('备注')}>
                    <Input.TextArea
                        placeholder={__('请输入')}
                        maxLength={255}
                        showCount
                        style={{
                            height: 100,
                            resize: 'none',
                        }}
                    />
                </Form.Item>
            </Form>
        </Drawer>
    )
}

export default AuditDrawer
