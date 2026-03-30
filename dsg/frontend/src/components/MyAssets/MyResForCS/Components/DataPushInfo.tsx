import { useState, useEffect } from 'react'
import { formatError, getDataPushDetail, IDataPushDetail } from '@/core'
import DetailsContent from '@/components/DataPush/Details/DetailsContent'
import styles from './styles.module.less'
import SingleMonitorTable from '@/components/DataPush/Details/SingleMonitorTable'

interface IDataPushInfo {
    dataPushId: string
    isLog?: boolean
}
const DataPushInfo = ({ dataPushId, isLog = false }: IDataPushInfo) => {
    // 详情数据
    const [detailsData, setDetailsData] = useState<IDataPushDetail>()

    useEffect(() => {
        if (dataPushId) {
            getDetails()
        }
    }, [dataPushId])

    // 获取信息
    const getDetails = async () => {
        try {
            const res = await getDataPushDetail(dataPushId!)
            setDetailsData(res)
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <div className={styles['data-push-info-container']}>
            {isLog ? (
                <SingleMonitorTable dataPushData={detailsData} />
            ) : (
                <DetailsContent detailsData={detailsData} />
            )}
        </div>
    )
}

export default DataPushInfo
