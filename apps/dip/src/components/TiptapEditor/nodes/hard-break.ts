import {
  HardBreak as THardBreak,
  type HardBreakOptions as THardBreakOptions,
} from '@tiptap/extension-hard-break'

export interface HardBreakOptions extends THardBreakOptions {}

export const HardBreak = THardBreak.extend<HardBreakOptions>({
  name: 'hardBreak',
  addStorage() {
    return {
      ...this.parent?.(),
      markdown: {
        parser: {
          match: (node: any) => node.type === 'break',
          apply: (state: any, _node: any, type: any) => {
            state.addNode(type)
          },
        },
        serializer: {
          match: (node: any) => node.type.name === this.name,
          apply: (state: any) => {
            state.addNode({
              type: 'break',
            })
          },
        },
        hooks: {
          // 解析前清理硬换行的两个空格，避免粘贴时显示
          beforeParse: (markdown: string) => {
            return markdown.replace(/ {2}\n/g, '\n')
          },
          // 序列化后清理硬换行的两个空格，避免复制时带入
          afterSerialize: (markdown: string) => {
            return markdown.replace(/ {2}\n/g, '\n')
          },
        },
      },
    }
  },
})
