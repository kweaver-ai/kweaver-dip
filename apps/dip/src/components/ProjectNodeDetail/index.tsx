import { Button, Descriptions, message, Popover, Spin, Switch, Tabs } from 'antd'
import clsx from 'clsx'
import jsonpatch from 'fast-json-patch'
import { debounce } from 'lodash'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getDocument, putDocument } from '@/apis/dip-studio'
import {
  getDevModeNodeId,
  isNodeInDevMode,
  setDevModeNodeId,
} from '@/pages/ProjectManagement/devMode'
import { objectTypeNameMap } from '@/pages/ProjectManagement/utils'
import { useProjectStore } from '@/stores'
import { LoadStatus } from '@/types/enums'
import { formatTime } from '@/utils/handle-function/FormatTime'
import Empty from '../Empty'
import IconFont from '../IconFont'
import { flattenTree } from '../ProjectSider/utils'
import ScrollBarContainer from '../ScrollBarContainer'
import TiptapEditor from '../TiptapEditor'
import styles from './index.module.less'
import { NodeDetailTabKey } from './types'
import { sanitizeInitialContent } from './utils'

interface ProjectNodeDetailProps {
  nodeId: string
  projectId: string
}

/** 项目节点详情组件 */
const ProjectNodeDetail = ({ nodeId, projectId }: ProjectNodeDetailProps) => {
  const { getNodeInfo, treeData } = useProjectStore()
  const [messageApi, messageContextHolder] = message.useMessage()
  const nodeInfo = getNodeInfo(nodeId)
  const [devModeLoading, setDevModeLoading] = useState(false)
  const [devMode, setDevMode] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<NodeDetailTabKey>(NodeDetailTabKey.Detail)
  const [loadStatus, setLoadStatus] = useState<LoadStatus>(LoadStatus.Empty)
  const [initialContent, setInitialContent] = useState<any>({})
  const [content, setContent] = useState<any>({})
  const [editorLoading, setEditorLoading] = useState<boolean>(true)
  const contentRef = useRef(content)
  contentRef.current = content
  // 记录当前详情面板对应的文档 ID，用于避免跨节点的保存/回写串扰
  const currentDocumentIdRef = useRef<number | string | null>(nodeInfo?.document_id ?? null)
  // 始终保存最近一次用户输入版本
  const pendingContentRef = useRef<any | null>(null)
  // pendingContent 对应的文档 ID，避免切节点时丢失待保存目标
  const pendingDocumentIdRef = useRef<number | string | null>(null)
  // 同一时刻仅允许一个保存请求在途
  const isSavingRef = useRef(false)
  // 请求在途期间若有新输入，保存结束后重新调度
  const needRescheduleRef = useRef(false)
  const scheduleSaveDocumentRef = useRef<(() => void) | null>(null)

  /** 节点是否处于开发模式 */
  const nodeInDevMode = useMemo(() => {
    if (!nodeInfo) return false
    // 扁平化树数据以检查开发模式
    const flattenedItems = flattenTree(treeData)
    // 检查节点是否处于开发模式（包括继承）
    return isNodeInDevMode(projectId, nodeId, flattenedItems)
  }, [nodeId, projectId, treeData, nodeInfo])

  useEffect(() => {
    if (nodeInfo) {
      setActiveTab(
        nodeInfo.node_type === 'function' ? NodeDetailTabKey.Document : NodeDetailTabKey.Detail,
      )
    }
  }, [nodeInfo])

  // 从 localStorage 读取开发模式状态
  useEffect(() => {
    const currentDevModeNodeId = getDevModeNodeId(projectId)
    setDevMode(currentDevModeNodeId === nodeId)

    // 监听开发模式变化事件
    const handleDevModeChanged = (event: CustomEvent) => {
      if (event.detail.projectId === projectId) {
        setDevMode(event.detail.nodeId === nodeId)
      }
    }

    window.addEventListener('devModeChanged', handleDevModeChanged as EventListener)
    return () => {
      window.removeEventListener('devModeChanged', handleDevModeChanged as EventListener)
    }
  }, [projectId, nodeId])

  // 节点变化时同步当前文档 ID
  useEffect(() => {
    currentDocumentIdRef.current = nodeInfo?.document_id ?? null
  }, [nodeInfo?.document_id])

  const fetchDocument = useCallback(async () => {
    if (loadStatus === LoadStatus.Loading) return
    const documentId = nodeInfo?.document_id
    setEditorLoading(true)
    if (!documentId) {
      pendingContentRef.current = null
      pendingDocumentIdRef.current = null
      setContent({})
      setInitialContent({})
      setLoadStatus(LoadStatus.Normal)
      return
    }
    try {
      setLoadStatus(LoadStatus.Loading)
      const res = sanitizeInitialContent(await getDocument(documentId))
      pendingContentRef.current = null
      pendingDocumentIdRef.current = null
      setContent(res || {})
      setInitialContent(res || {})
    } catch {
      setLoadStatus(LoadStatus.Failed)
    } finally {
      setLoadStatus(LoadStatus.Normal)
    }
  }, [nodeId, nodeInfo?.document_id])

  useEffect(() => {
    if (!nodeInfo || nodeInfo.node_type !== 'function') return
    fetchDocument()
  }, [nodeId, nodeInfo, fetchDocument])

  useEffect(() => {
    setEditorLoading(true)
  }, [nodeId, nodeInfo?.document_id])

  /** 处理开发模式切换 */
  const handleDevModeChange = (checked: boolean) => {
    try {
      setDevModeLoading(true)

      if (checked) {
        // 开启开发模式：设置当前节点为开发模式节点（会自动关闭之前的）
        setDevModeNodeId(projectId, nodeId)
        messageApi.success('已开启开发模式')
      } else {
        // 关闭开发模式
        setDevModeNodeId(projectId, null)
        messageApi.success('已关闭开发模式')
      }

      setDevMode(checked)
    } catch {
      messageApi.error('切换开发模式失败')
    } finally {
      setDevModeLoading(false)
    }
  }

  const flushPendingSave = useCallback(async () => {
    if (nodeInDevMode || editorLoading) return

    const documentId = pendingDocumentIdRef.current || currentDocumentIdRef.current
    if (!documentId) return

    if (isSavingRef.current) {
      needRescheduleRef.current = true
      return
    }

    const currentPending = pendingContentRef.current
    if (!currentPending) return

    const saveOnce = async (nextContent: any): Promise<boolean> => {
      if (currentDocumentIdRef.current !== documentId) return false
      const patches = jsonpatch.compare(contentRef.current || {}, nextContent || {})
      if (patches.length === 0) return true

      try {
        await putDocument(documentId, patches as any)
        if (currentDocumentIdRef.current === documentId) {
          contentRef.current = nextContent
          setContent(nextContent)
        }
        return true
      } catch {
        return false
      }
    }

    isSavingRef.current = true
    pendingContentRef.current = null

    // 第一次发送：当前待保存版本
    let success = await saveOnce(currentPending)

    // 失败后：基于最近已保存版本重新比较并补发一次
    if (!success && currentDocumentIdRef.current === documentId) {
      const retryTarget = pendingContentRef.current || currentPending
      pendingContentRef.current = null
      success = await saveOnce(retryTarget)

      if (!success && currentDocumentIdRef.current === documentId && !pendingContentRef.current) {
        pendingContentRef.current = retryTarget
      }
    }

    isSavingRef.current = false
    if (!pendingContentRef.current) {
      pendingDocumentIdRef.current = null
    }

    if (pendingContentRef.current || needRescheduleRef.current) {
      needRescheduleRef.current = false
      scheduleSaveDocumentRef.current?.()
    }
  }, [nodeInDevMode, editorLoading])

  const scheduleSaveDocument = useMemo(
    () =>
      debounce(() => {
        void flushPendingSave()
      }, 1000),
    [flushPendingSave],
  )

  const flushBeforeLeaveEditor = useCallback(() => {
    scheduleSaveDocument.cancel()
    void flushPendingSave()
  }, [scheduleSaveDocument, flushPendingSave])

  useEffect(() => {
    scheduleSaveDocumentRef.current = scheduleSaveDocument
    return () => {
      scheduleSaveDocumentRef.current = null
    }
  }, [scheduleSaveDocument])

  useEffect(() => {
    if (!editorLoading) return
    scheduleSaveDocument.cancel()
    pendingContentRef.current = null
    pendingDocumentIdRef.current = null
    needRescheduleRef.current = false
  }, [editorLoading, scheduleSaveDocument])

  // 离开当前节点前检查并执行一次立即保存
  useEffect(() => {
    return () => {
      flushBeforeLeaveEditor()
    }
  }, [nodeId, flushBeforeLeaveEditor])

  // 切出“设计文档”tab 前检查并执行一次立即保存
  useEffect(() => {
    if (activeTab !== NodeDetailTabKey.Document) {
      flushBeforeLeaveEditor()
    }
  }, [activeTab, flushBeforeLeaveEditor])

  const handleUpdate = (newContent: any) => {
    const documentId = nodeInfo?.document_id
    if (!documentId || nodeInDevMode || editorLoading) {
      return
    }

    // 每次输入都及时更新待保存版本
    pendingContentRef.current = newContent
    pendingDocumentIdRef.current = documentId
    scheduleSaveDocument()
  }

  const handleEditorLoadingStateChange = useCallback((loading: boolean) => {
    setEditorLoading(loading)
  }, [])

  /** 获取节点详情tabs */
  const tabItems = useMemo(() => {
    if (nodeInfo?.node_type === 'function') {
      return [
        { label: '设计文档', key: NodeDetailTabKey.Document },
        { label: '详情', key: NodeDetailTabKey.Detail },
      ]
    }
    return [{ label: '详情', key: NodeDetailTabKey.Detail }]
  }, [nodeInfo?.node_type])

  if (!nodeInfo) {
    return (
      <div className="flex items-center justify-center h-full text-[--dip-text-color-65]">
        节点信息不存在
      </div>
    )
  }

  const prompt = `从 DIP Studio 获取设计文档并开发应用，\nnode_id: ${nodeId}`

  // 判断 host 是否为 IP 地址（IPv4 或 IPv6）
  const isIPAddress = (host: string): boolean => {
    // IPv6 地址通常包含方括号，如 [::1] 或 [2001:db8::1]
    if (host.startsWith('[') && host.includes(']')) {
      return true
    }
    // IPv4 地址正则：匹配 0.0.0.0 到 255.255.255.255
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (ipv4Regex.test(host)) {
      // 验证每个数字段是否在 0-255 范围内
      const parts = host.split('.')
      return parts.every((part) => {
        const num = parseInt(part, 10)
        return num >= 0 && num <= 255
      })
    }
    return false
  }

  const protocol = isIPAddress(window.location.host) ? 'http' : 'https'
  const url = `${protocol}://${window.location.host}/dip-studio/mcp`

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value)
    messageApi.success('复制成功')
  }

  /** Promot 弹窗内容 */
  const promotContent = () => (
    <div className="w-[400px]">
      <div className="mb-2 text-base font-medium">复制提示词</div>
      <div className="mb-2 text-[13px] leading-5 text-[--dip-text-color-45]">
        请先在代码编辑器中配置以下 MCP Server 地址：
      </div>
      <div className="text-xs leading-5 text-[--dip-text-color] bg-[#779EEA1A] border border-dashed border-[#779EEA] px-2.5 py-2 mb-4">
        {url}
        <button
          type="button"
          title="复制"
          className="ml-2 cursor-pointer"
          onClick={() => handleCopy(url)}
        >
          <IconFont type="icon-dip-copy" />
        </button>
      </div>
      <div className="mb-2 text-[13px] leading-5 text-[--dip-text-color-45]">
        复制以下提示词，粘贴到代码编辑器的 Al 对话框中：
      </div>
      <div className="text-xs leading-5 text-[--dip-text-color] bg-[#779EEA1A] border border-dashed border-[#779EEA] px-2.5 py-2 mb-2">
        {prompt}
        <button
          type="button"
          title="复制"
          className="ml-2 cursor-pointer"
          onClick={() => handleCopy(prompt)}
        >
          <IconFont type="icon-dip-copy" />
        </button>
      </div>
    </div>
  )

  /** 渲染状态内容（loading/error/empty） */
  const renderStateContent = () => {
    if (loadStatus === LoadStatus.Loading) {
      return <Spin />
    }

    if (loadStatus === LoadStatus.Failed) {
      return (
        <Empty type="failed" title="加载失败">
          <Button className="mt-1" type="primary" onClick={fetchDocument}>
            重试
          </Button>
        </Empty>
      )
    }

    return null
  }

  return (
    <div className="h-full overflow-y-auto flex flex-col">
      {messageContextHolder}
      {/* 顶部标题区域 */}
      <div className="flex justify-between mb-4 gap-2">
        <div className="flex gap-2">
          <div className="text-base font-medium text-[--dip-text-color]">{nodeInfo.name}</div>
          <div className="border-[#BAE0FF] border text-[#1677FF] rounded bg-[#E6F4FF] text-xs flex justify-center items-center px-2 h-6 shrink-0">
            {objectTypeNameMap(nodeInfo.node_type)}
          </div>
        </div>
        <div className="flex gap-2 shrink-0 items-center h-6">
          {nodeInDevMode && (
            <Popover
              content={promotContent}
              trigger="click"
              placement="bottom"
              arrow={false}
              styles={{ container: { padding: '20px 24px' } }}
            >
              <button
                type="button"
                className="h-full text-sm text-[--dip-white] bg-[#4096FF] rounded px-2"
              >
                查看提示词
              </button>
            </Popover>
          )}
          <span className="text-sm text-[--dip-text-color-65]">开发模式</span>
          <Switch
            checked={devMode}
            loading={devModeLoading}
            onChange={handleDevModeChange}
            size="small"
          />
        </div>
      </div>

      {/* 详情区域 */}
      <Tabs
        className={styles.tabs}
        items={tabItems}
        activeKey={activeTab}
        size="small"
        onChange={(key) => setActiveTab(key as NodeDetailTabKey)}
      />
      <div
        className={clsx(
          'border border-[--dip-border-color] overflow-hidden flex-1',
          styles.editorContainer,
        )}
      >
        <ScrollBarContainer
          className={clsx(
            'h-full px-6 tiptap-scroll-container relative',
            nodeInDevMode && 'bg-[#D9D9D91A]',
          )}
        >
          {activeTab === NodeDetailTabKey.Detail && (
            <Descriptions
              className="py-6"
              column={1}
              size="small"
              items={[
                {
                  label: '描述',
                  children: nodeInfo.description || '暂无描述',
                },
                {
                  label: '创建者',
                  children: nodeInfo.creator_name || '--',
                },
                {
                  label: '创建时间',
                  children: nodeInfo.created_at ? formatTime(nodeInfo.created_at) : '--',
                },
                {
                  label: '编辑者',
                  children: nodeInfo.editor_name || '--',
                },
                {
                  label: '编辑时间',
                  children: nodeInfo.edited_at ? formatTime(nodeInfo.edited_at) : '--',
                },
              ]}
              styles={{
                label: { minWidth: 80 },
                content: { color: 'var(--dip-text-color)', lineHeight: '28px' },
              }}
            />
          )}
          {activeTab === NodeDetailTabKey.Document &&
            (loadStatus === LoadStatus.Normal ? (
              <TiptapEditor
                initialContent={initialContent}
                onUpdate={handleUpdate}
                onLoadingStateChange={handleEditorLoadingStateChange}
                readOnly={nodeInDevMode || editorLoading}
                placeholder="请描述该功能...（输入/ 可引用 业务知识网络、决策智能体、指标）"
              />
            ) : (
              <div className="h-full flex items-center justify-center">{renderStateContent()}</div>
            ))}
          {activeTab === NodeDetailTabKey.Document && nodeInDevMode && (
            <div className="w-full h-fit text-center text-xs bg-[--dip-hover-bg-color] text-[--dip-text-color-45] absolute top-0 left-0">
              开发模式下设计文档为只读状态
            </div>
          )}
        </ScrollBarContainer>
      </div>
    </div>
  )
}

export default ProjectNodeDetail
