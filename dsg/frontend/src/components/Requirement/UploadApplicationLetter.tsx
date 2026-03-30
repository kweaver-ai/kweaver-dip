import React, { useEffect, useState } from 'react'
import { FileZipOutlined, UploadOutlined } from '@ant-design/icons'
import { Button, message, Upload, UploadProps } from 'antd'
import { RcFile } from 'antd/lib/upload'
import Cookies from 'js-cookie'
import styles from './styles.module.less'
import { DeleteColored, RecycleBinOutlined } from '@/icons'
import { downloadDemandFile, formatError } from '@/core'
import { streamToFile } from '@/utils'
import __ from './locale'

interface IUploadApplicationLetter {
    value?: any
    onChange?: (val) => void
}
const UploadApplicationLetter: React.FC<IUploadApplicationLetter> = ({
    value,
    onChange,
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
        action: '/api/demand-management/v1/files',
        maxCount: 1,
        showUploadList: false,
        headers: {
            Authorization: `Bearer ${Cookies.get('af.oauth2_token') || ''}`,
        },
        beforeUpload: (file: RcFile) => {
            const isLt10M = file.size / 1024 / 1024 < 10
            if (!isLt10M) {
                setErrorText(__('文件大小不可超过10MB'))
                message.error(__('申请函件大小不能超过10MB'))
                return false
            }
            setErrorText('')
            return true
        },
        onChange({ file }) {
            if (file.status === 'error') {
                setErrorText(file.response.description)
            }
            if (file.status === 'done') {
                setFileInfo(file.response)
                const { file_name, id, file_uuid } = file.response
                onChange?.({
                    file_name,
                    id,
                    type: 1,
                    file_uuid,
                })
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
            <div className={styles.fileDesc}>
                <div className={styles.fileOrder}>·</div>
                {__('不得超过10MB')}
            </div>
            <div className={styles.fileDesc}>
                <div className={styles.fileOrder}>·</div>
                {__('仅支持上传一个文件')}
            </div>

            <div className={styles.uploadWrapper}>
                <Upload {...uploadProps}>
                    <a className={styles.uploadBtn}>
                        {/* <UploadOutlined className={styles.uploadIcon} /> */}
                        {__('上传文件')}
                    </a>
                </Upload>
            </div>
            {fileInfo && (
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
            )}
        </div>
    )
}

export default UploadApplicationLetter
