import { useEffect, useState } from 'react'
import { getIframeSizeApi, TemplateType } from '@/apis'
import backgroundImage from '@/assets/images/brand/background.png'
import { useLanguageStore } from '@/stores/languageStore'
import { useOEMConfigStore } from '@/stores/oemConfigStore'
// import About from './About'
import Content from './Content'
import DefaultTemplate from './DefaultTemplate'
import Footer from './Footer'
import Header from './Header'
import RegularTemplate from './RegularTemplate'

function OAuthLogin() {
  const { language } = useLanguageStore()
  const { getOEMResourceConfig, getOEMBasicConfig } = useOEMConfigStore()
  const oemResourceConfig = getOEMResourceConfig(language)
  const oemBasicConfig = getOEMBasicConfig()
  const [iframeHeight, setIframeHeight] = useState<number>(410) // 默认高度

  // 获取 iframe 高度
  useEffect(() => {
    let cancelled = false

    async function fetchIframeHeight() {
      try {
        const size = await getIframeSizeApi()
        if (!cancelled) {
          setIframeHeight(size.height)
        }
      } catch {
        if (!cancelled) {
          // 如果获取失败，使用默认值
          setIframeHeight(410)
        }
      }
    }

    fetchIframeHeight()

    return () => {
      cancelled = true
    }
  }, [])

  // 获取模板类型，默认为 'default'
  const template = (oemBasicConfig?.webTemplate as TemplateType) || TemplateType.Default

  // 从 OEM 资源配置中获取背景图片（base64 值）
  // 如果 API 返回的是纯 base64 字符串，需要添加 data URL 前缀
  const getBackgroundImageUrl = () => {
    if (template === TemplateType.Regular) {
      // regular 模式使用 regularBackground.png
      const base64Image = oemResourceConfig?.['regularBackground.png']
      if (base64Image) {
        if (base64Image.startsWith('data:image/')) {
          return base64Image
        }
        return `data:image/png;base64,${base64Image}`
      }
    } else {
      // default 模式使用 defaultBackground.png
      const base64Image = oemResourceConfig?.['defaultBackground.png']
      if (base64Image) {
        if (base64Image.startsWith('data:image/')) {
          return base64Image
        }
        return `data:image/png;base64,${base64Image}`
      }
    }
    return backgroundImage
  }
  const backgroundImageUrl = getBackgroundImageUrl()

  // 计算登录框高度，如果 iframe 高度大于 435，则调整容器高度
  const loginHeight = iframeHeight > 435 ? iframeHeight : 410

  // 根据模板类型渲染不同的模板
  if (template === TemplateType.Regular) {
    return (
      <RegularTemplate
        header={<Header />}
        content={<Content iframeHeight={iframeHeight} width={420} />}
        footer={<Footer />}
        // about={<About />}
        background={backgroundImageUrl}
        fontStyle={oemBasicConfig?.regularFont as 'dark' | 'light' | undefined}
        loginBoxLocation={oemBasicConfig?.loginBoxLocation}
        loginBoxStyle={oemBasicConfig?.loginBoxStyle}
        iframeHeight={iframeHeight}
      />
    )
  }

  // default 模板
  return (
    <DefaultTemplate
      header={<Header />}
      content={<Content iframeHeight={iframeHeight} />}
      footer={<Footer />}
      // about={<About />}
      background={backgroundImageUrl}
      loginHeight={loginHeight}
    />
  )
}

export default OAuthLogin
