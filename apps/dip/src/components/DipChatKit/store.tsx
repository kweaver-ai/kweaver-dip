import React, { createContext, type PropsWithChildren, useContext } from 'react'
import useLatestState from '@/hooks/useLatestState'
import type {
  DipChatKitAttachment,
  DipChatKitAnswerEvent,
  DipChatKitMessageTurn,
  DipChatKitPreviewPayload,
  DipChatKitState,
} from './types'
import type { AiPromptSubmitPayload } from './components/AiPromptInput/types'

export interface DipChatKitStoreContextType {
  dipChatKitStore: DipChatKitState
  setDipChatKitStore: (data: Partial<DipChatKitState>) => void
  getDipChatKitStore: () => DipChatKitState
  resetDipChatKitStore: (key?: string | string[]) => void
  appendQuestionTurn: (payload: AiPromptSubmitPayload) => string
  startAnswerStream: (turnId: string, clearPrevious?: boolean) => void
  appendAnswerChunk: (turnId: string, chunk: string) => void
  appendAnswerEvent: (turnId: string, event: DipChatKitAnswerEvent) => void
  finishAnswerStream: (turnId: string) => void
  failAnswerStream: (turnId: string, errorMessage: string) => void
  openPreview: (turnId: string, payload: DipChatKitPreviewPayload) => void
  closePreview: () => void
  setAutoScrollEnabled: (enabled: boolean) => void
  setShowBackToBottom: (show: boolean) => void
  setIsAtBottom: (isAtBottom: boolean) => void
  setChatPanelSize: (size: string | number) => void
}

interface DipChatKitStoreProviderProps {
  initialMessageTurns?: DipChatKitMessageTurn[]
}

const createInitialState = (initialMessageTurns: DipChatKitMessageTurn[] = []): DipChatKitState => {
  return {
    messageTurns: initialMessageTurns,
    preview: {
      visible: false,
      activeTurnId: '',
      payload: null,
    },
    scroll: {
      autoScrollEnabled: true,
      showBackToBottom: false,
      isAtBottom: true,
    },
    chatPanelSize: '50%',
  }
}

const DipChatKitStoreContext = createContext<DipChatKitStoreContextType | undefined>(undefined)

const mapFilesToAttachments = (files: File[]): DipChatKitAttachment[] => {
  return files.map((file) => ({
    uid: `${file.name}_${file.size}_${file.lastModified}`,
    name: file.name,
    size: file.size,
    type: file.type,
    file,
  }))
}

const updateTurnById = (
  turns: DipChatKitMessageTurn[],
  turnId: string,
  updater: (target: DipChatKitMessageTurn) => DipChatKitMessageTurn,
): DipChatKitMessageTurn[] => {
  return turns.map((turn) => {
    if (turn.id !== turnId) return turn
    return updater(turn)
  })
}

export const useDipChatKitStore = (): DipChatKitStoreContextType => {
  const context = useContext(DipChatKitStoreContext)
  if (!context) {
    throw new Error('useDipChatKitStore must be used within DipChatKitStoreProvider')
  }
  return context
}

const DipChatKitStoreProvider: React.FC<PropsWithChildren<DipChatKitStoreProviderProps>> = ({
  children,
  initialMessageTurns = [],
}) => {
  const [store, setStore, getStore, resetStore] = useLatestState<DipChatKitState>(
    createInitialState(initialMessageTurns),
  )

  const setDipChatKitStore: DipChatKitStoreContextType['setDipChatKitStore'] = (data) => {
    setStore((prevState) => ({
      ...prevState,
      ...data,
    }))
  }

  const appendQuestionTurn: DipChatKitStoreContextType['appendQuestionTurn'] = (payload) => {
    const turnId = `turn_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
    const nextTurn: DipChatKitMessageTurn = {
      id: turnId,
      question: payload.content,
      questionEmployees: payload.employees,
      questionAttachments: mapFilesToAttachments(payload.files),
      answerMarkdown: '',
      answerEvents: [],
      answerLoading: true,
      answerStreaming: true,
      createdAt: new Date().toISOString(),
    }

    setStore((prevState) => ({
      ...prevState,
      messageTurns: [...prevState.messageTurns, nextTurn],
      scroll: {
        ...prevState.scroll,
        autoScrollEnabled: true,
        showBackToBottom: false,
      },
    }))

    return turnId
  }

  const startAnswerStream: DipChatKitStoreContextType['startAnswerStream'] = (
    turnId,
    clearPrevious = false,
  ) => {
    setStore((prevState) => ({
      ...prevState,
      messageTurns: updateTurnById(prevState.messageTurns, turnId, (turn) => ({
        ...turn,
        pendingSend: false,
        answerMarkdown: clearPrevious ? '' : turn.answerMarkdown,
        answerEvents: clearPrevious ? [] : turn.answerEvents,
        answerLoading: true,
        answerStreaming: true,
        answerError: undefined,
      })),
    }))
  }

  const appendAnswerChunk: DipChatKitStoreContextType['appendAnswerChunk'] = (turnId, chunk) => {
    setStore((prevState) => ({
      ...prevState,
      messageTurns: updateTurnById(prevState.messageTurns, turnId, (turn) => ({
        ...turn,
        answerMarkdown: `${turn.answerMarkdown}${chunk}`,
        answerLoading: false,
        answerStreaming: true,
      })),
    }))
  }

  const appendAnswerEvent: DipChatKitStoreContextType['appendAnswerEvent'] = (turnId, event) => {
    setStore((prevState) => ({
      ...prevState,
      messageTurns: updateTurnById(prevState.messageTurns, turnId, (turn) => {
        const normalizedId = event.id?.trim()
        const normalizedEvent: DipChatKitAnswerEvent = normalizedId
          ? { ...event, id: normalizedId }
          : {
              ...event,
              id: `stream_event_${Date.now()}_${turn.answerEvents.length + 1}`,
            }

        const existedEventIndex = turn.answerEvents.findIndex((item) => item.id === normalizedEvent.id)
        const nextAnswerEvents =
          existedEventIndex >= 0
            ? turn.answerEvents.map((item, index) =>
                index === existedEventIndex ? { ...item, ...normalizedEvent } : item,
              )
            : [...turn.answerEvents, normalizedEvent]

        return {
          ...turn,
          answerEvents: nextAnswerEvents,
          answerLoading: false,
          answerStreaming: true,
        }
      }),
    }))
  }

  const finishAnswerStream: DipChatKitStoreContextType['finishAnswerStream'] = (turnId) => {
    setStore((prevState) => ({
      ...prevState,
      messageTurns: updateTurnById(prevState.messageTurns, turnId, (turn) => ({
        ...turn,
        answerLoading: false,
        answerStreaming: false,
      })),
    }))
  }

  const failAnswerStream: DipChatKitStoreContextType['failAnswerStream'] = (turnId, errorMessage) => {
    setStore((prevState) => ({
      ...prevState,
      messageTurns: updateTurnById(prevState.messageTurns, turnId, (turn) => ({
        ...turn,
        answerLoading: false,
        answerStreaming: false,
        answerError: errorMessage,
      })),
    }))
  }

  const openPreview: DipChatKitStoreContextType['openPreview'] = (turnId, payload) => {
    setStore((prevState) => ({
      ...prevState,
      preview: {
        visible: true,
        activeTurnId: turnId,
        payload,
      },
      chatPanelSize: prevState.chatPanelSize || '50%',
    }))
  }

  const closePreview: DipChatKitStoreContextType['closePreview'] = () => {
    setStore((prevState) => ({
      ...prevState,
      preview: {
        visible: false,
        activeTurnId: '',
        payload: null,
      },
    }))
  }

  const setAutoScrollEnabled: DipChatKitStoreContextType['setAutoScrollEnabled'] = (enabled) => {
    setStore((prevState) => ({
      ...prevState,
      scroll: {
        ...prevState.scroll,
        autoScrollEnabled: enabled,
      },
    }))
  }

  const setShowBackToBottom: DipChatKitStoreContextType['setShowBackToBottom'] = (show) => {
    setStore((prevState) => ({
      ...prevState,
      scroll: {
        ...prevState.scroll,
        showBackToBottom: show,
      },
    }))
  }

  const setIsAtBottom: DipChatKitStoreContextType['setIsAtBottom'] = (isAtBottom) => {
    setStore((prevState) => ({
      ...prevState,
      scroll: {
        ...prevState.scroll,
        isAtBottom,
      },
    }))
  }

  const setChatPanelSize: DipChatKitStoreContextType['setChatPanelSize'] = (size) => {
    setStore((prevState) => ({
      ...prevState,
      chatPanelSize: size,
    }))
  }

  return (
    <DipChatKitStoreContext.Provider
      value={{
        dipChatKitStore: store,
        setDipChatKitStore,
        getDipChatKitStore: getStore,
        resetDipChatKitStore: resetStore,
        appendQuestionTurn,
        startAnswerStream,
        appendAnswerChunk,
        appendAnswerEvent,
        finishAnswerStream,
        failAnswerStream,
        openPreview,
        closePreview,
        setAutoScrollEnabled,
        setShowBackToBottom,
        setIsAtBottom,
        setChatPanelSize,
      }}
    >
      {children}
    </DipChatKitStoreContext.Provider>
  )
}

export default DipChatKitStoreProvider
