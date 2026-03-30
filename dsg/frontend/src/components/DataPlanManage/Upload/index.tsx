import { Upload as AntUpload, message, UploadProps } from 'antd'
import { RcFile } from 'antd/lib/upload'
import Cookies from 'js-cookie'
import React, {
    PropsWithChildren,
    ReactNode,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { DeleteColored } from '@/icons'
import __ from './locale'
import { getFileExtension } from '@/utils'
import FileIcon from '@/components/File/FileIcon'
import styles from './styles.module.less'
import { FileIconType, supportFileTypeList } from '@/components/File/helper'

// 默认10M
const transUnit = (limitSize = 10 * 1024 * 1024) => {
    let unit = 'B'
    let size = limitSize
    switch (true) {
        case limitSize < 1024:
            break
        case limitSize / 1024 < 1024:
            unit = 'KB'
            size = Math.round(limitSize / 1024)
            break
        case limitSize / (1024 * 1024) < 1024:
            unit = 'MB'
            size = Math.round(limitSize / (1024 * 1024))
            break
        default:
            unit = 'GB'
            size = Math.round(limitSize / (1024 * 1024 * 1024))
            break
    }

    return { size, unit }
}

interface UploadType extends PropsWithChildren {
    onChange?: (val) => void
    value?: any
    // 上传地址
    action: string

    // 类型限制
    accept?: string
    // 单位为b
    limitSize?: number
    // 默认接收名称
    name?: string
}

const AcceptTypeMap = {
    '.doc': 'application/msword',
    '.docx':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.pdf': 'application/pdf',
}

const Upload: React.FC<UploadType> = ({
    onChange,
    value,
    action,
    name = 'file',
    accept = undefined,
    limitSize,
    children,
}) => {
    const [fileInfo, setFileInfo] = useState<any>()
    const acceptTypes = useMemo(() => {
        return (accept || '').split(',')
    }, [accept])

    useEffect(() => {
        if (value?.length > 0) {
            setFileInfo(Array.isArray(value) ? value : [value])
        } else {
            setFileInfo(undefined)
        }
    }, [value])

    const handleChange: UploadProps['onChange'] = async ({ file }) => {
        if (file.status === 'error') {
            message.error(
                __('上传失败，${detail}', {
                    detail: file?.response?.description || '未知错误',
                }),
            )
        }
        if (file.status === 'done') {
            const curFile = {
                uid: file.response?.uuid,
                name: file.name,
            }
            setFileInfo([curFile])
            onChange?.([curFile])
            message.success(__('上传成功'))
        }
    }

    const uploadProps: UploadProps = {
        name,
        action,
        accept,
        maxCount: 1,
        fileList: fileInfo,
        headers: {
            Authorization: `Bearer ${Cookies.get('af.oauth2_token') || ''}`,
        },
        itemRender: (_node: any, fileItem, currFileList) =>
            (
                <div key={fileItem.uid} className={styles['file-wrapper']}>
                    <div className={styles['file-wrapper-info']}>
                        <FileIcon
                            type={getFileExtension(fileItem.name)}
                            className={styles['file-wrapper-info-icon']}
                        />
                        <div
                            className={styles['file-wrapper-info-name']}
                            title={fileItem.name}
                        >
                            {fileItem.name}
                        </div>
                    </div>
                    <DeleteColored
                        className={styles['file-wrapper-delete']}
                        onClick={() => handleDelete()}
                    />
                </div>
            ) as any,
        beforeUpload: (file: RcFile) => {
            if (limitSize && limitSize < file.size) {
                const { size, unit } = transUnit(limitSize)
                message.error(`${__('文件大小不可超过')}${size}${unit}`)
                return AntUpload.LIST_IGNORE
            }
            const allowTypes = acceptTypes
                ?.map((o) => AcceptTypeMap?.[o])
                ?.filter((o) => !!o)
            if (allowTypes?.length > 0 && !allowTypes.includes(file.type)) {
                message.error(`${__('文件格式仅支持')}:${accept}`)
                return AntUpload.LIST_IGNORE
            }
            if (fileInfo?.length > 0) {
                handleDelete()
            }
            return true
        },
        onChange: handleChange,
        showUploadList: {
            showDownloadIcon: false,
            showRemoveIcon: true,
        },
    }

    const handleDelete = () => {
        setFileInfo(fileInfo ? undefined : [])
        onChange?.(undefined)
    }

    return (
        <div className={styles['upload-wrapper']}>
            <AntUpload {...uploadProps}>{children}</AntUpload>
        </div>
    )
}

export default Upload
