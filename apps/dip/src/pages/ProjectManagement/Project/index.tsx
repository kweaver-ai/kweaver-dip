import { Button } from 'antd'
import { memo, useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getProjectById, getProjectNodeTree, type Node } from '@/apis'
import DictionaryIcon from '@/assets/images/project/dictionary.svg?react'
import Empty from '@/components/Empty'
import IconFont from '@/components/IconFont'
import ActionModal from '@/components/ProjectActionModal/ActionModal'
import DictionaryDrawer from '@/components/ProjectDictionaryDrawer'
import ProjectNodeDetail from '@/components/ProjectNodeDetail'
import ProjectSider from '@/components/ProjectSider'
import { useProjectStore } from '@/stores'

/**
 * 项目详情页面
 * 显示项目结构树（侧边栏）和选中节点的详情内容（主内容区）
 */
const Project = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const {
    selectedNode,
    treeData,
    initProjectTree,
    clearTreeData,
    addNode,
    setSelectedNode,
    setProjectInfo,
    currentProjectInfo,
  } = useProjectStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  // ActionModal 相关状态
  const [actionModalVisible, setActionModalVisible] = useState(false)

  // 项目词典抽屉相关状态
  const [dictionaryDrawerVisible, setDictionaryDrawerVisible] = useState(false)

  // 加载项目树数据
  const fetchTreeData = useCallback(async () => {
    if (!projectId) return

    try {
      setLoading(true)
      clearTreeData()
      setError(null)

      // 并行获取项目信息和节点数据
      const [project, nodes] = await Promise.all([
        getProjectById(projectId),
        getProjectNodeTree(projectId),
      ])
      setProjectInfo(project)

      // 初始化项目树
      initProjectTree(projectId, nodes)

      // 默认选中应用节点
      const applicationNode = nodes.find((n) => n.node_type === 'application')
      if (applicationNode) {
        setSelectedNode(String(applicationNode.id))
      }
    } catch (err: any) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [projectId, clearTreeData, initProjectTree, setProjectInfo])

  // 初始加载数据
  useEffect(() => {
    if (projectId) {
      fetchTreeData()
    }
  }, [projectId, fetchTreeData])

  /** 处理新建应用成功 */
  const handleAddApplicationSuccess = useCallback(
    (result: Node) => {
      if (!projectId) return

      const newNodeInfo: Node = {
        ...result,
        project_id: Number(projectId),
        node_type: 'application',
        parent_id: null,
      }

      // 直接添加到本地树中，不需要重新获取数据
      addNode(newNodeInfo)

      // 自动选中新创建的应用（addNode 已写入 nodeMap，直接传 id）
      setSelectedNode(String(newNodeInfo.id))
    },
    [projectId, addNode, setSelectedNode],
  )

  /** 处理新建应用 */
  const handleAddApplication = useCallback(() => {
    setActionModalVisible(true)
  }, [])

  /** 处理查看项目词典 */
  const handleViewDictionary = useCallback(() => {
    setDictionaryDrawerVisible(true)
  }, [])

  /** 根据选中的节点渲染内容 */
  const renderNodeContent = () => {
    if (!treeData.length) {
      return (
        <div className="flex items-center justify-center h-full text-[--dip-text-color-65]">
          <Empty desc="当前项目尚未建立完善的应用结构。您可以先定义项目词典规范，或者直接开始创建应用。">
            <div className="flex items-center justify-center gap-2 mt-2">
              <Button
                onClick={handleViewDictionary}
                icon={<DictionaryIcon className="!text-base" />}
              >
                查看项目词典
              </Button>
              <Button
                type="primary"
                onClick={handleAddApplication}
                icon={<IconFont type="icon-dip-add" />}
              >
                新建应用
              </Button>
            </div>
          </Empty>
        </div>
      )
    }

    if (!selectedNode) {
      return (
        <div className="flex items-center justify-center h-full text-[--dip-text-color-65]">
          <Empty desc="请从左侧选择要查看的内容" />
        </div>
      )
    }

    switch (selectedNode.nodeType) {
      case 'application':
      case 'page':
      case 'function':
        return <ProjectNodeDetail nodeId={selectedNode.nodeId} projectId={selectedNode.projectId} />
      default:
        return (
          <div className="flex items-center justify-center h-full text-[--dip-text-color-65]">
            未知节点类型
          </div>
        )
    }
  }

  // loading 或 error 时，不显示侧边栏，只显示状态内容
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[--dip-white]">
        <div className="text-[--dip-text-color-65]">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-[--dip-white]">
        <Empty type="failed" title="加载失败">
          <Button className="mt-1" type="primary" onClick={fetchTreeData}>
            重试
          </Button>
        </Empty>
      </div>
    )
  }

  return (
    <div className="h-full flex bg-[--dip-white]">
      {/* 侧边栏 */}
      <ProjectSider
        collapsed={collapsed}
        onCollapse={setCollapsed}
        projectId={projectId || ''}
        onViewDictionary={handleViewDictionary}
      />
      {/* 主内容区 */}
      <div className="flex-1 h-full p-6 flex flex-col relative overflow-auto">
        {renderNodeContent()}
      </div>
      {/* ActionModal */}
      <ActionModal
        open={actionModalVisible}
        onCancel={() => {
          setActionModalVisible(false)
        }}
        onSuccess={handleAddApplicationSuccess}
        operationType="add"
        objectType="application"
        projectId={projectId || ''}
        projectInfo={currentProjectInfo || undefined}
        parentId={null}
      />
      {/* 项目词典抽屉 */}
      <DictionaryDrawer
        open={dictionaryDrawerVisible}
        onClose={() => setDictionaryDrawerVisible(false)}
        projectId={projectId || ''}
      />
    </div>
  )
}

export default memo(Project)
