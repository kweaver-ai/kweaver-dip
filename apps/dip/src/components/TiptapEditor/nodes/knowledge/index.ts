import { mergeAttributes, Node } from '@tiptap/core'
import type { BlockMenuItemStorage } from '../../extensions/block-menu/menu'
import type { NodeMarkdownStorage } from '../../extensions/markdown'
import { renderIconFont } from '../../utils/icons'
import KnowledgeView from './view'

export interface KnowledgeOptions {
  HTMLAttributes: Record<string, any>
  dictionary: {
    name: string
  }
}

/** 知识网络节点 */
export const Knowledge = Node.create<KnowledgeOptions>({
  name: 'knowledge',
  inline: true,
  group: 'inline',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      knowledge: {
        default: null,
        parseHTML: (element) => {
          const knowledgeAttr = element.getAttribute('data-knowledge')
          if (knowledgeAttr) {
            try {
              const parsed = JSON.parse(knowledgeAttr)
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
          const knowledge = attributes.knowledge
          if (!knowledge?.id) {
            return {}
          }
          // 只保存 id 和 name
          const simplified = {
            id: knowledge.id || '',
            name: knowledge.name || '',
          }
          return {
            'data-knowledge': JSON.stringify(simplified),
          }
        },
      },
    }
  },

  addOptions() {
    return {
      HTMLAttributes: {},
      dictionary: {
        name: '业务知识网络',
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-type="knowledge"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'knowledge' })]
  },

  addNodeView() {
    return KnowledgeView
  },

  addStorage() {
    return {
      markdown: {
        parser: {
          match: (node) => node.type === 'textDirective' && node.name === this.name,
          apply: (state: any, node: any, type: any) => {
            // 从 markdown 属性中解析 knowledge 对象
            const attrs: any = {}
            if (node.attributes?.knowledge) {
              try {
                const parsed = JSON.parse(node.attributes.knowledge)
                if (parsed && typeof parsed === 'object') {
                  attrs.knowledge = {
                    id: parsed.id || '',
                    name: parsed.name || '',
                  }
                } else {
                  attrs.knowledge = null
                }
              } catch {
                attrs.knowledge = null
              }
            } else {
              attrs.knowledge = null
            }
            state.addNode(type, attrs)
          },
        },
        serializer: {
          match: (node) => node.type.name === this.name,
          apply: (state: any, node: any) => {
            // 将 knowledge 对象转换为 JSON 字符串，以便在 markdown 中正确序列化
            const attributes: Record<string, string> = {}
            if (node.attrs.knowledge?.id) {
              attributes.knowledge = JSON.stringify({
                id: node.attrs.knowledge.id,
                name: node.attrs.knowledge.name || '',
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
            icon: renderIconFont({ type: 'icon-yewuzhishiwangluo' }),
            keywords: 'knowledge,card,zs,network,zswl',
            action: (editor: any) =>
              editor.chain().insertContent({ type: this.name }).focus().run(),
          },
        ],
      },
    } satisfies NodeMarkdownStorage & BlockMenuItemStorage
  },
})
