import moment from 'moment'
import { DownloadOutlined } from '@ant-design/icons'
import { IBasicInfoFields } from './const'
import styles from './styles.module.less'
import { DemandFieldType } from '../Details/const'
import FileIcon from '@/components/FileIcon'
import { formatError } from '@/core'
import CommonTitle from '../CommonTitle'

interface IBasicInfo {
    basicInfoFields: IBasicInfoFields[]
    details: any
    title?: string
}
const BasicInfo = ({ basicInfoFields, details, title }: IBasicInfo) => {
    const download = async (fileId: string, fileName: string) => {
        try {
            if (!fileId) return
            window.open(
                `/api/sszd-service/v1/file/${details?.attachment_id}`,
                '_blank',
            )
        } catch (error) {
            formatError(error)
        }
    }

    const getValue = (field) => {
        const val: any = details?.[field.value]
        if (val) {
            if (field.type === DemandFieldType.TIME) {
                return moment(details?.[field.value]).format('YYYY-MM-DD')
            }

            if (field.type === DemandFieldType.FILE && details?.attachment_id) {
                const suffix = val.substring(val.lastIndexOf('.') + 1)
                return (
                    <div className={styles['file-container']}>
                        <FileIcon suffix={suffix} />
                        <div className={styles['file-name']} title={val}>
                            {val}
                        </div>
                        <DownloadOutlined
                            className={styles['download-icon']}
                            onClick={() => download(details.attachment_id, val)}
                        />
                    </div>
                )
            }

            return val
        }
        return '--'
    }
    return (
        <div className={styles['basic-info-wrapper']}>
            {title && (
                <div className={styles['title-container']}>
                    <CommonTitle title={title} />
                </div>
            )}
            {basicInfoFields.map((field) => (
                <div className={styles['basic-info-item']} key={field.value}>
                    <div className={styles['basic-info-item-label']}>
                        {field.label}
                    </div>
                    <div className={styles['basic-info-item-value']}>
                        {getValue(field)}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default BasicInfo
