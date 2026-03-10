import type { NodeViewProps } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import clsx from 'clsx'
import type React from 'react'
import { useEffect, useState } from 'react'
import type { MetricModelType } from '@/apis'
import IconFont from '@/components/IconFont'
import MetricSelector from '@/components/MetricSelector'

/** 简化的指标类型，只包含 id 和 name */
export interface SimplifiedMetricType {
  id: string
  name: string
}

const MetricView: React.FC<NodeViewProps> = (props) => {
  const { node, updateAttributes, editor, selected, extension, getPos } = props
  const { metric } = node.attrs as { metric?: SimplifiedMetricType | null }
  const currentMetric: SimplifiedMetricType | null = metric ?? null
  const [modalOpen, setModalOpen] = useState(false)
  const [isEditable, setIsEditable] = useState(editor.isEditable)

  // 监听编辑器编辑状态变化
  useEffect(() => {
    const updateEditableState = () => {
      setIsEditable(editor.isEditable)
    }

    // 初始化状态
    updateEditableState()

    // 监听编辑器状态变化
    editor.on('update', updateEditableState)
    editor.on('transaction', updateEditableState)

    return () => {
      editor.off('update', updateEditableState)
      editor.off('transaction', updateEditableState)
    }
  }, [editor])

  // 选择指标确认
  const handleConfirm = (selectedMetrics: Array<MetricModelType>) => {
    // 没选任何指标：仅清空当前节点内容
    if (!selectedMetrics.length) {
      updateAttributes({ metric: null })
      setModalOpen(false)
      return
    }

    const pos = typeof getPos === 'function' ? getPos() : null
    const simplified = selectedMetrics.map((metric) => ({
      id: metric.id,
      name: metric.name,
    }))

    // 若获取不到位置，或者只选中了一个，就保持单节点行为：当前节点展示一个指标
    if (typeof pos !== 'number' || simplified.length === 1) {
      updateAttributes({
        metric: simplified[0],
      })
      setModalOpen(false)
      return
    }

    // 多选：将当前节点替换为多个 metric 节点（每个节点只包含一个指标）
    const insertContent = simplified.map((metric) => ({
      type: extension.name,
      attrs: {
        metric,
      },
    }))

    editor
      .chain()
      .focus()
      .insertContentAt(
        {
          from: pos,
          to: pos + node.nodeSize,
        },
        insertContent,
      )
      .run()

    setModalOpen(false)
  }

  // 将简化的指标转换为 MetricModelType 格式（用于传递给 MetricSelector）
  // MetricSelector 通过 id 匹配已选中的项，所以只需要 id 和 name 即可
  const convertToMetricModelType = (simplified: SimplifiedMetricType[]): Array<MetricModelType> => {
    return simplified.map(
      (item) =>
        ({
          id: item.id,
          name: item.name,
        }) as MetricModelType,
    )
  }

  // 取消选择
  const handleCancel = () => {
    setModalOpen(false)
  }

  // 展示视图
  const displayView = (
    <span
      className={clsx(
        'inline-flex min-h-8 h-fit w-fit max-w-full flex-wrap items-center py-1 px-2 border rounded-md text-muted-foreground text-sm gap-x-3 gap-y-1',
        !currentMetric ? 'border-dashed' : 'bg-[#779EEA1A] border-[#779EEA8C]',
        selected && isEditable && 'border-[--dip-link-color]',
      )}
    >
      {!currentMetric ? (
        <>
          <IconFont type="icon-dip-color-metric" className="text-lg" />
          <span className="text-[rgba(0,0,0,0.65)]">请选择{extension.options.dictionary.name}</span>
        </>
      ) : (
        <div className="max-w-full flex items-center gap-x-2">
          <IconFont type="icon-dip-color-metric" className="text-lg" />
          <span className="truncate w-fit max-w-full">{currentMetric.name}</span>
        </div>
      )}
    </span>
  )

  return (
    <NodeViewWrapper as="span" className="max-w-full">
      {isEditable ? (
        <>
          <button
            type="button"
            className="w-fit max-w-full text-left cursor-pointer inline-block"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setModalOpen(true)
            }}
          >
            {displayView}
          </button>
          {modalOpen && (
            <MetricSelector
              initialSelectedMetrics={
                currentMetric ? convertToMetricModelType([currentMetric]) : []
              }
              onConfirm={handleConfirm}
              onCancel={handleCancel}
            />
          )}
        </>
      ) : (
        <span className="inline-block">{displayView}</span>
      )}
    </NodeViewWrapper>
  )
}

export default ReactNodeViewRenderer(MetricView)
