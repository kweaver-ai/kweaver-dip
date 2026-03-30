import { Button, Form, Input, Modal, message } from 'antd'
import { noop } from 'lodash'
import { memo, useEffect, useState } from 'react'
import { formatError, updateDimensionModel } from '@/core'
import { IDimModelItem } from '@/core/apis/indicatorManagement/index.d'
import { validateEmpty } from '@/utils/validate'
import { checkNameRepeat } from './helper'
import __ from './locale'

interface IEditDimensionModel {
    open: boolean
    data?: IDimModelItem
    left: number
    onSure: (data: IDimModelItem) => void
    onClose: () => void
    viewMode: string | undefined
}

/**
 * 画布信息编辑
 * @param open 显示/隐藏
 * @param data 维度模型信息
 * @param left 左侧偏移量
 * @param onSure
 * @param onClose
 */
const EditDimensionModel = ({
    open,
    data,
    left = 100,
    onSure = noop,
    onClose = noop,
    viewMode = 'edit',
}: IEditDimensionModel) => {
    const [form] = Form.useForm()
    const [editStatus, setEditStatus] = useState<boolean>(false)
    const [dataInfo, setDataInfo] = useState(
        data || { name: '', description: '' },
    )

    useEffect(() => {
        if (open) {
            setDataInfo(data || { name: '', description: '' })
            form.resetFields(['name', 'description'])
        }
    }, [data, open])

    // 更新维度模型信息
    const handleUpdateData = async () => {
        try {
            await form.validateFields()
            setEditStatus(false)
            if (data?.id) {
                await updateDimensionModel(data.id, { ...dataInfo })
                message.success(__('编辑成功'))
                onSure({ ...data, ...dataInfo })
            } else {
                onSure({ ...data, ...dataInfo } as any)
            }
        } catch (e) {
            if (e.errorFields) {
                return
            }
            formatError(e)
        }
    }

    return (
        <Modal
            title={__('维度模型信息')}
            open={open}
            width={400}
            style={{
                width: '400px',
                position: 'absolute',
                left: `${left}px`,
                top: '52px',
            }}
            bodyStyle={{
                padding: '16px 20px 10px 20px',
            }}
            onCancel={() => {
                setEditStatus(false)
                onClose()
            }}
            mask={false}
            footer={
                viewMode === 'edit' ? (
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >
                        <div>
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
                                            width: '48%',
                                            height: '100%',
                                        }}
                                        onClick={() => {
                                            form.resetFields()
                                            setEditStatus(false)
                                            onClose()
                                        }}
                                    >
                                        {__('取消')}
                                    </Button>
                                    <Button
                                        type="primary"
                                        style={{
                                            width: '48%',
                                            height: '100%',
                                        }}
                                        onClick={handleUpdateData}
                                    >
                                        {__('确定')}
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                    }}
                                    onClick={() => {
                                        setEditStatus(true)
                                        form.resetFields([
                                            'name',
                                            'description',
                                        ])
                                    }}
                                >
                                    {__('编辑信息')}
                                </Button>
                            )}
                        </div>
                    </div>
                ) : null
            }
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={dataInfo}
                autoComplete="off"
                onValuesChange={(changedFields, allFields) => {
                    setDataInfo({
                        ...allFields,
                    })
                }}
            >
                <Form.Item
                    name="name"
                    label={
                        <span
                            style={{
                                color: editStatus
                                    ? 'rgba(0,0,0,0.85)'
                                    : 'rgba(0,0,0,0.45)',
                            }}
                        >
                            {__('维度模型名称')}
                        </span>
                    }
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: editStatus,
                            validator: validateEmpty(__('输入不能为空')),
                        },
                        {
                            validateTrigger: ['onBlur'],
                            validator: (e, value) =>
                                checkNameRepeat(value, data?.name),
                        },
                    ]}
                >
                    {editStatus ? (
                        <Input
                            placeholder={__('请输入维度模型名称')}
                            maxLength={128}
                        />
                    ) : (
                        <div style={{ color: 'rgba(0,0,0,0.85)' }}>
                            {dataInfo.name}
                        </div>
                    )}
                </Form.Item>
                <div
                    style={{
                        marginTop: '20px',
                    }}
                >
                    <Form.Item
                        name="description"
                        label={
                            <span
                                style={{
                                    color: editStatus
                                        ? 'rgba(0,0,0,0.85)'
                                        : 'rgba(0,0,0,0.45)',
                                }}
                            >
                                {__('描述')}
                            </span>
                        }
                    >
                        {editStatus ? (
                            <Input.TextArea
                                placeholder={__('请输入描述')}
                                autoSize={false}
                                maxLength={300}
                                style={{
                                    height: '120px',
                                    resize: 'none',
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

export default memo(EditDimensionModel)
