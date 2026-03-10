import { Extension } from '@tiptap/core'
import type { ClickMenuItemStorage } from '../../types'
import { icon } from '../../utils/icons'
import { serializeForClipboard } from '../../utils/serialize'

/** 复制节点 */
export const CopyBlock = Extension.create({
  name: 'copyBlock',

  addOptions() {
    return {
      dictionary: {
        name: '复制',
      },
    }
  },

  addStorage() {
    return {
      clickMenu: {
        items: [
          {
            id: this.name,
            name: this.options.dictionary.name,
            icon: icon('copy'),
            action: async (editor: any, { selection }: any) => {
              const slice = selection.content()
              const { dom, text } = serializeForClipboard(editor.view, slice)

              // 将 DOM 转换为 HTML 字符串
              const html = dom.innerHTML

              // 使用 Clipboard API 同时写入 HTML 和文本格式
              // 这样粘贴时能保留格式（如高亮）
              try {
                if (typeof ClipboardItem !== 'undefined') {
                  const clipboardItem = new ClipboardItem({
                    'text/html': new Blob([html], { type: 'text/html' }),
                    'text/plain': new Blob([text], { type: 'text/plain' }),
                  })
                  await navigator.clipboard.write([clipboardItem])
                } else {
                  // 不支持 ClipboardItem 时，回退到只写入文本
                  await navigator.clipboard.writeText(text)
                }
              } catch (error) {
                // 如果写入失败，回退到只写入文本
                console.warn('Failed to write HTML to clipboard, falling back to text:', error)
                await navigator.clipboard.writeText(text)
              }
            },
          },
        ],
      },
    } satisfies ClickMenuItemStorage
  },
})
