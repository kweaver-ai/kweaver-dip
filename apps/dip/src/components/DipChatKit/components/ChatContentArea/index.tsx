import { VerticalAlignBottomOutlined } from '@ant-design/icons'
import { Button, Skeleton, message, Tooltip } from 'antd'
import clsx from 'clsx'
import isEmpty from 'lodash/isEmpty'
import isString from 'lodash/isString'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import intl from 'react-intl-universal'
import {
  createChatSessionKey,
  createDigitalHumanResponseSSE,
  getDigitalHumanSessionMessages,
} from '../../apis'
import type { DipChatKitResponseStreamChunk } from '../../apis/types'
import { useDipChatKitStore } from '../../store'
import { isAsyncIterable, normalizeStreamChunk } from '../../utils'
import type { DipChatKitAnswerEvent } from '../../types'
import AiPromptInput from '../AiPromptInput'
import type { AiPromptSubmitPayload } from '../AiPromptInput/types'
import ConversationTurn from './ConversationTurn'
import ScrollContainer from '../ScrollContainer'
import type { ScrollContainerRef } from '../ScrollContainer/types'
import styles from './index.module.less'
import type { ChatContentAreaProps } from './types'
import { buildRegeneratePayload, mapSessionMessagesToTurns } from './utils'

const ChatContentArea: React.FC<ChatContentAreaProps> = ({
  sessionId,
  assignEmployeeValue,
  employeeOptions,
  defaultEmployeeValue,
  inputPlaceholder,
}) => {
  const [inputValue, setInputValue] = useState('')
  const [sessionMessagesLoading, setSessionMessagesLoading] = useState(false)
  const scrollRef = useRef<ScrollContainerRef | null>(null)
  const sessionKeyMapRef = useRef<Record<string, string>>({})
  const autoSentTurnIdsRef = useRef<Set<string>>(new Set())
  const abortControllerMapRef = useRef<Record<string, AbortController>>({})
  const scheduledScrollTimerIdsRef = useRef<number[]>([])
  const {
    dipChatKitStore: { messageTurns, scroll },
    setDipChatKitStore,
    appendQuestionTurn,
    startAnswerStream,
    appendAnswerChunk,
    appendAnswerEvent,
    finishAnswerStream,
    failAnswerStream,
    openPreview,
    setAutoScrollEnabled,
    setShowBackToBottom,
    setIsAtBottom,
  } = useDipChatKitStore()
  const setAutoScrollEnabledRef = useRef(setAutoScrollEnabled)
  const setShowBackToBottomRef = useRef(setShowBackToBottom)

  const streamLoading = useMemo(() => {
    return messageTurns.some((turn) => turn.answerStreaming)
  }, [messageTurns])

  const streamFingerprint = useMemo(() => {
    return messageTurns
      .map(
        (turn) =>
          `${turn.id}:${turn.answerMarkdown.length}:${turn.answerEvents.length}:${turn.answerStreaming ? '1' : '0'}`,
      )
      .join('|')
  }, [messageTurns])
  const fixedSessionKey = useMemo(() => {
    if (sessionId === undefined) return ''
    return sessionId.trim()
  }, [sessionId])

  const clearScheduledScroll = useCallback(() => {
    if (scheduledScrollTimerIdsRef.current.length === 0) return
    scheduledScrollTimerIdsRef.current.forEach((timerId) => {
      window.clearTimeout(timerId)
    })
    scheduledScrollTimerIdsRef.current = []
  }, [])

  const scheduleScrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'auto') => {
      clearScheduledScroll()
      scrollRef.current?.scrollToBottom('auto')
      const firstTimer = window.setTimeout(() => {
        scrollRef.current?.scrollToBottom(behavior)
      }, 16)
      const secondTimer = window.setTimeout(() => {
        scrollRef.current?.scrollToBottom(behavior)
      }, 80)
      const thirdTimer = window.setTimeout(() => {
        scrollRef.current?.scrollToBottom(behavior)
      }, 180)
      scheduledScrollTimerIdsRef.current = [firstTimer, secondTimer, thirdTimer]
    },
    [clearScheduledScroll],
  )

  const isAbortError = (error: unknown): boolean => {
    if (error instanceof DOMException && error.name === 'AbortError') return true
    if (error instanceof Error && error.name === 'AbortError') return true
    return false
  }

  const isSSETextChunk = (
    chunk: unknown,
  ): chunk is Extract<DipChatKitResponseStreamChunk, { kind: 'text' }> => {
    if (!chunk || typeof chunk !== 'object') return false
    const payload = chunk as Record<string, unknown>
    return payload.kind === 'text' && typeof payload.text === 'string'
  }

  const isSSEToolCallChunk = (
    chunk: unknown,
  ): chunk is Extract<DipChatKitResponseStreamChunk, { kind: 'toolCall' }> => {
    if (!chunk || typeof chunk !== 'object') return false
    const payload = chunk as Record<string, unknown>
    if (payload.kind !== 'toolCall') return false
    const toolPayload = payload.payload
    if (!toolPayload || typeof toolPayload !== 'object') return false

    const candidate = toolPayload as Record<string, unknown>
    return (
      typeof candidate.id === 'string' &&
      typeof candidate.toolName === 'string' &&
      typeof candidate.toolCallId === 'string' &&
      typeof candidate.text === 'string'
    )
  }

  const mapToolCallChunkToAnswerEvent = (
    chunk: Extract<DipChatKitResponseStreamChunk, { kind: 'toolCall' }>,
  ): DipChatKitAnswerEvent => {
    const payload = chunk.payload
    return {
      id: payload.id,
      type: 'toolCall',
      role: 'assistant',
      text: payload.text,
      toolName: payload.toolName,
      toolCallId: payload.toolCallId,
      timestamp: Date.now(),
      details: {
        status: payload.status,
        itemId: payload.itemId,
        outputIndex: payload.outputIndex,
      },
    }
  }

  const resetConversation = useCallback(
    (turns: typeof messageTurns = []) => {
      setDipChatKitStore({
        messageTurns: turns,
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
      })
    },
    [setDipChatKitStore],
  )
  const resetConversationRef = useRef(resetConversation)

  useEffect(() => {
    resetConversationRef.current = resetConversation
  }, [resetConversation])

  useEffect(() => {
    setAutoScrollEnabledRef.current = setAutoScrollEnabled
  }, [setAutoScrollEnabled])

  useEffect(() => {
    setShowBackToBottomRef.current = setShowBackToBottom
  }, [setShowBackToBottom])

  const resolveEmployeeId = useCallback(
    (payload: AiPromptSubmitPayload): string => {
      const payloadEmployeeId = payload.employees[0]?.value
      if (payloadEmployeeId) {
        return payloadEmployeeId
      }

      if (assignEmployeeValue) {
        return assignEmployeeValue
      }

      if (defaultEmployeeValue) {
        return defaultEmployeeValue
      }

      throw new Error(
        intl
          .get('dipChatKit.missingEmployeeId')
          .d('未获取到数字员工 ID，请先选择数字员工后再发送') as string,
      )
    },
    [assignEmployeeValue, defaultEmployeeValue],
  )

  const ensureSessionKey = useCallback(async (employeeId: string): Promise<string> => {
    const cachedSessionKey = sessionKeyMapRef.current[employeeId]
    if (cachedSessionKey) {
      return cachedSessionKey
    }

    const { sessionKey } = await createChatSessionKey(employeeId)
    if (!sessionKey) {
      throw new Error(
        intl.get('dipChatKit.missingSessionKey').d('创建会话失败，未返回有效 sessionKey') as string,
      )
    }

    sessionKeyMapRef.current[employeeId] = sessionKey
    return sessionKey
  }, [])

  const runBuiltInSend = useCallback(
    async (payload: AiPromptSubmitPayload, signal?: AbortSignal) => {
      let sessionKey = fixedSessionKey
      if (!sessionKey) {
        const employeeId = resolveEmployeeId(payload)
        sessionKey = await ensureSessionKey(employeeId)
      }

      return createDigitalHumanResponseSSE(
        { input: payload.content },
        { sessionKey, signal },
      )
    },
    [ensureSessionKey, fixedSessionKey, resolveEmployeeId],
  )

  const consumeSendResult = useCallback(
    async (turnId: string, result: unknown) => {
      if (isString(result)) {
        if (result) {
          appendAnswerChunk(turnId, result)
        }
        finishAnswerStream(turnId)
        return
      }

      if (isAsyncIterable(result)) {
        for await (const chunk of result) {
          if (isSSEToolCallChunk(chunk)) {
            appendAnswerEvent(turnId, mapToolCallChunkToAnswerEvent(chunk))
            continue
          }

          if (isSSETextChunk(chunk)) {
            if (chunk.text) {
              appendAnswerChunk(turnId, chunk.text)
            }
            continue
          }

          const textChunk = normalizeStreamChunk(chunk)
          if (textChunk) {
            appendAnswerChunk(turnId, textChunk)
          }
        }
        finishAnswerStream(turnId)
        return
      }

      finishAnswerStream(turnId)
    },
    [
      appendAnswerChunk,
      appendAnswerEvent,
      finishAnswerStream,
      isSSETextChunk,
      isSSEToolCallChunk,
      mapToolCallChunkToAnswerEvent,
    ],
  )

  const runSendFlow = useCallback(
    async (payload: AiPromptSubmitPayload, turnId: string, regenerate: boolean) => {
      const abortController = new AbortController()
      abortControllerMapRef.current[turnId] = abortController
      startAnswerStream(turnId, regenerate)

      try {
        const result = await runBuiltInSend(payload, abortController.signal)
        await consumeSendResult(turnId, result)
      } catch (error) {
        if (abortController.signal.aborted || isAbortError(error)) {
          finishAnswerStream(turnId)
          return
        }

        const errorMessage =
          error instanceof Error
            ? error.message
            : (intl
                .get('dipChatKit.answerGenerateFailed')
                .d('回答生成失败，请稍后重试') as string)
        failAnswerStream(turnId, errorMessage)
        message.error(errorMessage)
      } finally {
        delete abortControllerMapRef.current[turnId]
      }
    },
    [
      consumeSendResult,
      failAnswerStream,
      finishAnswerStream,
      runBuiltInSend,
      startAnswerStream,
    ],
  )

  useEffect(() => {
    if (!scroll.autoScrollEnabled) return
    scrollRef.current?.scrollToBottom('auto')
  }, [streamFingerprint, scroll.autoScrollEnabled])

  useEffect(() => {
    return () => {
      clearScheduledScroll()
    }
  }, [clearScheduledScroll])

  useEffect(() => {
    const pendingTurn = messageTurns.find(
      (turn) =>
        turn.pendingSend &&
        !turn.answerLoading &&
        !turn.answerStreaming &&
        !autoSentTurnIdsRef.current.has(turn.id),
    )
    if (!pendingTurn) return

    autoSentTurnIdsRef.current.add(pendingTurn.id)
    const pendingPayload = buildRegeneratePayload(pendingTurn)
    setAutoScrollEnabled(true)
    setShowBackToBottom(false)
    void runSendFlow(pendingPayload, pendingTurn.id, false)
  }, [messageTurns, runSendFlow, setAutoScrollEnabled, setShowBackToBottom])

  const abortAllStreaming = useCallback(() => {
    Object.values(abortControllerMapRef.current).forEach((controller) => {
      controller.abort()
    })
    abortControllerMapRef.current = {}
  }, [])

  useEffect(() => {
    if (sessionId === undefined) {
      setSessionMessagesLoading(false)
      return
    }

    const trimmedSessionId = sessionId.trim()
    abortAllStreaming()
    clearScheduledScroll()
    setInputValue('')
    setSessionMessagesLoading(false)

    if (!trimmedSessionId) {
      resetConversationRef.current([])
      return
    }

    setSessionMessagesLoading(true)
    resetConversationRef.current([])
    let disposed = false
    const request = getDigitalHumanSessionMessages(trimmedSessionId)

    request
      .then((response) => {
        if (disposed) return
        const turns = mapSessionMessagesToTurns(response.messages)
        resetConversationRef.current(turns)
        setAutoScrollEnabledRef.current(true)
        setShowBackToBottomRef.current(false)
        scheduleScrollToBottom('auto')
        setSessionMessagesLoading(false)
      })
      .catch(() => {
        if (disposed) return
        resetConversationRef.current([])
        setSessionMessagesLoading(false)
        message.error(intl.get('dipChatKit.loadSessionMessagesFailed').d('加载会话消息失败'))
      })

    return () => {
      disposed = true
      setSessionMessagesLoading(false)
      if ('abort' in request && typeof request.abort === 'function') {
        request.abort()
      }
    }
  }, [
    abortAllStreaming,
    clearScheduledScroll,
    scheduleScrollToBottom,
    sessionId,
  ])

  useEffect(() => {
    return () => {
      abortAllStreaming()
    }
  }, [abortAllStreaming])

  const handleStopGenerating = useCallback(() => {
    const activeControllers = Object.values(abortControllerMapRef.current)
    if (activeControllers.length === 0) return

    abortAllStreaming()

    setAutoScrollEnabled(false)
    setShowBackToBottom(true)
  }, [abortAllStreaming, setAutoScrollEnabled, setShowBackToBottom])

  const handleSubmit = useCallback(
    async (payload: AiPromptSubmitPayload) => {
      const turnId = appendQuestionTurn(payload)
      setInputValue('')
      setAutoScrollEnabled(true)
      setShowBackToBottom(false)
      await runSendFlow(payload, turnId, false)
    },
    [appendQuestionTurn, runSendFlow, setAutoScrollEnabled, setShowBackToBottom],
  )

  const copyText = useCallback(async (text: string, successMessage: string) => {
    if (!text) {
      message.warning(intl.get('dipChatKit.noCopyContent').d('暂无可复制内容'))
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      message.success(successMessage)
    } catch {
      message.error(
        intl.get('dipChatKit.copyFailedCheckPermission').d('复制失败，请检查浏览器权限设置'),
      )
    }
  }, [])

  return (
    <div className={clsx('ChatContentArea', styles.root)}>
      <ScrollContainer
        ref={scrollRef}
        className={styles.scrollArea}
        onUserScrollUp={() => {
          setAutoScrollEnabled(false)
          setShowBackToBottom(true)
        }}
        onReachBottomChange={(isAtBottom) => {
          setIsAtBottom(isAtBottom)
          if (isAtBottom) {
            setShowBackToBottom(false)
            return
          }
          setAutoScrollEnabled(false)
          setShowBackToBottom(true)
        }}
      >
        <div className={styles.messageList}>
          <div className={styles.messageListContent}>
            {sessionMessagesLoading && (
              <div className={styles.sessionLoadingSkeleton}>
                <Skeleton
                  active
                  title={false}
                  paragraph={{ rows: 4, width: ['46%', '92%', '82%', '70%'] }}
                />
                <Skeleton
                  active
                  title={false}
                  paragraph={{ rows: 5, width: ['38%', '88%', '83%', '72%', '48%'] }}
                />
                <Skeleton
                  active
                  title={false}
                  paragraph={{ rows: 3, width: ['42%', '96%', '66%'] }}
                />
              </div>
            )}
            {isEmpty(messageTurns) && !sessionMessagesLoading && (
              <div className={styles.emptyState}>
                {intl.get('dipChatKit.emptyState').d('请输入问题开始对话。')}
              </div>
            )}
            {messageTurns.map((turn) => {
              return (
                <ConversationTurn
                  key={turn.id}
                  turn={turn}
                  onEditQuestion={() => {
                    // Intentionally left blank: edit confirm handling will be added in future iterations.
                  }}
                  onCopyQuestion={(question) => {
                    void copyText(
                      question,
                      intl.get('dipChatKit.questionCopied').d('问题复制成功') as string,
                    )
                  }}
                  onCopyAnswer={(answer) => {
                    void copyText(
                      answer,
                      intl.get('dipChatKit.answerCopied').d('回答复制成功') as string,
                    )
                  }}
                  onRegenerateAnswer={(turnId) => {
                    const targetTurn = messageTurns.find((item) => item.id === turnId)
                    if (!targetTurn) {
                      message.error(
                        intl
                          .get('dipChatKit.targetQuestionNotFound')
                          .d('未找到可重新生成的问题'),
                      )
                      return
                    }

                    const regeneratePayload = buildRegeneratePayload(targetTurn)
                    setAutoScrollEnabled(true)
                    setShowBackToBottom(false)
                    void runSendFlow(regeneratePayload, turnId, true)
                  }}
                  onOpenPreview={(turnId, payload) => {
                    openPreview(turnId, payload)
                  }}
                />
              )
            })}
          </div>
        </div>
      </ScrollContainer>

      <div className={styles.inputArea}>
        {scroll.showBackToBottom && (
          <div className={styles.backToBottomWrap}>
            <div className={styles.backToBottomBtn}>
              <Tooltip title={intl.get('dipChatKit.backToBottom').d('返回底部')}>
                <Button
                  // type="primary"
                  shape="circle"
                  aria-label={intl.get('dipChatKit.backToBottom').d('返回底部') as string}
                  icon={<VerticalAlignBottomOutlined />}
                  onClick={() => {
                    scrollRef.current?.scrollToBottom('smooth')
                    setShowBackToBottom(false)
                    if (streamLoading) {
                      setAutoScrollEnabled(true)
                    }
                  }}
                />
              </Tooltip>
            </div>
          </div>
        )}

        <div className={styles.inputContent}>
          <div className={styles.inputInner}>
            <AiPromptInput
              value={inputValue}
              onChange={setInputValue}
              onSubmit={(payload) => {
                void handleSubmit(payload)
              }}
              onStop={handleStopGenerating}
              assignEmployeeValue={assignEmployeeValue}
              employeeOptions={employeeOptions}
              defaultEmployeeValue={defaultEmployeeValue}
              loading={streamLoading}
              placeholder={
                inputPlaceholder || (intl.get('dipChatKit.inputPlaceholder').d('发送消息...') as string)
              }
            />
          </div>
          <div className={styles.inputDisclaimer}>
            {intl
              .get('dipChatKit.inputDisclaimer')
              .d('数字员工可能会犯错，请核查重要业务信息')}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatContentArea


