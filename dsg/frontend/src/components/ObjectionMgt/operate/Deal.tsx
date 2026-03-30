import { useState, useEffect } from 'react'
import { Drawer, Form, Input, Radio } from 'antd'
import DetailsLabel from '@/ui/DetailsLabel'
import {
    HandleObjectionOperateEnum,
    handleObjection,
    formatError,
} from '@/core'
import {
    DrawerFooter,
    getConfirmModal,
    EditGroupTitle,
    refreshDetails,
    DetailType,
} from '../helper'
import __ from '../locale'

interface IDeal {
    open: boolean
    item: any
    onDealSuccess: () => void
    onDealClose: () => void
}

const Deal = ({ open, item, onDealSuccess, onDealClose }: IDeal) => {
    const [form] = Form.useForm()
    const [details, setDetails] = useState<any[]>([])

    useEffect(() => {
        setDetails(item)
    }, [item])

    const onFinish = async (values) => {
        try {
            await handleObjection(item?.id, values)
            onDealSuccess()
        } catch (error) {
            formatError(error)
        }
    }

    const handleClickSubmit = async () => {
        try {
            await form.validateFields()
            getConfirmModal({
                title: __('确定提交异议处理结果吗？'),
                content: __('提交后将无法修改，请确认。'),
                onOk: () => form.submit(),
            })
        } catch (error) {
            // console.log(error)
        }
    }

    return (
        <Drawer
            title={__('处理${title}异议标题', {
                title: item.objection_title,
            })}
            placement="right"
            onClose={onDealClose}
            open={open}
            width={640}
            maskClosable={false}
            destroyOnClose
            footer={
                <DrawerFooter
                    onClose={onDealClose}
                    onSubmit={handleClickSubmit}
                />
            }
        >
            <EditGroupTitle title={__('异议内容')} />
            <DetailsLabel
                wordBreak
                detailsList={refreshDetails({
                    type: DetailType.BasicSimple,
                    actualDetails: details,
                })}
                labelWidth="130px"
                style={{ paddingLeft: 12 }}
            />
            <EditGroupTitle title={__('处理异议')} />
            <Form
                name="audit"
                form={form}
                layout="vertical"
                wrapperCol={{ span: 24 }}
                initialValues={{ remember: true }}
                onFinish={onFinish}
                autoComplete="off"
            >
                <Form.Item
                    label={__('处理结果')}
                    name="operate"
                    initialValue={HandleObjectionOperateEnum.Pass}
                    rules={[
                        {
                            required: true,
                            message: __('输入不能为空'),
                        },
                    ]}
                >
                    <Radio.Group>
                        <Radio value={HandleObjectionOperateEnum.Pass}>
                            {__('通过')}
                        </Radio>
                        <Radio value={HandleObjectionOperateEnum.Reject}>
                            {__('驳回')}
                        </Radio>
                    </Radio.Group>
                </Form.Item>

                <Form.Item
                    label={__('处理意见')}
                    name="comment"
                    rules={[
                        {
                            required: true,
                            message: __('输入不能为空'),
                        },
                    ]}
                >
                    <Input.TextArea
                        style={{
                            height: 64,
                            resize: 'none',
                        }}
                        maxLength={100}
                        placeholder={__('请输入')}
                        showCount
                    />
                </Form.Item>
            </Form>
        </Drawer>
    )
}

export default Deal
