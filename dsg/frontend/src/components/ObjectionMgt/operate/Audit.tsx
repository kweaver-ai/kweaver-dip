import { useState, useEffect } from 'react'
import { Drawer, Form, Input, Radio } from 'antd'
import DetailsLabel from '@/ui/DetailsLabel'
import { getAuditDetails, putDocAudit, formatError } from '@/core'
import {
    DrawerFooter,
    getConfirmModal,
    DetailGroupTitle,
    refreshDetails,
    DetailType,
} from '../helper'
import AuditDetails from '../detail/AuditDetails'
import __ from '../locale'

interface IAudit {
    open: boolean
    item: any
    onAuditSuccess: () => void
    onAuditClose: () => void
}

const Audit = ({ open, item, onAuditSuccess, onAuditClose }: IAudit) => {
    const [form] = Form.useForm()
    const [details, setDetails] = useState<any[]>([])
    const [detailsVisible, setDetailsVisible] = useState(false)

    useEffect(() => {
        setDetails(item)
    }, [item])

    const onFinish = async (values) => {
        const { audit_idea, audit_msg } = values
        try {
            const res = await getAuditDetails(item?.proc_inst_id)
            await putDocAudit({
                id: item?.proc_inst_id,
                task_id: res?.task_id,
                audit_idea,
                audit_msg,
                attachments: [],
            })
            onAuditSuccess()
        } catch (e) {
            formatError(e)
        }
    }

    const handleClickSubmit = async () => {
        try {
            await form.validateFields()
            const audit_idea = form.getFieldValue('audit_idea')
            getConfirmModal({
                title: audit_idea
                    ? __('确定同意异议处理结果吗？')
                    : __('确定拒绝异议处理结果吗？'),
                content: audit_idea
                    ? __('同意后异议申请将上报到省平台')
                    : __('拒绝后异议申请将无法上报到省平台'),
                onOk: () => form.submit(),
            })
        } catch (error) {
            // console.log(error)
        }
    }

    const handleViewAll = () => {
        setDetailsVisible(true)
    }

    return (
        <>
            <Drawer
                title={__('数据异议审核')}
                placement="right"
                onClose={onAuditClose}
                open={open}
                width={640}
                maskClosable={false}
                footer={
                    <DrawerFooter
                        onClose={onAuditClose}
                        onSubmit={handleClickSubmit}
                    />
                }
            >
                <>
                    <DetailGroupTitle title={__('提出的异议')} />
                    <DetailsLabel
                        wordBreak
                        detailsList={refreshDetails({
                            type: DetailType.Audit,
                            actualDetails: details,
                            onClickShowAll: handleViewAll,
                        })}
                        labelWidth="130px"
                        style={{ paddingLeft: 12 }}
                    />
                </>
                <>
                    <DetailGroupTitle title={__('数据异议审核')} />
                    <Form
                        name="reviewe"
                        form={form}
                        layout="vertical"
                        wrapperCol={{ span: 24 }}
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        autoComplete="off"
                    >
                        <Form.Item
                            label={__('审核意见')}
                            name="audit_idea"
                            initialValue={1}
                            rules={[
                                {
                                    required: true,
                                    message: __('输入不能为空'),
                                },
                            ]}
                        >
                            <Radio.Group>
                                <Radio value>{__('同意')}</Radio>
                                <Radio value={false}>{__('拒绝')}</Radio>
                            </Radio.Group>
                        </Form.Item>

                        <Form.Item label={__('备注')} name="audit_msg">
                            <Input.TextArea
                                style={{
                                    height: 100,
                                    resize: 'none',
                                }}
                                maxLength={255}
                                placeholder={__('请输入')}
                                showCount
                            />
                        </Form.Item>
                    </Form>
                </>
            </Drawer>
            {detailsVisible ? (
                <AuditDetails
                    open={detailsVisible}
                    item={item}
                    onCancel={() => setDetailsVisible(false)}
                />
            ) : null}
        </>
    )
}

export default Audit
