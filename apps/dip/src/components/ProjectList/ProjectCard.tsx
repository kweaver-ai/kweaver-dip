import { Card, Dropdown, type MenuProps } from 'antd'
import clsx from 'clsx'
import { useState } from 'react'
import type { Project } from '@/apis'
import ProjectIcon from '@/assets/images/projectIcon.svg?react'
import { formatTimeSlash } from '@/utils/handle-function/FormatTime'
import IconFont from '../IconFont'
import { cardHeight } from './utils'

interface ProjectCardProps {
  project: Project
  width: number
  menuItems?: MenuProps['items']
  /** 卡片菜单点击回调 */
  onCardClick?: (project: Project) => void
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, width, menuItems, onCardClick }) => {
  const [menuOpen, setMenuOpen] = useState(false)

  const updateTime = project.edited_at ? formatTimeSlash(new Date(project.edited_at).getTime()) : ''

  return (
    <Card
      className="group rounded-[10px] transition-all w-full cursor-pointer"
      styles={{
        root: {
          height: cardHeight,
          boxShadow: '0px 2px 8px 0px hsla(0,0%,0%,0.1)',
        },
        body: {
          height: '100%',
          padding: '16px 16px 12px 16px',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      onClick={() => {
        onCardClick?.(project)
      }}
    >
      <div className="flex gap-4 mb-2 flex-shrink-0">
        {/* 应用图标 */}
        <div className="w-13 h-13 flex-shrink-0 rounded-full flex justify-center overflow-hidden">
          <ProjectIcon className="w-13 h-13" />
        </div>
        {/* 名称 + 版本号 + 描述 */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="text-base font-medium mr-px truncate" title={project.name}>
                {project.name}
              </div>
            </div>
            <p
              className="text-[13px] line-clamp-2 text-[--dip-text-color-45] leading-5"
              title={project.description}
            >
              {project.description || '[暂无描述]'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-end flex-1 h-0">
        {/* <div className="mb-2 h-px bg-[var(--dip-line-color)]" /> */}
        <div className="flex items-center justify-between">
          {/* 更新信息 */}
          <div className="flex items-center text-xs text-[var(--dip-text-color-45)]">
            {/* <Avatar size={24} className="flex-shrink-0 mr-2">
              {userName.charAt(0)}
            </Avatar>
            <span
              className="truncate mr-4"
              style={{ maxWidth: `${Math.floor(width * 0.22)}px` }}
              title={userName}
            >
              {userName}
            </span> */}
            <span>更新时间：{updateTime}</span>
          </div>
          {/* 更多操作 */}
          {menuItems && menuItems.length > 0 && (
            <Dropdown
              menu={{ items: menuItems }}
              trigger={['click']}
              placement="bottomRight"
              onOpenChange={(open) => {
                setMenuOpen(open)
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                }}
                className={clsx(
                  'w-6 h-6 flex items-center justify-center rounded text-[var(--dip-text-color-45)] hover:text-[var(--dip-text-color-85)] hover:bg-[--dip-hover-bg-color] transition-opacity',
                  menuOpen
                    ? 'opacity-100 visible'
                    : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
                )}
              >
                <IconFont type="icon-dip-gengduo" />
              </button>
            </Dropdown>
          )}
        </div>
      </div>
    </Card>
  )
}

export default ProjectCard
