import React, { useEffect, useState } from 'react'
import {
    Button,
    Checkbox,
    Drawer,
    Form,
    Input,
    Radio,
    Space,
    message,
} from 'antd'
import { useSearchParams } from 'react-router-dom'
import __ from './locale'
import styles from './styles.module.less'
import { InfoOutlined } from '@/icons'
import ChooseResource from './ChooseResource'
import { ErrorInfo, OperateType } from '@/utils'
import VisitorCard from './VisitorCard'
import { VisitorProvider } from './VisitorProvider'
import {
    IDatasheetField,
    formatError,
    getDatasheetViewDetails,
    getVirtualEngineExample,
} from '@/core'
import { IExtendDemandItemInfo, ResType } from './const'

interface ICreateResource {
    open: boolean
    onClose: () => void
    operateType?: OperateType
    onOK: (data: any) => void
    editData?: IExtendDemandItemInfo
    applierId: string
}
const CreateResource: React.FC<ICreateResource> = ({
    open,
    onClose,
    operateType = OperateType.CREATE,
    onOK,
    editData,
    applierId,
}) => {
    const [form] = Form.useForm()
    const [chooseResourceOpen, setChooseResourceOpen] = useState(false)
    const [dataResource, setDataResource] = useState<any>({})
    // 数据表库表是否存在数据
    const [isExistData, setIsExistData] = useState(false)
    const [fields, setFields] = useState<IDatasheetField[]>([])

    useEffect(() => {
        if (editData) {
            form.setFieldsValue({
                res_name: editData.res_name,
                apply_reason: editData.apply_reason,
                authority: editData.authority,
                visitors: editData.visitors,
            })
            getResource({
                id: editData.res_id,
                business_name: editData.res_name,
            })
        }
    }, [editData])

    const getResource = async (resource) => {
        setDataResource(resource)
        form.setFieldsValue({
            res_name: resource.business_name,
        })
        // 根据所选的数据表库表 查询是否存在样例数据
        if (dataResource?.id !== resource.id) {
            // 获取数据表库表详情
            try {
                const userInfo = JSON.parse(
                    localStorage.getItem('userInfo') || '',
                )

                const res = await getDatasheetViewDetails(resource.id)
                const [catalog, schema] =
                    res.view_source_catalog_name.split('.')
                setFields(res.fields)
                // 清空行列规则
                const visitors = form.getFieldValue('visitors') || []
                form.setFieldsValue({
                    visitors: visitors.map((visitor) => {
                        const { fields: fs, row_filters, ...rest } = visitor
                        return {
                            ...rest,
                            fields: res.fields.map((f) => ({
                                id: f.id,
                                name_en: f.technical_name,
                                data_type: f.data_type,
                                name: f.business_name,
                            })),
                        }
                    }),
                })
                const data = await getVirtualEngineExample({
                    catalog,
                    schema,
                    table: res.business_name,
                    user: userInfo?.Account || '',
                    limit: 10,
                })
                setIsExistData(data.data.length > 0)
            } catch (error) {
                formatError(error)
            }
        }
    }

    const onFinish = (values) => {
        if (!values.visitors || values.visitors?.length === 0) {
            message.error(__('请先添加访问者'))
            return
        }
        onOK({
            ...values,
            visitors: values.visitors.map((visitor) => ({
                ...visitor,
                id: visitor.subject_id,
                name: visitor.subject_name,
            })),
            res_id: dataResource.id,
            res_type: ResType.Logicview,
        })
        onClose()
    }

    useEffect(() => {
        if (!open) {
            form.resetFields()
        } else if (operateType === OperateType.CREATE) {
            form.setFieldsValue({
                authority: ['read'],
            })
        }
    }, [open])

    return (
        <Drawer
            title={__('新建资源')}
            open={open}
            onClose={onClose}
            width={866}
            footer={
                <Space size={8} style={{ float: 'right' }}>
                    <Button onClick={onClose}>{__('取消')}</Button>
                    <Button type="primary" onClick={() => form.submit()}>
                        {__('确定')}
                    </Button>
                </Space>
            }
        >
            <VisitorProvider>
                <div className={styles['create-resource-wrapper']}>
                    <Form
                        form={form}
                        autoComplete="off"
                        layout="vertical"
                        onFinish={onFinish}
                    >
                        <Space size={24}>
                            <Form.Item
                                required
                                name="res_name"
                                label={__('选择数据资源：')}
                                rules={[
                                    {
                                        required: true,
                                        message: __('请选择数据资源'),
                                    },
                                ]}
                            >
                                <Input
                                    placeholder={__('请选择数据资源')}
                                    style={{ width: 405 }}
                                    readOnly
                                />
                            </Form.Item>
                            <Button
                                type="primary"
                                onClick={() => setChooseResourceOpen(true)}
                            >
                                {__('选择')}
                            </Button>
                        </Space>

                        <Form.Item
                            name="apply_reason"
                            label={__('申请理由：')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: ErrorInfo.NOTNULL,
                                },
                            ]}
                        >
                            <Input.TextArea
                                maxLength={300}
                                showCount
                                placeholder={__('请输入申请理由')}
                                className={styles['text-area']}
                            />
                        </Form.Item>
                        <Form.Item
                            name="authority"
                            label={__('添加访问者权限：')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: ErrorInfo.NOTNULL,
                                },
                            ]}
                        >
                            <Checkbox.Group>
                                <Checkbox value="read" disabled>
                                    {__('读取')}
                                    <InfoOutlined
                                        title={__('可见数据目录的真实数据')}
                                        className={styles['info-icon']}
                                    />
                                </Checkbox>
                                <Checkbox value="download">
                                    {__('下载')}
                                    <InfoOutlined
                                        title={__('可下载数据目录的真实数据')}
                                        className={styles['info-icon']}
                                    />
                                </Checkbox>
                            </Checkbox.Group>
                        </Form.Item>
                        <Form.Item
                            name="visitors"
                            label={__('添加访问者：')}
                            required
                        >
                            <VisitorCard
                                fields={fields}
                                applierId={applierId}
                            />
                        </Form.Item>
                    </Form>
                    {chooseResourceOpen && (
                        <ChooseResource
                            open={chooseResourceOpen}
                            onClose={() => setChooseResourceOpen(false)}
                            getResource={getResource}
                        />
                    )}
                </div>
            </VisitorProvider>
        </Drawer>
    )
}

export default CreateResource
