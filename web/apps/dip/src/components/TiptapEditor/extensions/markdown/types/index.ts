import type { Mark, MarkType, Node, NodeType } from '@tiptap/pm/model'
import type { Processor } from 'unified'
import type { MarkdownNode } from './base'
import type { IParserState } from './parser-state'
import type { ISerializerState } from './serializer-state'

export type { Attrs, MarkdownNode } from './base'
export type { IParserState } from './parser-state'
export type { ISerializerState } from './serializer-state'

export interface MarkMarkdownStorage {
  markdown?: {
    parser?: {
      match: (node: MarkdownNode) => boolean
      apply: (state: IParserState, node: MarkdownNode, type: MarkType) => void
    }
    serializer?: {
      match: (mark: Mark) => boolean
      apply: (state: ISerializerState, mark: Mark, node: Node) => boolean
    }
    hooks?: {
      beforeInit?: (processor: Processor) => Processor
      afterInit?: (processor: Processor) => Processor
      beforeParse?: (markdown: string) => string
      afterParse?: (root: MarkdownNode) => MarkdownNode
      beforeSerialize?: (root: MarkdownNode) => MarkdownNode
      afterSerialize?: (markdown: string) => string
    }
  }
}

export interface NodeMarkdownStorage {
  markdown?: {
    parser?: {
      match: (node: MarkdownNode) => boolean
      apply: (state: IParserState, node: MarkdownNode, type: NodeType) => void
    }
    serializer?: {
      match: (node: Node) => boolean
      apply: (state: ISerializerState, node: Node) => void
    }
    hooks?: {
      beforeInit?: (processor: Processor) => Processor
      afterInit?: (processor: Processor) => Processor
      beforeParse?: (markdown: string) => string
      afterParse?: (root: MarkdownNode) => MarkdownNode
      beforeSerialize?: (root: MarkdownNode) => MarkdownNode
      afterSerialize?: (markdown: string) => string
    }
  }
}
