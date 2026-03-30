import React, { useEffect, useState } from 'react'
import { Modal, Form, Button, Input, message } from 'antd'
import { noop } from 'lodash'
import { useNavigate } from 'react-router-dom'
import { validateEmpty } from '@/utils/validate'
import { ISceneItem, editSceneAnalysis } from '@/core'
import __ from './locale'
import { checkNameRepeat, sceneAnalFormatError } from './helper'
import { ModuleType } from './const'

interface IEditGraphScene {
    open: boolean
    data?: ISceneItem
    left: number
    onSure: (data: ISceneItem) => void
    onClose: () => void
}

/**
 * 画布信息编辑
 * @param open 显示/隐藏
 * @param data 场景信息
 * @param left 左侧偏移量
 * @param onSure
 * @param onClose
 */
const EditGraphScene = ({
    open,
    data,
    left = 100,
    onSure = noop,
    onClose = noop,
}: IEditGraphScene) => {
    const [form] = Form.useForm()
    const [editStatus, setEditStatus] = useState<boolean>(false)
    const [dataInfo, setDataInfo] = useState(data || { name: '', desc: '' })
    const navigator = useNavigate()

    useEffect(() => {
        setDataInfo(data || { name: '', desc: '' })
        form.resetFields(['name', 'desc'])
    }, [data, open])

    // 更新场景分析信息
    const handleUpdateData = async () => {
        try {
            await form.validateFields()
            setEditStatus(false)
            if (data?.id) {
                await editSceneAnalysis({ id: data.id, ...dataInfo })
                message.success(__('编辑成功'))
                // setEditStatus(false)
                onSure({ ...data, ...dataInfo })
            }
        } catch (e) {
            if (e.errorFields) {
                return
            }
            sceneAnalFormatError(ModuleType.SceneAnalysis, navigator, e)
        }
    }

    return (
        <Modal
            title={__('场景分析信息')}
            open={open}
            width={400}
            style={{
                width: '400px',
                position: 'absolute',
                left: `${left}px`,
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
                                form.resetFields(['name', 'desc'])
                            }}
                        >
                            {__('编辑信息')}
                        </Button>
                    )}
                </div>
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
                            {__('场景分析名称')}
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
                                checkNameRepeat(value, data?.name, data?.id),
                        },
                    ]}
                >
                    {editStatus ? (
                        <Input
                            placeholder={__('请输入场景分析名称')}
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
                        name="desc"
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
                                    color: dataInfo.desc
                                        ? 'rgba(0,0,0,0.85)'
                                        : 'rgba(0,0,0,0.45)',
                                }}
                            >
                                {dataInfo.desc ? dataInfo.desc : __('暂无描述')}
                            </div>
                        )}
                    </Form.Item>
                </div>
            </Form>
        </Modal>
    )
}

export default EditGraphScene
