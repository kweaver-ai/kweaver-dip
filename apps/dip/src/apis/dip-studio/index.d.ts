/**
 * DIP Studio API 类型定义
 * 与 studio/openapi/public/studio/studio.schemas.yaml 保持一致
 */

// ============ 项目 ============

/** 项目信息（Project） */
export interface Project {
  id: number
  name: string
  description?: string
  creator_id: string
  creator_name: string
  created_at: string
  editor_id: string
  editor_name: string
  edited_at: string
}

/** 项目列表（ProjectList） */
export type ProjectList = Project[]

/** 创建项目请求 */
export interface CreateProjectRequest {
  name: string
  description?: string
}

/** 更新请求（项目/节点共用） */
export interface UpdateNameDescRequest {
  name?: string
  description?: string
}

// ============ 节点 ============

/** 节点类型 */
export type NodeType = 'application' | 'page' | 'function'
export type ObjectType = NodeType | 'project'

/** 项目节点（Node） */
export interface Node {
  id: string
  project_id: number
  parent_id: string | null
  node_type: NodeType
  name: string
  description?: string
  path: string
  sort: number
  status: number
  document_id: number | null
  creator_id: string
  creator_name: string
  created_at: string
  editor_id: string
  editor_name: string
  edited_at: string
}

/** 节点树（NodeTree，递归结构） */
export interface NodeTree {
  id: string
  project_id: number
  parent_id: string | null
  node_type: NodeType
  name: string
  description?: string
  path: string
  status: number
  document_id: number | null
  creator: number
  created_at: string
  editor: number
  edited_at: string
  children: NodeTree[]
}

/** 创建节点请求（application 无 parent_id，page/function 需 parent_id） */
export interface CreateNodeRequest {
  project_id: number
  parent_id?: string
  name: string
  description?: string
}

/** 移动节点请求（MoveNodeRequest） */
export interface MoveNodeRequest {
  node_id: string
  new_parent_id?: string | null
  predecessor_node_id?: string | null
}

// ============ 词典 ============

/** 词典条目（DictionaryEntry） */
export interface DictionaryEntry {
  id: number
  project_id: number
  term: string
  definition: string
  created_at?: string
}

/** 词典条目列表（DictionaryEntryList） */
export type DictionaryEntryList = DictionaryEntry[]

/** 创建词典条目请求 */
export interface CreateDictionaryEntryRequest {
  project_id: number
  term: string
  definition: string
}

/** 更新词典条目请求 */
export interface UpdateDictionaryEntryRequest {
  term?: string
  definition?: string
}

// ============ 文档 ============

/** JSON Patch 单条操作（JsonPatchOperation） */
export interface JsonPatchOperation {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test'
  path: string
  value?: unknown
  from?: string
}

/** JSON Patch 更新文档块请求（PatchDocumentBlocksRequest） */
export type PatchDocumentBlocksRequest = JsonPatchOperation[]

/** 文档内容对象（DocumentContentObject），含任意 kv */
export interface DocumentContentObject {
  blocks?: DocumentBlock[]
  [key: string]: unknown
}

/** 文档块（DocumentBlock） */
export interface DocumentBlock {
  id: string
  document_id: number
  type: 'text' | 'list' | 'table' | 'plugin'
  content: Record<string, unknown>
  order: number
  updated_at?: string
}

/** 文档内容（DocumentContent），含 blocks 数组 */
export interface DocumentContent {
  blocks: DocumentBlock[]
}

/** 功能设计文档（FunctionDocument） */
export interface FunctionDocument {
  id: number
  function_node_id: string
  creator: number
  created_at: string
  editor: number
  edited_at: string
  blocks: DocumentBlock[]
}
