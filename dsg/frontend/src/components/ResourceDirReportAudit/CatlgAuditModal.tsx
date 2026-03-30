import { Button, Drawer, Form, Input, message, Radio, Space } from 'antd'
import React, { useState } from 'react'
import moment from 'moment'
import { isNumber } from 'lodash'
import __ from './locale'
import styles from './styles.module.less'
import {
    auditOperationList,
    resourceTypeList,
    StatusType,
} from '../ResourceDirReport/const'
import { LabelTitle } from '../ResourcesDir/BaseInfo'
import CatlgAuditDetail from './CatlgAuditDetail'
import { getAuditDetails, putDocAudit } from '@/core'
import { PromptModal } from './helper'

interface ICatlgAuditModal {
    item: any
    onClose?: (refresh?: boolean) => void
}

function CatlgAuditModal({ item, onClose }: ICatlgAuditModal) {
    const [form] = Form.useForm()
    const [previewOpen, setPreviewOpen] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)

    const handleSubmit = async (values) => {
        if (!item) return
        const { audit_idea, audit_msg } = values
        const title = audit_idea
            ? __('确定同意上报目录吗？')
            : __('确定拒绝上报目录吗？')
        const content = audit_idea
            ? __('同意后目录将上报到省平台')
            : __('拒绝后目录将无法上报到省平台')

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
                        {__('目录上报申请审核')}
                    </span>
                }
                onClose={() => onClose?.()}
                maskClosable={false}
                destroyOnClose
                placement="right"
                width={640}
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
                    <LabelTitle label="目录上报信息" />
                    <div className={styles['audit-item']}>
                        <div className={styles['audit-attr']}>
                            <span>{__('数据资源目录名称')}:</span>
                            <div className={styles['audit-attr-info']}>
                                <div
                                    className={styles['dir-title']}
                                    title={item?.catalog_title}
                                >
                                    {item?.catalog_title || '--'}
                                </div>
                                {item?.catalog_status ===
                                    StatusType.Offline && (
                                    <span className={styles['audit-status']}>
                                        {__('已下线')}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className={styles['audit-attr']}>
                            <span>{__('上报类型')}:</span>
                            <div className={styles['audit-attr-info']}>
                                <div>
                                    {auditOperationList?.find(
                                        (it) =>
                                            it.value === item?.audit_operation,
                                    )?.label || '--'}
                                </div>
                            </div>
                        </div>
                        <div className={styles['audit-attr']}>
                            <span>{__('资源类型')}:</span>
                            <div className={styles['audit-attr-info']}>
                                <div>
                                    {resourceTypeList?.find(
                                        (it) =>
                                            it.value ===
                                            item?.resource_type?.[0],
                                    )?.label || '--'}
                                </div>
                            </div>
                        </div>
                        <div className={styles['audit-attr']}>
                            <span>{__('申请时间')}:</span>
                            <div className={styles['audit-attr-info']}>
                                <div>
                                    {isNumber(item?.apply_time)
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
                    <LabelTitle label="审核信息" />
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
                            >
                                <Radio.Group>
                                    <Radio value>{__('同意')}</Radio>
                                    <Radio value={false}>{__('拒绝')}</Radio>
                                </Radio.Group>
                            </Form.Item>
                            <Form.Item label={__('备注')} name="audit_msg">
                                <Input.TextArea
                                    className={styles['show-count']}
                                    style={{
                                        height: 104,
                                        resize: 'none',
                                    }}
                                    placeholder={__('填写意见（选填）')}
                                    showCount
                                    maxLength={255}
                                />
                            </Form.Item>
                        </Form>
                    </div>
                </div>
            </Drawer>
            {previewOpen && (
                <CatlgAuditDetail
                    item={item}
                    onClose={() => {
                        setPreviewOpen(false)
                    }}
                />
            )}
        </>
    )
}

export default CatlgAuditModal
