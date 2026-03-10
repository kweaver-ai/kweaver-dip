import { App as AntdApp, ConfigProvider, Spin } from 'antd'
import enUS from 'antd/locale/en_US'
import zhCN from 'antd/locale/zh_CN'
import zhTW from 'antd/locale/zh_TW'
import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { useAppInit } from './hooks/useAppInit'
import { useOEMBranding } from './hooks/useOEMBranding'
import { router } from './routes'
import { useLanguageStore } from './stores/languageStore'
import './App.css'
import './styles/resetAntd.less'
import './styles/styleIsolation.less'
import GradientContainer from './components/GradientContainer'
import { themeColors } from './styles/themeColors'

function getUILocale(lang: string): typeof enUS | typeof zhTW | typeof zhCN {
  return lang === 'en-US' ? enUS : lang === 'zh-TW' ? zhTW : zhCN
}

const App = () => {
  useAppInit()
  const { language } = useLanguageStore()
  // OEM 相关的主题色 & favicon 由 useOEMBranding 统一处理
  const { primaryColor } = useOEMBranding()

  return (
    <ConfigProvider
      prefixCls="dip"
      iconPrefixCls="dip-icon"
      locale={getUILocale(language)}
      theme={{
        cssVar: { prefix: 'dip' },
        token: {
          colorPrimary: primaryColor,
          colorSuccess: themeColors.success,
          colorWarning: themeColors.warning,
          colorError: themeColors.error,
          colorInfo: themeColors.info,
          colorText: themeColors.text,
          colorLink: themeColors.link,
        },
        components: {
          Table: {
            headerBg: '#f5f5f5',
            headerBorderRadius: 4,
            cellPaddingBlock: 12,
            cellPaddingBlockMD: 12,
            cellPaddingInlineMD: 16,
            cellPaddingInlineSM: 12,
          },
        },
      }}
      getPopupContainer={() => document.getElementById('dip-kweaver-root') || document.body}
    >
      <AntdApp className='w-full h-full'>
        <Suspense
          fallback={
            <GradientContainer className="w-full h-full flex items-center justify-center">
              <Spin size="large" />
            </GradientContainer>
          }
        >
          <RouterProvider router={router} />
        </Suspense>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
