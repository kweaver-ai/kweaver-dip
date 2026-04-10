import { ExclamationCircleFilled } from '@ant-design/icons'
import type { ModalProps } from 'antd'
import { Form, Input, Modal, message } from 'antd'
import { useEffect, useState } from 'react'
import intl from 'react-intl-universal'
import { deleteDigitalHuman } from '@/apis'

/** 翻译文案中用于插入高亮名称的占位符，其它语言翻译时请保留此标记 */
const DELETE_CONFIRM_NAME_TOKEN = '__DH_NAME__'

export interface DeleteModalProps extends Omit<ModalProps, 'onOk'> {
  /** 要删除的信息 */
  deleteData?: any
  /** 删除成功的回调 */
  onOk: (item: any) => void
}

/** 删除弹窗 */
const DeleteModal = ({ open, onCancel, deleteData, onOk }: DeleteModalProps) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  // 当弹窗关闭时重置表单
  useEffect(() => {
    if (open) {
      form.resetFields()
      setLoading(false)
    }
  }, [open, form])

  /** 处理确定按钮点击 */
  const handleOk = async () => {
    if (!deleteData) {
      return
    }

    try {
      await form.validateFields()
      setLoading(true)
      await deleteDigitalHuman(deleteData.id)
      messageApi.success(intl.get('digitalHuman.management.deleteSuccess'))
      onOk(deleteData)
      onCancel?.(undefined as any)
    } catch (err: any) {
      // 表单验证失败时不显示错误消息
      if (err?.errorFields) {
        return
      }
      // API 请求失败时显示错误消息并停留
      if (err?.description) {
        messageApi.error(err.description)
      } else {
        messageApi.error(intl.get('digitalHuman.management.deleteFailed'))
      }
    } finally {
      setLoading(false)
    }
  }

  const renderDeleteConfirmBody = () => {
    const template = intl.get('digitalHuman.management.deleteConfirmBody')
    const parts = template.split(DELETE_CONFIRM_NAME_TOKEN)
    if (parts.length !== 2) {
      return template.replace(DELETE_CONFIRM_NAME_TOKEN, deleteData?.name ?? '')
    }
    return (
      <>
        {parts[0]}
        <span className="font-medium text-[--dip-link-color] bg-[--dip-hover-bg-color-4] px-1 py-0.5 rounded-md">
          {deleteData?.name}
        </span>
        {parts[1]}
      </>
    )
  }

  return (
    <>
      {contextHolder}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <ExclamationCircleFilled className="text-[24px] text-[--dip-warning-color]" />
            {intl.get('digitalHuman.management.deleteModalTitle')}
          </div>
        }
        open={open && !!deleteData}
        onCancel={onCancel}
        onOk={handleOk}
        confirmLoading={loading}
        closable={false}
        mask={{ closable: false }}
        destroyOnHidden
        width={424}
        okText={intl.get('digitalHuman.management.deleteOk')}
        cancelText={intl.get('digitalHuman.management.deleteCancel')}
        okButtonProps={{ danger: true }}
        footer={(_, { OkBtn, CancelBtn }) => (
          <>
            <OkBtn />
            <CancelBtn />
          </>
        )}
        styles={{ body: { padding: '0 0 0 36px' } }}
      >
        <div className="mt-4">
          <div className="mb-4">{renderDeleteConfirmBody()}</div>
          <Form form={form} layout="vertical">
            <Form.Item
              label={intl.get('digitalHuman.management.deleteNameLabel')}
              name="projectName"
              rules={[
                {
                  validateTrigger: 'onBlur',
                  validator: (_rule, value, callback) => {
                    if (!value) {
                      callback(intl.get('digitalHuman.management.validateNameRequired'))
                      return
                    }
                    if (value !== deleteData?.name) {
                      callback(intl.get('digitalHuman.management.validateNameMismatch'))
                    }
                    callback()
                  },
                },
                {},
              ]}
            >
              <Input placeholder={intl.get('digitalHuman.management.deleteNamePlaceholder')} />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </>
  )
}

export default DeleteModal
