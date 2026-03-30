import { Button, Col, Drawer, Form, Input, Row, Select, Space } from 'antd'
import { useEffect, useState } from 'react'
import { RcFile } from 'antd/lib/upload'
import __ from '../locale'
import { CommonTitle } from '@/ui'
import styles from './styles.module.less'
import UploadFiles from '../Apply/UploadFiles'
import {
    formatError,
    getDataSourceList,
    getFormsFromDatasource,
    importDemandFile,
} from '@/core'
import { NoTargetPushForm } from '../const'

interface AdditionalInfoProps {
    open: boolean
    onClose: () => void
    resource: any
    onOk: (values: any) => void
}
const AdditionalInfo = ({
    open,
    onClose,
    resource = {},
    onOk,
}: AdditionalInfoProps) => {
    const [form] = Form.useForm()
    const [dataSourceOptions, setDataSourceOptions] = useState<any[]>([])
    const [dataTableOptions, setDataTableOptions] = useState<
        {
            label: string
            value: string
        }[]
    >([])

    useEffect(() => {
        if (resource.additional_infos) {
            const {
                attachment_id,
                attachment_name,
                dst_data_source_id,
                dst_view_name,
                usage,
            } = resource.additional_infos
            if (dst_data_source_id) {
                getDataTables(dst_data_source_id)
            }

            form.setFieldsValue({
                dst_data_source_id,
                dst_view_name,
                usage,
                attachment: [
                    {
                        id: attachment_id,
                        name: attachment_name,
                    },
                ],
            })
        }
    }, [resource])

    const getDataSources = async () => {
        const { entries } = await getDataSourceList({
            limit: 999,
        })
        setDataSourceOptions(entries)
    }

    useEffect(() => {
        getDataSources()
    }, [])

    const getDataTables = async (dataSourceId: string) => {
        try {
            if (!dataSourceId) {
                setDataTableOptions([])
                return
            }
            const res = await getFormsFromDatasource(dataSourceId)
            setDataTableOptions([
                ...res.map((item) => ({
                    label: item,
                    value: item,
                })),
                {
                    label: '无',
                    value: NoTargetPushForm,
                },
            ])
        } catch (e) {
            formatError(e)
        }
    }

    const normFile = (e: any) => {
        if (Array.isArray(e)) {
            return e
        }
        return e?.fileList
    }

    const onFinish = async (values: any) => {
        let fileInfo
        if (values.attachment) {
            // 回显数据直接保存
            if (values.attachment?.[0]?.id && values.attachment?.[0]?.name) {
                fileInfo = {
                    attachment_id: values.attachment?.[0]?.id,
                    attachment_name: values.attachment?.[0]?.name,
                }
            } else {
                const applicationLetterFile = { file: values.attachment?.[0] }
                const formData = new FormData()
                formData.append(
                    'file',
                    applicationLetterFile.file.originFileObj as RcFile,
                )
                const res = await importDemandFile(formData)
                fileInfo = {
                    attachment_id: res.id,
                    attachment_name:
                        applicationLetterFile.file.originFileObj.name,
                }
            }
        }
        const { attachment, ...rest } = values
        onOk({
            ...rest,
            ...(fileInfo || {}),
            analysis_item_id: resource.analysis_item_id,
        })
        onClose()
    }

    return (
        <Drawer
            title={__('补充信息')}
            width={837}
            open={open}
            onClose={onClose}
            footer={
                <Space className={styles['additional-info-footer']}>
                    <Button onClick={onClose}>{__('取消')}</Button>
                    <Button type="primary" onClick={() => form.submit()}>
                        {__('保存')}
                    </Button>
                </Space>
            }
        >
            <div className={styles['additional-info-container']}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    onFieldsChange={(field, allFields) => {
                        if (field[0]?.name[0]?.includes('dst_data_source_id')) {
                            getDataTables(field[0].value)
                        }
                    }}
                >
                    <Row>
                        {resource.additional_info_types.includes(
                            'data-source',
                        ) && (
                            <>
                                <Col
                                    span={24}
                                    className={styles['common-title']}
                                >
                                    <CommonTitle title={__('数据源信息')} />
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="dst_data_source_id"
                                        label={__('目标数据源')}
                                        className={styles.form_row}
                                        required
                                        rules={[
                                            {
                                                required: true,
                                                message: __('请选择目标数据源'),
                                            },
                                        ]}
                                    >
                                        <Select
                                            fieldNames={{
                                                label: 'name',
                                                value: 'id',
                                            }}
                                            showSearch
                                            filterOption={(input, option) =>
                                                (option?.name ?? '')
                                                    .toLowerCase()
                                                    .includes(
                                                        input.toLowerCase(),
                                                    )
                                            }
                                            options={dataSourceOptions}
                                            placeholder={__('请选择')}
                                            style={{ width: 284 }}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label={__('目标数据表')}
                                        name="dst_view_name"
                                        className={styles.form_row}
                                        required
                                        rules={[
                                            {
                                                required: true,
                                                message: __('请选择目标数据表'),
                                            },
                                        ]}
                                    >
                                        <Select
                                            placeholder={__('请选择')}
                                            style={{ width: 284 }}
                                            options={dataTableOptions}
                                            showSearch
                                            filterOption={(input, option) =>
                                                (option?.label ?? '')
                                                    .toLowerCase()
                                                    .includes(
                                                        input.toLowerCase(),
                                                    )
                                            }
                                        />
                                    </Form.Item>
                                </Col>
                            </>
                        )}
                        {resource.additional_info_types.includes('usage') && (
                            <>
                                <Col
                                    span={24}
                                    className={styles['common-title']}
                                >
                                    <CommonTitle title={__('数据用途')} />
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        label={__('数据用途')}
                                        required
                                        rules={[
                                            {
                                                required: true,
                                                message: __('输入不能为空'),
                                            },
                                        ]}
                                        name="usage"
                                    >
                                        <Input.TextArea
                                            className={
                                                styles[
                                                    'analysis-result-textarea'
                                                ]
                                            }
                                            placeholder={__('请输入')}
                                            maxLength={300}
                                            showCount
                                        />
                                    </Form.Item>
                                </Col>
                            </>
                        )}
                        {resource.additional_info_types.includes(
                            'attachment',
                        ) && (
                            <>
                                <Col
                                    span={24}
                                    className={styles['common-title']}
                                >
                                    <CommonTitle title={__('申请材料')} />
                                </Col>
                                <Col span={24}>
                                    <div
                                        className={
                                            styles['additional-info-label']
                                        }
                                    >
                                        {__('申请材料补充说明')}
                                    </div>
                                    <div
                                        className={
                                            styles['additional-info-value']
                                        }
                                    >
                                        {resource.attach_add_remark}
                                    </div>
                                </Col>
                                <Form.Item
                                    label={__('申请材料')}
                                    name="attachment"
                                    required
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请上传文件'),
                                        },
                                    ]}
                                    valuePropName="fileList"
                                    getValueFromEvent={normFile}
                                >
                                    <UploadFiles maxCount={1} />
                                </Form.Item>
                            </>
                        )}
                    </Row>
                </Form>
                <div />
            </div>
        </Drawer>
    )
}

export default AdditionalInfo
