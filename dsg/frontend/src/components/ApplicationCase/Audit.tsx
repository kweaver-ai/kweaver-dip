import { Button, Drawer, Form, Input, Radio, Space } from 'antd'
import classNames from 'classnames'
import { useEffect, useState } from 'react'
import styles from './styles.module.less'
import __ from './locale'
import { ApplyAuditFields } from './const'
import { CommonTitle } from '@/ui'
import {
    putDocAudit,
    formatError,
    IAppCaseAuditItem,
    IAppCaseAuditType,
} from '@/core'
import AuditDetails from './AuditDetails'
import { formatTime } from '@/utils'

interface AuditProps {
    open: boolean
    onClose: () => void
    appCaseInfo: IAppCaseAuditItem
    target: IAppCaseAuditType
}

const Audit = ({ open, onClose, appCaseInfo, target }: AuditProps) => {
    const [form] = Form.useForm()
    const [auditOpen, setAuditOpen] = useState(false)

    const onFinish = async (values: any) => {
        try {
            await putDocAudit({
                ...values,
                id: appCaseInfo.application_example.id,
                task_id: appCaseInfo.id,
                audit_idea: !!values.audit_idea,
            })
            onClose()
        } catch (error) {
            formatError(error)
        }
    }
    return (
        <Drawer
            title={
                target === IAppCaseAuditType.Report
                    ? __('应用案例上报审核')
                    : __('应用案例下架审核')
            }
            open={open}
            onClose={onClose}
            width={800}
            push={{ distance: 0 }}
            className={styles['audit-drawer']}
            footer={
                <Space className={styles['app-case-audit-footer']}>
                    <Button onClick={onClose}>{__('取消')}</Button>
                    <Button type="primary" onClick={() => form.submit()}>
                        {__('提交')}
                    </Button>
                </Space>
            }
        >
            <div className={styles['audit-content']}>
                <CommonTitle title={__('应用案例信息')} />
                {ApplyAuditFields.map((item, fieldIndex) => (
                    <div
                        key={item.value}
                        className={classNames(
                            styles['audit-info'],
                            fieldIndex === 0 && styles['first-audit-info'],
                        )}
                    >
                        <span className={styles['audit-info-label']}>
                            {item.label}
                        </span>
                        <span className={styles['audit-info-value']}>
                            {item.value === 'audit_type'
                                ? appCaseInfo.type === IAppCaseAuditType.Report
                                    ? __('应用案例上报审核')
                                    : __('应用案例下架审核')
                                : item.value === 'creation_timestamp'
                                ? formatTime(
                                      appCaseInfo.application_example
                                          .creation_timestamp,
                                  )
                                : appCaseInfo.application_example[item.value] ||
                                  '--'}
                        </span>
                    </div>
                ))}
                <div className={styles['audit-info']}>
                    <span className={styles['audit-info-label']}>
                        {__('详情')}
                    </span>
                    <Button type="link" onClick={() => setAuditOpen(true)}>
                        {__('查看全部')}
                    </Button>
                </div>
                <CommonTitle
                    title={
                        target === IAppCaseAuditType.Report
                            ? __('应用案例上报审核')
                            : __('应用案例下架审核')
                    }
                />
                <Form
                    layout="vertical"
                    style={{ marginTop: 20 }}
                    form={form}
                    onFinish={onFinish}
                >
                    <Form.Item
                        label={__('审核意见')}
                        name="audit_idea"
                        required
                        rules={[{ required: true }]}
                        initialValue={1}
                    >
                        <Radio.Group>
                            <Radio value={1}>{__('同意')}</Radio>
                            <Radio value={0}>{__('拒绝')}</Radio>
                        </Radio.Group>
                    </Form.Item>
                    <Form.Item label={__('备注')} name="audit_msg">
                        <Input.TextArea
                            placeholder={__('请输入')}
                            maxLength={255}
                            showCount
                            style={{ height: 100, resize: 'none' }}
                        />
                    </Form.Item>
                </Form>
            </div>
            {auditOpen && (
                <AuditDetails
                    open={auditOpen}
                    onClose={() => setAuditOpen(false)}
                    title={appCaseInfo.application_example.name}
                    id={appCaseInfo.application_example.id}
                />
            )}
        </Drawer>
    )
}

export default Audit
