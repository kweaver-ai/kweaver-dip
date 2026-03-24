import dayjs from 'dayjs'
import type { SessionSummary } from '@/apis/dip-studio/sessions'

export function getSessionTitle(session: SessionSummary): string {
  return session.derivedTitle?.trim() || ''
}

/** 今天/明天/昨天 HH:mm，否则 MM/DD HH:mm */
export function formatPlanRelativeDayTime(ms: number | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return '—'
  const d = dayjs(ms)
  const today = dayjs().startOf('day')
  const target = d.startOf('day')
  const diff = target.diff(today, 'day')
  const hm = d.format('HH:mm')
  if (diff === 0) return `今天 ${hm}`
  if (diff === 1) return `明天 ${hm}`
  if (diff === -1) return `昨天 ${hm}`
  return d.format('MM/DD HH:mm')
}
