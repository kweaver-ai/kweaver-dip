import { Button, Drawer, Form, Input, message, Radio, Space } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { RcFile } from 'antd/lib/upload'
import __ from '../locale'
import styles from './styles.module.less'
import { CommonTitle } from '@/ui'
import {
    formatError,
    getCityShareApplyDetail,
    getImplementCityShareApplyDetail,
    ImplementCatalogStatus,
    importDemandFile,
    ISharedApplyDetail,
    putCityShareApplyAnalysisAudit,
    putDocAudit,
} from '@/core'
import ApplyDetails from '../Details/CommonDetails'
import CatalogTable from '../Apply/CatalogTable'
import { ResTypeEnum } from '../helper'
import { applyFieldsConfig } from '../Details/helper'
import UploadFiles from '../Apply/UploadFiles'

interface AuditModalProps {
    open: boolean
    onClose: () => void
    auditItem: any
    onOk: () => void
}
const DataProviderAudit = ({
    open,
    onClose,
    auditItem,
    onOk = () => {},
}: AuditModalProps) => {
    const [form] = Form.useForm()
    const [details, setDetails] = useState<ISharedApplyDetail>()
    const [catalogsData, setCatalogsData] = useState<any[]>([])

    const auditResult = useMemo(() => {
        if (catalogsData.length === 1) {
            return catalogsData[0].is_supply ? 'pass' : 'reject'
        }
        return catalogsData.every((item) => item.is_supply)
            ? 'pass'
            : catalogsData.every((item) => !item.is_supply)
            ? 'reject'
            : 'pass-and-reject'
    }, [catalogsData])

    useEffect(() => {
        form.setFieldsValue({
            audit_result:
                auditResult === 'pass-and-reject' ? 'pass' : auditResult,
        })
    }, [auditResult])

    useEffect(() => {
        if (auditItem.id) {
            getDetails()
        }
    }, [auditItem])

    // 获取信息
    const getDetails = async () => {
        try {
            const res = await getCityShareApplyDetail(auditItem.id, {
                fields: 'base,analysis,implement',
            })
            const implementRes = await getImplementCityShareApplyDetail(
                auditItem.id,
                {
                    view: ImplementCatalogStatus.DS_AUDIT,
                    ds_audit_id: auditItem.ds_audit_id,
                },
            )
            const ids = implementRes.resources.map((item) => item.id)
            setDetails(res)
            const baseResources = (res.base.resources || []).filter((item) =>
                ids.includes(item.id),
            )
            const analysisResources = res.analysis.resources || []
            const clgData = baseResources.map((resource) => {
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
                // implement里面的ID跟analysis里面的id是一样的，analysis里面的src_id跟base里面是对应的
                const implementInfo = res.implement.find(
                    (item) => item.id === id,
                )
                const { is_publish, sync_success, sync_failed_reason } =
                    implementInfo || {}

                return {
                    ...resource,
                    is_publish,
                    sync_success,
                    sync_failed_reason,
                    additional_info_types,
                    is_reasonable,
                    attach_add_remark,
                    analysis_item_id: id,
                    is_supply: true,
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
                    .filter(
                        (item) =>
                            (item.is_new_res && ids.includes(item.id || '')) ||
                            (item.is_res_replace &&
                                ids.includes(item.new_id || '')),
                    )
                    .map((item) => {
                        return {
                            ...item,
                            analysis_item_id: item.id,
                            res_id: item.new_res_id,
                            res_name: item.new_res_name,
                            res_code: item.new_res_code,
                            res_type: item.new_res_type,
                            is_supply: true,
                        }
                    }),
            ])
        } catch (error) {
            formatError(error)
        }
    }

    const onFinish = async (values: any) => {
        try {
            if (catalogsData.find((item) => !item.is_supply && !item.remark)) {
                message.error(__('资源不提供时，请填写理由说明'))
                return
            }
            let fileInfo
            if (values.attachment) {
                const applicationLetterFiles =
                    values.attachment?.map((file) => ({ file })) || []
                const formDataArray = applicationLetterFiles.map(
                    (applicationLetterFile) => {
                        const formData = new FormData()
                        formData.append(
                            'file',
                            applicationLetterFile.file.originFileObj as RcFile,
                        )
                        return importDemandFile(formData)
                    },
                )

                const results = await Promise.all(formDataArray)
                fileInfo = {
                    attachment_id: results.map((res) => res.id),
                }
            }
            await putCityShareApplyAnalysisAudit(auditItem.id, {
                ds_audit_id: auditItem.ds_audit_id,
                audit_result: values.audit_result,
                audit_remark: values.audit_remark,
                supply_infos: catalogsData.map((item) => ({
                    id: item.analysis_item_id,
                    is_supply: item.is_supply,
                    remark: item.remark,
                })),
                ...(fileInfo || {}),
            })
            message.success(__('审核成功'))
            onClose()
            onOk()
        } catch (error) {
            formatError(error)
        }
    }

    const handleBatchConfig = ({
        isBatchConfig = false,
        value,
        id,
        fieldKey = 'is_supply',
    }) => {
        if (isBatchConfig) {
            setCatalogsData(
                catalogsData.map((item) => ({
                    ...item,
                    [fieldKey]: value,
                })),
            )
        } else {
            setCatalogsData(
                catalogsData.map((item) => {
                    if (item.res_id === id) {
                        return { ...item, [fieldKey]: value }
                    }
                    return item
                }),
            )
        }
    }

    const normFile = (e: any) => {
        if (Array.isArray(e)) {
            return e
        }
        return e?.fileList
    }

    return (
        <Drawer
            title={__('数据提供方审核')}
            open={open}
            onClose={onClose}
            width="100%"
            bodyStyle={{ padding: '20px 0', overflowY: 'hidden' }}
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
                        <CatalogTable
                            isView
                            items={catalogsData || []}
                            isProvideColumns
                            handleBatchConfig={handleBatchConfig}
                        />
                    </div>
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
                            name="audit_result"
                            required
                            rules={[{ required: true }]}
                            initialValue="pass"
                        >
                            <Radio.Group>
                                <Radio
                                    value="pass"
                                    disabled={auditResult === 'reject'}
                                >
                                    {__('通过')}
                                </Radio>
                                <Radio
                                    value="reject"
                                    disabled={auditResult !== 'reject'}
                                >
                                    {__('驳回')}
                                </Radio>
                            </Radio.Group>
                        </Form.Item>
                        <Form.Item
                            label=""
                            name="audit_remark"
                            rules={[
                                {
                                    required: auditResult === 'reject',
                                    message: __('请输入'),
                                },
                            ]}
                        >
                            <Input.TextArea
                                placeholder={__('请输入')}
                                maxLength={300}
                                showCount
                            />
                        </Form.Item>
                        <Form.Item
                            label={__('证明材料')}
                            name="attachment"
                            required={auditResult !== 'pass'}
                            rules={[
                                {
                                    required: auditResult !== 'pass',
                                    message: __('请上传文件'),
                                },
                            ]}
                            valuePropName="fileList"
                            getValueFromEvent={normFile}
                        >
                            <UploadFiles maxCount={1000} />
                        </Form.Item>
                    </Form>
                </div>
            </div>
        </Drawer>
    )
}

export default DataProviderAudit
