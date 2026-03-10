import { Col, type MenuProps, Row } from 'antd'
import { memo, useCallback } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import type { Project } from '@/apis'
import ScrollBarContainer from '../ScrollBarContainer'
import ProjectCard from './ProjectCard'
import { computeColumnCount, gap } from './utils'

interface ProjectListProps {
  /** 项目列表数据 */
  projects: Project[]
  /** 卡片菜单点击回调 */
  onCardClick?: (project: Project) => void
  /** 卡片菜单点击回调 */
  menuItems?: (project: Project) => MenuProps['items']
}

/**
 * ProjectList 组件
 */
const ProjectList: React.FC<ProjectListProps> = ({ projects, onCardClick, menuItems }) => {
  /** 渲染应用卡片 */
  const renderCard = useCallback(
    (project: Project, width: number) => {
      return (
        <Col key={project.id} style={{ width, minWidth: width }}>
          <ProjectCard
            project={project}
            width={width}
            menuItems={menuItems?.(project)}
            onCardClick={(project) => onCardClick?.(project)}
          />
        </Col>
      )
    },
    [onCardClick],
  )

  return (
    <div className="flex flex-col h-0 flex-1">
      <ScrollBarContainer className="p-2 pt-0 ml-[-8px] mb-[-8px] mr-[-24px]">
        <AutoSizer style={{ width: 'calc(100% - 8px)' }} disableHeight>
          {({ width }) => {
            const count = computeColumnCount(width)
            const calculatedCardWidth = width / count

            return (
              <Row gutter={[gap, gap]}>
                {projects.map((project) => renderCard(project, calculatedCardWidth))}
              </Row>
            )
          }}
        </AutoSizer>
      </ScrollBarContainer>
    </div>
  )
}

export default memo(ProjectList)
