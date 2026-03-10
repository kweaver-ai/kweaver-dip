import type { NodeViewProps } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import { Popover, Spin } from 'antd'
import clsx from 'clsx'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { getKnowledgeNetworks, type KnowledgeNetworkInfo } from '@/apis'
import IconFont from '@/components/IconFont'
import ScrollBarContainer from '@/components/ScrollBarContainer'
import SearchInput from '@/components/SearchInput'
import styles from './index.module.less'

const KnowledgeView: React.FC<NodeViewProps> = (props) => {
  const { node, updateAttributes, editor, selected, extension } = props
  const { knowledge } = node.attrs
  const knowledgeData = knowledge || { id: '', name: '' }
  const { id, name } = knowledgeData
  const [knowledgeOptions, setKnowledgeOptions] = useState<KnowledgeNetworkInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
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

  // 获取知识网络列表
  const fetchKnowledgeNetworks = async () => {
    if (loading) return // 防止重复请求
    setLoading(true)
    setError(null)
    try {
      const result = await getKnowledgeNetworks({ limit: -1 })
      setKnowledgeOptions(result.entries)
    } catch (error) {
      setKnowledgeOptions([])
      setError(error as Error)
    } finally {
      setLoading(false)
    }
  }

  // Popover 打开时获取数据
  const handlePopoverOpenChange = (open: boolean) => {
    setPopoverOpen(open)
    if (open && !loading) {
      fetchKnowledgeNetworks()
    }
  }

  // 过滤后的选项列表
  const filteredOptions = useMemo(() => {
    if (!searchValue.trim()) {
      return knowledgeOptions
    }
    const keyword = searchValue.trim().toLowerCase()
    return knowledgeOptions.filter((item) => item.name?.toLowerCase().includes(keyword))
  }, [knowledgeOptions, searchValue])

  // 选择知识网络
  const handleSelect = (item: KnowledgeNetworkInfo) => {
    updateAttributes({
      knowledge: {
        id: item.id,
        name: item.name,
      },
    })
    setPopoverOpen(false)
    setSearchValue('')
  }

  // Popover 内容
  const popoverContent = (
    <div className="w-[352px] flex flex-col gap-y-2">
      {/* 搜索框 */}
      <div className="px-4">
        <SearchInput
          variant="outlined"
          className="w-full"
          placeholder={`搜索${extension.options.dictionary.name}`}
          onSearch={(value) => setSearchValue(value)}
        />
      </div>

      {/* 列表 */}
      <ScrollBarContainer className="max-h-[240px] overflow-y-auto px-2">
        {loading ? (
          <div className="flex justify-center py-4">
            <Spin />
          </div>
        ) : error ? (
          <div className="mx-auto text-sm text-[rgba(0,0,0,0.45)] text-center py-4">暂无数据</div>
        ) : filteredOptions.length === 0 ? (
          <div className="mx-auto text-sm text-[rgba(0,0,0,0.45)] text-center py-4">
            抱歉，没有找到相关内容
          </div>
        ) : (
          <div className="space-y-1">
            {filteredOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSelect(item)
                  }
                }}
                className={`w-full h-8 text-left px-3 rounded cursor-pointer transition-colors ${
                  id === item.id ? 'bg-[rgba(18,110,227,0.06)]' : 'hover:bg-[rgba(0,0,0,0.04)]'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        )}
      </ScrollBarContainer>
    </div>
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
      <IconFont type="icon-yewuzhishiwangluo" className="text-lg" />
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
            container: styles['dip-node-knowledge-popover'],
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
            // onKeyDown={(e) => {
            //   if (e.key === 'Enter' || e.key === ' ') {
            //     e.preventDefault()
            //     setPopoverOpen(!popoverOpen)
            //   }
            // }}
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

export default ReactNodeViewRenderer(KnowledgeView)
