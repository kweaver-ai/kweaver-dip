import { message, Spin } from 'antd'
import { memo, useEffect, useState } from 'react'
import { type ApplicationBasicInfo, getApplicationsBasicInfo } from '@/apis'
import ScrollBarContainer from '../ScrollBarContainer'

interface BasicConfigProps {
  /** 应用 ID */
  appId?: number
}

const BasicConfig = ({ appId }: BasicConfigProps) => {
  const [messageApi, messageContextHolder] = message.useMessage()
  const [loading, setLoading] = useState(false)
  const [basicInfo, setBasicInfo] = useState<ApplicationBasicInfo | null>(null)

  useEffect(() => {
    let mounted = true

    const loadBasicInfo = async () => {
      if (!appId) return
      setLoading(true)
      try {
        const data = await getApplicationsBasicInfo(appId)
        if (mounted) {
          setBasicInfo(data)
        }
      } catch (error: any) {
        if (error?.description) {
          messageApi.error(error?.description)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // 如果有 appId，则再拉一次最新数据
    if (appId) {
      loadBasicInfo()
    }

    return () => {
      mounted = false
    }
  }, [appId])

  if (loading) {
    return (
      <div className="absolute inset-0 left-40 flex items-center justify-center">
        <Spin />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-y-3">
      {messageContextHolder}
      <div className="px-4 text-sm font-medium text-[--dip-text-color]">基本信息</div>
      <ScrollBarContainer className="px-4">
        <div className="flex flex-col rounded-xl border border-[#E3E8EF] leading-8 p-3 text-sm text-[--dip-text-color] gap-2">
          {/* 应用名称：告警与故障分析 */}
          <div className="flex flex-1">
            <span className="text-[--dip-text-color-45] mr-1 break-keep">应用名称：</span>
            <span>{basicInfo?.name ?? '--'}</span>
          </div>

          {/* 应用描述：... */}
          <div className="flex flex-1">
            <span className="text-[--dip-text-color-45] mr-1 align-top break-keep">应用描述：</span>
            <span className="inline-block flex-1 align-top break-words">
              {basicInfo?.description ?? '--'}
            </span>
          </div>

          {/* 版本号：v1.0.0.0.0 */}
          <div className="flex flex-1">
            <span className="text-[--dip-text-color-45] mr-1 break-keep">版本号：</span>
            <span>{basicInfo?.version ?? '--'}</span>
          </div>
        </div>
      </ScrollBarContainer>
    </div>
  )
}

export default memo(BasicConfig)
