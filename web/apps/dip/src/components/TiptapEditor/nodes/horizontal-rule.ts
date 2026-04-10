import { findParentNode } from '@tiptap/core'
import {
  HorizontalRule as THorizontalRule,
  type HorizontalRuleOptions as THorizontalRuleOptions,
} from '@tiptap/extension-horizontal-rule'
import { Fragment } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { BlockMenuItemStorage } from '../types'
import { icon } from '../utils/icons'

export interface HorizontalRuleOptions extends THorizontalRuleOptions {
  dictionary: {
    name: string
  }
}

export const HorizontalRule = THorizontalRule.extend<HorizontalRuleOptions>({
  name: 'horizontalRule',
  addOptions() {
    return {
      ...this.parent?.(),
      HTMLAttributes: {},
      nextNodeType: 'paragraph heading',
      dictionary: {
        name: '分割线',
      },
    }
  },
  addStorage() {
    return {
      ...this.parent?.(),
      markdown: {
        parser: {
          match: (node: any) => node.type === 'thematicBreak',
          apply: (state: any, _node: any, type: any) => {
            state.addNode(type)
          },
        },
        serializer: {
          match: (node: any) => node.type.name === this.name,
          apply: (state: any) => {
            state.addNode({
              type: 'thematicBreak',
            })
          },
        },
      },
      blockMenu: {
        items: [
          {
            id: this.name,
            name: this.options.dictionary.name,
            icon: icon('hr'),
            keywords: 'horizontalrule,hr,hx,fgx',
            action: (editor: any) => editor.chain().setHorizontalRule().focus().run(),
          },
        ],
      },
    } satisfies BlockMenuItemStorage
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('horizontalRule-paste'),
        props: {
          handlePaste: (view, event) => {
            const clipboardData = event.clipboardData
            if (!clipboardData) {
              return false
            }

            const text = clipboardData.getData('text/plain')
            if (!text) {
              return false
            }

            // 检查是否为分割线格式：---, ***, ___ (至少3个连续的字符，前后可以有空格)
            // 支持单行或多行，每行都是分割线格式
            const horizontalRulePattern = /^\s*(---|\*\*\*|___)\s*$/
            const lines = text
              .split('\n')
              .map((line) => line.trim())
              .filter((line) => line.length > 0)

            // 如果所有非空行都是分割线格式，则转换为分割线节点
            if (lines.length > 0 && lines.every((line) => horizontalRulePattern.test(line))) {
              event.preventDefault()
              const { state, dispatch } = view
              const { selection } = state
              const { from, to } = selection

              // 检查当前选择是否在空段落中
              const parentParagraph = findParentNode((node) => node.type.name === 'paragraph')(
                selection,
              )
              const isEmptyParagraph =
                parentParagraph && parentParagraph.node.content.size === 0 && selection.empty

              // 构建要插入的节点数组：分割线和段落交替
              const nodesToInsert = []
              for (let i = 0; i < lines.length; i++) {
                nodesToInsert.push(this.type.create())
                // 如果不是最后一行，插入段落作为分隔
                if (i < lines.length - 1) {
                  nodesToInsert.push(state.schema.nodes.paragraph.create())
                }
              }

              // 如果在空段落中粘贴，在最后添加一个空段落以便继续输入
              if (isEmptyParagraph) {
                nodesToInsert.push(state.schema.nodes.paragraph.create())
              }

              const fragment = Fragment.from(nodesToInsert)
              let tr = state.tr

              if (isEmptyParagraph && parentParagraph) {
                // 如果当前在空段落中，替换整个段落
                const paragraphStart = parentParagraph.pos
                const paragraphEnd = parentParagraph.pos + parentParagraph.node.nodeSize
                tr = tr.replaceWith(paragraphStart, paragraphEnd, fragment)
              } else {
                // 否则删除选中的文本并插入节点
                tr = tr.delete(from, to).insert(from, fragment)
              }

              dispatch(tr)
              return true
            }

            return false
          },
        },
      }),
    ]
  },
})
