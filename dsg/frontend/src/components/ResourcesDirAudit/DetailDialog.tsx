import React, { useMemo, useRef, useState } from 'react'
import { Tabs, Drawer, Form, Input, Radio, Space, Button } from 'antd'
import DirColumnInfo from '@/components/ResourcesDir/DirColumnInfo'
import DirBasicInfo from '@/components/ResourcesDir/DirBasicInfo'
import styles from './styles.module.less'
import __ from './locale'
import { formatError, getAuditDetails, putDocAudit } from '@/core'
import { useResourcesCatlogContext } from '../ResourcesDir/ResourcesCatlogProvider'

function DetailDialog({ id, open, onClose, appCaseInfo, isAudit }: any) {
    const [form] = Form.useForm()
    const { isFileRescType } = useResourcesCatlogContext()
    const [loading, setLoading] = useState(false)

    const handleCancel = () => {
        onClose()
    }

    const title = useMemo(() => {
        return '资源目录详情'
    }, [appCaseInfo])

    const ref = useRef({
        getDirName: () => {},
    })

    const onFinish = async (values: any) => {
        try {
            setLoading(true)
            const res = await getAuditDetails(appCaseInfo.id)
            await putDocAudit({
                id: appCaseInfo.id,
                task_id: res?.task_id,
                audit_idea: !!values.audit_idea,
                audit_msg: values.audit_msg,
                attachments: [],
            })
            onClose()
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }
    return (
        <Drawer
            title={title}
            placement="right"
            onClose={handleCancel}
            open={open}
            width="calc(100vw - 220px)"
            push={false}
            bodyStyle={{
                padding: 0,
                maxHeight: isAudit ? ' calc(100% - 338px)' : '100%',
            }}
        >
            <div className={styles.modalContent}>
                <div className={styles.basicBox}>
                    <Tabs defaultActiveKey="1">
                        <Tabs.TabPane tab={__('基本信息')} key="1">
                            <DirBasicInfo catalogId={id} ref={ref} isAudit />
                        </Tabs.TabPane>
                        {!isFileRescType && (
                            <Tabs.TabPane tab={__('信息项')} key="2">
                                <DirColumnInfo
                                    catalogId={id}
                                    isMarket
                                    isAudit
                                />
                            </Tabs.TabPane>
                        )}
                    </Tabs>
                </div>
                {isAudit ? (
                    <div className={styles['audit-content']}>
                        <Form
                            layout="vertical"
                            className={styles['audit-content-form']}
                            form={form}
                            onFinish={onFinish}
                        >
                            <Form.Item
                                label={__('审核意见')}
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
                        <Space className={styles['audit-content-footer']}>
                            <Button onClick={onClose}>{__('取消')}</Button>
                            <Button
                                type="primary"
                                onClick={() => form.submit()}
                                loading={loading}
                            >
                                {__('确定')}
                            </Button>
                        </Space>
                    </div>
                ) : null}
            </div>
        </Drawer>
    )
}

export default DetailDialog
