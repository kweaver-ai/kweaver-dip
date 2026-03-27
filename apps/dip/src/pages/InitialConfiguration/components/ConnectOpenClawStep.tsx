import type { FormInstance } from 'antd'
import { Button, Form, Input, Spin } from 'antd'
import Tooltip from 'antd/es/tooltip'
import { memo } from 'react'
import type { GuideInitializeRequest } from '@/apis/dip-studio/guide'

interface ConnectOpenClawStepProps {
  loading: boolean
  submitError: string | null
  submitting: boolean
  form: FormInstance<GuideInitializeRequest>
  onNextFromConnect: (values: GuideInitializeRequest) => void
}

const ConnectOpenClawStep = ({
  loading,
  submitError,
  submitting,
  form,
  onNextFromConnect,
}: ConnectOpenClawStepProps) => {
  return (
    <div className="w-full h-full flex flex-col">
      {loading ? (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-black/50 mt-3 mb-8">正在读取 OpenClaw 配置，请稍等...</div>
          <Spin />
        </div>
      ) : (
        <>
          <div className="font-bold text-[--dip-text-color] text-[28px]">连接 OpenClaw</div>
          <div className="text-black/50 mt-3 mb-8">
            请输入 OpenClaw Gateway 连接地址与 Token，用于初始化 DIP Studio 默认配置。
          </div>
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            initialValues={{ openclaw_address: '', openclaw_token: '' }}
            onFinish={onNextFromConnect}
          >
            <Form.Item
              label="连接地址"
              name="openclaw_address"
              rules={[{ required: true, message: '请输入 OpenClaw Gateway 连接地址' }]}
            >
              <Input placeholder="请输入 OpenClaw Gateway 连接地址" />
            </Form.Item>

            <Form.Item
              label="Token"
              name="openclaw_token"
              rules={[{ required: true, message: '请输入 OpenClaw Gateway Token' }]}
            >
              <Input placeholder="请输入 OpenClaw Gateway Token" />
            </Form.Item>

            <div className="flex justify-between">
              <Tooltip
                color={'#fff'}
                classNames={{
                  container: 'max-h-[300px] overflow-y-auto',
                }}
                title={submitError || ''}
              >
                <div className="text-sm text-[--dip-error-color] line-clamp-1">
                  {submitError || ''}
                </div>
              </Tooltip>
              <Button type="primary" htmlType="submit" loading={submitting}>
                下一步
              </Button>
            </div>
          </Form>
        </>
      )}
    </div>
  )
}

export default memo(ConnectOpenClawStep)
