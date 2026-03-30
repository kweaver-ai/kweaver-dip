import React, { useEffect, useMemo, useState } from 'react'
import { Modal, Button, Upload, message, Table } from 'antd'
import { ExclamationCircleFilled } from '@ant-design/icons'
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface'
import classnames from 'classnames'
import { UploadOutlined, XlsColored, DeleteColored } from '@/icons'
import styles from './styles.module.less'
import {
    downloadSubjectDomainsTemplate,
    formatError,
    importSubjectDomains,
} from '@/core'
import { cancelRequest, clearSource } from '@/utils/request'
import { getFileExtension, streamToFile } from '@/utils'
import __ from './locale'

interface IErrorItem {
    // 表格名称
    sheet_name: string
    // 序号
    serial_number: number
    // 错误内容
    content: string
    // 错误原因
    reason: string
}

interface IImportForm {
    open: boolean
    onClose: (value: boolean) => void
}

/**
 * 导入主题域
 */
const ImportSubjectDomains: React.FC<IImportForm> = ({ open, onClose }) => {
    // 错误提示
    const [errorText, setErrorText] = useState('')
    // 上传中
    const [loading, setLoading] = useState(false)
    // 上传的文件
    const [fileList, setFileList] = useState<UploadFile[]>([])
    // 返回的错误信息
    const [errorItems, setErrorItems] = useState<IErrorItem[]>([])

    useEffect(() => {
        if (!open) {
            setFileList([])
            setErrorItems([])
            setErrorText('')
        }
    }, [open])

    // 文件变更，清除错误信息
    useMemo(() => {
        cancelRequest('/api/data-subject/v1/subject-domains/import', 'post')
        setErrorItems([])
        setErrorText('')
    }, [fileList?.[0]?.uid])

    // 下载模版链接
    const downloadTempFile = async () => {
        try {
            const res = await downloadSubjectDomainsTemplate()
            if (typeof res === 'object' && res.byteLength) {
                streamToFile(res, __('业务对象导入模板.xlsx'))
                message.success(__('模板下载成功'))
            } else {
                message.error(__('模板下载失败'))
            }
        } catch (error) {
            const enc = new TextDecoder('utf-8')
            const errData = JSON.parse(enc.decode(new Uint8Array(error.data)))
            error.data = errData
            formatError(error)
        }
    }

    // 清除选中文件
    const handleDeleteFile = () => {
        setFileList([])
    }

    // 文件上传限制
    const uploadProps: UploadProps = {
        accept: '.xlsx',
        maxCount: 1,
        beforeUpload: (file: RcFile) => {
            const limit = file.size / 1024 / 1024
            if (limit > 10) {
                setErrorText(__('文件不可超过10MB'))
                return false
            }
            const type = getFileExtension(file.name)
            if (type && ['xlsx'].includes(type)) {
                setFileList([file])
            } else {
                setErrorText(__('支持后缀名为xlsx的excel导入'))
            }
            return false
        },
        showUploadList: false,
    }

    // 上传
    const handleUpload = async () => {
        try {
            setErrorItems([])
            setErrorText('')

            if (fileList.length < 1) {
                setErrorText(__('请选择上传的文件'))
                return
            }
            const formData = new FormData()
            fileList.forEach((file) => {
                formData.append('file', file as RcFile)
            })
            clearSource()
            setLoading(true)
            await importSubjectDomains(formData)
            message.success(__('导入成功'))
            setFileList([])
            onClose(true)
        } catch (err) {
            if (err?.data?.code === 'ERR_CANCELED') {
                return
            }
            if (err.status === 504) {
                setErrorText(__('请求超时，请刷新后重试'))
            } else if (err?.data?.description) {
                setErrorText(err?.data?.description)
                // 错误内容
                if (err?.data?.detail?.length > 0) {
                    setErrorItems(err.data.detail)
                }
            } else {
                formatError(err)
            }
        } finally {
            setLoading(false)
        }
    }

    const columns = [
        {
            title: __('表格'),
            dataIndex: 'sheet_name',
            key: 'sheet_name',
            ellipsis: true,
            width: '22%',
            render: (value, record) => value,
        },
        {
            title: __('序号'),
            dataIndex: 'serial_number',
            key: 'serial_number',
            ellipsis: true,
            width: '13%',
            render: (value, record) => value,
        },
        {
            title: __('内容'),
            dataIndex: 'content',
            key: 'content',
            ellipsis: true,
            width: '26%',
            render: (value, record) => value,
        },
        {
            title: __('原因'),
            dataIndex: 'reason',
            key: 'reason',
            ellipsis: true,
            render: (value, record) => value,
        },
    ]

    return (
        <Modal
            open={open}
            title={__('导入')}
            width={640}
            getContainer={false}
            maskClosable={false}
            destroyOnClose
            bodyStyle={{
                padding: 0,
                minHeight: 284,
                maxHeight: 484,
                display: 'flex',
                flexDirection: 'column',
            }}
            className={styles.importSubjectDomains}
            onCancel={() => onClose(false)}
            onOk={() => handleUpload()}
            okText={__('确定')}
            cancelText={__('取消')}
            okButtonProps={{
                loading,
                style: {
                    minWidth: 80,
                },
            }}
            cancelButtonProps={{
                style: {
                    minWidth: 80,
                },
            }}
        >
            {/* 提示信息 */}
            <div
                className={styles.tipWrapper}
                hidden={errorText === '' && !loading}
            >
                <div className={styles.error} hidden={errorText === ''}>
                    <ExclamationCircleFilled className={styles.errorIcon} />
                    <div className={styles.tipText} title={errorText}>
                        {errorText}
                    </div>
                </div>
                <div className={styles.uploading} hidden={!loading}>
                    <ExclamationCircleFilled className={styles.uploadingIcon} />
                    <div className={styles.tipText}>
                        {__('文件正在上传，请耐心等待…')}
                    </div>
                </div>
            </div>

            <div className={styles.uploadBody}>
                <div
                    className={classnames(
                        styles.uploadTitle,
                        (errorText !== '' || loading) && styles.hasTip,
                    )}
                >
                    {__('上传文件，如果导入过程中发现同名业务对象将直接覆盖')}
                </div>
                <div className={styles.fileDesc}>
                    <div className={styles.fileOrder} />
                    {__('上传的文件格式支持.xlsx，文件不得超过10MB')}
                </div>
                <div className={styles.fileDesc}>
                    <div className={styles.fileOrder} />
                    {__('仅支持每次上传一个文件')}
                </div>
                <div className={styles.fileDesc}>
                    <div className={styles.fileOrder} />
                    <span
                        onClick={() => downloadTempFile()}
                        className={styles.primary}
                    >
                        {__('下载模板')}
                    </span>
                </div>
                <Upload {...uploadProps}>
                    <Button
                        type="primary"
                        className={styles.uploadBtn}
                        icon={<UploadOutlined />}
                    >
                        {__('上传文件')}
                    </Button>
                </Upload>

                {/* 上传的文件列表 */}
                {fileList.length > 0 && (
                    <div className={styles.uploadedFile}>
                        {fileList.map((file) => (
                            <React.Fragment key={file.uid}>
                                <div className={styles.fileInfo}>
                                    <XlsColored className={styles.xlsIcon} />
                                    <div
                                        className={`${styles.fileName} ${styles.textSecondaryColor}`}
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

            {/* 错误信息表格 */}
            {errorItems.length > 0 && (
                <Table
                    columns={columns}
                    dataSource={errorItems}
                    pagination={false}
                    className={styles.errorTable}
                    scroll={{
                        y: errorItems.length > 4 ? 192 : undefined,
                    }}
                />
            )}
        </Modal>
    )
}

export default ImportSubjectDomains
