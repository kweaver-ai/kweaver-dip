import React from 'react'
import { FileIconType } from './helper'
import { WordColored2, PDFColored, FileLinkColored } from '@/icons'

export interface IFileIconProps {
    type?: string
    fontSize?: number
    className?: string
    style?: React.CSSProperties
}

const FileIcon: React.FC<IFileIconProps> = ({
    type = FileIconType.LINK,
    fontSize = 20,
    ...props
}) => {
    const getFileIcon = (_t: string) => {
        switch (_t) {
            case FileIconType.DOC:
            case FileIconType.DOCX:
                return <WordColored2 style={{ fontSize }} {...props} />
            case FileIconType.PDF:
                return <PDFColored style={{ fontSize }} {...props} />
            case FileIconType.LINK:
            default:
                return <FileLinkColored style={{ fontSize }} {...props} />
        }
    }
    return getFileIcon(type)
}

export default FileIcon
