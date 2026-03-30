import { useState, useEffect } from 'react'
import { Form, Input, Modal } from 'antd'
import DetailsLabel from '@/ui/DetailsLabel'
import {
    formatError,
    DCFeedbackItem,
    putFeedbackReply,
    getFeedbackDetail,
} from '@/core'
import { Loader } from '@/ui'
import { basicInfoList, DetailGroupTitle, refreshDetails } from '../helper'
import styles from '../styles.module.less'
import __ from '../locale'

interface IReply {
    open: boolean
    item: any
    onReplySuccess: () => void
    onReplyClose: () => void
}

const Reply = ({ open, item, onReplySuccess, onReplyClose }: IReply) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [basicInfo, setBasicInfo] = useState<DCFeedbackItem>()

    useEffect(() => {
        fetchDetails()
    }, [item])

    // 获取详情
    const fetchDetails = async () => {
        try {
            setLoading(true)
            const res = await getFeedbackDetail(item?.id)
            setBasicInfo(res?.basic_info)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }
    const onFinish = async (values) => {
        try {
            await putFeedbackReply(item?.id, values)
            onReplySuccess()
        } catch (error) {
            formatError(error)
        }
    }

    const handleClickSubmit = async () => {
        try {
            await form.validateFields()
            form.submit()
        } catch (error) {
            // console.log(error)
        }
    }

    return (
        <Modal
            open={open}
            title={__('回复')}
            width="800px"
            destroyOnClose
            onOk={handleClickSubmit}
            onCancel={onReplyClose}
        >
            <div className={styles.replyWrapper}>
                {loading ? (
                    <Loader />
                ) : (
                    <>
                        <DetailGroupTitle title={__('基本信息')} />
                        <DetailsLabel
                            wordBreak
                            detailsList={refreshDetails({
                                detailList: basicInfoList,
                                actualDetails: basicInfo,
                            })}
                            labelWidth="130px"
                            style={{ paddingLeft: 12 }}
                        />
                        <DetailGroupTitle title={__('回复信息')} />
                        <Form
                            name="reply"
                            form={form}
                            layout="vertical"
                            wrapperCol={{ span: 24 }}
                            initialValues={{ remember: true }}
                            onFinish={onFinish}
                            autoComplete="off"
                        >
                            <Form.Item
                                label={__('回复内容')}
                                name="reply_content"
                                rules={[
                                    {
                                        required: true,
                                        message: __('输入不能为空'),
                                    },
                                ]}
                            >
                                <Input.TextArea
                                    style={{
                                        height: 104,
                                        resize: 'none',
                                    }}
                                    maxLength={300}
                                    placeholder={__('请输入')}
                                    showCount
                                />
                            </Form.Item>
                        </Form>
                    </>
                )}
            </div>
        </Modal>
    )
}

export default Reply
