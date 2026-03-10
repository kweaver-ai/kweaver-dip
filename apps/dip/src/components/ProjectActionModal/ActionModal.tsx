import type { ModalProps } from 'antd'
import { Form, Input, Modal, message } from 'antd'
import { useEffect, useState } from 'react'
import {
  type CreateNodeRequest,
  type ObjectType,
  type Project,
  postApplicationNode,
  postFunctionNode,
  postPageNode,
  postProjects,
  putNode,
  putProjects,
  type UpdateNameDescRequest,
} from '@/apis'
import {
  objectDescPlaceholderMap,
  objectNamePlaceholderMap,
  objectTypeNameMap,
} from '@/pages/ProjectManagement/utils'

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

  /** 操作对象类型 */
  objectType: ObjectType

  /** 项目 ID（新建节点时需要） */
  projectId?: string

  /** 父节点 ID（新建子节点时需要） */
  parentId?: string | null

  /** 项目信息 */
  projectInfo?: Project
}

/** 新建 编辑 弹窗 */
const ActionModal = ({
  open,
  onCancel,
  onSuccess,
  objectInfo,
  operationType,
  objectType,
  projectId,
  parentId,
  projectInfo,
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
    if (operationType === 'add' && projectInfo && objectType === 'application') {
      form.setFieldsValue({
        name: projectInfo.name,
        description: projectInfo.description,
      })
    }
    if (operationType === 'edit' && objectInfo) {
      form.setFieldsValue(objectInfo)
    }
  }, [open, form, objectInfo, operationType, projectId, parentId])

  /** 处理确定按钮点击 */
  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      const name = values.name?.trim() ?? ''
      const description = values.description?.trim()
      const updateParams: UpdateNameDescRequest = { name, description }
      const projectIdNum = projectId ? Number(projectId) : 0
      const parentIdStr = parentId ?? undefined
      setLoading(true)
      let result: any
      if (objectType === 'project') {
        if (operationType === 'add') {
          const projectResult = await postProjects({ name, description })
          await postApplicationNode({
            project_id: projectResult.id,
            name,
            description,
          })
          result = projectResult
        } else if (operationType === 'edit' && objectInfo) {
          result = await putProjects(objectInfo.id, updateParams)
        }
      } else if (objectType === 'application') {
        if (operationType === 'add') {
          const params: CreateNodeRequest = {
            project_id: projectIdNum,
            name,
            description,
          }
          result = await postApplicationNode(params)
        } else if (operationType === 'edit' && objectInfo) {
          result = await putNode(objectInfo.id, updateParams)
        }
      } else if (objectType === 'page') {
        if (operationType === 'add' && parentIdStr != null) {
          const params: CreateNodeRequest = {
            project_id: projectIdNum,
            parent_id: parentIdStr,
            name,
            description,
          }
          result = await postPageNode(params)
        } else if (operationType === 'edit' && objectInfo) {
          result = await putNode(objectInfo.id, updateParams)
        }
      } else if (objectType === 'function') {
        if (operationType === 'add' && parentIdStr != null) {
          const params: CreateNodeRequest = {
            project_id: projectIdNum,
            parent_id: parentIdStr,
            name,
            description,
          }
          result = await postFunctionNode(params)
        } else if (operationType === 'edit' && objectInfo) {
          result = await putNode(objectInfo.id, updateParams)
        }
      }
      messageApi.success(
        `${operationType === 'add' ? '新建' : '编辑'}${objectTypeNameMap(objectType)}成功`,
      )
      onSuccess(result)
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
        messageApi.error(
          `${operationType === 'add' ? '新建' : '编辑'}${objectTypeNameMap(objectType)}失败，请稍后重试`,
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {contextHolder}
      <Modal
        title={`${operationType === 'add' ? '新建' : '编辑'}${objectTypeNameMap(objectType)}`}
        open={open}
        onCancel={onCancel}
        onOk={handleOk}
        confirmLoading={loading}
        closable
        maskClosable={false}
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
            <Input placeholder={objectNamePlaceholderMap(objectType)} maxLength={128} showCount />
          </Form.Item>

          <Form.Item label="描述" name="description">
            <Input.TextArea
              placeholder={objectDescPlaceholderMap(objectType)}
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
