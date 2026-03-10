import { mergeAttributes, Node } from '@tiptap/core'
import type { BlockMenuItemStorage } from '../../extensions/block-menu/menu'
import type { NodeMarkdownStorage } from '../../extensions/markdown'
import { renderIconFont } from '../../utils/icons'
import AgentView from './view'

export interface AgentOptions {
  HTMLAttributes: Record<string, any>
  dictionary: {
    name: string
  }
}

/** 智能体节点 */
export const Agent = Node.create<AgentOptions>({
  name: 'agent',
  inline: true,
  group: 'inline',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      agent: {
        default: null,
        parseHTML: (element) => {
          const agentAttr = element.getAttribute('data-agent')
          if (agentAttr) {
            try {
              const parsed = JSON.parse(agentAttr)
              // 确保只保留 id 和 name
              if (parsed && typeof parsed === 'object') {
                return {
                  id: parsed.id || '',
                  name: parsed.name || '',
                }
              }
              return null
            } catch {
              return null
            }
          }
          return null
        },
        renderHTML: (attributes) => {
          const agent = attributes.agent
          if (!agent?.id) {
            return {}
          }
          // 只保存 id 和 name
          const simplified = {
            id: agent.id || '',
            name: agent.name || '',
          }
          return {
            'data-agent': JSON.stringify(simplified),
          }
        },
      },
    }
  },

  addOptions() {
    return {
      HTMLAttributes: {},
      dictionary: {
        name: '决策智能体',
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-type="agent"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'agent' })]
  },

  addNodeView() {
    return AgentView
  },

  addStorage() {
    return {
      markdown: {
        parser: {
          match: (node) => node.type === 'textDirective' && node.name === this.name,
          apply: (state: any, node: any, type: any) => {
            // 从 markdown 属性中解析 agent 对象
            const attrs: any = {}
            if (node.attributes?.agent) {
              try {
                const parsed = JSON.parse(node.attributes.agent)
                if (parsed && typeof parsed === 'object') {
                  attrs.agent = {
                    id: parsed.id || '',
                    name: parsed.name || '',
                  }
                } else {
                  attrs.agent = null
                }
              } catch {
                attrs.agent = null
              }
            } else {
              attrs.agent = null
            }
            state.addNode(type, attrs)
          },
        },
        serializer: {
          match: (node) => node.type.name === this.name,
          apply: (state: any, node: any) => {
            // 将 agent 对象转换为 JSON 字符串，以便在 markdown 中正确序列化
            const attributes: Record<string, string> = {}
            if (node.attrs.agent?.id) {
              attributes.agent = JSON.stringify({
                id: node.attrs.agent.id,
                name: node.attrs.agent.name || '',
              })
            }
            state.addNode({
              type: 'textDirective',
              name: this.name,
              attributes,
            })
          },
        },
      },
      blockMenu: {
        items: [
          {
            id: this.name,
            name: this.options.dictionary.name,
            icon: renderIconFont({ type: 'icon-Agent' }),
            keywords: 'agent,智能体,agent,zn',
            action: (editor: any) =>
              editor.chain().insertContent({ type: this.name }).focus().run(),
          },
        ],
      },
    } satisfies NodeMarkdownStorage & BlockMenuItemStorage
  },
})
