import React, { useContext, useState } from 'react'
import { Modal, Button, Upload, message } from 'antd'
import { ExclamationCircleFilled } from '@ant-design/icons'
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface'
import { UploadOutlined, XlsColored, DeleteColored } from '@/icons'
import styles from './styles.module.less'
import { TaskInfoContext } from '@/context'
import { getActualUrl } from '@/utils'
import { TaskType } from '@/core'

/**
 * @interface
 * @param {string} title 导入弹窗标题
 * @param {boolean} visible 导入弹窗是否展示
 * @param {number} maxFile 最多上传文件个数
 * @param {() => void} onClose 弹窗关闭回调
 */
interface IImport {
    title: string
    visible: boolean
    maxSize?: number
    maxFile?: number
    downloadUrl: string
    downloadName: string
    id: string
    uploadFn: (id: string, formData: FormData) => Promise<any>
    update: () => void
    onClose: () => void
}
const Import: React.FC<IImport> = ({
    title,
    visible,
    maxSize = 1,
    maxFile = 1,
    downloadUrl,
    downloadName,
    id,
    uploadFn,
    update = () => {},
    onClose = () => {},
}) => {
    const [errorText, setErrorText] = useState('')

    const [uploading, setUploading] = useState(false)

    const [fileList, setFileList] = useState<UploadFile[]>([])

    const { taskInfo } = useContext(TaskInfoContext)

    const handleCancel = () => {
        setErrorText('')
        setFileList([])
        onClose()
    }
    const handleDeleteFile = () => {
        setFileList([])
    }

    const uploadProps: UploadProps = {
        accept: '.xlsx',
        beforeUpload: (file: RcFile) => {
            const isLt1M = file.size / 1024 / 1024 < maxSize
            if (!isLt1M) {
                setErrorText(`文件不可超过${maxSize}MB`)
                return false
            }
            const nameArr = file.name?.split('.')
            const fileSuffix = nameArr[1]
            if (!fileSuffix || !['xlsx'].includes(fileSuffix)) {
                setErrorText('文件格式错误，仅支持.xlsx')
                setFileList([file])
                return false
            }
            setErrorText('')
            setFileList([file])
            return false
        },
        showUploadList: false,
    }

    const handleUpload = async () => {
        if (errorText) return
        if (fileList.length < maxFile) {
            setErrorText('请选择上传的文件')
            return
        }
        const formData = new FormData()
        fileList.forEach((file) => {
            formData.append('file', file as RcFile)
        })
        if ([TaskType.MODEL].includes(taskInfo.taskType)) {
            formData.append('task_id', taskInfo.taskId)
        }
        setUploading(true)
        try {
            await uploadFn(id, formData)
            setFileList([])
            setErrorText('')
            message.success('上传成功')
            update()
            onClose()
        } catch (err) {
            if (err?.data) {
                setErrorText(err?.data?.description)
            } else {
                setErrorText('文件不存在请重新上传')
            }
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className={styles.importWrapper}>
            <Modal
                open={visible}
                title={title}
                width={480}
                getContainer={false}
                maskClosable={false}
                destroyOnClose
                bodyStyle={{ padding: 0 }}
                onOk={() => handleUpload()}
                onCancel={() => handleCancel()}
                okButtonProps={{
                    loading: uploading,
                }}
            >
                {errorText && (
                    <div className={styles.error}>
                        <ExclamationCircleFilled className={styles.errorIcon} />
                        <div className={styles.errorText}> {errorText}</div>
                    </div>
                )}
                <div className={styles.uploadBody}>
                    <div className={styles.uploadTitle}>上传文件</div>
                    <div className={styles.fileDesc}>
                        <div className={styles.fileOrder}>·</div>
                        上传的文件格式支持.xlsx，文件不得超过{maxSize}
                        MB
                    </div>
                    <div className={styles.fileDesc}>
                        <div className={styles.fileOrder}>·</div>
                        仅支持每次上传一个文件，且每次最多导入200个业务指标
                    </div>
                    <div className={styles.fileDesc}>
                        <div className={styles.fileOrder}>·</div>
                        <a
                            href={getActualUrl(downloadUrl, false)}
                            target="_blank"
                            download={downloadName}
                            rel="noreferrer"
                        >
                            下载模板
                        </a>
                    </div>
                    <Upload {...uploadProps}>
                        <Button type="primary" className={styles.uploadBtn}>
                            {/* <UploadOutlined className={styles.uploadIcon} /> */}
                            上传文件
                        </Button>
                    </Upload>

                    {fileList.length > 0 && (
                        <div className={styles.uploadedFile}>
                            {fileList.map((file) => (
                                <React.Fragment key={file.uid}>
                                    <div className={styles.fileInfo}>
                                        <XlsColored
                                            className={styles.xlsIcon}
                                        />
                                        <div
                                            className={styles.fileName}
                                            title={file.name}
                                        >
                                            {file.name}
                                        </div>
                                    </div>
                                    <DeleteColored
                                        className={styles.deleteIcon}
                                        onClick={handleDeleteFile}
                                    />
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    )
}

export default Import
