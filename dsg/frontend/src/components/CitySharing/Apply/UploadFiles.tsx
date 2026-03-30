import { FC } from 'react'
import { Button, message, Upload } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { RcFile, UploadProps } from 'antd/es/upload'
import { UploadFile } from 'antd/lib/upload/interface'
import __ from '../locale'
import FileIcon from '@/components/FileIcon'
import { DeleteColored } from '@/icons'
import styles from './styles.module.less'
import { getFileExtension } from '@/utils'

interface IUploadFiles {
    maxCount?: number // 最大上传数量
    fileList?: any // 需要上传的文件
    onChange?: (file: any) => void
    id?: string
    fileDesc?: any
    canView?: boolean
    uploadParams?: UploadProps
}

/**
 * 上传文件组件
 */
const UploadFiles: FC<IUploadFiles> = ({
    maxCount,
    fileList,
    onChange,
    id,
    fileDesc,
    canView,
    uploadParams,
}) => {
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

    // 文件上传限制
    const uploadProps: UploadProps = {
        accept: '.doc,.docx,.xlsx,.xls,.pdf',
        maxCount,
        fileList,
        onChange,
        beforeUpload: (file: RcFile) => {
            const limit = file.size / 1024 / 1024
            if (limit > 10) {
                message.error(__('文件不可超过10MB'))
                return Upload.LIST_IGNORE
            }
            const type = getFileExtension(file.name)
            if (
                !type ||
                !['xlsx', 'doc', 'docx', 'pdf', 'xls'].includes(type)
            ) {
                message.error(__('不支持的文件类型'))
                return Upload.LIST_IGNORE
            }
            return false
        },
        showUploadList: true,
        itemRender,
        ...uploadParams,
    }

    const handlePreview = async (file: UploadFile) => {
        if (!canView) return
        if (file.url) {
            window.open(file.url, '_blank')
        } else if (file.originFileObj) {
            const url = URL.createObjectURL(file.originFileObj)
            window.open(url, '_blank')
        }
    }

    return (
        <div className={styles.uploadFiles} id={id}>
            {fileDesc || (
                <div className={styles.fileDesc}>
                    <div className={styles.fileOrder} />
                    {__(
                        '支持类型.doc、docx、.xlsx、.xls、.pdf，文件不得超过10MB',
                    )}
                </div>
            )}
            {maxCount === 1 && (
                <div className={styles.fileDesc}>
                    <div className={styles.fileOrder} />
                    {__('仅支持上传一个文件')}
                </div>
            )}
            <Upload {...uploadProps}>
                <Button
                    type="primary"
                    className={styles.uploadBtn}
                    icon={<UploadOutlined />}
                >
                    {__('上传文件')}
                </Button>
            </Upload>
        </div>
    )
}

export default UploadFiles
