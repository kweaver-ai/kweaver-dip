import clsx from 'clsx'
import type { ReactNode } from 'react'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppIcon from '@/components/AppIcon'
import IconFont from '@/components/IconFont'
import type { HeaderType } from '@/routes/types'
import type { BreadcrumbItem } from '@/utils/micro-app/globalState'

interface BreadcrumbProps {
  /** 面包屑类型 */
  type: HeaderType
  /** 面包屑项列表，由外部传入 */
  items?: BreadcrumbItem[]
  /** 首页（返回按钮）跳转路径，不同平台可指定各自首路由，默认 / */
  homePath?: string
  /** 是否展示首页返回图标（通常为返回按钮） */
  showHomeIcon?: boolean
  /** 导航回调函数，如果不传则使用内部的 navigate */
  onNavigate?: (item: BreadcrumbItem) => void
  /** 最后一项后面的自定义内容 */
  lastItemSuffix?: ReactNode
}

/**
 * 渲染面包屑图标
 */
const renderIcon = (icon: string | ReactNode | undefined, name: string) => {
  if (!icon || typeof icon === 'string')
    return <AppIcon icon={icon as string} name={name} size={16} />

  return icon
}

/**
 * 通用面包屑组件
 *
 * 功能：
 * - 自动添加首页图标（第一个项）
 * - 支持图标渲染（通过 icon 属性）
 * - 支持导航跳转（通过 path 属性）
 * - 最后一项和没有 path 的项不可点击
 *
 * 使用方式：
 * - 外部传入 items 数组，组件负责渲染
 * - 如果传入 onNavigate，使用回调函数；否则使用内部的 navigate
 */
export const Breadcrumb = ({
  type,
  items = [],
  homePath = '/',
  showHomeIcon = true,
  onNavigate,
  lastItemSuffix,
}: BreadcrumbProps) => {
  const navigate = useNavigate()

  // 统一的跳转处理函数
  const handleNavigate = useCallback(
    (item: BreadcrumbItem, e: React.MouseEvent) => {
      e.preventDefault()
      if (onNavigate) {
        onNavigate(item ?? {})
      } else if (item.path) {
        navigate(item.path)
      }
    },
    [navigate, onNavigate],
  )

  // 所有面包屑项（包含首页，homePath 由调用方按平台传入各自首路由）
  const allItems: Array<BreadcrumbItem> = showHomeIcon
    ? [{ key: 'main-home', name: '', path: homePath }, ...items]
    : [...items]

  return (
    <div className="h-6 flex items-center">
      {allItems.map((item, index) => {
        const isLast = index === allItems.length - 1
        const isHome = showHomeIcon && index === 0
        const hasIcon = !isHome && 'icon' in item && item.icon
        // 没有 path 的项不可点击（如 section 段）
        const isNotClickable = !item.path || isLast
        // 使用 item.key、item.path 或组合值作为 key，避免使用数组索引
        const itemKey = item.key || `breadcrumb-${index}`
        const isDisabled = !!item.disabled

        return (
          <div key={itemKey} className="flex items-center">
            {/* 首页图标 */}
            {isHome ? (
              <button
                type="button"
                className="flex items-center justify-center w-6 h-6 rounded-md text-[--dip-text-color] hover:bg-[--dip-hover-bg-color]"
                onClick={(e) => handleNavigate(item, e)}
              >
                <IconFont type="icon-back" className="!text-base !leading-none" />
              </button>
            ) : (
              <>
                {/* 分隔符 */}
                {index > 0 && <span className="text-sm font-medium text-black/25 mx-1.5">/</span>}
                {/* 面包屑项 */}
                {isNotClickable ? (
                  <button
                    type="button"
                    className={clsx(
                      'max-w-[200px] truncate min-w-0 font-medium cursor-default',
                      type === 'micro-app' ? '' : 'px-1',
                      isDisabled && 'text-black/45',
                      isLast && 'font-medium',
                    )}
                  >
                    {hasIcon && renderIcon(item.icon, item.name)}
                    <span className="truncate max-w-[200px] min-w-0" title={item.name}>
                      {item.name}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`max-w-[200px] truncate min-w-0 font-medium text-black/45 ${type === 'micro-app' ? '' : 'px-1'}`}
                    onClick={(e) => !isDisabled && handleNavigate(item, e)}
                  >
                    {hasIcon && renderIcon(item.icon, item.name)}
                    <span className="truncate" title={item.name}>
                      {item.name}
                    </span>
                  </button>
                )}
                {/* 最后一项后面的自定义内容 */}
                {isLast && lastItemSuffix && (
                  <span className="flex items-center">{lastItemSuffix}</span>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
