import React, { useState } from 'react'
import { Modal, Button, Upload, message } from 'antd'
import { ExclamationCircleFilled } from '@ant-design/icons'
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface'
import { UploadOutlined, XlsColored, DeleteColored } from '@/icons'
import { importFirm } from '@/core'
import styles from '../styles.module.less'
import { getActualUrl } from '@/utils'
import __ from '../locale'

interface IImport {
    open: boolean
    onImportSuccess: () => void
    onImportClose: () => void
}
const Import: React.FC<IImport> = ({
    open,
    onImportSuccess,
    onImportClose,
}) => {
    const [errorText, setErrorText] = useState('')
    const [uploading, setUploading] = useState(false)
    const [fileList, setFileList] = useState<UploadFile[]>([])

    // 上传文件 配置
    const uploadProps: UploadProps = {
        accept: '.xls,.xlsx',
        beforeUpload: (file: RcFile) => {
            const isLt1M = file.size / 1024 / 1024 < 10
            if (!isLt1M) {
                setErrorText(__('文件不可超过10MB'))
                return false
            }
            const nameArr = file.name?.split('.')
            const fileSuffix = nameArr[1]
            if (!fileSuffix || !['xls', 'xlsx'].includes(fileSuffix)) {
                setErrorText(__('文件格式错误，仅支持.xls,.xlsx'))
                setFileList([file])
                return false
            }
            setErrorText('')
            setFileList([file])
            return false
        },
        showUploadList: false,
    }

    // 上传文件
    const handleUpload = async () => {
        if (errorText) return
        if (fileList.length < 1) {
            setErrorText(__('请选择上传的文件'))
            return
        }
        const formData = new FormData()
        fileList.forEach((file) => {
            formData.append('file', file as RcFile)
        })

        setUploading(true)
        try {
            await importFirm(formData)
            setFileList([])
            setErrorText('')
            message.success(__('上传成功'))
            onImportSuccess()
        } catch (err) {
            if (err?.data) {
                setErrorText(err?.data?.description)
            } else {
                setErrorText(__('文件不存在请重新上传'))
            }
        } finally {
            setUploading(false)
        }
    }

    // 删除文件
    const handleDeleteFile = () => {
        setErrorText('')
        setFileList([])
    }

    // 取消导入
    const handleCancel = () => {
        setErrorText('')
        setFileList([])
        onImportClose()
    }

    return (
        <Modal
            open={open}
            title={__('导入公司信息')}
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
                <div className={styles.importErrorWrapper}>
                    <ExclamationCircleFilled className={styles.errorIcon} />
                    <div className={styles.errorText}> {errorText}</div>
                </div>
            )}
            <div className={styles.uploadBody}>
                <div className={styles.uploadTitle}>{__('上传文件')}</div>
                <div className={styles.fileDesc}>
                    <div className={styles.fileOrder}>·</div>
                    {__('上传的文件格式支持.xlsx和.xls，文件不得超过10MB')}
                </div>
                <div className={styles.fileDesc}>
                    <div className={styles.fileOrder}>·</div>
                    {__('仅支持每次上传一个文件')}
                </div>
                <div className={styles.fileDesc}>
                    <div className={styles.fileOrder}>·</div>
                    <a
                        href={getActualUrl(
                            '/downloadFiles/厂商名录导入模板.xlsx',
                            false,
                        )}
                        target="_blank"
                        download="厂商名录导入模板.xlsx"
                        rel="noreferrer"
                    >
                        {__('下载模板')}
                    </a>
                </div>
                <Upload {...uploadProps}>
                    <Button type="primary" className={styles.uploadBtn}>
                        <UploadOutlined className={styles.uploadIcon} />
                        {__('上传文件')}
                    </Button>
                </Upload>

                {fileList.length > 0 && (
                    <div className={styles.uploadedFile}>
                        {fileList.map((file) => (
                            <React.Fragment key={file.uid}>
                                <div className={styles.fileInfo}>
                                    <XlsColored className={styles.xlsIcon} />
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
    )
}

export default Import
