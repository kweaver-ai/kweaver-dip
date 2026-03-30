import '@wangeditor/editor/dist/css/style.css'
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Editor, Toolbar } from '@wangeditor/editor-for-react'
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import classNames from 'classnames'
import { message } from 'antd'
import { debounce, throttle } from 'lodash'
import __ from './locale'
import styles from './styles.module.less'

const PERFORMANCE_CONFIG = {
    CONTENT_LENGTH_THRESHOLD: 10000,
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 100,
    EDITOR_HEIGHT: '500px',
    MAX_RENDER_LINES: 1000,
    PERFORMANCE_MONITOR_INTERVAL: 2000,
}

function TextEditor({
    value,
    onChange,
    placeholder,
    className,
    readOnly = false,
    excludeKeys = null,
}: any) {
    const [editor, setEditor] = useState<IDomEditor | null>(null)
    const [content, setContent] = useState('')
    const [isOptimized, setIsOptimized] = useState(false)
    const debouncedOnChangeRef = useRef<any>(null)
    const throttledOnChangeRef = useRef<any>(null)
    const contentLengthRef = useRef(0)
    const lastChangeTimeRef = useRef(0)
    const performanceMonitorRef = useRef<ReturnType<typeof setInterval> | null>(
        null,
    )

    const createDebouncedOnChange = useCallback(
        (callback: (value: string) => void) => {
            return debounce((contentValue: string) => {
                callback(contentValue)
            }, PERFORMANCE_CONFIG.DEBOUNCE_DELAY)
        },
        [],
    )

    const createThrottledOnChange = useCallback(
        (callback: (value: string) => void) => {
            return throttle((contentValue: string) => {
                callback(contentValue)
            }, PERFORMANCE_CONFIG.THROTTLE_DELAY)
        },
        [],
    )

    const startPerformanceMonitoring = useCallback(() => {
        if (performanceMonitorRef.current) {
            clearInterval(performanceMonitorRef.current)
        }

        performanceMonitorRef.current = setInterval(() => {
            const now = Date.now()
            const timeSinceLastChange = now - lastChangeTimeRef.current

            if (
                timeSinceLastChange < 1000 &&
                contentLengthRef.current >
                    PERFORMANCE_CONFIG.CONTENT_LENGTH_THRESHOLD
            ) {
                setIsOptimized(true)
            }
        }, PERFORMANCE_CONFIG.PERFORMANCE_MONITOR_INTERVAL)
    }, [])

    const stopPerformanceMonitoring = useCallback(() => {
        if (performanceMonitorRef.current) {
            clearInterval(performanceMonitorRef.current)
            performanceMonitorRef.current = null
        }
    }, [])

    const safeClearContent = useCallback(() => {
        try {
            if (editor) {
                editor.setHtml('')
                setContent('')
                onChange?.('')
            }
        } catch (error) {
            // console.warn('Safe clear content failed:', error)
            try {
                setContent('')
                onChange?.('')
            } catch (resetError) {
                // console.error('Content reset failed:', resetError)
            }
        }
    }, [editor, onChange])

    const handleSlateError = useCallback(
        (error: any) => {
            // console.warn('Slate DOM node resolution error:', error)

            if (
                error?.message?.includes(
                    'Cannot resolve a DOM node from Slate node',
                ) ||
                error?.message?.includes('DOM node') ||
                error?.message?.includes('Slate node')
            ) {
                try {
                    if (editor) {
                        setTimeout(() => {
                            try {
                                editor.setHtml('')
                                setContent('')
                                onChange?.('')
                            } catch (resetError) {
                                // console.error('Force reset failed:', resetError)
                                setContent('')
                                onChange?.('')
                            }
                        }, 0)
                    } else {
                        setContent('')
                        onChange?.('')
                    }
                } catch (finalError) {
                    // console.error('Final error handling failed:', finalError)
                }
            }
        },
        [editor, onChange],
    )

    const checkContentLength = useCallback(
        (htmlContent: string) => {
            if (
                !htmlContent ||
                htmlContent === '<p><br></p>' ||
                htmlContent === '<p></p>'
            ) {
                contentLengthRef.current = 0
                if (isOptimized) {
                    setIsOptimized(false)
                    stopPerformanceMonitoring()
                }
                return 0
            }

            const { length } = htmlContent
            contentLengthRef.current = length

            if (
                length > PERFORMANCE_CONFIG.CONTENT_LENGTH_THRESHOLD &&
                !isOptimized
            ) {
                setIsOptimized(true)
                startPerformanceMonitoring()
            } else if (
                length <= PERFORMANCE_CONFIG.CONTENT_LENGTH_THRESHOLD &&
                isOptimized
            ) {
                setIsOptimized(false)
                stopPerformanceMonitoring()
            }

            return length
        },
        [isOptimized, startPerformanceMonitoring, stopPerformanceMonitoring],
    )

    const handleContentChange = useCallback(
        (htmlContent: string) => {
            try {
                const cleanedContent =
                    htmlContent === '<p><br></p>' ||
                    htmlContent === '<p></p>' ||
                    htmlContent === '' ||
                    htmlContent.trim() === ''
                        ? ''
                        : htmlContent

                lastChangeTimeRef.current = Date.now()
                const contentLength = checkContentLength(cleanedContent)
                setContent(cleanedContent)

                if (
                    contentLength > PERFORMANCE_CONFIG.CONTENT_LENGTH_THRESHOLD
                ) {
                    if (!throttledOnChangeRef.current) {
                        throttledOnChangeRef.current =
                            createThrottledOnChange(onChange)
                    }
                    throttledOnChangeRef.current(cleanedContent)
                } else if (
                    contentLength >
                    PERFORMANCE_CONFIG.CONTENT_LENGTH_THRESHOLD / 2
                ) {
                    if (!debouncedOnChangeRef.current) {
                        debouncedOnChangeRef.current =
                            createDebouncedOnChange(onChange)
                    }
                    debouncedOnChangeRef.current(cleanedContent)
                } else {
                    onChange?.(cleanedContent)
                }
            } catch (error) {
                // console.warn('Content processing failed:', error)
                handleSlateError(error)
            }
        },
        [
            onChange,
            checkContentLength,
            createDebouncedOnChange,
            createThrottledOnChange,
            handleSlateError,
        ],
    )

    useEffect(() => {
        if (value !== content) {
            const newContent = value ?? ''
            if (
                newContent.trim() === '' ||
                newContent === '<p><br></p>' ||
                newContent === '<p></p>'
            ) {
                setContent('')
                checkContentLength('')
            } else {
                setContent(newContent)
                checkContentLength(newContent)
            }
        }
    }, [value, checkContentLength])

    const toolbarConfig: Partial<IToolbarConfig> = useMemo(
        () => ({
            excludeKeys: excludeKeys || [
                'uploadVideo',
                'insertVideo',
                'group-video',
                'group-image',
                'uploadImage',
                'insertImage',
            ],
        }),
        [excludeKeys],
    )

    const editorConfig: Partial<IEditorConfig> = useMemo(
        () => ({
            placeholder: placeholder || __('请输入'),
            readOnly,
            autoFocus: false,
            ...(isOptimized && {
                EXTEND_CONF: {
                    mentionConfig: {
                        showModal: false,
                    },
                },
                customAlert: () => {},
            }),
            customAlert: (info: string, type: string) => {
                // console.warn('Editor alert:', info, type)
                if (type === 'error') {
                    handleSlateError({ message: info })
                }
            },
            MENU_CONF: {
                uploadImage: {
                    async customUpload(file: File, insertFn) {
                        if (file?.size > 1024 * 1024) {
                            message.warning('图片大小超过1M，请调整后再上传')
                        }
                    },
                    base64LimitSize: 1024 * 1024,
                },
            },
        }),
        [placeholder, readOnly, isOptimized, handleSlateError],
    )

    useEffect(() => {
        return () => {
            if (editor == null) return
            try {
                editor.setHtml('')
                editor.destroy()
            } catch (error) {
                // console.warn('Editor destroy error:', error)
            } finally {
                setEditor(null)
            }

            if (debouncedOnChangeRef.current) {
                debouncedOnChangeRef.current.cancel()
            }
            if (throttledOnChangeRef.current) {
                throttledOnChangeRef.current.cancel()
            }
            stopPerformanceMonitoring()
        }
    }, [editor, stopPerformanceMonitoring])

    useEffect(() => {
        return () => {
            if (debouncedOnChangeRef.current) {
                debouncedOnChangeRef.current.cancel()
            }
            if (throttledOnChangeRef.current) {
                throttledOnChangeRef.current.cancel()
            }
            stopPerformanceMonitoring()
        }
    }, [stopPerformanceMonitoring])

    useEffect(() => {
        const handleGlobalError = (event: ErrorEvent) => {
            const error = event.error || event.message
            if (
                typeof error === 'string' &&
                (error.includes('Cannot resolve a DOM node from Slate node') ||
                    error.includes('DOM node') ||
                    error.includes('Slate node'))
            ) {
                event.preventDefault()
                // console.warn('Global Slate error caught:', error)
                handleSlateError({ message: error })
            }
        }

        window.addEventListener('error', handleGlobalError)
        return () => {
            window.removeEventListener('error', handleGlobalError)
        }
    }, [handleSlateError])

    return (
        <div>
            <div className={classNames(styles['text-editor'], className)}>
                <Toolbar
                    editor={editor}
                    defaultConfig={toolbarConfig}
                    mode="default"
                    style={{ borderBottom: '1px solid #d9d9d9' }}
                />
                <Editor
                    defaultContent={undefined}
                    defaultHtml={undefined}
                    defaultConfig={editorConfig}
                    value={content}
                    onCreated={(editorInstance) => {
                        setEditor(editorInstance)
                        try {
                            if (content && editorInstance) {
                                if (
                                    content.trim() === '' ||
                                    content === '<p><br></p>' ||
                                    content === '<p></p>'
                                ) {
                                    editorInstance.setHtml('')
                                    setContent('')
                                } else {
                                    editorInstance.setHtml(content)
                                }
                            }
                        } catch (error) {
                            // console.warn('Editor initialization failed:', error)
                            handleSlateError(error)
                        }
                    }}
                    onChange={(e) => {
                        try {
                            const htmlContent = e.getHtml()
                            if (!htmlContent || htmlContent.trim() === '') {
                                handleContentChange('')
                            } else {
                                handleContentChange(htmlContent)
                            }
                        } catch (error) {
                            // console.warn(
                            //     'Editor content change processing failed:',
                            //     error,
                            // )
                            handleSlateError(error)
                        }
                    }}
                    mode="default"
                    style={{
                        height: PERFORMANCE_CONFIG.EDITOR_HEIGHT,
                        overflowY: isOptimized ? 'auto' : 'hidden',
                        ...(isOptimized && {
                            contain: 'content',
                            willChange: 'scroll-position',
                            transform: 'translateZ(0)',
                        }),
                    }}
                />
            </div>
        </div>
    )
}

export default TextEditor
