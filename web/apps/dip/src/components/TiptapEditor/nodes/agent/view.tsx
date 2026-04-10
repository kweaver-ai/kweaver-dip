import type { NodeViewProps } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import { Popover } from 'antd'
import clsx from 'clsx'
import type React from 'react'
import { useEffect, useState } from 'react'
import type { Agent } from '@/apis/agent-factory/index.d'
import IconFont from '@/components/IconFont'
import AgentSelect from './AgentSelect'
import styles from './index.module.less'

const AgentView: React.FC<NodeViewProps> = (props) => {
  const { node, updateAttributes, editor, selected, extension } = props
  const { agent } = node.attrs
  const agentData = agent || { id: '', name: '' }
  const { id, name } = agentData
  const [popoverOpen, setPopoverOpen] = useState(false)
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

  // 选择智能体
  const handleSelect = (item: Agent) => {
    updateAttributes({
      agent: {
        id: item.id,
        name: item.name,
      },
    })
    setPopoverOpen(false)
  }

  // Popover 打开/关闭
  const handlePopoverOpenChange = (open: boolean) => {
    setPopoverOpen(open)
  }

  // Popover 内容
  const popoverContent = (
    <AgentSelect selectedAgentId={id} onSelect={handleSelect} extension={extension} />
  )

  // 展示视图
  const displayView = (
    <span
      className={clsx(
        'inline-flex min-h-8 h-fit w-fit items-center py-1 px-2 border rounded-md text-muted-foreground text-sm gap-x-2',
        !id ? 'border-dashed' : 'bg-[#779EEA1A] border-[#779EEA8C]',
        selected && isEditable && 'border-[--dip-link-color]',
      )}
    >
      <IconFont type="icon-Agent" className="text-lg" />
      {!id ? (
        <span className="text-[rgba(0,0,0,0.65)]">请选择{extension.options.dictionary.name}</span>
      ) : (
        <span>{name}</span>
      )}
    </span>
  )
  return (
    <NodeViewWrapper as="span" className="max-w-full">
      {isEditable ? (
        <Popover
          content={popoverContent}
          trigger="click"
          open={popoverOpen}
          onOpenChange={handlePopoverOpenChange}
          placement="bottomLeft"
          arrow={false}
          classNames={{
            container: styles['dip-node-agent-popover'],
          }}
        >
          <button
            type="button"
            className="w-fit text-left cursor-pointer inline-block"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setPopoverOpen(!popoverOpen)
            }}
          >
            {displayView}
          </button>
        </Popover>
      ) : (
        <span className="inline-block">{displayView}</span>
      )}
    </NodeViewWrapper>
  )
}

export default ReactNodeViewRenderer(AgentView)
