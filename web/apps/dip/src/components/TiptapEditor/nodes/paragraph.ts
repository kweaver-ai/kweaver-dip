import {
  Paragraph as TParagraph,
  type ParagraphOptions as TParagraphOptions,
} from '@tiptap/extension-paragraph'
import type { BlockMenuItemStorage, ClickMenuItemStorage, NodeMarkdownStorage } from '../types'
import { icon } from '../utils/icons'

export interface ParagraphOptions extends TParagraphOptions {
  dictionary: {
    name: string
  }
}

export const Paragraph = TParagraph.extend<ParagraphOptions>({
  name: 'paragraph',
  addOptions() {
    return {
      ...this.parent?.(),
      HTMLAttributes: {},
      dictionary: {
        name: '正文',
      },
    }
  },
  addStorage() {
    return {
      ...this.parent?.(),
      markdown: {
        parser: {
          match: (node: any) => node.type === 'paragraph',
          apply: (state: any, node: any, type: any) => {
            state.openNode(type)
            if (node.children) {
              state.next(node.children)
            } else {
              state.addText(node.value)
            }
            state.closeNode()
          },
        },
        serializer: {
          match: (node: any) => node.type.name === this.name,
          apply: (state: any, node: any) => {
            state.openNode({ type: 'paragraph' })
            if (node.type.name === 'text') {
              state.addNode({
                type: 'text',
                value: node.text,
              })
            } else {
              state.next(node.content)
            }
            state.closeNode()
          },
        },
      },
      blockMenu: {
        items: [
          {
            id: this.name,
            name: this.options.dictionary.name,
            icon: icon('paragraph'),
            shortcut: 'Mod-Alt-0',
            keywords: 'paragraph,p,lyj',
            action: (editor: any) => editor.chain().toggleParagraph().focus().run(),
          },
        ],
      },
      clickMenu: {
        items: [
          {
            id: this.name,
            name: this.options.dictionary.name,
            icon: icon('paragraph'),
            action: (editor: any) => editor.chain().setParagraph().focus().run(),
          },
        ],
      },
    } satisfies ClickMenuItemStorage & BlockMenuItemStorage & NodeMarkdownStorage
  },
  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      // 换行时清除 stored marks，避免加粗/斜体等格式延续到新段落
      // 在 blockquote、listItem 等内部时返回 false，让它们处理自己的 Enter 行为
      Enter: ({ editor }) => {
        const { state } = editor
        const { selection } = state
        const { $from } = selection

        editor.view.dispatch(editor.state.tr.setStoredMarks([]))

        for (let d = $from.depth; d > 0; d--) {
          const node = $from.node(d)
          if (['blockquote', 'listItem', 'detailsContent', 'codeBlock'].includes(node.type.name)) {
            return false
          }
        }

        return editor.commands.splitBlock()
      },
      // Backspace: ({ editor }) => {
      //   const { state } = editor
      //   const { selection } = state
      //   const { $from, empty } = selection

      //   // 只在光标位置且在段落开头时处理
      //   if (!empty || $from.parentOffset !== 0) {
      //     return false
      //   }

      //   // 检查当前节点是否是段落
      //   const currentNode = $from.parent
      //   if (currentNode.type.name !== 'paragraph') {
      //     return false
      //   }

      //   // 获取前一个节点
      //   const index = $from.index($from.depth - 1)
      //   if (index === 0) {
      //     return false // 已经是第一个节点
      //   }

      //   const prevNode = $from.node($from.depth - 1).child(index - 1)

      //   // 如果前一个节点是列表（bulletList 或 orderedList）
      //   if (prevNode.type.name === 'bulletList' || prevNode.type.name === 'orderedList') {
      //     // 获取列表的最后一个列表项
      //     const lastListItem = prevNode.lastChild
      //     if (lastListItem && lastListItem.type.name === 'listItem') {
      //       // 计算最后一个列表项的末尾位置
      //       const listEndPos = $from.before($from.depth) - 1 // 段落开始位置的前一个位置

      //       // 将光标移动到列表项末尾
      //       editor.commands.focus(listEndPos)
      //       return true
      //     }
      //   }

      //   // 其他情况使用默认行为
      //   return false
      // },
    }
  },
})
