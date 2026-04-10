import { mergeAttributes, Node } from '@tiptap/core'
import type { BlockMenuItemStorage } from '../../extensions/block-menu/menu'
import type { NodeMarkdownStorage } from '../../extensions/markdown'
import { renderIconFont } from '../../utils/icons'
import MetricView from './view'

export interface MetricOptions {
  HTMLAttributes: Record<string, any>
  dictionary: {
    name: string
  }
}

/** 指标节点 */
export const Metric = Node.create<MetricOptions>({
  name: 'metric',
  inline: true,
  group: 'inline',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      metric: {
        default: null,
        parseHTML: (element) => {
          const metricAttr = element.getAttribute('data-metric')
          if (metricAttr) {
            try {
              const parsed = JSON.parse(metricAttr)
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
          const metric = attributes.metric
          if (!metric?.id) {
            return {}
          }
          // 只保存 id 和 name
          const simplified = {
            id: metric.id || '',
            name: metric.name || '',
          }
          return {
            'data-metric': JSON.stringify(simplified),
          }
        },
      },
    }
  },

  addOptions() {
    return {
      HTMLAttributes: {},
      dictionary: {
        name: '指标',
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-type="metric"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'metric' })]
  },

  addNodeView() {
    return MetricView
  },

  addStorage() {
    return {
      markdown: {
        parser: {
          match: (node) => node.type === 'textDirective' && node.name === this.name,
          apply: (state: any, node: any, type: any) => {
            // 从 markdown 属性中解析 metric 对象
            const attrs: any = {}
            if (node.attributes?.metric) {
              try {
                const parsed = JSON.parse(node.attributes.metric)
                if (parsed && typeof parsed === 'object') {
                  attrs.metric = {
                    id: parsed.id || '',
                    name: parsed.name || '',
                  }
                } else {
                  attrs.metric = null
                }
              } catch {
                attrs.metric = null
              }
            } else {
              attrs.metric = null
            }
            state.addNode(type, attrs)
          },
        },
        serializer: {
          match: (node) => node.type.name === this.name,
          apply: (state: any, node: any) => {
            // 将 metric 对象转换为 JSON 字符串，以便在 markdown 中正确序列化
            const attributes: Record<string, string> = {}
            if (node.attrs.metric?.id) {
              attributes.metric = JSON.stringify({
                id: node.attrs.metric.id,
                name: node.attrs.metric.name || '',
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
            icon: renderIconFont({ type: 'icon-a-zhibiaomoxing1' }),
            keywords: 'metric,指标,zb',
            action: (editor: any) =>
              editor.chain().insertContent({ type: this.name }).focus().run(),
          },
        ],
      },
    } satisfies NodeMarkdownStorage & BlockMenuItemStorage
  },
})
