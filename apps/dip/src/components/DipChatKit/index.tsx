import { Splitter } from 'antd'
import clsx from 'clsx'
import type React from 'react'
import { useMemo } from 'react'
import ChatContentArea from './components/ChatContentArea'
import DipChatHeader from './components/DipChatHeader'
import RightSideArea from './components/RightSideArea'
import styles from './index.module.less'
import DipChatKitStoreProvider, { useDipChatKitStore } from './store'
import type { DipChatKitProps } from './types'
import { getConversationTitle } from './utils'

const DipChatKitInner: React.FC<Omit<DipChatKitProps, 'defaultMessageTurns'>> = ({
  className,
  style,
  showHeader = true,
  employeeOptions,
  defaultEmployeeValue,
  inputPlaceholder,
  onSend,
  onRegenerate,
}) => {
  const {
    dipChatKitStore: { messageTurns, preview, chatPanelSize },
    closePreview,
    setChatPanelSize,
  } = useDipChatKitStore()

  const conversationTitle = useMemo(() => {
    return getConversationTitle(messageTurns)
  }, [messageTurns])

  const previewVisible = preview.visible

  return (
    <div className={clsx('DipChatKit', styles.root, className)} style={style}>
      {showHeader && <DipChatHeader title={conversationTitle} />}
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
                employeeOptions={employeeOptions}
                defaultEmployeeValue={defaultEmployeeValue}
                inputPlaceholder={inputPlaceholder}
                onSend={onSend}
                onRegenerate={onRegenerate}
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
              <RightSideArea visible={previewVisible} payload={preview.payload} onClose={closePreview} />
            </div>
          </Splitter.Panel>
        </Splitter>
      </div>
    </div>
  )
}

const DipChatKit: React.FC<DipChatKitProps> = ({ defaultMessageTurns = [], ...restProps }) => {
  return (
    <DipChatKitStoreProvider defaultMessageTurns={defaultMessageTurns}>
      <DipChatKitInner {...restProps} />
    </DipChatKitStoreProvider>
  )
}

export default DipChatKit
