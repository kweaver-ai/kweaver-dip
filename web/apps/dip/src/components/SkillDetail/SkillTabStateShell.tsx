import type { ReactNode } from 'react'

/** 技能详情 Tab 内 loading / 空态 / 失败态，与列表页 absolute 居中一致的视觉 */
export function SkillTabStateShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[240px] w-full flex-1 items-center justify-center">{children}</div>
  )
}
