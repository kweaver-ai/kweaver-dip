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
import CommonDetails from '../Details/CommonDetails'
import CatalogTable from '../Apply/CatalogTable'
import { analysisFieldsConfig } from './helper'
import ResourceTable from '../Analysis/ResourceTable'
import ResourceDetails from '../Details/ResourceDetails'
import { ResTypeEnum } from '../helper'
import { applyFieldsConfig } from '../Details/helper'

interface AuditModalProps {
    open: boolean
    onClose: () => void
    auditItem: any
    onOk: () => void
}
const AnalysisAudit = ({
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
                fields: 'base,analysis',
            })
            setDetails(res)
            const baseResources = res.base.resources || []
            const analysisResources = res.analysis.resources || []
            const clgData = baseResources.map((resource) => {
                // const { apply_conf, ...restSource } = resource
                // const { view_apply_conf, api_apply_conf, ...restApplyConf } =
                //     apply_conf
                const analysisRes = analysisResources.find(
                    (item) => item.src_id === resource.id,
                )

                const {
                    additional_info_types,
                    is_reasonable,
                    attach_add_remark,
                    id,
                    is_res_replace,
                } = analysisRes || {}

                return {
                    ...resource,
                    additional_info_types,
                    is_reasonable,
                    attach_add_remark,
                    analysis_item_id: id,
                    replace_res: is_reasonable
                        ? undefined
                        : is_res_replace
                        ? {
                              res_type: ResTypeEnum.Catalog,
                              res_id: analysisRes?.new_res_id,
                              res_code: analysisRes?.new_res_code,
                              res_name: analysisRes?.new_res_name,
                              org_path: analysisRes?.org_path,
                              apply_conf: analysisRes?.apply_conf,
                          }
                        : undefined,
                }
            })
            setCatalogsData([
                ...clgData,
                ...analysisResources
                    .filter((item) => item.is_new_res)
                    .map((item) => {
                        return {
                            ...item,
                            analysis_item_id: item.id,
                            res_id: item.new_res_id,
                            res_name: item.new_res_name,
                            res_code: item.new_res_code,
                            res_type: item.new_res_type,
                        }
                    }),
            ])
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
            title={__('分析结论审核')}
            open={open}
            onClose={onClose}
            width={1520}
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
                        styles['analysis-info-container'],
                    )}
                >
                    <div className={styles['audit-info-title']}>
                        <CommonTitle title={__('申请信息')} />
                    </div>
                    <CommonDetails
                        data={details?.base}
                        configData={applyFieldsConfig}
                    />
                    <div className={styles['audit-info-title']}>
                        <CommonTitle title={__('分析结论')} />
                    </div>
                    <CommonDetails
                        data={{
                            ...(details?.base || {}),
                            ...(details?.analysis || {}),
                        }}
                        configData={analysisFieldsConfig}
                    />

                    <div className={styles['audit-info-title']}>
                        <CommonTitle title={__('分析资源')} />
                    </div>
                    <div className={styles['catalog-table']}>
                        <ResourceTable isView items={catalogsData || []} />
                    </div>
                </div>
                <div
                    className={classNames(
                        styles['audit-form-container'],
                        styles['analysis-audit-form-container'],
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
                            initialValue
                        >
                            <Radio.Group>
                                <Radio value>{__('通过')}</Radio>
                                <Radio value={false}>{__('驳回')}</Radio>
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

export default AnalysisAudit
