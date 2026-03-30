import React, { useEffect, useState } from 'react'
import {
    Dropdown,
    MenuProps,
    message,
    Progress,
    Upload,
    UploadProps,
} from 'antd'
import { RcFile } from 'antd/es/upload/interface'
import { FolderOpenOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import Cookies from 'js-cookie'
import { EllipsisOutlined } from '@/icons'
import __ from './locale'
import styles from './styles.module.less'
import { downloadObjFile, formatError, updateObjAttribute } from '@/core'
import { OperateType, streamToFile } from '@/utils'

interface IUploadObjFile {
    nodeId: string
    nodeName: string
    nodeFileName?: string
}
const UploadObjFile: React.FC<IUploadObjFile> = ({
    nodeId,
    nodeName,
    nodeFileName,
}) => {
    const [fileName, setFileName] = useState<string>('')
    const [showIcon, setShowIcon] = useState(false)
    const [errorText, setErrorText] = useState('')
    const [status, setStatus] = useState<string>()
    const [percent, setPercent] = useState<number>()

    useEffect(() => {
        setFileName(nodeFileName || '')
        setErrorText('')
    }, [nodeId, nodeFileName])

    // 详情-删除文件依据
    const updateObj = async () => {
        try {
            await updateObjAttribute({
                id: nodeId,
                attribute: {
                    file_specification_id: '',
                    file_specification_name: '',
                    document_basis_name: '',
                    document_basis_id: '',
                },
                name: nodeName,
            })
            setFileName('')
            setShowIcon(false)
            setErrorText('')
            message.success(__('删除成功'))
        } catch (error) {
            formatError(error)
        }
    }

    const download = async () => {
        try {
            message.info(__('下载准备中...'))
            const res = await downloadObjFile(nodeId, nodeId)
            // 将文件流转换成文件
            streamToFile(res, fileName)
            message.success(__('下载成功'))
        } catch (error) {
            formatError(error)
        }
    }

    const props: UploadProps = {
        name: 'file',
        action: `/api/configuration-center/v1/objects/${nodeId}/upload`,
        maxCount: 1,
        showUploadList: false,
        headers: {
            Authorization: `Bearer ${Cookies.get('af.oauth2_token') || ''}`,
        },
        beforeUpload: (file: RcFile) => {
            const isLt50M = file.size / 1024 / 1024 < 50
            if (!isLt50M) {
                setErrorText(__('文件大小不可超过50MB'))
                return false
            }
            setErrorText('')
            return true
        },
        onChange({ file }) {
            setFileName(file.name)
            setPercent(Math.ceil(file.percent || 0))
            setStatus(file.status)
            if (file.status === 'error') {
                setErrorText(file.response.description)
            }
            if (file.status === 'done') {
                message.success(__('上传成功'))
            }
        },
    }

    const getItems = (): MenuProps['items'] => {
        const items = [
            {
                key: OperateType.EXPORT,
                label: __('下载'),
            },
            {
                key: OperateType.IMPORT,
                label: <Upload {...props}>{__('重新上传')}</Upload>,
            },
            {
                key: OperateType.DELETE,
                label: __('删除'),
            },
        ]

        if (errorText) {
            return items.filter((i) => i.key !== OperateType.EXPORT)
        }
        return items
    }

    const onClick = ({ key }) => {
        if (key === OperateType.EXPORT) {
            download()
        }
        if (key === OperateType.DELETE) {
            updateObj()
        }
    }

    return (
        <div
            className={classnames({
                [styles.uploadWrapper]: true,
                [styles.uploadWrapperNoFile]: !fileName,
            })}
        >
            <div
                className={styles.uploadInfo}
                // onMouseEnter={() => (fileName ? setShowIcon(true) : () => {})}
                // onMouseLeave={() => (fileName ? setShowIcon(false) : () => {})}
            >
                {fileName && !errorText ? (
                    <div className={styles.fileName} title={fileName}>
                        <FolderOpenOutlined className={styles.fileIcon} />
                        {fileName}
                    </div>
                ) : (
                    '--'
                )}
                <div hidden={!!fileName && !errorText}>
                    <Upload {...props}>
                        <span className={styles.uploadText}>
                            {__('上传文件')}
                        </span>
                    </Upload>
                </div>
                <div
                    className={styles.fileOperate}
                    hidden={!fileName || !!errorText}
                >
                    <Dropdown menu={{ items: getItems(), onClick }}>
                        <div className={styles.iconWrapper}>
                            <EllipsisOutlined className={styles.operateIcon} />
                        </div>
                    </Dropdown>
                </div>
            </div>
            {errorText && <div className={styles.error}>{errorText}</div>}
            {status === 'uploading' && (
                <Progress percent={percent} size="small" status="active" />
            )}
        </div>
    )
}
export default UploadObjFile
