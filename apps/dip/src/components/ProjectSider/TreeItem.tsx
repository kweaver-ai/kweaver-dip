import { BorderlessTableOutlined, HolderOutlined } from '@ant-design/icons'
import { Dropdown, type MenuProps } from 'antd'
import clsx from 'clsx'
import { forwardRef, type HTMLAttributes, useState } from 'react'
import type { NodeType } from '@/apis'
import IconFont from '@/components/IconFont'
import { objectTypeNameMap } from '@/pages/ProjectManagement/utils'
import styles from './index.module.less'

export interface TreeItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'id'> {
  childCount?: number
  clone?: boolean
  collapsed?: boolean
  depth: number
  disableInteraction?: boolean
  ghost?: boolean
  handleProps?: any
  indentationWidth: number
  id: string
  name: string
  type: NodeType
  selected?: boolean
  canAddChild?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canDrag?: boolean
  onCollapse?(): void
  onAddChild?(): void
  onEdit?(): void
  onDelete?(): void
  onSelect?(): void
  wrapperRef?(node: HTMLDivElement): void
}

export const TreeItem = forwardRef<HTMLDivElement, TreeItemProps>(
  (
    {
      childCount,
      clone,
      depth,
      disableInteraction,
      ghost,
      handleProps,
      indentationWidth,
      collapsed,
      onCollapse,
      onAddChild,
      onEdit,
      onDelete,
      onSelect,
      style,
      id,
      name,
      type,
      selected,
      canAddChild,
      canEdit = true,
      canDelete = true,
      canDrag = true,
      wrapperRef,
      ...props
    },
    ref,
  ) => {
    const [menuOpen, setMenuOpen] = useState(false)

    /** 获取图标 */
    const getIcon = () => {
      switch (type) {
        case 'application':
          return <IconFont type="icon-dip-yingyong" />
        case 'page':
          return <IconFont type="icon-dip-UserAgreement" />
        case 'function':
          return <BorderlessTableOutlined />
        default:
          return null
      }
    }

    const getPaddingLeft = () => {
      // depth === -1: 应用层级，不缩进
      // depth === 0: 页面层级，缩进 0（因为从 depth 0 开始算缩进层级）
      // depth === 1:功能层级，缩进 1 层
      // depth === N: 缩进 N 层
      if (depth === -1) return 0
      return indentationWidth * depth
    }

    return (
      <div
        className={clsx(
          'group relative flex h-9 pr-2 items-center bg-white list-none cursor-pointer mx-1.5 rounded hover:bg-[--dip-hover-bg-color]',
          styles.treeItem,
          clone && styles.clone,
          ghost && styles.ghost,
          disableInteraction && 'pointer-events-none !hover:bg-white',
          selected && styles.selected,
        )}
        ref={wrapperRef}
        style={style}
        {...props}
      >
        {!clone && canDrag && (
          <button
            type="button"
            {...handleProps}
            ref={ref}
            className="flex w-5 h-full shrink-0 items-center justify-center cursor-grab text-base opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <HolderOutlined className="text-[--dip-text-color-55]" />
          </button>
        )}
        {!(clone || canDrag || type === 'application') && (
          <div
            ref={ref}
            className={clsx(
              'flex w-5 h-full shrink-0 items-center justify-center cursor-move text-base',
              styles.drag,
            )}
            style={{ visibility: 'hidden' }}
          />
        )}
        <button
          type="button"
          className={clsx('relative flex w-0 h-full flex-1 items-center', styles.content)}
          style={{
            marginLeft: clone ? 0 : `${getPaddingLeft()}px`,
          }}
          onClick={onSelect}
        >
          {!clone && type !== 'application' && (
            <IconFont
              type="icon-dip-right"
              className={clsx(
                'text-xs text-[--dip-text-color-65] flex w-6 h-full items-center justify-center cursor-pointer shrink-0 opacity-0',
                onCollapse && 'opacity-100',
                styles['content-collapse'],
              )}
              rotate={collapsed ? 0 : 90}
              onClick={(e) => {
                e.stopPropagation()
                onCollapse?.()
              }}
            />
          )}
          <div className="flex w-3.5 h-3.5 items-center justify-center mr-2 ml-1 shrink-0 text-sm">
            {getIcon()}
          </div>
          <div className="flex w-0 flex-1 items-center min-w-0">
            <span
              className="text-sm leading-[1.5714em] overflow-hidden text-ellipsis whitespace-nowrap"
              title={name}
            >
              {name}
            </span>
            {!canEdit && (
              <div className="w-1.5 h-1.5 bg-[--dip-success-color] rounded-full ml-1 shrink-0" />
            )}
          </div>
          {/* {clone && childCount && childCount > 1 ? (
            <span className={styles['content-count']}>{childCount}</span>
            ) : null} */}
        </button>
        {!clone && (
          <Dropdown
            menu={{
              items: [
                ...(canAddChild
                  ? [
                      {
                        key: 'add',
                        icon: <IconFont type="icon-dip-add" />,
                        label: `新建${type === 'application' ? '页面' : '功能'}`,
                        disabled: !canEdit,
                        onClick: (e: { domEvent: React.MouseEvent }) => {
                          e.domEvent.stopPropagation()
                          onAddChild?.()
                        },
                      },
                    ]
                  : []),
                {
                  key: 'edit',
                  icon: <IconFont type="icon-dip-bianji" />,
                  label: `编辑${objectTypeNameMap(type)}`,
                  disabled: !canEdit,
                  onClick: (e: { domEvent: React.MouseEvent }) => {
                    e.domEvent.stopPropagation()
                    if (canEdit) {
                      onEdit?.()
                    }
                  },
                },
                { type: 'divider' },
                {
                  key: 'delete',
                  icon: <IconFont type="icon-dip-trash" />,
                  label: `删除${objectTypeNameMap(type)}`,
                  danger: true,
                  disabled: !canDelete,
                  onClick: (e: { domEvent: React.MouseEvent }) => {
                    e.domEvent.stopPropagation()
                    if (canDelete) {
                      onDelete?.()
                    }
                  },
                },
              ].filter(Boolean) as MenuProps['items'],
            }}
            trigger={['click']}
            placement="bottomRight"
            onOpenChange={(open) => {
              setMenuOpen(open)
            }}
          >
            <button
              type="button"
              className={clsx(
                'hidden w-6 h-6 items-center justify-center ml-2 rounded bg-transparent cursor-pointer transition-opacity duration-200 group-hover:flex hover:bg-[--dip-hover-bg-color-4]',
                menuOpen && '!flex',
              )}
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              <IconFont type="icon-dip-gengduo" className="text-[--dip-text-color-75]" />
            </button>
          </Dropdown>
        )}
      </div>
    )
  },
)

TreeItem.displayName = 'TreeItem'
