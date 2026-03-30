import React, { useEffect, useState } from 'react'
import { Modal, Form, Button, Input } from 'antd'
import { noop } from 'lodash'
import { keyboardCharactersReg } from '@/utils'
import { validateName, validateTextLegitimacy } from '@/utils/validate'
import { IAssemblyLineEditParams } from '@/core/apis/assemblyLine/index.d'
import styles from './styles.module.less'
import __ from './locale'
import { checkNameCorrect } from '../FormGraph/helper'
import { ViewModel } from './const'

interface EditGraphInfoType {
    open: boolean
    data: IAssemblyLineEditParams
    left: string
    checkNameRepeat: (value) => Promise<void>
    onUpdateData: (data: IAssemblyLineEditParams) => void
    onClose: () => void
    graphModel: ViewModel
}

const EditMetricInfo = ({
    open = false,
    onClose = noop,
    data,
    left = '100px',
    checkNameRepeat,
    onUpdateData = noop,
    graphModel = ViewModel.ModelView,
}: EditGraphInfoType) => {
    const [form] = Form.useForm()
    const [editStatus, setEditStatus] = useState(false)
    const [dataInfo, setDataInfo] = useState(
        data || { name: '', description: '' },
    )
    useEffect(() => {
        setDataInfo(data || { name: '', description: '' })
        form.resetFields(['name', 'description'])
    }, [data, open])
    return (
        <Modal
            title={__('业务指标模型信息')}
            open={open}
            width={400}
            style={{
                width: '400px',
                position: 'absolute',
                left,
                top: '52px',
            }}
            bodyStyle={{
                padding:
                    graphModel === ViewModel.ModelView
                        ? '16px 20px'
                        : '16px 20px 0px 20px',
            }}
            onCancel={() => {
                setEditStatus(false)
                onClose()
            }}
            mask={false}
            footer={
                graphModel === ViewModel.ModelView ? null : (
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
                                    {__('取消')}
                                </Button>
                                <Button
                                    type="primary"
                                    style={{
                                        width: '168px',
                                        height: '36px',
                                    }}
                                    onClick={async () => {
                                        await form.validateFields()
                                        setEditStatus(false)
                                        onUpdateData(dataInfo)
                                        onClose()
                                    }}
                                >
                                    {__('确定')}
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
                                {__('编辑信息')}
                            </Button>
                        )}
                    </div>
                )
            }
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={dataInfo}
                onValuesChange={(changedFields, allFields) => {
                    setDataInfo(allFields)
                }}
                autoComplete="off"
            >
                <Form.Item
                    name="name"
                    label={__('业务指标模型名称')}
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    required={!!editStatus}
                    rules={[
                        {
                            required: true,
                            message: __('输入不能为空'),
                        },
                        {
                            validateTrigger: ['onBlur'],
                            validator: (e, value) => checkNameRepeat(value),
                        },
                    ]}
                >
                    {editStatus ? (
                        <Input
                            maxLength={128}
                            placeholder={__('请输入业务指标模型名称')}
                        />
                    ) : (
                        <div>{dataInfo.name}</div>
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
                                    '仅支持中英文、数字、及键盘上的特殊字符',
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
                                placeholder={__('请输入描述')}
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
                                    : '暂无描述'}
                            </div>
                        )}
                    </Form.Item>
                </div>
            </Form>
        </Modal>
    )
}

export default EditMetricInfo
