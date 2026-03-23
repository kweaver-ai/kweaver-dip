import { CloseCircleFilled, SendOutlined } from '@ant-design/icons'
import { FileCard, Sender, type SenderProps } from '@ant-design/x'
import {
  Avatar,
  Button,
  Col,
  Dropdown,
  Flex,
  type GetRef,
  type MenuProps,
  message,
  Row,
  Tag,
  Tooltip,
  Upload,
} from 'antd'
import clsx from 'clsx'
import uniq from 'lodash/uniq'
import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import intl from 'react-intl-universal'
import { getDigitalHumanList } from '../../apis'
import IconFont from '@/components/IconFont'
import ResizeObserver from '@/components/ResizeObserver'
import useResizeObserver from '@/hooks/useResizeObserver'
import styles from './index.module.less'
import type {
  AiPromptInputProps,
  AiPromptMentionOption,
  AiPromptSubmitPayload,
  CursorAnchorPosition,
  MentionTriggerSource,
} from './types'
import {
  canStartTriggerAtCursor,
  filterMentionOptionsByQuery,
  getAttachmentFileKey,
  getRawUploadFile,
  getTextAreaCaretPosition,
  mergeAttachmentFiles,
  parseTriggerQueryBeforeCursor,
  validateAttachmentFiles,
} from './utils'

const mentionAvatarColors = [
  { bg: '#EEF2FF', fg: '#4F46E5' },
  { bg: '#FFF7ED', fg: '#EA580C' },
  { bg: '#ECFDF5', fg: '#16A34A' },
  { bg: '#F5F3FF', fg: '#7C3AED' },
  { bg: '#EFF6FF', fg: '#0284C7' },
  { bg: '#FFF1F2', fg: '#E11D48' },
]

const getInitial = (label: string) => label.trim().charAt(0) || ''
const uploadValidateMessageKey = 'ai-prompt-upload-validate'

const AiPromptInput: React.FC<AiPromptInputProps> = ({
  value,
  defaultValue = '',
  assignEmployeeValue,
  defaultEmployeeValue,
  autoSize = { minRows: 2, maxRows: 4 },
  onChange,
  onSubmit,
  onStop,
  onAttach,
  onEmployeeSelect,
  employeeOptions = [],
  placeholder,
  employeePanelTitle,
  employeeButtonLabel,
  attachButtonTitle,
  sendButtonTitle,
  triggerCharacter = false,
  disabled = false,
  loading = false,
  className,
}) => {
  const senderRef = useRef<GetRef<typeof Sender>>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const isMentionMenuMouseDownRef = useRef(false)
  const [open, setOpen] = useState(false)
  const [triggerSource, setTriggerSource] = useState<MentionTriggerSource | null>(null)
  const [activeKeyboardCharacter, setActiveKeyboardCharacter] = useState<string | null>(null)
  const [mentionQuery, setMentionQuery] = useState('')
  const [cursorAnchor, setCursorAnchor] = useState<CursorAnchorPosition>({ left: 0, top: 0 })
  const [innerValue, setInnerValue] = useState(defaultValue)
  const [attachments, setAttachments] = useState<File[]>([])
  const [fileColSpan, setFileColSpan] = useState(6)
  const [employees, setEmployees] = useState<AiPromptMentionOption[]>([])
  const [fetchedEmployeeOptions, setFetchedEmployeeOptions] = useState<AiPromptMentionOption[]>([])

  const mergedValue = value ?? innerValue
  const canEdit = !disabled
  const canSubmit = !(disabled || loading)
  const normalizedAssignEmployeeValue = assignEmployeeValue?.trim() || ''
  const showEmployeeSelector = !normalizedAssignEmployeeValue
  const resolvedEmployeePanelTitle = employeePanelTitle ?? intl.get('aiPromptInput.mentionPanelTitle')
  const resolvedEmployeeButtonLabel = employeeButtonLabel ?? intl.get('aiPromptInput.mentionButton')
  const resolvedAttachButtonTitle = attachButtonTitle ?? intl.get('aiPromptInput.attach')
  const resolvedSendButtonTitle = sendButtonTitle ?? intl.get('aiPromptInput.send')
  const resolvedStopButtonTitle = intl.get('dipChatKit.stopGenerate').d('鍋滄鐢熸垚')
  const resolvedRemoveFileTitle = intl.get('aiPromptInput.removeFile')
  const resolvedEmployeeOptions = useMemo(() => {
    if (employeeOptions.length > 0) {
      return employeeOptions
    }
    return fetchedEmployeeOptions
  }, [employeeOptions, fetchedEmployeeOptions])

  useEffect(() => {
    if (value !== undefined) {
      setInnerValue(value)
    }
  }, [value])

  useEffect(() => {
    let disposed = false

    if (employeeOptions.length > 0) {
      setFetchedEmployeeOptions([])
      return () => {
        disposed = true
      }
    }

    const loadDigitalHumanList = async () => {
      try {
        const list = await getDigitalHumanList()
        if (disposed) return

        const options = list
          .filter((item) => item.id && item.name)
          .map((item) => ({
            value: item.id,
            label: item.name,
          }))
        setFetchedEmployeeOptions(options)
      } catch {
        if (disposed) return
        setFetchedEmployeeOptions([])
        message.error(intl.get('dipChatKit.fetchDigitalHumanListFailed').d('鑾峰彇鏁板瓧鍛樺伐鍒楄〃澶辫触锛岃绋嶅悗閲嶈瘯'))
      }
    }

    void loadDigitalHumanList()

    return () => {
      disposed = true
    }
  }, [employeeOptions.length])

  useEffect(() => {
    if (normalizedAssignEmployeeValue) {
      const assignedEmployee =
        resolvedEmployeeOptions.find((item) => item.value === normalizedAssignEmployeeValue) ?? {
          value: normalizedAssignEmployeeValue,
          label: normalizedAssignEmployeeValue,
        }
      setEmployees([assignedEmployee])
      return
    }

    if (!resolvedEmployeeOptions.length) return
    setEmployees((prevEmployees) => {
      if (prevEmployees.length > 0) return prevEmployees
      const defaultEmployee =
        resolvedEmployeeOptions.find((item) => item.value === defaultEmployeeValue) ??
        resolvedEmployeeOptions[0]
      if (!defaultEmployee) return prevEmployees
      return [defaultEmployee]
    })
  }, [defaultEmployeeValue, normalizedAssignEmployeeValue, resolvedEmployeeOptions])

  const buttonMentionOptionMap = useMemo(() => {
    return new Map(resolvedEmployeeOptions.map((item) => [item.value, item]))
  }, [resolvedEmployeeOptions])

  const keyboardTriggerItems = useMemo(() => {
    if (!(showEmployeeSelector && Array.isArray(triggerCharacter))) return []
    return triggerCharacter.filter((item) => item.character)
  }, [showEmployeeSelector, triggerCharacter])

  const keyboardTriggerCharacters = useMemo(() => {
    return keyboardTriggerItems.map((item) => item.character)
  }, [keyboardTriggerItems])

  const keyboardTriggerOptionMap = useMemo(() => {
    return new Map(keyboardTriggerItems.map((item) => [item.character, item.options]))
  }, [keyboardTriggerItems])

  const keyboardMentionBaseOptions = useMemo(() => {
    if (!activeKeyboardCharacter) return []
    return keyboardTriggerOptionMap.get(activeKeyboardCharacter) ?? []
  }, [activeKeyboardCharacter, keyboardTriggerOptionMap])

  const keyboardResizeTarget =
    open &&
    triggerSource === 'keyboard' &&
    senderRef.current?.inputElement instanceof HTMLTextAreaElement
      ? senderRef.current.inputElement
      : null

  const keyboardMentionOptions = useMemo(() => {
    return filterMentionOptionsByQuery(keyboardMentionBaseOptions, mentionQuery)
  }, [keyboardMentionBaseOptions, mentionQuery])

  const keyboardMentionOptionMap = useMemo(() => {
    return new Map(keyboardMentionOptions.map((item) => [item.value, item]))
  }, [keyboardMentionOptions])

  const buildSuggestionItems = (
    options: AiPromptMentionOption[],
  ): NonNullable<MenuProps['items']> => {
    return options.map((item, index) => {
      const color = mentionAvatarColors[index % mentionAvatarColors.length]
      return {
        key: item.value,
        label: (
          <span className={styles.mentionMenuItem}>
            <span className={styles.mentionIcon}>
              {item.avatar ?? (
                <Avatar
                  size={24}
                  style={{
                    backgroundColor: color.bg,
                    color: color.fg,
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  {getInitial(item.label)}
                </Avatar>
              )}
            </span>
            <Tooltip title={item.label} placement="right">
              <span className={styles.mentionMenuLabel}>{item.label}</span>
            </Tooltip>
          </span>
        ),
      }
    })
  }

  const buttonSuggestionItems = useMemo(() => {
    return buildSuggestionItems(resolvedEmployeeOptions)
  }, [resolvedEmployeeOptions])

  const keyboardSuggestionItems = useMemo(() => {
    return buildSuggestionItems(keyboardMentionOptions)
  }, [keyboardMentionOptions])

  const clearAnchorRaf = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  const updateCursorAnchorPosition = () => {
    const textAreaElement = senderRef.current?.inputElement
    if (!(textAreaElement instanceof HTMLTextAreaElement && cardRef.current)) return

    const cursorIndex = textAreaElement.selectionStart ?? textAreaElement.value.length
    const caretPosition = getTextAreaCaretPosition(textAreaElement, cursorIndex)
    const textAreaRect = textAreaElement.getBoundingClientRect()
    const cardRect = cardRef.current.getBoundingClientRect()

    const left = textAreaRect.left - cardRect.left + caretPosition.left
    const top = textAreaRect.top - cardRect.top + caretPosition.top

    setCursorAnchor({
      left: Math.max(left, 8),
      top: Math.max(top, 8),
    })
  }

  const scheduleCursorAnchorPosition = () => {
    clearAnchorRaf()
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      updateCursorAnchorPosition()
    })
  }

  const openMentionPanel = (source: MentionTriggerSource, character?: string) => {
    if (!(canEdit && showEmployeeSelector)) return

    if (source === 'keyboard') {
      if (!character) return
      const triggerOptions = keyboardTriggerOptionMap.get(character) ?? []
      if (!triggerOptions.length) return
      setTriggerSource(source)
      setActiveKeyboardCharacter(character)
      setMentionQuery('')
      scheduleCursorAnchorPosition()
    } else {
      if (!buttonSuggestionItems.length) return
      setTriggerSource(source)
      setActiveKeyboardCharacter(null)
      setMentionQuery('')
    }

    setOpen(true)
    senderRef.current?.focus?.()
  }

  const closeMentionPanel = () => {
    setOpen(false)
    setTriggerSource(null)
    setActiveKeyboardCharacter(null)
    setMentionQuery('')
    isMentionMenuMouseDownRef.current = false
  }

  const handleFileChange = (fileList: File[]) => {
    setAttachments((prev) => {
      const { validFiles, errorMessages } = validateAttachmentFiles(fileList, prev)
      const deduplicatedErrorMessages = uniq(errorMessages)

      if (deduplicatedErrorMessages.length) {
        message.error({
          key: uploadValidateMessageKey,
          content: deduplicatedErrorMessages.join('；'),
        })
      } else {
        message.destroy(uploadValidateMessageKey)
      }

      if (!validFiles.length) {
        return prev
      }

      const next = mergeAttachmentFiles(prev, validFiles)
      onAttach?.(next)
      return next
    })
  }

  const handleAttachmentRemove = (fileKey: string) => {
    setAttachments((prev) => {
      const next = prev.filter((item) => getAttachmentFileKey(item) !== fileKey)
      onAttach?.(next)
      return next
    })
  }

  const clearAttachments = () => {
    setAttachments([])
    onAttach?.([])
  }

  const handleSubmit: NonNullable<SenderProps['onSubmit']> = (content) => {
    const nextContent = content.trim()
    const hasContentOrFiles = Boolean(nextContent || attachments.length)
    if (!(hasContentOrFiles && canSubmit)) {
      return
    }

    const submitEmployees =
      employees.length > 0
        ? employees
        : normalizedAssignEmployeeValue
          ? [{ value: normalizedAssignEmployeeValue, label: normalizedAssignEmployeeValue }]
          : []

    if (!submitEmployees.length) {
      message.warning(intl.get('dipChatKit.selectDigitalHumanFirst').d('请先选择一个数字员工'))
      return
    }

    const payload: AiPromptSubmitPayload = {
      content: nextContent,
      employees: submitEmployees,
      files: attachments,
    }

    onSubmit?.(payload)

    if (value === undefined) {
      setInnerValue('')
    } else {
      onChange?.('')
    }

    clearAttachments()
    senderRef.current?.clear?.()
    closeMentionPanel()
  }

  const handleMentionSelect = (option: AiPromptMentionOption) => {
    if (!canEdit) return

    onEmployeeSelect?.(option)

    if (triggerSource === 'button') {
      setEmployees([option])

      closeMentionPanel()
      senderRef.current?.focus?.()
      return
    }

    setEmployees([option])

    const mentionCharacter = triggerSource === 'keyboard' ? (activeKeyboardCharacter ?? '@') : '@'
    const replaceTriggerCharacter = triggerSource === 'keyboard' ? mentionCharacter : undefined

    senderRef.current?.insert?.(
      [
        {
          type: 'tag',
          key: `mention_${option.value}_${Date.now()}`,
          props: {
            label: `${mentionCharacter}${option.label}`,
            value: option.value,
          },
          formatResult: (text) => `${mentionCharacter}${text}`,
        },
      ],
      'cursor',
      replaceTriggerCharacter,
    )

    closeMentionPanel()
    senderRef.current?.focus?.()
  }

  const handleMentionRemove = (employeeValue: string) => {
    setEmployees((prev) => prev.filter((item) => item.value !== employeeValue))
  }

  const handleMentionMenuClick: MenuProps['onClick'] = ({ key }) => {
    const mentionOptionMap =
      triggerSource === 'keyboard' ? keyboardMentionOptionMap : buttonMentionOptionMap
    const option = mentionOptionMap.get(String(key))
    if (!option) return
    handleMentionSelect(option)
  }

  const handleButtonDropdownOpenChange = (nextOpen: boolean) => {
    if (!(showEmployeeSelector && canEdit && buttonSuggestionItems.length)) {
      closeMentionPanel()
      return
    }

    if (nextOpen) {
      setTriggerSource('button')
      setOpen(true)
      return
    }

    closeMentionPanel()
  }

  const handleKeyboardDropdownOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      closeMentionPanel()
    }
  }

  useEffect(() => {
    return () => {
      clearAnchorRaf()
    }
  }, [])

  useEffect(() => {
    if (!(open && triggerSource === 'keyboard')) return

    const textAreaElement = senderRef.current?.inputElement
    if (!(textAreaElement instanceof HTMLTextAreaElement)) return

    scheduleCursorAnchorPosition()

    const onScroll = () => {
      updateCursorAnchorPosition()
    }

    const onWindowResize = () => {
      updateCursorAnchorPosition()
    }

    textAreaElement.addEventListener('scroll', onScroll)
    window.addEventListener('resize', onWindowResize)

    return () => {
      textAreaElement.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onWindowResize)
    }
  }, [open, triggerSource])

  useResizeObserver({
    target: keyboardResizeTarget,
    enabled: Boolean(keyboardResizeTarget),
    onResize: () => {
      updateCursorAnchorPosition()
    },
  })

  useEffect(() => {
    if (!(open && triggerSource === 'keyboard')) return
    if (!keyboardSuggestionItems.length) {
      closeMentionPanel()
    }
  }, [keyboardSuggestionItems.length, open, triggerSource])

  useEffect(() => {
    if (triggerSource === 'keyboard' && !keyboardTriggerCharacters.length) {
      closeMentionPanel()
    }
  }, [keyboardTriggerCharacters.length, triggerSource])

  useEffect(() => {
    if (!(open && !showEmployeeSelector)) return
    closeMentionPanel()
  }, [open, showEmployeeSelector])

  const markMentionMenuMouseDown = () => {
    isMentionMenuMouseDownRef.current = true
  }

  const clearMentionMenuMouseDown = () => {
    requestAnimationFrame(() => {
      isMentionMenuMouseDownRef.current = false
    })
  }

  const renderMentionPopup = (menuNode: React.ReactNode) => {
    return (
      <div
        className={styles.mentionDropdown}
        onMouseDownCapture={markMentionMenuMouseDown}
        onMouseUpCapture={clearMentionMenuMouseDown}
      >
        <div className={styles.mentionTitle}>{resolvedEmployeePanelTitle}</div>
        {menuNode}
      </div>
    )
  }

  const buttonMentionMenu = {
    items: buttonSuggestionItems,
    onClick: handleMentionMenuClick,
  }

  const keyboardMentionMenu = {
    items: keyboardSuggestionItems,
    onClick: handleMentionMenuClick,
  }

  const senderHeader = (
    <Sender.Header title="" open={attachments.length > 0} closable={false}>
      <ResizeObserver
        onResize={({ width }) => {
          if (width < 400) {
            setFileColSpan(12)
          } else {
            setFileColSpan(6)
          }
        }}
      >
        <div className={styles.fileHeaderContainer}>
          <Row gutter={[8, 8]} className={styles.fileHeaderList}>
            {attachments.map((file) => {
              const fileKey = getAttachmentFileKey(file)

              return (
                <Col key={fileKey} span={fileColSpan}>
                  <div className={styles.fileCardItem}>
                    <Tooltip title={file.name}>
                      <span className={styles.fileCardTooltipTarget}>
                        <FileCard
                          name={file.name}
                          byte={file.size}
                          size="small"
                          className={styles.fileCard}
                          classNames={{ name: styles.fileCardName }}
                        />
                      </span>
                    </Tooltip>
                    <div className={styles.fileCardRemoveAction}>
                      <Tooltip title={resolvedRemoveFileTitle}>
                        <Button
                          type="text"
                          size="small"
                          aria-label={resolvedRemoveFileTitle}
                          icon={<CloseCircleFilled />}
                          onClick={() => {
                            handleAttachmentRemove(fileKey)
                          }}
                        />
                      </Tooltip>
                    </div>
                  </div>
                </Col>
              )
            })}
          </Row>
        </div>
      </ResizeObserver>
    </Sender.Header>
  )

  const isButtonMentionOpen = open && triggerSource === 'button' && buttonSuggestionItems.length > 0
  const isKeyboardMentionOpen =
    open && triggerSource === 'keyboard' && keyboardSuggestionItems.length > 0

  return (
    <div className={clsx('AiPromptInput', styles.root, className)}>
      <div ref={cardRef} className={styles.card}>
        <Dropdown
          trigger={[]}
          placement="bottomLeft"
          open={isKeyboardMentionOpen}
          onOpenChange={handleKeyboardDropdownOpenChange}
          menu={keyboardMentionMenu}
          popupRender={renderMentionPopup}
        >
          <span
            className={styles.cursorAnchor}
            style={{
              left: `${cursorAnchor.left}px`,
              top: `${cursorAnchor.top}px`,
            }}
          />
        </Dropdown>

        <Sender
          ref={senderRef}
          value={mergedValue}
          loading={loading}
          disabled={!canEdit}
          placeholder={placeholder}
          submitType="enter"
          header={senderHeader}
          suffix={false}
          autoSize={autoSize}
          className={styles.sender}
          onPasteFile={(files) => {
            handleFileChange(Array.from(files))
            senderRef.current?.focus?.()
          }}
          onChange={(nextValue) => {
            if (value === undefined) {
              setInnerValue(nextValue)
            }
            onChange?.(nextValue)

            if (triggerSource === 'keyboard') {
              if (!keyboardTriggerCharacters.length) {
                closeMentionPanel()
                return
              }

              const textAreaElement = senderRef.current?.inputElement
              const cursorIndex =
                textAreaElement instanceof HTMLTextAreaElement
                  ? (textAreaElement.selectionStart ?? nextValue.length)
                  : nextValue.length

              const triggerMatch = parseTriggerQueryBeforeCursor(
                nextValue,
                cursorIndex,
                keyboardTriggerCharacters,
              )
              if (triggerMatch === null) {
                closeMentionPanel()
                return
              }

              const triggerOptions = keyboardTriggerOptionMap.get(triggerMatch.character) ?? []
              if (!triggerOptions.length) {
                closeMentionPanel()
                return
              }

              setActiveKeyboardCharacter(triggerMatch.character)
              setMentionQuery(triggerMatch.query)

              if (!open) {
                setOpen(true)
              }

              scheduleCursorAnchorPosition()
            }
          }}
          onSubmit={handleSubmit}
          onCancel={() => {
            onStop?.()
          }}
          onBlur={() => {
            if (isMentionMenuMouseDownRef.current) return
            if (open) {
              closeMentionPanel()
            }
          }}
          onKeyDown={(event) => {
            if (keyboardTriggerCharacters.length) {
              const keyboardCharacter = keyboardTriggerCharacters.find(
                (character) => character === event.key,
              )
              if (keyboardCharacter) {
                const triggerOptions = keyboardTriggerOptionMap.get(keyboardCharacter) ?? []
                if (triggerOptions.length) {
                  const textAreaElement = senderRef.current?.inputElement
                  const cursorIndex =
                    textAreaElement instanceof HTMLTextAreaElement
                      ? (textAreaElement.selectionStart ?? textAreaElement.value.length)
                      : mergedValue.length
                  const currentValue =
                    textAreaElement instanceof HTMLTextAreaElement
                      ? textAreaElement.value
                      : mergedValue

                  if (canStartTriggerAtCursor(currentValue, cursorIndex)) {
                    openMentionPanel('keyboard', keyboardCharacter)
                  }
                }
                return
              }
            }

            if (open && triggerSource === 'keyboard') {
              scheduleCursorAnchorPosition()
            }

            if (event.key === 'Escape' && open) {
              closeMentionPanel()
            }
          }}
          footer={(_, info) => {
            const { SendButton, LoadingButton } = info.components

            return (
              <Flex align="center" justify="space-between" className={styles.footer}>
                <Flex align="center" className={styles.leftActions}>
                  {showEmployeeSelector && (
                    <Dropdown
                      trigger={['click']}
                      placement="topLeft"
                      open={isButtonMentionOpen}
                      onOpenChange={handleButtonDropdownOpenChange}
                      menu={buttonMentionMenu}
                      popupRender={renderMentionPopup}
                    >
                      <Tooltip title={resolvedEmployeeButtonLabel}>
                        <span>
                          <Button
                            type="text"
                            aria-label={resolvedEmployeeButtonLabel}
                            disabled={!(canEdit && buttonSuggestionItems.length)}
                            onClick={() => openMentionPanel('button')}
                          >
                            @
                          </Button>
                        </span>
                      </Tooltip>
                    </Dropdown>
                  )}

                  <Tooltip title={resolvedAttachButtonTitle}>
                    <Upload
                      multiple
                      showUploadList={false}
                      beforeUpload={() => false}
                      disabled={!canEdit}
                      onChange={({ file }) => {
                        const rawFile = getRawUploadFile(file)
                        if (rawFile) {
                          handleFileChange([rawFile])
                        }
                        senderRef.current?.focus?.()
                      }}
                    >
                      <Button
                        type="text"
                        aria-label={resolvedAttachButtonTitle}
                        disabled={!canEdit}
                        icon={<IconFont type="icon-dip-attachment" className={styles.actionIcon} />}
                      />
                    </Upload>
                  </Tooltip>

                  {showEmployeeSelector && !!employees.length && (
                    <Flex align="center" gap={8} className={styles.mentionTags}>
                      {employees.map((item, index) => (
                        <Tag
                          key={`${item.value}_${index}`}
                          closable
                          className={styles.mentionTag}
                          onClose={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            handleMentionRemove(item.value)
                          }}
                        >
                          <span className={styles.mentionTagContent}>
                            <span className={styles.mentionTagAvatar}>
                              {item.avatar ?? (
                                <Avatar
                                  size={18}
                                  style={{
                                    backgroundColor:
                                      mentionAvatarColors[index % mentionAvatarColors.length].bg,
                                    color:
                                      mentionAvatarColors[index % mentionAvatarColors.length].fg,
                                    fontSize: 11,
                                    flexShrink: 0,
                                  }}
                                >
                                  {getInitial(item.label)}
                                </Avatar>
                              )}
                            </span>
                            <span className={styles.mentionTagLabel}>{item.label}</span>
                          </span>
                        </Tag>
                      ))}
                    </Flex>
                  )}
                </Flex>

                {loading ? (
                  <Tooltip title={resolvedStopButtonTitle}>
                    <span>
                      <LoadingButton
                        type="primary"
                        shape="circle"
                        aria-label={resolvedStopButtonTitle as string}
                      />
                    </span>
                  </Tooltip>
                ) : (
                  <Tooltip title={resolvedSendButtonTitle}>
                    <span>
                      <SendButton
                        variant="text"
                        type="primary"
                        shape="circle"
                        aria-label={resolvedSendButtonTitle}
                        disabled={!(canSubmit && (mergedValue.trim() || attachments.length))}
                        icon={<SendOutlined />}
                      />
                    </span>
                  </Tooltip>
                )}
              </Flex>
            )
          }}
        />
      </div>
    </div>
  )
}

export default AiPromptInput

