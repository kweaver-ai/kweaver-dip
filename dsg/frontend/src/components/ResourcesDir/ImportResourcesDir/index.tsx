import React, { useEffect, useRef, useState } from 'react'
import { Tabs, Button, Upload, message, Space, Tooltip, Table } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface'
import { CheckCircleFilled, ExclamationCircleFilled } from '@ant-design/icons'
import { isString, isArray } from 'lodash'
import { UploadOutlined, XlsColored, DeleteColored, FontIcon } from '@/icons'
import { rescDirImport } from '@/core'
import styles from './styles.module.less'
import { getActualUrl, useQuery } from '@/utils'
import __ from '../locale'
import { LabelTitle } from '../BaseInfo'
import Header from '@/components/BusinessDiagnosis/components/Header'

const ImportResourcesDir = () => {
    const navigator = useNavigate()
    const query = useQuery()

    const tabKey = query.get('tabKey') || undefined

    const [errorText, setErrorText] = useState('')
    const [uploading, setUploading] = useState(false)
    const [fileList, setFileList] = useState<UploadFile[]>([])
    const [errorList, setErrorList] = useState<any[]>([])

    const tabItemsData = [
        {
            label: __('导入数据资源目录'),
            title: __('导入数据资源目录'),
            key: 'import',
            children: '',
        },
    ]

    const columns = [
        {
            title: __('列名称'),
            dataIndex: 'key',
            key: 'key',
            ellipsis: true,
        },
        {
            title: __('错误原因'),
            dataIndex: 'message',
            key: 'message',
            ellipsis: true,
        },
    ]

    // 上传文件 配置
    const uploadProps: UploadProps = {
        accept: '.xlsx',
        beforeUpload: (file: RcFile) => {
            const isLt1M = file.size / 1024 / 1024 < 10
            if (!isLt1M) {
                message.info(__('文件不可超过10MB'))
                setErrorText(__('文件不可超过10MB'))
                return false
            }
            const nameArr = file.name?.split('.')
            const fileSuffix = nameArr[nameArr.length - 1]
            if (!fileSuffix || !['xlsx'].includes(fileSuffix)) {
                message.info(__('文件格式错误，仅支持.xlsx'))
                setErrorText(__('文件格式错误，仅支持.xlsx'))
                setFileList([file])
                return false
            }
            setErrorText('')
            setFileList([file])
            return false
        },
        showUploadList: false,
    }

    const onImportClose = () => {
        navigator(`/dataService/dataContent?tabKey=${tabKey || 'edited'}`)
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
            const res = await rescDirImport(formData)
            if (res?.fail_create_catalog_count > 0) {
                setErrorList(
                    res?.fail_create_catalog?.map((i) => ({
                        ...i,
                        key: i.name,
                        message: i?.error?.description,
                    })) || [],
                )
            } else {
                setFileList([])
                setErrorText('')
                message.success(__('上传成功'))
                handleCancel()
            }
        } catch (err) {
            if (isString(err?.data?.detail)) {
                setErrorText(err?.data?.detail)
            } else if (isArray(err?.data?.detail)) {
                setErrorText(err?.data?.description)
                setErrorList(err?.data?.detail || [])
            } else {
                setErrorText(__('文件内容与模板不符'))
            }
        } finally {
            setUploading(false)
        }
    }

    // 删除文件
    const handleDeleteFile = () => {
        setErrorText('')
        setFileList([])
        setErrorList([])
    }

    // 取消导入
    const handleCancel = () => {
        setErrorText('')
        setFileList([])
        onImportClose()
    }

    return (
        <div className={styles.importWrapper}>
            <Header back={handleCancel} leftContent={__('数据资源目录导入')} />
            <div className={styles.importBox}>
                <div className={styles.importCont}>
                    <div className={styles.importContent}>
                        <Tabs
                            activeKey="import"
                            items={tabItemsData}
                            className={styles.catlgTabs}
                        />
                        <LabelTitle label="上传文件" />

                        {uploading && (
                            <div className={styles.uploadingWrapper}>
                                <ExclamationCircleFilled
                                    className={styles.uploadingIcon}
                                />
                                <div className={styles.tipText}>
                                    {__('文件正在上传，请耐心等待…')}
                                </div>
                            </div>
                        )}
                        {/* {errorText && (
                            <div className={styles.importErrorWrapper}>
                                <ExclamationCircleFilled
                                    className={styles.errorIcon}
                                />
                                <div className={styles.errorText}>
                                    {errorText}
                                </div>
                            </div>
                        )} */}
                        <div className={styles.uploadBody}>
                            <div className={styles.uploadTitle}>
                                {__('添加附件')}
                            </div>
                            <div className={styles.fileDesc}>
                                <div className={styles.fileOrder}>·</div>
                                {__(
                                    '上传的文件格式仅支持.xlsx，文件不得超过10MB',
                                )}
                            </div>
                            <div className={styles.fileDesc}>
                                <div className={styles.fileOrder}>·</div>
                                {__('仅支持每次上传一个文件')}
                            </div>
                            <div className={styles.fileDesc}>
                                <div className={styles.fileOrder}>·</div>
                                <a
                                    href={getActualUrl(
                                        '/downloadFiles/数据资源目录导入模板.xlsx',
                                        false,
                                    )}
                                    target="_blank"
                                    download="数据资源目录导入模板.xlsx"
                                    rel="noreferrer"
                                >
                                    {__('下载模板')}
                                </a>
                            </div>
                            <Upload {...uploadProps}>
                                <Button
                                    type="primary"
                                    className={styles.uploadBtn}
                                >
                                    <UploadOutlined
                                        className={styles.uploadIcon}
                                    />
                                    {__('上传文件')}
                                </Button>
                            </Upload>

                            {fileList.length > 0 && (
                                <div className={styles.uploadedFileBox}>
                                    {fileList.map((file) => (
                                        <div
                                            key={file.uid}
                                            className={styles.uploadedFile}
                                        >
                                            <div className={styles.fileInfo}>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        width: '80%',
                                                    }}
                                                >
                                                    <XlsColored
                                                        className={
                                                            styles.xlsIcon
                                                        }
                                                    />
                                                    <div
                                                        className={
                                                            styles.fileName
                                                        }
                                                        title={file.name}
                                                    >
                                                        {file.name}
                                                    </div>
                                                </div>
                                                <div
                                                    className={styles.updateTip}
                                                >
                                                    <span
                                                        title={errorText}
                                                        className={
                                                            styles.tipText
                                                        }
                                                    >
                                                        {errorText ||
                                                            __('上传成功')}
                                                    </span>
                                                    {errorText ? (
                                                        <ExclamationCircleFilled
                                                            style={{
                                                                color: '#e60012',
                                                            }}
                                                        />
                                                    ) : (
                                                        <CheckCircleFilled
                                                            style={{
                                                                color: '#52c41b',
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            <FontIcon
                                                className={styles.deleteIcon}
                                                name="icon-lajitong"
                                                onClick={handleDeleteFile}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                            {errorList?.length ? (
                                <Table
                                    dataSource={errorList}
                                    columns={columns}
                                    rowKey={(record, index) => index || 0}
                                    pagination={false}
                                />
                            ) : null}
                        </div>
                    </div>
                </div>
                <div className={styles.footer}>
                    <Space size={16} className={styles.optionsBtn}>
                        <Button onClick={() => handleCancel()}>
                            {__('取消')}
                        </Button>
                        <Tooltip
                            title={!fileList.length ? __('请上传文件') : ''}
                        >
                            <Button
                                type="primary"
                                style={{ marginRight: 24 }}
                                onClick={() => handleUpload()}
                                disabled={!fileList.length}
                            >
                                {__('提交')}
                            </Button>
                        </Tooltip>
                    </Space>
                </div>
            </div>
        </div>
    )
}

export default ImportResourcesDir
