import React, { useEffect, useState } from 'react'
import { Col, Row } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { downloadDemandFile, formatError, getDemandFiles } from '@/core'
import FileIcon from '../FileIcon'
import styles from './styles.module.less'
import { streamToFile } from '@/utils'
import { ArrayBufferToJson } from './const'

interface IMaterialsInfoDetails {
    demandId: string
    auditId?: string
}
const MaterialsInfoDetails: React.FC<IMaterialsInfoDetails> = ({
    demandId,
    auditId,
}) => {
    const [files, setFiles] = useState<any[]>([])

    const getFilesList = async () => {
        try {
            const res = await getDemandFiles(demandId, auditId)

            setFiles(res.entries.map((item) => item.reference_files?.[0]) || [])
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (demandId) {
            getFilesList()
        }
    }, [demandId])

    const download = async (f: {
        file_uuid: string
        file_name: string
        type: number
        id: string
    }) => {
        try {
            if (!f.id) return
            const res = await downloadDemandFile(f.id)
            // 将文件流转换成文件
            streamToFile(res, f.file_name)
        } catch (error) {
            formatError({ ...error, data: ArrayBufferToJson(error?.data) })
        }
    }

    return (
        <div className={styles.materialsInfoDetails}>
            <Row gutter={72}>
                {files.map((file) => {
                    const suffix = file.file_name.substring(
                        file.file_name.lastIndexOf('.') + 1,
                    )
                    return (
                        <Col span={6} key={file.id}>
                            <div className={styles.item}>
                                <div className={styles.topInfo}>
                                    <div
                                        className={styles.downloadContainer}
                                        onClick={() => download(file)}
                                    >
                                        <DownloadOutlined
                                            className={styles.downloadIcon}
                                        />
                                    </div>
                                </div>
                                <div className={styles.bottomInfo}>
                                    <FileIcon
                                        suffix={suffix}
                                        style={{ fontSize: 60 }}
                                    />
                                    <div
                                        className={styles.fileName}
                                        title={file.file_name}
                                    >
                                        {file.file_name}
                                    </div>
                                </div>
                            </div>
                        </Col>
                    )
                })}
            </Row>
        </div>
    )
}

export default MaterialsInfoDetails
