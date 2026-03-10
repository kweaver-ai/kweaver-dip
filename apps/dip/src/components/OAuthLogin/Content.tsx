import { memo, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getLoginUrl } from '@/apis'

interface ContentProps {
  iframeHeight: number
  width?: number | string
}

function Content({ iframeHeight, width = 560 }: ContentProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [searchParams] = useSearchParams()

  // 获取重定向地址（登录成功后跳转）
  const asredirect = searchParams.get('asredirect') || undefined

  // 构建登录 URL
  const loginUrl = getLoginUrl(asredirect)

  // 开发环境下直接跳转到登录URL（登录回调会由后端处理并重定向到/login-success）
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.location.href = loginUrl
    }
  }, [loginUrl])

  const widthStyle =
    typeof width === 'number' ? `${width}px` : typeof width === 'string' ? width : '560px'

  return (
    <iframe
      src={loginUrl}
      ref={iframeRef}
      className="border-none"
      style={{ height: `${iframeHeight}px`, width: widthStyle }}
      title="登录"
    />
  )
}

export default memo(Content)
