import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Spin, Tooltip } from 'antd'
import { memo, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects, type Project } from '@/apis'
import Empty from '@/components/Empty'
import IconFont from '@/components/IconFont'
import ProjectList from '@/components/ProjectList'
import SearchInput from '@/components/SearchInput'
import { useListService } from '@/hooks/useListService'
import ActionModal from '../../components/ProjectActionModal/ActionModal'
import DeleteProjectModal from '../../components/ProjectActionModal/DeleteProjectModal'
import { ProjectActionEnum } from './types'
import { getProjectMenuItems } from './utils'

/** 项目管理 */
const ProjectManagement = () => {
  const {
    items: projects,
    loading,
    error,
    searchValue,
    handleSearch,
    handleRefresh,
  } = useListService<Project>({
    fetchFn: getProjects,
  })

  const navigate = useNavigate()
  const [addProjectModalVisible, setAddProjectModalVisible] = useState(false)
  const [deleteProjectModalVisible, setDeleteProjectModalVisible] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Project>()
  const [hasLoadedData, setHasLoadedData] = useState(false) // 记录是否已经成功加载过数据（有数据的情况）
  const hasEverHadDataRef = useRef(false) // 使用 ref 追踪是否曾经有过数据，避免循环依赖
  const prevSearchValueRef = useRef('') // 追踪上一次的搜索值，用于判断是否是从搜索状态清空

  // 当数据加载完成且有数据时，标记为已加载过数据；所有应用卸载后重置
  useEffect(() => {
    // 在开始处理前，先保存上一次的搜索值用于判断
    const wasSearching = prevSearchValueRef.current !== ''

    if (!loading) {
      if (projects.length > 0) {
        // 有数据时，设置为 true 并记录
        setHasLoadedData(true)
        hasEverHadDataRef.current = true
      } else if (!searchValue && hasEverHadDataRef.current) {
        // 没有数据且没有搜索值且之前有过数据时，需要判断是否是从搜索状态清空
        // 只有当上一次也没有搜索值（说明不是从搜索状态清空，而是真正的空状态）时，才重置
        if (!wasSearching) {
          // 不是从搜索状态清空，说明是真正的空状态（所有应用被卸载），重置
          setHasLoadedData(false)
          hasEverHadDataRef.current = false
        }
        // 如果是从搜索状态清空（wasSearching === true），保持 hasLoadedData 不变
        // 因为数据会重新加载，如果原来有数据，加载后 apps.length > 0，hasLoadedData 会保持 true
      }
      // 如果有搜索值但 apps.length === 0，保持 hasLoadedData 不变（显示搜索框）
    }

    // 更新上一次的搜索值（在 useEffect 结束时更新，确保下次执行时能正确判断）
    prevSearchValueRef.current = searchValue
  }, [loading, projects.length, searchValue])

  /** 处理新建项目成功 */
  const handleAddProjectSuccess = (result: { id: string; name: string; description?: string }) => {
    if (selectedItem) {
      handleRefresh()
    } else {
      navigate(`/studio/project-management/${result.id}`)
    }
  }

  /** 处理项目操作 */
  const handleProjectMenuClick = (key: ProjectActionEnum, _project?: Project) => {
    switch (key) {
      case ProjectActionEnum.View:
        navigate(`/studio/project-management/${_project?.id}`)
        break
      case ProjectActionEnum.Add:
        setAddProjectModalVisible(true)
        break
      case ProjectActionEnum.Edit:
        setSelectedItem(_project)
        setAddProjectModalVisible(true)
        break
      case ProjectActionEnum.Delete:
        setSelectedItem(_project)
        setDeleteProjectModalVisible(true)
        break
    }
  }

  /** 渲染状态内容（loading/error/empty） */
  const renderStateContent = () => {
    if (loading) {
      return <Spin size="large" />
    }

    if (error) {
      return (
        <Empty type="failed" title="加载失败">
          <Button type="primary" onClick={handleRefresh}>
            重试
          </Button>
        </Empty>
      )
    }

    if (projects.length === 0) {
      if (searchValue) {
        return <Empty type="search" desc="抱歉，没有找到相关内容" />
      }
      return (
        <Empty title="暂无项目" subDesc="当前项目管理空空如也，您可以点击下方按钮新建第一个项目。">
          <Button
            className="mt-2"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              handleProjectMenuClick(ProjectActionEnum.Add)
            }}
          >
            新建项目
          </Button>
        </Empty>
      )
    }

    return null
  }

  /** 渲染内容区域 */
  const renderContent = () => {
    const stateContent = renderStateContent()

    if (stateContent) {
      return <div className="absolute inset-0 flex items-center justify-center">{stateContent}</div>
    }

    return (
      <ProjectList
        projects={projects}
        onCardClick={(project) => handleProjectMenuClick(ProjectActionEnum.View, project)}
        menuItems={(project) => getProjectMenuItems((key) => handleProjectMenuClick(key, project))}
      />
    )
  }

  return (
    <div className="h-full p-6 flex flex-col relative">
      <div className="flex justify-between mb-6 flex-shrink-0 z-20">
        <div className="flex flex-col gap-y-2">
          <span className="font-medium text-base text-[--dip-text-color]">项目管理</span>
        </div>
        {(hasLoadedData || searchValue) && (
          <div className="flex items-center gap-x-3">
            <SearchInput onSearch={handleSearch} placeholder="搜索项目" />
            <Tooltip title="刷新">
              <Button type="text" icon={<ReloadOutlined />} onClick={handleRefresh} />
            </Tooltip>
            <Button
              type="primary"
              icon={<IconFont type="icon-dip-add" />}
              onClick={() => setAddProjectModalVisible(true)}
            >
              新建项目
            </Button>
          </div>
        )}
      </div>
      {renderContent()}
      <ActionModal
        open={addProjectModalVisible}
        onCancel={() => {
          setAddProjectModalVisible(false)
          setSelectedItem(undefined)
        }}
        onSuccess={handleAddProjectSuccess}
        operationType={selectedItem ? 'edit' : 'add'}
        objectType="project"
        objectInfo={selectedItem}
      />
      <DeleteProjectModal
        open={deleteProjectModalVisible}
        project={selectedItem}
        onCancel={() => {
          setDeleteProjectModalVisible(false)
          setSelectedItem(undefined)
        }}
        onSuccess={() => {
          handleRefresh()
        }}
      />
    </div>
  )
}

export default memo(ProjectManagement)
