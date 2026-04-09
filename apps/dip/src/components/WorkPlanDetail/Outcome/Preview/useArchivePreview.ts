import { useCallback, useEffect, useRef, useState } from 'react'
import { getSessionArchiveSubpath } from '@/apis/dip-studio/sessions'
import {
  mockGetDigitalHumanSessionArchiveSubpath,
  RESULTS_PANEL_USE_MOCK,
} from '../resultsPanelMock'
import {
  type ArchivePreviewViewer,
  formatPreviewContent,
  getArchiveFileMimeForBlob,
  getArchivePreviewViewer,
  getArchiveTextPreviewViewer,
  previewResponseType,
} from '../utils'

export type ArchivePreviewState = {
  title: string
  subpath: string
  body: string
  loading: boolean
  viewer: ArchivePreviewViewer
  blobUrl?: string
  error?: string | null
}

export function useArchivePreview(dhId: string, sessionId: string) {
  const previewBlobUrlRef = useRef<string | undefined>(undefined)

  const revokePreviewBlobUrl = useCallback(() => {
    if (previewBlobUrlRef.current) {
      URL.revokeObjectURL(previewBlobUrlRef.current)
      previewBlobUrlRef.current = undefined
    }
  }, [])

  const [preview, setPreview] = useState<ArchivePreviewState | null>(null)

  useEffect(() => () => revokePreviewBlobUrl(), [revokePreviewBlobUrl])

  const openFilePreview = useCallback(
    async (subpath: string, title: string) => {
      if (!(dhId && sessionId)) return
      revokePreviewBlobUrl()
      setPreview({
        title,
        subpath,
        body: '',
        loading: true,
        viewer: getArchiveTextPreviewViewer(title),
        error: null,
      })
      try {
        const rt = previewResponseType(title)
        if (rt === 'arraybuffer') {
          const res = RESULTS_PANEL_USE_MOCK
            ? await mockGetDigitalHumanSessionArchiveSubpath(subpath, {
                responseType: 'arraybuffer',
              })
            : await getSessionArchiveSubpath(sessionId, subpath, {
                responseType: 'arraybuffer',
              })
          if (!(res instanceof ArrayBuffer)) {
            // message.error('文件数据格式异常')
            setPreview((p) =>
              p
                ? { ...p, body: '', loading: false, viewer: 'text', error: '文件数据格式异常' }
                : null,
            )
            return
          }
          const mime = getArchiveFileMimeForBlob(title)
          const blob = new Blob([res], { type: mime })
          const blobUrl = URL.createObjectURL(blob)
          previewBlobUrlRef.current = blobUrl
          const viewer = getArchivePreviewViewer(title)
          setPreview((p) =>
            p ? { ...p, body: '', loading: false, viewer, blobUrl, error: null } : null,
          )
          return
        }

        const res = RESULTS_PANEL_USE_MOCK
          ? await mockGetDigitalHumanSessionArchiveSubpath(subpath, { responseType: rt })
          : await getSessionArchiveSubpath(sessionId, subpath, {
              responseType: rt,
            })
        const body = formatPreviewContent(res, title)
        setPreview((p) =>
          p
            ? {
                ...p,
                body,
                loading: false,
                viewer: getArchiveTextPreviewViewer(title),
                error: null,
              }
            : null,
        )
      } catch {
        // message.error('加载文件失败')
        revokePreviewBlobUrl()
        setPreview((p) =>
          p ? { ...p, body: '', loading: false, viewer: 'text', error: '加载文件失败' } : null,
        )
      }
    },
    [dhId, sessionId, revokePreviewBlobUrl],
  )

  const closePreview = useCallback(() => {
    revokePreviewBlobUrl()
    setPreview(null)
  }, [revokePreviewBlobUrl])

  const downloadFile = useCallback(
    async (subpath: string, fileName: string) => {
      if (!(dhId && sessionId && subpath)) return
      const res = RESULTS_PANEL_USE_MOCK
        ? await mockGetDigitalHumanSessionArchiveSubpath(subpath, { responseType: 'arraybuffer' })
        : await getSessionArchiveSubpath(sessionId, subpath, {
            responseType: 'arraybuffer',
          })
      if (!(res instanceof ArrayBuffer)) {
        throw new Error('文件数据格式异常')
      }
      const blob = new Blob([res], { type: getArchiveFileMimeForBlob(fileName) })
      const blobUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = blobUrl
      anchor.download = fileName || 'download'
      anchor.style.display = 'none'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(blobUrl)
    },
    [dhId, sessionId],
  )

  return { preview, openFilePreview, closePreview, downloadFile }
}
