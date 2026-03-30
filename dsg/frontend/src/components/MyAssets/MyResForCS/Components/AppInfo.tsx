import { useEffect, useState } from 'react'
import { CommonTitle } from '@/ui'
import __ from '../locale'
import CommonDetails from './CommonDetails'
import { AppBasicInfoFieldsConfig, AppCallInfoFieldsConfig } from './helper'
import styles from './styles.module.less'
import { getAppsDetail } from '@/core'

interface AppInfoProps {
    appId: string
}
const AppInfo = ({ appId }: AppInfoProps) => {
    const [data, setData] = useState<any>({})

    const getAppDetail = async () => {
        const res = await getAppsDetail(appId, { version: 'published' })
        setData({
            name: res.name,
            org_path: res.province_app_info?.org_info?.department_name,
            info_system: res.info_systems.name,
            description: res.description,
            pass_id: res.pass_id,
            token: res.token,
            ip: res.ip_addr
                ?.map((item: any) => `${item.ip}:${item.port}`)
                .join(','),
        })
    }
    useEffect(() => {
        if (appId) {
            getAppDetail()
        }
    }, [appId])

    return (
        <div className={styles['app-info-container']}>
            <div className={styles['app-info-title']}>
                <CommonTitle title={__('基本信息')} />
            </div>
            <CommonDetails configData={AppBasicInfoFieldsConfig} data={data} />
            <div className={styles['app-info-title']}>
                <CommonTitle title={__('调用信息')} />
            </div>
            <CommonDetails configData={AppCallInfoFieldsConfig} data={data} />
        </div>
    )
}

export default AppInfo
