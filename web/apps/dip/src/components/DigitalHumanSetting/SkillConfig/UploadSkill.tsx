import {
  CheckCircleFilled,
  CloseCircleFilled,
  CloseCircleOutlined,
  FileZipOutlined,
} from '@ant-design/icons'
import type { ModalProps, UploadProps } from 'antd'
import { Button, Modal, message, Spin, Upload } from 'antd'
import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { installSkill } from '@/apis'
import type { InstallSkillResult } from '@/apis/dip-studio/skills'
import UploadFileIcon from '@/assets/images/uploadFile.svg?react'
import uploadModalStyles from '@/components/AppUploadModal/index.module.less'
import type { FileInfo } from '@/components/AppUploadModal/types'
import { UploadStatus } from '@/components/AppUploadModal/types'
import { formatFileSize, getFileInfo } from '@/components/AppUploadModal/utils'
import ScrollBarContainer from '@/components/ScrollBarContainer'
import styles from './UploadSkill.module.less'

const { Dragger } = Upload

/** 与 Dragger 提示文案一致 */
const MAX_FILE_SIZE_MB = 24
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

function validateSkillFileFormat(file: File): boolean {
  const n = file.name.toLowerCase()
  return n.endsWith('.zip') || n.endsWith('.skill')
}

function validateSkillFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE_BYTES
}

function getInstallSkillErrorMessage(error: unknown): string {
  if (error == null) return '上传失败，请重试'
  if (typeof error === 'string') return error || '上传失败，请重试'
  if (typeof error === 'object') {
    const o = error as { description?: unknown; message?: unknown }
    const desc = o.description != null ? String(o.description).trim() : ''
    if (desc) return desc
    const msg = o.message != null ? String(o.message).trim() : ''
    if (msg) return msg
  }
  return '上传失败，请重试'
}

export interface UploadSkillProps extends Pick<ModalProps, 'open' | 'onCancel'> {
  /** 导入成功后的回调（例如刷新技能列表） */
  onSuccess?: () => void
  /** 成功后查看技能详情 */
  onDetail?: (data: InstallSkillResult) => void
}

/** 导入技能包弹窗（交互与 AppUploadModal 一致，仅请求为 installSkill） */
const UploadSkill = ({ open, onCancel, onSuccess, onDetail }: UploadSkillProps) => {
  const [modal, contextHolder] = Modal.useModal()
  const [messageApi, messageContextHolder] = message.useMessage()
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>(UploadStatus.INITIAL)
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const uploadRequestRef = useRef<{ abort: () => void } | null>(null)
  const uploadResultRef = useRef<InstallSkillResult | null>(null)
  const uploadStatusRef = useRef<UploadStatus>(UploadStatus.INITIAL)

  useEffect(() => {
    uploadStatusRef.current = uploadStatus
  }, [uploadStatus])

  const resetState = () => {
    setUploadStatus(UploadStatus.INITIAL)
    setFileInfo(null)
    setErrorMessage('')
    if (uploadRequestRef.current) {
      uploadRequestRef.current.abort()
      uploadRequestRef.current = null
    }
    uploadResultRef.current = null
  }

  useEffect(() => {
    if (!open) {
      resetState()
    }
  }, [open])

  const handleFileChange: UploadProps['onChange'] = (info) => {
    const { file } = info
    const { status } = file

    if (status === 'removed') {
      setFileInfo(null)
      setUploadStatus(UploadStatus.INITIAL)
      setErrorMessage('')
      return
    }

    if (status === 'done' || status === 'uploading') {
      return
    }

    const fileObj = file.originFileObj || file
    if (!(fileObj && fileObj instanceof File)) {
      return
    }

    if (!validateSkillFileFormat(fileObj)) {
      messageApi.error('仅支持 .zip / .skill 格式的技能包')
      return
    }

    if (!validateSkillFileSize(fileObj)) {
      messageApi.error(`技能包大小不能超过 ${MAX_FILE_SIZE_MB}MB`)
      return
    }

    setFileInfo(getFileInfo(fileObj))
    setUploadStatus(UploadStatus.READY)
    setErrorMessage('')
  }

  const handleUpload = async () => {
    if (!fileInfo) {
      return
    }

    if (uploadRequestRef.current) {
      uploadRequestRef.current.abort()
      uploadRequestRef.current = null
    }

    setUploadStatus(UploadStatus.UPLOADING)
    setErrorMessage('')

    try {
      const file = fileInfo.file
      const requestPromise = installSkill({ file })
      uploadRequestRef.current = requestPromise as unknown as { abort: () => void }

      const result = await requestPromise

      if (!uploadRequestRef.current) {
        return
      }

      uploadRequestRef.current = null
      setUploadStatus(UploadStatus.SUCCESS)
      uploadResultRef.current = result
    } catch (error: unknown) {
      if (!uploadRequestRef.current) {
        return
      }

      const err = error as { name?: string; message?: string }
      if (err?.name === 'AbortError' || err?.message === 'CANCEL' || error === 'CANCEL') {
        uploadRequestRef.current = null
        return
      }

      uploadRequestRef.current = null
      setUploadStatus(UploadStatus.FAILED)
      setErrorMessage(getInstallSkillErrorMessage(error))
    }
  }

  const handleCancelUpload = () => {
    if (uploadStatusRef.current === UploadStatus.SUCCESS) {
      messageApi.warning('导入已完成，无法取消')
      return
    }

    if (uploadRequestRef.current) {
      uploadRequestRef.current.abort()
      uploadRequestRef.current = null
    }
    setUploadStatus(UploadStatus.READY)
    setErrorMessage('')
    onCancel?.(undefined as never)
  }

  const handleCancel = (e?: unknown) => {
    if (uploadStatus === UploadStatus.UPLOADING) {
      modal.confirm({
        title: '确认取消导入',
        content: '正在上传中，取消后将中断上传。是否继续？',
        okText: '确定',
        okType: 'primary',
        okButtonProps: { danger: true },
        cancelText: '取消',
        onOk: handleCancelUpload,
        footer: (_, { OkBtn, CancelBtn }) => (
          <>
            <OkBtn />
            <CancelBtn />
          </>
        ),
      })
    } else if (uploadStatus === UploadStatus.SUCCESS) {
      onSuccess?.()
      onCancel?.(undefined as never)
    } else {
      onCancel?.(e as never)
    }
  }

  const draggerProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.zip,.skill',
    beforeUpload: () => false,
    onChange: handleFileChange,
    showUploadList: false,
    disabled: uploadStatus === UploadStatus.UPLOADING || uploadStatus === UploadStatus.SUCCESS,
  }

  const renderUploadArea = () => {
    const isUploading = uploadStatus === UploadStatus.UPLOADING

    return (
      <Dragger {...draggerProps}>
        {isUploading ? (
          <div className="flex flex-col items-center justify-center" style={{ height: '100%' }}>
            <Spin />
            <p className="mt-4 text-sm text-[#1677FF]">正在验证技能包...</p>
          </div>
        ) : (
          <>
            <p className="ant-upload-drag-icon">
              <UploadFileIcon style={{ width: 48, height: 48 }} />
            </p>
            <p className="ant-upload-text">点击或将文件拖拽到这里上传</p>
            <p className="ant-upload-hint">
              支持 .zip / .skill 格式的技能包，大小不超过 {MAX_FILE_SIZE_MB}MB
            </p>
          </>
        )}
      </Dragger>
    )
  }

  const renderFileInfo = () => {
    if (!fileInfo || uploadStatus === UploadStatus.INITIAL) {
      return null
    }

    const isUploading = uploadStatus === UploadStatus.UPLOADING
    const isFailed = uploadStatus === UploadStatus.FAILED

    return (
      <div className="mt-4 p-4 bg-[#F9FAFC] rounded-lg">
        <div className="flex items-center gap-3">
          <FileZipOutlined className="text-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate" title={fileInfo.name}>
              {fileInfo.name}
            </div>
            <div className="text-xs text-[rgba(0,0,0,0.45)] mt-1">
              {formatFileSize(fileInfo.size)}
            </div>
          </div>
          <div className="flex-shrink-0">
            {isUploading && (
              <span className="px-2 py-0.5 text-xs border border-[--dip-border-color-base] rounded">
                验证中
              </span>
            )}
            {uploadStatus === UploadStatus.READY && (
              <span className="px-2 py-0.5 text-xs border border-[--dip-border-color-base] rounded">
                等待导入
              </span>
            )}
            {isFailed && (
              <div className="flex items-center gap-1 px-2 py-0.5 text-xs text-[--dip-error-color] bg-[rgba(255,77,79,0.1)] border border-[#FFCCC7] rounded">
                <CloseCircleOutlined className="text-[--dip-error-color]" />
                导入失败
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderError = () => {
    if (!errorMessage || uploadStatus !== UploadStatus.FAILED) {
      return null
    }

    return (
      <ScrollBarContainer className="mt-4 px-3 py-2 bg-[#FFF1F0] border border-[#FFCCC7] rounded-lg">
        <div className="flex gap-2 items-start">
          <CloseCircleFilled className="text-[--dip-error-color] text-base flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">{errorMessage}</div>
        </div>
      </ScrollBarContainer>
    )
  }

  const renderActionButton = () => {
    const isUploading = uploadStatus === UploadStatus.UPLOADING
    const canUpload = uploadStatus === UploadStatus.READY || uploadStatus === UploadStatus.FAILED

    return (
      <div className="my-4">
        <Button
          type="primary"
          block
          disabled={!canUpload}
          onClick={() => void handleUpload()}
          style={{ opacity: isUploading ? 0.25 : 1 }}
        >
          导入技能
        </Button>
      </div>
    )
  }

  const renderSuccess = () => {
    if (uploadStatus !== UploadStatus.SUCCESS) {
      return null
    }

    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <CheckCircleFilled className="text-7xl text-[--dip-success-color]" />
        <div className="mt-8 text-2xl font-medium">技能导入成功</div>
        <div className="mt-2 text-sm text-[--dip-text-color-45]">
          您的技能已导入成功，可前往技能列表查看
        </div>
        {onDetail && (
          <Button
            color="primary"
            variant="outlined"
            onClick={() => uploadResultRef.current && onDetail?.(uploadResultRef.current)}
            className="mt-4"
          >
            查看技能
          </Button>
        )}
      </div>
    )
  }

  return (
    <Modal
      title="导入技能"
      open={open}
      onCancel={handleCancel}
      closable
      mask={{ closable: false }}
      destroyOnHidden
      width={620}
      styles={{
        container: {
          maxHeight: 600,
          minHeight: 436,
          display: 'flex',
          flexDirection: 'column',
        },
        body: {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden',
        },
      }}
      okText="确定"
      onOk={
        uploadStatus === UploadStatus.SUCCESS
          ? () => {
              onSuccess?.()
              onCancel?.(undefined as never)
            }
          : undefined
      }
      cancelText="取消"
      cancelButtonProps={{
        onClick: () => handleCancel(),
      }}
      footer={(_, { OkBtn, CancelBtn }) => (
        <>{uploadStatus === UploadStatus.SUCCESS ? <OkBtn /> : <CancelBtn />}</>
      )}
    >
      {contextHolder}
      {messageContextHolder}
      <div
        className={clsx(
          uploadModalStyles.uploadContainer,
          styles.uploadRoot,
          'flex flex-col h-full',
        )}
        style={{ overflow: 'hidden auto' }}
      >
        {uploadStatus === UploadStatus.SUCCESS ? (
          renderSuccess()
        ) : (
          <>
            <div className="mt-3">{renderUploadArea()}</div>
            {renderFileInfo()}
            {renderError()}
            {renderActionButton()}
          </>
        )}
      </div>
    </Modal>
  )
}

export default UploadSkill
