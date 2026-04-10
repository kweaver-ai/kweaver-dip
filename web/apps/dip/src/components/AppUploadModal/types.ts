/**
 * 上传状态枚举
 */
export enum UploadStatus {
  /** 初始状态，未选择文件 */
  INITIAL = 'initial',
  /** 已选择文件，等待上传 */
  READY = 'ready',
  /** 上传中 */
  UPLOADING = 'uploading',
  /** 上传成功 */
  SUCCESS = 'success',
  /** 上传失败 */
  FAILED = 'failed',
}

/**
 * 文件信息
 */
export interface FileInfo {
  name: string
  size: number
  file: File
}
