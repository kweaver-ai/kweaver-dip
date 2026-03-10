import type { PopoverProps } from 'antd'
import { Popover } from 'antd'
import type { ReactNode } from 'react'
import type { Project } from '@/apis'
import ProjectIcon from '@/assets/images/projectIcon.svg?react'
import ScrollBarContainer from '@/components/ScrollBarContainer'
import { formatTimeSlash } from '@/utils/handle-function/FormatTime'

interface ProjectInfoPopoverProps extends Omit<PopoverProps, 'content'> {
  projectInfo: Project | null
  children: ReactNode
  onClose: () => void
}

/**
 * 项目信息 Popover
 * 显示项目的详细信息，包括名称、简介、创建时间等
 */
export const ProjectInfoPopover = ({
  projectInfo,
  children,
  onClose,
  ...popoverProps
}: ProjectInfoPopoverProps) => {
  if (!projectInfo) {
    return <>{children}</>
  }

  const content = (
    <ScrollBarContainer className="flex flex-col items-center w-[400px] max-h-[400px] relative px-6">
      {/* 图标 */}
      <div className="w-14 h-14 mb-5 flex-shrink-0 rounded-full flex justify-center overflow-hidden">
        <ProjectIcon className="w-14 h-14" />
      </div>
      {/* 名称 */}
      <div className="mb-6 text-base font-medium text-[--dip-text-color]" title={projectInfo.name}>
        {projectInfo.name}
      </div>
      {/* 项目简介 */}
      <div className="mb-12 leading-6 text-[--dip-text-color-65]" title={projectInfo.description}>
        {projectInfo.description || '[暂无描述]'}
      </div>
      {/* 分隔线 */}
      <div className="h-px w-full bg-[--dip-line-color-10] mb-5 shrink-0" />
      {/* 创建时间 */}
      <div className="w-full mb-4 flex items-center justify-between">
        <span className="shrink-0">创建时间</span>
        <span className="truncate">
          {projectInfo.created_at
            ? formatTimeSlash(new Date(projectInfo.created_at).getTime())
            : '--'}
        </span>
      </div>

      {/* 创建者 */}
      <div className="w-full mb-4 flex items-center justify-between gap-x-2">
        <span className="shrink-0">创建者</span>
        <span className="truncate">{projectInfo.creator_name || '--'}</span>
      </div>
    </ScrollBarContainer>
  )

  return (
    <Popover content={content} trigger="click" placement="bottom" arrow={false} {...popoverProps}>
      {children}
    </Popover>
  )
}

export default ProjectInfoPopover
