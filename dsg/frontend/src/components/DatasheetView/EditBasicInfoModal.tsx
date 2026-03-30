import { Form, Modal, message } from 'antd'
import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { omit } from 'lodash'
import { useDebounceFn } from 'ahooks'
import { formatError, editDataViewBaseInfo, LogicViewType } from '../../core'
import EditBasicInfoForm from './EditBasicInfoForm'
import { IEditFormData, VIEWERRORCODElIST } from './const'
import __ from './locale'
import styles from './styles.module.less'

interface IEditBasicInfoModal {
    open: boolean
    onClose: () => void
    onOk: (ownerId?: string, values?: any) => void
    formData?: IEditFormData
    logic?: LogicViewType
}

const EditBasicInfoModal: React.FC<IEditBasicInfoModal> = ({
    open,
    onClose,
    onOk,
    formData,
    logic = LogicViewType.DataSource,
}) => {
    const [form] = Form.useForm()
    const { pathname } = useLocation()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open) {
            if (formData) {
                form.setFieldsValue(formData)
            }
            message.info(
                <span>
                    {__('请先完善库表的更多信息（有必填')}
                    <span style={{ color: '#e60012', margin: '0 4px' }}>*</span>
                    {__('信息未填）')}
                </span>,
            )
        } else {
            form.resetFields()
        }
    }, [open, formData])

    const onFinish = async () => {
        try {
            // if (!values.owner_id) {
            //     message.info(__('请先完善库表的更多信息（有必填信息未填）'))
            //     return
            // }
            setLoading(true)
            await form.validateFields()
            const values = form.getFieldsValue()
            let data = {
                ...values,
                form_view_id: formData?.id,
            }
            if (pathname === '/datasheet-view/graph') {
                onOk(values.owner_id, data)
            } else {
                if (logic === LogicViewType.LogicEntity) {
                    data = omit(data, 'subject_id')
                } else if (logic === LogicViewType.DataSource) {
                    data = omit(data, 'technical_name')
                }
                await editDataViewBaseInfo(data)
                onOk(values.owner_id)
            }
        } catch (error) {
            setLoading(false)
            if (error.errorFields) {
                return
            }
            if (error?.data?.code === VIEWERRORCODElIST.VIEWSQLERRCODE) {
                message.error(
                    __('当前库表中引用的库表被删除，您可编辑后重新发布'),
                )
            } else {
                formatError(error)
            }
        } finally {
            setLoading(false)
        }
    }

    const { run } = useDebounceFn(onFinish, {
        wait: 1000,
        leading: true,
        trailing: false,
    })

    return (
        <div>
            <Modal
                title={__('发布库表需要完善更多信息')}
                width={640}
                open={open}
                onCancel={onClose}
                className={styles.editBasicInfoWrapper}
                maskClosable={false}
                okText={__('完成')}
                onOk={() => run()}
                okButtonProps={{ loading }}
            >
                <EditBasicInfoForm form={form} logic={logic} />
            </Modal>
        </div>
    )
}

export default EditBasicInfoModal
