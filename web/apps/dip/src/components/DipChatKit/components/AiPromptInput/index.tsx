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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import intl from 'react-intl-universal'
import IconFont from '@/components/IconFont'
import ResizeObserver from '@/components/ResizeObserver'
import useResizeObserver from '@/hooks/useResizeObserver'
import { getDigitalHumanList } from '../../apis'
import styles from './index.module.less'
import type {
  AiPromptInputProps,
  AiPromptMentionOption,
  AiPromptSubmitPayload,
  CursorAnchorPosition,
} from './types'
import {
  filterMentionOptionsByQuery,
  getAttachmentFileKey,
  getContentEditableCaretPosition,
  getContentEditableTextBeforeCursor,
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
const employeeSlotKey = 'ai_prompt_input_employee_slot'
const caretPlaceholder = '\u200b'

type SenderSlotItem = NonNullable<SenderProps['slotConfig']>[number]
const emptySenderSlotConfig: NonNullable<SenderProps['slotConfig']> = []

type CaretSnapshot =
  | {
      type: 'textarea'
      start: number
      end: number
    }
  | {
      type: 'contentEditable'
      range: Range
    }

const sanitizeEditorValue = (inputValue: string): string => {
  return inputValue.replace(/\u200b/g, '')
}

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
  const keyboardOpenRafRef = useRef<number | null>(null)
  const rebuildVersionRef = useRef(0)
  const isRebuildingContentRef = useRef(false)
  const suppressNextSubmitRef = useRef(false)
  const caretSnapshotRef = useRef<CaretSnapshot | null>(null)
  const isMentionMenuMouseDownRef = useRef(false)
  const latestTextValueRef = useRef(defaultValue)
  const [buttonMentionOpen, setButtonMentionOpen] = useState(false)
  const [keyboardMentionOpen, setKeyboardMentionOpen] = useState(false)
  const [activeKeyboardCharacter, setActiveKeyboardCharacter] = useState<string | null>(null)
  const [mentionQuery, setMentionQuery] = useState('')
  const [keyboardActiveIndex, setKeyboardActiveIndex] = useState(-1)
  const [cursorAnchor, setCursorAnchor] = useState<CursorAnchorPosition>({ left: 0, top: 0 })
  const [innerValue, setInnerValue] = useState(defaultValue)
  const [attachments, setAttachments] = useState<File[]>([])
  const [fileColSpan, setFileColSpan] = useState(6)
  const [employees, setEmployees] = useState<AiPromptMentionOption[]>([])
  const [fetchedEmployeeOptions, setFetchedEmployeeOptions] = useState<AiPromptMentionOption[]>([])

  const mergedValue = value ?? innerValue
  const normalizedMergedValue = sanitizeEditorValue(mergedValue)
  const canEdit = !disabled
  const canSubmit = !(disabled || loading)
  const normalizedAssignEmployeeValue = assignEmployeeValue?.trim() || ''
  const showEmployeeSelector = !normalizedAssignEmployeeValue
  const resolvedEmployeePanelTitle =
    employeePanelTitle ?? intl.get('aiPromptInput.mentionPanelTitle')
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
      latestTextValueRef.current = value
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
        message.error(
          intl
            .get('dipChatKit.fetchDigitalHumanListFailed')
            .d('鑾峰彇鏁板瓧鍛樺伐鍒楄〃澶辫触锛岃绋嶅悗閲嶈瘯'),
        )
      }
    }

    void loadDigitalHumanList()

    return () => {
      disposed = true
    }
  }, [employeeOptions.length])

  useEffect(() => {
    if (normalizedAssignEmployeeValue) {
      const assignedEmployee = resolvedEmployeeOptions.find(
        (item) => item.value === normalizedAssignEmployeeValue,
      ) ?? {
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
    const items = Array.isArray(triggerCharacter)
      ? triggerCharacter.filter((item) => item.character)
      : []

    if (showEmployeeSelector) {
      items.push({
        character: '@',
        options: resolvedEmployeeOptions,
      })
    }

    return items
  }, [resolvedEmployeeOptions, showEmployeeSelector, triggerCharacter])

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
    keyboardMentionOpen && senderRef.current?.inputElement instanceof HTMLElement
      ? senderRef.current.inputElement
      : null

  const keyboardMentionOptions = useMemo(() => {
    return filterMentionOptionsByQuery(keyboardMentionBaseOptions, mentionQuery)
  }, [keyboardMentionBaseOptions, mentionQuery])

  const keyboardMentionOptionMap = useMemo(() => {
    return new Map(keyboardMentionOptions.map((item) => [item.value, item]))
  }, [keyboardMentionOptions])

  const selectedEmployee = employees[0]
  const selectedEmployeeKey = selectedEmployee?.value ?? ''

  const createEmployeeSlotItem = useCallback((item: AiPromptMentionOption): SenderSlotItem => {
    const color = mentionAvatarColors[0]
    return {
      type: 'custom',
      key: employeeSlotKey,
      props: {
        defaultValue: item.value,
        employeeValue: item.value,
      },
      formatResult: () => '',
      customRender: () => {
        return (
          <Tag className={styles.employeeSlotTag}>
            <span className={styles.employeeSlotTagContent}>
              <span className={styles.employeeSlotTagAvatar}>
                {item.avatar ?? (
                  <Avatar
                    size={18}
                    style={{
                      backgroundColor: color.bg,
                      color: color.fg,
                      fontSize: 11,
                      flexShrink: 0,
                    }}
                  >
                    {getInitial(item.label)}
                  </Avatar>
                )}
              </span>
              <span className={styles.employeeSlotTagLabel}>{item.label}</span>
            </span>
          </Tag>
        )
      },
    }
  }, [])

  const rebuildSenderContent = useCallback(
    (nextContent: string, nextEmployee?: AiPromptMentionOption) => {
      const senderInstance = senderRef.current
      if (!senderInstance) return

      latestTextValueRef.current = sanitizeEditorValue(nextContent)

      const insertItems: SenderSlotItem[] = []
      if (showEmployeeSelector && nextEmployee) {
        insertItems.push(createEmployeeSlotItem(nextEmployee))
      }
      if (nextContent) {
        insertItems.push({
          type: 'text',
          value: nextContent,
        })
      }

      const currentVersion = rebuildVersionRef.current + 1
      rebuildVersionRef.current = currentVersion
      isRebuildingContentRef.current = true

      senderInstance.clear?.()
      if (insertItems.length) {
        senderInstance.insert?.(insertItems, 'start', undefined, true)
      }

      requestAnimationFrame(() => {
        if (rebuildVersionRef.current !== currentVersion) return
        isRebuildingContentRef.current = false
      })
    },
    [createEmployeeSlotItem, showEmployeeSelector],
  )

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

  const keyboardActiveOption = keyboardMentionOptions[keyboardActiveIndex]
  const keyboardActiveKey = keyboardActiveOption?.value

  const keyboardSuggestionItems = useMemo(() => {
    return buildSuggestionItems(keyboardMentionOptions)
  }, [keyboardMentionOptions])

  const clearAnchorRaf = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  const clearKeyboardOpenRaf = () => {
    if (keyboardOpenRafRef.current !== null) {
      cancelAnimationFrame(keyboardOpenRafRef.current)
      keyboardOpenRafRef.current = null
    }
  }

  const getCursorAnchorPosition = (): CursorAnchorPosition | null => {
    const inputElement = senderRef.current?.inputElement
    if (!(inputElement instanceof HTMLElement && cardRef.current)) return null

    if (inputElement instanceof HTMLTextAreaElement) {
      const cursorIndex = inputElement.selectionStart ?? inputElement.value.length
      const caretPosition = getTextAreaCaretPosition(inputElement, cursorIndex)
      const textAreaRect = inputElement.getBoundingClientRect()
      const cardRect = cardRef.current.getBoundingClientRect()

      const left = textAreaRect.left - cardRect.left + caretPosition.left
      const top = textAreaRect.top - cardRect.top + caretPosition.top

      return {
        left: Math.max(left, 8),
        top: Math.max(top, 8),
      }
    }

    return getContentEditableCaretPosition(inputElement, cardRef.current)
  }

  const updateCursorAnchorPosition = () => {
    const nextPosition = getCursorAnchorPosition()
    if (!nextPosition) return
    setCursorAnchor(nextPosition)
  }

  const scheduleCursorAnchorPosition = () => {
    clearAnchorRaf()
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      updateCursorAnchorPosition()
    })
  }

  const openMentionPanel = () => {
    if (!(canEdit && showEmployeeSelector)) return
    if (!buttonSuggestionItems.length) return
    captureCaretSnapshot()
    clearKeyboardOpenRaf()
    setActiveKeyboardCharacter(null)
    setMentionQuery('')
    setKeyboardMentionOpen(false)
    setButtonMentionOpen(true)
  }

  const closeKeyboardMentionPanel = () => {
    clearKeyboardOpenRaf()
    setKeyboardMentionOpen(false)
    setActiveKeyboardCharacter(null)
    setMentionQuery('')
    setKeyboardActiveIndex(-1)
  }

  const openKeyboardMentionPanel = () => {
    clearKeyboardOpenRaf()
    updateCursorAnchorPosition()

    if (keyboardMentionOpen) {
      scheduleCursorAnchorPosition()
      return
    }

    setButtonMentionOpen(false)
    keyboardOpenRafRef.current = requestAnimationFrame(() => {
      keyboardOpenRafRef.current = null
      setKeyboardMentionOpen(true)
    })
  }

  const closeMentionPanel = () => {
    setButtonMentionOpen(false)
    closeKeyboardMentionPanel()
    isMentionMenuMouseDownRef.current = false
  }

  const suppressSubmitForCurrentFrame = () => {
    suppressNextSubmitRef.current = true
    requestAnimationFrame(() => {
      suppressNextSubmitRef.current = false
    })
  }

  const captureCaretSnapshot = () => {
    caretSnapshotRef.current = null
    const inputElement = senderRef.current?.inputElement
    if (!(inputElement instanceof HTMLElement)) {
      return
    }

    if (inputElement instanceof HTMLTextAreaElement) {
      const nextStart = inputElement.selectionStart ?? inputElement.value.length
      const nextEnd = inputElement.selectionEnd ?? nextStart
      caretSnapshotRef.current = {
        type: 'textarea',
        start: nextStart,
        end: nextEnd,
      }
      return
    }

    const selection = window.getSelection()
    if (!(selection && selection.rangeCount > 0)) return

    const range = selection.getRangeAt(0)
    if (!inputElement.contains(range.startContainer)) return

    caretSnapshotRef.current = {
      type: 'contentEditable',
      range: range.cloneRange(),
    }
  }

  const restoreCaretSnapshot = () => {
    const snapshot = caretSnapshotRef.current
    caretSnapshotRef.current = null
    const inputElement = senderRef.current?.inputElement
    if (!(snapshot && inputElement instanceof HTMLElement)) {
      senderRef.current?.focus?.()
      return
    }

    senderRef.current?.focus?.()
    requestAnimationFrame(() => {
      if (!(senderRef.current?.inputElement instanceof HTMLElement)) return

      if (snapshot.type === 'textarea' && inputElement instanceof HTMLTextAreaElement) {
        const textLength = inputElement.value.length
        const start = Math.min(snapshot.start, textLength)
        const end = Math.min(snapshot.end, textLength)
        inputElement.setSelectionRange(start, end)
        return
      }

      if (snapshot.type === 'contentEditable') {
        if (
          !(
            snapshot.range.startContainer.isConnected &&
            snapshot.range.endContainer.isConnected &&
            inputElement.contains(snapshot.range.startContainer) &&
            inputElement.contains(snapshot.range.endContainer)
          )
        ) {
          normalizeCaretAfterEmployeeSlot()
          return
        }
        const selection = window.getSelection()
        if (!selection) return
        selection.removeAllRanges()
        selection.addRange(snapshot.range)
      }
    })
  }

  const normalizeCaretAfterEmployeeSlot = () => {
    requestAnimationFrame(() => {
      if (!showEmployeeSelector) return

      const inputElement = senderRef.current?.inputElement
      if (!(inputElement instanceof HTMLElement)) return
      if (inputElement instanceof HTMLTextAreaElement) return

      const slotNode = inputElement.querySelector(`[data-slot-key="${employeeSlotKey}"]`)
      if (!slotNode) return

      const currentContent = sanitizeEditorValue(
        senderRef.current?.getValue?.().value ?? latestTextValueRef.current,
      )
      if (currentContent.length > 0) return

      placeCaretAfterEmployeeSlot()
    })
  }

  const placeCaretAfterEmployeeSlot = () => {
    senderRef.current?.focus?.()

    requestAnimationFrame(() => {
      const inputElement = senderRef.current?.inputElement
      if (!(inputElement instanceof HTMLElement)) return
      if (inputElement instanceof HTMLTextAreaElement) return

      const selection = window.getSelection()
      if (!selection) return

      const slotNode = inputElement.querySelector(`[data-slot-key="${employeeSlotKey}"]`)
      const range = document.createRange()

      if (slotNode?.parentNode) {
        const nextSibling = slotNode.nextSibling
        let caretAnchor: Text
        let caretOffset = 0

        if (nextSibling?.nodeType === Node.TEXT_NODE) {
          caretAnchor = nextSibling as Text
          if (!caretAnchor.data.length) {
            caretAnchor.data = caretPlaceholder
            caretOffset = 1
          }
        } else {
          caretAnchor = document.createTextNode(caretPlaceholder)
          slotNode.parentNode.insertBefore(caretAnchor, nextSibling ?? null)
          caretOffset = 1
        }

        range.setStart(caretAnchor, caretOffset)
        range.collapse(true)
      } else {
        range.selectNodeContents(inputElement)
        range.collapse(false)
      }

      selection.removeAllRanges()
      selection.addRange(range)
    })
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
    if (suppressNextSubmitRef.current) {
      suppressNextSubmitRef.current = false
      return
    }

    const nextContent = sanitizeEditorValue(content).trim()
    const hasContentOrFiles = Boolean(nextContent || attachments.length)
    if (!(hasContentOrFiles && canSubmit)) {
      return
    }

    const slotConfigFromSender = senderRef.current?.getValue?.().slotConfig
    const slotEmployee = (() => {
      const slot = slotConfigFromSender?.find((item) => item.key === employeeSlotKey)
      if (!(slot && 'props' in slot)) return undefined

      const slotEmployeeValue =
        (slot.props as { employeeValue?: string } | undefined)?.employeeValue?.trim() ?? ''
      if (!slotEmployeeValue) return undefined

      return (
        buttonMentionOptionMap.get(slotEmployeeValue) ?? {
          value: slotEmployeeValue,
          label: slotEmployeeValue,
        }
      )
    })()

    const submitEmployees =
      employees.length > 0
        ? employees
        : slotEmployee
          ? [slotEmployee]
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
      latestTextValueRef.current = ''
    } else {
      onChange?.('')
    }

    clearAttachments()
    rebuildSenderContent('', selectedEmployee)
    closeMentionPanel()
  }

  const removeLastTriggerText = (content: string, triggerText: string): string => {
    if (!triggerText) return content
    const index = content.lastIndexOf(triggerText)
    if (index < 0) return content
    return `${content.slice(0, index)}${content.slice(index + triggerText.length)}`
  }

  const handleMentionSelect = (option: AiPromptMentionOption, source: 'button' | 'keyboard') => {
    if (!canEdit) return

    const isEmployeeSelection = buttonMentionOptionMap.has(option.value)

    if (!isEmployeeSelection) {
      const mentionCharacter = activeKeyboardCharacter ?? '@'
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
        `${mentionCharacter}${mentionQuery}`,
      )
      closeMentionPanel()
      senderRef.current?.focus?.()
      return
    }

    onEmployeeSelect?.(option)

    if (source === 'keyboard') {
      const mentionCharacter = activeKeyboardCharacter ?? '@'
      const replaceText = `${mentionCharacter}${mentionQuery}`
      const currentContent = sanitizeEditorValue(
        senderRef.current?.getValue?.().value ?? latestTextValueRef.current,
      )
      const nextContent = removeLastTriggerText(currentContent, replaceText)
      setEmployees([option])
      rebuildSenderContent(nextContent, option)
      closeMentionPanel()
      senderRef.current?.focus?.()
      normalizeCaretAfterEmployeeSlot()
      return
    }

    const currentContent = sanitizeEditorValue(
      senderRef.current?.getValue?.().value ?? latestTextValueRef.current,
    )
    setEmployees([option])
    rebuildSenderContent(currentContent, option)

    closeMentionPanel()
    restoreCaretSnapshot()
    normalizeCaretAfterEmployeeSlot()
  }

  const handleButtonMentionMenuClick: MenuProps['onClick'] = ({ key }) => {
    const clickedKey = String(key)
    if (clickedKey === selectedEmployeeKey) {
      closeMentionPanel()
      restoreCaretSnapshot()
      normalizeCaretAfterEmployeeSlot()
      return
    }

    const option = buttonMentionOptionMap.get(clickedKey)
    if (!option) return
    handleMentionSelect(option, 'button')
  }

  const handleKeyboardMentionMenuClick: MenuProps['onClick'] = ({ key }) => {
    const clickedKey = String(key)
    const isKeyboardEmployeeMenu = showEmployeeSelector && activeKeyboardCharacter === '@'
    if (isKeyboardEmployeeMenu && clickedKey === selectedEmployeeKey) {
      closeMentionPanel()
      restoreCaretSnapshot()
      normalizeCaretAfterEmployeeSlot()
      return
    }

    const option = keyboardMentionOptionMap.get(clickedKey)
    if (!option) return
    handleMentionSelect(option, 'keyboard')
  }

  const handleButtonDropdownOpenChange = (nextOpen: boolean) => {
    if (!(showEmployeeSelector && canEdit && buttonSuggestionItems.length)) {
      closeMentionPanel()
      return
    }

    if (nextOpen) {
      clearKeyboardOpenRaf()
      setKeyboardMentionOpen(false)
      setButtonMentionOpen(true)
      setActiveKeyboardCharacter(null)
      setMentionQuery('')
      return
    }

    setButtonMentionOpen(false)
    setActiveKeyboardCharacter(null)
    setMentionQuery('')
  }

  const handleKeyboardDropdownOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      closeKeyboardMentionPanel()
    }
  }

  const resolveEmployeeFromSlotConfig = (
    slotConfig?: Readonly<SenderSlotItem[]>,
  ): AiPromptMentionOption | undefined => {
    const slot = slotConfig?.find((item) => item.key === employeeSlotKey)
    if (!(slot && 'props' in slot)) return undefined

    const employeeValue =
      (slot.props as { employeeValue?: string } | undefined)?.employeeValue?.trim() ?? ''
    if (!employeeValue) return undefined

    return (
      buttonMentionOptionMap.get(employeeValue) ?? {
        value: employeeValue,
        label: employeeValue,
      }
    )
  }

  useEffect(() => {
    return () => {
      clearAnchorRaf()
      clearKeyboardOpenRaf()
    }
  }, [])

  useEffect(() => {
    if (!keyboardMentionOpen) return

    const inputElement = senderRef.current?.inputElement
    if (!(inputElement instanceof HTMLElement)) return

    scheduleCursorAnchorPosition()

    const onScroll = () => {
      updateCursorAnchorPosition()
    }

    const onWindowResize = () => {
      updateCursorAnchorPosition()
    }

    const onSelectionChange = () => {
      updateCursorAnchorPosition()
    }

    inputElement.addEventListener('scroll', onScroll)
    document.addEventListener('selectionchange', onSelectionChange)
    window.addEventListener('resize', onWindowResize)

    return () => {
      inputElement.removeEventListener('scroll', onScroll)
      document.removeEventListener('selectionchange', onSelectionChange)
      window.removeEventListener('resize', onWindowResize)
    }
  }, [keyboardMentionOpen])

  useResizeObserver({
    target: keyboardResizeTarget,
    enabled: Boolean(keyboardResizeTarget),
    onResize: () => {
      updateCursorAnchorPosition()
    },
  })

  useEffect(() => {
    if (!keyboardMentionOpen) return
    if (!keyboardSuggestionItems.length) {
      closeKeyboardMentionPanel()
    }
  }, [keyboardMentionOpen, keyboardSuggestionItems.length])

  useEffect(() => {
    if (!keyboardMentionOpen) {
      setKeyboardActiveIndex(-1)
      return
    }

    if (!keyboardMentionOptions.length) {
      setKeyboardActiveIndex(-1)
      return
    }

    if (showEmployeeSelector && activeKeyboardCharacter === '@' && selectedEmployeeKey) {
      const selectedIndex = keyboardMentionOptions.findIndex(
        (item) => item.value === selectedEmployeeKey,
      )
      if (selectedIndex >= 0) {
        setKeyboardActiveIndex(selectedIndex)
        return
      }
    }

    setKeyboardActiveIndex(0)
  }, [
    activeKeyboardCharacter,
    keyboardMentionOpen,
    keyboardMentionOptions,
    selectedEmployeeKey,
    showEmployeeSelector,
  ])

  useEffect(() => {
    if (keyboardMentionOpen && !keyboardTriggerCharacters.length) {
      closeKeyboardMentionPanel()
    }
  }, [keyboardMentionOpen, keyboardTriggerCharacters.length])

  useEffect(() => {
    if (showEmployeeSelector || !(buttonMentionOpen || keyboardMentionOpen)) return
    closeMentionPanel()
  }, [buttonMentionOpen, keyboardMentionOpen, showEmployeeSelector])

  useEffect(() => {
    if (!showEmployeeSelector) return

    const senderInstance = senderRef.current
    if (!senderInstance) return

    const senderValue = senderInstance.getValue?.()
    const currentContent = senderValue?.value ?? latestTextValueRef.current
    const currentEmployeeSlot = senderValue?.slotConfig?.find(
      (item) => item.key === employeeSlotKey,
    )
    const currentEmployeeValue = String(
      currentEmployeeSlot && 'props' in currentEmployeeSlot
        ? ((currentEmployeeSlot.props as { employeeValue?: string } | undefined)?.employeeValue ??
            '')
        : '',
    )
    const nextEmployeeValue = selectedEmployee?.value ?? ''

    if (currentEmployeeValue === nextEmployeeValue) return

    rebuildSenderContent(currentContent, selectedEmployee)

    if (selectedEmployee && sanitizeEditorValue(currentContent).length === 0) {
      normalizeCaretAfterEmployeeSlot()
    }
  }, [rebuildSenderContent, selectedEmployee, showEmployeeSelector])

  useEffect(() => {
    if (!(showEmployeeSelector && value !== undefined)) return

    const senderContent = senderRef.current?.getValue?.().value ?? ''
    if (senderContent === value) return

    rebuildSenderContent(value, selectedEmployee)

    if (selectedEmployee && sanitizeEditorValue(value).length === 0) {
      normalizeCaretAfterEmployeeSlot()
    }
  }, [rebuildSenderContent, selectedEmployee, showEmployeeSelector, value])

  const markMentionMenuMouseDown = () => {
    if (!buttonMentionOpen) {
      captureCaretSnapshot()
    }
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
    selectable: true,
    selectedKeys: selectedEmployeeKey ? [selectedEmployeeKey] : [],
    onClick: handleButtonMentionMenuClick,
  }

  const keyboardSelectedKeys = (() => {
    if (!(showEmployeeSelector && activeKeyboardCharacter === '@')) {
      return []
    }

    if (keyboardActiveKey) {
      return [keyboardActiveKey]
    }

    if (selectedEmployeeKey) {
      return [selectedEmployeeKey]
    }

    return []
  })()

  const keyboardMentionMenu = {
    items: keyboardSuggestionItems,
    selectable: true,
    selectedKeys: keyboardSelectedKeys,
    onClick: handleKeyboardMentionMenuClick,
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

  const isButtonMentionOpen = buttonMentionOpen && buttonSuggestionItems.length > 0
  const isKeyboardMentionOpen = keyboardMentionOpen && keyboardSuggestionItems.length > 0

  return (
    <div className={clsx('AiPromptInput', styles.root, className)}>
      <div ref={cardRef} className={styles.card}>
        <Dropdown
          trigger={[]}
          placement="bottomLeft"
          destroyOnHidden
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
          slotConfig={showEmployeeSelector ? emptySenderSlotConfig : undefined}
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
          onChange={(nextValue, _event, slotConfigFromSender) => {
            const normalizedNextValue = sanitizeEditorValue(nextValue)
            latestTextValueRef.current = normalizedNextValue
            if (value === undefined) {
              setInnerValue(normalizedNextValue)
            }
            onChange?.(normalizedNextValue)

            if (showEmployeeSelector && !isRebuildingContentRef.current) {
              const effectiveSlotConfig =
                slotConfigFromSender ?? senderRef.current?.getValue?.().slotConfig

              if (effectiveSlotConfig !== undefined) {
                const employeeFromSlot = resolveEmployeeFromSlotConfig(effectiveSlotConfig)
                setEmployees((prev) => {
                  const prevValue = prev[0]?.value ?? ''
                  const nextEmployeeValue = employeeFromSlot?.value ?? ''
                  if (prevValue === nextEmployeeValue) return prev
                  return employeeFromSlot ? [employeeFromSlot] : []
                })
              }
            }

            if (!keyboardTriggerCharacters.length) {
              closeKeyboardMentionPanel()
              return
            }

            const inputElement = senderRef.current?.inputElement
            let valueBeforeCursor = normalizedNextValue
            if (inputElement instanceof HTMLTextAreaElement) {
              const cursorIndex = inputElement.selectionStart ?? normalizedNextValue.length
              valueBeforeCursor = normalizedNextValue.slice(0, cursorIndex)
            } else if (inputElement instanceof HTMLElement) {
              const textBeforeCursor = getContentEditableTextBeforeCursor(inputElement)
              valueBeforeCursor = textBeforeCursor
            }

            const triggerMatch = parseTriggerQueryBeforeCursor(
              valueBeforeCursor,
              valueBeforeCursor.length,
              keyboardTriggerCharacters,
            )
            if (triggerMatch === null) {
              closeKeyboardMentionPanel()
              return
            }

            const triggerOptions = keyboardTriggerOptionMap.get(triggerMatch.character) ?? []
            if (!triggerOptions.length) {
              closeKeyboardMentionPanel()
              return
            }

            setActiveKeyboardCharacter(triggerMatch.character)
            setMentionQuery(triggerMatch.query)
            openKeyboardMentionPanel()
          }}
          onSubmit={handleSubmit}
          onCancel={() => {
            onStop?.()
          }}
          onBlur={() => {
            if (isMentionMenuMouseDownRef.current) return
            if (buttonMentionOpen || keyboardMentionOpen || keyboardOpenRafRef.current !== null) {
              closeMentionPanel()
            }
          }}
          onKeyDown={(event) => {
            if (
              showEmployeeSelector &&
              !keyboardMentionOpen &&
              selectedEmployeeKey &&
              normalizedMergedValue.length === 0 &&
              (event.key === 'Backspace' || event.key === 'Delete')
            ) {
              event.preventDefault()
              setEmployees([])
              rebuildSenderContent('')
              closeMentionPanel()
              senderRef.current?.focus?.()
              return
            }

            if (keyboardMentionOpen && event.key === 'Enter') {
              event.preventDefault()
              event.stopPropagation()
            }

            const isKeyboardEmployeeMenuOpen =
              keyboardMentionOpen &&
              showEmployeeSelector &&
              activeKeyboardCharacter === '@' &&
              keyboardMentionOptions.length > 0
            const isComposing = Boolean(event.nativeEvent.isComposing)

            if (isKeyboardEmployeeMenuOpen) {
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                setKeyboardActiveIndex((prev) => {
                  const current = prev >= 0 ? prev : -1
                  return (current + 1) % keyboardMentionOptions.length
                })
                return
              }

              if (event.key === 'ArrowUp') {
                event.preventDefault()
                setKeyboardActiveIndex((prev) => {
                  const current = prev >= 0 ? prev : 0
                  return (
                    (current - 1 + keyboardMentionOptions.length) % keyboardMentionOptions.length
                  )
                })
                return
              }

              if (event.key === 'Enter' && !isComposing) {
                suppressSubmitForCurrentFrame()
                const normalizedIndex = keyboardActiveIndex >= 0 ? keyboardActiveIndex : 0
                const activeOption = keyboardMentionOptions[normalizedIndex]
                if (!activeOption) return

                if (activeOption.value === selectedEmployeeKey) {
                  closeMentionPanel()
                  restoreCaretSnapshot()
                  return
                }

                handleMentionSelect(activeOption, 'keyboard')
                return
              }
            }

            if (keyboardMentionOpen) {
              scheduleCursorAnchorPosition()
            }

            if (
              event.key === 'Escape' &&
              (buttonMentionOpen || keyboardMentionOpen || keyboardOpenRafRef.current !== null)
            ) {
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
                      destroyOnHidden
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
                            onMouseDownCapture={captureCaretSnapshot}
                            onClick={openMentionPanel}
                            icon={<IconFont type="icon-at" className={styles.actionIcon} />}
                          />
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
                        icon={<IconFont type="icon-attachment" className={styles.actionIcon} />}
                      />
                    </Upload>
                  </Tooltip>
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
                        disabled={
                          !(canSubmit && (normalizedMergedValue.trim() || attachments.length))
                        }
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
