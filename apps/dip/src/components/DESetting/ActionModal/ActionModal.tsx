import type { ModalProps } from 'antd'
import { Form, Input, Modal, message } from 'antd'
import { useEffect, useState } from 'react'
import { type Employee, postFunctionNode, putNode, type UpdateNameDescRequest } from '@/apis'

export interface ActionModalProps extends Pick<ModalProps, 'open' | 'onCancel'> {
  /** 新建成功的回调，传递信息 */
  onSuccess: (result: any) => void

  /** 要编辑的对象信息 */
  objectInfo?: {
    id: string | number
    name: string
    description?: string
  }

  /** 操作类型 */
  operationType: 'add' | 'edit'

  /** 数字员工信息 */
  employeeInfo?: Employee
}

/** 新建 编辑 弹窗 */
const ActionModal = ({
  open,
  onCancel,
  onSuccess,
  objectInfo,
  operationType,
  employeeInfo,
}: ActionModalProps) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  // 使用 Form.useWatch 监听 name 字段变化
  const nameValue = Form.useWatch('name', form)
  const canSubmit = !!nameValue

  // 当弹窗关闭时重置表单
  useEffect(() => {
    if (open) {
      form.resetFields()
      setLoading(false)
    }
    if (operationType === 'add' && employeeInfo) {
      form.setFieldsValue({
        name: employeeInfo.name,
        description: employeeInfo.description,
      })
    }
    if (operationType === 'edit' && objectInfo) {
      form.setFieldsValue(objectInfo)
    }
  }, [open, form, objectInfo, operationType, employeeInfo])

  /** 处理确定按钮点击 */
  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      const name = values.name?.trim() ?? ''
      const description = values.description?.trim()
      const updateParams: UpdateNameDescRequest = { name, description }
      setLoading(true)
      let result: any
      // if (operationType === 'add') {
      //   const params: any = {
      //     name,
      //     description,
      //   }
      //   result = await postFunctionNode(params)
      // } else if (operationType === 'edit' && objectInfo) {
      //   result = await putNode(objectInfo.id, updateParams)
      // }
      // messageApi.success(`${operationType === 'add' ? '新建' : '编辑'}数字员工成功`)
      // onSuccess(result)
      onSuccess({
        id: 1,
        name: name,
        description: description,
      })
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
        messageApi.error(`${operationType === 'add' ? '新建' : '编辑'}数字员工失败，请稍后重试`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {contextHolder}
      <Modal
        title={`${operationType === 'add' ? '新建' : '编辑'}数字员工`}
        open={open}
        onCancel={onCancel}
        onOk={handleOk}
        confirmLoading={loading}
        closable
        mask={{ closable: false }}
        destroyOnHidden
        width={520}
        okText="确定"
        cancelText="取消"
        okButtonProps={{ loading: loading, disabled: !canSubmit }}
        footer={(_, { OkBtn, CancelBtn }) => (
          <>
            <OkBtn />
            <CancelBtn />
          </>
        )}
      >
        <Form form={form} layout="vertical" className="mt-4 mb-10">
          <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入数字员工名称" maxLength={128} showCount />
          </Form.Item>

          <Form.Item label="简介" name="description">
            <Input.TextArea
              placeholder="一句话介绍数字员工擅长做的事情，方便团队快速理解和选择使用"
              rows={4}
              maxLength={400}
              showCount
              autoSize={{ minRows: 5, maxRows: 5 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default ActionModal
