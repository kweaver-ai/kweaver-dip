import { Button, Drawer, Form, Input, message, Radio, Space } from 'antd'
import { useEffect, useState } from 'react'
import classNames from 'classnames'
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
import CatalogTable from '../Apply/CatalogTable'
import { ResTypeEnum } from '../helper'
import { applyFieldsConfig } from '../Details/helper'

interface AuditModalProps {
    open: boolean
    onClose: () => void
    auditItem: any
    onOk: () => void
}
const ApplyAudit = ({
    open,
    onClose,
    auditItem,
    onOk = () => {},
}: AuditModalProps) => {
    const [form] = Form.useForm()
    const [openDetails, setOpenDetails] = useState(false)
    const [details, setDetails] = useState<ISharedApplyDetail>()
    const [catalogsData, setCatalogsData] = useState<any[]>([])

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
            setCatalogsData(
                res.base.resources.map((item) => {
                    const {
                        view_apply_conf,
                        api_apply_conf,
                        ...otherApplyConf
                    } = item.apply_conf
                    return {
                        ...item,
                        configFinish: true,
                        apply_conf: {
                            ...otherApplyConf,
                            view_apply_conf: view_apply_conf
                                ? {
                                      ...view_apply_conf,
                                      columns:
                                          item.apply_conf.view_apply_conf.column_ids
                                              .split(',')
                                              .map((id, idIdx) => ({
                                                  id,
                                                  business_name: JSON.parse(
                                                      item.apply_conf
                                                          .view_apply_conf
                                                          .column_names,
                                                  )[idIdx],
                                              })),
                                  }
                                : undefined,
                            api_apply_conf: api_apply_conf || undefined,
                        },
                    }
                }),
            )
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
            width={1380}
            bodyStyle={{ padding: '20px 0 0' }}
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
                <div
                    className={classNames(
                        styles['info-container'],
                        styles['apply-info-container'],
                    )}
                >
                    <div className={styles['audit-info-title']}>
                        <CommonTitle title={__('申请信息')} />
                    </div>
                    <ApplyDetails
                        data={details?.base}
                        configData={applyFieldsConfig}
                    />
                    <div className={styles['audit-info-title']}>
                        <CommonTitle title={__('申请资源清单')} />
                    </div>
                    <div className={styles['catalog-table']}>
                        <CatalogTable isView items={catalogsData || []} />
                    </div>
                </div>
                <div
                    className={classNames(
                        styles['audit-form-container'],
                        styles['apply-audit-form-container'],
                    )}
                >
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
        </Drawer>
    )
}

export default ApplyAudit
