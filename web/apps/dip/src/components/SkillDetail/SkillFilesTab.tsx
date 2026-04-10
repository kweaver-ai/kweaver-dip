import { Spin } from 'antd'
import classNames from 'classnames'
import { memo, useEffect, useState } from 'react'
import type { SkillTreeEntry } from '@/apis'
import { getSkillTree } from '@/apis'
import Empty from '@/components/Empty'
import IconFont from '@/components/IconFont'
import ScrollBarContainer from '@/components/ScrollBarContainer'
import { mockFetchSkillTree, SKILL_DETAIL_USE_MOCK } from './mockSkillDetail'
import { SkillTabStateShell } from './SkillTabStateShell'
import type { SkillDetailFileItem } from './types'

export interface SkillFilesTabProps {
  skillName: string
  onFileClick: (path: string) => void
  /** 与 Outcome 文件列表一致：当前预览中的文件路径，用于行高亮 */
  selectedPath?: string
}

function flattenSkillFiles(entries: SkillTreeEntry[]): SkillDetailFileItem[] {
  const out: SkillDetailFileItem[] = []
  const walk = (nodes: SkillTreeEntry[]) => {
    for (const n of nodes) {
      if (n.type === 'file') {
        out.push({ name: n.name, path: n.path })
      } else if (n.children?.length) {
        walk(n.children)
      }
    }
  }
  walk(entries)
  return out.sort((a, b) => a.path.localeCompare(b.path))
}

const SkillFilesTab = ({ skillName, onFileClick, selectedPath }: SkillFilesTabProps) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [files, setFiles] = useState<SkillDetailFileItem[]>([])

  useEffect(() => {
    if (!skillName.trim()) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const treeRes = SKILL_DETAIL_USE_MOCK
          ? await mockFetchSkillTree(skillName)
          : await getSkillTree(skillName)
        if (cancelled) return
        setFiles(flattenSkillFiles(treeRes.entries ?? []))
      } catch {
        if (cancelled) return
        setError('技能目录加载失败')
        setFiles([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [skillName])

  if (loading) {
    return (
      <SkillTabStateShell>
        <Spin />
      </SkillTabStateShell>
    )
  }
  if (error) {
    return (
      <SkillTabStateShell>
        <Empty type="failed" title={error} />
      </SkillTabStateShell>
    )
  }
  if (files.length === 0) {
    return (
      <SkillTabStateShell>
        <Empty type="empty" title="暂无文件" />
      </SkillTabStateShell>
    )
  }
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-col">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-[--dip-border-color] bg-[--dip-white]">
          <div className="flex h-10 shrink-0 items-center justify-between gap-4 border-b border-[--dip-border-color] bg-[#F5F5F4] px-6 text-[--dip-text-color-65]">
            <span>文件名称</span>
            {/* <span className="w-36">路径</span> */}
          </div>
          <ScrollBarContainer className="min-h-0 min-w-0 flex-1 overflow-auto">
            <ul className="m-0 box-border flex min-h-[48px] list-none flex-col justify-center divide-y divide-[var(--dip-line-color)] p-0">
              {files.map((f) => (
                <li key={f.path}>
                  <button
                    type="button"
                    className={classNames(
                      'flex h-10 w-full cursor-pointer items-center justify-between gap-2 px-6 text-left transition-colors hover:bg-[--dip-hover-bg-color]',
                      selectedPath === f.path && 'bg-[--dip-hover-bg-color]',
                    )}
                    onClick={() => onFileClick(f.path)}
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <IconFont
                        type="icon-document"
                        className="shrink-0 text-[var(--dip-text-color-45)]"
                      />
                      <span className="min-w-0 truncate" title={f.name}>
                        {f.name}
                      </span>
                    </span>
                    {/* <span
                      className="w-36 flex-shrink-0 truncate text-left text-xs leading-5 text-[var(--dip-text-color-45)]"
                      title={f.path}
                    >
                      {f.path}
                    </span> */}
                  </button>
                </li>
              ))}
            </ul>
          </ScrollBarContainer>
        </div>
      </div>
    </div>
  )
}

export default memo(SkillFilesTab)
