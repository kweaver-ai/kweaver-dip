import { Form } from 'antd'
import { memo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  type GuideInitializeRequest,
  type GuideInitializeResponse,
  getOpenClawDetectedConfig,
  initializeGuide,
  type OpenClawDetectedConfig,
} from '@/apis/dip-studio/guide'
import ScrollBarContainer from '@/components/ScrollBarContainer'
import { useUserInfoStore } from '@/stores/userInfoStore'
import CheckEnvironmentStep from './components/CheckEnvironmentStep'
import ConnectOpenClawStep from './components/ConnectOpenClawStep'
import InitializeResultStep from './components/InitializeResultStep'
import type { StepKey } from './types'

const stepTitles = ['连接 OpenClaw', '检测环境', '完成初始化']
const MIN_STEP2_STAY_MS = 3000

const InitialConfiguration = () => {
  const navigate = useNavigate()
  const isAdmin = useUserInfoStore((s) => s.isAdmin)
  const [step, setStep] = useState<StepKey>(0)

  const [loading, setLoading] = useState(false)
  const [detectedConfig, setDetectedConfig] = useState<OpenClawDetectedConfig | null>(null)
  const [openClawValues, setOpenClawValues] = useState<GuideInitializeRequest | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [initResult, setInitResult] = useState<GuideInitializeResponse | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [form] = Form.useForm<GuideInitializeRequest>()

  const fetchOpenClawConfig = async () => {
    try {
      setLoading(true)
      const cfg = await getOpenClawDetectedConfig()
      setDetectedConfig(cfg)
    } catch {
      // 获取失败时静默处理，允许用户手动填写
      setDetectedConfig(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) {
      navigate('/home', { replace: true })
      return
    }

    void fetchOpenClawConfig()
  }, [isAdmin, navigate])

  useEffect(() => {
    if (!detectedConfig) return

    form.setFieldsValue({
      openclaw_address: `${detectedConfig.protocol}://${detectedConfig.host}:${detectedConfig.port}`,
      openclaw_token: detectedConfig.token,
    })
  }, [detectedConfig, form])

  useEffect(() => {
    if (step !== 2 || !initResult) return

    const t = window.setTimeout(() => {
      navigate('/digital-human/management', { replace: true })
    }, 2000)

    return () => window.clearTimeout(t)
  }, [step, initResult, navigate])

  const getInitializeRequest = (values: GuideInitializeRequest): GuideInitializeRequest => {
    // 后端初始化引导接口要求 openclaw_address + openclaw_token
    return {
      openclaw_address: values.openclaw_address,
      openclaw_token: values.openclaw_token,
    }
  }

  const handleNextFromConnect = (values: GuideInitializeRequest) => {
    setOpenClawValues(values)
    setSubmitError(null)
    setInitResult(null)
    setStep(1)
    void handleInitialize(values)
  }

  const handleInitialize = async (payload?: GuideInitializeRequest) => {
    const requestValues = payload ?? openClawValues
    if (!requestValues) {
      setSubmitError('请先在第一步填写连接信息')
      return
    }

    setSubmitting(true)
    setInitResult(null)
    setSubmitError(null)
    try {
      const body = getInitializeRequest(requestValues)
      const [res] = await Promise.all([
        initializeGuide(body),
        new Promise((resolve) => setTimeout(resolve, MIN_STEP2_STAY_MS)),
      ])
      setInitResult(res)
      setStep(2)
    } catch (e: any) {
      setSubmitError(e?.description || '初始化失败')
      setStep(0)
    } finally {
      setSubmitting(false)
    }
  }

  const stepContent = (() => {
    if (step === 0) {
      return (
        <ConnectOpenClawStep
          loading={loading}
          submitError={submitError}
          submitting={submitting}
          form={form}
          onNextFromConnect={handleNextFromConnect}
        />
      )
    }

    if (step === 1) {
      return <CheckEnvironmentStep />
    }

    return <InitializeResultStep initResult={initResult} />
  })()

  if (!isAdmin) return null

  return (
    <div className="h-full relative min-h-0">
      <ScrollBarContainer className="p-6 h-full min-h-0">
        <div className="min-h-full w-full flex flex-col items-center justify-center">
          <div className="w-[706px] h-[380px] max-h-[500px] bg-[#F8FBFF] rounded-2xl py-8 px-10">
            {stepContent}
          </div>
          <div className="w-full max-w-[180px] flex-shrink-0 mt-6">
            <div className="flex items-center gap-2">
              {stepTitles.map((title, index) => (
                <div
                  key={title}
                  className="h-1.5 flex-1 rounded"
                  style={{
                    backgroundColor: index === step ? '#126EE3' : '#126EE333',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </ScrollBarContainer>
    </div>
  )
}

export default memo(InitialConfiguration)
