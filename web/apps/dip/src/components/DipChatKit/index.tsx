import type { XProviderProps } from '@ant-design/x'
import { XProvider } from '@ant-design/x'
import enUSX from '@ant-design/x/locale/en_US'
import zhCN from '@ant-design/x/locale/zh_CN'
import { message, Splitter } from 'antd'
import enUS from 'antd/locale/en_US'
import zhCNAntd from 'antd/locale/zh_CN'
import zhTW from 'antd/locale/zh_TW'
import clsx from 'clsx'
import type React from 'react'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import intl from 'react-intl-universal'
import { getDigitalHumanDetail } from './apis'
import ChatContentArea from './components/ChatContentArea'
import DipChatHeader from './components/DipChatHeader'
import RightSideArea from './components/RightSideArea'
import styles from './index.module.less'
import DipChatKitStoreProvider, { useDipChatKitStore } from './store'
import type { DipChatKitLocale, DipChatKitProps } from './types'
import {
  buildDefaultMessageTurnsFromSubmitPayload,
  getConversationTitle,
  parseAgentIdFromSessionKey,
} from './utils'

const zhTWX: XProviderProps['locale'] = {
  ...zhCN,
  locale: 'zh-tw',
  Conversations: {
    create: '新對話',
  },
  Sender: {
    stopLoading: '停止生成',
    speechRecording: '語音錄製中',
  },
  Actions: {
    feedbackLike: '喜歡',
    feedbackDislike: '不喜歡',
    audio: '播放語音',
    audioRunning: '語音播放中',
    audioError: '播放錯誤',
    audioLoading: '語音載入中',
  },
  Bubble: {
    editableOk: '確認',
    editableCancel: '取消',
  },
  Mermaid: {
    zoomIn: '放大',
    zoomOut: '縮小',
    zoomReset: '重置',
    download: '下載',
    code: '代碼',
    image: '圖片',
  },
  Folder: {
    selectFile: '請選擇檔案',
    loadError: '檔案載入失敗',
    noService: '未設定檔案內容服務',
    loadFailed: '檔案載入失敗',
  },
}

const dipChatKitLocaleMap: Record<DipChatKitLocale, XProviderProps['locale']> = {
  zh_cn: {
    ...zhCNAntd,
    ...zhCN,
  },
  en_us: {
    ...enUS,
    ...enUSX,
  },
  zh_tw: {
    ...zhTW,
    ...zhTWX,
  },
}

const resolveDipChatKitLocale = (locale?: DipChatKitLocale): XProviderProps['locale'] => {
  if (!locale) return dipChatKitLocaleMap.zh_cn
  const normalizedLocale = locale.toLowerCase() as DipChatKitLocale
  return dipChatKitLocaleMap[normalizedLocale] || dipChatKitLocaleMap.zh_cn
}

const DipChatKitInner: React.FC<Omit<DipChatKitProps, 'initialSubmitPayload' | 'locale'>> = ({
  className,
  style,
  showHeader = true,
  sessionId,
  assignEmployeeValue,
  employeeOptions,
  defaultEmployeeValue,
  inputPlaceholder,
  onSessionKeyReady,
}) => {
  const {
    dipChatKitStore: { messageTurns, preview, chatPanelSize },
    closePreview,
    setChatPanelSize,
  } = useDipChatKitStore()
  const [previewFullscreen, setPreviewFullscreen] = useState(false)
  const [digitalHumanName, setDigitalHumanName] = useState('')
  const digitalHumanNameCacheRef = useRef<Record<string, string>>({})

  const conversationTitle = useMemo(() => {
    return getConversationTitle(messageTurns)
  }, [messageTurns])
  const digitalHumanAgentId = useMemo(() => {
    const normalizedSessionId = sessionId?.trim()
    if (normalizedSessionId) {
      const sessionIdAgentId = parseAgentIdFromSessionKey(normalizedSessionId)
      if (sessionIdAgentId) {
        return sessionIdAgentId
      }
    }

    for (let index = messageTurns.length - 1; index >= 0; index -= 1) {
      const currentSessionKey = messageTurns[index]?.sessionKey?.trim()
      if (currentSessionKey) {
        const turnSessionAgentId = parseAgentIdFromSessionKey(currentSessionKey)
        if (turnSessionAgentId) {
          return turnSessionAgentId
        }
      }
    }

    return ''
  }, [messageTurns, sessionId])

  const previewVisible = preview.visible

  useEffect(() => {
    if (previewVisible) return
    setPreviewFullscreen(false)
  }, [previewVisible])

  useEffect(() => {
    if (!digitalHumanAgentId) {
      setDigitalHumanName('')
      return
    }

    const cachedDigitalHumanName = digitalHumanNameCacheRef.current[digitalHumanAgentId]
    if (cachedDigitalHumanName !== undefined) {
      setDigitalHumanName(cachedDigitalHumanName)
      return
    }

    let disposed = false

    getDigitalHumanDetail(digitalHumanAgentId)
      .then((detail) => {
        if (disposed) return
        const nextDigitalHumanName = detail.name?.trim() || digitalHumanAgentId
        digitalHumanNameCacheRef.current[digitalHumanAgentId] = nextDigitalHumanName
        setDigitalHumanName(nextDigitalHumanName)
      })
      .catch(() => {
        if (disposed) return
        digitalHumanNameCacheRef.current[digitalHumanAgentId] = digitalHumanAgentId
        setDigitalHumanName(digitalHumanAgentId)
        message.error(intl.get('dipChatKit.loadDigitalHumanDetailFailed').d('加载数字员工信息失败'))
      })

    return () => {
      disposed = true
    }
  }, [digitalHumanAgentId])

  return (
    <div
      className={clsx(
        'DipChatKit',
        styles.root,
        previewFullscreen && styles.previewFullscreen,
        className,
      )}
      style={style}
    >
      {showHeader && (
        <DipChatHeader title={conversationTitle} digitalHumanName={digitalHumanName} />
      )}
      <div className={styles.body}>
        <Splitter
          className={clsx(styles.bodySplitter, !previewVisible && styles.bodySplitterPreviewHidden)}
          classNames={{ panel: styles.splitterPanel }}
          onResize={(sizes) => {
            if (!previewVisible) return
            const firstPanelSize = sizes[0]
            if (typeof firstPanelSize === 'number' && firstPanelSize > 0) {
              setChatPanelSize(firstPanelSize)
            }
          }}
        >
          <Splitter.Panel
            size={previewVisible ? chatPanelSize : '100%'}
            min={previewVisible ? '20%' : undefined}
            max={previewVisible ? '70%' : undefined}
          >
            <div className={clsx('ChatContentAreaPanel', styles.chatPanel)}>
              <ChatContentArea
                sessionId={sessionId}
                assignEmployeeValue={assignEmployeeValue}
                employeeOptions={employeeOptions}
                defaultEmployeeValue={defaultEmployeeValue}
                inputPlaceholder={inputPlaceholder}
                onSessionKeyReady={onSessionKeyReady}
              />
            </div>
          </Splitter.Panel>
          <Splitter.Panel size={previewVisible ? undefined : 0} resizable={previewVisible}>
            <div
              className={clsx(
                'RightSideAreaPanel',
                styles.rightPanel,
                previewVisible ? styles.rightPanelVisible : styles.rightPanelHidden,
              )}
            >
              <RightSideArea
                visible={previewVisible}
                payload={preview.payload}
                onClose={closePreview}
                fullscreen={previewFullscreen}
                onToggleFullscreen={() => {
                  setPreviewFullscreen((prevState) => !prevState)
                }}
              />
            </div>
          </Splitter.Panel>
        </Splitter>
      </div>
    </div>
  )
}

const DipChatKit: React.FC<DipChatKitProps> = ({ initialSubmitPayload, locale, ...restProps }) => {
  const initialMessageTurns = useMemo(() => {
    return buildDefaultMessageTurnsFromSubmitPayload(initialSubmitPayload)
  }, [initialSubmitPayload])

  const resolvedLocale = useMemo(() => {
    return resolveDipChatKitLocale(locale)
  }, [locale])

  return (
    <DipChatKitStoreProvider initialMessageTurns={initialMessageTurns}>
      <XProvider locale={resolvedLocale}>
        <DipChatKitInner {...restProps} />
      </XProvider>
    </DipChatKitStoreProvider>
  )
}

const MemoizedDipChatKit = memo(DipChatKit)

export default MemoizedDipChatKit
