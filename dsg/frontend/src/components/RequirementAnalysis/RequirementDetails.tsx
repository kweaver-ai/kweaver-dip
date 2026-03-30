import { FileAddFilled, ShrinkOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import moment from 'moment'
import classnames from 'classnames'
import { Tooltip } from 'antd'
import { downloadDemandFile, formatError, getDemandDetails } from '@/core'
import { requirementDetailsInfo, RequirementFieldType } from './const'
import styles from './styles.module.less'
import { streamToFile, useQuery } from '@/utils'
import FileIcon from '../FileIcon'

const RequirementDetails = () => {
    const query = useQuery()
    // 获取的需求id
    const id = query.get('id')
    const project = localStorage.getItem('project')
    const [details, setDetails] = useState<any>()
    const [isShrink, setIsShrink] = useState(false)

    const getDetails = async () => {
        try {
            if (id) {
                const res = await getDemandDetails(id)
                setDetails(res)
            }
        } catch (err) {
            formatError(err)
        }
    }

    useEffect(() => {
        getDetails()
    }, [])

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

    const handleShrink = () => {
        setIsShrink(!isShrink)
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
            if (Array.isArray(val) && val.length > 0) {
                return val.join('，')
            }
            if (Array.isArray(val) && val.length === 0) {
                return '--'
            }
            return details?.[field.value]
        }
        return '--'
    }

    return isShrink ? (
        <Tooltip title="需求申请详情" placement="bottom">
            <div onClick={handleShrink} className={styles.shrinkDetails}>
                <FileAddFilled className={styles.detailsIcon} />
                <span className={styles.detailTitle}>详情</span>
            </div>
        </Tooltip>
    ) : (
        <div className={styles.requirementDetailsWrapper}>
            <div className={styles.titleContainer}>
                <div className={styles.title}>需求申请详情</div>
                <ShrinkOutlined onClick={handleShrink} />
            </div>
            <div>
                {requirementDetailsInfo.map((item, index) => (
                    <div className={styles.infoContent} key={item.key}>
                        <div className={styles.infoTitleContainer}>
                            <div className={styles.titleLine} />
                            <div className={styles.infoTitle}>{item.title}</div>
                        </div>
                        {index === 0 && (
                            <div className={styles.demandNo}>
                                NO {details?.demand_code}
                            </div>
                        )}
                        {item.fields.map((field) => {
                            if (
                                project === 'tc' &&
                                [
                                    'developer_name',
                                    'developer_code',
                                    'reference_files',
                                    'app_direction',
                                    'rela_scenes',
                                    'rela_business_system',
                                    'rela_matters',
                                    'rela_domains',
                                    'app_value',
                                    'app_effect',
                                ].includes(field.value)
                            )
                                return null
                            return (
                                <div
                                    className={classnames({
                                        [styles.infoItem]: true,
                                        [styles.tagInfoItem]:
                                            field.type ===
                                            RequirementFieldType.TAG,
                                    })}
                                    key={field.value}
                                >
                                    <div className={styles.label}>
                                        {field.label}
                                    </div>
                                    <div
                                        className={classnames({
                                            [styles.value]:
                                                field.type !==
                                                RequirementFieldType.TAG,
                                            [styles.tagValue]:
                                                field.type ===
                                                RequirementFieldType.TAG,
                                            [styles.fileValue]:
                                                field.type ===
                                                RequirementFieldType.FILE,
                                        })}
                                        title={getValue(field)}
                                    >
                                        {getValue(field)}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default RequirementDetails
