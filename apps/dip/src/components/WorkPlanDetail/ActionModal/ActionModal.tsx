import type { ModalProps } from 'antd'
import { Form, Input, Modal, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { type CronJob, updateCronJob } from '@/apis/dip-studio/plan'

interface EditPlanFormValues {
  name: string
  enabled: boolean
}

export interface ActionModalProps extends Pick<ModalProps, 'open' | 'onCancel'> {
  plan?: CronJob
  onSuccess: (plan: CronJob) => void
}

const ActionModal = ({ open, onCancel, onSuccess, plan }: ActionModalProps) => {
  const [form] = Form.useForm<EditPlanFormValues>()
  const [loading, setLoading] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  const nameValue = Form.useWatch('name', form)
  const canSubmit = useMemo(() => Boolean(nameValue?.trim()), [nameValue])
  const submitDisabled = useMemo(() => {
    if (!plan) return true
    return !canSubmit
  }, [plan, canSubmit])

  useEffect(() => {
    if (!open) return
    setLoading(false)
    form.setFieldsValue({
      name: plan?.name ?? '',
      enabled: plan?.enabled ?? true,
    })
  }, [open, form, plan])

  const handleOk = async () => {
    if (!plan) return
    try {
      const values = await form.validateFields()
      const payload = {
        name: values.name.trim(),
        enabled: values.enabled,
      }
      setLoading(true)
      const updatedPlan = await updateCronJob(plan.id, payload)
      messageApi.success('编辑计划成功')
      onSuccess(updatedPlan)
      onCancel?.(undefined as never)
    } catch (error: any) {
      if (error?.errorFields) {
        return
      }
      if (error?.description) {
        messageApi.error(error.description)
      } else {
        messageApi.error('编辑计划失败，请稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {contextHolder}
      <Modal
        title="编辑计划"
        open={open}
        onCancel={onCancel}
        onOk={handleOk}
        closable
        mask={{ closable: false }}
        destroyOnHidden
        width={520}
        okText="确定"
        cancelText="取消"
        confirmLoading={loading}
        okButtonProps={{ loading, disabled: submitDisabled }}
        footer={(_, { OkBtn, CancelBtn }) => (
          <>
            <OkBtn />
            <CancelBtn />
          </>
        )}
      >
        <Form
          form={form}
          layout="vertical"
          className="mt-4 mb-10"
          initialValues={{ enabled: true }}
        >
          <Form.Item
            label="计划名称"
            name="name"
            rules={[{ required: true, whitespace: true, message: '请输入计划名称' }]}
          >
            <Input placeholder="请输入计划名称" maxLength={128} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default ActionModal
