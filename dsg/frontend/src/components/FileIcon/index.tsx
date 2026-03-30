import React from 'react'
import {
    FileLinkColored,
    PDFColored,
    PictureColored,
    UnknowFileColored,
    WordColored,
    XlsColored,
} from '@/icons'
import styles from './styles.module.less'
import { FileIconType } from '../File/helper'

interface IFileIcon {
    suffix?: string
    style?: React.CSSProperties
}
const FileIcon: React.FC<IFileIcon> = ({ suffix = '', style }) => {
    const getIcon = () => {
        if (
            /(jpg|bmp|gif|ico|pcx|jpeg|tif|png|raw|tga)$/.test(
                suffix?.toLocaleLowerCase(),
            )
        ) {
            return <PictureColored />
        }
        switch (suffix) {
            case 'xls':
                return <XlsColored />
            case 'xlsx':
                return <XlsColored />
            case 'pdf':
                return <PDFColored />
            case 'doc':
                return <WordColored />
            case 'docx':
                return <WordColored />
            case FileIconType.LINK:
                return <FileLinkColored />
            default:
                return <UnknowFileColored />
        }
    }
    return (
        <span className={styles.fileIcon} style={{ ...style }}>
            {getIcon()}
        </span>
    )
}

export default FileIcon
