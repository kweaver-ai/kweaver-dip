import { EditorContent, useEditor } from '@tiptap/react'
import type React from 'react'
import { useEffect, useRef } from 'react'
// import 'plyr/dist/plyr.css'
// import 'katex/dist/katex.css'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/animations/shift-away.css'
import './index.less'
import { StarterKit } from './extensions/starter-kit'

export interface TiptapEditorProps {
  initialContent?: any
  onChange?: (content: string) => void
  onUpdate?: (content: any) => void
  onLoadingStateChange?: (loading: boolean) => void
  readOnly?: boolean
  className?: string
  placeholder?: string
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({
  initialContent = {},
  onChange,
  onUpdate,
  onLoadingStateChange,
  readOnly = false,
  className = '',
  placeholder = 'Start writing...',
}) => {
  const initialContentRef = useRef(initialContent)
  const readOnlyRef = useRef(readOnly)
  const isProgrammaticUpdateRef = useRef(false)
  const isInitializingRef = useRef(true)
  const initializeTimerRef = useRef<number | null>(null)
  const PROGRAMMATIC_UPDATE_GUARD_MS = 120

  const lockEditor = (editor: any) => {
    isInitializingRef.current = true
    onLoadingStateChange?.(true)
    editor.setEditable(false)
  }

  const unlockEditorWithDelay = (editor: any) => {
    if (initializeTimerRef.current) {
      clearTimeout(initializeTimerRef.current)
      initializeTimerRef.current = null
    }
    initializeTimerRef.current = window.setTimeout(() => {
      isInitializingRef.current = false
      onLoadingStateChange?.(false)
      editor.setEditable(!readOnlyRef.current)
      initializeTimerRef.current = null
    }, PROGRAMMATIC_UPDATE_GUARD_MS)
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // 禁用其他不需要的扩展
        // details: false,
        // detailsContent: false,
        // detailsSummary: false,
        // table: false,
        // tableRow: false,
        // tableCell: false,
        // tableHeader: false,
        // emoji: false,
        // embed: false,
        // image: false,
        // audio: false,
        // video: false,
        // plantuml: false,
        // mathBlock: false,
        // mathInline: false,
        // uploader: false,
        // duplicateBlock: false,
        placeholder: {
          placeholder,
        },
      }),
    ],
    content: initialContentRef.current,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: `ProseMirror-editor ${className}`,
      },
    },
    onCreate: ({ editor }) => {
      lockEditor(editor)
      if (initialContentRef.current) {
        // 判断 content 类型：如果是字符串则用 markdown 解析，如果是对象则直接使用
        if (typeof initialContentRef.current === 'string' && (editor.storage as any).markdown) {
          const doc = (editor.storage as any).markdown.parse(initialContentRef.current)
          if (doc) {
            isProgrammaticUpdateRef.current = true
            editor.commands.setContent(doc.toJSON(), false)
            isProgrammaticUpdateRef.current = false
          }
        } else if (
          typeof initialContentRef.current === 'object' &&
          initialContentRef.current !== null
        ) {
          // 如果是 JSON 对象，直接设置内容
          isProgrammaticUpdateRef.current = true
          editor.commands.setContent(initialContentRef.current, false)
          isProgrammaticUpdateRef.current = false
        }
      }
      unlockEditorWithDelay(editor)
      // // 编辑器创建后，将光标聚焦到文档最前面
      // if (!readOnly) {
      //   // 使用 setTimeout 确保内容已渲染完成
      //   setTimeout(() => {
      //     editor.commands.setTextSelection(0)
      //     editor.commands.focus()
      //   }, 0)
      // }
    },
    onUpdate: ({ editor }) => {
      if (isInitializingRef.current) return
      if (isProgrammaticUpdateRef.current) return
      if ((editor.storage as any).markdown) {
        // const markdown = (editor.storage as any).markdown.get()
        // onUpdate?.(markdown)
        // onChange?.(markdown)
        onUpdate?.(editor.getJSON())
      }
    },
  })

  // useEffect(() => {
  //   if (editor && content !== initialContent.current) {
  //     // 判断 content 类型：如果是字符串则用 markdown 解析，如果是对象则直接使用
  //     if (typeof content === 'string' && (editor.storage as any).markdown) {
  //       const currentMarkdown = (editor.storage as any).markdown?.get()
  //       if (currentMarkdown !== content) {
  //         const doc = (editor.storage as any).markdown?.parse(content)
  //         if (doc) {
  //           editor.commands.setContent(doc.toJSON())
  //           // // 内容更新后，将光标聚焦到文档最前面
  //           // if (!readOnly) {
  //           //   setTimeout(() => {
  //           //     editor.commands.setTextSelection(0)
  //           //     editor.commands.focus()
  //           //   }, 0)
  //           // }
  //         }
  //       }
  //     } else if (typeof content === 'object' && content !== null) {
  //       // 如果是 JSON 对象，直接设置内容
  //       const currentContent = editor.getJSON()
  //       // 简单比较，避免不必要的更新
  //       if (JSON.stringify(currentContent) !== JSON.stringify(content)) {
  //         editor.commands.setContent(content)
  //         // // 内容更新后，将光标聚焦到文档最前面
  //         // if (!readOnly) {
  //         //   setTimeout(() => {
  //         //     editor.commands.setTextSelection(0)
  //         //     editor.commands.focus()
  //         //   }, 0)
  //         // }
  //       }
  //     }
  //     initialContent.current = content
  //   }
  // }, [content, editor, readOnly])

  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly && !isInitializingRef.current)
    }
  }, [readOnly, editor])

  useEffect(() => {
    readOnlyRef.current = readOnly
  }, [readOnly])

  useEffect(() => {
    initialContentRef.current = initialContent
  }, [initialContent])

  useEffect(() => {
    if (editor) {
      lockEditor(editor)
      isProgrammaticUpdateRef.current = true
      editor.commands.setContent(initialContentRef.current, false)
      isProgrammaticUpdateRef.current = false
      unlockEditorWithDelay(editor)
    }
  }, [initialContent, editor])

  useEffect(() => {
    onLoadingStateChange?.(true)
    return () => {
      if (initializeTimerRef.current) {
        clearTimeout(initializeTimerRef.current)
        initializeTimerRef.current = null
      }
    }
  }, [onLoadingStateChange])

  return (
    <div className="tiptap-editor-wrapper">
      <EditorContent editor={editor} />
    </div>
  )
}

export default TiptapEditor
