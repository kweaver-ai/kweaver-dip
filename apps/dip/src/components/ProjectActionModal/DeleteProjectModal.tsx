import { ExclamationCircleFilled } from '@ant-design/icons'
import type { ModalProps } from 'antd'
import { Form, Input, Modal, message } from 'antd'
import { useEffect, useState } from 'react'
import { deleteProjects, type Project } from '@/apis'

export interface DeleteProjectModalProps extends Pick<ModalProps, 'open' | 'onCancel'> {
  /** 要删除的项目信息 */
  project?: Project
  /** 删除成功的回调 */
  onSuccess: () => void
}

/** 删除项目弹窗 */
const DeleteProjectModal = ({ open, onCancel, project, onSuccess }: DeleteProjectModalProps) => {
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
    if (!project) {
      return
    }

    try {
      await form.validateFields()
      setLoading(true)
      await deleteProjects(String(project.id))
      messageApi.success('删除项目成功')
      onSuccess()
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
        messageApi.error('删除项目失败，请稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {contextHolder}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <ExclamationCircleFilled className="text-[24px] text-[--dip-warning-color]" />
            确认删除项目
          </div>
        }
        open={open && !!project}
        onCancel={onCancel}
        onOk={handleOk}
        confirmLoading={loading}
        closable={false}
        maskClosable={false}
        destroyOnHidden
        width={424}
        okText="删除"
        cancelText="取消"
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
          <div className="mb-4">
            您确认要删除项目{' '}
            <span className="font-medium text-[--dip-link-color] bg-[--dip-hover-bg-color-4] px-1 py-0.5 rounded-md">
              {project?.name}
            </span>{' '}
            吗？删除后，该项目下的所有页面、功能和项目词典将被永久删除，此操作无法撤销。{' '}
          </div>
          <Form form={form} layout="vertical">
            <Form.Item
              label="请输入项目名称以确认删除："
              name="projectName"
              rules={[
                {
                  validateTrigger: 'onBlur',
                  validator: (_rule, value, callback) => {
                    if (!value) {
                      callback('请输入项目名称')
                      return
                    }
                    if (value !== project?.name) {
                      callback('输入的项目名称不匹配')
                    }
                    callback()
                  },
                },
                {},
              ]}
            >
              <Input placeholder="请输入项目名称" />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </>
  )
}

export default DeleteProjectModal
