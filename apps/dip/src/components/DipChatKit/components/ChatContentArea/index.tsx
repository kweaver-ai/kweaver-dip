import { VerticalAlignBottomOutlined } from '@ant-design/icons'
import { Button, message, Tooltip } from 'antd'
import clsx from 'clsx'
import isEmpty from 'lodash/isEmpty'
import isString from 'lodash/isString'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import intl from 'react-intl-universal'
import { createChatSessionKey, createDigitalHumanResponseSSE } from '../../apis'
import { useDipChatKitStore } from '../../store'
import type { DipChatKitSendHandler } from '../../types'
import { isAsyncIterable, normalizeStreamChunk } from '../../utils'
import AiPromptInput from '../AiPromptInput'
import type { AiPromptSubmitPayload } from '../AiPromptInput/types'
import ConversationTurn from './ConversationTurn'
import ScrollContainer from '../ScrollContainer'
import type { ScrollContainerRef } from '../ScrollContainer/types'
import styles from './index.module.less'
import type { ChatContentAreaProps } from './types'
import { buildRegeneratePayload } from './utils'

const ChatContentArea: React.FC<ChatContentAreaProps> = ({
  employeeOptions,
  defaultEmployeeValue,
  inputPlaceholder,
  onSend,
  onRegenerate,
}) => {
  const [inputValue, setInputValue] = useState('')
  const scrollRef = useRef<ScrollContainerRef | null>(null)
  const sessionKeyMapRef = useRef<Record<string, string>>({})
  const autoSentTurnIdsRef = useRef<Set<string>>(new Set())
  const {
    dipChatKitStore: { messageTurns, scroll },
    appendQuestionTurn,
    startAnswerStream,
    appendAnswerChunk,
    finishAnswerStream,
    failAnswerStream,
    openPreview,
    setAutoScrollEnabled,
    setShowBackToBottom,
    setIsAtBottom,
  } = useDipChatKitStore()

  const streamLoading = useMemo(() => {
    return messageTurns.some((turn) => turn.answerStreaming)
  }, [messageTurns])

  const streamFingerprint = useMemo(() => {
    return messageTurns
      .map((turn) => `${turn.id}:${turn.answerMarkdown.length}:${turn.answerStreaming ? '1' : '0'}`)
      .join('|')
  }, [messageTurns])

  const resolveEmployeeId = useCallback(
    (payload: AiPromptSubmitPayload): string => {
      const payloadEmployeeId = payload.employees[0]?.value
      if (payloadEmployeeId) {
        return payloadEmployeeId
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
    [defaultEmployeeValue],
  )

  const ensureSessionKey = useCallback(async (employeeId: string): Promise<string> => {
    const cachedSessionKey = sessionKeyMapRef.current[employeeId]
    if (cachedSessionKey) {
      return cachedSessionKey
    }

    const { sessionKey } = await createChatSessionKey()
    if (!sessionKey) {
      throw new Error(
        intl.get('dipChatKit.missingSessionKey').d('创建会话失败，未返回有效 sessionKey') as string,
      )
    }

    sessionKeyMapRef.current[employeeId] = sessionKey
    return sessionKey
  }, [])

  const runBuiltInSend = useCallback<DipChatKitSendHandler>(
    async (payload) => {
      const employeeId = resolveEmployeeId(payload)
      const sessionKey = await ensureSessionKey(employeeId)

      return createDigitalHumanResponseSSE(employeeId, { input: payload.content }, { sessionKey })
    },
    [ensureSessionKey, resolveEmployeeId],
  )

  const consumeSendResult = useCallback(
    async (turnId: string, result: Awaited<ReturnType<DipChatKitSendHandler>>) => {
      if (isString(result)) {
        if (result) {
          appendAnswerChunk(turnId, result)
        }
        finishAnswerStream(turnId)
        return
      }

      if (isAsyncIterable(result)) {
        for await (const chunk of result) {
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
    [appendAnswerChunk, finishAnswerStream],
  )

  const runSendFlow = useCallback(
    async (payload: AiPromptSubmitPayload, turnId: string, regenerate: boolean) => {
      const handler = regenerate ? onRegenerate || onSend || runBuiltInSend : onSend || runBuiltInSend
      startAnswerStream(turnId, regenerate)

      try {
        const result = await handler(payload, { turnId, regenerate })
        await consumeSendResult(turnId, result)
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : (intl
                .get('dipChatKit.answerGenerateFailed')
                .d('回答生成失败，请稍后重试') as string)
        failAnswerStream(turnId, errorMessage)
        message.error(errorMessage)
      }
    },
    [consumeSendResult, failAnswerStream, onRegenerate, onSend, runBuiltInSend, startAnswerStream],
  )

  useEffect(() => {
    if (!scroll.autoScrollEnabled) return
    scrollRef.current?.scrollToBottom('auto')
  }, [streamFingerprint, scroll.autoScrollEnabled])

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
          }
        }}
      >
        <div className={styles.messageList}>
          <div className={styles.messageListContent}>
            {isEmpty(messageTurns) && (
              <div className={styles.emptyState}>
                {intl.get('dipChatKit.emptyState').d('请输入问题开始对话。')}
              </div>
            )}
            {messageTurns.map((turn) => {
              return (
                <ConversationTurn
                  key={turn.id}
                  turn={turn}
                  onEditQuestion={(_, question) => {
                    setInputValue(question)
                    message.success(
                      intl.get('dipChatKit.questionFilledBack').d('问题内容已回填至输入框'),
                    )
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

      {scroll.showBackToBottom && (
        <div className={styles.backToBottomWrap}>
          <div className={styles.backToBottomBtn}>
            <Tooltip title={intl.get('dipChatKit.backToBottom').d('返回底部')}>
              <Button
                type="primary"
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

      <div className={styles.inputArea}>
        <div className={styles.inputContent}>
          <div className={styles.inputInner}>
            <AiPromptInput
              value={inputValue}
              onChange={setInputValue}
              onSubmit={(payload) => {
                void handleSubmit(payload)
              }}
              employeeOptions={employeeOptions}
              defaultEmployeeValue={defaultEmployeeValue}
              loading={streamLoading}
              placeholder={
                inputPlaceholder || (intl.get('dipChatKit.inputPlaceholder').d('发送消息...') as string)
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatContentArea


