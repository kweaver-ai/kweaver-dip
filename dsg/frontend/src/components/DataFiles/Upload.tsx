import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { UploadOutlined } from '@ant-design/icons'
import moment from 'moment'
import { Button, message, Upload, UploadProps } from 'antd'
import { RcFile } from 'antd/lib/upload'
import styles from './styles.module.less'
import { DeleteColored } from '@/icons'
import {
    downloadDemandFileV2,
    formatError,
    getFullRequestPath,
    getToken,
} from '@/core'
import { streamToFile } from '@/utils'
import __ from './locale'
import FileIcon from '../FileIcon'
import { MicroWidgetPropsContext } from '@/context'
import { FileTableContainer, getSuffix, transUnit } from './helper'
import { OptionMenuType } from '@/ui'
import FilesTable from './FileTable'

interface IUploadMultipleAttachment {
    dataId: string
    downloadApi?: (id: string) => Promise<any>
    delApi?: (id: string) => Promise<any>
}
const UploadMultipleAttachment: React.FC<IUploadMultipleAttachment> = ({
    dataId,
    downloadApi = downloadDemandFileV2,
    delApi,
}) => {
    const [fileInfo, setFileInfo] = useState<any>()

    const [errorText, setErrorText] = useState('')

    const { microWidgetProps } = useContext(MicroWidgetPropsContext)

    const [fileList, setFileList] = useState<RcFile[]>([])

    const tableRef = useRef<any>()

    const uploadProps: UploadProps = {
        name: 'file',
        action: getFullRequestPath({
            microWidgetProps,
            path: `/api/data-catalog/v1/file-resource/${dataId}/attachment`,
        }),
        multiple: true,
        showUploadList: false,
        accept: '.doc,.docx,.xlsx,.xls,.pdf',
        // fileList: fileList,
        headers: {
            Authorization: getToken({ microWidgetProps }),
        },
        beforeUpload: (file: RcFile) => {
            const fileSuffix = file.name.substring(
                file.name.lastIndexOf('.') + 1,
            )
            if (!['doc', 'docx', 'xlsx', 'xls', 'pdf'].includes(fileSuffix)) {
                message.error(`${file.name}不支持的文件类型`)
                return false
            }
            const isLt10M = file.size / 1024 / 1024 > 10
            if (isLt10M) {
                message.error(`${file.name}文件不可超过10M`)
                return false
            }
            return true
        },
        onChange: ({ file }: any) => {
            if (file.status === 'error') {
                message.error(file.response.description)
            }
            if (file.status === 'done') {
                const { id } = file.response

                tableRef?.current?.onReload()
                if (file.response.file_failed?.length > 0) {
                    message.error(
                        `${file.response.file_failed.join('、')}上传失败`,
                    )
                } else {
                    message.success(`上传成功`)
                }
            }
        },
    }

    const handleDelete = async () => {
        if (delApi) {
            try {
                await delApi(fileInfo.id)
                setFileInfo(undefined)
            } catch (error) {
                formatError(error)
            }
        } else {
            setFileInfo(undefined)
        }
    }

    const handleDownload = async () => {
        try {
            if (!fileInfo.id) return
            const res = await downloadApi(fileInfo.id)
            // 将文件流转换成文件
            streamToFile(res, fileInfo.name)
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <div className={styles.UploadAttachment}>
            <div className={styles.fileDesc}>
                <div className={styles.fileOrder}>·</div>
                {__('支持类型.doc、docx、.xlsx、.xls、.pdf，文件不得超过10MB')}
            </div>
            <div className={styles.fileDesc}>
                <div className={styles.fileOrder}>·</div>
                {__('支持上传多个文件')}
            </div>

            <div className={styles.uploadWrapper}>
                <Upload {...uploadProps}>
                    <Button
                        className={styles.uploadBtn}
                        type="primary"
                        icon={<UploadOutlined />}
                    >
                        {__('上传文件')}
                    </Button>
                </Upload>
            </div>
            {/* {fileInfo && (
                <div className={styles.filterWrapper}>
                    <div className={styles.fileAndIcon}>
                        <FileIcon suffix={suffix} />
                        <div
                            className={styles.fileName}
                            onClick={handleDownload}
                            title={fileInfo.name}
                        >
                            {fileInfo.name}
                        </div>
                    </div>
                    <DeleteColored
                        className={styles.deleteIcon}
                        onClick={() => handleDelete()}
                    />
                </div>
            )} */}

            <div className={styles.fileTableContainer}>
                <div className={styles.fileTableTitle}>{__('附件清单')}</div>
                <FilesTable allowRemove id={dataId} ref={tableRef} />
            </div>
        </div>
    )
}

export default UploadMultipleAttachment
