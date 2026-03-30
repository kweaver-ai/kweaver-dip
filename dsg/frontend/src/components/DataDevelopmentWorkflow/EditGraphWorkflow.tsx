import React, { useContext, useEffect, useState } from 'react'
import { Modal, Form, Button, Input, message } from 'antd'
import { noop, trim } from 'lodash'
import { ISceneItem, editWorkFlow, formatError } from '@/core'
import __ from './locale'
import { ErrorInfo, keyboardCharactersReg } from '@/utils'
import { checkNameRepeat } from './helper'
import { validateName, validateTextLegitimacy } from '@/utils/validate'
import { useTaskCheck } from '@/hooks/useTaskCheck'
import { TaskInfoContext } from '@/context'
import { OperateType, products, totalOperates } from './const'

interface IEditGraphWorkflow {
    open: boolean
    data?: any
    left: number
    taskId?: string
    onSure: (data: ISceneItem) => void
    onClose: () => void
}

/**
 * 画布信息编辑
 * @param open 显示/隐藏
 * @param data 信息
 * @param left 左侧偏移量
 * @param onSure
 * @param onClose
 */
const EditGraphWorkflow = ({
    open,
    data,
    left = 100,
    taskId,
    onSure = noop,
    onClose = noop,
}: IEditGraphWorkflow) => {
    const { taskInfo } = useContext(TaskInfoContext)
    const { checkTask } = useTaskCheck(totalOperates, products, taskInfo)

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
    }, [open])

    // 更新信息
    const handleUpdateData = async () => {
        try {
            await form.validateFields()
            setEditStatus(false)
            if (data?.id) {
                await editWorkFlow(data.id, { ...dataInfo, task_id: taskId })
                message.success(__('编辑成功'))
            }
            onSure({ ...dataInfo })
        } catch (e) {
            if (e.errorFields) {
                return
            }
            formatError(e)
        }
    }

    return (
        <Modal
            title={__('工作流信息')}
            open={open}
            width={400}
            style={{
                width: '400px',
                position: 'absolute',
                left: `${left}px`,
                top: '52px',
            }}
            bodyStyle={{
                padding: checkTask(OperateType.EDIT)
                    ? '16px 20px 0px 20px'
                    : '16px 20px',
            }}
            onCancel={() => {
                setEditStatus(false)
                onClose()
            }}
            mask={false}
            footer={
                checkTask(OperateType.EDIT) ? (
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
                                    form.resetFields(['name', 'description'])
                                }}
                            >
                                {__('编辑信息')}
                            </Button>
                        )}
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
                            {__('工作流名称')}
                        </span>
                    }
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: editStatus,
                            validateTrigger: ['onChange', 'onBlur'],
                            validator: validateName(),
                        },
                        {
                            validateTrigger: ['onBlur'],
                            validator: (e, value) =>
                                checkNameRepeat(value, data?.name, data?.id),
                        },
                    ]}
                >
                    {editStatus ? (
                        <Input
                            placeholder={__('请输入工作流名称')}
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
                                // onKeyDown={(e) => {
                                //     if (e.keyCode === 13) {
                                //         e.preventDefault()
                                //     }
                                // }}
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

export default EditGraphWorkflow
