import { Button, Drawer, Form, Input, message, Radio, Space } from 'antd'
import moment from 'moment'
import { useState } from 'react'
import classnames from 'classnames'
import { getAuditDetails, putDocAudit } from '@/core'
import DetailModal from '../PlanProcessing/DetailModal'
import { PromptModal } from './helper'
import __ from './locale'
import styles from './styles.module.less'

interface IAuditModal {
    item: any
    onClose?: (refresh?: boolean) => void
}

function AuditModal({ item, onClose }: IAuditModal) {
    const [form] = Form.useForm()
    const [previewOpen, setPreviewOpen] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)

    const handleSubmit = async (values) => {
        if (!item) return
        const { audit_idea, audit_msg } = values
        const title = audit_idea ? __('同意') : __('拒绝')
        const content = audit_idea
            ? __('确定同意申请吗？')
            : __('确定拒绝申请吗？拒绝后，审核流程将结束。')
        PromptModal({
            title,
            content,
            async onOk() {
                try {
                    setLoading(true)
                    const res = await getAuditDetails(item?.proc_inst_id)
                    await putDocAudit({
                        id: item.proc_inst_id,
                        task_id: res?.task_id,
                        audit_idea,
                        audit_msg,
                        attachments: [],
                    })
                    onClose?.(true)
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
        <>
            <Drawer
                open
                title={
                    <span style={{ fontWeight: 550, fontSize: 16 }}>
                        {__('数据处理计划申请审核')}
                    </span>
                }
                onClose={() => onClose?.()}
                maskClosable={false}
                destroyOnClose
                placement="right"
                width={640}
                bodyStyle={{ padding: '0px' }}
                footer={
                    <div className={styles['audit-modal-footer']}>
                        <Space size={8}>
                            <Button
                                onClick={() => onClose?.()}
                                className={styles.btn}
                            >
                                {__('取消')}
                            </Button>
                            <Button
                                onClick={() => {
                                    form.submit()
                                }}
                                type="primary"
                                className={styles.btn}
                                loading={loading}
                            >
                                {__('确定')}
                            </Button>
                        </Space>
                    </div>
                }
            >
                <div className={styles['audit-modal-content']}>
                    <div
                        className={classnames(
                            styles['audit-item'],
                            styles['audit-content'],
                        )}
                    >
                        <div className={styles['audit-attr']}>
                            <span>{__('数据处理计划名称')}:</span>
                            <div className={styles['audit-attr-info']}>
                                <div
                                    className={styles['dir-title']}
                                    title={item?.name}
                                >
                                    {item?.name || '--'}
                                </div>
                            </div>
                        </div>

                        <div className={styles['audit-attr']}>
                            <span>{__('申请时间')}:</span>
                            <div className={styles['audit-attr-info']}>
                                <div>
                                    {item?.apply_time
                                        ? moment(item?.apply_time).format(
                                              'YYYY-MM-DD HH:mm:ss',
                                          )
                                        : '--'}
                                </div>
                            </div>
                        </div>
                        <div className={styles['audit-attr']}>
                            <span>{__('详情')}:</span>
                            <div className={styles['audit-attr-info']}>
                                <div>
                                    <Button
                                        ghost
                                        type="link"
                                        onClick={() => setPreviewOpen(true)}
                                    >
                                        {__('查看全部')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={styles['audit-item']}>
                        <Form
                            layout="vertical"
                            form={form}
                            onFinish={(values) => {
                                handleSubmit(values)
                            }}
                            autoComplete="off"
                            scrollToFirstError
                        >
                            <Form.Item
                                label={__('审核意见')}
                                name="audit_idea"
                                initialValue
                                required
                                style={{ marginBottom: '12px' }}
                            >
                                <Radio.Group>
                                    <Radio value>{__('通过')}</Radio>
                                    <Radio value={false}>{__('驳回')}</Radio>
                                </Radio.Group>
                            </Form.Item>
                            <Form.Item
                                name="audit_msg"
                                style={{ marginBottom: '0px' }}
                            >
                                <Input.TextArea
                                    className={styles['show-count']}
                                    style={{
                                        height: 104,
                                        resize: 'none',
                                    }}
                                    placeholder={__('请输入说明')}
                                    showCount
                                    maxLength={255}
                                />
                            </Form.Item>
                        </Form>
                    </div>
                </div>
            </Drawer>
            {previewOpen && (
                <DetailModal
                    id={item?.id}
                    onClose={() => {
                        setPreviewOpen(false)
                    }}
                />
            )}
        </>
    )
}

export default AuditModal
