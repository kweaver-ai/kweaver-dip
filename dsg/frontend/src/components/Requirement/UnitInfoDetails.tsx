import React from 'react'
import { Col, Row } from 'antd'
import moment from 'moment'
import { RequirementFieldType, unitInfoFields } from './const'
import styles from './styles.module.less'
import FileIcon from '../FileIcon'
import { downloadDemandFile, formatError } from '@/core'
import { streamToFile } from '@/utils'

interface IBaseInfoDetails {
    details: any
}
const UnitInfoDetails: React.FC<IBaseInfoDetails> = ({ details }) => {
    const download = async (
        files: {
            file_uuid: string
            file_name: string
            type: number
            id: string
        }[],
    ) => {
        const { id: fileId, file_name } =
            files.find((item) => item.type === 1) || {}
        try {
            if (!fileId) return
            const res = await downloadDemandFile(fileId)
            // 将文件流转换成文件
            streamToFile(res, file_name)
        } catch (error) {
            formatError(error)
        }
    }

    const getValue = (field) => {
        const val: any = details?.[field.value]

        if (val) {
            if (field.type === RequirementFieldType.TIME) {
                return moment(details?.[field.value]).format('YYYY-MM-DD')
            }
            if (field.type === RequirementFieldType.TAG && Array.isArray(val)) {
                return val.length > 0 ? (
                    <div className={styles.tagWrapper}>
                        {val.map((v) => {
                            return (
                                <div className={styles.tag} title={v} key={v}>
                                    {v.length > 17 ? `${v.slice(0, 17)}...` : v}
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    '--'
                )
            }
            if (
                field.type === RequirementFieldType.FILE &&
                Array.isArray(val)
            ) {
                // 获取文件信息
                const file = val.find((item) => item.type === field.typeValue)
                if (file && file.file_name) {
                    const suffix = file.file_name.substring(
                        file.file_name.lastIndexOf('.') + 1,
                    )
                    return (
                        <div className={styles.fileWrapper}>
                            <FileIcon suffix={suffix} />
                            <div
                                className={styles.fileName}
                                onClick={() => download(val)}
                                title={file.file_name}
                            >
                                {file.file_name}
                            </div>
                        </div>
                    )
                }
                return '--'
            }
            return details?.[field.value]
        }
        return '--'
    }

    return (
        <div className={styles.baseInfoWrapper}>
            <Row>
                {unitInfoFields.map((field) => {
                    return (
                        <Col span={field.col || 12} key={field.value}>
                            <div className={styles.fieldItem}>
                                <div className={styles.fieldLabel}>
                                    {field.label}
                                </div>
                                <div
                                    className={styles.fieldValue}
                                    title={getValue(field)}
                                >
                                    {getValue(field)}
                                </div>
                            </div>
                        </Col>
                    )
                })}
            </Row>
        </div>
    )
}
export default UnitInfoDetails
