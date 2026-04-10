import { type AnyExtension, Extension } from '@tiptap/core'
import { Dropcursor, type DropcursorOptions } from '@tiptap/extension-dropcursor'
import { Gapcursor } from '@tiptap/extension-gapcursor'
import { History, type HistoryOptions } from '@tiptap/extension-history'
import { Placeholder } from '@tiptap/extensions'
import { Bold, type BoldOptions } from '../../marks/bold'
import { Code, type CodeOptions } from '../../marks/code'
import { Highlight, type HighlightOptions } from '../../marks/highlight'
import { Italic, type ItalicOptions } from '../../marks/italic'
import { Link, type LinkOptions } from '../../marks/link'
import { Strike, type StrikeOptions } from '../../marks/strike'
import { Subscript, type SubscriptOptions } from '../../marks/sub'
import { Superscript, type SuperscriptOptions } from '../../marks/sup'
import { Underline, type UnderlineOptions } from '../../marks/underline'
import { Agent, type AgentOptions } from '../../nodes/agent'
// import { Audio, type AudioOptions } from '../../nodes/audio'
import { Blockquote, type BlockquoteOptions } from '../../nodes/blockquote'
import { BulletList, type BulletListOptions } from '../../nodes/bullet-list'
import { CodeBlock, type CodeBlockOptions } from '../../nodes/code-block'
// import { Details, type DetailsOptions } from '../../nodes/details'
// import { DetailsContent, type DetailsContentOptions } from '../../nodes/details-content'
// import { DetailsSummary, type DetailsSummaryOptions } from '../../nodes/details-summary'
import { Document } from '../../nodes/document'
// import { Embed, type EmbedOptions } from '../../nodes/embed'
// import { Emoji, type EmojiOptions } from '../../nodes/emoji'
import { HardBreak, type HardBreakOptions } from '../../nodes/hard-break'
import { Heading, type HeadingOptions } from '../../nodes/heading'
import { HorizontalRule, type HorizontalRuleOptions } from '../../nodes/horizontal-rule'
// import { Image, type ImageOptions } from '../../nodes/image'
import { Knowledge, type KnowledgeOptions } from '../../nodes/knowledge'
import { ListItem, type ListItemOptions } from '../../nodes/list-item'
// import { MathBlock, type MathBlockOptions } from '../../nodes/math-block'
// import { MathInline, type MathInlineOptions } from '../../nodes/math-inline'
import { Mermaid, type MermaidOptions } from '../../nodes/mermaid'
import { Metric, type MetricOptions } from '../../nodes/metric'
import { OrderedList, type OrderedListOptions } from '../../nodes/ordered-list'
import { Paragraph, type ParagraphOptions } from '../../nodes/paragraph'
// import { Plantuml, type PlantumlOptions } from '../../nodes/plantuml'
import { Table, type TableOptions } from '../../nodes/table'
import { TableCell, type TableCellOptions } from '../../nodes/table-cell'
import { TableHeader, type TableHeaderOptions } from '../../nodes/table-header'
import { TableRow, type TableRowOptions } from '../../nodes/table-row'
import { TaskItem, type TaskItemOptions } from '../../nodes/task-item'
import { TaskList, type TaskListOptions } from '../../nodes/task-list'
import { Text } from '../../nodes/text'
// import { Video, type VideoOptions } from '../../nodes/video'
import { configure } from '../../utils/functions'
import { BlockMenu, type BlockMenuOptions } from '../block-menu'
// import { ClearFormat } from '../clear-format'
import { ClickInBottom } from '../click-in-bottom'
import { Clipboard, type ClipboardOptions } from '../clipboard'
import { CopyBlock } from '../copy-block'
import { DeleteBlock } from '../delete-block'
import { CustomDragHandle, type DragHandleOptions } from '../drag-handle'
// import { DuplicateBlock } from '../duplicate-block'
import { FloatMenu, type FloatMenuOptions } from '../float-menu'
import { Markdown, type MarkdownOptions } from '../markdown'
// import { Uploader, type UploaderOptions } from '../uploader'

export interface StarterKitOptions {
  // marks
  bold?: Partial<BoldOptions> | boolean
  code?: Partial<CodeOptions> | boolean
  highlight?: Partial<HighlightOptions> | boolean
  italic?: Partial<ItalicOptions> | boolean
  link?: Partial<LinkOptions> | boolean
  strike?: Partial<StrikeOptions> | boolean
  sub?: Partial<SubscriptOptions> | boolean
  sup?: Partial<SuperscriptOptions> | boolean
  underline?: Partial<UnderlineOptions> | boolean
  // nodes
  text?: boolean
  document?: boolean
  heading?: Partial<HeadingOptions> | boolean
  paragraph?: Partial<ParagraphOptions> | boolean
  blockquote?: Partial<BlockquoteOptions> | boolean
  hardBreak?: Partial<HardBreakOptions> | boolean
  codeBlock?: Partial<CodeBlockOptions> | boolean
  horizontalRule?: Partial<HorizontalRuleOptions> | boolean
  bulletList?: Partial<BulletListOptions> | boolean
  orderedList?: Partial<OrderedListOptions> | boolean
  listItem?: Partial<ListItemOptions> | boolean
  taskList?: Partial<TaskListOptions> | boolean
  taskItem?: Partial<TaskItemOptions> | boolean
  // details?: Partial<DetailsOptions> | boolean
  // detailsContent?: Partial<DetailsContentOptions> | boolean
  // detailsSummary?: Partial<DetailsSummaryOptions> | boolean
  table?: Partial<TableOptions> | boolean
  tableRow?: Partial<TableRowOptions> | boolean
  tableCell?: Partial<TableCellOptions> | boolean
  tableHeader?: Partial<TableHeaderOptions> | boolean
  // emoji?: Partial<EmojiOptions> | boolean
  // embed?: Partial<EmbedOptions> | boolean
  // image?: Partial<ImageOptions> | boolean
  // audio?: Partial<AudioOptions> | boolean
  // video?: Partial<VideoOptions> | boolean
  mermaid?: Partial<MermaidOptions> | boolean
  // plantuml?: Partial<PlantumlOptions> | boolean
  // mathBlock?: Partial<MathBlockOptions> | boolean
  // mathInline?: Partial<MathInlineOptions> | boolean
  knowledge?: Partial<KnowledgeOptions> | boolean
  agent?: Partial<AgentOptions> | boolean
  metric?: Partial<MetricOptions> | boolean
  // extensions
  // uploader?: Partial<UploaderOptions> | boolean
  markdown?: Partial<MarkdownOptions> | boolean
  clipboard?: Partial<ClipboardOptions> | boolean
  blockMenu?: Partial<BlockMenuOptions> | boolean
  floatMenu?: Partial<FloatMenuOptions> | boolean
  // clickMenu?: Partial<ClickMenuOptions> | boolean
  customDragHandle?: Partial<DragHandleOptions> | boolean
  clickInBottom?: boolean
  copyBlock?: boolean
  // duplicateBlock?: boolean
  deleteBlock?: boolean
  clearFormat?: boolean
  // tiptap
  placeholder?: Parameters<typeof Placeholder.configure>[0] | boolean
  history?: Partial<HistoryOptions> | boolean
  gapCursor?: Partial<any> | boolean
  dropCursor?: Partial<DropcursorOptions> | boolean
}

export const StarterKit = Extension.create<StarterKitOptions>({
  name: 'starterKit',
  addExtensions() {
    const extensions: Array<AnyExtension> = []

    // marks
    configure(extensions, Bold, this.options.bold) // ☑️
    configure(extensions, Code, this.options.code) // ☑️
    configure(extensions, Highlight, this.options.highlight) // ☑️
    configure(extensions, Italic, this.options.italic) // ☑️
    configure(extensions, Link, this.options.link)
    configure(extensions, Strike, this.options.strike) // ☑️
    configure(extensions, Subscript, this.options.sub) // ☑️
    configure(extensions, Superscript, this.options.sup) // ☑️
    configure(extensions, Underline, this.options.underline) // ☑️
    // nodes
    configure(extensions, Text, this.options.text) // ☑️
    configure(extensions, Document, this.options.document) // ☑️
    configure(extensions, Heading, this.options.heading) // ☑️
    configure(extensions, Paragraph, this.options.paragraph) // ☑️
    configure(extensions, Blockquote, this.options.blockquote) // ☑️
    configure(extensions, HardBreak, this.options.hardBreak) // ☑️
    configure(extensions, CodeBlock, this.options.codeBlock) // ☑️
    configure(extensions, HorizontalRule, this.options.horizontalRule) // ☑️
    configure(extensions, BulletList, this.options.bulletList) // ☑️
    configure(extensions, OrderedList, this.options.orderedList) // ☑️
    configure(extensions, ListItem, this.options.listItem) // ☑️
    configure(extensions, TaskList, this.options.taskList) // ☑️
    configure(extensions, TaskItem, this.options.taskItem) // ☑️
    // configure(extensions, Details, this.options.details)
    // configure(extensions, DetailsContent, this.options.detailsContent)
    // configure(extensions, DetailsSummary, this.options.detailsSummary)
    configure(extensions, Table, this.options.table)
    configure(extensions, TableRow, this.options.tableRow)
    configure(extensions, TableCell, this.options.tableCell)
    configure(extensions, TableHeader, this.options.tableHeader)
    // configure(extensions, Emoji, this.options.emoji)
    // configure(extensions, Embed, this.options.embed)
    // configure(extensions, Image, this.options.image)
    // configure(extensions, Audio, this.options.audio)
    // configure(extensions, Video, this.options.video)
    configure(extensions, Mermaid, this.options.mermaid) // ☑️
    // configure(extensions, Plantuml, this.options.plantuml)
    // configure(extensions, MathBlock, this.options.mathBlock)
    // configure(extensions, MathInline, this.options.mathInline)
    configure(extensions, Knowledge, this.options.knowledge)
    configure(extensions, Agent, this.options.agent)
    configure(extensions, Metric, this.options.metric)
    // extensions
    // configure(extensions, Uploader, this.options.uploader)
    configure(extensions, Markdown, this.options.markdown) // ☑️
    configure(extensions, Clipboard, this.options.clipboard) // ☑️
    configure(extensions, BlockMenu, this.options.blockMenu) // ☑️
    configure(extensions, FloatMenu, this.options.floatMenu) // ☑️
    // configure(extensions, ClickMenu, this.options.clickMenu)
    configure(extensions, CustomDragHandle, this.options.customDragHandle) // ☑️
    configure(extensions, ClickInBottom, this.options.clickInBottom) // ☑️
    configure(extensions, CopyBlock, this.options.copyBlock) // ☑️
    // configure(extensions, DuplicateBlock, this.options.duplicateBlock)
    configure(extensions, DeleteBlock, this.options.deleteBlock) // ☑️
    // configure(extensions, ClearFormat, this.options.clearFormat)
    // tiptap
    configure(extensions, Placeholder, this.options.placeholder) // ☑️
    configure(extensions, History, this.options.history)
    configure(extensions, Gapcursor, this.options.gapCursor)
    configure(extensions, Dropcursor, this.options.dropCursor, {
      color: 'var(--tiptap-primary-background)',
      width: 2,
    })

    return extensions
  },
})

export default StarterKit
