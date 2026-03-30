import React, { useState } from 'react'
import { Upload, Button, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { UploadFile } from 'antd/lib/upload/interface'
import { getFileExtension } from '@/utils'
import FileIcon from '@/components/FileIcon'
import { DeleteColored } from '@/icons'
import __ from '../locale'
import styles from './styles.module.less'

const FileUploader: React.FC = (props: any) => {
    const { onChange } = props
    const [fileList, setFileList] = useState<UploadFile[]>([])

    const handleChange = (info: any) => {
        let newFileList = [...info.fileList]

        // 限制上传文件类型
        newFileList = newFileList.filter((file) => {
            const type = getFileExtension(file.name)
            const isSupportedType =
                type ||
                ['xlsx', 'doc', 'docx', 'pdf', 'xls'].includes(type || '')
            if (!isSupportedType) {
                message.error(__('不支持的文件类型'))
                return Upload.LIST_IGNORE
            }
            return isSupportedType
        })
        onChange?.(newFileList)
        setFileList(newFileList)
    }

    const handlePreview = async (file: UploadFile) => {
        if (file.url) {
            window.open(file.url, '_blank')
        } else if (file.originFileObj) {
            const url = URL.createObjectURL(file.originFileObj)
            window.open(url, '_blank')
        }
    }

    const itemRender = (
        originNode: any,
        file: any,
        files: any,
        { remove }: any,
    ) => {
        return (
            <div
                className={styles.uploadedFile}
                onClick={() => handlePreview(file)}
            >
                <FileIcon suffix={getFileExtension(file.name)} />
                <div className={styles.fileName} title={file.name}>
                    {file.name}
                </div>
                <DeleteColored
                    className={styles.deleteIcon}
                    onClick={(e) => {
                        e.stopPropagation()
                        remove(file)
                    }}
                />
            </div>
        )
    }

    return (
        <Upload
            action="" //
            fileList={fileList}
            accept=".doc,.docx,.xlsx,.xls,.pdf"
            onChange={handleChange}
            onPreview={handlePreview}
            beforeUpload={() => false} // 阻止自动上传
            itemRender={itemRender}
        >
            <Button icon={<UploadOutlined />}>上传文件</Button>
        </Upload>
    )
}

export default FileUploader
