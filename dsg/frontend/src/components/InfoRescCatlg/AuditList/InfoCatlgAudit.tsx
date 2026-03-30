import { Button, Drawer, Form, Input, Radio, Space } from 'antd'
import classNames from 'classnames'
import { useEffect, useState } from 'react'
import styles from './styles.module.less'
import __ from './locale'

import { CommonTitle } from '@/ui'
import {
    formatError,
    getAuditDetails,
    IAuditInfoCatlgItem,
    putDocAudit,
} from '@/core'
import { formatTime, getActualUrl } from '@/utils'
import { auditInfoCatlgInfos } from './helper'

interface AuditProps {
    open: boolean
    onOK: () => void
    onClose: () => void
    catlgInfo: IAuditInfoCatlgItem
    // target: IAppCaseAuditType
}

const Audit = ({ open, onOK, onClose, catlgInfo }: AuditProps) => {
    const [form] = Form.useForm()

    const [loading, setLoading] = useState(false)

    useEffect(() => {
        form.setFieldsValue(catlgInfo)
    }, [catlgInfo])

    const onFinish = async (values: any) => {
        try {
            setLoading(true)
            const { audit_idea } = values
            const res = await getAuditDetails(catlgInfo?.process_id)
            await putDocAudit({
                ...values,
                id: catlgInfo.process_id,
                task_id: res?.task_id,
                audit_idea: !!audit_idea,
            })
            onOK()
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    const viewInfoCatlgDetail = () => {
        const url = `/dataService/infoCatlgDetails?catlgId=${
            catlgInfo?.id || ''
        }&name=${catlgInfo?.name}&backUrl=/dataService/infoCatlgAudit`
        window.open(getActualUrl(url), '_blank')
    }

    return (
        <Drawer
            title={__('信息资源目录审核')}
            open={open}
            onClose={onClose}
            width={640}
            push={{ distance: 0 }}
            bodyStyle={{ padding: 0 }}
            // className={styles['audit-drawer']}
            footer={
                <Space className={styles.auditFooter}>
                    <Button onClick={onClose}>{__('取消')}</Button>
                    <Button
                        type="primary"
                        loading={loading}
                        onClick={() => form.submit()}
                    >
                        {__('确定')}
                    </Button>
                </Space>
            }
        >
            <div className={styles.auditContent}>
                <div className={styles.commonTitle}>
                    <CommonTitle title={__('资源目录信息')} />
                </div>
                {auditInfoCatlgInfos.map((item, fieldIndex) => (
                    <div
                        key={item.value}
                        className={classNames(
                            styles.viewAuditInfoWrapper,
                            fieldIndex === 0 && styles.firstAuditInfo,
                        )}
                    >
                        <span className={styles.auditInfoLabel}>
                            {item.label}
                        </span>
                        <span className={styles.auditInfoValue}>
                            {item.type === 'timestamp'
                                ? formatTime(catlgInfo?.audit_at)
                                : catlgInfo?.[item.value] || '--'}
                        </span>
                    </div>
                ))}
                <div className={styles.viewAuditInfoWrapper}>
                    <span className={styles.auditInfoLabel}>{__('详情')}</span>
                    <Button type="link" onClick={viewInfoCatlgDetail}>
                        {__('查看全部')}
                    </Button>
                </div>
                <div className={styles.auditFormInfoWrapper}>
                    {/* <div className={styles.commonTitle}>
                        <CommonTitle title={__('目录审核')} />
                    </div> */}
                    <div className={styles.auditFormWrapper}>
                        <Form
                            layout="vertical"
                            style={{ marginTop: 20 }}
                            form={form}
                            onFinish={onFinish}
                            initialValues={{
                                audit_idea: 1,
                            }}
                        >
                            <Form.Item
                                label={__('审核意见')}
                                name="audit_idea"
                                required
                                rules={[{ required: true }]}
                            >
                                <Radio.Group>
                                    <Radio value={1}>{__('同意')}</Radio>
                                    <Radio value={0}>{__('拒绝')}</Radio>
                                </Radio.Group>
                            </Form.Item>
                            <Form.Item
                                noStyle
                                shouldUpdate={(pre, cur) =>
                                    pre.audit_idea !== cur.audit_idea
                                }
                            >
                                {({ getFieldValue }) => {
                                    const audit_idea =
                                        getFieldValue('audit_idea')
                                    return (
                                        <Form.Item
                                            label={__('备注')}
                                            name="audit_msg"
                                            required={!audit_idea}
                                            rules={[
                                                {
                                                    required: !audit_idea,
                                                    message: __('请输入备注'),
                                                },
                                            ]}
                                        >
                                            <Input.TextArea
                                                placeholder={`${__(
                                                    '请输入备注',
                                                )}${
                                                    audit_idea
                                                        ? ''
                                                        : __('（必填）')
                                                }`}
                                                maxLength={300}
                                                className={styles.textArea}
                                                showCount
                                            />
                                        </Form.Item>
                                    )
                                }}
                            </Form.Item>
                        </Form>
                    </div>
                </div>
            </div>
        </Drawer>
    )
}

export default Audit
