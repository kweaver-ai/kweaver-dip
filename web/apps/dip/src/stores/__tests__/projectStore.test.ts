import { beforeEach, describe, expect, it } from 'vitest'

import type { Node } from '@/apis'

import { useProjectStore } from '../projectStore'

function makeNode(
  partial: Partial<Node> & Pick<Node, 'id' | 'name' | 'parent_id' | 'node_type'>,
): Node {
  return {
    project_id: 1,
    description: '',
    path: '/',
    sort: 0,
    status: 1,
    document_id: null,
    creator_id: 'c',
    creator_name: 'c',
    created_at: 't',
    editor_id: 'e',
    editor_name: 'e',
    edited_at: 't',
    ...partial,
  }
}

describe('projectStore', () => {
  beforeEach(() => {
    useProjectStore.getState().clearTreeData()
  })

  it('initProjectTree 与 setSelectedNode', () => {
    const n1 = makeNode({
      id: 'n1',
      name: '根应用',
      parent_id: null,
      node_type: 'application',
    })
    useProjectStore.getState().initProjectTree('proj-1', [n1])
    expect(useProjectStore.getState().currentProjectId).toBe('proj-1')
    expect(useProjectStore.getState().nodeMap.has('n1')).toBe(true)

    useProjectStore.getState().setSelectedNode('n1')
    expect(useProjectStore.getState().selectedNode?.nodeId).toBe('n1')
    expect(useProjectStore.getState().selectedNode?.nodeName).toBe('根应用')

    useProjectStore.getState().setSelectedNode(null)
    expect(useProjectStore.getState().selectedNode).toBeNull()
  })

  it('getNodeInfo / updateNodeInfo 同步树节点名称', () => {
    const n1 = makeNode({
      id: 'n1',
      name: 'A',
      parent_id: null,
      node_type: 'application',
    })
    useProjectStore.getState().initProjectTree('p1', [n1])
    expect(useProjectStore.getState().getNodeInfo('n1')?.name).toBe('A')

    useProjectStore.getState().updateNodeInfo('n1', { name: 'A2' })
    expect(useProjectStore.getState().getNodeInfo('n1')?.name).toBe('A2')
    expect(useProjectStore.getState().treeData[0]?.name).toBe('A2')
  })

  it('addNode 挂到父节点下；removeNode 删除', () => {
    const root = makeNode({
      id: 'root',
      name: 'R',
      parent_id: null,
      node_type: 'application',
    })
    useProjectStore.getState().initProjectTree('p1', [root])

    const child = makeNode({
      id: 'c1',
      name: 'C',
      parent_id: 'root',
      node_type: 'page',
    })
    useProjectStore.getState().addNode(child)
    expect(useProjectStore.getState().nodeMap.has('c1')).toBe(true)
    expect(useProjectStore.getState().treeData[0]?.children?.[0]?.id).toBe('c1')

    useProjectStore.getState().removeNode('c1')
    expect(useProjectStore.getState().nodeMap.has('c1')).toBe(false)
  })

  it('setProjectInfo / getProjectInfo', () => {
    const info = {
      id: 1,
      name: 'P',
      creator_id: 'c',
      creator_name: 'c',
      created_at: 't',
      editor_id: 'e',
      editor_name: 'e',
      edited_at: 't',
    }
    useProjectStore.getState().setProjectInfo(info)
    expect(useProjectStore.getState().getProjectInfo()?.name).toBe('P')
  })
})
