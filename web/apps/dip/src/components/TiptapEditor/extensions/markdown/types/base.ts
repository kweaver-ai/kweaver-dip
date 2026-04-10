import type { Data } from 'mdast'
import type { Node as UnistNode } from 'unist'

export interface Attrs {
  [key: string]: any
}

export interface MarkdownNode extends UnistNode {
  data?: Data & Record<string, any>
  children?: Array<MarkdownNode>
  [key: string]: any
}

declare module 'unist' {
  interface Data {
    hName?: string
    hProperties?: {
      className?: string[]
    }
  }
}
