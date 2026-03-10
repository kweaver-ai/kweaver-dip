import { InputRule } from '@tiptap/core'
import {
  Blockquote as IBlockquote,
  type BlockquoteOptions as TBlockquoteOptions,
} from '@tiptap/extension-blockquote'
import { Slice } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { MarkdownStorage } from '../extensions/markdown'
import type { BlockMenuItemStorage, ClickMenuItemStorage, NodeMarkdownStorage } from '../types'
import { icon } from '../utils/icons'

export interface BlockquoteOptions extends TBlockquoteOptions {
  dictionary: {
    name: string
  }
}

export const Blockquote = IBlockquote.extend<BlockquoteOptions>({
  name: 'blockquote',
  addOptions() {
    return {
      ...this.parent?.(),
      HTMLAttributes: {},
      dictionary: {
        name: '引用',
      },
    }
  },
  addStorage() {
    return {
      ...this.parent?.(),
      markdown: {
        parser: {
          match: (node: any) => node.type === 'blockquote',
          apply: (state: any, node: any, type: any) => {
            state.openNode(type)
            state.next(node.children)
            state.closeNode()
          },
        },
        serializer: {
          match: (node: any) => node.type.name === this.name,
          apply: (state: any, node: any) => {
            state.openNode({ type: 'blockquote' })
            state.next(node.content)
            state.closeNode()
          },
        },
      },
      blockMenu: {
        items: [
          {
            id: this.name,
            name: this.options.dictionary.name,
            icon: icon('blockquote'),
            shortcut: 'Mod-Shift-B',
            keywords: 'blockquote,bq,yyk',
            action: (editor: any) => editor.chain().toggleBlockquote().focus().run(),
          },
        ],
      },
      clickMenu: {
        items: [
          {
            id: this.name,
            name: this.options.dictionary.name,
            icon: icon('blockquote'),
            action: (editor: any) => editor.chain().toggleBlockquote().focus().run(),
          },
        ],
      },
    } satisfies BlockMenuItemStorage & ClickMenuItemStorage & NodeMarkdownStorage
  },
  addInputRules() {
    return [
      // 自定义 input rule：输入 '> ' 自动转为 blockquote
      // 避免与前一个 blockquote 合并
      new InputRule({
        find: /^\s*>\s$/,
        handler: ({ range, chain }) => {
          const { from, to } = range

          // 删除匹配的文本并包装为 blockquote
          chain().deleteRange({ from, to }).setBlockquote().run()
        },
      }),
    ]
  },
  // addKeyboardShortcuts() {
  //   return {
  //     Enter: ({ editor }) => {
  //       const { state } = editor
  //       const { selection } = state
  //       const { $from } = selection

  //       // 检查是否在 blockquote 中
  //       let inBlockquote = false
  //       for (let d = $from.depth; d > 0; d--) {
  //         if ($from.node(d).type.name === this.name) {
  //           inBlockquote = true
  //           break
  //         }
  //       }

  //       if (!inBlockquote) {
  //         return false
  //       }

  //       // 检查当前段落是否为空（$from.parent 是 paragraph）
  //       const isCurrentParagraphEmpty = $from.parent.textContent.length === 0

  //       if (isCurrentParagraphEmpty) {
  //         // 如果当前段落为空，退出 blockquote，变为普通段落
  //         return editor.chain().lift(this.type).run()
  //       }

  //       // 如果当前段落有内容，使用默认的回车行为（创建新段落）
  //       return false
  //     },
  //   }
  // },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('blockquote-paste'),
        props: {
          handlePaste: (view, event) => {
            const clipboardData = event.clipboardData
            if (!clipboardData) {
              return false
            }

            const text = clipboardData.getData('text/plain')

            // 检查是否为 blockquote 格式的 Markdown
            if (text.match(/^>\s/gm)) {
              const markdownStorage = (this.editor.storage as any).markdown as MarkdownStorage
              if (!markdownStorage) {
                return false
              }

              // 解析 Markdown，但需要手动处理空段落的位置
              // 规则：> 的数量 = 段落数 + (段落数 - 1)
              // 所以：段落数 = (> 的数量 + 1) / 2
              // 奇数索引的 > 是分隔符，偶数索引的 > 是段落

              const lines = text.split('\n')
              const quoteLines = lines.filter((line) => {
                const trimmed = line.trim()
                return trimmed === '>' || trimmed.startsWith('> ')
              })

              // 分析段落结构
              // 索引 0, 2, 4, ... 是段落
              // 索引 1, 3, 5, ... 是分隔符
              const paragraphStructure: Array<'content' | 'empty'> = []

              for (let i = 0; i < quoteLines.length; i += 2) {
                // 每隔一个取一个（跳过分隔符）
                const line = quoteLines[i].trim()
                if (line.length > 1) {
                  paragraphStructure.push('content')
                } else {
                  paragraphStructure.push('empty')
                }
              }

              // 解析 Markdown
              let slice = markdownStorage.parse(text)
              if (!slice || typeof slice === 'string') {
                return false
              }

              // 递归处理 blockquote 节点，修复空段落
              // 策略：基于当前层级的 > 行数量来计算应该有多少个段落
              const processBlockquote = (
                node: any,
                textLines: string[],
                depth: number = 1,
              ): any => {
                if (node.type.name !== 'blockquote') {
                  return node
                }

                // 收集解析出的子节点
                const parsedChildren = []
                for (let i = 0; i < node.childCount; i++) {
                  const child = node.child(i)
                  parsedChildren.push(child)
                }

                // 分析当前层级的段落结构
                // 使用索引规则：0, 2, 4... 是段落，1, 3, 5... 是分隔符
                const paragraphStructure: Array<'content' | 'empty' | 'nested'> = []
                const prefix = Array(depth).fill('>').join(' ')
                let inNestedBlock = false
                let lineIndex = 0

                for (const line of textLines) {
                  const trimmed = line.trim()
                  const parts = trimmed.split(/\s+/)
                  let quoteCount = 0
                  for (const part of parts) {
                    if (part === '>') {
                      quoteCount++
                    } else {
                      break
                    }
                  }

                  if (quoteCount < depth) {
                    // 不在当前层级
                    inNestedBlock = false
                    continue
                  }

                  // 索引规则：偶数索引是段落，奇数索引是分隔符
                  if (lineIndex % 2 === 0) {
                    // 这是段落位置
                    if (quoteCount === depth) {
                      // 恰好是当前层级
                      const afterPrefix = trimmed.substring(prefix.length).trim()
                      if (afterPrefix.length > 0) {
                        paragraphStructure.push('content')
                      } else {
                        paragraphStructure.push('empty')
                      }
                      inNestedBlock = false
                    } else if (quoteCount > depth && !inNestedBlock) {
                      // 嵌套层级的开始
                      paragraphStructure.push('nested')
                      inNestedBlock = true
                    }
                  }

                  lineIndex++
                }

                // 根据 paragraphStructure 和解析出的子节点重新组装
                const newContent = []
                const paragraphType = view.state.schema.nodes.paragraph
                let childIndex = 0

                for (const type of paragraphStructure) {
                  if (type === 'empty') {
                    // 空段落
                    newContent.push(paragraphType.create())
                  } else {
                    // 有内容的段落或嵌套的 blockquote
                    if (childIndex < parsedChildren.length) {
                      const child = parsedChildren[childIndex]
                      if (child.type.name === 'blockquote') {
                        // 递归处理嵌套的 blockquote
                        newContent.push(processBlockquote(child, textLines, depth + 1))
                      } else {
                        newContent.push(child)
                      }
                      childIndex++
                    }
                  }
                }

                return node.type.create(node.attrs, newContent)
              }

              // 处理顶层 blockquote
              const blockquoteNode = slice.content.firstChild
              if (blockquoteNode && blockquoteNode.type.name === 'blockquote') {
                const newBlockquote = processBlockquote(blockquoteNode, lines)
                slice = view.state.schema.topNodeType.create(null, newBlockquote)
              }

              event.preventDefault()
              const contentSlice = view.state.selection.content()
              view.dispatch(
                view.state.tr.replaceSelection(
                  new Slice(slice.content, contentSlice.openStart, contentSlice.openEnd),
                ),
              )
              return true
            }

            return false
          },
        },
      }),
    ]
  },
})
