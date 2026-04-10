import type { FormInstance } from 'antd'
import { Button, Form, Input, Spin } from 'antd'
import Tooltip from 'antd/es/tooltip'
import { memo } from 'react'
import type { GuideInitializeRequest } from '@/apis/dip-studio/guide'
import styles from './index.module.less'

interface ConnectOpenClawStepProps {
  loading: boolean
  submitError: string | null
  submitting: boolean
  form: FormInstance<GuideInitializeRequest>
  onNextFromConnect: (values: GuideInitializeRequest) => void
}

function validateKweaverBaseUrl(_: unknown, value: string | undefined) {
  const v = value?.trim()
  if (!v) return Promise.resolve()
  try {
    const u = new URL(v)
    if (!['http:', 'https:'].includes(u.protocol)) {
      return Promise.reject(new Error('KWeaver 服务地址需使用 http 或 https 协议'))
    }
    return Promise.resolve()
  } catch {
    return Promise.reject(
      new Error('请输入有效的 KWeaver 服务地址（需含协议，如 https://example.com）'),
    )
  }
}

const ConnectOpenClawStep = ({
  loading,
  submitError,
  submitting,
  form,
  onNextFromConnect,
}: ConnectOpenClawStepProps) => {
  const kweaverBaseUrl = Form.useWatch('kweaver_base_url', form)
  const hasKweaverBaseUrl = Boolean(kweaverBaseUrl?.trim())

  return (
    <div className="w-full h-full flex flex-col">
      {loading ? (
        <div className="flex-1 min-h-[260px] flex flex-col items-center justify-center">
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
            initialValues={{
              openclaw_address: '',
              openclaw_token: '',
              kweaver_base_url: '',
              kweaver_token: '',
            }}
            onValuesChange={(changedValues) => {
              const changedKeys = Object.keys(changedValues) as Array<keyof GuideInitializeRequest>
              const fieldsToClear = changedKeys.map((key) => ({ name: key, errors: [] }))
              if (changedKeys.includes('kweaver_base_url')) {
                fieldsToClear.push({ name: 'kweaver_token', errors: [] })
              }
              form.setFields(fieldsToClear)
            }}
            onFinish={onNextFromConnect}
            className={styles.form}
          >
            <Form.Item
              label="连接地址"
              name="openclaw_address"
              validateTrigger="onSubmit"
              rules={[{ required: true, message: '请输入 OpenClaw Gateway 连接地址' }]}
            >
              <Input placeholder="请输入 OpenClaw Gateway 连接地址" />
            </Form.Item>

            <Form.Item
              label="Token"
              name="openclaw_token"
              validateTrigger="onSubmit"
              rules={[{ required: true, message: '请输入 OpenClaw Gateway Token' }]}
            >
              <Input placeholder="请输入 OpenClaw Gateway Token" />
            </Form.Item>

            <Form.Item
              label="KWeaver 服务地址（可选）"
              name="kweaver_base_url"
              validateTrigger="onSubmit"
              rules={[{ validator: validateKweaverBaseUrl }]}
            >
              <Input placeholder="例如 https://example.com" />
            </Form.Item>

            <Form.Item
              label="KWeaver Token"
              name="kweaver_token"
              validateTrigger="onSubmit"
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const baseUrl = getFieldValue('kweaver_base_url')?.trim()
                    if (!baseUrl) return Promise.resolve()
                    if (value?.trim()) return Promise.resolve()
                    return Promise.reject(
                      new Error('填写 KWeaver 服务地址后，KWeaver Token 为必填'),
                    )
                  },
                }),
              ]}
            >
              <Input
                placeholder={
                  hasKweaverBaseUrl ? '请输入 KWeaver Token' : '请先填写 KWeaver 服务地址'
                }
                disabled={!hasKweaverBaseUrl}
              />
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
