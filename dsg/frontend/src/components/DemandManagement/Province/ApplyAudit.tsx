import { Button, Drawer, Form, Input, Radio, Space } from 'antd'
import classNames from 'classnames'
import { useState } from 'react'
import styles from './styles.module.less'
import __ from '../locale'
import CommonTitle from '../CommonTitle'
import { ApplyAuditFields } from './const'
import {
    putDocAudit,
    docAuditAuthority,
    formatError,
    ISSZDDemandAuditItem,
} from '@/core'
import AuditDetails from '../ProvinceDetails/AuditDetails'

interface ApplyAuditProps {
    open: boolean
    onClose: () => void
    demandInfo: ISSZDDemandAuditItem
}

const ApplyAudit = ({ open, onClose, demandInfo }: ApplyAuditProps) => {
    const [form] = Form.useForm()
    const [auditOpen, setAuditOpen] = useState(false)

    const onFinish = async (values: any) => {
        try {
            // await docAuditAuthority({
            //     proc_inst_id: demandInfo.proc_inst_id,
            //     type: 'task',
            // })
            await putDocAudit({
                ...values,
                id: demandInfo.task_id,
                task_id: demandInfo.proc_inst_id,
                audit_idea: !!values.audit_idea,
            })
            onClose()
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <Drawer
            title={__('需求申请审核')}
            open={open}
            onClose={onClose}
            width={800}
            push={{ distance: 0 }}
            className={styles['demand-audit-drawer']}
            footer={
                <Space className={styles['demand-audit-footer']}>
                    <Button onClick={onClose}>{__('取消')}</Button>
                    <Button type="primary" onClick={() => form.submit()}>
                        {__('提交')}
                    </Button>
                </Space>
            }
        >
            <div className={styles['demand-audit-content']}>
                <CommonTitle title={__('需求信息')} />
                {ApplyAuditFields.map((item, fieldIndex) => (
                    <div
                        key={item.value}
                        className={classNames(
                            styles['demand-info'],
                            fieldIndex === 0 && styles['first-demand-info'],
                        )}
                    >
                        <span className={styles['demand-info-label']}>
                            {item.label}
                        </span>
                        <span className={styles['demand-info-value']}>
                            {demandInfo[item.value] || '--'}
                        </span>
                    </div>
                ))}
                <div className={styles['demand-info']}>
                    <span className={styles['demand-info-label']}>
                        {__('详情')}
                    </span>
                    <Button type="link" onClick={() => setAuditOpen(true)}>
                        {__('查看全部')}
                    </Button>
                </div>
                <CommonTitle title={__('需求申请审核')} />
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
                    title={demandInfo.title}
                    demandId={demandInfo.id}
                />
            )}
        </Drawer>
    )
}

export default ApplyAudit
