import { Button, Drawer, Form, Input, message, Radio, Space } from 'antd'
import { useEffect, useState } from 'react'
import __ from '../locale'
import styles from './styles.module.less'
import { CommonTitle } from '@/ui'
import {
    formatError,
    getAuditDetails,
    getCityShareApplyDetail,
    ISharedApplyDetail,
    putDocAudit,
} from '@/core'
import ApplyDetails from '../Details/CommonDetails'
import { feedbackAduitFieldsConfig } from './helper'
import SharingDrawer from '../CitySharingDrawer'

interface AuditModalProps {
    open: boolean
    onClose: () => void
    auditItem: any
    onOk: () => void
}
const FeedbackAudit = ({
    open,
    onClose,
    auditItem,
    onOk = () => {},
}: AuditModalProps) => {
    const [form] = Form.useForm()
    const [showDetails, setShowDetails] = useState(false)
    const [details, setDetails] = useState<ISharedApplyDetail>()

    useEffect(() => {
        if (auditItem.id) {
            getDetails()
        }
    }, [auditItem])

    // 获取信息
    const getDetails = async () => {
        try {
            const res = await getCityShareApplyDetail(auditItem.id, {
                fields: 'base',
            })
            setDetails(res)
        } catch (error) {
            formatError(error)
        }
    }

    const onFinish = async (values: any) => {
        if (!auditItem.audit_proc_inst_id) {
            return
        }
        try {
            const res = await getAuditDetails(auditItem.audit_proc_inst_id)
            await putDocAudit({
                ...values,
                id: auditItem.audit_proc_inst_id,
                task_id: res?.task_id,
            })
            message.success(__('审核成功'))
            onClose()
            onOk()
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <Drawer
            title={__('申报审核')}
            open={open}
            onClose={onClose}
            width={638}
            bodyStyle={{ padding: '20px 0' }}
            footer={
                <Space className={styles['audit-footer']}>
                    <Button onClick={onClose}>{__('取消')}</Button>
                    <Button type="primary" onClick={() => form.submit()}>
                        {__('提交')}
                    </Button>
                </Space>
            }
        >
            <div className={styles['audit-info-wrapper']}>
                <div className={styles['info-container']}>
                    <div className={styles['audit-info-title']}>
                        <CommonTitle title={__('基本信息')} />
                    </div>
                    <ApplyDetails
                        data={{ ...(details?.base || {}), ...auditItem }}
                        configData={feedbackAduitFieldsConfig}
                        clickEvent={[
                            {
                                name: 'detail',
                                onClick: () => {
                                    setShowDetails(true)
                                },
                            },
                        ]}
                    />
                </div>
                <div className={styles['audit-form-container']}>
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
                                <Radio value={1}>{__('通过')}</Radio>
                                <Radio value={0}>{__('驳回')}</Radio>
                            </Radio.Group>
                        </Form.Item>
                        <Form.Item label="" name="audit_msg">
                            <Input.TextArea
                                placeholder={__('请输入')}
                                maxLength={300}
                                showCount
                                style={{ height: 100, resize: 'none' }}
                            />
                        </Form.Item>
                    </Form>
                </div>
            </div>
            {showDetails && (
                <SharingDrawer
                    open={showDetails}
                    operate="Detail"
                    applyId={auditItem?.id}
                    onClose={() => {
                        setShowDetails(false)
                    }}
                />
            )}
        </Drawer>
    )
}

export default FeedbackAudit
