import React, { ReactNode, useEffect, useState } from 'react'
import { FileZipOutlined, UploadOutlined } from '@ant-design/icons'
import { Button, message, Upload, UploadProps } from 'antd'
import { RcFile } from 'antd/lib/upload'
import Cookies from 'js-cookie'
import styles from './styles.module.less'
import { DeleteColored, RecycleBinOutlined } from '@/icons'
import { downloadDemandFile, formatError } from '@/core'
import { streamToFile } from '@/utils'
import __ from './locale'

interface UploadFileType {
    value?: any
    onChange?: (val) => void
    url: string
    titles?: Array<string | ReactNode>
    // 单位为b
    limitSize?: number
    // 类型限制
    accept?: string
    maxCount: number
}
const UploadFile: React.FC<UploadFileType> = ({
    value,
    onChange,
    url,
    titles = [],
    limitSize,
    accept = undefined,
    maxCount = 1,
}) => {
    const [fileInfo, setFileInfo] = useState<any>()

    const [errorText, setErrorText] = useState('')

    useEffect(() => {
        if (value) {
            setFileInfo(value)
        }
    }, [value])

    const uploadProps: UploadProps = {
        name: 'file',
        action: url,
        maxCount,
        showUploadList: false,
        headers: {
            Authorization: `Bearer ${Cookies.get('af.oauth2_token') || ''}`,
        },
        accept,
        beforeUpload: (file: RcFile) => {
            if (limitSize && limitSize < file.size) {
                let unit = 'B'
                let sizeData = limitSize
                switch (true) {
                    case limitSize < 1024:
                        break
                    case limitSize / 1024 < 1024:
                        unit = 'KB'
                        sizeData = Math.round(limitSize / 1024)
                        break
                    case limitSize / (1024 * 1024) < 1024:
                        unit = 'MB'
                        sizeData = Math.round(limitSize / (1024 * 1024))
                        break
                    default:
                        unit = 'GB'
                        sizeData = Math.round(limitSize / (1024 * 1024 * 1024))
                        break
                }
                setErrorText(`${__('文件大小不可超过')}${sizeData}${unit}`)
                message.error(`${__('文件大小不可超过')}${sizeData}${unit}`)
                return false
            }

            setErrorText('')
            return true
        },
        onChange({ file }) {
            if (file.status === 'error') {
                message.error(
                    __('上传失败，${detail}', {
                        detail: file.response.description,
                    }),
                )
                setErrorText(file.response.description)
            }
            if (file.status === 'done') {
                setFileInfo(file.response)
                const newFileInfo = file.response
                onChange?.(newFileInfo)
                message.success(__('上传成功'))
            }
        },
    }

    const handleDelete = () => {
        setFileInfo(undefined)
        onChange?.(undefined)
    }

    const handleDownload = async () => {
        try {
            if (!fileInfo.id) return
            const res = await downloadDemandFile(fileInfo.id)
            // 将文件流转换成文件
            streamToFile(res, fileInfo.file_name)
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <div className={styles.uploadApplicationLetter}>
            {titles.map((title) => (
                <div className={styles.fileDesc}>
                    <div className={styles.fileOrder}>·</div>
                    {title}
                </div>
            ))}
            <div className={styles.uploadWrapper}>
                <Upload {...uploadProps}>
                    <a className={styles.uploadBtn}>
                        {/* <UploadOutlined className={styles.uploadIcon} /> */}
                        {__('上传文件')}
                    </a>
                </Upload>
            </div>
            {fileInfo && fileInfo.file_name ? (
                <div className={styles.filterWrapper}>
                    <div className={styles.fileAndIcon}>
                        <FileZipOutlined className={styles.fileIcon} />
                        <div
                            className={styles.fileName}
                            onClick={handleDownload}
                        >
                            {fileInfo.file_name}
                        </div>
                    </div>
                    <DeleteColored
                        className={styles.deleteIcon}
                        onClick={() => handleDelete()}
                    />
                </div>
            ) : null}
        </div>
    )
}

export default UploadFile
