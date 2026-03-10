import { del, get, post, put } from '@/utils/http'
import type {
  CreateDictionaryEntryRequest,
  CreateNodeRequest,
  DictionaryEntry,
  DocumentContentObject,
  JsonPatchOperation,
  MoveNodeRequest,
  Node,
  NodeTree,
  PatchDocumentBlocksRequest,
  Project,
  UpdateDictionaryEntryRequest,
  UpdateNameDescRequest,
} from './index.d'

export type {
  CreateDictionaryEntryRequest,
  CreateNodeRequest,
  DictionaryEntry,
  DocumentContentObject,
  JsonPatchOperation,
  MoveNodeRequest,
  Node,
  NodeTree,
  PatchDocumentBlocksRequest,
  Project,
  UpdateDictionaryEntryRequest,
  UpdateNameDescRequest,
}
export type { NodeType, ObjectType } from './index.d'

const BASE = '/api/dip-studio/v1'

function flattenNodeTree(tree: NodeTree | null): Node[] {
  if (!tree) return []
  const nodes: Node[] = []
  const visit = (t: NodeTree) => {
    const { children, ...node } = t
    nodes.push(node as Node)
    children?.forEach(visit)
  }
  visit(tree)
  return nodes
}

// ==================== 项目管理 ====================

/** 获取项目列表 */
export const getProjects = (): Promise<Project[]> =>
  get(`${BASE}/projects`).then((result: unknown) =>
    Array.isArray(result) ? (result as Project[]) : [],
  )

/** 获取项目详情 */
export const getProjectById = (projectId: number | string): Promise<Project> =>
  get(`${BASE}/projects/${projectId}`)

/** 新建项目 */
export const postProjects = (params: { name: string; description?: string }): Promise<Project> =>
  post(`${BASE}/projects`, { body: params })

/** 编辑项目 */
export const putProjects = (id: number | string, params: UpdateNameDescRequest): Promise<Project> =>
  put(`${BASE}/projects/${id}`, { body: params })

/** 删除项目 */
export const deleteProjects = (id: number | string): Promise<void> => del(`${BASE}/projects/${id}`)

// ==================== 节点管理 ====================

/** 创建应用节点 */
export const postApplicationNode = (params: CreateNodeRequest): Promise<Node> =>
  post(`${BASE}/nodes/application`, { body: params })

/** 创建页面节点 */
export const postPageNode = (params: CreateNodeRequest): Promise<Node> =>
  post(`${BASE}/nodes/page`, { body: params })

/** 创建功能节点 */
export const postFunctionNode = (params: CreateNodeRequest): Promise<Node> =>
  post(`${BASE}/nodes/function`, { body: params })

/** 获取项目节点树（扁平化为 Node[]） */
export const getProjectNodeTree = (projectId: number | string): Promise<Node[]> =>
  get(`${BASE}/projects/${projectId}/nodes/tree`).then((result: unknown) => {
    const tree = result as NodeTree | null
    return flattenNodeTree(tree)
  })

/** 更新节点 */
export const putNode = (nodeId: number | string, params: UpdateNameDescRequest): Promise<Node> =>
  put(`${BASE}/nodes/${nodeId}`, { body: params })

/** 移动节点 */
export const moveNode = (params: MoveNodeRequest): Promise<Node> =>
  put(`${BASE}/nodes/move`, { body: params })

/** 删除节点 */
export const deleteNode = (nodeId: number | string): Promise<void> => del(`${BASE}/nodes/${nodeId}`)

// ==================== 项目词典 ====================

/** 获取项目词典 */
export const getProjectDictionary = (projectId: number | string): Promise<DictionaryEntry[]> =>
  get(`${BASE}/dictionary`, { params: { project_id: projectId } }).then((result: unknown) =>
    Array.isArray(result) ? (result as DictionaryEntry[]) : [],
  )

/** 新增术语 */
export const postProjectDictionary = (
  params: CreateDictionaryEntryRequest,
): Promise<DictionaryEntry> => post(`${BASE}/dictionary`, { body: params })

/** 更新术语 */
export const putProjectDictionary = (
  id: number | string,
  params: UpdateDictionaryEntryRequest,
): Promise<DictionaryEntry> => put(`${BASE}/dictionary/${id}`, { body: params })

/** 删除术语 */
export const deleteProjectDictionary = (id: number | string): Promise<void> =>
  del(`${BASE}/dictionary/${id}`)

// ==================== 功能设计文档（TipTap + RFC 6902 JSON Patch） ====================

/** 获取功能设计文档（按 document_id），返回 DocumentContentObject */
export const getDocument = (documentId: number | string): Promise<DocumentContentObject> =>
  get(`${BASE}/documents/${documentId}`)

/** 文档增量更新（RFC 6902 JSON Patch） */
export const putDocument = (
  documentId: number | string,
  patches: PatchDocumentBlocksRequest,
): Promise<void> => put(`${BASE}/documents/${documentId}`, { body: patches })
