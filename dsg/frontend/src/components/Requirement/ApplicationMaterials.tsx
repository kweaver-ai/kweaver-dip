import React, { useEffect, useState } from 'react'
import { QuestionCircleOutlined } from '@ant-design/icons'
import { Button, message, Table, Tooltip, Upload, UploadProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import Cookies from 'js-cookie'
import { RcFile } from 'antd/lib/upload'
import { cloneDeep } from 'lodash'
import styles from './styles.module.less'
import __ from './locale'
import { CloseOutlined } from '@/icons'
import FileIcon from '../FileIcon'
import {
    downloadDemandFile,
    formatError,
    getDemandFiles,
    IDemandFile,
} from '@/core'
import { streamToFile } from '@/utils'

interface DataType {
    key: string
    data_owner_name: string
    file: any
    res: string
}

const initFileInfo: IDemandFile = {
    file_name: '',
    id: '',
    type: 2,
    file_uuid: '',
}
interface IApplicationMaterials {
    demandId: string
    getMaterials?: (data: any[]) => void
    showError?: boolean
}
const ApplicationMaterials: React.FC<IApplicationMaterials> = ({
    demandId,
    getMaterials,
    showError = false,
}) => {
    const [isShowError, setIsShowError] = useState(false)

    const [data, setData] = useState<any[]>([])

    useEffect(() => {
        setIsShowError(showError)
    }, [showError])

    const download = async (file: {
        file_uuid: string
        file_name: string
        type: number
        id: string
    }) => {
        try {
            if (!file.id) return
            const res = await downloadDemandFile(file.id)
            // 将文件流转换成文件
            streamToFile(res, file.file_name)
        } catch (error) {
            formatError(error)
        }
    }

    const getFilesList = async () => {
        try {
            const res = await getDemandFiles(demandId)
            const formatData =
                res.entries?.map((item) => ({
                    data_owner_code: item.data_owner_code,
                    data_owner_name: item.data_owner_name,
                    res: item.res,
                    file: {
                        ...initFileInfo,
                    },
                })) || []

            setData(formatData)
            getMaterials?.(formatData)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (demandId) {
            getFilesList()
        }
    }, [demandId])

    const uploadProps: UploadProps = {
        name: 'file',
        action: '/api/demand-management/v1/files',
        maxCount: 1,
        showUploadList: false,
        headers: {
            Authorization: `Bearer ${Cookies.get('af.oauth2_token') || ''}`,
        },
    }

    const columns: ColumnsType<DataType> = [
        {
            title: __('数据Owner名称'),
            dataIndex: 'data_owner_name',
            key: 'data_owner_name',
            ellipsis: true,
        },
        {
            title: __('申请材料'),
            dataIndex: 'file',
            key: 'file',
            render: (fileInfo, record, index) => {
                const suffix = fileInfo.file_name.substring(
                    fileInfo.file_name.lastIndexOf('.') + 1,
                )
                return !fileInfo.id ? (
                    <div className={styles.uploadWrapper}>
                        <Upload
                            {...uploadProps}
                            beforeUpload={(file: RcFile) => {
                                const isLt10M = file.size / 1024 / 1024 < 10
                                if (!isLt10M) {
                                    message.error(
                                        __('申请材料的文件大小不能超过10M'),
                                    )
                                    return false
                                }
                                return true
                            }}
                            onChange={({ file }) => {
                                if (file.status === 'error') {
                                    message.error(file.response.description)
                                }
                                if (file.status === 'done') {
                                    // setFileInfo(file.response)
                                    const { file_name, id, file_uuid } =
                                        file.response
                                    const tempData = cloneDeep(data)
                                    tempData[index].file = {
                                        file_name,
                                        id,
                                        file_uuid,
                                        type: 2,
                                    }
                                    setData(tempData)
                                    getMaterials?.(tempData)
                                    message.success(__('上传成功'))
                                }
                            }}
                        >
                            <Button type="link">{__('上传文件')}</Button>
                        </Upload>
                        {isShowError && (
                            <div className={styles.requiredInfo}>
                                {__('请上传文件')}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={styles.uploadWrapper}>
                        <div className={styles.fileInfo}>
                            <FileIcon suffix={suffix} />
                            <span
                                className={styles.fileName}
                                onClick={() => download(data[index]?.file)}
                                title={fileInfo.file_name}
                            >
                                {fileInfo.file_name}
                            </span>
                        </div>
                        <div className={styles.closeIconContainer}>
                            <CloseOutlined
                                className={styles.closeIcon}
                                onClick={() => {
                                    const tempData = cloneDeep(data)
                                    tempData[index].file = {
                                        ...initFileInfo,
                                    }
                                    setData(tempData)
                                    getMaterials?.(tempData)
                                }}
                            />
                        </div>
                    </div>
                )
            },
        },
        {
            title: __('关联的资源'),
            dataIndex: 'res',
            key: 'res',
            ellipsis: true,
            render: (res) => {
                const showText: string[] = []
                res?.forEach((r) => {
                    showText.push(r.res_name)
                })
                return showText.join('、')
            },
        },
    ]

    return (
        <div className={styles.applicationMaterialsWrapper}>
            <div className={styles.title}>
                <span className={styles.requiredFlag}>*</span>
                <span className={styles.TitleText}>
                    {__('请上传以下数源单位的申请材料')}
                </span>
                <Tooltip title={__('文件大小不超过10M')}>
                    <QuestionCircleOutlined className={styles.tipIcon} />
                </Tooltip>
            </div>
            <Table
                columns={columns}
                dataSource={data}
                pagination={false}
                bordered
                rowKey="data_owner_code"
            />
        </div>
    )
}

export default ApplicationMaterials
