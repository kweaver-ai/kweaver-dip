import type { AnimateLayoutChanges } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CSSProperties } from 'react'
import { TreeItem, type TreeItemProps } from './TreeItem'

interface Props extends TreeItemProps {
  id: string
}

const animateLayoutChanges: AnimateLayoutChanges = ({ isSorting, wasDragging }) =>
  !(isSorting || wasDragging)

export function SortableTreeItem({ id, depth, canDrag = true, ...props }: Props) {
  const {
    attributes,
    isDragging,
    isSorting,
    listeners,
    setDraggableNodeRef,
    setDroppableNodeRef,
    transform,
    transition,
  } = useSortable({
    id,
    animateLayoutChanges,
    disabled: !canDrag, // 如果 canDrag 为 false，禁用拖拽
  })
  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  return (
    <TreeItem
      ref={setDraggableNodeRef}
      wrapperRef={setDroppableNodeRef}
      style={style}
      id={id}
      depth={depth}
      ghost={isDragging}
      disableInteraction={isSorting}
      canDrag={canDrag}
      handleProps={
        canDrag
          ? {
              ...attributes,
              ...listeners,
            }
          : undefined
      }
      {...props}
    />
  )
}
