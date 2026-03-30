import React, { useEffect, useState } from 'react'
import { Modal, Form, Button, Input, Select } from 'antd'
import { noop } from 'lodash'
import { keyboardCharactersReg } from '@/utils'
import { validateName, validateTextLegitimacy } from '@/utils/validate'
import styles from './styles.module.less'
import { formsEdit, formatError } from '@/core'
import __ from './locale'
import { CyclesOptions, DataRangeOptions, FormTableKind } from '../Forms/const'
import { checkNameCorrect } from './helper'
import { TableInfoTitle } from './const'

interface EditFormInfoType {
    open: boolean
    data: any
    left: string
    onUpdateData: (data: any) => void
    onClose: () => void
    graphModel: string
    mid: string
}

const EditFormInfo = ({
    open = false,
    onClose = noop,
    data,
    left = '100px',
    onUpdateData = noop,
    graphModel = 'view',
    mid,
}: EditFormInfoType) => {
    const [form] = Form.useForm()
    const [editStatus, setEditStatus] = useState(false)
    const [dataInfo, setDataInfo] = useState(
        data || { name: '', description: '' },
    )
    const [loading, setLoading] = useState(false)

    const formItemLayout = {
        labelCol: {
            xs: { span: 24 },
            sm: { span: 6 },
        },
        wrapperCol: {
            xs: { span: 24 },
            sm: { span: 18 },
        },
    }
    useEffect(() => {
        setDataInfo(data || { name: '', description: '' })
        form.setFieldsValue(data)
    }, [data, open])

    const onFinish = async (values) => {
        try {
            setLoading(true)
            await formsEdit(mid, data.id, values)
            setEditStatus(false)
            onUpdateData(dataInfo)
            onClose()
        } catch (ex) {
            formatError(ex)
        } finally {
            setLoading(false)
        }
    }
    return (
        <Modal
            title={TableInfoTitle[dataInfo?.table_kind] || '--'}
            open={open}
            width={400}
            style={{
                width: '400px',
                position: 'absolute',
                left,
                top: '52px',
            }}
            bodyStyle={{
                padding: '16px 20px 0px 20px',
            }}
            onCancel={() => {
                setEditStatus(false)
                onClose()
            }}
            mask={false}
            footer={
                // graphModel === 'view' ? null :
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                    }}
                >
                    {editStatus ? (
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                justifyContent: 'space-between',
                            }}
                        >
                            <Button
                                style={{
                                    width: '168px',
                                    height: '36px',
                                }}
                                onClick={() => {
                                    form.resetFields()
                                    setEditStatus(false)
                                    onClose()
                                }}
                            >
                                取消
                            </Button>
                            <Button
                                type="primary"
                                style={{
                                    width: '168px',
                                    height: '36px',
                                }}
                                loading={loading}
                                onClick={() => {
                                    form.submit()
                                }}
                            >
                                确定
                            </Button>
                        </div>
                    ) : (
                        <Button
                            style={{
                                width: '360px',
                                height: '36px',
                            }}
                            onClick={() => {
                                setEditStatus(true)
                                form.resetFields(['name', 'description'])
                            }}
                        >
                            编辑信息
                        </Button>
                    )}
                </div>
            }
        >
            <Form
                form={form}
                // layout="vertical"
                initialValues={dataInfo}
                onValuesChange={(changedFields, allFields) => {
                    setDataInfo(allFields)
                }}
                onFinish={onFinish}
                {...formItemLayout}
                labelAlign="left"
            >
                <Form.Item
                    name="name"
                    label={__('表业务名称')}
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: !!editStatus,
                            validator: validateName(),
                        },
                        {
                            validateTrigger: ['onBlur'],
                            validator: (e, value) => checkNameCorrect(e, value),
                        },
                    ]}
                >
                    {editStatus ? (
                        <Input maxLength={128} />
                    ) : (
                        <div>{dataInfo.name}</div>
                    )}
                </Form.Item>
                <Form.Item
                    label={__('数据范围')}
                    name="data_range"
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: !!editStatus,
                            message: __('请选择数据范围'),
                        },
                    ]}
                >
                    {editStatus ? (
                        <Select
                            placeholder={__('请选择数据范围')}
                            options={DataRangeOptions}
                        />
                    ) : (
                        <div>{dataInfo?.data_range}</div>
                    )}
                </Form.Item>
                <Form.Item
                    label={__('更新周期')}
                    name="update_cycle"
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: !!editStatus,
                            message: __('请选择更新周期'),
                        },
                    ]}
                >
                    {editStatus ? (
                        <Select
                            placeholder={__('请选择更新周期')}
                            options={CyclesOptions}
                        />
                    ) : (
                        <div>{dataInfo?.update_cycle}</div>
                    )}
                </Form.Item>
                <div
                    style={{
                        marginTop: '20px',
                    }}
                >
                    <Form.Item
                        name="description"
                        label="描述"
                        validateFirst
                        rules={[
                            {
                                validator: validateTextLegitimacy(
                                    keyboardCharactersReg,
                                    __(
                                        '仅支持中英文、数字、及键盘上的特殊字符',
                                    ),
                                ),
                            },
                        ]}
                    >
                        {editStatus ? (
                            <Input.TextArea
                                autoSize={false}
                                maxLength={255}
                                style={{
                                    height: '120px',
                                    resize: 'none',
                                }}
                                onKeyDown={(e) => {
                                    if (e.keyCode === 13) {
                                        e.preventDefault()
                                    }
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    maxHeight: '120px',
                                    overflowX: 'auto',
                                    color: dataInfo.description
                                        ? 'rgba(0,0,0,0.85)'
                                        : 'rgba(0,0,0,0.45)',
                                }}
                            >
                                {dataInfo.description
                                    ? dataInfo.description
                                    : __('暂无描述')}
                            </div>
                        )}
                    </Form.Item>
                </div>
            </Form>
        </Modal>
    )
}

export default EditFormInfo
