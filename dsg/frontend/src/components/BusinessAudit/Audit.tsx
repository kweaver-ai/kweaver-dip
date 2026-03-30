import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Drawer, Form, Input, Radio } from 'antd'
import DetailsLabel from '@/ui/DetailsLabel'
import {
    getAuditDetails,
    putDocAudit,
    formatError,
    BusinessAuditType,
} from '@/core'
import { getActualUrl } from '@/utils/browser'
import Details from '../BusiArchitecture/Details'
import {
    DrawerFooter,
    DetailGroupTitle,
    refreshDetails,
    AuditTypeMap,
} from './helper'
import __ from './locale'
import styles from './styles.module.less'

interface IAudit {
    open: boolean
    item: any
    auditType: BusinessAuditType
    onAuditSuccess: () => void
    onAuditClose: () => void
}

const Audit = ({
    open,
    item,
    auditType,
    onAuditSuccess,
    onAuditClose,
}: IAudit) => {
    const [form] = Form.useForm()
    const [detailsVisible, setDetailsVisible] = useState(false)
    const navigate = useNavigate()

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
            form.submit()
        } catch (error) {
            // console.log(error)
        }
    }

    const handleShowAll = () => {
        switch (auditType) {
            case BusinessAuditType.BusinessAreaPublish:
            case BusinessAuditType.MainBusinessPublish:
                setDetailsVisible(true)
                break
            case BusinessAuditType.BusinessDiagnosisPublish:
                navigate(
                    `/business/diagnosis/details?id=${
                        item.id
                    }&backUrl=${encodeURIComponent(
                        `/business/diagnosisAudit`,
                    )}`,
                )
                break

            case BusinessAuditType.BusinessModelPublish:
                navigate(`/${'coreBusiness'}/${item.id}?auditMode=true`)
                break
            case BusinessAuditType.DataModelPublish:
                navigate(`/${'coreData'}/${item.id}?auditMode=true`)
                break
            default:
                break
        }
    }

    return (
        <>
            <Drawer
                title={AuditTypeMap[auditType]?.title}
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
                    <DetailGroupTitle title={__('基本信息')} />
                    <DetailsLabel
                        wordBreak
                        detailsList={refreshDetails({
                            auditType,
                            actualDetails: item,
                            onClickShowAll: handleShowAll,
                        })}
                        labelWidth="130px"
                        style={{ paddingLeft: 12 }}
                    />
                </>
                <>
                    <DetailGroupTitle title={__('审核信息')} />
                    <Form
                        name="reviewe"
                        form={form}
                        layout="vertical"
                        wrapperCol={{ span: 24 }}
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        autoComplete="off"
                        className={styles.auditForm}
                    >
                        <Form.Item
                            label={__('审核意见')}
                            name="audit_idea"
                            initialValue
                            rules={[
                                {
                                    required: true,
                                    message: __('输入不能为空'),
                                },
                            ]}
                        >
                            <Radio.Group>
                                <Radio value>{__('通过')}</Radio>
                                <Radio value={false}>{__('驳回')}</Radio>
                            </Radio.Group>
                        </Form.Item>

                        <Form.Item name="audit_msg">
                            <Input.TextArea
                                style={{
                                    height: 100,
                                    resize: 'none',
                                }}
                                maxLength={300}
                                placeholder={__('请输入')}
                                showCount
                            />
                        </Form.Item>
                    </Form>
                </>
            </Drawer>
            {detailsVisible && (
                <Details
                    open={detailsVisible}
                    data={item}
                    isAudit
                    onClose={() => setDetailsVisible(false)}
                />
            )}
        </>
    )
}

export default Audit
