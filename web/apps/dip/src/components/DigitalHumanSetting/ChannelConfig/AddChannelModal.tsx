import type { ModalProps } from 'antd'
import { Button, Form, Input, Modal, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import type { ChannelConfig, ChannelType } from '@/apis/dip-studio/digital-human'
import DingDingIcon from '@/assets/icons/dingding.svg'
import FeiShuIcon from '@/assets/icons/feishu.svg'

export interface AddChannelModalProps extends Omit<ModalProps, 'onCancel' | 'onOk'> {
  /** 确定成功的回调，传递通道配置 */
  onOk: (result: ChannelConfig) => void
  /** 取消回调 */
  onCancel: () => void
}

const CHANNEL_OPTIONS: Array<{
  type: ChannelType
  name: string
  configTitle: string
  icon: string
}> = [
  { type: 'feishu', name: '飞书机器人', configTitle: '飞书机器人配置', icon: FeiShuIcon },
  { type: 'dingtalk', name: '钉钉机器人', configTitle: '钉钉机器人配置', icon: DingDingIcon },
]

/** 添加通道弹窗 */
const AddChannelModal = ({ open, onOk, onCancel }: AddChannelModalProps) => {
  const [form] = Form.useForm()
  const [selectedType, setSelectedType] = useState<ChannelType>('feishu')
  const [, messageContextHolder] = message.useMessage()

  const selectedOption = useMemo(() => {
    return CHANNEL_OPTIONS.find((o) => o.type === selectedType)
  }, [selectedType])

  useEffect(() => {
    if (!open) return
    setSelectedType('feishu')
    form.resetFields()
  }, [open, form])

  const handleReset = () => {
    form.resetFields()
  }

  const handleSelectChannel = (type: ChannelType) => {
    setSelectedType(type)
    form.resetFields()
  }

  const handleTestConnection = async () => {
    try {
      await form.validateFields()
      message.success('连接测试通过')
    } catch {
      // 表单校验不通过时不提示额外错误
    }
  }

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      const appId = (values.app_id as string | undefined)?.trim() ?? ''
      const appSecret = (values.app_secret as string | undefined)?.trim() ?? ''

      onOk({
        type: selectedType,
        appId,
        appSecret,
      })
      onCancel()
    } catch (err: any) {
      // 表单校验失败时不额外打断
      if (err?.errorFields) return
      message.error(err?.description || '配置失败，请稍后重试')
    }
  }

  return (
    <>
      {messageContextHolder}
      <Modal
        open={open}
        onCancel={onCancel}
        closable={false}
        mask={{ closable: false }}
        destroyOnHidden
        width={840}
        footer={false}
        styles={{ container: { padding: 0 } }}
      >
        <div className="flex min-h-[500px] overflow-hidden rounded-md border border-[#E5E6EA]">
          <div className="flex w-[220px] flex-col gap-1 border-r border-[#E5E6EA] bg-[#FAFBFC] px-2 py-[18px]">
            {CHANNEL_OPTIONS.map((option) => {
              const isSelected = option.type === selectedType
              return (
                <button
                  key={option.type}
                  type="button"
                  className={`h-9 cursor-pointer rounded-md px-2 text-left transition-colors] ${
                    isSelected ? 'bg-white' : 'bg-transparent'
                  }`}
                  onClick={() => handleSelectChannel(option.type)}
                >
                  <div className="flex h-full items-center gap-1.5 text-sm text-[rgb(0_0_0_/_85%)]">
                    <input
                      type="radio"
                      checked={isSelected}
                      readOnly
                      className="m-0 h-4 w-4 accent-[#126EE3]"
                    />
                    <img src={option.icon} alt={option.name} className="h-4 w-4 object-contain" />
                    <span>{option.name}</span>
                  </div>
                </button>
              )
            })}
          </div>
          <div className="flex-1 bg-white px-6 pb-5 pt-4">
            <div className="mb-4 flex items-start gap-x-2">
              {selectedOption && (
                <img src={selectedOption.icon} alt={selectedOption.name} className="h-8 w-8" />
              )}
              <div>
                <div className="text-sm leading-5 text-[rgb(0_0_0_/_85%)]">
                  {selectedOption?.configTitle ?? '通道配置'}
                </div>
                <div className="mt-0.5 text-xs leading-[18px] text-[rgb(0_0_0_/_50%)]">
                  请为该通道配置独立参数
                </div>
              </div>
            </div>

            <Form form={form} layout="vertical">
              <Form.Item
                label="API Key"
                name="app_id"
                rules={[{ required: true, message: '请输入app_id' }]}
              >
                <Input
                  placeholder={
                    selectedType === 'dingtalk'
                      ? '请输入钉钉应用 App Key'
                      : '请输入飞书应用 App Key'
                  }
                  autoComplete="off"
                />
              </Form.Item>

              <Form.Item
                label="API Secret"
                name="app_secret"
                rules={[{ required: true, message: '请输入app_secret' }]}
              >
                <Input placeholder="请输入该应用 App Secret" autoComplete="off" />
              </Form.Item>
            </Form>
            <div className="flex justify-between">
              <button
                type="button"
                className="mb-[14px] cursor-pointer border-none bg-transparent p-0 leading-5 text-[#126EE3]"
                onClick={handleTestConnection}
              >
                {/* 测试连接 */}
              </button>
              <div className="flex justify-end gap-2">
                <Button type="primary" onClick={handleOk}>
                  确定
                </Button>
                <Button onClick={handleReset}>重置</Button>
                <Button onClick={onCancel}>取消</Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default AddChannelModal
