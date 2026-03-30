import React, { useState, useEffect } from 'react'
import { Drawer, Rate, Form, Input, Radio, Alert } from 'antd'
import { ExclamationCircleFilled } from '@ant-design/icons'
import DetailsLabel from '@/ui/DetailsLabel'
import {
    DrawerFooter,
    EditGroupTitle,
    customIcons,
    DetailType,
    refreshDetails,
    getConfirmModal,
    operateTypeInfo,
} from '../helper'
import {
    formatError,
    HandleObjectionOperateEnum,
    EvaluationSolvedEnum,
    EvaluationScoreEnum,
    evaluationRaiseObjection,
} from '@/core'
import __ from '../locale'

interface ITransfer {
    open: boolean
    item: any
    onEvaluationSuccess: () => void
    onEvaluationClose: () => void
}

const Evaluation = ({
    item,
    open,
    onEvaluationSuccess,
    onEvaluationClose,
}: ITransfer) => {
    const [details, setDetails] = useState<any[]>([])

    const [form] = Form.useForm()

    useEffect(() => {
        setDetails(item)
    }, [item])

    // 显示评分icon
    const getCharacter = ({ index }) => {
        return customIcons[index + 1]
    }

    const onFinish = async (values) => {
        const newValues = {
            ...values,
            score: values.score.toString(),
        }
        try {
            await evaluationRaiseObjection(item?.id, newValues)
            onEvaluationSuccess()
        } catch (error) {
            formatError(error)
        }
    }

    const handleClickSubmit = async () => {
        try {
            await form.validateFields()
            getConfirmModal({
                title: __('确定提交异议评价吗？'),
                content: __('提交后将无法修改，请确认。'),
                onOk: () => form.submit(),
            })
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <Drawer
            title={__('异议处理结果评价')}
            placement="right"
            open={open}
            width={640}
            onClose={onEvaluationClose}
            maskClosable={false}
            destroyOnClose
            footer={
                <DrawerFooter
                    onClose={onEvaluationClose}
                    onSubmit={handleClickSubmit}
                />
            }
        >
            <Alert
                message={
                    item?.operate && (
                        <>
                            {__('异议处理结果：')}
                            <span
                                style={{
                                    color: operateTypeInfo[item?.operate].color,
                                }}
                            >
                                {operateTypeInfo[item?.operate].text}
                            </span>
                        </>
                    )
                }
                description={__('异议处理意见：${comment}', {
                    comment: item?.comment,
                })}
                type={
                    item?.operate === HandleObjectionOperateEnum.Pass
                        ? 'success'
                        : 'error'
                }
                showIcon
                icon={<ExclamationCircleFilled />}
            />
            <>
                <EditGroupTitle title={__('异议内容')} />
                <DetailsLabel
                    wordBreak
                    detailsList={refreshDetails({
                        type: DetailType.BasicSimple,
                        actualDetails: details,
                    })}
                    labelWidth="130px"
                />
            </>
            <>
                <EditGroupTitle title={__('评价内容')} />
                <Form
                    name="evaluation"
                    form={form}
                    layout="vertical"
                    wrapperCol={{ span: 24 }}
                    onFinish={onFinish}
                    autoComplete="off"
                >
                    <Form.Item
                        label={__('评分')}
                        name="score"
                        rules={[
                            {
                                required: true,
                                message: __('输入不能为空'),
                            },
                        ]}
                    >
                        <Rate
                            character={({ index }) => getCharacter({ index })}
                        />
                    </Form.Item>

                    <Form.Item
                        label={__('问题是否已解决')}
                        name="solved"
                        rules={[
                            {
                                required: true,
                                message: __('输入不能为空'),
                            },
                        ]}
                    >
                        <Radio.Group>
                            <Radio value={EvaluationSolvedEnum.Unsolved}>
                                {__('未解决')}
                            </Radio>
                            <Radio value={EvaluationSolvedEnum.Solved}>
                                {__('已解决')}
                            </Radio>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item
                        label={__('评价内容')}
                        name="content"
                        rules={[
                            {
                                required: true,
                                message: __('输入不能为空'),
                            },
                        ]}
                    >
                        <Input.TextArea
                            style={{
                                height: 120,
                                resize: 'none',
                            }}
                            maxLength={500}
                            placeholder={__('请输入')}
                            showCount
                        />
                    </Form.Item>
                </Form>
            </>
        </Drawer>
    )
}

export default Evaluation
