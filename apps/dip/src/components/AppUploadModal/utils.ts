import type { FileInfo } from './types'

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

/**
 * 验证文件格式
 */
export const validateFileFormat = (file: File): boolean => {
  return file.name.toLowerCase().endsWith('.dip')
}

/**
 * 验证文件大小（1GB = 1024 * 1024 * 1024 bytes）
 */
export const validateFileSize = (file: File): boolean => {
  const maxSize = 1024 * 1024 * 1024 // 1GB
  return file.size <= maxSize
}

/**
 * 获取文件信息
 */
export const getFileInfo = (file: File): FileInfo => {
  return {
    name: file.name,
    size: file.size,
    file,
  }
}
