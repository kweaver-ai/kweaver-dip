import { Extension, isActive } from '@tiptap/core'
import { Slice } from '@tiptap/pm/model'
import { type EditorState, Plugin, PluginKey } from '@tiptap/pm/state'
import type { MarkdownStorage } from '../markdown'

export interface ClipboardOptions {
  isInCode: (state: EditorState) => boolean
  isMarkdown: (value: string) => boolean
}

export const Clipboard = Extension.create<ClipboardOptions>({
  name: 'clipboard',
  addOptions() {
    return {
      isInCode: (state) => {
        try {
          return isActive(state, 'codeBlock') || isActive(state, 'code')
        } catch {
          return false
        }
      },
      isMarkdown: (value) => {
        // code-ish
        if (value.match(/^```/gm)) {
          return true
        }

        // link-ish
        if (value.match(/\[[\s\S]+\]\(https?:\/\/\S+\)/g)) {
          return true
        }
        if (value.match(/\[[\s\S]+\]\(\/\S+\)/g)) {
          return true
        }

        // heading-ish
        if (value.match(/^#{1,6}\s+\S+/gm)) {
          return true
        }

        // list-ish
        if (value.match(/^[-*\d].?\s\S+/gm)) {
          return true
        }

        // blockquote 由 blockquote 扩展自己处理

        return false
      },
    }
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey(`${this.name}-handler`),
        props: {
          handlePaste: (view, event) => {
            const editable = this.editor.isEditable
            const clipboardData = event.clipboardData

            if (!(editable && clipboardData) || clipboardData.files.length !== 0) {
              return false
            }

            const text = clipboardData.getData('text/plain')
            const html = clipboardData.getData('text/html')

            // 在代码块中，只粘贴纯文本
            if (this.options.isInCode(view.state)) {
              event.preventDefault()
              view.dispatch(view.state.tr.insertText(text))
              return true
            }

            // 如果有 HTML，优先使用 Tiptap 的默认 HTML 处理器
            // 这样可以正确处理 <br>、<strong> 等标签
            if (html && html.length > 0) {
              return false // 让 Tiptap 默认处理
            }

            // 只有纯文本（没有 HTML）时，才检查是否为 Markdown
            const isMarkdownResult = this.options.isMarkdown(text)

            if (isMarkdownResult) {
              const markdownStorage = (this.editor.storage as any).markdown as MarkdownStorage
              // HardBreak 的 beforeParse hook 会自动清理 Markdown 中的两个空格
              const slice = markdownStorage.parse(text)
              if (!slice || typeof slice === 'string') {
                return false
              }

              const contentSlice = view.state.selection.content()
              view.dispatch(
                view.state.tr.replaceSelection(
                  new Slice(slice.content, contentSlice.openStart, contentSlice.openEnd),
                ),
              )
              return true
            }

            // 检查纯文本是否包含 HTML 标签（如从文本编辑器复制的 <u>text</u>）
            if (text.match(/<[^>]+>/)) {
              event.preventDefault()
              this.editor.commands.insertContent(text)
              return true
            }

            // 其他情况，让 Tiptap 默认处理
            return false
          },
          clipboardTextSerializer: (slice) => {
            const doc = this.editor.schema.topNodeType.createAndFill(undefined, slice.content)
            if (!doc) {
              return ''
            }
            const markdownStorage = (this.editor.storage as any).markdown as MarkdownStorage
            // HardBreak 的 afterSerialize hook 会自动清理两个空格
            return markdownStorage.serialize(doc)
          },
        },
      }),
    ]
  },
})
