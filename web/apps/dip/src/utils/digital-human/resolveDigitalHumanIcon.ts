import dh1 from '@/assets/icons/avator/dh_1.svg'
import dh2 from '@/assets/icons/avator/dh_2.svg'
import dh3 from '@/assets/icons/avator/dh_3.svg'
import dh4 from '@/assets/icons/avator/dh_4.svg'
import dh5 from '@/assets/icons/avator/dh_5.svg'
import dh6 from '@/assets/icons/avator/dh_6.svg'
import dh7 from '@/assets/icons/avator/dh_7.svg'
import dh8 from '@/assets/icons/avator/dh_8.svg'

/** 与列表/设置页一致的预置头像 ID → 资源映射 */
const presetAvatarIconMap: Record<string, string> = {
  dh_1: dh1,
  dh_2: dh2,
  dh_3: dh3,
  dh_4: dh4,
  dh_5: dh5,
  dh_6: dh6,
  dh_7: dh7,
  dh_8: dh8,
}

/**
 * 解析数字员工头像地址：`data:image` 直接使用；`http(s)` 直接使用；
 * 预置 `dh_1`…`dh_8` 走本地资源；疑似裸 base64 则按 png data URL 包装；否则使用默认图。
 */
export function resolveDigitalHumanIconSrc(iconId: string | undefined, fallback?: string): string {
  if (!iconId?.trim()) return fallback || ''
  const v = iconId.trim()

  if (v.startsWith('data:image')) return v
  if (v.startsWith('http://') || v.startsWith('https://')) return v

  const preset = presetAvatarIconMap[v]
  if (preset) return preset

  const compact = v.replace(/\s/g, '')
  if (/^[A-Za-z0-9+/]+=*$/.test(compact) && compact.length >= 32) {
    return `data:image/png;base64,${compact}`
  }

  return fallback || ''
}
