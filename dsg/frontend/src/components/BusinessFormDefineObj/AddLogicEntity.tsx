import { Form, Input, message, Modal } from 'antd'
import React, { useEffect, useState } from 'react'
import { trim } from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { ErrorInfo, getPlatformNumber, nameReg, OperateType } from '@/utils'
import __ from './locale'
import styles from './styles.module.less'
import { LoginEntity, LoginPlatform } from '@/core'

interface IAddLogicEntity {
    open: boolean
    onClose: () => void
    onSuccess?: (logicEntity: LoginEntity) => void
    formName: string
    operateType?: OperateType
    editEntity?: LoginEntity
    allLogicEntity?: LoginEntity[]
}

const AddLogicEntity: React.FC<IAddLogicEntity> = ({
    open,
    onClose,
    onSuccess,
    formName,
    operateType = OperateType.CREATE,
    editEntity,
    allLogicEntity,
}) => {
    const [form] = Form.useForm()
    const platformNumber = getPlatformNumber()

    useEffect(() => {
        if (!open) {
            form.resetFields()
        } else {
            if (OperateType.CREATE === operateType) {
                form.setFieldsValue({ name: formName })
            }
            if (OperateType.EDIT === operateType && editEntity) {
                form.setFieldsValue({ name: editEntity.name })
            }
        }
    }, [open])

    const onFinish = (values) => {
        onSuccess?.(
            operateType === OperateType.CREATE
                ? { ...values, id: uuidv4() }
                : { ...editEntity, ...values },
        )
        message.success(
            __(
                operateType === OperateType.CREATE
                    ? __('添加成功')
                    : __('编辑成功'),
            ),
        )
        onClose()
    }

    const validateNameRepeat = (value: string) => {
        const res = allLogicEntity
            ?.filter((item) => item.id !== editEntity?.id)
            .find((item) => item.name === trim(value))
        if (res) {
            return Promise.reject(
                new Error(
                    platformNumber === LoginPlatform.default
                        ? __('逻辑实体名称在业务对象/活动中重复，请重新输入')
                        : __('逻辑实体名称在业务对象中重复，请重新输入'),
                ),
            )
        }
        return Promise.resolve()
    }
    return (
        <Modal
            title={
                OperateType.EDIT === operateType
                    ? __('编辑逻辑实体')
                    : __('添加逻辑实体')
            }
            width={640}
            bodyStyle={{ height: 204, paddingTop: 60 }}
            open={open}
            onCancel={onClose}
            onOk={() => form.submit()}
        >
            <Form
                layout="vertical"
                autoComplete="off"
                form={form}
                onFinish={onFinish}
            >
                <Form.Item
                    label={__('逻辑实体名称')}
                    name="name"
                    rules={[
                        {
                            required: true,
                            message: __('输入不能为空'),
                        },
                        // {
                        //     pattern: nameReg,
                        //     message: ErrorInfo.ONLYSUP,
                        //     transform: (val) => trim(val),
                        // },
                        {
                            validator: (e, value) => validateNameRepeat(value),
                        },
                    ]}
                >
                    <Input
                        placeholder={__('请输入逻辑实体名称')}
                        maxLength={128}
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default AddLogicEntity
